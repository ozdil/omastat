// Lets Node run the real Worker entry (src/index.ts) in tests:
// - `*.html` imports become `export default "<file contents>"` (wrangler's Text rule)
// - `*.ts` files are loaded as ES modules with types stripped
import { register } from 'node:module';

register(new URL('./loader-hooks.mjs', import.meta.url));
