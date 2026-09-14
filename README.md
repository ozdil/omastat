# 🏆 OmaStat

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Support_Development-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/ozdil)

**Privacy-Preserving Community Hardware Survey & Statistics Engine for Omarchy Linux**

OmaStat is the open-source community hardware survey aggregator for Omarchy (`omastat.omarchy.org`). Inspired by the Steam Hardware Survey, it collects privacy-safe, anonymous telemetry from the [OmaRank](https://github.com/ozdil/omarchy-omarank) hardware benchmark widget to provide live, transparent hardware market share statistics across the Omarchy ecosystem.

📊 **Live Demo Dashboard:** [https://omastat.ozan-zdil.workers.dev/dashboard](https://omastat.ozan-zdil.workers.dev/dashboard)  
📡 **Live Survey API:** `https://omastat.ozan-zdil.workers.dev/api/survey/v1`


---

## 🌟 Architecture & Technology Stack

Built to match the exact infrastructure patterns of the official Omarchy Plugin Marketplace (`omacom/omarchy-plugin-marketplace`):

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) (Edge TypeScript)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (Serverless SQLite)
- **Frontend Dashboard**: Native Omarchy-themed responsive UI (`/dashboard`)
- **Hosting Cost**: **$0.00 / month** (Runs entirely within Cloudflare's free tier)

---

## 🔒 Privacy & Trust Boundary (Zero-PII by Design)

Adheres strictly to the **Omarchy Developer Guide (ODG)** and **Omarchy Security Baseline**:

1. **Zero Personal Identifiers**: No usernames, hostnames, email addresses, or accounts.
2. **Zero Network / Device Tracking**: No IP address logging, no MAC addresses, and no persistent device fingerprinting.
3. **Hardware Archetypes**: Machines report anonymous build signatures (e.g. `OMA-U7-ARC-31G-240H`) rather than individual machine tracking IDs.
4. **Pure Aggregate Counters**: D1 stores only aggregate histogram tables (e.g. GPU models, core counts, RAM capacity tiers). Individual raw submission events are not retained.
5. **Edge Rate Limiting & Size Guards**: Strictly enforces a 16 KiB payload ceiling to prevent denial-of-service vectors.

---

## 📡 API Specification

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
  "mobo_name": "SLAYER 4 ULTRA",
  "chipset": "Mainstream Chipset",
  "primary_display": "2560x1600 @ 240Hz",
  "display_count": 1,
  "storage_type": "NVMe PCIe Gen4/5 SSD",
  "storage_model": "Samsung SSD 990 PRO 4TB",
  "os_name": "Omarchy",
  "archetype_signature": "OMA-U7-ARC-31G-240H"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully submitted anonymous hardware profile to OmaStat survey!",
  "score": 62,
  "tier": "Gaming Chair Missing"
}
```

---

### `GET /api/stats/v1`
Returns global community hardware aggregates. Cached at Cloudflare edge for 5 minutes (`max-age=300, stale-while-revalidate=60`).

```json
{
  "total_submissions": 12480,
  "average_score": 67,
  "average_tier": "🏎️ Gaming Chair Missing",
  "top_gpus": [
    { "model": "Intel Arc Graphics", "driver": "i915", "count": 3420, "percentage": 27.4 },
    { "model": "NVIDIA GeForce RTX 4080", "driver": "nvidia", "count": 2810, "percentage": 22.5 }
  ],
  "top_cpus": [ ... ],
  "ram_breakdown": [ ... ],
  "display_breakdown": [ ... ],
  "tier_distribution": [ ... ]
}
```

---

### `GET /api/archetype/:code`
Looks up how common a specific hardware combination is globally:
```json
{
  "found": true,
  "archetype": "OMA-U7-ARC-31G-240H",
  "count": 412,
  "percentage": "3.3"
}
```

---

## 🚀 1-Click Deployment for Omarchy Maintainers

```bash
# 1. Clone repository
git clone https://github.com/ozdil/omastat.git
cd omastat

# 2. Install dependencies
npm install

# 3. Create Cloudflare D1 database
npx wrangler d1 create omastat-db

# 4. Apply database migrations
npx wrangler d1 migrations apply omastat-db --remote

# 5. Deploy Worker to omastat.omarchy.org
npx wrangler deploy
```

---

## ☕ Support & Sponsorship

If you find OmaStat useful and want to support independent Linux infrastructure:

<a href="https://buymeacoffee.com/ozdil" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 50px !important;width: 180px !important;" ></a>

---

## 📄 License

Distributed under the MIT License. Copyright © 2026 Ozan Özdil (ozdil) & Omarchy Contributors.
