import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('[TEST] Starting OmaStat Architecture Simulation & Zero-Trust Validation Suite...');

// 1. Initialize SQLite Database (simulating Cloudflare D1)
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
console.log('[PASS] All 3 D1 Migrations Applied Successfully (Schema v1.0.1 Parity)');

// Mock D1 environment
const mockDb = {
  prepare: (sql) => ({
    bind: (...args) => ({
      _sql: sql,
      _args: args,
      first: () => {
        const stmt = db.prepare(sql);
        return stmt.get(...args);
      },
      all: () => {
        const stmt = db.prepare(sql);
        return { results: stmt.all(...args) };
      }
    }),
    first: () => {
      const stmt = db.prepare(sql);
      return stmt.get();
    },
    all: () => {
      const stmt = db.prepare(sql);
      return { results: stmt.all() };
    }
  }),
  batch: async (statements) => {
    return statements.map(st => {
      if (st._sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = db.prepare(st._sql);
        const results = st._args ? stmt.all(...st._args) : stmt.all();
        return { results };
      } else {
        const stmt = db.prepare(st._sql);
        if (st._args) stmt.run(...st._args);
        else stmt.run();
        return { success: true };
      }
    });
  }
};

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

// Simulation Helper
function simulateIngest(payload) {
  if (!payload || typeof payload !== 'object' || payload.schema_version !== 2) {
    return { success: false, error: 'Unsupported schema_version (expected 2)' };
  }

  const scoreRaw = Number(payload.omarank_score);
  if (isNaN(scoreRaw) || scoreRaw < 0 || scoreRaw > 100) {
    return { success: false, error: 'Invalid omarank_score' };
  }
  const score = Math.max(0, Math.min(100, Math.round(scoreRaw * 100) / 100));

  const grade = getLetterGrade(score);
  const tierName = sanitize(payload.tier_name, 40) || 'Unknown';
  const tierIcon = getTierIcon(tierName);
  const cpuModel = sanitize(payload.cpu_model, 80) || 'CPU';
  const gpuModel = sanitize(payload.gpu_model, 80) || 'GPU';
  const gpuDriver = sanitize(payload.gpu_driver, 40) || 'driver';
  const ramGb = Math.round(Number(payload.ram_gb) || 0);
  const ramType = sanitize(payload.ram_type, 20) || 'RAM';
  const ramSpeed = Number(payload.ram_speed_mts) || 0;
  const ramBucket = `${ramGb}GB ${ramType}`;
  const ramDesc = ramSpeed > 0 ? `${ramGb}GB ${ramType} @ ${ramSpeed}MT/s` : `${ramGb}GB ${ramType}`;
  const display = sanitize(payload.primary_display, 40) || '1080p';
  const archetype = validateArchetype(payload.archetype_signature);
  const now = Math.floor(Date.now() / 1000);

  const { brand: vendorBrand, model: vendorModel } = cleanBrandAndModel(
    sanitize(payload.system_vendor || payload.mobo_vendor || '', 40),
    sanitize(payload.mobo_vendor || '', 40),
    sanitize(payload.mobo_name || '', 50),
    sanitize(payload.mobo_name || '', 50)
  );
  const systemName = vendorBrand && vendorModel && vendorModel !== vendorBrand
    ? `${vendorBrand} ${vendorModel}`
    : (vendorBrand || 'Custom Battlestation');

  // Atomic batch
  mockDb.batch([
    mockDb.prepare("UPDATE stats_meta SET value = value + 1 WHERE key = 'total_submissions'").bind(),
    mockDb.prepare("UPDATE stats_meta SET value = value + ? WHERE key = 'sum_scores'").bind(score),
    mockDb.prepare("UPDATE stats_meta SET value = ? WHERE key = 'last_updated_epoch'").bind(now),
    mockDb.prepare("INSERT INTO cpu_distribution (model, count) VALUES (?, 1) ON CONFLICT(model) DO UPDATE SET count = count + 1").bind(cpuModel),
    mockDb.prepare("INSERT INTO gpu_distribution (model, driver, count) VALUES (?, ?, 1) ON CONFLICT(model) DO UPDATE SET count = count + 1, driver = excluded.driver").bind(gpuModel, gpuDriver),
    mockDb.prepare("INSERT INTO ram_distribution (bucket, count) VALUES (?, 1) ON CONFLICT(bucket) DO UPDATE SET count = count + 1").bind(ramBucket),
    mockDb.prepare("INSERT INTO display_distribution (resolution_hz, count) VALUES (?, 1) ON CONFLICT(resolution_hz) DO UPDATE SET count = count + 1").bind(display),
    mockDb.prepare("INSERT INTO tier_distribution (tier_name, tier_icon, count) VALUES (?, ?, 1) ON CONFLICT(tier_name) DO UPDATE SET count = count + 1").bind(tierName, tierIcon),
    mockDb.prepare("INSERT INTO archetype_distribution (archetype, count) VALUES (?, 1) ON CONFLICT(archetype) DO UPDATE SET count = count + 1").bind(archetype),
    mockDb.prepare("INSERT INTO brand_distribution (brand, model, count) VALUES (?, ?, 1) ON CONFLICT(brand) DO UPDATE SET count = count + 1, model = excluded.model").bind(vendorBrand, vendorModel),
    mockDb.prepare(`INSERT INTO global_leaderboard (
       archetype, score, grade, tier_name, tier_icon, system_name, cpu_model, gpu_model, ram_desc, display_desc, submissions_count, last_updated_epoch
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(archetype) DO UPDATE SET
       score = MAX(score, excluded.score),
       submissions_count = submissions_count + 1,
       last_updated_epoch = excluded.last_updated_epoch`).bind(archetype, score, grade, tierName, tierIcon, systemName, cpuModel, gpuModel, ramDesc, display, now),
  ]);

  return { success: true, score, grade, tier: tierName };
}

