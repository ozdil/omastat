# OmaStat

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support_Development-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/ozdil)

**Privacy-Preserving Community Hardware Survey & Statistics Engine for Omarchy Linux**

OmaStat is the open-source community hardware survey aggregator for Omarchy (`omastat.omarchy.org`). Inspired by the Steam Hardware Survey, it collects privacy-safe, anonymous telemetry from the [OmaRank](https://github.com/ozdil/omarchy-omarank) hardware benchmark widget to provide live, transparent hardware market share statistics across the Omarchy ecosystem.

- **Live Demo Dashboard:** [https://omastat.ozan-zdil.workers.dev/dashboard](https://omastat.ozan-zdil.workers.dev/dashboard)  
- **Live Survey API:** `https://omastat.ozan-zdil.workers.dev/api/survey/v1`

---

## Architecture & Technology Stack

Built to match the exact infrastructure patterns of the official Omarchy Plugin Marketplace (`omacom/omarchy-plugin-marketplace`):

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) (Edge TypeScript)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (Serverless SQLite)
- **Frontend Dashboard**: Native Omarchy-themed responsive UI (`/dashboard`); its CSS and JS are served as [Workers static assets](https://developers.cloudflare.com/workers/static-assets/) from `public/`, so the page runs under a strict `script-src 'self'` CSP
- **Tooling**: Wrangler 4, TypeScript 5, Node 22 test suite (`npm test`)
- **Hosting Cost**: **$0.00 / month** (Runs entirely within Cloudflare's free tier)

---

## Privacy & Trust Boundary (Zero-PII by Design)

Adheres strictly to the **Omarchy Developer Guide (ODG)** and **Omarchy Security Baseline**:

1. **Zero Personal Identifiers**: No usernames, hostnames, email addresses, or accounts.
2. **Zero Network / Device Tracking**: No IP address logging, no MAC addresses, and no persistent device fingerprinting.
3. **Hardware Archetypes**: Machines report anonymous build signatures (e.g. `OMA-U7-ARC-31G-240H`) rather than individual machine tracking IDs.
4. **Pure Aggregate Counters**: D1 stores only aggregate histogram tables (e.g. GPU models, core counts, RAM capacity tiers). Individual raw submission events are not retained.
5. **Edge Rate Limiting & Size Guards**: Survey submissions are limited to 5 per minute per client by the Workers Rate Limiting binding (`SURVEY_LIMITER`; the client IP is only the limiter's counter key and is never stored), and payloads are capped at 16 KiB.
6. **One Count per Machine per Month**: OmaRank sends `install_token`, a 32-hex-char hash of `omarank-survey-v1:<machine-id>:<YYYY-MM>`. It changes every month, cannot be reversed to the machine id, and OmaStat only keeps the current month's tokens (older ones are deleted on the next submission). A repeated token is answered with `counted: false` and changes nothing.
7. **Server-Side Grading**: The tier and grade are derived from the score on the server; the client's `tier_name` is ignored. A score the described hardware cannot reach is still counted in the aggregates but kept off the public leaderboard.

---

## API Specification

### `POST /api/survey/v1`
Ingests an anonymous hardware profile submitted via OmaRank.

**Payload Schema:**
```json
{
  "schema_version": 2,
  "timestamp_epoch": 1788794239,
  "omarank_score": 62,
  "tier_name": "Gaming Chair Missing",
  "cpu_model": "Intel Ultra 7 155H",
  "cpu_cores": 16,
  "cpu_threads": 22,
  "gpu_model": "Intel Arc Graphics",
  "gpu_driver": "i915",
  "ram_gb": 31.1,
  "ram_type": "DDR4",
  "ram_speed_mts": 3200,
  "mobo_vendor": "GAME GARAJ",
  "mobo_name": "SLAYER 4 ULTRA",
  "system_vendor": "GAME GARAJ",
  "product_name": "SLAYER 4 ULTRA",
  "chipset": "Mainstream Chipset",
  "primary_display": "2560x1600 @ 240Hz",
  "display_count": 1,
  "storage_type": "NVMe PCIe Gen4/5 SSD",
  "storage_model": "Samsung SSD 990 PRO 4TB",
  "os_name": "Omarchy",
  "archetype_signature": "OMA-U7-ARC-31G-240H",
  "install_token": "22d72b1583f8790f248c0fa8e6f23506"
}
```

`install_token` is optional (older OmaRank versions send none and are not de-duplicated). `system_vendor` and `product_name` are optional (DMI `sys_vendor` / `product_name`); they improve OEM and laptop model detection. `omarank_score` must be a JSON number between 0 and 100.

**Response:**
```json
{
  "success": true,
  "counted": true,
  "leaderboard": true,
  "message": "Successfully submitted anonymous hardware profile to OmaStat survey!",
  "score": 62,
  "grade": "B",
  "tier": "Gaming Chair Missing"
}
```

`counted: false` means this machine was already counted this month. `leaderboard: false` means the score is above what the reported hardware can reach (plus a 5 point tolerance), so it only feeds the aggregates. Errors: `400` invalid payload, `413` too large, `429` rate limited (`Retry-After: 60`).

#### Grades

Every score maps to one tier; the letter is the grade. The same table is served by `GET /api/meta/v1` and used by OmaRank.

| Grade | Score | Tier |
|---|---|---|
| S+ | 96-100 | Cosmic Reality Simulator |
| S | 89-95 | NASA Supercomputer |
| A | 76-88 | Cyberpunk Beast |
| B | 61-75 | Gaming Chair Missing |
| C | 46-60 | Honest Daily Driver |
| D | 31-45 | Budget Warrior |
| E | 16-30 | Study Mode Only |
| F | 0-15 | Potato Toaster |

Score weights: GPU 32, CPU 24, RAM 16, display 15, motherboard 8, storage 5.

---

### `GET /api/stats/v1`
Returns global community hardware aggregates. Cached at Cloudflare edge for 5 minutes (`max-age=300, stale-while-revalidate=60`).

```json
{
  "total_submissions": 12480,
  "average_score": 67,
  "average_grade": "B",
  "average_tier": "\uf11b Gaming Chair Missing",
  "top_gpus": [
    { "model": "Intel Arc Graphics", "driver": "i915", "count": 3420, "percentage": 27.4 },
    { "model": "NVIDIA GeForce RTX 4080", "driver": "nvidia", "count": 2810, "percentage": 22.5 }
  ],
  "top_cpus": [ ... ],
  "ram_breakdown": [ ... ],
  "display_breakdown": [ ... ],
  "tier_distribution": [ ... ],
  "top_brands": [ ... ],
  "score_histogram": [ { "score": 62, "count": 140 }, ... ],
  "leaderboard": [ ... ]
}
```

`average_grade` and `average_tier` are `null` while there are no submissions. `score_histogram` counts submissions per whole score and only covers submissions made after migration 0005.

---

### `GET /api/leaderboard/v1`
Paged, filterable leaderboard (cached 60 s).

| Parameter | Default | Notes |
|---|---|---|
| `limit` | 50 | 1-100 |
| `offset` | 0 | |
| `grade` | (all) | One of `S+ S A B C D E F`; anything else is ignored |
| `q` | (none) | Case-insensitive search in system, CPU, GPU, RAM and archetype; `%` and `_` match literally |

```json
{
  "total": 132,
  "offset": 0,
  "limit": 50,
  "items": [
    { "archetype": "OMA-R9-4090-64G-360H", "score": 98.75, "grade": "S+", "tier_name": "Cosmic Reality Simulator", "system_name": "...", "submissions_count": 5, "is_demo": 0 }
  ]
}
```

`is_demo: 1` marks the sample rows seeded by migration 0003. The first real submission for that archetype replaces the sample.

---

### `GET /api/rank/v1?score=N`
Where a score stands among all counted submissions:
```json
{ "score": 62, "rank": 412, "total": 1290, "percentile": 31.9 }
```
`rank` is 1 + the number of submissions with a higher score; `percentile` is the "top X%" figure. Both are `null` while `total` is 0.

---

### `GET /api/meta/v1`
The tier table and score weights above, plus the server version. The dashboard and its simulator read these instead of hard-coding them.

---

### `GET /api/archetype/:code`
Looks up how common a specific hardware combination is globally:
```json
{
  "found": true,
  "archetype": "OMA-U7-ARC-31G-240H",
  "count": 412,
  "percentage": 3.3
}
```

---

## 1-Click Deployment for Omarchy Maintainers

```bash
# 1. Clone repository
git clone https://github.com/ozdil/omastat.git
cd omastat

# 2. Install dependencies
npm install

# 3. Create Cloudflare D1 database
npx wrangler d1 create omastat-db

# 4. Apply database migrations (0001-0005)
npx wrangler d1 migrations apply omastat-db --remote

# 5. Deploy Worker to omastat.omarchy.org
npx wrangler deploy
```

## Development

```bash
npm test            # runs the real Worker against an in-memory D1 (node:sqlite)
npm run typecheck   # tsc --noEmit
npm run serve:local # dashboard + API on http://127.0.0.1:8787/dashboard, no Cloudflare account needed
```

CI (`.github/workflows/ci.yml`) runs the tests, the type check and `wrangler deploy --dry-run` on every push and pull request.

### Upgrading an existing deployment

Apply the new migrations before deploying 1.1.0:

```bash
npm run db:migrate:prod   # applies 0004 (re-grades leaderboard rows) and 0005 (histogram, tokens, brand key, demo flag)
npm run deploy
```

Migration 0004 rewrites every leaderboard row's grade, tier and icon from its score, and 0005 rebuilds `brand_distribution` with a `(brand, model)` key. Both are safe to run once on live data. The rate limiter needs a Workers plan that supports the Rate Limiting binding; without the binding the Worker simply skips the check.

---

## Support & Sponsorship

If you find OmaStat useful and want to support independent Linux infrastructure:

<a href="https://buymeacoffee.com/ozdil" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 50px !important;width: 180px !important;" ></a>

---

## License

Distributed under the MIT License. Copyright (c) 2026 Ozan Özdil (ozdil) & Omarchy Contributors.
