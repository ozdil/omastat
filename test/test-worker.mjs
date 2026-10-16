// Runs the real Worker (src/index.ts) against an in-memory D1 shim.
// Usage: node --import ./test/register-hooks.mjs test/test-worker.mjs
import assert from 'node:assert/strict';
import { createD1 } from './d1-shim.mjs';

const { default: worker } = await import('../src/index.ts');

const env = { DB: createD1() };
const BASE = 'https://omastat.test';

async function call(path, init) {
  const res = await worker.fetch(new Request(BASE + path, init), env, {});
  const body = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  return { status: res.status, body, headers: res.headers };
}

function post(payload, raw) {
  return call('/api/survey/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ?? JSON.stringify(payload),
  });
}

const base = {
  schema_version: 2,
  timestamp_epoch: Math.floor(Date.now() / 1000),
  omarank_score: 62,
  tier_name: 'Gaming Chair Missing',
  cpu_model: 'Intel(R) Core(TM) Ultra 7 155H',
  cpu_cores: 16,
  cpu_threads: 22,
  gpu_model: 'Intel Corporation Meteor Lake-P [Intel Arc Graphics]',
  gpu_driver: 'i915',
  ram_gb: 31.1,
  ram_type: 'DDR5',
  ram_speed_mts: 5600,
  mobo_vendor: 'GAME GARAJ',
  mobo_name: 'SLAYER 4 ULTRA',
  chipset: 'Intel Meteor Lake SoC',
  primary_display: '2560x1600 @ 240Hz',
  display_count: 1,
  storage_type: 'NVMe PCIe Gen4/5 SSD',
  storage_model: 'Samsung SSD 990 PRO 4TB',
  os_name: 'Omarchy',
  archetype_signature: 'OMA-U7-ARC-31G-240H',
};

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`[PASS] ${name}`);
}

