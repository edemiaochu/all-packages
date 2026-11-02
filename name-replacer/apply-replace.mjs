import { readFileSync, writeFileSync, readdirSync, statSync, renameSync, existsSync } from 'fs';
import { join, extname, dirname, relative, basename } from 'path';
import { fileURLToPath } from 'url';
import { loadScanFilter } from './scan-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MAPPING_PATH = join(__dirname, 'name-mapping.json');
const EXCLUDE_PATH = join(__dirname, 'exclude-list.json');
const EXCLUDE_BASE = __dirname;  // exclude patterns are relative to exclude-list.json's directory

// ── 扫描排除配置（name-replacer/scan-exclude.json）─────────────────
// 默认扫描目标目录下的所有文件夹和所有扩展名；只有配置里列出的
// 目录 / 扩展名 / 文件名会被排除。配置文件缺失时不排除任何内容。
// 例外：含 package.json 的真实包目录即使名字命中排除规则也继续处理。
let _scanFilter = null;
function scanFilter() {
  if (!_scanFilter) _scanFilter = loadScanFilter();
  return _scanFilter;
}

// 即使命中目录排除规则也仍要处理的路径（相对 ROOT）。
const SKIP_DIR_OVERRIDES = new Set([
  'base/icons-generic-webfont/dist',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ── Helpers ────────────────────────────────────────────────────────
function isBinary(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (scanFilter().shouldSkipExt(ext)) return true;
  try {
    const buf = readFileSync(filePath);
    if (buf.length > MAX_FILE_SIZE) return true;
    const limit = Math.min(buf.length, 4096);
    for (let i = 0; i < limit; i++) {
      if (buf[i] === 0) return true;
    }
  } catch {
    return true;
  }
  return false;
}

function isRealPackageDir(fullPath) {
  return existsSync(join(fullPath, 'package.json'));
}

/** 目录是否跳过（配置排除 + 真实包目录 / 显式覆盖例外）。 */
function shouldSkipDir(fullPath) {
  const name = basename(fullPath);
  const relPath = relative(ROOT, fullPath).replace(/\\/g, '/');
  if (!scanFilter().shouldSkipDir(name, relPath)) return false;
  if (isRealPackageDir(fullPath)) return false;
  if (SKIP_DIR_OVERRIDES.has(relPath)) return false;
  return true;
}

function shouldSkipFile(filePath) {
  const name = filePath.split(/[\\/]/).pop();
  const relPath = relative(ROOT, filePath).replace(/\\/g, '/');

  if (scanFilter().shouldSkipName(name, relPath)) return true;
  if (scanFilter().shouldSkipExt(extname(name).toLowerCase())) return true;

  const parts = relPath.split('/');
  for (let i = 0; i < parts.length - 1; i++) {
    if (shouldSkipDir(join(ROOT, parts.slice(0, i + 1).join('/')))) return true;
  }
  return false;
}

// ── Exclude list ────────────────────────────────────────────────────
function loadExcludeList() {
  try {
    const raw = JSON.parse(readFileSync(EXCLUDE_PATH, 'utf-8'));
    const list = (Array.isArray(raw) ? raw : []).map(entry => {
      if (typeof entry === 'string') return { text: entry, paths: null }; // null = global
      return { text: entry.text, paths: entry.paths || null };
    });
    // Sort by text length descending so longer strings are protected first
    list.sort((a, b) => b.text.length - a.text.length);
    return list;
  } catch {
    return [];
  }
}

/**
 * Check if a relative file path matches any of the given glob patterns.
 * Supports `**` for recursive matching and `*` for single-segment wildcard.
 */
function matchesPath(filePath, patterns) {
  if (!patterns) return false;
  const normalized = filePath.replace(/\\/g, '/');
  for (const pattern of patterns) {
    const regex = new RegExp(
      '^' + pattern.replace(/\\/g, '/').replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\x00').replace(/\*/g, '[^/]*').replace(/\x00/g, '.*') + '$'
    );
    if (regex.test(normalized)) return true;
  }
  return false;
}

/**
 * Filter exclude list to entries applicable to the given file path.
 * Entries with paths=null apply globally. Others only apply when filePath matches.
 */
function filterExcludes(excludeList, filePath) {
  if (!filePath) return excludeList.filter(e => e.paths === null);
  return excludeList.filter(e => e.paths === null || matchesPath(filePath, e.paths));
}

// ── Placeholder protection ─────────────────────────────────────────
let _phCounter = 0;
function protectContent(content, excludeList, filePath) {
  const applicable = filterExcludes(excludeList, filePath);
  const placeholders = new Map();
  let result = content;
  for (const { text: word } of applicable) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    result = result.replace(regex, (match) => {
      const ph = `__EXCL_PH_${_phCounter}__`;
      _phCounter++;
      placeholders.set(ph, match);
      return ph;
    });
  }
  return { content: result, placeholders };
}

function restoreContent(content, placeholders) {
  let result = content;
  for (const [ph, original] of placeholders) {
    const escaped = ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), original);
  }
  return result;
}

