-- ─────────────────────────────────────────────────
-- Marketing Analytics — Database Schema
-- ─────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS ecommerce;

-- Dimension: platforms
CREATE TABLE IF NOT EXISTS ecommerce.platforms (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,  -- shopee | lazada | tiktok
    display_name VARCHAR(100) NOT NULL
);

INSERT INTO ecommerce.platforms (name, display_name) VALUES
    ('shopee', 'Shopee'),
    ('lazada', 'Lazada'),
    ('tiktok', 'TikTok Shop')
ON CONFLICT (name) DO NOTHING;

-- Orders
CREATE TABLE IF NOT EXISTS ecommerce.orders (
    id                  BIGSERIAL PRIMARY KEY,
    platform            VARCHAR(50) NOT NULL,
    platform_order_id   VARCHAR(100) NOT NULL,
    shop_id             VARCHAR(100),
    order_status        VARCHAR(50),
    payment_method      VARCHAR(50),
    currency            VARCHAR(10) DEFAULT 'THB',
    total_amount        NUMERIC(14,2),
    shipping_fee        NUMERIC(14,2),
    discount_amount     NUMERIC(14,2),
    buyer_username      VARCHAR(200),
    created_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ,
    synced_at           TIMESTAMPTZ DEFAULT NOW(),
    raw                 JSONB,
    UNIQUE (platform, platform_order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_platform       ON ecommerce.orders (platform);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON ecommerce.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status         ON ecommerce.orders (order_status);

-- Products
CREATE TABLE IF NOT EXISTS ecommerce.products (
    id                  BIGSERIAL PRIMARY KEY,
    platform            VARCHAR(50) NOT NULL,
    platform_product_id VARCHAR(100) NOT NULL,
    shop_id             VARCHAR(100),
    name                TEXT,
    category            VARCHAR(200),
    status              VARCHAR(50),
    price               NUMERIC(14,2),
    stock               INTEGER,
    sold_count          INTEGER DEFAULT 0,
    rating              NUMERIC(3,2),
    image_url           TEXT,
    created_at          TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ,
    synced_at           TIMESTAMPTZ DEFAULT NOW(),
    raw                 JSONB,
    UNIQUE (platform, platform_product_id)
);

CREATE INDEX IF NOT EXISTS idx_products_platform ON ecommerce.products (platform);
CREATE INDEX IF NOT EXISTS idx_products_status   ON ecommerce.products (status);

-- Order items
CREATE TABLE IF NOT EXISTS ecommerce.order_items (
    id                  BIGSERIAL PRIMARY KEY,
    platform            VARCHAR(50) NOT NULL,
    platform_order_id   VARCHAR(100) NOT NULL,
    platform_item_id    VARCHAR(100),
    product_name        TEXT,
    sku                 VARCHAR(200),
    quantity            INTEGER,
    unit_price          NUMERIC(14,2),
    subtotal            NUMERIC(14,2),
    synced_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON ecommerce.order_items (platform, platform_order_id);

-- Ads spend
CREATE TABLE IF NOT EXISTS ecommerce.ads_spend (
    id                  BIGSERIAL PRIMARY KEY,
    platform            VARCHAR(50) NOT NULL,
    campaign_id         VARCHAR(100),
    campaign_name       TEXT,
    ad_type             VARCHAR(50),
    date                DATE NOT NULL,
    impressions         BIGINT DEFAULT 0,
    clicks              BIGINT DEFAULT 0,
    spend               NUMERIC(14,2) DEFAULT 0,
    revenue             NUMERIC(14,2) DEFAULT 0,
    orders_count        INTEGER DEFAULT 0,
    synced_at           TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (platform, campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ads_platform ON ecommerce.ads_spend (platform);
CREATE INDEX IF NOT EXISTS idx_ads_date     ON ecommerce.ads_spend (date DESC);

-- Daily summary (pre-aggregated for Metabase performance)
CREATE TABLE IF NOT EXISTS ecommerce.daily_summary (
    id              BIGSERIAL PRIMARY KEY,
    date            DATE NOT NULL,
    platform        VARCHAR(50) NOT NULL,
    total_orders    INTEGER DEFAULT 0,
    total_revenue   NUMERIC(14,2) DEFAULT 0,
    total_items     INTEGER DEFAULT 0,
    total_ads_spend NUMERIC(14,2) DEFAULT 0,
    new_customers   INTEGER DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (date, platform)
);

CREATE INDEX IF NOT EXISTS idx_daily_date     ON ecommerce.daily_summary (date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_platform ON ecommerce.daily_summary (platform);

-- Sync log
CREATE TABLE IF NOT EXISTS ecommerce.sync_log (
    id          BIGSERIAL PRIMARY KEY,
    platform    VARCHAR(50) NOT NULL,
    sync_type   VARCHAR(50) NOT NULL,  -- orders | products | ads
    status      VARCHAR(20) NOT NULL,  -- success | error
    records     INTEGER DEFAULT 0,
    error_msg   TEXT,
    started_at  TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);
