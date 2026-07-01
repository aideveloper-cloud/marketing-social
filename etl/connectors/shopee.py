"""
Shopee Open Platform connector
Docs: https://open.shopee.com/documents
Auth: HMAC-SHA256 signature per request
"""
import hashlib
import hmac
import time
import httpx
import structlog
from config import settings

log = structlog.get_logger(__name__)

BASE_URL = "https://partner.shopeemobile.com/api/v2"


def _sign(path: str, timestamp: int) -> str:
    base = f"{settings.shopee_partner_id}{path}{timestamp}{settings.shopee_access_token}{settings.shopee_shop_id}"
    return hmac.new(settings.shopee_partner_key.encode(), base.encode(), hashlib.sha256).hexdigest()


def _params(path: str) -> dict:
    ts = int(time.time())
    return {
        "partner_id": int(settings.shopee_partner_id),
        "timestamp": ts,
        "access_token": settings.shopee_access_token,
        "shop_id": int(settings.shopee_shop_id),
        "sign": _sign(path, ts),
    }


def fetch_orders(time_from: int, time_to: int, cursor: str = "") -> dict:
    path = "/order/get_order_list"
    params = _params(path) | {
        "time_range_field": "create_time",
        "time_from": time_from,
        "time_to": time_to,
        "page_size": 100,
        "cursor": cursor,
        "order_status": "ALL",
        "response_optional_fields": "order_status,buyer_username,total_amount",
    }
    resp = httpx.get(BASE_URL + path, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_order_detail(order_sn_list: list[str]) -> dict:
    path = "/order/get_order_detail"
    params = _params(path) | {
        "order_sn_list": ",".join(order_sn_list),
        "response_optional_fields": "buyer_username,pay_time,item_list,package_list",
    }
    resp = httpx.get(BASE_URL + path, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_products(offset: int = 0, page_size: int = 100) -> dict:
    path = "/product/get_item_list"
    params = _params(path) | {
        "offset": offset,
        "page_size": page_size,
        "item_status": ["NORMAL", "UNLIST"],
    }
    resp = httpx.get(BASE_URL + path, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()
