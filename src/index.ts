/**
 * OmaStat - Omarchy Community Hardware Survey & Statistics Engine
 * Adheres strictly to the Omarchy Developer Guide (ODG) & Zero-PII Security Baseline.
 */

import dashboardHtml from "./dashboard.html";

export interface Env {
  DB: D1Database;
}

interface OmaStatSurveyPayload {
  schema_version: number;
  timestamp_epoch: number;
  omarank_score: number;
  tier_name: string;
  cpu_model: string;
  cpu_cores: number;
  cpu_threads: number;
  gpu_model: string;
  gpu_driver: string;
  ram_gb: number;
  ram_type: string;
  ram_speed_mts: number;
  mobo_vendor?: string;
  system_vendor?: string;
  mobo_name: string;
  chipset: string;
  primary_display: string;
  display_count: number;
  storage_type: string;
  storage_model: string;
  os_name: string;
  archetype_signature?: string;
}

function sanitizeText(str: unknown, maxLen = 80): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/[\x00-\x1f\x7f-\x9f<>&`'"\\]/g, "")
    .trim()
    .slice(0, maxLen);
}

function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...extraHeaders,
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // Health check
    if (url.pathname === "/health" || url.pathname === "/api/ping") {
      return jsonResponse({ status: "ok", service: "omastat", version: "1.0.0" });
    }

    // Web Dashboard UI
    if (url.pathname === "/" || url.pathname === "/stats" || url.pathname === "/dashboard") {
      return new Response(dashboardHtml, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // Ingest Survey
    if (url.pathname === "/api/survey/v1" && request.method === "POST") {
      return handleSurveySubmission(request, env);
    }

    // Get Aggregate Stats
    if (url.pathname === "/api/stats/v1" && request.method === "GET") {
      return handleStatsQuery(env);
    }

    // Archetype Lookup
    if (url.pathname.startsWith("/api/archetype/") && request.method === "GET") {
      const code = decodeURIComponent(url.pathname.replace("/api/archetype/", "")).trim();
      return handleArchetypeLookup(code, env);
    }

    return jsonResponse({ error: "Not Found" }, 404);
  },
};

async function handleSurveySubmission(request: Request, env: Env): Promise<Response> {
  // Enforce 16 KiB size limit (prevent DoS)
  const contentLength = Number(request.headers.get("content-length")) || 0;
  if (contentLength > 16384) {
    return jsonResponse({ success: false, error: "Payload too large (max 16 KiB)" }, 413);
  }

  let body: OmaStatSurveyPayload;
  try {
    const rawText = await request.text();
    if (rawText.length > 16384) {
      return jsonResponse({ success: false, error: "Payload too large" }, 413);
    }
    body = JSON.parse(rawText);
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON payload" }, 400);
  }

  // Schema Validation
  if (body.schema_version !== 2) {
    return jsonResponse({ success: false, error: "Unsupported schema_version (expected 2)" }, 400);
  }

  // High-precision decimal score (e.g. 88.45)
  const score = Math.max(0, Math.min(100, Math.round((Number(body.omarank_score) || 0) * 100) / 100));
  const grade = getLetterGrade(score);
  const tierName = sanitizeText(body.tier_name, 40) || "Unknown";
  const cpuModel = cleanCpuModel(sanitizeText(body.cpu_model, 80));
  const gpuModel = cleanGpuModel(sanitizeText(body.gpu_model, 80));
  const gpuDriver = sanitizeText(body.gpu_driver, 40);
  const ramGb = Math.round(Number(body.ram_gb) || 0);
  const ramType = sanitizeText(body.ram_type, 20) || "RAM";
  const ramSpeed = Math.round(Number(body.ram_speed_mts) || 0);
  const ramBucket = `${ramGb}GB ${ramType}`;
  const ramDesc = ramSpeed > 0 ? `${ramGb}GB ${ramType} @ ${ramSpeed}MT/s` : `${ramGb}GB ${ramType}`;
  const display = cleanDisplay(sanitizeText(body.primary_display, 40));
  const archetype = sanitizeText(body.archetype_signature, 50) || "OMA-BUILD-UNKNOWN";
  const now = Math.floor(Date.now() / 1000);

  const tierIcon = getTierIcon(tierName);
  const { brand: vendorBrand, model: vendorModel } = cleanBrandAndModel(
    sanitizeText(body.system_vendor || body.mobo_vendor || "", 40),
    sanitizeText(body.mobo_vendor || "", 40),
    sanitizeText(body.mobo_name || "", 50),
    sanitizeText(body.mobo_name || "", 50)
  );
  const systemName = vendorBrand && vendorModel && vendorModel !== vendorBrand
    ? `${vendorBrand} ${vendorModel}`
    : (vendorBrand || "Custom Battlestation");

  try {
    // Atomic D1 batch execution for zero-latency aggregate updates
    await env.DB.batch([
      // Update global totals
      env.DB.prepare(
        "UPDATE stats_meta SET value = value + 1 WHERE key = 'total_submissions'"
      ),
      env.DB.prepare(
        "UPDATE stats_meta SET value = value + ? WHERE key = 'sum_scores'"
      ).bind(score),
      env.DB.prepare(
        "UPDATE stats_meta SET value = ? WHERE key = 'last_updated_epoch'"
      ).bind(now),

      // Upsert CPU distribution
      env.DB.prepare(
        "INSERT INTO cpu_distribution (model, count) VALUES (?, 1) ON CONFLICT(model) DO UPDATE SET count = count + 1"
      ).bind(cpuModel),

      // Upsert GPU distribution
      env.DB.prepare(
        "INSERT INTO gpu_distribution (model, driver, count) VALUES (?, ?, 1) ON CONFLICT(model) DO UPDATE SET count = count + 1, driver = excluded.driver"
      ).bind(gpuModel, gpuDriver),

      // Upsert RAM distribution
      env.DB.prepare(
        "INSERT INTO ram_distribution (bucket, count) VALUES (?, 1) ON CONFLICT(bucket) DO UPDATE SET count = count + 1"
      ).bind(ramBucket),

      // Upsert Display distribution
      env.DB.prepare(
        "INSERT INTO display_distribution (resolution_hz, count) VALUES (?, 1) ON CONFLICT(resolution_hz) DO UPDATE SET count = count + 1"
      ).bind(display),

      // Upsert Tier distribution
      env.DB.prepare(
        "INSERT INTO tier_distribution (tier_name, tier_icon, count) VALUES (?, ?, 1) ON CONFLICT(tier_name) DO UPDATE SET count = count + 1"
      ).bind(tierName, tierIcon),

      // Upsert Archetype distribution
      env.DB.prepare(
        "INSERT INTO archetype_distribution (archetype, count) VALUES (?, 1) ON CONFLICT(archetype) DO UPDATE SET count = count + 1"
      ).bind(archetype),

      // Upsert Brand / OEM distribution
      env.DB.prepare(
        "INSERT INTO brand_distribution (brand, model, count) VALUES (?, ?, 1) ON CONFLICT(brand) DO UPDATE SET count = count + 1, model = excluded.model"
      ).bind(vendorBrand, vendorModel),

      // Upsert Global Leaderboard
      env.DB.prepare(
        `INSERT INTO global_leaderboard (
           archetype, score, grade, tier_name, tier_icon, system_name, cpu_model, gpu_model, ram_desc, display_desc, submissions_count, last_updated_epoch
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(archetype) DO UPDATE SET
           score = MAX(score, excluded.score),
           submissions_count = submissions_count + 1,
           last_updated_epoch = excluded.last_updated_epoch`
      ).bind(archetype, score, grade, tierName, tierIcon, systemName, cpuModel, gpuModel, ramDesc, display, now),
    ]);

    return jsonResponse({
      success: true,
      message: "Successfully submitted anonymous hardware profile to OmaStat survey!",
      score,
      grade,
      tier: tierName,
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: "Database transaction failed", details: String(err) }, 500);
  }
}

async function handleStatsQuery(env: Env): Promise<Response> {
  try {
    const [metaRes, cpusRes, gpusRes, ramRes, dispRes, tierRes, archRes, brandRes, boardRes] = await env.DB.batch([
      env.DB.prepare("SELECT key, value FROM stats_meta"),
      env.DB.prepare("SELECT model, count FROM cpu_distribution ORDER BY count DESC LIMIT 8"),
      env.DB.prepare("SELECT model, count FROM gpu_distribution ORDER BY count DESC LIMIT 8"),
      env.DB.prepare("SELECT bucket, count FROM ram_distribution ORDER BY count DESC LIMIT 8"),
      env.DB.prepare("SELECT resolution_hz, count FROM display_distribution ORDER BY count DESC LIMIT 8"),
      env.DB.prepare("SELECT tier_name, tier_icon, count FROM tier_distribution ORDER BY count DESC"),
      env.DB.prepare("SELECT archetype, count FROM archetype_distribution ORDER BY count DESC LIMIT 10"),
      env.DB.prepare("SELECT brand, model, count FROM brand_distribution ORDER BY count DESC LIMIT 8"),
      env.DB.prepare("SELECT archetype, score, grade, tier_name, tier_icon, system_name, cpu_model, gpu_model, ram_desc, display_desc, submissions_count, last_updated_epoch FROM global_leaderboard ORDER BY score DESC LIMIT 50"),
    ]);

    const metaMap: Record<string, number> = {};
    for (const row of (metaRes.results || []) as { key: string; value: number }[]) {
      metaMap[row.key] = row.value;
    }

    const total = metaMap["total_submissions"] || 0;
    const sumScores = metaMap["sum_scores"] || 0;
    const avgScore = total > 0 ? Number((sumScores / total).toFixed(2)) : 0;

    const calcPercentage = (count: number) => (total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0);

    const formatList = (results: any[]) =>
      (results || []).map((r) => ({
        ...r,
        percentage: calcPercentage(r.count),
      }));

    return jsonResponse(
      {
        total_submissions: total,
        average_score: avgScore,
        average_grade: getLetterGrade(avgScore),
        average_tier: getAverageTier(Math.round(avgScore)),
        top_cpus: formatList(cpusRes.results || []),
        top_gpus: formatList(gpusRes.results || []),
        ram_breakdown: formatList(ramRes.results || []),
        display_breakdown: formatList(dispRes.results || []),
        tier_distribution: formatList(tierRes.results || []),
        top_archetypes: formatList(archRes.results || []),
        top_brands: formatList(brandRes.results || []),
        leaderboard: boardRes.results || [],
        last_updated: new Date((metaMap["last_updated_epoch"] || 0) * 1000).toISOString(),
      },
      200,
      {
        // 5 minute edge cache, revalidate in background
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      }
    );
  } catch (err: any) {
    return jsonResponse({ error: "Failed to load stats", details: String(err) }, 500);
  }
}

async function handleArchetypeLookup(code: string, env: Env): Promise<Response> {
  const sanitized = sanitizeText(code, 50);
  if (!sanitized) {
    return jsonResponse({ found: false, error: "Empty archetype code" }, 400);
  }

  try {
    const [row, metaRow] = await Promise.all([
      env.DB.prepare("SELECT count FROM archetype_distribution WHERE archetype = ?").bind(sanitized).first<{ count: number }>(),
      env.DB.prepare("SELECT value FROM stats_meta WHERE key = 'total_submissions'").first<{ value: number }>(),
    ]);

    const total = metaRow?.value || 0;
    if (row && total > 0) {
      const pct = ((row.count / total) * 100).toFixed(2);
      return jsonResponse({ found: true, archetype: sanitized, count: row.count, percentage: pct });
    }

    return jsonResponse({ found: false, archetype: sanitized, count: 0, percentage: 0 });
  } catch (err: any) {
    return jsonResponse({ error: "Lookup failed", details: String(err) }, 500);
  }
}

function cleanCpuModel(raw: string): string {
  if (!raw) return "Generic Processor";
  return raw
    .replace(/Intel\(R\)\s+Core\(TM\)\s+/g, "")
    .replace(/AMD\s+Ryzen\s+/g, "Ryzen ")
    .trim();
}

function cleanGpuModel(raw: string): string {
  if (!raw) return "Integrated Graphics";
  const match = raw.match(/\[(.*?)\]/);
  if (match) return match[1];
  return raw
    .replace(/Intel Corporation /g, "")
    .replace(/Advanced Micro Devices, Inc\. /g, "")
    .replace(/NVIDIA Corporation /g, "")
    .trim();
}

function cleanDisplay(raw: string): string {
  if (!raw) return "1080p @ 60Hz";
  return raw.replace(/x/g, "×");
}

function getTierIcon(tier: string): string {
  if (tier.includes("Cosmic")) return "";
  if (tier.includes("NASA")) return "";
  if (tier.includes("Cyberpunk")) return "󰓅";
  if (tier.includes("Gaming Chair")) return "󰢮";
  if (tier.includes("Honest Daily") || tier.includes("Daily")) return "󰌢";
  if (tier.includes("Budget Warrior")) return "󰘚";
  if (tier.includes("Study Mode")) return "󰍛";
  return "󰋊";
}

function getAverageTier(score: number): string {
  if (score >= 96) return " Cosmic Reality Simulator";
  if (score >= 89) return " NASA Supercomputer";
  if (score >= 76) return "󰓅 Cyberpunk Beast";
  if (score >= 61) return "󰢮 Gaming Chair Missing";
  if (score >= 46) return "󰌢 Honest Daily Driver";
  if (score >= 31) return "󰘚 Budget Warrior";
  if (score >= 16) return "󰍛 Study Mode Only";
  return "󰋊 Potato Toaster";
}

function getLetterGrade(score: number): string {
  if (score >= 95.0) return "S+";
  if (score >= 90.0) return "S";
  if (score >= 85.0) return "A+";
  if (score >= 75.0) return "A";
  if (score >= 65.0) return "B+";
  if (score >= 55.0) return "B";
  if (score >= 40.0) return "C";
  return "D";
}

function cleanBrandAndModel(sysVendor: string, boardVendor: string, productName: string, boardName: string): { brand: string; model: string } {
  const sv = (sysVendor || "").toUpperCase().trim();
  const bv = (boardVendor || "").toUpperCase().trim();
  const pn = (productName || "").trim();
  const bn = (boardName || "").trim();

  const isGeneric = !pn || ["SYSTEM PRODUCT NAME", "DEFAULT STRING", "TO BE FILLED BY O.E.M.", "UNKNOWN"].includes(pn.toUpperCase());

  // 1. Laptop / Prebuilt OEMs
  if (sv.includes("GAME GARAJ") || bv.includes("GAME GARAJ") || pn.toUpperCase().includes("SLAYER")) {
    return { brand: "Game Garaj", model: sanitizeText(pn || bn || "Slayer 4 Ultra", 40) };
  }
  if (sv.includes("FRAMEWORK") || bv.includes("FRAMEWORK")) {
    return { brand: "Framework", model: sanitizeText(pn || "Modular Laptop", 40) };
  }
  if (sv.includes("MONSTER") || bv.includes("MONSTER") || pn.toUpperCase().includes("TULPAR") || pn.toUpperCase().includes("ABRA")) {
    return { brand: "Monster Notebook", model: sanitizeText(pn || bn || "Tulpar / Abra", 40) };
  }
  if (sv.includes("SYSTEM76")) {
    return { brand: "System76", model: sanitizeText(pn || "Linux Rig", 40) };
  }
  if (sv.includes("LENOVO") || pn.toUpperCase().includes("THINKPAD") || pn.toUpperCase().includes("LEGION")) {
    return { brand: "Lenovo", model: sanitizeText(pn || "ThinkPad / Legion", 40) };
  }
  if (sv.includes("DELL") || sv.includes("ALIENWARE") || pn.toUpperCase().includes("XPS")) {
    return { brand: "Dell / Alienware", model: sanitizeText(pn || "XPS / Latitude", 40) };
  }
  if (sv.includes("APPLE")) {
    return { brand: "Apple Silicon (Asahi)", model: sanitizeText(pn || "MacBook Pro", 40) };
  }
  if (sv.includes("RAZER") || pn.toUpperCase().includes("BLADE")) {
    return { brand: "Razer", model: sanitizeText(pn || "Blade", 40) };
  }
  if (sv.includes("HP") || sv.includes("HEWLETT-PACKARD") || pn.toUpperCase().includes("OMEN")) {
    return { brand: "HP", model: sanitizeText(pn || "Omen / Victus", 40) };
  }
  if (sv.includes("ACER") || pn.toUpperCase().includes("PREDATOR")) {
    return { brand: "Acer", model: sanitizeText(pn || "Predator / Nitro", 40) };
  }
  if (sv.includes("TUXEDO")) {
    return { brand: "TUXEDO Computers", model: sanitizeText(pn || "Linux Book", 40) };
  }

  // 2. Custom DIY PC Motherboard Vendors
  let diyVendor = "";
  if (bv.includes("ASUS") || sv.includes("ASUS") || bv.includes("ASUSTEK")) diyVendor = "ASUS";
  else if (bv.includes("GIGABYTE") || sv.includes("GIGABYTE")) diyVendor = "Gigabyte";
  else if (bv.includes("MSI") || sv.includes("MSI") || bv.includes("MICRO-STAR")) diyVendor = "MSI";
  else if (bv.includes("ASROCK") || sv.includes("ASROCK")) diyVendor = "ASRock";
  else if (bv.includes("NZXT")) diyVendor = "NZXT";
  else if (bv.includes("BIOSTAR")) diyVendor = "Biostar";

  if (diyVendor) {
    if (isGeneric) {
      return { brand: `Custom PC (${diyVendor})`, model: sanitizeText(bn || diyVendor, 40) };
    }
    if (pn.toUpperCase().includes("ROG") || pn.toUpperCase().includes("STRIX")) {
      return { brand: "ASUS ROG", model: sanitizeText(pn, 40) };
    }
    if (pn.toUpperCase().includes("TUF")) {
      return { brand: "ASUS TUF", model: sanitizeText(pn, 40) };
    }
    if (pn.toUpperCase().includes("AORUS")) {
      return { brand: "Gigabyte AORUS", model: sanitizeText(pn, 40) };
    }
    return { brand: `Custom PC (${diyVendor})`, model: sanitizeText(bn || pn, 40) };
  }

  if (isGeneric) {
    return { brand: "Custom PC (DIY)", model: sanitizeText(bn || "DIY Rig", 40) };
  }

  const fallbackBrand = sanitizeText(sysVendor || boardVendor || "Custom PC", 30);
  return { brand: fallbackBrand, model: sanitizeText(pn || bn || "Desktop", 40) };
}
