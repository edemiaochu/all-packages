/**
 * ── 保护区域（search-ec / search-sensitive 共用）──
 *
 * 密码保护、授权校验这类代码一旦被改名就会失效，所以下面两类内容被视为「受保护区域」：
 *
 *   1. 保护文件：整份文件不参与提取；
 *   2. 保护片段：片段里「本来会被提取程序命中」的标识符不参与提取。
 *
 * 两者共用同一套规则：
 *   - 会被提取出来的标识符不报告（不会出现在 result.json / ec-result.json 里）：
 *     文件 = 整份跳过；片段 = 只跳过片段里命中的标识符；
 *   - 这些被跳过的标识符，在其他文件里也不再提取。
 *     理由：同一个标识符只要有一处被替换，受保护区域里的同名代码就跟着变了，
 *     等于没保护。所以「重复代码」必须一起排除，而不是只跳过区域本身。
 *
 * 配置文件 name-replacer/protected-files.json（缺失时 = 没有保护区域）：
 *   {
 *     "files": [
 *       "itwinjs-core/core/backend/src/PasswordProtection.ts",
 *       "appui/.../license/",
 *       "**\/PasswordProtection.ts",
 *       { "path": "base/units-schema/src/secret.ts", "note": "密码保护" }
 *     ],
 *     "snippets": [
 *       "return {...from, baseUri: `...`, accessToken: from.sasToken }",
 *       { "text": "const KEY = decrypt(ECLicense);", "note": "授权校验" }
 *     ]
 *   }
 *   files 也支持纯数组：["路径1", "路径2"]。
 *
 * 路径规则：
 *   - 相对仓库根目录（name-replacer 的上一级）；也支持绝对路径
 *   - 含 "/" 时按路径后缀匹配（扫描根是仓库子目录时也能命中）
 *   - 不含 "/" 时按文件名（basename）匹配
 *   - 支持 * / ** / ? 通配符；目录条目 = 保护该目录下全部文件
 *   - 保护判定与 scan-exclude.json 无关：即使目录被排除，保护文件仍会被读取
 *
 * 标识符规则：
 *   - 按「完整标识符」精确匹配（大小写不敏感）
 *   - 保护区域里有 fooBar → 所有文件里的 fooBar 都不提取；fooBarExtra 不受影响
 *     （片段里的 fooBar 要先被当前搜索词命中，才会进入排除名单）
 *   - 保护文件只统计代码里的标识符：注释、字符串字面量里的内容不算
 *     （否则保护文件里一条 `"Bentley"` 字符串就会把全局的品牌词提取全挡掉）
 *   - 保护片段按原文收集候选标识符，但只有「和当前搜索词匹配」的才真正排除：
 *     search-ec 按 EC 分词规则筛，search-sensitive 按搜索词筛。
 *     片段里的 minio / azure / from 这类无关词不会被挡，
 *     只有本来就会被提取出来的词（ECXXX、品牌词）才进入排除名单
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { globToRegExp, readTextFileSafely } from './scan-config.mjs';
import { extractIdentifiers } from './identifier-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 配置文件路径 */
export const PROTECTED_FILES_PATH = join(__dirname, 'protected-files.json');

/** 仓库根目录（name-replacer 的上一级），配置里的相对路径以此为基准 */
export const REPO_ROOT = resolve(__dirname, '..');

function toPosix(p) {
  return String(p).replace(/\\/g, '/');
}

