from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://marketing:marketing_pass@localhost:5432/marketing"

    # Shopee
    shopee_partner_id: str = ""
    shopee_partner_key: str = ""
    shopee_shop_id: str = ""
    shopee_access_token: str = ""
    shopee_refresh_token: str = ""

    # Lazada
    lazada_app_key: str = ""
    lazada_app_secret: str = ""
    lazada_access_token: str = ""
    lazada_refresh_token: str = ""
    lazada_country: str = "TH"

    # TikTok Shop
    tiktok_app_key: str = ""
    tiktok_app_secret: str = ""
    tiktok_shop_id: str = ""
    tiktok_access_token: str = ""
    tiktok_refresh_token: str = ""

    # Cron schedules
    sync_orders_cron: str = "0 * * * *"
    sync_products_cron: str = "0 */4 * * *"
    sync_ads_cron: str = "30 * * * *"


settings = Settings()
