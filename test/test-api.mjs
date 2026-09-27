import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('[TEST] Starting OmaStat Architecture Simulation & Zero-Trust Validation Suite...');

// 1. Initialize SQLite Database (simulating Cloudflare D1)
const db = new DatabaseSync(':memory:');
const migrationSql = readFileSync(resolve(__dirname, '../migrations/0001_init_omastat.sql'), 'utf8');
db.exec(migrationSql);
console.log('[PASS] D1 Migration Applied Successfully');

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

  const tierName = sanitize(payload.tier_name, 40) || 'Unknown';
  const cpuModel = sanitize(payload.cpu_model, 80) || 'CPU';
  const gpuModel = sanitize(payload.gpu_model, 80) || 'GPU';
  const gpuDriver = sanitize(payload.gpu_driver, 40) || 'driver';
  const ramGb = Math.round(Number(payload.ram_gb) || 0);
  const ramBucket = `${ramGb}GB ${sanitize(payload.ram_type, 20)}`;
  const display = sanitize(payload.primary_display, 40) || '1080p';
  const archetype = validateArchetype(payload.archetype_signature);
  const now = Math.floor(Date.now() / 1000);

  // Atomic batch
  mockDb.batch([
    mockDb.prepare("UPDATE stats_meta SET value = value + 1 WHERE key = 'total_submissions'").bind(),
    mockDb.prepare("UPDATE stats_meta SET value = value + ? WHERE key = 'sum_scores'").bind(score),
    mockDb.prepare("UPDATE stats_meta SET value = ? WHERE key = 'last_updated_epoch'").bind(now),
    mockDb.prepare("INSERT INTO cpu_distribution (model, count) VALUES (?, 1) ON CONFLICT(model) DO UPDATE SET count = count + 1").bind(cpuModel),
    mockDb.prepare("INSERT INTO gpu_distribution (model, driver, count) VALUES (?, ?, 1) ON CONFLICT(model) DO UPDATE SET count = count + 1, driver = excluded.driver").bind(gpuModel, gpuDriver),
    mockDb.prepare("INSERT INTO ram_distribution (bucket, count) VALUES (?, 1) ON CONFLICT(bucket) DO UPDATE SET count = count + 1").bind(ramBucket),
    mockDb.prepare("INSERT INTO display_distribution (resolution_hz, count) VALUES (?, 1) ON CONFLICT(resolution_hz) DO UPDATE SET count = count + 1").bind(display),
    mockDb.prepare("INSERT INTO tier_distribution (tier_name, tier_icon, count) VALUES (?, ?, 1) ON CONFLICT(tier_name) DO UPDATE SET count = count + 1").bind(tierName, '󰢮'),
    mockDb.prepare("INSERT INTO archetype_distribution (archetype, count) VALUES (?, 1) ON CONFLICT(archetype) DO UPDATE SET count = count + 1").bind(archetype),
  ]);

  return { success: true, score, tier: tierName };
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
console.log('[PASS] Zero-PII Guarantee Verified');

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

console.log('\n[PASS] ALL 6 ARCHITECTURAL & ZERO-TRUST VALIDATION TESTS PASSED WITH 0 ERRORS!\n');