function normalizeEntryPath(raw) {
  return toPosix(String(raw).trim()).replace(/^\.\//, '');
}

function entryPathOf(entry) {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object' && typeof entry.path === 'string') return entry.path;
  return null;
}

/**
 * 读取保护区域配置（文件 + 代码片段）。
 * @param {string} [configPath]
 * @returns {{
 *   entries: Array<{path:string,note:string|null}>,
 *   snippets: Array<{text:string,note:string|null}>,
 *   ignored: Array<{raw:string,reason:string}>,
 *   source: string|null, error: string|null, configPath: string
 * }}
 */
export function loadProtectedFileConfig(configPath = PROTECTED_FILES_PATH) {
  const path = configPath || PROTECTED_FILES_PATH;
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      return { entries: [], snippets: [], ignored: [], source: null, error: null, configPath: path };
    }
    process.stderr.write(`⚠️  保护配置解析失败，已忽略: ${path} (${e.message})\n`);
    return { entries: [], snippets: [], ignored: [], source: path, error: e.message, configPath: path };
  }

  const list = Array.isArray(raw)
    ? raw
    : (raw && typeof raw === 'object' && Array.isArray(raw.files) ? raw.files : []);
  const snippetList = !Array.isArray(raw) && raw && typeof raw === 'object' && Array.isArray(raw.snippets)
    ? raw.snippets
    : [];
  const entries = [];
  const snippets = [];
  const ignored = [];

  for (const item of list) {
    if (typeof item === 'string') {
      const p = normalizeEntryPath(item);
      if (p) entries.push({ path: p, note: null });
      else ignored.push({ raw: String(item), reason: '空路径' });
    } else if (item && typeof item === 'object') {
      const p = typeof item.path === 'string' ? normalizeEntryPath(item.path) : '';
      if (p) entries.push({ path: p, note: item.note ?? null });
      else ignored.push({ raw: JSON.stringify(item), reason: '缺少 path' });
    } else {
      ignored.push({ raw: String(item), reason: '格式不对（应为字符串或 { path }）' });
    }
  }

  for (const item of snippetList) {
    if (typeof item === 'string') {
      if (item.trim()) snippets.push({ text: item, note: null });
      else ignored.push({ raw: '（空片段）', reason: '空片段' });
    } else if (item && typeof item === 'object' && typeof item.text === 'string') {
      if (item.text.trim()) snippets.push({ text: item.text, note: item.note ?? null });
      else ignored.push({ raw: JSON.stringify(item), reason: '空片段' });
    } else {
      ignored.push({ raw: String(item), reason: '格式不对（应为字符串或 { text }）' });
    }
  }

  return { entries, snippets, ignored, source: path, error: null, configPath: path };
}

/** 片段条目 → 原文 */
function snippetTextOf(snippet) {
  if (typeof snippet === 'string') return snippet;
  if (snippet && typeof snippet === 'object' && typeof snippet.text === 'string') return snippet.text;
  return null;
}

/**
 * 创建保护文件匹配器。
 * @param {Array<{path:string}>|string[]} entries
 * @param {{repoRoot?:string}} [options]
 */
