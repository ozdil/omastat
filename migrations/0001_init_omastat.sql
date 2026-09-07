-- OmaStat D1 Schema: Aggregate Community Hardware Metrics
-- Complies strictly with Omarchy Zero-PII Privacy Guidelines

CREATE TABLE IF NOT EXISTS stats_meta (
    key TEXT PRIMARY KEY,
    value REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS cpu_distribution (
    model TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gpu_distribution (
    model TEXT PRIMARY KEY,
    driver TEXT NOT NULL DEFAULT '',
    count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ram_distribution (
    bucket TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS display_distribution (
    resolution_hz TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tier_distribution (
    tier_name TEXT PRIMARY KEY,
    tier_icon TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS archetype_distribution (
    archetype TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
);

-- Seed initial meta values if empty
INSERT OR IGNORE INTO stats_meta (key, value) VALUES ('total_submissions', 0);
INSERT OR IGNORE INTO stats_meta (key, value) VALUES ('sum_scores', 0);
INSERT OR IGNORE INTO stats_meta (key, value) VALUES ('last_updated_epoch', 0);