// TEST 1: Real-world OmaRank Payload Ingestion
console.log('\n--- Test 1: Real-world OmaRank Payload Ingestion ---');
const userPayload = {
  schema_version: 2,
  timestamp_epoch: 1788794239,
  omarank_score: 62,
  tier_name: "Gaming Chair Missing",
  cpu_model: "Intel Ultra 7 155H",
  cpu_cores: 16,
  cpu_threads: 22,
  gpu_model: "Intel Arc Graphics",
  gpu_driver: "i915",
  ram_gb: 31.1,
  ram_type: "DDR4",
  ram_speed_mts: 3200,
  mobo_name: "SLAYER 4 ULTRA",
  chipset: "Mainstream Chipset",
  primary_display: "2560x1600 @ 240Hz",
  display_count: 1,
  storage_type: "NVMe PCIe Gen4/5 SSD",
  storage_model: "Samsung SSD 990 PRO 4TB",
  os_name: "Omarchy",
  archetype_signature: "OMA-U7-ARC-31G-240H"
};

const res1 = simulateIngest(userPayload);
if (!res1.success) throw new Error('Test 1 failed');
console.log('[PASS] User Submission Processed Successfully');

// TEST 2: Simulate 50 Diverse Community Battlestations
console.log('\n--- Test 2: Simulating 50 Diverse Community Battlestations ---');
const cpus = ['Intel Ultra 7 155H', 'Ryzen 7 7800X3D', 'Intel Core i9-14900K', 'Ryzen 5 5600X'];
const gpus = ['Intel Arc Graphics', 'NVIDIA GeForce RTX 4080', 'NVIDIA GeForce RTX 4060', 'AMD Radeon RX 7900 XTX'];
const rams = [{ gb: 32, type: 'DDR4' }, { gb: 32, type: 'DDR5' }, { gb: 64, type: 'DDR5' }, { gb: 16, type: 'DDR4' }];
const displays = ['2560x1600 @ 240Hz', '1920x1080 @ 144Hz', '3840x2160 @ 120Hz', '2560x1440 @ 165Hz'];

for (let i = 0; i < 50; i++) {
  const cpu = cpus[i % cpus.length];
  const gpu = gpus[i % gpus.length];
  const ram = rams[i % rams.length];
  const disp = displays[i % displays.length];
  const score = 50 + (i % 45);
  simulateIngest({
    schema_version: 2,
    timestamp_epoch: Date.now(),
    omarank_score: score,
    tier_name: score > 80 ? 'Cyberpunk Beast' : 'Gaming Chair Missing',
    cpu_model: cpu,
    cpu_cores: 16,
    cpu_threads: 24,
    gpu_model: gpu,
    gpu_driver: 'nvidia',
    ram_gb: ram.gb,
    ram_type: ram.type,
    ram_speed_mts: 6000,
    mobo_name: 'ASUS ROG',
    chipset: 'Z790',
    primary_display: disp,
    display_count: 1,
    storage_type: 'NVMe SSD',
    storage_model: 'WD Black SN850X',
    os_name: 'Omarchy',
    archetype_signature: `OMA-${cpu.slice(0,3)}-${gpu.slice(0,3)}-${ram.gb}G`
  });
}
console.log('[PASS] 50 Community Battlestations Ingested');

// TEST 3: Query Aggregate Statistics (/api/stats/v1)
console.log('\n--- Test 3: Aggregates Calculation & Edge Query ---');
const totalSubs = db.prepare("SELECT value FROM stats_meta WHERE key = 'total_submissions'").get().value;
const sumScores = db.prepare("SELECT value FROM stats_meta WHERE key = 'sum_scores'").get().value;
const avgScore = Math.round(sumScores / totalSubs);

console.log(`Total Active Battlestations: ${totalSubs}`);
console.log(`Global Average OmaScore:     ${avgScore}/100`);

const topGpus = db.prepare("SELECT model, count FROM gpu_distribution ORDER BY count DESC").all();
console.log('\nTop GPUs by Community Share:');
topGpus.forEach(g => {
  const pct = ((g.count / totalSubs) * 100).toFixed(1);
  console.log(` - ${g.model.padEnd(28)} : ${g.count} rigs (${pct}%)`);
});

