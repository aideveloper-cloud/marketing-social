"""
Sync orders from all platforms into ecommerce.orders
"""
import time
import pendulum
import structlog
from sqlalchemy import text
from models.base import SessionLocal
from connectors import shopee, lazada, tiktok
from config import settings

log = structlog.get_logger(__name__)


def _log_sync(db, platform: str, sync_type: str, status: str, records: int, error: str | None = None):
    db.execute(
        text("""
            INSERT INTO ecommerce.sync_log (platform, sync_type, status, records, error_msg, finished_at)
            VALUES (:platform, :sync_type, :status, :records, :error_msg, NOW())
        """),
        {"platform": platform, "sync_type": sync_type, "status": status, "records": records, "error_msg": error},
    )
    db.commit()


def sync_shopee_orders(hours_back: int = 2):
    if not settings.shopee_partner_id:
        log.warning("shopee.skip", reason="credentials not set")
        return

    db = SessionLocal()
    try:
        now = int(time.time())
        time_from = now - (hours_back * 3600)
        cursor = ""
        total = 0

        while True:
            data = shopee.fetch_orders(time_from, now, cursor)
            order_list = data.get("response", {}).get("order_list", [])
            if not order_list:
                break

            # Fetch details in batches of 50
            sn_list = [o["order_sn"] for o in order_list]
            for i in range(0, len(sn_list), 50):
                detail_data = shopee.fetch_order_detail(sn_list[i:i+50])
                for order in detail_data.get("response", {}).get("order_list", []):
                    db.execute(
                        text("""
                            INSERT INTO ecommerce.orders
                                (platform, platform_order_id, shop_id, order_status, payment_method,
                                 currency, total_amount, shipping_fee, discount_amount, buyer_username,
                                 created_at, updated_at, raw)
                            VALUES
                                ('shopee', :oid, :shop, :status, :pay_method,
                                 'THB', :total, :shipping, :discount, :buyer,
                                 TO_TIMESTAMP(:create_ts), NOW(), :raw::jsonb)
                            ON CONFLICT (platform, platform_order_id) DO UPDATE SET
                                order_status = EXCLUDED.order_status,
                                updated_at   = NOW(),
                                raw          = EXCLUDED.raw
                        """),
                        {
                            "oid":       order.get("order_sn"),
                            "shop":      str(settings.shopee_shop_id),
                            "status":    order.get("order_status"),
                            "pay_method": order.get("payment_method"),
                            "total":     order.get("total_amount"),
                            "shipping":  order.get("actual_shipping_fee", 0),
                            "discount":  order.get("seller_discount", 0),
                            "buyer":     order.get("buyer_username"),
                            "create_ts": order.get("create_time"),
                            "raw":       str(order),
                        },
                    )
                    total += 1

            db.commit()
            next_cursor = data.get("response", {}).get("next_cursor", "")
            if not data.get("response", {}).get("more", False) or not next_cursor:
                break
            cursor = next_cursor

        _log_sync(db, "shopee", "orders", "success", total)
        log.info("shopee.orders.done", total=total)

    except Exception as e:
        log.error("shopee.orders.error", error=str(e))
        _log_sync(db, "shopee", "orders", "error", 0, str(e))
    finally:
        db.close()


def sync_lazada_orders(hours_back: int = 2):
    if not settings.lazada_app_key:
        log.warning("lazada.skip", reason="credentials not set")
        return

    db = SessionLocal()
    try:
        now = pendulum.now("Asia/Bangkok")
        created_before = now.to_iso8601_string()
        created_after = now.subtract(hours=hours_back).to_iso8601_string()
        offset = 0
        total = 0

        while True:
            data = lazada.fetch_orders(created_after, created_before, offset)
            orders = data.get("data", {}).get("orders", [])
            if not orders:
                break

            for order in orders:
                db.execute(
                    text("""
                        INSERT INTO ecommerce.orders
                            (platform, platform_order_id, order_status, payment_method,
                             currency, total_amount, shipping_fee, created_at, updated_at, raw)
                        VALUES
                            ('lazada', :oid, :status, :pay_method,
                             'THB', :total, :shipping,
                             :created::timestamptz, NOW(), :raw::jsonb)
                        ON CONFLICT (platform, platform_order_id) DO UPDATE SET
                            order_status = EXCLUDED.order_status,
                            updated_at   = NOW(),
                            raw          = EXCLUDED.raw
                    """),
                    {
                        "oid":       str(order.get("order_id")),
                        "status":    order.get("statuses", [""])[0] if order.get("statuses") else "",
                        "pay_method": order.get("payment_method"),
                        "total":     order.get("price"),
                        "shipping":  order.get("shipping_fee_original", 0),
                        "created":   order.get("created_at"),
                        "raw":       str(order),
                    },
                )
                total += 1

            db.commit()
            if len(orders) < 100:
                break
            offset += 100

        _log_sync(db, "lazada", "orders", "success", total)
        log.info("lazada.orders.done", total=total)

    except Exception as e:
        log.error("lazada.orders.error", error=str(e))
        _log_sync(db, "lazada", "orders", "error", 0, str(e))
    finally:
        db.close()


def sync_tiktok_orders(hours_back: int = 2):
    if not settings.tiktok_app_key:
        log.warning("tiktok.skip", reason="credentials not set")
        return

    db = SessionLocal()
    try:
        now = int(time.time())
        time_from = now - (hours_back * 3600)
        cursor = ""
        total = 0

        while True:
            data = tiktok.fetch_orders(time_from, now, cursor)
            orders = data.get("data", {}).get("order_list", [])
            if not orders:
                break

            for order in orders:
                db.execute(
                    text("""
                        INSERT INTO ecommerce.orders
                            (platform, platform_order_id, order_status, payment_method,
                             currency, total_amount, created_at, updated_at, raw)
                        VALUES
                            ('tiktok', :oid, :status, :pay_method,
                             'THB', :total,
                             TO_TIMESTAMP(:create_ts), NOW(), :raw::jsonb)
                        ON CONFLICT (platform, platform_order_id) DO UPDATE SET
                            order_status = EXCLUDED.order_status,
                            updated_at   = NOW(),
                            raw          = EXCLUDED.raw
                    """),
                    {
                        "oid":       order.get("id"),
                        "status":    order.get("status"),
                        "pay_method": order.get("payment_info", {}).get("payment_method_name"),
                        "total":     order.get("payment_info", {}).get("total_amount"),
                        "create_ts": order.get("create_time"),
                        "raw":       str(order),
                    },
                )
                total += 1

            db.commit()
            next_cursor = data.get("data", {}).get("next_cursor", "")
            if not data.get("data", {}).get("more", False) or not next_cursor:
                break
            cursor = next_cursor

        _log_sync(db, "tiktok", "orders", "success", total)
        log.info("tiktok.orders.done", total=total)

    except Exception as e:
        log.error("tiktok.orders.error", error=str(e))
        _log_sync(db, "tiktok", "orders", "error", 0, str(e))
    finally:
        db.close()


def run():
    log.info("sync.orders.start")
    sync_shopee_orders()
    sync_lazada_orders()
    sync_tiktok_orders()
    log.info("sync.orders.complete")