export function createProtectedFileMatcher(entries, { repoRoot = REPO_ROOT } = {}) {
  const root = resolve(repoRoot);
  const plain = [];
  const globs = [];

  for (const entry of entries || []) {
    const raw = entryPathOf(entry);
    if (raw == null) continue;
    const p = normalizeEntryPath(raw);
    if (!p) continue;

    if (/[*?]/.test(p)) {
      // 相对 pattern 前缀 **/，这样扫描根是仓库子目录、或用绝对路径比对时都能命中
      const pattern = isAbsolute(p) ? toPosix(p) : '**/' + p;
      globs.push({ path: p, re: globToRegExp(pattern) });
    } else {
      plain.push({
        path: p,
        abs: toPosix(isAbsolute(p) ? resolve(p) : resolve(root, p)),
        hasSlash: p.includes('/'),
      });
    }
  }

  /**
   * 文件是否属于保护范围。
   * @param {string} filePath 绝对路径（也接受相对当前目录的路径）
   * @returns {boolean}
   */
  function isProtectedFile(filePath) {
    if (!filePath) return false;
    const abs = toPosix(resolve(filePath));
    const lowerAbs = abs.toLowerCase();

    for (const g of globs) {
      if (g.re.test(abs)) return true;
    }

    const base = basename(abs).toLowerCase();
    for (const e of plain) {
      const lowerAbsEntry = e.abs.toLowerCase();
      if (lowerAbs === lowerAbsEntry) return true;
      // 目录条目：目录下所有文件都受保护
      if (lowerAbs.startsWith(lowerAbsEntry + '/')) return true;
      if (!e.hasSlash) {
        if (base === e.path.toLowerCase()) return true;
      } else if (lowerAbs.endsWith('/' + e.path.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  return { entries: entries || [], globs, plain, isProtectedFile };
}

/**
 * 递归收集目录下的文件。
 * @param {string} dir
 * @param {Set<string>} out
 * @param {{isProtectedFile:(p:string)=>boolean}|null} matcher null = 全部收集
 */
function walkFiles(dir, out, matcher) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walkFiles(full, out, matcher);
    } else if (entry.isFile()) {
      if (!matcher || matcher.isProtectedFile(full)) out.add(resolve(full));
    }
  }
}

/**
 * 把配置条目解析成磁盘上真实存在的文件列表。
 * 与当前扫描目录无关：精确路径即使不在 -d 范围内也会被读取，
 * 这样多个扫描目录分段执行时，保护文件里的标识符依然全局生效。
 *
 * @param {Array<{path:string}>|string[]} entries
 * @param {{repoRoot?:string, scanRoots?:string[], matcher?:object}} [options]
 * @returns {string[]} 绝对路径
 */
export function resolveProtectedFiles(entries, { repoRoot = REPO_ROOT, scanRoots = [], matcher } = {}) {
  const root = resolve(repoRoot);
  const m = matcher || createProtectedFileMatcher(entries, { repoRoot: root });
  const found = new Set();
  const walkRoots = new Set();
  let needScanRoots = false;

  for (const entry of entries || []) {
    const raw = entryPathOf(entry);
    if (raw == null) continue;
    const p = normalizeEntryPath(raw);
    if (!p) continue;

    if (!/[*?]/.test(p)) {
      const abs = isAbsolute(p) ? resolve(p) : resolve(root, p);
      let st;
      try {
        st = statSync(abs);
      } catch {
        continue; // 配置了但不存在：跳过（换分支/删文件后很常见）
      }
      if (st.isFile()) {
        found.add(resolve(abs));
      } else if (st.isDirectory()) {
        walkFiles(abs, found, null);
      }
      continue;
    }

    // 通配符：只遍历固定前缀目录，避免每次都扫整个仓库
    const prefix = p.slice(0, p.search(/[*?]/));
    const slash = prefix.lastIndexOf('/');
    if (slash > 0) {
      const base = prefix.slice(0, slash);
      walkRoots.add(isAbsolute(p) ? resolve(base) : resolve(root, base));
    } else {
      needScanRoots = true; // 形如 **/Password.ts：退回到扫描根目录里找
    }
  }

  for (const dir of walkRoots) {
    if (existsSync(dir)) walkFiles(dir, found, m);
  }
  if (needScanRoots) {
    for (const dir of scanRoots) {
      if (dir && existsSync(dir)) walkFiles(resolve(dir), found, m);
    }
  }

  return [...found];
}

/**
 * 去掉注释和字符串字面量（内容替换成空格，保留换行），只留代码部分。
 *
 * 保护文件里经常有 `"Bentley"` / `"密码错误"` 这类字符串常量，如果把它们当标识符
 * 计入黑名单，品牌词在全局就再也提取不出来了。注释同理。
 *
 * 支持：// 行注释、块注释、'...'、"..."、`...`（模板字符串整段跳过）。
 * 这是启发式处理，不做完整语法解析；引号未闭合时会一直吃到文件尾。
 *
 * @param {string} text
 * @returns {string}
 */
export function stripCommentsAndStrings(text) {
  const src = String(text);
  const out = [];
  let i = 0;
  const n = src.length;

  const blank = (ch) => (ch === '\n' ? '\n' : ' ');

  while (i < n) {
    const ch = src[i];
    const next = i + 1 < n ? src[i + 1] : '';

    // 行注释
    if (ch === '/' && next === '/') {
      while (i < n && src[i] !== '\n') {
        out.push(' ');
        i++;
      }
      continue;
    }

    // 块注释
    if (ch === '/' && next === '*') {
      out.push(' ', ' ');
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        out.push(blank(src[i]));
        i++;
      }
      if (i < n) {
        out.push(' ', ' ');
        i += 2;
      }
      continue;
    }

    // 字符串 / 模板字符串
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      out.push(' ');
      i++;
      while (i < n) {
        const c = src[i];
        if (c === '\\') {
          out.push(' ', ' ');
          i += 2;
          continue;
        }
        if (c === quote) {
          out.push(' ');
          i++;
          break;
        }
        out.push(blank(c));
        i++;
      }
      continue;
    }

    out.push(ch);
    i++;
  }

  return out.join('');
}

/**
 * 从保护文件里收集全部标识符（小写归一化，便于大小写不敏感匹配）。
 * @param {string[]} filePaths
 * @returns {{ identifiers: Set<string>, details: Array<{file:string, identifiers:number, skipped?:string}> }}
 */
export function collectProtectedIdentifiers(filePaths) {
  const identifiers = new Set();
  const details = [];

  for (const filePath of filePaths || []) {
    const text = readTextFileSafely(filePath);
    if (text == null) {
      details.push({ file: filePath, identifiers: 0, skipped: '无法读取（过大或二进制）' });
      continue;
    }
    const found = new Set();
    for (const id of extractIdentifiers(stripCommentsAndStrings(text))) {
      if (/[A-Za-z0-9]/.test(id)) found.add(id); // 过滤 ${ 里的裸 $ / 裸 _
    }
    for (const id of found) identifiers.add(id.toLowerCase());
    details.push({ file: filePath, identifiers: found.size });
  }

  return { identifiers, details };
}

