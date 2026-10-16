-- Re-derive grade / tier / icon from the stored score on every leaderboard row.
-- Before this fix the upsert raised `score` with MAX() but kept the old grade and
-- tier, and some seeded rows carried tiers that never matched their score
-- (e.g. 98.75 labelled "NASA Supercomputer", legacy "High-FPS Addiction").
-- Thresholds mirror getLetterGrade() / getAverageTier() in src/index.ts and
-- get_rank_tier() in the OmaRank engine.

UPDATE global_leaderboard SET
  grade = CASE
    WHEN score >= 95 THEN 'S+'
    WHEN score >= 90 THEN 'S'
    WHEN score >= 85 THEN 'A+'
    WHEN score >= 75 THEN 'A'
    WHEN score >= 65 THEN 'B+'
    WHEN score >= 55 THEN 'B'
    WHEN score >= 40 THEN 'C'
    ELSE 'D'
  END,
  tier_name = CASE
    WHEN score >= 96 THEN 'Cosmic Reality Simulator'
    WHEN score >= 89 THEN 'NASA Supercomputer'
    WHEN score >= 76 THEN 'Cyberpunk Beast'
    WHEN score >= 61 THEN 'Gaming Chair Missing'
    WHEN score >= 46 THEN 'Honest Daily Driver'
    WHEN score >= 31 THEN 'Budget Warrior'
    WHEN score >= 16 THEN 'Study Mode Only'
    ELSE 'Potato Toaster'
  END,
  tier_icon = CASE
    WHEN score >= 96 THEN char(61585)   -- U+F091 trophy
    WHEN score >= 89 THEN char(984261)  -- U+F04C5 speedometer
    WHEN score >= 76 THEN char(61749)   -- U+F135 rocket
    WHEN score >= 61 THEN char(61723)   -- U+F11B gamepad
    WHEN score >= 46 THEN char(61704)   -- U+F108 desktop
    WHEN score >= 31 THEN char(62171)   -- U+F2DB microchip
    WHEN score >= 16 THEN char(61705)   -- U+F109 laptop
    ELSE char(61553)                    -- U+F071 warning
  END;