// ── Build regex from mapping ───────────────────────────────────────
function buildRegex(mapping) {
  const replacements = Object.entries(mapping)
    .sort(([a], [b]) => b.length - a.length);
  if (replacements.length === 0) return null;
  const escaped = replacements.map(([old]) =>
    old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  return {
    regex: new RegExp('\\b(' + escaped.join('|') + ')\\b', 'g'),
    lookup: new Map(replacements),
  };
}

// ── Replace name of a file/directory ───────────────────────────────
function replaceName(fullPath, regex, lookup, excludeList) {
  const oldName = basename(fullPath);
  const relativePath = relative(EXCLUDE_BASE, fullPath);
  const { content: protectedName, placeholders } = protectContent(oldName, excludeList, relativePath);
  const newName = protectedName.replace(regex, (match) => {
    const rep = lookup.get(match);
    return rep !== undefined ? rep : match;
  });
  const finalName = restoreContent(newName, placeholders);
  if (finalName !== oldName) {
    const dir = dirname(fullPath);
    const newPath = join(dir, finalName);
    if (fullPath === ROOT) return null;
    return { oldPath: fullPath, oldName, newPath, newName: finalName };
  }
  return null;
}

// ── Replace content in a single file ───────────────────────────────
function replaceInFile(filePath, regex, lookup, dryRun, excludeList) {
  if (shouldSkipFile(filePath) || isBinary(filePath)) return false;

  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return false;
  }

  // Protect exclude strings with placeholders (path-aware)
  const relativePath = relative(EXCLUDE_BASE, filePath);
  const { content: protectedContent, placeholders } = protectContent(content, excludeList, relativePath);

  let changed = false;
  const newContent = protectedContent.replace(regex, (match) => {
    const replacement = lookup.get(match);
    if (replacement !== undefined) {
      changed = true;
      return replacement;
    }
    return match;
  });

  // Restore protected strings
  const finalContent = restoreContent(newContent, placeholders);

  // Also check if the content actually changed after restoration
  if (changed && finalContent !== content) {
    if (!dryRun) {
      writeFileSync(filePath, finalContent, 'utf-8');
    }
    return true;
  }
  return false;
}

