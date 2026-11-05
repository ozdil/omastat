# Changelog

All notable changes to OmaStat are listed here.

## 1.1.0 (unreleased)

Before deploying, apply migrations 0004 and 0005: `npm run db:migrate:prod`.

### Fixed

- **Leaderboard rows went stale.** A higher score raised `score` but kept the old grade, tier, icon, system name and hardware text. Every column now follows the best score, and a lower score never downgrades a row. Migration 0004 re-derives grade, tier and icon for existing rows.
- **Invalid scores were stored as 0.** `null`, `""`, `"50"` or `true` passed validation through `Number()`. `omarank_score` must now be a JSON number from 0 to 100.
- **Grades disagreed between OmaRank and OmaStat.** The server used its own A+/B+ letter scale with different thresholds. Both now use the tier letters (S+ S A B C D E F) from one table (`src/tiers.ts`), served at `/api/meta/v1`.
- **The client chose its own tier.** The tier and grade are now derived from the score on the server; `tier_name` in the payload is ignored.
- **Back-dated submissions moved `last_updated` backwards.** It now only moves forward.
- **Archetype lookup crashed on malformed percent-encoding** (500 instead of 400), matched garbage input to the `OMA-CUSTOM-RIG` bucket, and returned `percentage` as a string. All three are fixed.
- **Brand detection false positives.** "PHOENIX TECHNOLOGIES" was counted as HP; HP and MSI now need a whole-word match. Laptops use the DMI `product_name` for the model.
- **Brand counts merged different models.** `brand_distribution` was keyed by brand only, so every Lenovo model shared one counter. It is now keyed by `(brand, model)` (migration 0005).
- **Seed rows looked real.** The sample leaderboard rows from migration 0003 are flagged `is_demo` (shown with a DEMO badge) and are replaced by the first real submission for that archetype. Nothing is deleted.
- **Dashboard showed invented numbers** when data was missing (a hard-coded leaderboard, "50%" chart fallbacks, made-up tier percentages, "top 5% rarest" when the lookup failed, "142 battlestations" in the ticker). Missing data now shows an empty state.
- **"My rig" highlighted unrelated rows** by substring match on CPU/GPU text. It now needs the exact archetype.
- **Roast patterns matched inside other tokens** (e.g. `4G` inside `64G`); they now match whole archetype segments.
- **Dashboard crashed when `localStorage` was blocked** (private mode, strict cookies).
- **Leaderboard filters were missing grades B, C, D, E and F**, and the grade badge had no style for E and F.

### Added

- `GET /api/leaderboard/v1`: server-side paging (`limit`, `offset`), grade filter and search (`q`, with `%` and `_` matched literally). The dashboard uses it with a "Load more" button and a debounced search.
- `GET /api/rank/v1?score=N`: real rank and percentile among all counted submissions, used by OmaRank instead of its local estimate.
- `GET /api/meta/v1`: tier table, score weights and version.
- `score_histogram` in `/api/stats/v1` and an OmaScore distribution chart on the dashboard. It only covers submissions made after migration 0005.
- **One count per machine per month.** OmaRank 1.4 sends `install_token`, a monthly-rotating hash that cannot be reversed to a machine id. Repeats get `counted: false`; tokens from earlier months are deleted.
- **Plausibility check.** A score above what the reported hardware can reach (plus 5 points) is counted in the aggregates but kept off the leaderboard (`leaderboard: false` in the response).
- **Rate limiting.** 5 survey submissions per minute per client through the Workers Rate Limiting binding (`429` with `Retry-After: 60`). The IP is only the limiter's key and is never stored.
- Edge caching of `/api/stats/v1` and `/api/leaderboard/v1` through the Cache API.
- Simulator now has motherboard and storage inputs and uses the real weights and tiers from `/api/meta/v1`.
- Accessibility: `aria-pressed` on filters, labels on icon-only buttons and simulator selects, decorative icons hidden from screen readers, `aria-live` leaderboard, Escape closes modals.
- New dashboard text in all six languages (TR, EN, DE, ES, FR, JA).
- CI workflow: tests, type check and `wrangler deploy --dry-run` on every push and pull request.

### Changed

- The dashboard's CSS and JS moved out of the HTML into `public/assets/` (Workers static assets), so the CSP no longer needs `'unsafe-inline'` for scripts.
- The Nerd Font is pinned to `v3.4.0` instead of `@master`.
- Wrangler 4, TypeScript 5, latest `@cloudflare/workers-types`, compatibility date 2025-09-01.
- Tests run the real Worker (`src/index.ts`) against an in-memory D1 (`node:sqlite`): 31 tests. The old `test/test-api.mjs`, which tested a copy of the logic, was removed.
- `npm run serve:local` serves the dashboard and API locally without a Cloudflare account.
