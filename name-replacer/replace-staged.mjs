#!/usr/bin/env node
// Staged replacement → publish to Verdaccio → install → test.
//
// Usage:
//   node replace-staged.mjs [--dry-run] [--replace-only] [--no-install] [--no-test] [--no-publish] [--no-build] [--no-clear-rush] [--registry <url>] --targets targets.json
//   node replace-staged.mjs [--dry-run] [--replace-only] [--no-install] [--no-test] [--no-publish] [--no-build] [--no-clear-rush] [--registry <url>] --dir <d1> --dir <d2> ...
//
// Registry (publish target), first match wins:
//   --registry <url> / --publish-url <url>
//   targets.json: { "registry": "http://host:4873/", "stages": [...] }
//   env REPLACE_STAGED_REGISTRY
//   default http://localhost:4873/
//
// Directory renaming principle:
//   Each stage's applyReplacements renames leaf target dirs (bottom-up within the target).
//   Intermediate/parent dirs above targets (e.g. packages/itwin/) are NOT reached.
//   After all stages complete, ONE comprehensive scan renames ALL remaining brand-word dirs.
//   Then rush.json gets a final sync to match the fully-renamed disk state.

import { readFileSync, existsSync, writeFileSync, renameSync, unlinkSync, readdirSync as fsReaddirSync } from 'fs';
import { join, dirname, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';
import { applyReplacements } from './apply-replace.mjs';
import { loadScanFilter } from './scan-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DEFAULT_REGISTRY = 'http://localhost:4873/';

// ── Parse CLI ───────────────────────────────────────────────────────
// --replace-only：只做内容替换（含目录改名/rush.json 同步），
// 不安装依赖、不构建、不发布、不测试，也不会启动 Verdaccio。
const REPLACE_ONLY = process.argv.includes('--replace-only');
const DRY_RUN = process.argv.includes('--dry-run');
const NO_INSTALL = REPLACE_ONLY || process.argv.includes('--no-install');
const NO_TEST = REPLACE_ONLY || process.argv.includes('--no-test');
const NO_PUBLISH = REPLACE_ONLY || process.argv.includes('--no-publish');
const NO_BUILD = REPLACE_ONLY || process.argv.includes('--no-build');
// 清空 rush.json 是为了让 rush update 重新解析依赖；不安装时没有这个必要，
// 而且中途中断会留下被清空的 rush.json，所以 --no-install / --replace-only 一律不清空
// （rush.json 仍会按磁盘实际路径同步，见 syncRushJson）。
const NO_CLEAR_RUSH = NO_INSTALL || process.argv.includes('--no-clear-rush');

// 规范化 registry：补协议、校验 http/https、统一末尾斜杠
function normalizeRegistry(input) {
  let raw = String(input || '').trim();
  if (!raw) throw new Error('registry 不能为空');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = 'http://' + raw;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('无效的 registry URL: ' + input);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('registry 只支持 http/https: ' + input);
  }
  return url.toString().replace(/\/+$/, '') + '/';
}

// 支持 `--name <value>` 和 `--name=<value>`
function getCliOptionValue(names) {
  for (let i = 2; i < process.argv.length; i++) {
    for (const name of names) {
      if (process.argv[i] === name) {
        const value = process.argv[i + 1];
        if (!value || value.startsWith('--')) throw new Error(name + ' 缺少 URL 参数');
        return value;
      }
      if (process.argv[i].startsWith(name + '=')) {
        const value = process.argv[i].slice(name.length + 1);
        if (!value) throw new Error(name + ' 缺少 URL 参数');
        return value;
      }
    }
  }
  return null;
}

const targetIdx = process.argv.indexOf('--targets');
const TARGETS_FILE = targetIdx !== -1 ? process.argv[targetIdx + 1] : null;

const dirIndices = [];
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--dir') dirIndices.push(i);
}

// targets.json 兼容两种写法：
//   [ { dirs, replaceOnly, note }, ... ]
//   { "registry": "http://...", "stages": [ ... ] }
let targetsConfig = null;
if (TARGETS_FILE) {
  try {
    targetsConfig = JSON.parse(readFileSync(TARGETS_FILE, 'utf-8'));
  } catch (e) {
    console.error('❌ 读取 targets 文件失败: ' + TARGETS_FILE + ' (' + e.message + ')');
    process.exit(1);
  }
}
const targetsIsObject = targetsConfig !== null && !Array.isArray(targetsConfig) && typeof targetsConfig === 'object';

// registry 优先级：命令行 > targets.json 顶层 registry > 环境变量 > 默认 localhost:4873
let REGISTRY;
let REGISTRY_SOURCE = 'default';
try {
  const cliRegistry = getCliOptionValue(['--registry', '--publish-url', '--publish-registry']);
  const configRegistry = targetsIsObject ? targetsConfig.registry : null;
  const envRegistry = process.env.REPLACE_STAGED_REGISTRY;
  const chosen = cliRegistry || configRegistry || envRegistry || DEFAULT_REGISTRY;
  REGISTRY_SOURCE = cliRegistry ? 'cli' : configRegistry ? 'config' : envRegistry ? 'env' : 'default';
  REGISTRY = normalizeRegistry(chosen);
} catch (e) {
  console.error('❌ ' + e.message);
  process.exit(1);
}
const CUSTOM_REGISTRY = REGISTRY_SOURCE !== 'default';

const REGISTRY_URL = new URL(REGISTRY);
const REGISTRY_PORT = REGISTRY_URL.port || (REGISTRY_URL.protocol === 'https:' ? '443' : '80');
const IS_LOCAL_REGISTRY = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(REGISTRY_URL.hostname);
// pnpm 元数据缓存目录名：host+port（默认端口时只有 host）
const REGISTRY_CACHE_KEY = REGISTRY_URL.port
  ? REGISTRY_URL.hostname + '+' + REGISTRY_URL.port
  : REGISTRY_URL.hostname;

const stages = [];
if (targetsConfig) {
  const entries = Array.isArray(targetsConfig) ? targetsConfig : (targetsConfig.stages || []);
  if (!Array.isArray(entries)) {
    console.error('❌ targets.json 的 stages 必须是数组');
    process.exit(1);
  }
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      console.error('❌ targets.json 的每个批次必须是对象');
      process.exit(1);
    }
    if (entry.dirs != null && !Array.isArray(entry.dirs)) {
      console.error('❌ 批次的 dirs 必须是数组');
      process.exit(1);
    }
    if (entry.replaceOnly != null && !Array.isArray(entry.replaceOnly)) {
      console.error('❌ 批次的 replaceOnly 必须是数组');
      process.exit(1);
    }
    stages.push({
      dirs: (entry.dirs || []).map(d => resolve(ROOT, d)),
      replaceOnly: (entry.replaceOnly || []).map(d => resolve(ROOT, d)),
      note: entry.note || '',
    });
  }
} else if (dirIndices.length > 0) {
  const dirs = dirIndices.map(i => resolve(ROOT, process.argv[i + 1])).filter(Boolean);
  stages.push({ dirs, note: '' });
} else {
  console.log('用法:');
  console.log('  node replace-staged.mjs --targets targets.json');
  console.log('  node replace-staged.mjs --targets targets.json --dry-run');
  console.log('  node replace-staged.mjs --targets targets.json --no-test');
  console.log('  node replace-staged.mjs --targets targets.json --no-publish');
  console.log('  node replace-staged.mjs --targets targets.json --no-build');
  console.log('  node replace-staged.mjs --targets targets.json --no-install');
  console.log('  node replace-staged.mjs --targets targets.json --replace-only');
  console.log('  node replace-staged.mjs --targets targets.json --no-clear-rush');
  console.log('  node replace-staged.mjs --dir <path> --dir <path> ...');
  console.log('');
  console.log('选项:');
  console.log('  --replace-only          只替换：不安装/构建/发布/测试（不清空 rush.json、不改 .npmrc、不启动 Verdaccio）');
  console.log('  --no-install            跳过所有 install（rush update / pnpm install / yarn install），不清空 rush.json');
  console.log('  --registry <url>        发布目标 registry（默认 ' + DEFAULT_REGISTRY + '）');
  console.log('                          也可在 targets.json 顶层写 "registry": "..."');
  console.log('                          或设置环境变量 REPLACE_STAGED_REGISTRY');
  console.log('  别名: --publish-url / --publish-registry');
  process.exit(0);
}

