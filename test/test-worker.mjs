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

const totalSubmissions = () => env.DB.raw.prepare("SELECT value FROM stats_meta WHERE key='total_submissions'").get().value;

await test('grade letters follow the tier scale (S+ S A B C D E F)', async () => {
  const cases = [[100, 'S+'], [96, 'S+'], [95.9, 'S'], [89, 'S'], [76, 'A'], [61, 'B'], [46, 'C'], [31, 'D'], [16, 'E'], [15.9, 'F'], [0, 'F']];
  for (const [omarank_score, grade] of cases) {
    const r = await post({ ...base, omarank_score });
    assert.equal(r.body.grade, grade, `score ${omarank_score}`);
  }
});

await test('the client tier_name is ignored; the tier is derived from the score', async () => {
  const r = await post({ ...base, omarank_score: 40, tier_name: 'Cosmic Reality Simulator' });
  assert.equal(r.body.tier, 'Budget Warrior');
});

await test('install_token: one counted submission per machine per month', async () => {
  const install_token = 'a'.repeat(32);
  const before = totalSubmissions();
  const first = await post({ ...base, install_token });
  assert.equal(first.body.counted, true);
  const second = await post({ ...base, install_token });
  assert.equal(second.status, 200);
  assert.equal(second.body.success, true);
  assert.equal(second.body.counted, false);
  assert.equal(totalSubmissions(), before + 1);
  // A malformed token is ignored (treated like an old client without one)
  const bad = await post({ ...base, install_token: 'not-a-token' });
  assert.equal(bad.body.counted, true);
});

await test('install_token: tokens from earlier months are forgotten', async () => {
  env.DB.raw.prepare("INSERT INTO submission_tokens (token, month) VALUES (?, '2000-01')").run('b'.repeat(32));
  await post(base);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM submission_tokens WHERE month = '2000-01'").get().n, 0);
});

