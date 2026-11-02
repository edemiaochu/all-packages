#!/usr/bin/env node
// Extract all @itwin/@bentley dep relationships from package.json files
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(__dirname, 'dep-graph.json');

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'cjs', 'esm', 'out',
  'coverage', '.nyc_output', '__pycache__', '.cache', '.claude',
  'common', 'obj', 'bin', '.rush', '.yarn', '.turbo',
  'archive',
]);

function isRealPackageDir(fullPath) {
  return fs.existsSync(path.join(fullPath, 'package.json'));
}

const SKIP_NAMES = new Set([
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock',
]);

function walkDir(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip dirs unless they contain a package.json (real source packages)
      if (SKIP_DIRS.has(entry.name) && !isRealPackageDir(fullPath)) continue;
      walkDir(fullPath, files);
    } else if (entry.name === 'package.json') {
      const parts = fullPath.replace(/\\/g, '/').split('/');
      const hasSkippedParent = parts.slice(0, -1).some(s => SKIP_DIRS.has(s) && !isRealPackageDir(parts.slice(0, parts.indexOf(s) + 1).join('/')));
      if (!hasSkippedParent) files.push(fullPath);
    }
  }
  return files;
}

function normalizeName(name) {
  // Handle paths like D:/01Work/iTwin2026/itwinjs-core/core/bentley/package.json
  // Make them relative to ROOT
  return path.relative(ROOT, name).replaceAll(path.sep, '/');
}

const pkgFiles = walkDir(ROOT);
console.log(`Found ${pkgFiles.length} package.json files`);

const packages = {};        // name -> { name, version, private, dir, subproject }
const edges = [];           // { from, to, type }  (from depends on to)

function getSubproject(pkgPath) {
  const rel = normalizeName(pkgPath);
  const parts = rel.split('/');
  // Special case: itwinjs-core/* has extra nesting
  if (parts[0].startsWith('itwinjs')) return 'itwinjs-core';
  return parts[0];
}

for (const pkgFile of pkgFiles) {
  const content = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
  if (!content.name) continue;

  const name = content.name;
  const subproject = getSubproject(pkgFile);

  packages[name] = {
    name,
    version: content.version || '',
    private: !!content.private,
    dir: path.dirname(normalizeName(pkgFile)),
    subproject,
  };

  const collectDeps = (deps, type) => {
    if (!deps) return;
    for (const [depName] of Object.entries(deps)) {
      if (depName.startsWith('@itwin/') || depName.startsWith('@bentley/') || depName.startsWith('@iproject/')) {
        edges.push({ from: name, to: depName, type });
      }
    }
  };

  collectDeps(content.dependencies, 'dep');
  collectDeps(content.devDependencies, 'devDep');
  collectDeps(content.peerDependencies, 'peerDep');
}

console.log(`Found ${Object.keys(packages).length} unique @itwin/@bentley packages`);
console.log(`Found ${edges.length} dependency edges`);

// Deduplicate edges (keep the "strongest" dependency type: dep > peerDep > devDep)
const typePriority = { dep: 0, peerDep: 1, devDep: 2 };
const edgeMap = new Map();
for (const edge of edges) {
  const key = `${edge.from}|||${edge.to}`;
  const existing = edgeMap.get(key);
  if (!existing || typePriority[edge.type] < typePriority[existing.type]) {
    edgeMap.set(key, edge);
  }
}
const dedupedEdges = [...edgeMap.values()];
console.log(`Deduplicated to ${dedupedEdges.length} edges`);

// Collect packages resolved in pnpm-lock.yaml (skip common/ dir = rush caches)
function collectLockPackages() {
  const resolved = new Set();
  const SKIP_LOCK_DIRS = new Set(['node_modules', '.git']);
  function scanDir(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory() && !SKIP_LOCK_DIRS.has(e.name)) {
        scanDir(path.join(dir, e.name));
      }
    }
    const lockPath = path.join(dir, 'pnpm-lock.yaml');
    if (fs.existsSync(lockPath)) {
      const content = fs.readFileSync(lockPath, 'utf-8');
      const re = /@(itwin|bentley|iproject)\/[a-z0-9._-]+/g;
      let m;
      while ((m = re.exec(content)) !== null) resolved.add(m[0]);
    }
  }
  scanDir(ROOT);
  return resolved;
}

const lockPackages = collectLockPackages();
console.log(`Resolved packages in pnpm-lock: ${lockPackages.size}`);

// Filter edges: external package must exist in pnpm-lock
const filteredEdges = dedupedEdges.filter(e => {
  if (packages[e.to]) return true;           // internal
  if (lockPackages.has(e.to)) return true;   // external but resolved
  return false;
});
const skippedEdges = dedupedEdges.length - filteredEdges.length;
if (skippedEdges > 0) {
  const skippedPkgs = new Set();
  for (const e of dedupedEdges) {
    if (!packages[e.to] && !lockPackages.has(e.to)) skippedPkgs.add(e.to);
  }
  console.log(`Skipped ${skippedEdges} edges to unresolvable packages:`);
  for (const p of skippedPkgs) console.log(`  ${p}`);
}

// Only keep packages that have dependencies or are depended upon
const referenced = new Set();
for (const e of filteredEdges) {
  referenced.add(e.from);
  referenced.add(e.to);
}
const relevantPackages = {};
for (const [name, pkg] of Object.entries(packages)) {
  if (referenced.has(name)) {
    relevantPackages[name] = pkg;
  }
}
console.log(`Relevant packages (in dependency graph): ${Object.keys(relevantPackages).length}`);

