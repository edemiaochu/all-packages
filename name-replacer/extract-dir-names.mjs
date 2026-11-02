// Extract FULL directory names containing brand words → merge into brand-words.json
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BRAND_WORDS_PATH = join(__dirname, 'brand-words.json');

const SKIP = new Set([
  'node_modules','.git','dist','build','lib','out',
  'coverage','.nyc_output','__pycache__','.cache','.claude',
  'common','obj','bin','.rush','.yarn','.turbo','archive',
  'name-replacer','.vscode','.github','.devcontainer','.husky','.changeset',
]);

const BRANDS = ['itwin','imodel','bentley'];
const dirNames = [];

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory() || SKIP.has(e.name)) continue;
    const lower = e.name.toLowerCase();
    for (const b of BRANDS) {
      if (lower.includes(b)) {
        dirNames.push(e.name);
        break;
      }
    }
    walk(join(dir, e.name));
  }
}

console.time('scan');
walk(ROOT);
console.timeEnd('scan');

const unique = [...new Set(dirNames)].sort();
console.log('目录名(' + unique.length + '个):');
unique.forEach(n => console.log('  ' + n));

// Merge into brand-words.json
const bw = JSON.parse(readFileSync(BRAND_WORDS_PATH, 'utf-8'));

function categorize(name) {
  const lower = name.toLowerCase();
  const cats = [];
  if (lower.includes('itwin')) cats.push('iTwin');
  if (lower.includes('imodel')) cats.push('iModel');
  if (lower.includes('bentley')) cats.push('Bentley');
  return cats;
}

let added = 0;
for (const name of unique) {
  for (const cat of categorize(name)) {
    const arr = bw.identifiers[cat];
    if (!arr.includes(name)) {
      arr.push(name);
      added++;
    }
  }
}

// Sort each category
for (const cat of ['iTwin','iModel','Bentley']) {
  bw.identifiers[cat] = [...new Set(bw.identifiers[cat])].sort();
}

bw.summary.byBrand = {};
for (const cat of ['iTwin','iModel','Bentley']) {
  bw.summary.byBrand[cat] = bw.identifiers[cat].length;
}
bw.summary.totalUniqueIdentifiers = new Set([
  ...bw.identifiers.iTwin, ...bw.identifiers.iModel, ...bw.identifiers.Bentley
]).size;
bw.generatedAt = new Date().toISOString();

writeFileSync(BRAND_WORDS_PATH, JSON.stringify(bw, null, 2) + '\n');
console.log('\n新增: ' + added + ', 总计: ' + bw.summary.totalUniqueIdentifiers);
console.log('已写入 brand-words.json（请用 server.mjs 重新生成 name-mapping）');
