/**
 * Label normalization for the public distribution charts.
 *
 * Engines report usable memory (MemTotal), which is a little below the installed size
 * (31 GB on a 32 GB machine), and display strings arrive in several spellings
 * ("2560x1440@240Hz", "2560×1440 @ 240Hz"). Both are normalized on ingest, and rows
 * already stored under an old spelling are merged when the stats are read.
 */

const MARKETED_RAM_GB = [1, 2, 3, 4, 6, 8, 12, 16, 18, 24, 32, 36, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072, 4096];

/** Installed (marketed) size for a reported usable size, when it is within 10% below one. */
export function marketedRamGb(gb: number): number {
  if (!Number.isFinite(gb) || gb <= 0) return 0;
  const size = MARKETED_RAM_GB.find((s) => s >= gb);
  if (size !== undefined && (size - gb) / size <= 0.1) return size;
  return Math.round(gb);
}

/** "31GB DDR5" -> "32GB DDR5"; anything not starting with a GB figure is returned unchanged. */
export function normalizeRamBucket(bucket: string): string {
  const m = /^\s*(\d+(?:\.\d+)?)\s*GB\b\s*(.*)$/i.exec(bucket || "");
  if (!m) return bucket;
  const rest = m[2].trim();
  return `${marketedRamGb(Number(m[1]))}GB${rest ? " " + rest : ""}`;
}

/** "2560x1440@240Hz" / "2560 × 1440 @ 240 hz" -> "2560×1440 @ 240Hz". */
export function normalizeDisplay(display: string): string {
  const m = /^\s*(\d{3,5})\s*[x×]\s*(\d{3,5})\s*@\s*(\d{2,3}(?:\.\d+)?)\s*hz\s*$/i.exec(display || "");
  if (!m) return (display || "").replace(/x/g, "×");
  return `${m[1]}×${m[2]} @ ${Math.round(Number(m[3]))}Hz`;
}

/** Re-keys rows with `normalize`, sums the counts of rows that collide, sorts by count. */
export function mergeRows<K extends string>(
  rows: ({ count: number } & Record<K, string>)[],
  key: K,
  normalize: (v: string) => string
): ({ count: number } & Record<K, string>)[] {
  const merged = new Map<string, number>();
  for (const r of rows || []) {
    const k = normalize(String(r[key] ?? ""));
    merged.set(k, (merged.get(k) || 0) + (Number(r.count) || 0));
  }
  return [...merged.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k, count]) => ({ [key]: k, count }) as { count: number } & Record<K, string>);
}