await test('health endpoint', async () => {
  const r = await call('/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.status, 'ok');
});

await test('dashboard is served with CSP', async () => {
  const r = await call('/dashboard');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy'), /default-src 'none'/);
  assert.match(r.body, /<html/i);
});

await test('valid OmaRank payload is accepted', async () => {
  const r = await post(base);
  assert.equal(r.status, 200);
  assert.equal(r.body.success, true);
  assert.equal(r.body.grade, 'B');
});

await test('missing / null / string omarank_score is rejected (was silently stored as 0)', async () => {
  for (const omarank_score of [undefined, null, '', '50', true]) {
    const r = await post({ ...base, omarank_score });
    assert.equal(r.status, 400, `score=${JSON.stringify(omarank_score)}`);
  }
});

await test('out-of-range score, wrong schema and broken JSON are rejected', async () => {
  assert.equal((await post({ ...base, omarank_score: 101 })).status, 400);
  assert.equal((await post({ ...base, omarank_score: -1 })).status, 400);
  assert.equal((await post({ ...base, schema_version: 1 })).status, 400);
  assert.equal((await post(null, '{not json')).status, 400);
  assert.equal((await post(null, 'x'.repeat(17000))).status, 413);
});

await test('leaderboard row is fully refreshed when a higher score arrives', async () => {
  const arch = 'OMA-R7-4070-32G-165H';
  await post({ ...base, archetype_signature: arch, omarank_score: 50, tier_name: 'Honest Daily Driver' });
  await post({ ...base, archetype_signature: arch, omarank_score: 80, tier_name: 'Cyberpunk Beast', gpu_model: 'NVIDIA GeForce RTX 4070' });
  const row = env.DB.raw.prepare('SELECT * FROM global_leaderboard WHERE archetype = ?').get(arch);
  assert.equal(row.score, 80);
  assert.equal(row.grade, 'A');
  assert.equal(row.tier_name, 'Cyberpunk Beast');
  assert.equal(row.gpu_model, 'NVIDIA GeForce RTX 4070');
  assert.equal(row.submissions_count, 2);
});

await test('a lower score never downgrades the leaderboard row', async () => {
  const arch = 'OMA-R7-4070-32G-165H';
  await post({ ...base, archetype_signature: arch, omarank_score: 30, tier_name: 'Study Mode Only' });
  const row = env.DB.raw.prepare('SELECT * FROM global_leaderboard WHERE archetype = ?').get(arch);
  assert.equal(row.score, 80);
  assert.equal(row.tier_name, 'Cyberpunk Beast');
  assert.equal(row.submissions_count, 3);
});

await test('a back-dated timestamp cannot move last_updated backwards', async () => {
  const before = env.DB.raw.prepare("SELECT value FROM stats_meta WHERE key='last_updated_epoch'").get().value;
  await post({ ...base, timestamp_epoch: Math.floor(Date.now() / 1000) - 6 * 86400 });
  const after = env.DB.raw.prepare("SELECT value FROM stats_meta WHERE key='last_updated_epoch'").get().value;
  assert.ok(after >= before);
});

await test('seeded leaderboard rows have tiers/grades that match their score', async () => {
  const row = env.DB.raw.prepare("SELECT * FROM global_leaderboard WHERE archetype = 'OMA-R9-4090-64G-360H'").get();
  assert.equal(row.tier_name, 'Cosmic Reality Simulator');
  assert.equal(row.grade, 'S+');
  assert.equal(row.tier_icon, '\u{F091}');
});

await test('archetype lookup: case-insensitive, numeric percentage', async () => {
  const r = await call('/api/archetype/oma-u7-arc-31g-240h');
  assert.equal(r.status, 200);
  assert.equal(r.body.found, true);
  assert.equal(r.body.archetype, 'OMA-U7-ARC-31G-240H');
  assert.equal(typeof r.body.percentage, 'number');
});

await test('archetype lookup: malformed percent-encoding is a 400, not a crash', async () => {
  const r = await call('/api/archetype/%E0%A4%A');
  assert.equal(r.status, 400);
});

await test('archetype lookup: garbage input does not match the OMA-CUSTOM-RIG bucket', async () => {
  await post({ ...base, archetype_signature: '<script>' }); // lands in OMA-CUSTOM-RIG
  const r = await call('/api/archetype/hello');
  assert.equal(r.body.found, false);
});

await test('brand detection: HP/MSI need a whole word, product_name is used for laptops', async () => {
  const sys = (p) => post({ ...base, archetype_signature: 'OMA-CPU-GPU-8G-60H', ...p });
  await sys({ mobo_vendor: 'PHOENIX TECHNOLOGIES', mobo_name: 'Custom Board' });
  await sys({ mobo_vendor: 'LENOVO', system_vendor: 'LENOVO', mobo_name: '21HMCTO1WW', product_name: 'ThinkPad X1 Carbon Gen 11' });
  const brands = env.DB.raw.prepare('SELECT brand, model FROM brand_distribution').all();
  assert.ok(!brands.some((b) => b.brand === 'HP'), 'PHOENIX must not be classified as HP');
  assert.ok(brands.some((b) => b.brand === 'Lenovo' && b.model === 'ThinkPad X1 Carbon Gen 11'));
});

await test('stats endpoint aggregates and stays consistent', async () => {
  const r = await call('/api/stats/v1');
  assert.equal(r.status, 200);
  const total = env.DB.raw.prepare("SELECT value FROM stats_meta WHERE key='total_submissions'").get().value;
  assert.equal(r.body.total_submissions, total);
  assert.ok(r.body.leaderboard.length > 0);
  for (let i = 1; i < r.body.leaderboard.length; i++) {
    assert.ok(r.body.leaderboard[i - 1].score >= r.body.leaderboard[i].score);
  }
  assert.equal(r.body.top_cpus[0].model.includes('Intel(R)'), false);
});

await test('unknown route is 404 and OPTIONS is a CORS preflight', async () => {
  assert.equal((await call('/nope')).status, 404);
  const pre = await worker.fetch(new Request(BASE + '/api/survey/v1', { method: 'OPTIONS' }), env, {});
  assert.equal(pre.status, 204);
});

console.log(`\n[PASS] ${passed} worker tests passed against src/index.ts\n`);