// 空批次会让后面的“全局目录改名”在没有任何目标的情况下扫描整个仓库，必须拦掉
if (stages.length === 0) {
  console.error('❌ targets 中没有批次（stages 为空）');
  process.exit(1);
}
for (let i = 0; i < stages.length; i++) {
  if (stages[i].dirs.length === 0 && stages[i].replaceOnly.length === 0) {
    console.error('❌ 第 ' + (i + 1) + ' 批没有 dirs/replaceOnly');
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function findProjectRoot(dir) {
  let d = resolve(dir);
  while (d !== ROOT && d !== dirname(d)) {
    if (existsSync(join(d, 'rush.json'))) return { root: d, mgr: 'rush' };
    if (existsSync(join(d, 'pnpm-workspace.yaml'))) return { root: d, mgr: 'pnpm' };
    // yarn / npm workspaces: package.json with "workspaces" field
    if (existsSync(join(d, 'package.json'))) {
      try {
        const pkg = JSON.parse(readFileSync(join(d, 'package.json'), 'utf-8'));
        if (pkg.workspaces) return { root: d, mgr: 'yarn' };
      } catch {}
    }
    const parent = dirname(d);
    if (parent === d) break;
    d = parent;
  }
  let d2 = resolve(dir);
  while (d2 !== ROOT && d2 !== dirname(d2)) {
    if (existsSync(join(d2, 'package.json'))) return { root: d2, mgr: 'npm' };
    const parent = dirname(d2);
    if (parent === d2) break;
    d2 = parent;
  }
  return null;
}

function getProjectName(proj) {
  return relative(ROOT, proj.root).replace(/\\/g, '/');
}

function run(cmd, cwd, label) {
  console.log('  \x1b[36m$ ' + cmd + '\x1b[0m');
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe', timeout: 300000, maxBuffer: 10 * 1024 * 1024, env: { ...process.env, HUSKY: '0', CYPRESS_INSTALL_BINARY: '0', PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1',PUPPETEER_SKIP_DOWNLOAD: 'true' } });
    if (out.trim()) console.log(out.trim().split('\n').map(l => '  ' + l).join('\n'));
    console.log('  \x1b[32m✓ ' + label + ' passed\x1b[0m');
    return true;
  } catch (e) {
    const output = (e.stdout || '') + (e.stderr || '');
    if (output.trim()) console.log(output.trim().split('\n').map(l => '  ' + l).join('\n'));
    console.log('  \x1b[31m✗ ' + label + ' failed (exit ' + e.status + ')\x1b[0m');
    return false;
  }
}

// Retry wrapper for commands that may hit EBUSY on Windows (hard link contention).
// Each retry waits progressively longer for file handles to be released.
function runRetry(cmd, cwd, label, n = 3) {
  for (let i = 0; i < n; i++) {
    if (run(cmd, cwd, label)) return true;
    if (i === n - 1) return false;
    const sec = (i + 1) * 3;  // 3s, 6s, 9s backoff
    console.log('  ⏳ retry %d/%d in %ds ...', i + 1, n - 1, sec);
    try { execSync('node -e "setTimeout(()=>process.exit(),' + (sec * 1000) + ')"', { timeout: sec * 1000 + 5000 }); } catch {}
  }
}

// Clear pnpm metadata cache for published packages so downstream installs
// re-fetch fresh metadata from Verdaccio instead of using stale cached data.
// (pnpm caches registry metadata indefinitely; republishing a package with
// the same version number won't be picked up unless the cache is cleared.)
function clearPnpmMetadataCache(pkgDirs) {
  const cacheBase = process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, 'pnpm-cache')
    : process.env.XDG_CACHE_HOME
      ? join(process.env.XDG_CACHE_HOME, 'pnpm')
      : join(homedir(), process.platform === 'darwin' ? 'Library/Caches/pnpm' : '.cache/pnpm');

  const metadataDirs = ['metadata', 'metadata-v1.3'].map(d => join(cacheBase, d, REGISTRY_CACHE_KEY));

  for (const d of pkgDirs) {
    try {
      const pkg = JSON.parse(readFileSync(join(d, 'package.json'), 'utf-8'));
      const name = pkg.name; // e.g. @iproject/core-szew
      if (!name) continue;
      for (const mdDir of metadataDirs) {
        try { unlinkSync(join(mdDir, name + '.json')); } catch {}
      }
    } catch {}
  }
}

// ── Verdaccio ───────────────────────────────────────────────────────

function verdaccioRunning() {
  try {
    const result = execSync('curl -s -o NUL -w "%{http_code}" ' + REGISTRY, { encoding: 'utf-8', timeout: 5000, shell: true });
    const code = parseInt(result.trim(), 10);
    // 200 = 正常；401/403 = 需要认证但 registry 本身可访问；3xx = 重定向
    return (code >= 200 && code < 400) || code === 401 || code === 403;
  } catch { return false; }
}

function ensureVerdaccio() {
  if (verdaccioRunning()) {
    console.log('  Registry: ' + REGISTRY + ' ✓');
    return true;
  }
  console.log('  Registry 不可访问: ' + REGISTRY);
  if (IS_LOCAL_REGISTRY) {
    console.log('  请先启动 Verdaccio:');
    console.log('    verdaccio --listen 0.0.0.0:' + REGISTRY_PORT);
    console.log('  然后重新运行本脚本');
  } else {
    console.log('  请检查该地址是否可访问，并确认目标 registry 已启动');
  }
  return false;
}

function findPackageDirs(dirs) {
  const pkgs = [];
  for (const d of dirs) {
    if (existsSync(join(d, 'package.json'))) {
      pkgs.push(d);
    } else {
      try {
        const entries = fsReaddirSync(d, { withFileTypes: true });
        for (const e of entries) {
          if (e.isDirectory() && existsSync(join(d, e.name, 'package.json'))) {
            pkgs.push(join(d, e.name));
          }
        }
      } catch {}
    }
  }
  return pkgs;
}

// ═══════════════════════════════════════════════════════════════════════
// Pre-publish: resolve workspace:* / workspace:^ / catalog: 等非固定版本
// pnpm workspace / rush 协议版本号在发布到 npm/Verdaccio 时必须替换为实际版本
// ═══════════════════════════════════════════════════════════════════════

// Find the nearest monorepo root: looks for pnpm-workspace.yaml, rush.json,
// or package.json with "workspaces" field (yarn/npm workspaces).
// Returns { root, type: 'pnpm' | 'rush' | 'yarn' } or null if neither found.
function findMonorepoRoot(dir) {
  let d = resolve(dir);
  while (d !== ROOT && d !== dirname(d)) {
    if (existsSync(join(d, 'pnpm-workspace.yaml'))) return { root: d, type: 'pnpm' };
    if (existsSync(join(d, 'rush.json'))) return { root: d, type: 'rush' };
    // yarn / npm workspaces: package.json with "workspaces" field
    if (existsSync(join(d, 'package.json'))) {
      try {
        const pkg = JSON.parse(readFileSync(join(d, 'package.json'), 'utf-8'));
        if (pkg.workspaces) return { root: d, type: 'yarn' };
      } catch {}
    }
    const parent = dirname(d);
    if (parent === d) break;
    d = parent;
  }
  return null;
}

// Narrower skip set for workspace package scanning (must NOT exclude
// legitimate package dir names like "common", "build", "bin", "obj")
const WS_SCAN_SKIP = new Set([
  'node_modules', '.git', 'dist', 'lib', 'out',
  'coverage', '.nyc_output', '__pycache__', '.cache', '.claude',
  '.rush', '.yarn', '.turbo', 'name-replacer',
]);

// Build a name→version map for all packages in a monorepo
// Works for pnpm / rush / yarn repos (recursive walk)
// compiled: brand regex — applies replaceBrand so map keys match post-replacement dep specs
function buildWorkspacePackageMap(repoRoot, compiled) {
  const pkgMap = new Map();

  function walk(dir, depth) {
    if (depth > 5) return;
    let entries;
    try { entries = fsReaddirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      if (WS_SCAN_SKIP.has(name)) continue;
      if (name.startsWith('.')) continue;
      const full = join(dir, name);
      if (existsSync(join(full, 'package.json'))) {
        try {
          const pkg = JSON.parse(readFileSync(join(full, 'package.json'), 'utf-8'));
          if (pkg.name && pkg.version) pkgMap.set(replaceBrand(pkg.name, compiled), pkg.version);
        } catch {}
      }
      walk(full, depth + 1);
    }
  }
  walk(repoRoot, 0);
  return pkgMap;
}

