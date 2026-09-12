-- Add Brand & OEM Distribution Table for PC Manufacturers
CREATE TABLE IF NOT EXISTS brand_distribution (
    brand TEXT PRIMARY KEY,
    model TEXT NOT NULL DEFAULT '',
    count INTEGER NOT NULL DEFAULT 0
);
