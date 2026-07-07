#!/usr/bin/env node
/**
 * Auditoría DS web — detecta clases ad-hoc (gray/blue/red/green…) fuera de tokens MD3.
 * Uso: npm run audit:ds
 * Exit 1 si hay hallazgos (útil en CI cuando se active el gate).
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SCAN_DIRS = ['src/pages', 'src/components/layout'];
const ALLOWED = new Set(['src/lib/designSystem.ts']);

/** Paletas legacy a migrar durante el rediseño. */
const LEGACY_PATTERN =
  /\b(?:bg|text|border|ring|from|to|via|divide|placeholder|outline)-(?:gray|slate|zinc|neutral|stone|red|blue|green|yellow|orange|amber|purple|indigo|pink|rose|emerald|lime|teal|cyan|sky|violet|fuchsia)-(?:\d{2,3}|50)\b/g;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) files.push(full);
  }
  return files;
}

const findings = [];

for (const relDir of SCAN_DIRS) {
  const abs = path.join(ROOT, relDir);
  for (const file of await walk(abs)) {
    const rel = path.relative(ROOT, file);
    const content = await readFile(file, 'utf8');
    const matches = content.match(LEGACY_PATTERN);
    if (matches?.length) {
      const unique = [...new Set(matches)].sort();
      findings.push({ file: rel, count: matches.length, samples: unique.slice(0, 8) });
    }
  }
}

if (findings.length === 0) {
  console.log('✓ audit:ds — sin clases legacy en pages/ y layout/');
  process.exit(0);
}

console.log('⚠ audit:ds — clases legacy pendientes de migrar a tokens MD3:\n');
for (const f of findings.sort((a, b) => b.count - a.count)) {
  console.log(`  ${f.file} (${f.count} usos)`);
  console.log(`    ej: ${f.samples.join(', ')}`);
}
console.log('\nMigrar con `import { ds } from "../lib/designSystem"` — ver docs/DESIGN-SYSTEM.md § Preparación rediseño.');
process.exit(1);
