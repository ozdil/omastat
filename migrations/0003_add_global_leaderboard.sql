-- Add Global Battlestation Leaderboard Table
-- Zero-PII Hardware-Centric Ranking Hierarchy

CREATE TABLE IF NOT EXISTS global_leaderboard (
    archetype TEXT PRIMARY KEY,
    score REAL NOT NULL,
    grade TEXT NOT NULL DEFAULT 'A',
    tier_name TEXT NOT NULL,
    tier_icon TEXT NOT NULL,
    system_name TEXT NOT NULL,
    cpu_model TEXT NOT NULL,
    gpu_model TEXT NOT NULL,
    ram_desc TEXT NOT NULL,
    display_desc TEXT NOT NULL,
    submissions_count INTEGER NOT NULL DEFAULT 1,
    last_updated_epoch INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON global_leaderboard (score DESC);

-- Seed Initial Benchmark Systems
INSERT OR IGNORE INTO global_leaderboard (
    archetype, score, grade, tier_name, tier_icon, system_name, cpu_model, gpu_model, ram_desc, display_desc, submissions_count, last_updated_epoch
) VALUES
(
    'OMA-R9-4090-64G-360H',
    98.75,
    'S+',
    'NASA Supercomputer',
    '',
    'Custom DIY Battlestation',
    'AMD Ryzen 9 7950X3D (32 Threads @ 5.7GHz)',
    'NVIDIA GeForce RTX 4090 (24GB VRAM)',
    '64GB DDR5 @ 6000MT/s',
    '3840×2160 @ 144Hz OLED',
    3,
    1789204000
),
(
    'OMA-U7-4070-32G-240H',
    88.45,
    'A+',
    'Cyberpunk Beast',
    '󰓅',
    'Game Garaj Slayer 4 Ultra',
    'Intel Core i7-14700HX (28 Threads @ 5.5GHz)',
    'NVIDIA GeForce RTX 4070 Laptop GPU (140W)',
    '32GB DDR5 @ 5600MT/s',
    '2560×1600 @ 240Hz QHD+',
    2,
    1789204200
),
(
    'OMA-R7-790-32G-240H',
    92.80,
    'S',
    'Cyberpunk Beast',
    '󰓅',
    'ASUS ROG Strix Custom',
    'AMD Ryzen 7 7800X3D (16 Threads @ 5.0GHz)',
    'AMD Radeon RX 7900 XTX (24GB RADV)',
    '32GB DDR5 @ 6000MT/s',
    '2560×1440 @ 240Hz IPS',
    2,
    1789203800
),
(
    'OMA-I7-4060-31G-240H',
    81.30,
    'A',
    'High-FPS Addiction',
    '󰢮',
    'Intel Enthusiast Laptop',
    'Intel Core Ultra 7 155H (22 Threads)',
    'NVIDIA GeForce RTX 4060 Laptop GPU',
    '31GB DDR5 @ 4800MT/s',
    '2560×1600 @ 240Hz',
    2,
    1789203500
),
(
    'OMA-FW-784-32G-165H',
    76.90,
    'A',
    'High-FPS Addiction',
    '󰢮',
    'Framework Modular 16',
    'AMD Ryzen 7 7840HS (16 Threads)',
    'AMD Radeon RX 7700S (8GB)',
    '32GB DDR5 @ 5600MT/s',
    '2560×1600 @ 165Hz',
    1,
    1789203000
),
(
    'OMA-R5-3060-16G-144H',
    68.40,
    'B+',
    'High-FPS Addiction',
    '󰢮',
    'Lenovo Legion 5',
    'AMD Ryzen 5 5600H (12 Threads)',
    'NVIDIA GeForce RTX 3060 Laptop GPU',
    '16GB DDR4 @ 3200MT/s',
    '1920×1080 @ 144Hz',
    4,
    1789202000
),
(
    'OMA-XE-16G-60H',
    48.25,
    'C',
    'Daily Driver',
    '󰌢',
    'Dell XPS 13 Ultrabook',
    'Intel Core i5-1240P (16 Threads)',
    'Intel Iris Xe Graphics (G7 80EU)',
    '16GB LPDDR5 @ 5200MT/s',
    '1920×1200 @ 60Hz',
    3,
    1789201000
);
