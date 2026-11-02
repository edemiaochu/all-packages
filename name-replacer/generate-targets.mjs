#!/usr/bin/env node
// Generate targets.json from dep-graph.json — group packages by topological layer
// Classify into: dirs (replace + publish) and replaceOnly (replace only, no publish)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'dep-graph.json'), 'utf-8'));

const { packages, layers } = DATA;
const maxLayer = DATA.stats.topologicalLayers; // 11

// ── Classification ──────────────────────────────────────────────────────
function isReplaceOnly(pkg) {
  const dir = pkg.dir;
  if (dir.includes('/tests/')) return true;   // test packages
  if (dir.includes('/samples/')) return true; // sample code
  if (dir.includes('/apps/')) return true;    // application endpoints
  if (pkg.private) return true;               // private packages
  return false;
}

const targets = [];
let totalPublish = 0, totalReplaceOnly = 0;

for (let l = 0; l <= maxLayer; l++) {
  const names = layers[l] || [];
  const dirs = [];
  const replaceOnly = [];

  for (const name of names) {
    if (!packages[name]) continue; // skip external
    const pkg = packages[name];
    if (isReplaceOnly(pkg)) {
      replaceOnly.push(pkg.dir);
    } else {
      dirs.push(pkg.dir);
    }
  }

  totalPublish += dirs.length;
  totalReplaceOnly += replaceOnly.length;

  let note;
  if (l === 0) {
    note = `Layer 0 — 基础层：不依赖任何内部包，构建起点（${dirs.length}发布 + ${replaceOnly.length}仅替换）`;
  } else if (l === maxLayer) {
    note = `Layer ${l} — 应用层：依赖链最深（${dirs.length}发布 + ${replaceOnly.length}仅替换）`;
  } else {
    note = `Layer ${l} — 依赖 Layer 0~${l - 1}（${dirs.length}发布 + ${replaceOnly.length}仅替换）`;
  }

  targets.push({ dirs, replaceOnly, note });
}

fs.writeFileSync(
  path.join(__dirname, 'targets.json'),
  JSON.stringify(targets, null, 2) + '\n'
);

console.log(`Written targets.json: ${targets.length} layers`);
console.log(`  发布: ${totalPublish}  仅替换不发布: ${totalReplaceOnly}  合计: ${totalPublish + totalReplaceOnly}`);
console.log();
for (const t of targets) {
  const pubStr = `${t.dirs.length}发布`;
  const roStr = t.replaceOnly.length > 0 ? ` + ${t.replaceOnly.length}仅替换` : '';
  console.log(`  ${t.note}`);
  if (t.replaceOnly.length > 0) {
    for (const d of t.replaceOnly) {
      console.log(`    [仅替换] ${d}`);
    }
  }
}
