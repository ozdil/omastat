/**
 * Single source of truth for OmaScore tiers, grades and weights.
 * Mirrors get_rank_tier() / calculate_score() in the OmaRank engine and is served
 * to the dashboard via GET /api/meta/v1, so nothing else hard-codes these tables.
 */

export interface Tier {
  grade: string;
  min: number;
  name: string;
  icon: string;
  color: string;
}

// Ordered high → low; a score belongs to the first tier whose `min` it reaches.
export const TIERS: readonly Tier[] = [
  { grade: "S+", min: 96, name: "Cosmic Reality Simulator", icon: "\u{F091}", color: "#a855f7" },
  { grade: "S", min: 89, name: "NASA Supercomputer", icon: "\u{F04C5}", color: "#6366f1" },
  { grade: "A", min: 76, name: "Cyberpunk Beast", icon: "\u{F135}", color: "#38bdf8" },
  { grade: "B", min: 61, name: "Gaming Chair Missing", icon: "\u{F11B}", color: "#22c55e" },
  { grade: "C", min: 46, name: "Honest Daily Driver", icon: "\u{F108}", color: "#eab308" },
  { grade: "D", min: 31, name: "Budget Warrior", icon: "\u{F2DB}", color: "#f97316" },
  { grade: "E", min: 16, name: "Study Mode Only", icon: "\u{F109}", color: "#ef4444" },
  { grade: "F", min: 0, name: "Potato Toaster", icon: "\u{F071}", color: "#94a3b8" },
];

// Percent weights of each component in the total OmaScore (sum = 100).
export const WEIGHTS = { cpu: 24, gpu: 32, ram: 16, mobo: 8, display: 15, storage: 5 } as const;

/** Tier for a score (same thresholds as migration 0004's CASE expressions). */
export function tierForScore(score: number): Tier {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}