// Strip YAML quotes from a scalar value (e.g. '"^4.17.23"' → '^4.17.23')
function stripYamlStr(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// Parse pnpm-workspace.yaml catalog / catalogs sections
// Returns Map<catalogName, Map<packageName, version>>
// catalogName='' for the default (unnamed) catalog
// Uses line-by-line state machine (regex with /m $ is unreliable for this)
function loadCatalog(wsRoot, compiled) {
  const yamlPath = join(wsRoot, 'pnpm-workspace.yaml');
  if (!existsSync(yamlPath)) return new Map();

  const lines = readFileSync(yamlPath, 'utf-8').split('\n');
  const catalogs = new Map();
  catalogs.set('', new Map()); // default

  let section = null;   // 'catalog' | 'catalogs'
  let currentName = ''; // '' = default, 'foo' = named catalog (brand-replaced)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Detect section headers (column 0)
    if (/^catalog:/.test(trimmed) && !/^catalogs:/.test(trimmed)) {
      section = 'catalog';
      currentName = '';
      continue;
    }
    if (/^catalogs:/.test(trimmed)) {
      section = 'catalogs';
      currentName = '';
      continue;
    }

    // Exit section on next top-level key (column 0 non-empty, non-comment)
    if (section && /^\S/.test(line)) {
      section = null;
      continue;
    }

    if (section === 'catalog') {
      // Two-space indent: '  package-name: version'
      const m = trimmed.match(/^\s{2}['"]?([^'"]+)['"]?:\s*(.+)$/);
      if (m) catalogs.get('').set(replaceBrand(m[1], compiled), stripYamlStr(m[2]));
    }

    if (section === 'catalogs') {
      // Two-space indent, ends with colon: catalog name
      const nameMatch = trimmed.match(/^\s{2}(\S+):$/);
      if (nameMatch) {
        currentName = replaceBrand(nameMatch[1], compiled);
        catalogs.set(currentName, new Map());
        continue;
      }
      // Four-space indent: '    package-name: version'
      if (currentName) {
        const m = trimmed.match(/^\s{4}['"]?([^'"]+)['"]?:\s*(.+)$/);
        if (m) catalogs.get(currentName).set(replaceBrand(m[1], compiled), stripYamlStr(m[2]));
      }
    }
  }

  return catalogs;
}

function resolveWorkspaceDep(name, version, pkgMap) {
  const targetVersion = pkgMap.get(name);
  if (!targetVersion) return version; // 找不到目标包，保持原样

  const after = version.slice('workspace:'.length);
  if (after === '*')   return targetVersion;
  if (after === '^')   return '^' + targetVersion;
  if (after === '~')   return '~' + targetVersion;
  if (after.startsWith('^')) return '^' + targetVersion;
  if (after.startsWith('~')) return '~' + targetVersion;
  // workspace:1.2.3 — exact constraint
  return targetVersion;
}

function resolveCatalogDep(name, version, catalogs) {
  if (version === 'catalog:') {
    // Default catalog
    return catalogs.get('')?.get(name) || version;
  }
  // Named catalog: catalog:foo
  const catalogName = version.slice('catalog:'.length);
  return catalogs.get(catalogName)?.get(name) || version;
}

// Pre-publish fix: replace all workspace: / catalog: versions with
// resolved version numbers in package.json. Returns the original content
// for restoration after publish.
function resolveProtocolVersions(pkgDir, compiled) {
  const pkgPath = join(pkgDir, 'package.json');
  const original = readFileSync(pkgPath, 'utf-8');
  const pkg = JSON.parse(original);

  const repo = findMonorepoRoot(pkgDir);
  if (!repo) return null;

  const pkgMap = buildWorkspacePackageMap(repo.root, compiled);
  // Catalog: pass compiled so loadCatalog can brand-replace names in pnpm-workspace.yaml
  const catalogs = repo.type === 'pnpm' ? loadCatalog(repo.root, compiled) : new Map();
  if (pkgMap.size === 0 && catalogs.size <= 1) return null;

  let modified = false;

  for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    if (!pkg[field]) continue;
    for (const [name, ver] of Object.entries(pkg[field])) {
      if (typeof ver !== 'string') continue;
      let resolved = ver;

      if (ver.startsWith('workspace:')) {
        resolved = resolveWorkspaceDep(name, ver, pkgMap);
      } else if (ver === 'catalog:' || ver.startsWith('catalog:')) {
        resolved = resolveCatalogDep(name, ver, catalogs);
      }

      if (resolved !== ver) {
        pkg[field][name] = resolved;
        modified = true;
        console.log('  \x1b[35m🔧 ' + name + ': ' + ver + ' → ' + resolved + '\x1b[0m');
      }
    }
  }

  if (modified) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
  return modified ? original : null;
}

function publishPackages(dirs, compiled) {
  const pkgs = findPackageDirs(dirs);
  if (pkgs.length === 0) return;
  console.log('');
  console.log('  ── 发布到 registry: ' + REGISTRY + ' ──');

  // Resolve workspace/catalog protocol versions before publish
  const backups = [];
  for (const d of pkgs) {
    const backup = resolveProtocolVersions(d, compiled);
    if (backup) backups.push({ dir: d, original: backup });
  }

  for (const d of pkgs) {
    const pkg = JSON.parse(readFileSync(join(d, 'package.json'), 'utf-8'));
    const name = pkg.name + '@' + (pkg.version || '0.0.0');
    console.log('  📦 ' + name + '  (' + relative(ROOT, d) + ')');

    // Warn if main/types entry files are missing (package likely not built)
    for (const key of ['main', 'types', 'module']) {
      const entry = pkg[key];
      if (entry && !existsSync(join(d, entry))) {
        console.log('  \x1b[33m⚠ ' + key + ': ' + entry + ' 不存在，包可能未构建！\x1b[0m');
      }
    }

    if (!run('npm publish --registry ' + REGISTRY, d, 'publish ' + name)) {
      console.log('  \x1b[33m  (可能已存在，继续)\x1b[0m');
    }
    // Monorepo uses "rc" dist-tag for inter-package deps; ensure it exists
    try { execSync(`npm dist-tag add ${name} rc --registry ${REGISTRY}`, { stdio: 'pipe', timeout: 10000 }); } catch {}
  }

  // Restore original package.json (with workspace:/catalog: references)
  for (const { dir, original } of backups) {
    writeFileSync(join(dir, 'package.json'), original);
  }
}