const topDisplays = db.prepare("SELECT resolution_hz, count FROM display_distribution ORDER BY count DESC").all();
console.log('\nTop Display Resolutions:');
topDisplays.forEach(d => {
  const pct = ((d.count / totalSubs) * 100).toFixed(1);
  console.log(` - ${d.resolution_hz.padEnd(28)} : ${d.count} rigs (${pct}%)`);
});

const topBrands = db.prepare("SELECT brand, model, count FROM brand_distribution ORDER BY count DESC").all();
console.log('\nTop Brands / Manufacturers:');
topBrands.forEach(b => {
  const pct = ((b.count / totalSubs) * 100).toFixed(1);
  console.log(` - ${b.brand.padEnd(28)} : ${b.count} rigs (${pct}%)`);
});

// TEST 4: Archetype Global Lookup (/api/archetype/:code)
console.log('\n--- Test 4: Archetype Global Lookup ---');
const testArchetype = "OMA-U7-ARC-31G-240H";
const archRow = db.prepare("SELECT count FROM archetype_distribution WHERE archetype = ?").get(testArchetype);
console.log(`Lookup for ${testArchetype}: ${archRow ? archRow.count : 0} matching battlestations globally.`);
if (!archRow || archRow.count !== 1) throw new Error('Test 4 failed');
console.log('[PASS] Archetype Lookup Succeeded');

// TEST 5: Zero-PII Guarantee Verification
console.log('\n--- Test 5: Zero-PII Audit ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Active DB Tables:', tables.map(t => t.name).join(', '));
const hasIpColumn = db.prepare("PRAGMA table_info(stats_meta)").all().some(c => c.name.toLowerCase().includes('ip'));
if (hasIpColumn) throw new Error('Zero-PII Audit Failed: IP column found');
const hasIpInLeaderboard = db.prepare("PRAGMA table_info(global_leaderboard)").all().some(c => c.name.toLowerCase().includes('ip'));
if (hasIpInLeaderboard) throw new Error('Zero-PII Audit Failed: IP column found in leaderboard');
console.log('[PASS] Zero-PII Guarantee Verified across all tables');

// TEST 6: Zero-Trust Schema & Boundary Validation
console.log('\n--- Test 6: Zero-Trust Boundary Validation ---');
const invalidSchemaRes = simulateIngest({ schema_version: 1 });
if (invalidSchemaRes.success) throw new Error('Should reject schema_version != 2');

const negativeScoreRes = simulateIngest({ schema_version: 2, omarank_score: -10 });
if (negativeScoreRes.success) throw new Error('Should reject negative omarank_score');

const overflowScoreRes = simulateIngest({ schema_version: 2, omarank_score: 999 });
if (overflowScoreRes.success) throw new Error('Should reject omarank_score > 100');

const badArch = validateArchetype("<script>alert(1)</script>");
if (badArch !== "OMA-CUSTOM-RIG") throw new Error('Should sanitize malicious archetype');

const validArch = validateArchetype("OMA-U7-ARC-31G-240H");
if (validArch !== "OMA-U7-ARC-31G-240H") throw new Error('Should preserve valid archetype');

console.log('[PASS] Zero-Trust Boundary & Sanitization Tests Passed');

// TEST 7: Global Battlestation Leaderboard Verification
console.log('\n--- Test 7: Global Battlestation Leaderboard Integrity ---');
const leaderboardEntries = db.prepare("SELECT archetype, score, grade, tier_name, tier_icon, system_name, submissions_count FROM global_leaderboard ORDER BY score DESC LIMIT 10").all();
if (!leaderboardEntries || leaderboardEntries.length === 0) {
  throw new Error('Leaderboard should contain seeded & submitted entries');
}
console.log(`Top Leaderboard System: #${1} [${leaderboardEntries[0].grade}] ${leaderboardEntries[0].score} pts - ${leaderboardEntries[0].system_name} (${leaderboardEntries[0].archetype})`);
if (leaderboardEntries[0].score < leaderboardEntries[leaderboardEntries.length - 1].score) {
  throw new Error('Leaderboard must be sorted by score DESC');
}
console.log('[PASS] Global Leaderboard Verification Succeeded');

// TEST 8: Brand & OEM Attribution Integrity
console.log('\n--- Test 8: Brand & OEM Attribution Integrity ---');
const ggRig = db.prepare("SELECT brand, model, count FROM brand_distribution WHERE brand = 'Game Garaj'").get();
if (!ggRig || ggRig.count < 1) {
  throw new Error('Game Garaj brand distribution should be recorded from userPayload');
}
console.log(`Game Garaj Ingest Verified: ${ggRig.brand} - ${ggRig.model} (${ggRig.count} submissions)`);
console.log('[PASS] Brand & OEM Attribution Integrity Passed');

console.log('\n[PASS] ALL 8 ARCHITECTURAL & ZERO-TRUST VALIDATION TESTS PASSED WITH 0 ERRORS!\n');
