/**
 * Copies the Pyodide runtime out of node_modules and into public/pyodide.
 *
 * We self-host rather than pulling from a CDN for two reasons: a classroom's
 * wifi should only have to fetch this once, and cross-origin isolation
 * (COOP/COEP) makes third-party assets a headache we don't need.
 *
 * public/pyodide is gitignored — this script regenerates it, so it never
 * bloats the repo. Runs automatically before `dev` and `build`.
 */
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules', 'pyodide');
const target = join(root, 'public', 'pyodide');

// The minimum set needed to boot the interpreter. Package wheels (numpy and
// friends) are deliberately excluded until phase 4 asks for them.
const RUNTIME_FILES = [
  'pyodide.mjs',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
];

if (!existsSync(source)) {
  console.error('[vendor-pyodide] node_modules/pyodide is missing — run `npm install` first.');
  process.exit(1);
}

const { version } = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
const stamp = join(target, '.version');

// Skip the copy when the vendored runtime already matches the installed one.
if (existsSync(stamp) && (await readFile(stamp, 'utf8')).trim() === version) {
  console.log(`[vendor-pyodide] public/pyodide is already at ${version}`);
  process.exit(0);
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });

let bytes = 0;
for (const file of RUNTIME_FILES) {
  const from = join(source, file);
  if (!existsSync(from)) {
    console.error(`[vendor-pyodide] expected ${file} in the pyodide package but it is not there.`);
    process.exit(1);
  }
  await cp(from, join(target, file));
  bytes += (await stat(from)).size;
}

await writeFile(stamp, `${version}\n`);

const { python } = JSON.parse(await readFile(join(target, 'pyodide-lock.json'), 'utf8')).info;
console.log(
  `[vendor-pyodide] Pyodide ${version} (Python ${python}) → public/pyodide ` +
    `(${(bytes / 1024 / 1024).toFixed(1)} MB)`
);