// ── Walk a directory tree and apply replacements ───────────────────
function walkDir(dir, regex, lookup, dryRun, renames, logPrefix, excludeList) {
  // Hard guard: never touch name-replacer/ or anything inside it
  if (dir.replace(/\\/g, '/').split('/').includes('name-replacer')) {
    return { scanned: 0, replaced: 0 };
  }
  let scanned = 0;
  let replaced = 0;

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return { scanned, replaced };
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!shouldSkipDir(fullPath)) {
        const result = walkDir(fullPath, regex, lookup, dryRun, renames, logPrefix, excludeList);
        scanned += result.scanned;
        replaced += result.replaced;
      }
    } else if (entry.isFile()) {
      scanned++;
      const contentChanged = replaceInFile(fullPath, regex, lookup, dryRun, excludeList);
      if (contentChanged) {
        replaced++;
        console.log((logPrefix || '') + '  ' + relative(ROOT, fullPath));
      }
      // Rename file if needed
      if (!shouldSkipFile(fullPath)) {
        const ren = replaceName(fullPath, regex, lookup, excludeList);
        if (ren) {
          ren.isDir = false;
          if (dryRun) {
            console.log((logPrefix || '') + '  [rename] ' + relative(ROOT, ren.oldPath) + ' → ' + ren.newName);
          } else {
            renameSync(ren.oldPath, ren.newPath);
          }
          renames.push(ren);
        }
      }
    }
  }

  // Rename directory if needed (bottom-up)
  if (!shouldSkipDir(dir)) {
    const dirRen = replaceName(dir, regex, lookup, excludeList);
    if (dirRen) {
      dirRen.isDir = true;
      if (dryRun) {
        console.log((logPrefix || '') + '  [rename dir] ' + relative(ROOT, dirRen.oldPath) + ' → ' + dirRen.newName);
      } else {
        renameSync(dirRen.oldPath, dirRen.newPath);
      }
      renames.push(dirRen);
    }
  }

  return { scanned, replaced };
}

// ═══════════════════════════════════════════════════════════════════
// Public API — imported by replace-staged.mjs
// ═══════════════════════════════════════════════════════════════════

/**
 * Apply brand name replacements to a target directory.
 * @param {string} targetDir - absolute path to the target directory
 * @param {boolean} dryRun - if true, only preview, don't write
 * @param {string} [logPrefix] - optional prefix for log lines
 * @returns {{ scanned: number, replaced: number, renames: object[] }}
 */
export function applyReplacements(targetDir, dryRun, logPrefix) {
  const mapping = JSON.parse(readFileSync(MAPPING_PATH, 'utf-8'));
  const compiled = buildRegex(mapping);

  if (!compiled) {
    console.log('没有可用的映射规则');
    return { scanned: 0, replaced: 0, renames: [] };
  }

  const renames = [];
  const excludeList = loadExcludeList();
  const start = Date.now();
  const result = walkDir(targetDir, compiled.regex, compiled.lookup, dryRun, renames, logPrefix, excludeList);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log((logPrefix || '') + '  → scanned: ' + result.scanned + ' | replaced: ' + result.replaced + ' | renamed: ' + renames.length + ' | ' + elapsed + 's');
  return { scanned: result.scanned, replaced: result.replaced, renames };
}

// ═══════════════════════════════════════════════════════════════════
// CLI entry — when run directly
// ═══════════════════════════════════════════════════════════════════

const isDirectRun = process.argv[1] && (
  process.argv[1].replace(/\\/g, '/').endsWith('name-replacer/apply-replace.mjs') ||
  process.argv[1] === fileURLToPath(import.meta.url)
);

if (isDirectRun) {
  const DRY_RUN = process.argv.includes('--dry-run');
  const targetIdx = process.argv.indexOf('--target');
  const TARGET_DIR = targetIdx !== -1 ? process.argv[targetIdx + 1] : null;

  const walkRoot = TARGET_DIR ? join(ROOT, TARGET_DIR) : ROOT;

  if (TARGET_DIR && !statSync(walkRoot, { throwIfNoEntry: false })?.isDirectory()) {
    console.error('目标文件夹不存在: ' + walkRoot);
    process.exit(1);
  }

  console.log('目标目录: ' + walkRoot);
  if (DRY_RUN) console.log('模式: 仅预览 (--dry-run)\n');
  else console.log('');

  const result = applyReplacements(walkRoot, DRY_RUN);

  if (DRY_RUN && result.replaced > 0) {
    console.log('(预览模式，未实际修改文件。去掉 --dry-run 参数以执行替换)');
  }
}