/**
 * 从保护片段里收集标识符（按原文，包括字符串里的词）。
 *
 * 片段是用户主动挑出来的一块代码，里面的内容一律视为受保护；
 * 因此这里不做注释 / 字符串剥离 —— 片段里的 "Bentley"、ECXXX 都要排除。
 *
 * @param {Array<{text:string,note?:string|null}>|string[]} snippets
 * @returns {{ identifiers: Set<string>, details: Array<{snippet:string,note:string|null,identifiers:number}> }}
 */
export function collectSnippetIdentifiers(snippets) {
  const identifiers = new Set();
  const details = [];

  for (const snippet of snippets || []) {
    const text = snippetTextOf(snippet);
    if (text == null) continue;
    const found = new Set();
    for (const id of extractIdentifiers(text)) {
      if (/[A-Za-z0-9]/.test(id)) found.add(id); // 过滤 ${ 里的裸 $ / 裸 _
    }
    // 保留原始大小写：调用方要按搜索规则（EC 分词 / 敏感词）再筛一遍，
    // 只有提取程序真的会提取的标识符才进入排除名单。
    for (const id of found) identifiers.add(id);
    details.push({
      snippet: text,
      note: (snippet && typeof snippet === 'object' && snippet.note) ? snippet.note : null,
      identifiers: found.size,
      names: [...found].sort(),
    });
  }

  return { identifiers, details };
}

/**
 * 一步加载保护区域：配置 → 文件列表 / 片段 → 标识符黑名单 + 扫描过滤匹配器。
 * @param {{configPath?:string, repoRoot?:string, scanRoots?:string[]}} [options]
 */
export function loadProtectedFiles({ configPath, repoRoot = REPO_ROOT, scanRoots = [] } = {}) {
  const {
    entries, snippets, ignored, source, error, configPath: resolvedPath,
  } = loadProtectedFileConfig(configPath);
  const matcher = createProtectedFileMatcher(entries, { repoRoot });
  const files = resolveProtectedFiles(entries, { repoRoot, scanRoots, matcher });
  const { identifiers, details } = collectProtectedIdentifiers(files);
  const snippetResult = collectSnippetIdentifiers(snippets);

  return {
    source, error, configPath: resolvedPath, entries, snippets, ignored,
    files, details, matcher,
    // 保护文件里的标识符（小写）直接全局排除
    identifiers,
    // 保护片段里的标识符（原始大小写）：由调用方按当前搜索规则筛，
    // 只有真正会被提取的那些才排除，避免把 minio/azure/from 这类无关词也挡掉
    snippetIdentifiers: snippetResult.identifiers,
    snippetDetails: snippetResult.details,
  };
}

/**
 * 供日志使用的一行摘要。
 * @param {ReturnType<typeof loadProtectedFiles>} result
 * @param {string} [repoRoot]
 */
export function describeProtectedFiles(result, repoRoot = REPO_ROOT) {
  if (!result) return '未启用';
  if (!result.source) {
    return result.configPath === PROTECTED_FILES_PATH
      ? '未配置 protected-files.json'
      : `未找到: ${result.configPath}`;
  }
  if (result.error) return `配置解析失败: ${result.source}`;
  const snippetCount = result.snippets ? result.snippets.length : 0;
  if (result.entries.length === 0 && snippetCount === 0) {
    return '未配置（protected-files.json 的 files / snippets 为空）';
  }
  if (result.files.length === 0 && snippetCount === 0) {
    return `配置了 ${result.entries.length} 条，但没有命中任何文件`;
  }
  const fileLabel = result.files
    .map(f => relative(repoRoot, f).replace(/\\/g, '/'))
    .join(', ');
  const parts = [];
  if (result.files.length > 0) parts.push(`${result.files.length} 个文件（${result.identifiers.size} 个标识符）`);
  if (snippetCount > 0) parts.push(`${snippetCount} 段代码片段（按搜索词筛选后排除）`);
  return parts.join(' / ') + (fileLabel ? ` — ${fileLabel}` : '');
}

// ── CLI: 查看当前生效的保护区域 ────────────────────────────────────────