// 更新 .npmrc 里的 registry / @scope:registry 行。
// 只在显式配置了自定义 registry 时改写，默认 localhost 保持原有行为不变。
function updateNpmrcRegistry(content) {
  if (!CUSTOM_REGISTRY) return { content, changed: false };

  let replacedGlobal = false;
  const lines = content.split(/\r?\n/).map(line => {
    if (/^\s*registry\s*=/.test(line)) {
      replacedGlobal = true;
      return 'registry=' + REGISTRY;
    }
    if (/^\s*@[^:\s]+:registry\s*=/.test(line)) {
      return line.replace(/:registry\s*=.*$/, ':registry=' + REGISTRY);
    }
    return line;
  });
  let out = lines.join('\n').trimEnd();
  if (!replacedGlobal) out = (out ? out + '\n' : '') + 'registry=' + REGISTRY;
  out += '\n';
  return { content: out, changed: out !== content };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureNpmrc(proj) {
  if (proj.mgr === 'rush') {
    const npmrcPath = join(proj.root, 'common/config/rush/.npmrc');
    const scopes = ['@iproject', '@szew'];
    let content = '';
    try { content = readFileSync(npmrcPath, 'utf-8'); } catch {}

    let changed = false;
    const registryUpdate = updateNpmrcRegistry(content);
    content = registryUpdate.content;
    changed = registryUpdate.changed;

    for (const scope of scopes) {
      const line = scope + ':registry=' + REGISTRY;
      const scopeLineRe = new RegExp('^' + escapeRegExp(scope) + ':registry=', 'm');
      if (scopeLineRe.test(content)) {
        const next = content.replace(new RegExp('^' + escapeRegExp(scope) + ':registry=.*$', 'gm'), line);
        if (next !== content) { content = next; changed = true; }
      } else {
        content = content.trimEnd() + '\n' + line + '\n';
        changed = true;
      }
    }
    // pnpm v11+ supply-chain check: skip minimumReleaseAge for Verdaccio (all local packages)
    if (!content.includes('minimumReleaseAge=')) {
      content = content.trimEnd() + '\nminimumReleaseAge=0\n';
      changed = true;
    }
    if (changed) {
      writeFileSync(npmrcPath, content);
      console.log('  .npmrc 已更新: ' + scopes.join(', ') + ' → ' + REGISTRY + ' + minimumReleaseAge=0');
    }
  } else {
    // pnpm/yarn/npm 项目：写入项目根目录 .npmrc
    const npmrcPath = join(proj.root, '.npmrc');
    let content = '';
    try { content = readFileSync(npmrcPath, 'utf-8'); } catch {}

    const registryUpdate = updateNpmrcRegistry(content);
    content = registryUpdate.content;
    let changed = registryUpdate.changed;

    const mrChanged = !content.includes('minimumReleaseAge=');
    if (mrChanged) {
      content = content.trimEnd() + '\nminimumReleaseAge=0\n';
      changed = true;
    }
    if (changed) {
      writeFileSync(npmrcPath, content);
      const parts = [];
      if (registryUpdate.changed) parts.push('registry=' + REGISTRY);
      if (mrChanged) parts.push('minimumReleaseAge=0');
      console.log('  .npmrc 已更新: ' + parts.join(' + '));
    }
  }
}

function installAndTest(proj) {
  const name = getProjectName(proj);
  console.log('');
  console.log('  ── ' + name + ' ──');

  if (NO_INSTALL) {
    console.log('  ⏭  跳过安装 (--no-install)');
  } else if (proj.mgr === 'rush') {
    if (!runRetry('rush update --full', proj.root, 'install')) return false;
  } else {
    if (!runRetry('pnpm install --no-frozen-lockfile', proj.root, 'install')) return false;
  }

  if (NO_TEST) {
    console.log('  ⏭  跳过测试 (--no-test)');
    return true;
  }

  if (proj.mgr === 'rush') {
    return run('rush test', proj.root, 'test');
  } else {
    return run('pnpm -r test', proj.root, 'test');
  }
}

// Read root package.json "packageManager" field → return 'pnpm' | 'yarn' | 'npm'
// Falls back to findProjectRoot.mgr if packageManager is absent.
function detectPkgManager(wsRoot) {
  const rootPkgPath = join(wsRoot, 'package.json');
  if (existsSync(rootPkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
      if (pkg.packageManager) {
        const name = pkg.packageManager.split('@')[0];
        if (name === 'yarn' || name === 'pnpm' || name === 'npm') return name;
      }
    } catch {}
  }
  const proj = findProjectRoot(wsRoot);
  return (proj && proj.mgr && proj.mgr !== 'npm') ? proj.mgr : 'pnpm';
}

// Ensure yarn is available (install globally via npm if missing)
let _yarnChecked = false;
function ensureYarn() {
  if (_yarnChecked) return true;
  _yarnChecked = true;
  try { execSync('yarn --version', { stdio: 'pipe' }); return true; } catch {}
  console.log('  yarn not found, installing via npm...');
  return run('npm install -g yarn', ROOT, 'install yarn');
}

// ── pnpm workspace cross-reference sync ────────────────────────────
// When a pnpm workspace package is renamed (brand replacement in name field),
// ALL workspace:* / workspace:^ / workspace:~ references to that package
// across the entire workspace must be updated simultaneously — otherwise
// pnpm install fails with ERR_PNPM_WORKSPACE_PKG_NOT_FOUND.
//
// This is needed because root package.json (and other workspace members not
// yet processed in this stage) may still reference the old package name via
// workspace protocol.
// opts.neededSet: when provided, only rename catalog: dep keys whose
// brand-replaced name is in this set. When null (post-stage), rename all.
function syncWorkspaceRefs(workspaceRoot, compiled, opts = {}) {
  const { neededSet = null } = opts;
  // Find all package.json files in the workspace
  const pkgFiles = [];
  const rootPkg = join(workspaceRoot, 'package.json');
  if (existsSync(rootPkg)) pkgFiles.push(rootPkg);

  function walk(dir, depth) {
    if (depth > 6) return;
    let entries;
    try { entries = fsReaddirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const name = entry.name;
      if (name === 'node_modules' || name.startsWith('.') || name === 'dist' || name === 'build' || name === 'lib' || name === 'out') continue;
      const full = join(dir, name);
      if (existsSync(join(full, 'package.json'))) {
        pkgFiles.push(join(full, 'package.json'));
      }
      walk(full, depth + 1);
    }
  }
  walk(workspaceRoot, 0);

  // Build a set of current workspace package names (post-rename).
  // Only rename workspace:* refs to packages that ACTUALLY exist now.
  const wsPackageNames = new Set();
  for (const pkgPath of pkgFiles) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.name) wsPackageNames.add(pkg.name);
    } catch {}
  }

  // Load catalog entries (post-rename, since syncPnpmWorkspaceYaml already ran).
  // Build set of all catalog entry keys for validating renamed catalog: refs.
  const catalogs = loadCatalog(workspaceRoot, compiled);
  const catalogKeys = new Set();
  for (const [, entries] of catalogs) {
    for (const [pkgName] of entries) {
      catalogKeys.add(pkgName);
    }
  }

  const depFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
  let changed = 0;

  for (const pkgPath of pkgFiles) {
    const original = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(original);
    let modified = false;

    for (const field of depFields) {
      if (!pkg[field]) continue;
      const newDeps = {};
      for (const [key, value] of Object.entries(pkg[field])) {
        const newKey = replaceBrand(key, compiled);
        // For catalog: refs, the catalog name in the value may also need renaming
        // (e.g. catalog:itwinjs-core-dev → catalog:iprojectjs-core-dev)
        const isCatalog = typeof value === 'string' && (value === 'catalog:' || value.startsWith('catalog:'));
        const newValue = isCatalog ? replaceBrand(value, compiled) : value;

        // workspace:* refs: only rename when the target package actually exists
        if (newKey !== key && typeof value === 'string' && value.startsWith('workspace:') && wsPackageNames.has(newKey)) {
          modified = true;
          newDeps[newKey] = value;
        // catalog: refs: rename catalog name in value, and optionally rename key
        // Per-stage: only rename key if needed by current stage's packages
        } else if (isCatalog) {
          const renameKey = newKey !== key && catalogKeys.has(newKey)
            && (!neededSet || neededSet.has(newKey));
          const renameValue = newValue !== value;
          if (renameKey || renameValue) {
            modified = true;
            newDeps[renameKey ? newKey : key] = renameValue ? newValue : value;
          } else {
            newDeps[key] = value;
          }
        } else {
          newDeps[key] = value;
        }
      }
      if (modified) pkg[field] = newDeps;
    }

    if (modified) {
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      changed++;
      console.log('    sync ref: ' + relative(ROOT, pkgPath));
    }
  }

  return changed;
}

// Brand-replace pnpm-workspace.yaml catalog entry keys on disk.
// loadCatalog does this in-memory for version resolution, but pnpm install
// reads the file directly — so we must write the renamed keys back to disk.
// opts.neededSet: when provided, only rename catalog entry keys whose
// brand-replaced name is in this set (packages actually depended on by
// the current stage). When null (post-stage), rename all.
function syncPnpmWorkspaceYaml(wsRoot, compiled, opts = {}) {
  const { neededSet = null } = opts;
  const yamlPath = join(wsRoot, 'pnpm-workspace.yaml');
  if (!existsSync(yamlPath)) return 0;

  const lines = readFileSync(yamlPath, 'utf-8').split('\n');
  let changed = 0;
  let section = null; // 'catalog' | 'catalogs'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();

    // Section headers (column 0)
    if (/^catalog:/.test(trimmed) && !/^catalogs:/.test(trimmed)) {
      section = 'catalog';
      continue;
    }
    if (/^catalogs:/.test(trimmed)) {
      section = 'catalogs';
      continue;
    }

    // Exit section on next top-level key (column 0 non-empty, non-comment)
    if (section && /^\S/.test(line)) {
      section = null;
      continue;
    }

    if (section === 'catalog') {
      // Default catalog entry key (2-space indent): '  package-name: version'
      // Per-stage: only rename if the package already exists on Verdaccio
      const m = line.match(/^(\s{2})(['"]?)([^'"]+)(['"]?)(\s*:\s*.+)$/);
      if (m) {
        const newKey = replaceBrand(m[3], compiled);
        if (newKey !== m[3] && (!neededSet || neededSet.has(newKey))) {
          lines[i] = m[1] + m[2] + newKey + m[4] + m[5];
          changed++;
        }
      }
    }

    if (section === 'catalogs') {
      // Named catalog name (2-space indent, ends with ':'): '  itwinjs-core:'
      const nameMatch = trimmed.match(/^\s{2}(\S+):$/);
      if (nameMatch) {
        const newName = replaceBrand(nameMatch[1], compiled);
        if (newName !== nameMatch[1]) {
          const indent = line.match(/^(\s*)/)[1];
          lines[i] = indent + newName + ':';
          changed++;
        }
        continue;
      }
      // Named catalog entry key (4-space indent): '    package-name: version'
      // Per-stage: only rename if the package already exists on Verdaccio
      const m = line.match(/^(\s{4})(['"]?)([^'"]+)(['"]?)(\s*:\s*.+)$/);
      if (m) {
        const newKey = replaceBrand(m[3], compiled);
        if (newKey !== m[3] && (!neededSet || neededSet.has(newKey))) {
          lines[i] = m[1] + m[2] + newKey + m[4] + m[5];
          changed++;
        }
      }
    }
  }

  if (changed > 0) {
    writeFileSync(yamlPath, lines.join('\n'));
    console.log('    sync yaml: ' + relative(ROOT, yamlPath) + ' (' + changed + ' keys)');
  }

  return changed;
}

