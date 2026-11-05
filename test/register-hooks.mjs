// Lets Node run the real Worker entry (src/index.ts) in tests:
// - `*.html` imports become `export default "<file contents>"` (wrangler's Text rule)
// - `*.ts` files are loaded as ES modules with types stripped
// module.registerHooks() needs Node >= 22.15 (see "engines" in package.json).
import { registerHooks } from 'node:module';
import { resolve, load } from './loader-hooks.mjs';

registerHooks({ resolve, load });
