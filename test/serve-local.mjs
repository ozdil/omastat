import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new DatabaseSync(':memory:');
const migrationSql = readFileSync(resolve(__dirname, '../migrations/0001_init_omastat.sql'), 'utf8');
db.exec(migrationSql);

const dashboardHtml = readFileSync(resolve(__dirname, '../src/dashboard.html'), 'utf8');

function sanitize(str, maxLen = 80) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\x00-\x1f\x7f-\x9f<>&`'"\\]/g, '').trim().slice(0, maxLen);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/health' || url.pathname === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'omastat', version: '1.0.0' }));
    return;
  }

  if (url.pathname === '/' || url.pathname === '/stats' || url.pathname === '/dashboard') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(dashboardHtml);
    return;
  }

  if (url.pathname === '/api/stats/v1' && req.method === 'GET') {
    const metaRows = db.prepare("SELECT key, value FROM stats_meta").all();
    const meta = {};
    for (const r of metaRows) meta[r.key] = r.value;
    const total = meta['total_submissions'] || 0;
    const avgScore = total > 0 ? Math.round((meta['sum_scores'] || 0) / total) : 0;

    const calcPct = (c) => total > 0 ? Number(((c / total) * 100).toFixed(1)) : 0;
    const getList = (table, col, extraCols = '') =>
      db.prepare(`SELECT ${col} ${extraCols ? ',' + extraCols : ''}, count FROM ${table} ORDER BY count DESC LIMIT 8`)
        .all()
        .map(r => ({ ...r, percentage: calcPct(r.count) }));

    const data = {
      total_submissions: total,
      average_score: avgScore,
      average_tier: avgScore > 80 ? '🚀 Cyberpunk Beast' : '🏎️ Gaming Chair Missing',
      top_cpus: getList('cpu_distribution', 'model'),
      top_gpus: getList('gpu_distribution', 'model', 'driver'),
      ram_breakdown: getList('ram_distribution', 'bucket'),
      display_breakdown: getList('display_distribution', 'resolution_hz'),
      tier_distribution: getList('tier_distribution', 'tier_name', 'tier_icon'),
      top_archetypes: getList('archetype_distribution', 'archetype'),
      last_updated: new Date((meta['last_updated_epoch'] || 0) * 1000).toISOString()
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
    return;
  }

  if (url.pathname === '/api/survey/v1' && req.method === 'POST') {
    let bodyText = '';
    req.on('data', chunk => {
      bodyText += chunk;
      if (bodyText.length > 16384) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const body = JSON.parse(bodyText);
        if (body.schema_version !== 2) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid schema version' }));
          return;
        }

        const score = Math.max(0, Math.min(100, Number(body.omarank_score) || 0));
        const tier = sanitize(body.tier_name, 40) || 'Unknown';
        const cpu = sanitize(body.cpu_model, 80);
        const gpu = sanitize(body.gpu_model, 80);
        const ram = `${Math.round(body.ram_gb)}GB ${sanitize(body.ram_type, 20)}`;
        const disp = sanitize(body.primary_display, 40);
        const arch = sanitize(body.archetype_signature, 50) || 'OMA-UNKNOWN';
        const now = Math.floor(Date.now() / 1000);

        db.prepare("UPDATE stats_meta SET value = value + 1 WHERE key = 'total_submissions'").run();
        db.prepare("UPDATE stats_meta SET value = value + ? WHERE key = 'sum_scores'").run(score);
        db.prepare("UPDATE stats_meta SET value = ? WHERE key = 'last_updated_epoch'").run(now);
        db.prepare("INSERT INTO cpu_distribution (model, count) VALUES (?, 1) ON CONFLICT(model) DO UPDATE SET count = count + 1").run(cpu);
        db.prepare("INSERT INTO gpu_distribution (model, driver, count) VALUES (?, ?, 1) ON CONFLICT(model) DO UPDATE SET count = count + 1").run(gpu, sanitize(body.gpu_driver, 40));
        db.prepare("INSERT INTO ram_distribution (bucket, count) VALUES (?, 1) ON CONFLICT(bucket) DO UPDATE SET count = count + 1").run(ram);
        db.prepare("INSERT INTO display_distribution (resolution_hz, count) VALUES (?, 1) ON CONFLICT(resolution_hz) DO UPDATE SET count = count + 1").run(disp);
        db.prepare("INSERT INTO tier_distribution (tier_name, tier_icon, count) VALUES (?, ?, 1) ON CONFLICT(tier_name) DO UPDATE SET count = count + 1").run(tier, '🏎️');
        db.prepare("INSERT INTO archetype_distribution (archetype, count) VALUES (?, 1) ON CONFLICT(archetype) DO UPDATE SET count = count + 1").run(arch);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Successfully submitted anonymous hardware profile to OmaStat survey!',
          score,
          tier
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ found: true, archetype: arch, count: row.count, percentage: ((row.count / total) * 100).toFixed(1) }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ found: false, archetype: arch, count: 0, percentage: 0 }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

const PORT = 8787;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`OmaStat Simulation Server listening on http://127.0.0.1:${PORT}`);
});
