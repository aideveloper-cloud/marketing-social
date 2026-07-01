"""
Auto-setup Metabase for development:
  1. Wait for Metabase to be ready
  2. Call /api/setup to create admin + connect PostgreSQL
  3. Print login credentials

Run once after `docker-compose up -d`:
    docker-compose exec etl python setup_metabase.py
  or:
    python etl/setup_metabase.py
"""
import time
import httpx
import os

METABASE_URL = os.getenv("METABASE_URL", "http://metabase:3000")
ADMIN_EMAIL  = os.getenv("MB_ADMIN_EMAIL",    "admin@marketing.local")
ADMIN_PASS   = os.getenv("MB_ADMIN_PASSWORD", "marketing1234!")
DB_HOST      = os.getenv("MB_DB_HOST",   "postgres")
DB_PORT      = int(os.getenv("MB_DB_PORT", "5432"))
DB_NAME      = os.getenv("POSTGRES_DB",   "marketing")
DB_USER      = os.getenv("POSTGRES_USER", "marketing")
DB_PASS      = os.getenv("POSTGRES_PASSWORD", "marketing_pass")


def wait_for_metabase(timeout: int = 180):
    print(f"⏳ Waiting for Metabase at {METABASE_URL} ...")
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = httpx.get(f"{METABASE_URL}/api/health", timeout=5)
            if r.json().get("status") == "ok":
                print("✅ Metabase is ready")
                return
        except Exception:
            pass
        time.sleep(5)
    raise TimeoutError("Metabase did not start in time")


def get_setup_token() -> str:
    r = httpx.get(f"{METABASE_URL}/api/session/properties", timeout=10)
    r.raise_for_status()
    token = r.json().get("setup-token")
    if not token:
        raise RuntimeError("setup-token not found — Metabase may already be set up")
    return token


def setup(token: str):
    payload = {
        "token": token,
        "user": {
            "email":      ADMIN_EMAIL,
            "password":   ADMIN_PASS,
            "first_name": "Marketing",
            "last_name":  "Admin",
            "site_name":  "Marketing Analytics",
        },
        "database": {
            "engine": "postgres",
            "name":   "Marketing DB",
            "details": {
                "host":   DB_HOST,
                "port":   DB_PORT,
                "dbname": DB_NAME,
                "user":   DB_USER,
                "password": DB_PASS,
                "schema-filters-type": "inclusion",
                "schema-filters-patterns": "ecommerce",
            },
        },
        "prefs": {
            "site_name":     "Marketing Analytics",
            "site_locale":   "th",
            "allow_tracking": False,
        },
    }
    r = httpx.post(f"{METABASE_URL}/api/setup", json=payload, timeout=30)
    if r.status_code == 400 and "already" in r.text.lower():
        print("ℹ️  Metabase already set up — skipping")
        return
    r.raise_for_status()
    print("✅ Metabase setup complete")


def print_credentials():
    print("\n" + "─" * 50)
    print("🚀  Metabase is ready for development")
    print(f"    URL   : {METABASE_URL.replace('metabase', 'localhost')}")
    print(f"    Email : {ADMIN_EMAIL}")
    print(f"    Pass  : {ADMIN_PASS}")
    print("─" * 50 + "\n")


if __name__ == "__main__":
    wait_for_metabase()
    try:
        token = get_setup_token()
        setup(token)
    except RuntimeError as e:
        print(f"ℹ️  {e}")
    print_credentials()