await test('implausible score is counted but kept off the leaderboard', async () => {
  const arch = 'OMA-I3-1050-8G-60H';
  const before = totalSubmissions();
  const r = await post({
    ...base,
    archetype_signature: arch,
    omarank_score: 99,
    cpu_cores: 4,
    cpu_threads: 4,
    gpu_model: 'NVIDIA GeForce GTX 1050',
    ram_gb: 8,
    ram_type: 'DDR4',
    ram_speed_mts: 2666,
    chipset: 'Intel H310',
    primary_display: '1920x1080 @ 60Hz',
    storage_type: 'HDD',
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.counted, true);
  assert.equal(r.body.leaderboard, false);
  assert.equal(totalSubmissions(), before + 1);
  assert.equal(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM global_leaderboard WHERE archetype = ?').get(arch).n, 0);
});

await test('a top-end rig can still reach S+', async () => {
  const r = await post({
    ...base,
    archetype_signature: 'OMA-R9-5090-64G-240H',
    omarank_score: 97,
    cpu_cores: 16,
    cpu_threads: 32,
    gpu_model: 'NVIDIA GeForce RTX 5090',
    ram_gb: 64,
    ram_speed_mts: 6000,
    chipset: 'AMD X870E',
    primary_display: '3840x2160 @ 240Hz',
  });
  assert.equal(r.body.leaderboard, true);
  assert.equal(r.body.grade, 'S+');
});

await test('seed rows are flagged demo and replaced by the first real submission', async () => {
  const arch = 'OMA-R5-3060-16G-144H';
  const seed = env.DB.raw.prepare('SELECT * FROM global_leaderboard WHERE archetype = ?').get(arch);
  assert.equal(seed.is_demo, 1);
  await post({ ...base, archetype_signature: arch, omarank_score: 40, gpu_model: 'NVIDIA GeForce RTX 3060', cpu_model: 'AMD Ryzen 5 5600X' });
  const row = env.DB.raw.prepare('SELECT * FROM global_leaderboard WHERE archetype = ?').get(arch);
  assert.equal(row.is_demo, 0);
  assert.equal(row.score, 40, 'a real score replaces the seed even when lower');
  assert.equal(row.submissions_count, 1);
  assert.equal(row.gpu_model, 'NVIDIA GeForce RTX 3060');
});

await test('brand distribution is keyed by (brand, model)', async () => {
  const sys = (product_name) => post({ ...base, system_vendor: 'LENOVO', mobo_vendor: 'LENOVO', product_name });
  await sys('ThinkPad T14 Gen 5');
  await sys('ThinkPad T14 Gen 5');
  await sys('Legion 5 Pro');
  const rows = env.DB.raw.prepare("SELECT model, count FROM brand_distribution WHERE brand = 'Lenovo'").all();
  assert.equal(rows.find((r) => r.model === 'ThinkPad T14 Gen 5').count, 2);
  assert.equal(rows.find((r) => r.model === 'Legion 5 Pro').count, 1);
});

await test('leaderboard API: paging, total and ordering', async () => {
  const all = await call('/api/leaderboard/v1?limit=100');
  assert.equal(all.status, 200);
  assert.equal(all.body.items.length, all.body.total);
  const page1 = await call('/api/leaderboard/v1?limit=2');
  const page2 = await call('/api/leaderboard/v1?limit=2&offset=2');
  assert.equal(page1.body.items.length, 2);
  assert.deepEqual(page2.body.items.map((r) => r.archetype), all.body.items.slice(2, 4).map((r) => r.archetype));
  for (let i = 1; i < all.body.items.length; i++) {
    assert.ok(all.body.items[i - 1].score >= all.body.items[i].score);
  }
  assert.ok('is_demo' in all.body.items[0]);
  const clamped = await call('/api/leaderboard/v1?limit=5000&offset=-3');
  assert.equal(clamped.body.limit, 100);
  assert.equal(clamped.body.offset, 0);
});

await test('leaderboard API: grade filter and escaped search', async () => {
  const splus = await call('/api/leaderboard/v1?grade=s%2B');
  assert.ok(splus.body.items.length > 0);
  assert.ok(splus.body.items.every((r) => r.grade === 'S+'));
  const unknownGrade = await call('/api/leaderboard/v1?grade=Z');
  const all = await call('/api/leaderboard/v1');
  assert.equal(unknownGrade.body.total, all.body.total, 'an unknown grade is ignored');
  const rtx = await call('/api/leaderboard/v1?q=RTX%205090');
  assert.ok(rtx.body.items.some((r) => r.archetype === 'OMA-R9-5090-64G-240H'));
  for (const wildcard of ['%25', '_', '%25%25', 'rtx_5090']) {
    const r = await call(`/api/leaderboard/v1?q=${wildcard}`);
    assert.equal(r.body.total, 0, `q=${wildcard} must match literally`);
  }
});

await test('rank API: position among all counted scores', async () => {
  const total = env.DB.raw.prepare('SELECT SUM(count) AS n FROM score_histogram').get().n;
  assert.equal(total, totalSubmissions(), 'every counted submission lands in the histogram');
  const top = await call('/api/rank/v1?score=100');
  assert.equal(top.status, 200);
  assert.equal(top.body.rank, 1);
  assert.equal(top.body.total, total);
  const bottom = await call('/api/rank/v1?score=0');
  assert.ok(bottom.body.rank > top.body.rank);
  assert.equal((await call('/api/rank/v1')).status, 400);
  assert.equal((await call('/api/rank/v1?score=101')).status, 400);
  assert.equal((await call('/api/rank/v1?score=abc')).status, 400);
});

await test('rank API and stats on an empty database', async () => {
  const empty = { DB: createD1() };
  const res = await worker.fetch(new Request(BASE + '/api/rank/v1?score=50'), empty, {});
  const body = await res.json();
  assert.equal(body.total, 0);
  assert.equal(body.rank, null);
  assert.equal(body.percentile, null);
  const stats = await (await worker.fetch(new Request(BASE + '/api/stats/v1'), empty, {})).json();
  assert.equal(stats.average_grade, null);
  assert.equal(stats.average_tier, null);
  assert.deepEqual(stats.score_histogram, []);
});

await test('meta API serves the tier table and weights', async () => {
  const r = await call('/api/meta/v1');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.tiers.map((t) => t.grade), ['S+', 'S', 'A', 'B', 'C', 'D', 'E', 'F']);
  assert.equal(Object.values(r.body.weights).reduce((a, b) => a + b, 0), 100);
});

await test('stats endpoint includes the score histogram', async () => {
  const r = await call('/api/stats/v1');
  assert.ok(Array.isArray(r.body.score_histogram) && r.body.score_histogram.length > 0);
  assert.equal(r.body.score_histogram.reduce((a, b) => a + b.count, 0), r.body.total_submissions);
});

await test('survey rate limit returns 429 with Retry-After', async () => {
  const keys = [];
  const limited = {
    ...env,
    SURVEY_LIMITER: { limit: async ({ key }) => { keys.push(key); return { success: false }; } },
  };
  const res = await worker.fetch(
    new Request(BASE + '/api/survey/v1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.7' },
      body: JSON.stringify(base),
    }),
    limited,
    {}
  );
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('retry-after'), '60');
  assert.deepEqual(keys, ['203.0.113.7']);
});

await test('dashboard loads its script from /assets (no inline script, strict CSP)', async () => {
  const r = await call('/dashboard');
  assert.match(r.body, /<script src="\/assets\/dashboard\.js" defer><\/script>/);
  assert.doesNotMatch(r.body, /<script>(?!\s*<\/script>)/);
  assert.doesNotMatch(r.headers.get('content-security-policy'), /script-src[^;]*unsafe-inline/);
});

console.log(`\n[PASS] ${passed} worker tests passed against src/index.ts\n`);
