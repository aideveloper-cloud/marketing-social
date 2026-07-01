"""
Lazada Open Platform connector
Docs: https://open.lazada.com/apps/doc/api
Auth: HMAC-SHA256 signature (appends all sorted params)
"""
import hashlib
import hmac
import time
import httpx
import structlog
from urllib.parse import urlencode
from config import settings

log = structlog.get_logger(__name__)

BASE_URLS = {
    "TH": "https://api.lazada.co.th/rest",
    "SG": "https://api.lazada.sg/rest",
    "MY": "https://api.lazada.com.my/rest",
    "PH": "https://api.lazada.com.ph/rest",
    "VN": "https://api.lazada.vn/rest",
    "ID": "https://api.lazada.co.id/rest",
}


def _sign(path: str, params: dict) -> str:
    sorted_params = "".join(f"{k}{v}" for k, v in sorted(params.items()))
    message = path + sorted_params
    return hmac.new(
        settings.lazada_app_secret.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest().upper()


def _call(path: str, extra_params: dict | None = None) -> dict:
    base = BASE_URLS.get(settings.lazada_country, BASE_URLS["TH"])
    ts = str(int(time.time() * 1000))
    params: dict = {
        "app_key": settings.lazada_app_key,
        "timestamp": ts,
        "sign_method": "sha256",
        "access_token": settings.lazada_access_token,
        **(extra_params or {}),
    }
    params["sign"] = _sign(path, params)
    resp = httpx.get(base + path, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if data.get("code") != "0":
        raise RuntimeError(f"Lazada API error: {data.get('message')} (code={data.get('code')})")
    return data


def fetch_orders(created_after: str, created_before: str, offset: int = 0, limit: int = 100) -> dict:
    return _call("/orders/get", {
        "created_after": created_after,
        "created_before": created_before,
        "offset": offset,
        "limit": limit,
        "sort_by": "created_at",
        "sort_direction": "DESC",
    })


def fetch_order_items(order_id: str) -> dict:
    return _call("/order/items/get", {"order_id": order_id})


def fetch_products(offset: int = 0, limit: int = 100) -> dict:
    return _call("/products/get", {
        "offset": offset,
        "limit": limit,
        "filter": "all",
    })
