// Local preview server that runs the real Worker (src/index.ts) on an in-memory D1.
// Usage: npm run serve:local  ->  http://127.0.0.1:8787/dashboard
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createD1 } from './d1-shim.mjs';

// Mirrors Workers static assets: files in public/ are served before the Worker runs.
const PUBLIC_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const MIME = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

async function serveStatic(pathname) {
  const file = resolve(PUBLIC_DIR, '.' + decodeURIComponent(pathname));
  if (!file.startsWith(PUBLIC_DIR + sep) || pathname.startsWith('/_')) return null;
  try {
    return { body: await readFile(file), type: MIME[extname(file)] || 'application/octet-stream' };
  } catch {
    return null;
  }
}

const { default: worker } = await import('../src/index.ts');
const env = { DB: createD1() };
const PORT = Number(process.env.PORT) || 8787;

const server = http.createServer(async (req, res) => {
  try {
    const asset = await serveStatic(new URL(req.url, 'http://x').pathname);
    if (asset) {
      res.writeHead(200, { 'Content-Type': asset.type, 'X-Content-Type-Options': 'nosniff' });
      res.end(asset.body);
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks);
    const request = new Request(`http://${req.headers.host || `127.0.0.1:${PORT}`}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body,
    });
    const response = await worker.fetch(request, env, {});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Local server error' }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`OmaStat local server (real worker) on http://127.0.0.1:${PORT}/dashboard`);
});
