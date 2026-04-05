-- ==============================================
-- PIE Database Performance Indexes
-- Run after initial migrations
-- ==============================================

-- Products: Fast lookup by org + category
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org_category ON products(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Competitors: Fast lookup by org
CREATE INDEX IF NOT EXISTS idx_competitors_org ON competitors(organization_id);
CREATE INDEX IF NOT EXISTS idx_competitors_org_active ON competitors(organization_id, is_active);

-- Price Records: Time series queries
CREATE INDEX IF NOT EXISTS idx_price_records_product ON price_records(product_id);
CREATE INDEX IF NOT EXISTS idx_price_records_competitor ON price_records(competitor_id);
CREATE INDEX IF NOT EXISTS idx_price_records_scraped ON price_records(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_records_product_scraped ON price_records(product_id, scraped_at DESC);

-- Price Recommendations: Fast filter by status
CREATE INDEX IF NOT EXISTS idx_recommendations_product ON price_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON price_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_created ON price_recommendations(created_at DESC);

-- Alerts: Fast filter by org + status
CREATE INDEX IF NOT EXISTS idx_alerts_org ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_org_read ON alerts(organization_id, is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- Scraping Jobs: Fast lookup
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_org ON scraping_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_competitor ON scraping_jobs(competitor_id);

-- Organizations
CREATE INDEX IF NOT EXISTS idx_org_name ON organizations(name);