function printProtectedFiles(result, asJson, repoRoot, wordFilter = null) {
  const files = result.files.map(f => ({
    file: relative(repoRoot, f).replace(/\\/g, '/'),
    identifiers: result.details.find(d => d.file === f)?.identifiers ?? 0,
  }));
  const filterLower = wordFilter ? String(wordFilter).toLowerCase() : null;
  const snippets = (result.snippetDetails || []).map(s => {
    const names = s.names || [];
    return {
      snippet: s.snippet.length > 100 ? s.snippet.slice(0, 97) + '...' : s.snippet,
      note: s.note,
      identifiers: s.identifiers,
      names,
      // 片段里的标识符只有和搜索词匹配时才会真正被排除；--word 只是子串粗筛
      matched: filterLower ? names.filter(n => n.toLowerCase().includes(filterLower)) : names,
    };
  });

  if (asJson) {
    console.log(JSON.stringify({
      config: result.source,
      error: result.error,
      entries: result.entries,
      snippets: result.snippets,
      ignored: result.ignored,
      files,
      snippetIdentifiers: snippets,
      identifierCount: result.identifiers.size,
      wordFilter: wordFilter || null,
    }, null, 2));
    return;
  }

  if (!result.source) {
    console.log('ℹ️  未找到 protected-files.json（没有保护区域）');
    console.log('   需要时: cp name-replacer/protected-files.example.json name-replacer/protected-files.json');
    return;
  }

  console.log(`🔒 保护配置: ${result.source}`);
  console.log(`   文件条目 ${result.entries.length} 个（命中 ${result.files.length} 个文件，`
    + `${result.identifiers.size} 个标识符），代码片段 ${result.snippets.length} 段`);
  console.log('');
  if (result.entries.length === 0 && result.snippets.length === 0) {
    console.log('   （files / snippets 为空，当前没有保护区域；示例见 protected-files.example.json）');
  } else {
    if (files.length > 0) {
      const width = Math.max(6, ...files.map(f => f.file.length));
      console.log('  ' + '文件'.padEnd(width) + '  标识符');
      console.log('  ' + '─'.repeat(width) + '  ' + '─'.repeat(8));
      for (const f of files) {
        console.log('  ' + f.file.padEnd(width) + '  ' + String(f.identifiers).padStart(6));
      }
    } else if (result.entries.length > 0) {
      console.log('   （文件条目没有命中任何文件，检查路径是否相对仓库根目录）');
    }
    if (snippets.length > 0) {
      if (files.length > 0) console.log('');
      console.log('  代码片段:');
      for (const s of snippets) {
        console.log(`   • ${s.snippet}  ${DIM_IDENT(s.identifiers)}${s.note ? `  — ${s.note}` : ''}`);
        if (filterLower) {
          console.log(s.matched.length > 0
            ? `     与 "${wordFilter}" 匹配、会被排除: ${s.matched.join(', ')}`
            : `     没有与 "${wordFilter}" 匹配的标识符（该片段不影响这次提取）`);
        } else {
          console.log(`     片段内候选标识符 ${s.identifiers} 个；实际只排除与搜索词匹配的`
            + '（加 --word <词> 查看，运行 search 时会打印实际排除项）');
        }
      }
    }
  }
  if (result.ignored.length > 0) {
    console.log('');
    console.log(`未纳入的配置项: ${result.ignored.length} 个`);
    for (const i of result.ignored) {
      console.log(`  ${i.raw}  — ${i.reason}`);
    }
  }
  console.log('');
  console.log('说明: 保护文件整份不提取；保护片段只排除与搜索词匹配的标识符。'
    + '被排除的标识符在所有文件里都不再提取。');
}

function DIM_IDENT(n) {
  return `（${n} 个标识符）`;
}

const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/');
if (isMain) {
  const argv = process.argv.slice(2);
  const configIdx = argv.indexOf('--config');
  const configPath = configIdx !== -1 ? argv[configIdx + 1] : undefined;
  const wordIdx = argv.indexOf('--word');
  const wordFilter = wordIdx !== -1 ? argv[wordIdx + 1] : null;
  if ((configIdx !== -1 && !configPath) || (wordIdx !== -1 && !wordFilter)) {
    console.error('用法: node name-replacer/protected-files.mjs [--json] [--config <路径>] [--word <搜索词>]');
    process.exit(1);
  }
  const result = loadProtectedFiles({ configPath, repoRoot: REPO_ROOT, scanRoots: [REPO_ROOT] });
  printProtectedFiles(result, argv.includes('--json'), REPO_ROOT, wordFilter);
}
