-- 1. Score histogram: one row per integer OmaScore, used for real percentiles
--    (GET /api/rank/v1) and the dashboard's score distribution. Submissions made
--    before this migration only exist as totals and cannot be back-filled.
CREATE TABLE IF NOT EXISTS score_histogram (
    score INTEGER PRIMARY KEY CHECK (score BETWEEN 0 AND 100),
    count INTEGER NOT NULL DEFAULT 0
);

-- 2. Monthly install tokens: a hash OmaRank derives from machine-id + month, so a
--    machine is counted once per month. Rows from previous months are deleted on
--    the next submission; tokens cannot be linked across months.
CREATE TABLE IF NOT EXISTS submission_tokens (
    token TEXT PRIMARY KEY,
    month TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_submission_tokens_month ON submission_tokens (month);

-- 3. Brand distribution keyed by (brand, model); the model used to be overwritten
--    by whichever submission came last.
CREATE TABLE brand_distribution_v2 (
    brand TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT '',
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (brand, model)
);
INSERT INTO brand_distribution_v2 (brand, model, count)
    SELECT brand, model, count FROM brand_distribution;
DROP TABLE brand_distribution;
ALTER TABLE brand_distribution_v2 RENAME TO brand_distribution;

-- 4. Seeded showcase systems from 0003 are labelled as demo data. The first real
--    submission with the same archetype replaces the demo row.
ALTER TABLE global_leaderboard ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0;
UPDATE global_leaderboard SET is_demo = 1 WHERE archetype IN (
    'OMA-R9-4090-64G-360H',
    'OMA-U7-4070-32G-240H',
    'OMA-R7-790-32G-240H',
    'OMA-I7-4060-31G-240H',
    'OMA-FW-784-32G-165H',
    'OMA-R5-3060-16G-144H',
    'OMA-XE-16G-60H'
);
