import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new DatabaseSync(':memory:');
const migrationFiles = [
  '0001_init_omastat.sql',
  '0002_add_brand_distribution.sql',
  '0003_add_global_leaderboard.sql',
];
for (const file of migrationFiles) {
  const sql = readFileSync(resolve(__dirname, '../migrations', file), 'utf8');
  db.exec(sql);
}

const dashboardHtml = readFileSync(resolve(__dirname, '../src/dashboard.html'), 'utf8');

function sanitize(str, maxLen = 80) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\x00-\x1f\x7f-\x9f<>&`'"\\]/g, '').trim().slice(0, maxLen);
}

function validateArchetype(raw) {
  if (typeof raw !== 'string') return 'OMA-CUSTOM-RIG';
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9\-]/g, '').slice(0, 50);
  if (/^OMA-[A-Z0-9]{1,12}(-[A-Z0-9]{1,12}){1,6}$/.test(cleaned)) {
    return cleaned;
  }
  return 'OMA-CUSTOM-RIG';
}

function getLetterGrade(score) {
  if (score >= 95.0) return 'S+';
  if (score >= 90.0) return 'S';
  if (score >= 85.0) return 'A+';
  if (score >= 75.0) return 'A';
  if (score >= 65.0) return 'B+';
  if (score >= 55.0) return 'B';
  if (score >= 40.0) return 'C';
  return 'D';
}

function getTierIcon(tier) {
  if (tier.includes('Cosmic')) return '';
  if (tier.includes('NASA')) return '󰓅';
  if (tier.includes('Cyberpunk')) return '';
  if (tier.includes('Gaming Chair') || tier.includes('High-FPS')) return '';
  if (tier.includes('Honest Daily') || tier.includes('Daily')) return '';
  if (tier.includes('Budget Warrior')) return '';
  if (tier.includes('Study Mode')) return '';
  return '';
}

function getAverageTier(score) {
  if (score >= 96) return ' Cosmic Reality Simulator';
  if (score >= 89) return '󰓅 NASA Supercomputer';
  if (score >= 76) return ' Cyberpunk Beast';
  if (score >= 61) return ' Gaming Chair Missing';
  if (score >= 46) return ' Honest Daily Driver';
  if (score >= 31) return ' Budget Warrior';
  if (score >= 16) return ' Study Mode Only';
  return ' Potato Toaster';
}

function cleanBrandAndModel(sysVendor, boardVendor, productName, boardName) {
  const sv = (sysVendor || '').toUpperCase().trim();
  const bv = (boardVendor || '').toUpperCase().trim();
  const pn = (productName || '').trim();
  const bn = (boardName || '').trim();
  const isGeneric = !pn || ['SYSTEM PRODUCT NAME', 'DEFAULT STRING', 'TO BE FILLED BY O.E.M.', 'UNKNOWN'].includes(pn.toUpperCase());

  if (sv.includes('GAME GARAJ') || bv.includes('GAME GARAJ') || pn.toUpperCase().includes('SLAYER')) {
    return { brand: 'Game Garaj', model: sanitize(pn || bn || 'Slayer 4 Ultra', 40) };
  }
  if (sv.includes('FRAMEWORK') || bv.includes('FRAMEWORK')) {
    return { brand: 'Framework', model: sanitize(pn || 'Modular Laptop', 40) };
  }
  if (sv.includes('MONSTER') || bv.includes('MONSTER') || pn.toUpperCase().includes('TULPAR') || pn.toUpperCase().includes('ABRA')) {
    return { brand: 'Monster Notebook', model: sanitize(pn || bn || 'Tulpar / Abra', 40) };
  }
  if (sv.includes('SYSTEM76')) {
    return { brand: 'System76', model: sanitize(pn || 'Linux Rig', 40) };
  }
  if (sv.includes('LENOVO') || pn.toUpperCase().includes('THINKPAD') || pn.toUpperCase().includes('LEGION')) {
    return { brand: 'Lenovo', model: sanitize(pn || 'ThinkPad / Legion', 40) };
  }
  if (sv.includes('DELL') || sv.includes('ALIENWARE') || pn.toUpperCase().includes('XPS')) {
    return { brand: 'Dell / Alienware', model: sanitize(pn || 'XPS / Latitude', 40) };
  }
  if (sv.includes('APPLE')) {
    return { brand: 'Apple Silicon (Asahi)', model: sanitize(pn || 'MacBook Pro', 40) };
  }
  if (sv.includes('RAZER') || pn.toUpperCase().includes('BLADE')) {
    return { brand: 'Razer', model: sanitize(pn || 'Blade', 40) };
  }
  if (sv.includes('HP') || sv.includes('HEWLETT-PACKARD') || pn.toUpperCase().includes('OMEN')) {
    return { brand: 'HP', model: sanitize(pn || 'Omen / Victus', 40) };
  }
  if (sv.includes('ACER') || pn.toUpperCase().includes('PREDATOR')) {
    return { brand: 'Acer', model: sanitize(pn || 'Predator / Nitro', 40) };
  }
  if (sv.includes('TUXEDO')) {
    return { brand: 'TUXEDO Computers', model: sanitize(pn || 'Linux Book', 40) };
  }

  let diyVendor = '';
  if (bv.includes('ASUS') || sv.includes('ASUS') || bv.includes('ASUSTEK')) diyVendor = 'ASUS';
  else if (bv.includes('GIGABYTE') || sv.includes('GIGABYTE')) diyVendor = 'Gigabyte';
  else if (bv.includes('MSI') || sv.includes('MSI') || bv.includes('MICRO-STAR')) diyVendor = 'MSI';
  else if (bv.includes('ASROCK') || sv.includes('ASROCK')) diyVendor = 'ASRock';
  else if (bv.includes('NZXT')) diyVendor = 'NZXT';
  else if (bv.includes('BIOSTAR')) diyVendor = 'Biostar';

  if (diyVendor) {
    if (isGeneric) {
      return { brand: `Custom PC (${diyVendor})`, model: sanitize(bn || diyVendor, 40) };
    }
    if (pn.toUpperCase().includes('ROG') || pn.toUpperCase().includes('STRIX')) {
      return { brand: 'ASUS ROG', model: sanitize(pn, 40) };
    }
    if (pn.toUpperCase().includes('TUF')) {
      return { brand: 'ASUS TUF', model: sanitize(pn, 40) };
    }
    if (pn.toUpperCase().includes('AORUS')) {
      return { brand: 'Gigabyte AORUS', model: sanitize(pn, 40) };
    }
    return { brand: `Custom PC (${diyVendor})`, model: sanitize(bn || pn, 40) };
  }

  if (isGeneric) {
    return { brand: 'Custom PC (DIY)', model: sanitize(bn || 'DIY Rig', 40) };
  }

  const fallbackBrand = sanitize(sysVendor || boardVendor || 'Custom PC', 30);
  return { brand: fallbackBrand, model: sanitize(pn || bn || 'Desktop', 40) };
}

const SECURITY_HEADERS_API = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Resource-Policy': 'cross-origin',
};

const SECURITY_HEADERS_HTML = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Content-Security-Policy': "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net data:; img-src 'self' data: https://cdn.buymeacoffee.com https://img.shields.io; connect-src 'self' https://stream.nightride.fm; media-src 'self' https://stream.nightride.fm; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...SECURITY_HEADERS_API,
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  if (url.pathname === '/health' || url.pathname === '/api/ping') {
    res.writeHead(200, SECURITY_HEADERS_API);
    res.end(JSON.stringify({ status: 'ok', service: 'omastat', version: '1.0.1' }));
    return;
  }

  if (url.pathname === '/' || url.pathname === '/stats' || url.pathname === '/dashboard') {
    res.writeHead(200, SECURITY_HEADERS_HTML);
    res.end(dashboardHtml);
    return;
  }

  if (url.pathname === '/api/stats/v1' && req.method === 'GET') {
    const metaRows = db.prepare("SELECT key, value FROM stats_meta").all();
    const meta = {};
    for (const r of metaRows) meta[r.key] = r.value;
    const total = meta['total_submissions'] || 0;
    const avgScore = total > 0 ? Number(((meta['sum_scores'] || 0) / total).toFixed(2)) : 0;

    const calcPct = (c) => total > 0 ? Number(((c / total) * 100).toFixed(1)) : 0;
    const getList = (table, col, extraCols = '') =>
      db.prepare(`SELECT ${col} ${extraCols ? ',' + extraCols : ''}, count FROM ${table} ORDER BY count DESC LIMIT 8`)
        .all()
        .map(r => ({ ...r, percentage: calcPct(r.count) }));

    const leaderboardRows = db.prepare(`
      SELECT archetype, score, grade, tier_name, tier_icon, system_name, cpu_model, gpu_model, ram_desc, display_desc, submissions_count, last_updated_epoch
      FROM global_leaderboard
      ORDER BY score DESC
      LIMIT 50
    `).all();

    const data = {
      total_submissions: total,
      average_score: avgScore,
      average_grade: getLetterGrade(avgScore),
      average_tier: getAverageTier(Math.round(avgScore)),
      top_cpus: getList('cpu_distribution', 'model'),
      top_gpus: getList('gpu_distribution', 'model', 'driver'),
      ram_breakdown: getList('ram_distribution', 'bucket'),
      display_breakdown: getList('display_distribution', 'resolution_hz'),
      tier_distribution: getList('tier_distribution', 'tier_name', 'tier_icon'),
      top_archetypes: getList('archetype_distribution', 'archetype'),
      top_brands: getList('brand_distribution', 'brand', 'model'),
      leaderboard: leaderboardRows,
      last_updated: new Date((meta['last_updated_epoch'] || 0) * 1000).toISOString()
    };

    res.writeHead(200, SECURITY_HEADERS_API);
    res.end(JSON.stringify(data));
    return;
  }

  if (url.pathname === '/api/survey/v1' && req.method === 'POST') {
    let bodyText = '';
    req.on('data', chunk => {
      bodyText += chunk;
      if (bodyText.length > 16384) {
        res.writeHead(413, SECURITY_HEADERS_API);
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyText);
        if (!body || typeof body !== 'object' || body.schema_version !== 2) {
          res.writeHead(400, SECURITY_HEADERS_API);
          res.end(JSON.stringify({ error: 'Invalid schema version' }));
          return;
        }

        const scoreRaw = Number(body.omarank_score);
        if (isNaN(scoreRaw) || scoreRaw < 0 || scoreRaw > 100) {
          res.writeHead(400, SECURITY_HEADERS_API);
          res.end(JSON.stringify({ error: 'Invalid omarank_score' }));
          return;
        }
        const score = Math.max(0, Math.min(100, Math.round(scoreRaw * 100) / 100));

        const grade = getLetterGrade(score);
        const tierName = sanitize(body.tier_name, 40) || 'Unknown';
        const tierIcon = getTierIcon(tierName);
        const cpu = sanitize(body.cpu_model, 80);
        const gpu = sanitize(body.gpu_model, 80);
        const gpuDriver = sanitize(body.gpu_driver, 40);
        const ramGb = Math.round(Number(body.ram_gb) || 0);
        const ramType = sanitize(body.ram_type, 20) || 'RAM';
        const ramSpeed = Number(body.ram_speed_mts) || 0;
        const ram = `${ramGb}GB ${ramType}`;
        const ramDesc = ramSpeed > 0 ? `${ramGb}GB ${ramType} @ ${ramSpeed}MT/s` : `${ramGb}GB ${ramType}`;
        const disp = sanitize(body.primary_display, 40);
        const arch = validateArchetype(body.archetype_signature);
        const now = Math.floor(Date.now() / 1000);

        const { brand: vendorBrand, model: vendorModel } = cleanBrandAndModel(
          sanitize(body.system_vendor || body.mobo_vendor || '', 40),
          sanitize(body.mobo_vendor || '', 40),
          sanitize(body.mobo_name || '', 50),
          sanitize(body.mobo_name || '', 50)
        );
        const systemName = vendorBrand && vendorModel && vendorModel !== vendorBrand
          ? `${vendorBrand} ${vendorModel}`
          : (vendorBrand || 'Custom Battlestation');

        db.prepare("UPDATE stats_meta SET value = value + 1 WHERE key = 'total_submissions'").run();
        db.prepare("UPDATE stats_meta SET value = value + ? WHERE key = 'sum_scores'").run(score);
        db.prepare("UPDATE stats_meta SET value = ? WHERE key = 'last_updated_epoch'").run(now);
        db.prepare("INSERT INTO cpu_distribution (model, count) VALUES (?, 1) ON CONFLICT(model) DO UPDATE SET count = count + 1").run(cpu);
        db.prepare("INSERT INTO gpu_distribution (model, driver, count) VALUES (?, ?, 1) ON CONFLICT(model) DO UPDATE SET count = count + 1, driver = excluded.driver").run(gpu, gpuDriver);
        db.prepare("INSERT INTO ram_distribution (bucket, count) VALUES (?, 1) ON CONFLICT(bucket) DO UPDATE SET count = count + 1").run(ram);
        db.prepare("INSERT INTO display_distribution (resolution_hz, count) VALUES (?, 1) ON CONFLICT(resolution_hz) DO UPDATE SET count = count + 1").run(disp);
        db.prepare("INSERT INTO tier_distribution (tier_name, tier_icon, count) VALUES (?, ?, 1) ON CONFLICT(tier_name) DO UPDATE SET count = count + 1").run(tierName, tierIcon);
        db.prepare("INSERT INTO archetype_distribution (archetype, count) VALUES (?, 1) ON CONFLICT(archetype) DO UPDATE SET count = count + 1").run(arch);
        db.prepare("INSERT INTO brand_distribution (brand, model, count) VALUES (?, ?, 1) ON CONFLICT(brand) DO UPDATE SET count = count + 1, model = excluded.model").run(vendorBrand, vendorModel);
        db.prepare(`
          INSERT INTO global_leaderboard (
            archetype, score, grade, tier_name, tier_icon, system_name, cpu_model, gpu_model, ram_desc, display_desc, submissions_count, last_updated_epoch
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
          ON CONFLICT(archetype) DO UPDATE SET
            score = MAX(score, excluded.score),
            submissions_count = submissions_count + 1,
            last_updated_epoch = excluded.last_updated_epoch
        `).run(arch, score, grade, tierName, tierIcon, systemName, cpu, gpu, ramDesc, disp, now);

        res.writeHead(200, SECURITY_HEADERS_API);
        res.end(JSON.stringify({
          success: true,
          message: 'Successfully submitted anonymous hardware profile to OmaStat survey!',
          score,
          grade,
          tier: tierName
        }));
      } catch (e) {
        res.writeHead(400, SECURITY_HEADERS_API);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (url.pathname.startsWith('/api/archetype/')) {
    const arch = decodeURIComponent(url.pathname.replace('/api/archetype/', '')).trim();
    const row = db.prepare("SELECT count FROM archetype_distribution WHERE archetype = ?").get(arch);
    const totalRow = db.prepare("SELECT value FROM stats_meta WHERE key = 'total_submissions'").get();
    const total = totalRow ? totalRow.value : 0;
    if (row && total > 0) {
      res.writeHead(200, SECURITY_HEADERS_API);
      res.end(JSON.stringify({ found: true, archetype: arch, count: row.count, percentage: ((row.count / total) * 100).toFixed(1) }));
    } else {
      res.writeHead(200, SECURITY_HEADERS_API);
      res.end(JSON.stringify({ found: false, archetype: arch, count: 0, percentage: 0 }));
    }
    return;
  }

  res.writeHead(404, SECURITY_HEADERS_API);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

const PORT = 8787;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`OmaStat Simulation Server listening on http://127.0.0.1:${PORT}`);
});
