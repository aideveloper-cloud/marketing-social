"""
TikTok Shop API connector
Docs: https://partner.tiktokshop.com/docv2/page/649a4b3b4a0bb702c0347cc2
Auth: HMAC-SHA256 signature
"""
import hashlib
import hmac
import time
import httpx
import structlog
from config import settings

log = structlog.get_logger(__name__)

BASE_URL = "https://open-api.tiktokglobalshop.com"


def _sign(path: str, params: dict, body: str = "") -> str:
    # TikTok signature: secret + path + sorted_query + body + secret
    query = "".join(f"{k}{v}" for k, v in sorted(params.items()) if k != "sign")
    message = f"{settings.tiktok_app_secret}{path}{query}{body}{settings.tiktok_app_secret}"
    return hmac.new(settings.tiktok_app_secret.encode(), message.encode(), hashlib.sha256).hexdigest()


def _headers() -> dict:
    return {
        "Content-Type": "application/json",
        "x-tts-access-token": settings.tiktok_access_token,
    }


def _base_params() -> dict:
    return {
        "app_key": settings.tiktok_app_key,
        "shop_id": settings.tiktok_shop_id,
        "timestamp": str(int(time.time())),
        "version": "202309",
    }


def fetch_orders(
    create_time_from: int,
    create_time_to: int,
    cursor: str = "",
    page_size: int = 100,
) -> dict:
    path = "/api/orders/search"
    params = _base_params()
    body_dict = {
        "create_time_from": create_time_from,
        "create_time_to": create_time_to,
        "page_size": page_size,
        "cursor": cursor,
        "sort_field": "CREATE_TIME",
        "sort_type": "DESC",
    }
    import json
    body = json.dumps(body_dict)
    params["sign"] = _sign(path, params, body)
    resp = httpx.post(BASE_URL + path, params=params, content=body, headers=_headers(), timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != 0:
        raise RuntimeError(f"TikTok API error: {data.get('message')} (code={data.get('code')})")
    return data


def fetch_products(cursor: str = "", page_size: int = 100) -> dict:
    path = "/api/products/search"
    params = _base_params()
    import json
    body = json.dumps({"page_size": page_size, "cursor": cursor})
    params["sign"] = _sign(path, params, body)
    resp = httpx.post(BASE_URL + path, params=params, content=body, headers=_headers(), timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != 0:
        raise RuntimeError(f"TikTok API error: {data.get('message')}")
    return data


def fetch_ads_report(
    start_date: str,
    end_date: str,
    page: int = 1,
    page_size: int = 100,
) -> dict:
    """TikTok for Business Ads API — requires separate TikTok Ads access token"""
    path = "/open_api/v1.3/report/integrated/get/"
    # NOTE: TikTok Ads API uses a different base URL and auth
    ads_base = "https://business-api.tiktok.com"
    params = {
        "advertiser_id": settings.tiktok_shop_id,
        "report_type": "BASIC",
        "data_level": "AUCTION_CAMPAIGN",
        "dimensions": '["campaign_id","stat_time_day"]',
        "metrics": '["spend","impressions","clicks","purchase_roas","total_purchase_value"]',
        "start_date": start_date,
        "end_date": end_date,
        "page": page,
        "page_size": page_size,
    }
    headers = {"Access-Token": settings.tiktok_access_token, "Content-Type": "application/json"}
    resp = httpx.get(ads_base + path, params=params, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()
