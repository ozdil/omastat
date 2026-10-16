// Minimal Cloudflare D1 binding backed by node:sqlite, with the migrations applied.
// Covers the subset src/index.ts uses: prepare().bind().first()/all()/run() and batch().
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../migrations');

class Statement {
  constructor(db, sql, args = []) {
    this.db = db;
    this.sql = sql;
    this.args = args;
  }
  bind(...args) {
    return new Statement(this.db, this.sql, args);
  }
  async first(column) {
    const row = this.db.prepare(this.sql).get(...this.args);
    if (!row) return null;
    return column ? row[column] : { ...row };
  }
  async all() {
    return { results: this._all(), success: true };
  }
  async run() {
    return this._run();
  }
  _all() {
    return this.db.prepare(this.sql).all(...this.args).map((r) => ({ ...r }));
  }
  _run() {
    this.db.prepare(this.sql).run(...this.args);
    return { results: [], success: true };
  }
}

export function createD1() {
  const db = new DatabaseSync(':memory:');
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(resolve(migrationsDir, file), 'utf8'));
  }
  return {
    raw: db,
    prepare: (sql) => new Statement(db, sql),
    // D1 runs a batch as one transaction: all statements commit or none do
    batch: async (statements) => {
      db.exec('BEGIN');
      try {
        const out = statements.map((st) =>
          /^\s*SELECT/i.test(st.sql) ? { results: st._all(), success: true } : st._run()
        );
        db.exec('COMMIT');
        return out;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
  };
}
