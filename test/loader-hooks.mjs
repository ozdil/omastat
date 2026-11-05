import { readFileSync } from 'node:fs';

// Synchronous hooks for module.registerHooks() (in-thread; replaces the deprecated module.register()).

// Worker sources use bundler-style extensionless imports ("./tiers"); map them to .ts.
export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts') && !/\.[a-z]+$/i.test(specifier)) {
    return nextResolve(specifier + '.ts', context);
  }
  return nextResolve(specifier, context);
}

export function load(url, context, nextLoad) {
  if (url.endsWith('.html')) {
    const text = readFileSync(new URL(url), 'utf8');
    return { format: 'module', source: `export default ${JSON.stringify(text)};`, shortCircuit: true };
  }
  if (url.endsWith('.ts')) {
    return nextLoad(url, { ...context, format: 'module-typescript' });
  }
  return nextLoad(url, context);
}