// Filter out private packages with zero inbound edges (test apps, examples, monorepo roots)
const privateNoInbound = new Set();
const indegreeAll = {};
for (const e of filteredEdges) {
  indegreeAll[e.to] = (indegreeAll[e.to] || 0) + 1;
}
for (const [name, pkg] of Object.entries(relevantPackages)) {
  if (pkg.private && !indegreeAll[name]) {
    privateNoInbound.add(name);
  }
}
if (privateNoInbound.size > 0) {
  for (const name of privateNoInbound) delete relevantPackages[name];
  // Remove edges originating from removed packages
  const before = filteredEdges.length;
  const remainingEdges = filteredEdges.filter(e => !privateNoInbound.has(e.from));
  filteredEdges.length = 0;
  filteredEdges.push(...remainingEdges);
  console.log(`Filtered ${privateNoInbound.size} private packages with no dependents (${before - remainingEdges.length} edges removed)`);
}

// Compute topological order using Kahn's algorithm
function computeTopoOrder(pkgs, edges) {
  const inDegree = {};
  const outEdges = {};

  for (const name of Object.keys(pkgs)) {
    inDegree[name] = 0;
    outEdges[name] = [];
  }

  for (const { from, to } of edges) {
    if (!(from in inDegree)) inDegree[from] = 0;
    if (!(to in inDegree)) inDegree[to] = 0;
    if (!(from in outEdges)) outEdges[from] = [];
    if (!(to in outEdges)) outEdges[to] = [];
    inDegree[to]++;
    outEdges[from].push(to);
  }

  // Kahn's BFS
  const queue = [];
  for (const [name, deg] of Object.entries(inDegree)) {
    if (deg === 0) queue.push(name);
  }

  const order = [];
  while (queue.length > 0) {
    queue.sort(); // Deterministic
    const node = queue.shift();
    order.push(node);
    for (const neighbor of (outEdges[node] || [])) {
      if (--inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  const remaining = Object.entries(inDegree).filter(([, d]) => d > 0);
  if (remaining.length > 0) {
    console.warn(`Warning: ${remaining.length} packages in cycles or with unknown deps`);
  }

  return order;
}

const topoOrder = computeTopoOrder(relevantPackages, filteredEdges);
console.log(`Topological order: ${topoOrder.length} packages`);

// Recursive depth: layer = max(layer of deps) + 1, Layer 0 = no internal deps
const depth = {};
function computeDepth(name, visited = new Set()) {
  if (depth[name] !== undefined) return depth[name];
  if (visited.has(name)) { depth[name] = 0; return 0; }
  visited.add(name);
  let maxDep = -1;
  for (const e of filteredEdges) {
    if (e.from === name) {
      maxDep = Math.max(maxDep, computeDepth(e.to, visited));
    }
  }
  depth[name] = maxDep + 1;
  return depth[name];
}
for (const name of topoOrder) {
  if (depth[name] === undefined) computeDepth(name);
}

// Group by subproject
const subprojects = {};
for (const [name, pkg] of Object.entries(relevantPackages)) {
  const sp = pkg.subproject;
  if (!subprojects[sp]) subprojects[sp] = { packages: [], order: 0 };
  subprojects[sp].packages.push(name);
}

// Order subprojects by their earliest package in topo order
for (const [spName, sp] of Object.entries(subprojects)) {
  sp.order = Math.min(...sp.packages.map(p => topoOrder.indexOf(p)).filter(i => i >= 0));
}

// Mark external packages with ≤2 internal dependents as "edge" (边缘)
const externalIndegree = {};
for (const e of filteredEdges) {
  if (!relevantPackages[e.to]) {
    externalIndegree[e.to] = (externalIndegree[e.to] || 0) + 1;
  }
}
const edgeExternal = new Set();
for (const [name, count] of Object.entries(externalIndegree)) {
  if (count <= 2) edgeExternal.add(name);
}

const output = {
  generatedAt: new Date().toISOString(),
  root: ROOT,
  stats: {
    totalPackages: Object.keys(relevantPackages).length,
    totalEdges: filteredEdges.length,
    topologicalLayers: Math.max(...Object.values(depth)),
    externalCount: Object.keys(externalIndegree).length,
    edgeExternalCount: edgeExternal.size,
  },
  packages: Object.fromEntries(
    Object.entries(relevantPackages).sort(([, a], [, b]) => a.name.localeCompare(b.name))
  ),
  edges: filteredEdges.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to)),
  topologicalOrder: topoOrder,
  // Group packages by topological depth (layer)
  layers: (() => {
    const layerMap = {};
    for (const [name, d] of Object.entries(depth)) {
      if (!layerMap[d]) layerMap[d] = [];
      layerMap[d].push(name);
    }
    return layerMap;
  })(),
  subprojects: Object.fromEntries(
    Object.entries(subprojects).sort(([, a], [, b]) => a.order - b.order)
  ),
  edgeExternal: [...edgeExternal].sort(),
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
console.log(`\nWritten to ${OUTPUT}`);
console.log(`\nLayer breakdown:`);
for (let i = 0; i <= output.stats.topologicalLayers; i++) {
  const count = output.layers[i] ? output.layers[i].length : 0;
  console.log(`  Layer ${i}: ${count} packages`);
}
console.log(`\nSubproject dependency order:`);
for (const [spName, sp] of Object.entries(output.subprojects)) {
  console.log(`  ${spName.padEnd(28)} — ${sp.packages.length} packages`);
}