// ═══════════════════════════════════════════════════════════════════════
// Brand-word regex (shared)
// ═══════════════════════════════════════════════════════════════════════

function buildBrandRegex() {
  const mapping = JSON.parse(readFileSync(join(__dirname, 'name-mapping.json'), 'utf-8'));
  const replacements = Object.entries(mapping).sort(([a], [b]) => b.length - a.length);
  const escaped = replacements.map(([old]) => old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return {
    regex: new RegExp('\\b(' + escaped.join('|') + ')\\b', 'g'),
    lookup: new Map(replacements),
  };
}

function replaceBrand(s, compiled) {
  return s.replace(compiled.regex, m => compiled.lookup.get(m) || m);
}

// ═══════════════════════════════════════════════════════════════════════
// syncRushJson — update rush.json to match what's actually on disk
//
// After applyReplacements renames leaf dirs, the disk may have a mix
// of old parent dirs + new leaf dirs. This function:
//   1. Computes the fully-replaced packageName and projectFolder
//   2. Checks if the fully-replaced folder exists on disk
//   3. If not, tries partial-replacement candidates to find the real folder
//   4. Updates rush.json to match disk reality (partial paths OK)
//   5. Skips entries whose targets haven't been processed yet
//
// The final fully-replaced sync happens after the post-stage directory
// rename pass (renameAllBrandDirs).
// ═══════════════════════════════════════════════════════════════════════

function findActualFolder(root, oldFolder, newFolder) {
  // Try the fully-replaced path first
  if (existsSync(join(root, newFolder, 'package.json'))) {
    return newFolder;
  }

  const oldSegs = oldFolder.split('/');
  const newSegs = newFolder.split('/');

  // Try candidates from right to left:
  //   i=len:   original path (nothing renamed yet → future layer)
  //   i=len-1: only last segment replaced (leaf renamed, parent still old)
  //   i=len-2: last two segments replaced
  //   ...
  //   i=0:     all replaced (= newFolder, already checked above)
  for (let i = newSegs.length; i >= 0; i--) {
    const candidate = i === newSegs.length
      ? oldFolder
      : [...oldSegs.slice(0, i), ...newSegs.slice(i)].join('/');
    if (existsSync(join(root, candidate, 'package.json'))) {
      return candidate;
    }
  }
  return null;
}

// Add processed packages to rush.json (accumulate per stage).
// Only adds packages from dirs that aren't already in rush.json.
function addToRushJson(proj, dirs, compiled, renamedDirs) {
  if (proj.mgr !== 'rush') return;
  const rushPath = join(proj.root, 'rush.json');
  const rush = JSON.parse(readFileSync(rushPath, 'utf-8'));
  const existingFolders = new Set(rush.projects.map(p => p.projectFolder));

  // Original entries from backup (for preserving reviewCategory etc.)
  const originalEntries = rushBackups.get(proj.root) || [];

  // Reverse rename map: newPath → oldPath
  const reverseRenames = new Map();
  for (const [oldPath, newPath] of renamedDirs) {
    reverseRenames.set(newPath, oldPath);
  }

  for (const dir of dirs) {
    const relDir = relative(proj.root, dir).replace(/\\/g, '/');
    // Skip dirs outside this monorepo (../ prefix)
    if (relDir.startsWith('..')) continue;
    const pkgPath = join(dir, 'package.json');
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    if (!pkg.name) continue;

    // Check if already tracked (exact or brand-replaced match)
    if (existingFolders.has(relDir)) continue;
    const replacedFolder = replaceBrand(relDir, compiled);
    if (replacedFolder !== relDir && existingFolders.has(replacedFolder)) continue;

    // Find original rush.json entry: reverse-rename lookup → projectFolder exact match
    const origDir = reverseRenames.get(dir) || dir;
    const origRelDir = relative(proj.root, origDir).replace(/\\/g, '/');
    const orig = originalEntries.find(e => e.projectFolder === origRelDir);

    const entry = { packageName: pkg.name, projectFolder: relDir };
    if (orig) {
      // Preserve original metadata
      if (orig.reviewCategory) entry.reviewCategory = orig.reviewCategory;
      if (orig.versionPolicyName) entry.versionPolicyName = orig.versionPolicyName;
      if (orig.shouldPublish !== undefined) entry.shouldPublish = orig.shouldPublish;
      // package.json "private": true overrides shouldPublish (Rush forbids publishing private packages)
      if (pkg.private) entry.shouldPublish = false;
      if (orig.decoupledLocalDependencies) entry.decoupledLocalDependencies = orig.decoupledLocalDependencies;
      if (orig.tags) entry.tags = orig.tags;
      if (!entry.reviewCategory) entry.reviewCategory = 'common';
    } else {
      console.log('  ⚠ 未找到原始 rush.json 条目: ' + relDir + '，使用默认值');
      entry.shouldPublish = pkg.private ? false : true;
      entry.reviewCategory = 'common';
    }

    rush.projects.push(entry);
    existingFolders.add(relDir);
    console.log('  + rush.json: ' + pkg.name + ' @ ' + relDir);
  }

  writeFileSync(rushPath, JSON.stringify(rush, null, 2) + '\n');
}

function syncRushJson(proj, compiled) {
  if (proj.mgr !== 'rush') return { updated: 0, missing: 0 };
  const rushPath = join(proj.root, 'rush.json');
  if (!existsSync(rushPath)) return { updated: 0, missing: 0 };

  const rush = JSON.parse(readFileSync(rushPath, 'utf-8'));
  if (!compiled) compiled = buildBrandRegex();

  let updated = 0, missing = 0;

  for (const p of rush.projects) {
    const newName = replaceBrand(p.packageName, compiled);
    const newFolder = replaceBrand(p.projectFolder, compiled);

    // Nothing to change
    if (newName === p.packageName && newFolder === p.projectFolder) continue;

    // Check if fully-replaced folder exists
    if (existsSync(join(proj.root, newFolder, 'package.json'))) {
      if (p.packageName !== newName) console.log('  ~ rush.json: ' + p.packageName + ' → ' + newName);
      if (p.projectFolder !== newFolder) console.log('  ~ rush.json folder: ' + p.projectFolder + ' → ' + newFolder);
      p.packageName = newName;
      p.projectFolder = newFolder;
      updated++;
      continue;
    }

    // Try to find the actual folder on disk (may be partially renamed)
    const actualFolder = findActualFolder(proj.root, p.projectFolder, newFolder);
    if (!actualFolder) {
      console.log('  ⚠ rush.json: ' + p.packageName + ' → ' + newName + ' (文件夹 ' + newFolder + ' 不存在)');
      missing++;
      continue;
    }

    // If nothing changed on disk yet (not yet processed → future layer), skip
    if (actualFolder === p.projectFolder) continue;

    // Partial rename: leaf renamed, parent(s) still old — sync to current disk state
    if (p.packageName !== newName) console.log('  ~ rush.json: ' + p.packageName + ' → ' + newName);
    if (p.projectFolder !== actualFolder) console.log('  ~ rush.json folder: ' + p.projectFolder + ' → ' + actualFolder);
    p.packageName = newName;
    p.projectFolder = actualFolder;
    updated++;
  }

  if (updated > 0 || missing > 0) {
    writeFileSync(rushPath, JSON.stringify(rush, null, 2) + '\n');
    const parts = [];
    if (updated > 0) parts.push('更新 ' + updated);
    if (missing > 0) parts.push('缺失 ' + missing);
    console.log('  rush.json 已同步 (' + parts.join(', ') + ')');
  }
  return { updated, missing };
}

// ═══════════════════════════════════════════════════════════════════════
// cleanStaleRushInstallFlag — drop common/temp/last-install.flag when stale
//
// Rush caches ABSOLUTE paths (rushJsonFolder, storePath) in
// common/temp/last-install.flag. When a repo root itself is renamed
// (e.g. itwinjs-core → szewtwinjs-core), the cached store path no longer
// matches and every rush command aborts with:
//   ERROR: Current PNPM store path does not match the last one used.
// Deleting the flag makes Rush rebuild it against the new path. This is
// safe: pnpm-store moved together with the repo, its contents are unchanged.
// ═══════════════════════════════════════════════════════════════════════

function cleanStaleRushInstallFlag(root) {
  const flagPath = join(root, 'common', 'temp', 'last-install.flag');
  if (!existsSync(flagPath)) return false;

  let flag;
  try { flag = JSON.parse(readFileSync(flagPath, 'utf-8')); } catch { return false; }

  const norm = p => resolve(p).replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  const folderOk = !flag.rushJsonFolder || norm(flag.rushJsonFolder) === norm(root);
  const storeOk = !flag.storePath || norm(flag.storePath) === norm(join(root, 'common', 'temp', 'pnpm-store'));
  if (folderOk && storeOk) return false;

  try {
    unlinkSync(flagPath);
    console.log('  - 清除过期安装缓存: ' + relative(ROOT, flagPath));
    console.log('    记录路径: ' + (flag.storePath || flag.rushJsonFolder));
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// renameAllBrandDirs — one-pass comprehensive directory rename
//
// After all stages complete, walks the entire repo (skipping build
// artifacts, node_modules, etc.) and renames ANY directory whose name
// contains a brand word. This catches intermediate/parent dirs that
// sit above target directories (e.g. packages/itwin/, itwin-platform-access/).
//
// Rules:
//   - Bottom-up: recurse first, rename parent after children
//   - Default: visit ALL directories; only name-replacer/scan-exclude.json
//     "dirs" 段列出的目录会跳过
// ═══════════════════════════════════════════════════════════════════════

function renameAllBrandDirs(compiled) {
  const renames = [];
  const filter = loadScanFilter();

  function walk(dir) {
    let entries;
    try { entries = fsReaddirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = join(dir, entry.name);
      const relPath = relative(ROOT, fullPath).replace(/\\/g, '/');
      if (filter.shouldSkipDir(entry.name, relPath)) continue;

      // Recurse first → bottom-up rename
      walk(fullPath);

      // Check if this directory's name contains brand words
      const newName = replaceBrand(entry.name, compiled);
      if (newName === entry.name) continue;

      renames.push({ oldPath: fullPath, newPath: join(dir, newName) });
    }
  }

  walk(ROOT);
  return renames;
}

// ═══════════════════════════════════════════════════════════════════════
// Execute
// ═══════════════════════════════════════════════════════════════════════

const modeLabel = DRY_RUN ? '预览 (--dry-run)' : (REPLACE_ONLY ? '仅替换 (--replace-only)' : '执行'
  + (NO_INSTALL ? ' (跳过安装)' : '')
  + (NO_BUILD ? ' (跳过构建)' : '')
  + (NO_PUBLISH ? ' (跳过发布)' : ' + 发布')
  + (NO_TEST ? ' (跳过测试)' : ' + 测试'));
console.log('模式: ' + modeLabel);
console.log('批次: ' + stages.length);
console.log('Registry: ' + REGISTRY);
console.log('');

const allResults = [];
let anyFailed = false;
let anyExistingTarget = false;  // 是否至少有一个目标目录真实存在
const allRushProjects = new Map();
const allPublishProjects = new Map();
const allPnpmProjects = new Map();   // pnpm: collect across stages, process after loop
const allPnpmPublishDirs = [];       // pnpm publish dirs (post leaf-rename)
const allNpmPublishDirs = [];        // standalone: build & publish per stage
const compiled = buildBrandRegex();

// ── Rush: backup & optionally clear rush.json, accumulate per stage ──
const rushBackups = new Map(); // proj.root → original projects array
if (!DRY_RUN) {
  for (const stage of stages) {
    for (const dir of [...(stage.dirs || []), ...(stage.replaceOnly || [])]) {
      const abs = resolve(ROOT, dir);
      if (!existsSync(abs)) continue;
      const proj = findProjectRoot(abs);
      if (proj && proj.mgr === 'rush' && !rushBackups.has(proj.root)) {
        const rushPath = join(proj.root, 'rush.json');
        const rush = JSON.parse(readFileSync(rushPath, 'utf-8'));
        // Always backup original entries (needed for metadata matching)
        rushBackups.set(proj.root, rush.projects.map(p => ({ ...p })));
        // Only clear when --no-clear-rush is NOT set
        if (!NO_CLEAR_RUSH) {
          rush.projects = [];
          writeFileSync(rushPath, JSON.stringify(rush, null, 2) + '\n');
          console.log('rush.json 已清空: ' + relative(ROOT, proj.root));
        }
      }
    }
  }
}

// ── Stage loop ──────────────────────────────────────────────────────

for (let i = 0; i < stages.length; i++) {
  const stage = stages[i];
  const publishDirs = stage.dirs;
  const allDirs = [...stage.dirs, ...(stage.replaceOnly || [])];
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  [' + (i + 1) + '/' + stages.length + '] ' + (stage.note || '第 ' + (i + 1) + ' 批'));
  console.log('═══════════════════════════════════════════════════════════');
  if (publishDirs.length > 0) console.log((REPLACE_ONLY || NO_PUBLISH) ? '  [替换]' : '  [发布]');
  publishDirs.forEach(d => console.log('    ' + relative(ROOT, d)));
  if (stage.replaceOnly && stage.replaceOnly.length > 0) {
    console.log('  [仅替换]');
    stage.replaceOnly.forEach(d => console.log('    ' + relative(ROOT, d)));
  }
  const existingPublishDirs = publishDirs.filter(d => existsSync(d));
  if (publishDirs.length > 0 && existingPublishDirs.length === 0) {
    console.log('  ⚠ 本批发布目录都不存在，不会发包（请检查 targets.json 路径）');
  }
  console.log('');

  // 1. Replace content + rename leaf dirs
  let stageScanned = 0, stageReplaced = 0, stageRenames = 0;
  const stageRushProjects = new Map();
  const publishProjects = new Map();
  const renamedDirs = new Map(); // oldPath → newPath (for publishPackages)

  for (const dir of allDirs) {
    const logPrefix = '  [' + (i + 1) + ']';
    const isReplaceOnly = stage.replaceOnly && stage.replaceOnly.includes(dir);
    const tag = isReplaceOnly ? ' [仅替换]' : '';
    if (!existsSync(dir)) {
      console.log(logPrefix + tag + ' ' + relative(ROOT, dir) + '  ⚠ 不存在，跳过');
      continue;
    }
    anyExistingTarget = true;
    console.log(logPrefix + tag + ' ' + relative(ROOT, dir));
    const result = applyReplacements(dir, DRY_RUN, logPrefix);
    stageScanned += result.scanned;
    stageReplaced += result.replaced;
    stageRenames += result.renames.length;

    // Track renamed dirs so publishPackages can find them
    for (const rn of result.renames) {
      if (rn.isDir) renamedDirs.set(rn.oldPath, rn.newPath);
    }

    const actualDir = renamedDirs.get(dir) || dir;

    const proj = findProjectRoot(actualDir);
    if (proj) {
      if (proj.mgr === 'rush') {
        stageRushProjects.set(proj.root, proj);
        allRushProjects.set(proj.root, proj);
      }
      if (!isReplaceOnly) {
        publishProjects.set(proj.root, proj);
        allPublishProjects.set(proj.root, proj);
        if (proj.mgr !== 'rush') {
          allPnpmProjects.set(proj.root, proj);
        }
      }
    }
  }

  allResults.push({
    stage: i + 1, note: stage.note,
    scanned: stageScanned, replaced: stageReplaced, renames: stageRenames,
    projects: [...new Set([...stageRushProjects.values(), ...publishProjects.values()])].map(getProjectName),
  });

  if (DRY_RUN) continue;

  // 2. Rush: add processed packages to rush.json (accumulate)
  // Include both stage.dirs and stage.replaceOnly — replaceOnly packages still need
  // to be in rush.json as workspace members (other packages may reference them via workspace:*).
  // 只有"先清空再按阶段加回"时才需要 addToRushJson；不清空时原条目都在，
  // 后面的 syncRushJson 会按磁盘实际路径更新，避免重复追加。
  if (!NO_CLEAR_RUSH) {
    for (const [, proj] of stageRushProjects) {
      const allStageDirs = [...stage.dirs, ...(stage.replaceOnly || [])];
      const projDirs = allStageDirs
        .map(d => renamedDirs.get(resolve(ROOT, d)) || resolve(ROOT, d))
        .filter(d => !relative(proj.root, d).startsWith('..'));
      addToRushJson(proj, projDirs, compiled, renamedDirs);
    }
  }

  // 3. Set up Verdaccio + .npmrc before install (cross-stage deps need it)
  // --no-install / --replace-only 时不需要装依赖，也就不启动 Verdaccio、不改 .npmrc；
  // 但如果仍要发布，Verdaccio 还是必须的。
  const hasRushThisStage = stageRushProjects.size > 0;
  const hasPublishThisStage = publishDirs.length > 0 && !NO_PUBLISH;
  if (hasPublishThisStage || (hasRushThisStage && !NO_INSTALL)) {
    if (!ensureVerdaccio()) process.exit(1);
  }
  if (!NO_INSTALL || hasPublishThisStage) {
    for (const [, proj] of stageRushProjects) {
      ensureNpmrc(proj);
    }
  }
  // 非 Rush 项目：只有显式配置了自定义 registry 时才提前改 .npmrc，
  // 默认 localhost 流程保持和以前一致（仍然在批次结束后处理 .npmrc）
  if (CUSTOM_REGISTRY && (!NO_INSTALL || hasPublishThisStage)) {
    for (const dir of publishDirs) {
      const actualDir = renamedDirs.get(resolve(ROOT, dir)) || resolve(ROOT, dir);
      const proj = findProjectRoot(actualDir);
      if (proj && proj.mgr !== 'rush') ensureNpmrc(proj);
    }
  }

  // 4. Rush: install + build (now resolves cross-stage deps from Verdaccio)
  // Always --full + delete lockfile: per-stage replacements change deps every stage,
  // so the lockfile is always stale. Incremental update triggers "overrides settings
  // doesn't match the current shrinkwrap" → pnpm exit null on Node 22 + pnpm 7.x.
  for (const [, proj] of stageRushProjects) {
    // Sync rush.json paths to what's actually on disk.
    // Intermediate dirs (e.g. core/ecsql → core/dmsql) may have been renamed by
    // an earlier stage or by a previous run's final rename pass, and with
    // --no-clear-rush the old entries are still in rush.json. rush update would
    // then abort with "Could not find package.json for ..." — and since that
    // failure exits before the post-stage sync, rush.json would stay broken forever.
    syncRushJson(proj, compiled);
    if (!NO_INSTALL) {
      // A previous run may have renamed this repo root, leaving absolute paths
      // cached in common/temp/last-install.flag → rush refuses to install.
      cleanStaleRushInstallFlag(proj.root);
      const lockPath = join(proj.root, 'common', 'config', 'rush', 'pnpm-lock.yaml');
      try { unlinkSync(lockPath); } catch {}
      if (!runRetry('rush update --full', proj.root, 'install ' + getProjectName(proj))) {
        syncRushJson(proj, compiled);  // never leave rush.json inconsistent on abort
        process.exit(1);
      }
    }
    if (!NO_BUILD) {
      if (!run('rush build', proj.root, 'build ' + getProjectName(proj))) {
        syncRushJson(proj, compiled);
        process.exit(1);
      }
    }
  }

  // 5. Publish current stage
  if (hasPublishThisStage) {
    const actualPublishDirs = publishDirs.map(d => renamedDirs.get(resolve(ROOT, d)) || resolve(ROOT, d));
    const rushDirs = [], wsDirs = [], soloDirs = [];
    for (const d of actualPublishDirs) {
      const p = findProjectRoot(d);
      if (!p) continue;
      if (p.mgr === 'rush') rushDirs.push(d);
      else if (p.mgr === 'pnpm' || p.mgr === 'yarn') wsDirs.push(d);
      else soloDirs.push(d);
    }
    // Rush: publish (already built in step 4)
    if (rushDirs.length > 0) { publishPackages(rushDirs, compiled); clearPnpmMetadataCache(rushDirs); }
    // Standalone: install → build → publish (detect package manager)
    if (soloDirs.length > 0) {
      for (const d of soloDirs) {
        const pkg = JSON.parse(readFileSync(join(d, 'package.json'), 'utf-8'));
        const soloPm = detectPkgManager(d);
        const soloInstallCmd = soloPm === 'yarn' ? 'yarn install' : soloPm === 'pnpm' ? 'pnpm install --no-frozen-lockfile' : 'npm install';
        const soloBuildCmd = soloPm === 'yarn' ? 'yarn run build' : soloPm === 'pnpm' ? 'pnpm run build' : 'npm run build';
        if (!NO_INSTALL && !runRetry(soloInstallCmd, d, 'install ' + pkg.name)) process.exit(1);
        if (!NO_BUILD && pkg.scripts && pkg.scripts.build) {
          if (!run(soloBuildCmd, d, 'build ' + pkg.name)) process.exit(1);
        }
      }
      publishPackages(soloDirs, compiled); clearPnpmMetadataCache(soloDirs);
    }

    // pnpm / yarn workspaces: install → build → publish immediately
    // (so later Rush stages can consume these packages from Verdaccio).
    if (wsDirs.length > 0) {
      const wsRoots = new Set();
      for (const d of wsDirs) {
        const p = findProjectRoot(d);
        if (p) wsRoots.add(p.root);
      }

      // Group by package manager (read from root package.json#packageManager)
      const byPm = { pnpm: [], yarn: [] };
      for (const wsRoot of wsRoots) {
        const pm = detectPkgManager(wsRoot);
        if (pm === 'yarn' && !ensureYarn()) process.exit(1);
        (byPm[pm] || byPm.pnpm).push(wsRoot);
      }

      // Process each workspace: sync refs → patch prepare → install → build
      for (const [pm, roots] of Object.entries(byPm)) {
        if (roots.length === 0) continue;

        // Per-stage: collect catalog: dep keys from packages being published.
        // Only rename catalog entries that are actually needed by this stage.
        const neededSet = new Set();
        for (const d of wsDirs) {
          try {
            const pkg = JSON.parse(readFileSync(join(d, 'package.json'), 'utf-8'));
            for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
              if (!pkg[field]) continue;
              for (const [key, value] of Object.entries(pkg[field])) {
                if (typeof value === 'string' && (value === 'catalog:' || value.startsWith('catalog:'))) {
                  neededSet.add(key);
                }
              }
            }
          } catch {}
        }

        for (const wsRoot of roots) {
          syncPnpmWorkspaceYaml(wsRoot, compiled, { neededSet });
          syncWorkspaceRefs(wsRoot, compiled, { neededSet });
        }

        // Patch root prepare to skip `playwright install`
        const prepareBackups = new Map();
        for (const wsRoot of roots) {
          const rootPkgPath = join(wsRoot, 'package.json');
          if (!existsSync(rootPkgPath)) continue;
          const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
          if (rootPkg.scripts && rootPkg.scripts.prepare && rootPkg.scripts.prepare.includes('playwright install')) {
            prepareBackups.set(wsRoot, rootPkg.scripts.prepare);
            rootPkg.scripts.prepare = rootPkg.scripts.prepare
              .replace(/\s*&&\s*playwright\s+install\b/g, '')
              .replace(/playwright\s+install\s*&&\s*/g, '')
              .trim();
            if (!rootPkg.scripts.prepare) delete rootPkg.scripts.prepare;
            writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
            console.log('    patched prepare: skip playwright install');
          }
        }

        // Install + build only the dirs belonging to this pm group.
        // Use --filter so pnpm only resolves the specific package, not the
        // entire workspace (which may reference packages not yet published).
        const pmDirs = wsDirs.filter(d => roots.includes(findProjectRoot(d)?.root));
        for (const d of pmDirs) {
          const pkg = JSON.parse(readFileSync(join(d, 'package.json'), 'utf-8'));
          const wsRoot = findProjectRoot(d)?.root || d;
          // Ensure root devDeps (cpx2 etc.) are also installed — sub-package
          // build scripts may rely on binaries from root devDependencies.
          const rootPkgName = (() => {
            try { return JSON.parse(readFileSync(join(wsRoot, 'package.json'), 'utf-8')).name; } catch { return ''; }
          })();
          const filterInstall = pm === 'yarn'
            ? `yarn workspaces focus ${pkg.name}`
            : `pnpm --filter ${pkg.name}${rootPkgName ? ` --filter ${rootPkgName}` : ''} install --no-frozen-lockfile`;
          const filterBuild = pm === 'yarn'
            ? `yarn workspace ${pkg.name} run build`
            : `pnpm run build`;
          if (!NO_INSTALL && !runRetry(filterInstall, wsRoot, 'install ' + pkg.name)) process.exit(1);
          if (!NO_BUILD && pkg.scripts && pkg.scripts.build) {
            // Run build in the package directory itself, not via workspace --filter
            // (--filter silently exits 0 when workspace config is missing in NameReplaceTest)
            if (!run(filterBuild, d, 'build ' + pkg.name)) process.exit(1);
          }
        }

        // Restore prepare scripts
        for (const [wsRoot, originalPrepare] of prepareBackups) {
          const rootPkgPath = join(wsRoot, 'package.json');
          const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
          if (!rootPkg.scripts) rootPkg.scripts = {};
          rootPkg.scripts.prepare = originalPrepare;
          writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
        }
      }

      publishPackages(wsDirs, compiled); clearPnpmMetadataCache(wsDirs);
      for (const d of wsDirs) allPnpmPublishDirs.push(d);
    }
  }

}

// ═══════════════════════════════════════════════════════════════════════
// Post-stage: finalize directories + Verdaccio verification
// ═══════════════════════════════════════════════════════════════════════

if (!DRY_RUN && anyExistingTarget) {
  // 1. Rename ALL remaining brand-word directories (recursive, bottom-up)
  const brandDirs = renameAllBrandDirs(compiled);

  if (brandDirs.length > 0) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  目录重命名（所有含品牌词的中间目录）');
    console.log('═══════════════════════════════════════════════════════════');
    for (const { oldPath, newPath } of brandDirs) {
      if (existsSync(oldPath) && !existsSync(newPath)) {
        renameSync(oldPath, newPath);
        console.log('  ~ ' + relative(ROOT, oldPath) + ' → ' + relative(ROOT, newPath));
      }
    }
  }

  // 2. Final rush.json sync — update folder paths post top-level renames
  //    Use the POST-rename root: the repo dir itself may have been renamed by
  //    renameAllBrandDirs above (e.g. itwinjs-core → szewtwinjs-core).
  if (allRushProjects.size > 0) {
    for (const [, proj] of allRushProjects) {
      const actualRoot = replaceBrand(proj.root, compiled);
      if (!NO_INSTALL) cleanStaleRushInstallFlag(actualRoot);
      syncRushJson({ ...proj, root: actualRoot }, compiled);
    }
  }

  // 3. Generate targets-replaced.json（兼容数组和 { registry, stages } 两种格式）
  if (TARGETS_FILE) {
    const origTargets = JSON.parse(readFileSync(TARGETS_FILE, 'utf-8'));
    const origEntries = Array.isArray(origTargets) ? origTargets : (origTargets.stages || []);
    const replacedEntries = origEntries.map(entry => ({
      dirs: (entry.dirs || []).map(d => replaceBrand(d, compiled)),
      replaceOnly: (entry.replaceOnly || []).map(d => replaceBrand(d, compiled)),
      note: entry.note || '',
    }));
    const replacedTargets = Array.isArray(origTargets)
      ? replacedEntries
      : { ...origTargets, stages: replacedEntries };
    writeFileSync(join(__dirname, 'targets-replaced.json'), JSON.stringify(replacedTargets, null, 2) + '\n');
    console.log('');
    console.log('  targets-replaced.json 已更新');
  }

  // 3a. workspace projects: final install + build + publish (after all stages + dir renames)
  if (allPnpmProjects.size > 0 && allPnpmPublishDirs.length > 0) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  pnpm: 安装 → 构建 → 发布');
    console.log('═══════════════════════════════════════════════════════════');

    // Full sync: now all packages have been published to Verdaccio,
    // so catalog: dep key renames are safe.
    for (const [, proj] of allPnpmProjects) {
      const actualRoot = replaceBrand(proj.root, compiled);
      syncPnpmWorkspaceYaml(actualRoot, compiled);
      syncWorkspaceRefs(actualRoot, compiled);
    }

    for (const [, proj] of allPnpmProjects) {
      const actualRoot = replaceBrand(proj.root, compiled);
      const pm = detectPkgManager(actualRoot);
      if (pm === 'yarn' && !ensureYarn()) process.exit(1);
      const installCmd = pm === 'yarn' ? 'yarn install --no-immutable' : 'pnpm install --no-frozen-lockfile';
      const buildCmd = pm === 'yarn' ? 'yarn workspaces run build' : 'pnpm -r build';
      const label = relative(ROOT, actualRoot);
      if (!NO_INSTALL && !runRetry(installCmd, actualRoot, 'install ' + label)) process.exit(1);
      if (!NO_BUILD) {
        if (!run(buildCmd, actualRoot, 'build ' + label)) process.exit(1);
      }
    }
    // Publish all collected dirs (translate through directory renames)
    if (!NO_PUBLISH) {
      if (!ensureVerdaccio()) process.exit(1);
      const finalPnpmDirs = allPnpmPublishDirs.map(d => replaceBrand(d, compiled));
      publishPackages(finalPnpmDirs, compiled); clearPnpmMetadataCache(finalPnpmDirs);
      for (const [, proj] of allPnpmProjects) {
        const actualRoot = replaceBrand(proj.root, compiled);
        ensureNpmrc({ ...proj, root: actualRoot });
      }
    }
  }

  // 4. Reinstall from Verdaccio (consumer view: uses the packages just published) + test
  if (allPublishProjects.size > 0 && !NO_TEST) {
    // Re-apply .npmrc at post-rename paths
    for (const [, proj] of allPublishProjects) {
      const actualRoot = replaceBrand(proj.root, compiled);
      ensureNpmrc({ ...proj, root: actualRoot });
    }
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  从 Verdaccio 安装已发布包 + 测试（消费方视角）');
    console.log('═══════════════════════════════════════════════════════════');
    for (const [, proj] of allPublishProjects) {
      const actualRoot = replaceBrand(proj.root, compiled);
      const p = { ...proj, root: actualRoot };
      if (!installAndTest(p)) anyFailed = true;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════

if (!DRY_RUN && !anyExistingTarget) {
  console.log('');
  console.log('\x1b[33m⚠ 没有处理任何目标目录：dirs / replaceOnly 都不存在，');
  console.log('  已跳过目录改名、发布、安装和测试，请检查 targets.json 路径。\x1b[0m');
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  完成汇总');
console.log('═══════════════════════════════════════════════════════════');
console.log('#  扫描   替换   重命名  项目              备注');
console.log('─  ─────  ─────  ─────  ────────────────  ────');
let totalScanned = 0, totalReplaced = 0, totalRenames = 0;
for (const r of allResults) {
  console.log(
    String(r.stage).padEnd(2) +
    String(r.scanned).padStart(6) +
    String(r.replaced).padStart(7) +
    String(r.renames).padStart(7) +
    '  ' + r.projects.join(', ').padEnd(17) +
    (r.note || '')
  );
  totalScanned += r.scanned;
  totalReplaced += r.replaced;
  totalRenames += r.renames;
}
console.log('─  ─────  ─────  ─────');
console.log(
  '∑' +
  String(totalScanned).padStart(6) +
  String(totalReplaced).padStart(7) +
  String(totalRenames).padStart(7)
);

if (DRY_RUN) {
  console.log('');
  console.log('(预览模式，未实际修改。去掉 --dry-run 以执行)');
} else if (anyFailed) {
  console.log('');
  console.log('\x1b[31m⚠ 部分失败，请检查后继续\x1b[0m');
}
