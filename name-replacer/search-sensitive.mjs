/**
 * ── 敏感词搜索工具 ──
 *
 * 参照 extract-brand-words.mjs 的架构，支持任意词列表搜索。
 * 输出一张 "词 × 文件" 交叉表。
 *
 * 两维度搜索：
 *   1. 文件内容 — 子串匹配（默认）或标识符边界匹配（--whole-word）
 *   2. 路径名称 — 目录名/文件名语义分词匹配（默认启用）
 *
 * 用法：
 *   node name-replacer/search-sensitive.mjs [options] --words <list>
 *
 * 选项：
 *   -w, --words <list>      逗号分隔的搜索词
 *   --words-file <path>     从文件读取搜索词（JSON数组/对象 或 纯文本）
 *   -d, --dir <path>        搜索目录（默认当前目录）
 *   -o, --output <path>     JSON 输出文件路径（默认 stdout）
 *   --json                  终端输出 JSON 而非表格
 *   --whole-word            仅匹配标识符边界（默认：子串匹配）
 *   --no-paths              禁用路径名称搜索（仅搜索文件内容）
 *   --ext <exts>            只扫描这些扩展名，逗号分隔（默认：所有扩展名）
 *   --ext-file <path>       从文件读取扩展名列表（与 --ext 等效，二者并用时合并）
 *
 * 默认扫描范围: 指定目录下的所有文件夹 + 所有扩展名。
 *   需要排除的文件夹 / 扩展名 / 文件名写在 name-replacer/scan-exclude.json：
 *     { "dirs": [...], "exts": [...], "files": [...] }
 *   配置文件缺失时不排除任何内容。
 *
 * 基础替换词保护:
 *   已定稿的新词（base-mapping.json 的值、replace-server-config.json 的 baseName、
 *   exclude-list.json 的条目）内部不再命中搜索词，避免把 szewec 里的 ec 再替换一次。
 *   额外手工保护词写在 name-replacer/protected-words.json（可选）。
 *   --include-ext <exts>    强制包含被配置排除的扩展名（如 svg）
 *   --include-dirs <names>  强制进入被配置排除的目录（如 dist,lib）
 *   --protected-files <path> 保护文件配置（默认 name-replacer/protected-files.json）
 *   --no-protected-files    关闭保护文件（临时调试）
 *   --context <n>           显示 N 字上下文（默认 40）
 *   --limit-files <n>       最多显示 N 个文件（默认 200）
 *
 * 示例：
 *   # DGN 相关全貌
 *   node name-replacer/search-sensitive.mjs -d itwinjs-core/core/backend/src -w "dgn,DgnDb,openDgnDb,dgn_View,DgnCore,dgnBoundaryType"
 *
 *   # 品牌词残留检查
 *   node name-replacer/search-sensitive.mjs -d ../NameReplaceTest -w "Bentley,iModelHub,IModelDb"
 *
 *   # 导出 JSON
 *   node name-replacer/search-sensitive.mjs -d ./src -w "iModel,ITwin" -o result.json
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname, relative, resolve, dirname, normalize } from 'path';
import { fileURLToPath } from 'url';
import { loadScanFilter, readTextFileSafely } from './scan-config.mjs';
import { loadProtector } from './protected-words.mjs';
import { loadProtectedFiles, describeProtectedFiles } from './protected-files.mjs';
import { extractIdentifiers } from './identifier-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ── CLI 参数解析 ──────────────────────────────────────────────────────

/**
 * 扩展名归一化：补前导点 + 小写（'TS' / '.ts' → '.ts'）。
 */
function normalizeExt(e) {
  const s = String(e).trim();
  return (s.startsWith('.') ? s : '.' + s).toLowerCase();
}

function parseArgs(argv) {
  const args = {
    words: [],
    exactWords: new Set(),  // 精确匹配词集合（大小写不敏感 + 禁用变体生成，用 /gi 字面匹配）
    wordsFile: null,
    dir: process.cwd(),
    output: null,
    json: false,
    wholeWord: false,
    noPaths: false,
    // 空数组 = 不限制扩展名（扫描全部）；--ext/--ext-file 才会变成包含白名单
    extensions: [],
    extFile: null,          // --ext-file：从文件读取扩展名列表（与 --ext 等效）
    extExplicit: false,     // --ext/--ext-file 显式指定时只扫这些扩展名
    forceExts: new Set(),   // --include-ext：强制包含被配置排除的扩展名
    forceDirs: new Set(),   // --include-dirs：强制进入被配置排除的目录
    context: 40,
    limitFiles: 200,
    concise: false,
    protectedFiles: null,   // --protected-files：自定义保护文件配置
    noProtectedFiles: false, // --no-protected-files：临时关闭保护文件
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '-w': case '--words': {
        const rawWords = argv[++i].split(/[,;；，]/).map(s => s.trim()).filter(Boolean);
        for (const w of rawWords) {
          if (w.startsWith('!')) {
            const word = w.slice(1);
            args.words.push(word);
            args.exactWords.add(word);
          } else {
            args.words.push(w);
          }
        }
        break;
      }
      case '--words-file':
        args.wordsFile = argv[++i];
        break;
      case '-d': case '--dir':
        args.dir = resolve(argv[++i]);
        break;
      case '-o': case '--output':
        args.output = resolve(argv[++i]);
        break;
      case '--json':
        args.json = true;
        break;
      case '--whole-word':
        args.wholeWord = true;
        break;
      case '--concise':
        args.concise = true;
        break;
      case '--ext':
        args.extensions = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
        args.extExplicit = true;
        break;
      case '--ext-file':
        args.extFile = argv[++i];
        break;
      case '--include-ext':
        for (const e of argv[++i].split(',').map(s => s.trim()).filter(Boolean)) {
          args.forceExts.add(normalizeExt(e));
        }
        break;
      case '--include-dirs':
        for (const d of argv[++i].split(',').map(s => s.trim()).filter(Boolean)) {
          args.forceDirs.add(d);
        }
        break;
      case '--context':
        args.context = parseInt(argv[++i], 10);
        break;
      case '--limit-files':
        args.limitFiles = parseInt(argv[++i], 10);
        break;
      case '--no-paths':
        args.noPaths = true;
        break;
      case '--protected-files':
        args.protectedFiles = resolve(argv[++i]);
        break;
      case '--no-protected-files':
        args.noProtectedFiles = true;
        break;
      case '--help': case '-h':
        args.help = true;
        break;
    }
  }

  return args;
}

// ── 大小写变体（同 extract-brand-words） ──────────────────────────────

/**
 * 生成单词的全部大小写排列（2^n 种），长变体优先。
 * 用于构建 case-insensitive 正则（比 /i 更可控，可区分大小写敏感/不敏感的 match）。
 */
function allCaseVariations(word) {
  const results = [];
  const n = word.length;
  const total = 1 << n;
  for (let mask = 0; mask < total; mask++) {
    let variant = '';
    for (let bit = 0; bit < n; bit++) {
      const ch = word[bit];
      variant += (mask & (1 << bit)) ? ch.toUpperCase() : ch.toLowerCase();
    }
    results.push(variant);
  }
  results.sort((a, b) => b.length - a.length);
  return results;
}

/**
 * 为一组搜索词构建正则，每个词返回 { word, regex, exact }。
 *
 * 匹配模式：
 *   exact=true   精确字面匹配（大小写敏感，禁用正则/变体）
 *   exact=false  默认模式（case-insensitive）：
 *     短词（≤8 字符）→ 全大小写变体精确匹配
 *     长词（>8 字符）→ /gi 标志（避免 2^n 指数爆炸）
 */
function buildSearchPatterns(words, { wholeWord, exactWords }) {
  const MAX_CASE_VARIATIONS = 8;

  return words.map((word) => {
    const boundary = wholeWord ? '(?<![a-zA-Z0-9_$])' : '';
    const endBoundary = wholeWord ? '(?![a-zA-Z0-9_$])' : '';
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isExact = exactWords && exactWords.has(word);

    let pattern;
    let flags = 'g';

    if (isExact) {
      // 精确匹配：大小写不敏感，原样字面匹配，不生成变体
      pattern = escaped;
      flags = 'gi';
    } else if (word.length <= MAX_CASE_VARIATIONS) {
      // 短词：全大小写变体精确匹配（case-insensitive via variants）
      const variants = allCaseVariations(word);
      const escapedVariants = variants.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      pattern = escapedVariants.join('|');
    } else {
      // 长词：case-insensitive 正则（避免 2^n 爆炸）
      pattern = escaped;
      flags = 'gi';
    }

    return {
      word,
      exact: isExact,
      regex: new RegExp(boundary + '(' + pattern + ')' + endBoundary, flags),
    };
  });
}

// ── 从文件读取搜索词 ──────────────────────────────────────────────────

/**
 * 从文件读取搜索词列表。
 *
 * 支持三种格式：
 *   1. JSON 数组（元素可以是字符串或对象）:
 *      ["dgn", {"word": "bentley", "exact": true}]
 *   2. JSON 对象: {"words": [...]}
 *   3. 纯文本: 每行一个词，!前缀=精确匹配，#=注释，逗号/分号分隔
 *
 * @returns {{ words: string[], exactWords: Set<string> }}
 */
function readWordsFromFile(filePath) {
  const text = readFileSync(filePath, 'utf-8').trim();
  const words = [];
  const exactWords = new Set();

  /**
   * 解析单个词条目（字符串或 {word, exact} 对象）
   */
  function parseEntry(entry) {
    if (typeof entry === 'string') {
      // 纯文本中的 ! 前缀表示精确匹配
      if (entry.startsWith('!')) {
        const w = entry.slice(1);
        words.push(w);
        exactWords.add(w);
      } else {
        words.push(entry);
      }
    } else if (entry && typeof entry === 'object' && entry.word) {
      words.push(entry.word);
      if (entry.exact) exactWords.add(entry.word);
    }
  }

  // 尝试 JSON 解析
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const data = JSON.parse(text);
      const entries = Array.isArray(data) ? data
        : data.words ? data.words
        : data.searchWords ? data.searchWords
        : null;
      if (entries && Array.isArray(entries)) {
        for (const e of entries) parseEntry(e);
        return { words, exactWords };
      }
    } catch { /* 不是有效 JSON，按纯文本处理 */ }
  }

  // 纯文本：按行 + 逗号/分号拆分
  for (const line of text.split(/[\r\n]+/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue; // 跳过空行和注释
    for (const entry of trimmed.split(/[,;；，]/)) {
      const s = entry.trim();
      if (!s) continue;
      parseEntry(s); // ! 前缀在 parseEntry 中处理
    }
  }
  return { words, exactWords };
}

/**
 * 从文件读取扩展名列表（--ext-file）。
 *
 * 支持三种格式（同 --words-file 约定）：
 *   1. JSON 数组: ["ts", "js", "svg"]
 *   2. JSON 对象: {"extensions": ["ts", "js", "svg"]}
 *   3. 纯文本: 每行一个（可逗号/分号分隔），#=注释
 *
 * 条目可带前导点也可不带（'svg' / '.svg' 均可），不做去重（合并时统一处理）。
 *
 * @returns {string[]} 原样返回文件中的扩展名条目
 */
function readExtensionsFromFile(filePath) {
  const text = readFileSync(filePath, 'utf-8').trim();
  const exts = [];

  function add(raw) {
    if (typeof raw !== 'string') return;
    for (const part of raw.split(/[,;；，]/)) {
      const s = part.trim();
      if (s) exts.push(s);
    }
  }

  // JSON
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const data = JSON.parse(text);
      const entries = Array.isArray(data) ? data
        : data.extensions ? data.extensions
        : data.exts ? data.exts
        : null;
      if (entries && Array.isArray(entries)) {
        for (const e of entries) add(e);
        return exts;
      }
    } catch { /* 不是有效 JSON，按纯文本处理 */ }
  }

  // 纯文本：按行 + 逗号/分号拆分
  for (const line of text.split(/[\r\n]+/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue; // 跳过空行和注释
    add(trimmed);
  }
  return exts;
}

// ── 路径名称分词 ──────────────────────────────────────────────────────

/**
 * 将 camelCase / PascalCase / snake_case 标识符拆分为语义 token 列表。
 */
function tokenizeIdentifier(id) {
  const clean = id.replace(/^[$_]+/, '');
  const tokens = [];
  const segments = clean.split('_');
  for (const seg of segments) {
    if (!seg) continue;
    tokens.push(...splitCamelCase(seg));
  }
  return tokens;
}

function splitCamelCase(seg) {
  const tokens = [];
  let current = '';
  const len = seg.length;

  for (let i = 0; i < len; i++) {
    const ch = seg[i];
    const next = i + 1 < len ? seg[i + 1] : null;

    if (/\d/.test(ch)) {
      if (current && !/\d/.test(current[current.length - 1])) {
        tokens.push(current);
        current = '';
      }
      current += ch;
      if (next && !/\d/.test(next)) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    if (/[a-z]/.test(ch)) {
      current += ch;
      if (next && /[A-Z]/.test(next)) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    if (/[A-Z]/.test(ch)) {
      if (current && /[A-Z]/.test(current[current.length - 1]) && next && /[a-z]/.test(next)) {
        tokens.push(current);
        current = '';
      }
      current += ch;
      continue;
    }

    current += ch;
  }

  if (current) tokens.push(current);
  return tokens;
}

/**
 * 对文件/目录名做语义分词。
 * 与标识符分词类似，但额外处理 . 和 - 作为分隔符。
 */
function tokenizePathName(name) {
  const lastDot = name.lastIndexOf('.');
  const base = lastDot > 0 ? name.substring(0, lastDot) : name;
  const normalized = base.replace(/[.-]/g, '_');
  return tokenizeIdentifier(normalized);
}

/**
 * 检查路径名中是否包含任意搜索词（大小写不敏感，子串匹配）。
 */
function pathNameContainsAnyWord(name, words) {
  const tokens = tokenizePathName(name);

  // 贪婪匹配连续 token（解决 iTwinUI → ["i","Twin","UI"] 丢失 iTwin 的问题）
  for (let i = 0; i < tokens.length; i++) {
    for (let len = tokens.length - i; len >= 1; len--) {
      const joined = tokens.slice(i, i + len).join('');
      const lower = joined.toLowerCase();
      for (const w of words) {
        if (lower.includes(w.toLowerCase())) {
          return { matched: true, matchedWord: w, matchedToken: joined };
        }
      }
    }
  }
  return { matched: false, matchedWord: null, matchedToken: null };
}

// ── 文件收集 ──────────────────────────────────────────────────────────

function collectFiles(rootDir, extensions, { collectPaths, words, forceExts = new Set(), forceDirs = new Set(), extExplicit = false, filter = loadScanFilter(), protector = null } = {}) {
  const extSet = new Set(extensions.map(e => e.startsWith('.') ? e.toLowerCase() : '.' + e.toLowerCase()));
  const files = [];
  const pathMatches = [];

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = join(dir, entry.name);
      const relPath = relative(rootDir, full).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        // 配置排除的目录：整个子树不扫描、也不报告路径命中
        if (filter.shouldSkipDir(entry.name, relPath) && !forceDirs.has(entry.name)) continue;

        if (collectPaths) {
          const { matched, matchedWord, matchedToken } = pathNameContainsAnyWord(entry.name, words);
          if (matched && !(protector && protector.isMatchProtected(entry.name, matchedToken))) {
            pathMatches.push({
              relPath,
              type: 'directory',
              name: entry.name,
              matchedWord,
              matchedToken,
            });
          }
        }

        walk(full);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        const forced = forceExts.has(ext);

        // 文件名规则（锁文件等）始终排除；--include-ext 可强制放行
        if (!forced && filter.shouldSkipName(entry.name, relPath)) continue;
        // 扩展名排除：显式 --ext 时以白名单为准，--include-ext 可强制放行
        if (!extExplicit && !forced && filter.shouldSkipExt(ext)) continue;
        if (extExplicit && !extSet.has(ext) && !forced) continue;

        if (collectPaths) {
          const { matched, matchedWord, matchedToken } = pathNameContainsAnyWord(entry.name, words);
          if (matched && !(protector && protector.isMatchProtected(entry.name, matchedToken))) {
            pathMatches.push({
              relPath,
              type: 'file-name',
              name: entry.name,
              matchedWord,
              matchedToken,
            });
          }
        }

        files.push(full);
      }
    }
  }

  walk(rootDir);
  return { files, pathMatches };
}

// ── 搜索 ──────────────────────────────────────────────────────────────

/**
 * 取 index 所在的最小标识符（连续的 \w / $）。
 * 用于判断一次命中是否落在某个受保护的基础替换词内部。
 */
function identifierAt(text, index, length) {
  let start = index;
  while (start > 0 && /[\w$]/.test(text[start - 1])) start--;
  let end = index + length;
  while (end < text.length && /[\w$]/.test(text[end])) end++;
  return text.slice(start, end);
}

/**
 * 搜索一个文件，返回按搜索词分组的匹配信息。
 * @param {object|null} protector - 基础替换词保护器；命中落在受保护串内时跳过
 * @param {{protectedSkipped?:number}|null} stats - 可选统计
 * @param {Set<string>|null} excludedIdentifiers - 保护文件里的标识符（小写）；
 *        命中所在标识符与之相同则跳过（其他文件里的重复代码也不提取）
 * @returns {null | { relPath: string, byWord: Map<string, Array<{line, col, context}>> }}
 */
function searchFile(filePath, patterns, baseDir, ctxLen, protector = null, stats = null, excludedIdentifiers = null) {
  // 兜底：超大文件 / 二进制（前 4KB 含 NUL）直接跳过
  const text = readTextFileSafely(filePath);
  if (text == null) return null;

  const byWord = new Map();
  let anyMatch = false;

  for (const { word, regex } of patterns) {
    const matches = [];
    const re = new RegExp(regex.source, regex.flags);

    for (const m of text.matchAll(re)) {
      // m[1] 是捕获的实际匹配文本
      const matchedText = m[1];
      const identifier = identifierAt(text, m.index, matchedText.length);

      // 保护文件：其中的标识符在别的文件里也不提取（否则保护文件会被连坐改名）
      if (excludedIdentifiers && excludedIdentifiers.has(identifier.toLowerCase())) {
        if (stats) stats.protectedFileIdentifiersSkipped = (stats.protectedFileIdentifiersSkipped || 0) + 1;
        continue;
      }

      // 基础替换词保护：szewec 这类已定稿的新词内部不再当作搜索词命中
      if (protector && protector.isMatchProtected(identifier, matchedText)) {
        if (stats) stats.protectedSkipped = (stats.protectedSkipped || 0) + 1;
        continue;
      }

      const col = m.index + 1;

      // 计算行号
      const before = text.substring(0, m.index);
      const line = (before.match(/\n/g) || []).length + 1;

      // 提取上下文（截取该行）
      const lineStart = before.lastIndexOf('\n') + 1;
      const lineEnd = text.indexOf('\n', m.index + matchedText.length);
      const lineText = (lineEnd === -1
        ? text.substring(lineStart)
        : text.substring(lineStart, lineEnd)).trim();

      // 短上下文用于表格
      const ctxStart = Math.max(0, m.index - ctxLen);
      const ctxEnd = Math.min(text.length, m.index + matchedText.length + ctxLen);
      const context = text.substring(ctxStart, ctxEnd)
        .replace(/\s+/g, ' ').trim();

      matches.push({ line, col, text: lineText.substring(0, 120), context, matched: matchedText });
      anyMatch = true;
    }

    if (matches.length > 0) {
      byWord.set(word, matches);
    }
  }

  if (!anyMatch) return null;

  return {
    relPath: relative(baseDir, filePath).replace(/\\/g, '/'),
    byWord,
  };
}

// ── 终端表格输出 ──────────────────────────────────────────────────────

const RED = '\x1b[1;31m';
const DIM = '\x1b[2m';
const RST = '\x1b[0m';
const BOLD = '\x1b[1m';

function pad(s, w) { return String(s).padEnd(w); }
function padL(s, w) { return String(s).padStart(w); }
function trunc(s, w) { return s.length > w ? s.slice(0, w - 3) + '...' : s; }

/**
 * 输出一张 "词 × 文件" 交叉表。
 */
function printCrossTable(results, words) {
  if (results.length === 0) {
    console.log('✅ 未找到匹配项');
    return;
  }

  // ── 汇总行 ──
  const totals = new Map();  // word → { files, matches }
  let grandTotal = 0;
  for (const w of words) totals.set(w, { files: 0, matches: 0 });
  for (const r of results) {
    grandTotal += [...r.byWord.values()].reduce((s, a) => s + a.length, 0);
    for (const w of words) {
      if (r.byWord.has(w)) {
        const entry = totals.get(w);
        entry.files++;
        entry.matches += r.byWord.get(w).length;
      }
    }
  }

  // 列宽: 文件路径 + 每个词的 "命中数" 列
  const WORD_COL = 10;
  const maxPathLen = Math.max(6, ...results.map(r => r.relPath.length), 30);

  // ── 表头 ──
  const headerWords = words.map(w => padL(w, WORD_COL)).join(' │');
  const header = `${pad('File', maxPathLen)} │ ${headerWords}`;
  console.log(BOLD + header + RST);
  console.log('─'.repeat(maxPathLen) + '─┼─' + '─'.repeat(words.length * (WORD_COL + 3) - 2));

  // ── 数据行 ──
  for (const r of results) {
    const cols = words.map(w => {
      const count = r.byWord.has(w) ? String(r.byWord.get(w).length) : '·';
      return padL(count, WORD_COL);
    }).join(' │');
    console.log(`${pad(trunc(r.relPath, maxPathLen), maxPathLen)} │ ${cols}`);
  }

  // ── 汇总 ──
  console.log('─'.repeat(maxPathLen) + '─┼─' + '─'.repeat(words.length * (WORD_COL + 3) - 2));
  const totalCols = words.map(w => {
    const t = totals.get(w);
    return padL(`${t.matches}(${t.files}f)`, WORD_COL);
  }).join(' │');
  console.log(BOLD + `${pad('TOTAL', maxPathLen)} │ ${totalCols}` + RST);
  console.log(`\n${results.length} 个文件, ${grandTotal} 处匹配`);
}

/**
 * 输出每词详情（上下文 + 行号）。
 */
function printDetail(results, words, limit) {
  let shown = 0;
  for (const r of results) {
    if (shown >= limit) {
      console.log(`\n${DIM}... 还有 ${results.length - limit} 个文件未显示${RST}`);
      break;
    }
    shown++;

    console.log(`\n${BOLD}📄 ${r.relPath}${RST}`);

    for (const w of words) {
      const matches = r.byWord.get(w);
      if (!matches || matches.length === 0) continue;

      // 去重：同行同列的多词变体只保留一行
      const deduped = [];
      const seen = new Set();
      for (const m of matches) {
        const key = `${m.line}:${m.col}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(m);
      }

      for (const m of deduped) {
        // 高亮匹配词
        const re = new RegExp(m.matched.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const highlighted = m.text.replace(re, x => `${RED}${x}${RST}`);
        console.log(`   ${DIM}${w.padEnd(18)}${RST} L${padL(m.line, 5)}:${pad(String(m.col), 4)} │ ${highlighted}`);
      }
    }
  }
}

/**
 * 路径名称匹配输出。
 */
function printPathMatches(pathMatches, words) {
  const dirs = pathMatches.filter(p => p.type === 'directory');
  const files = pathMatches.filter(p => p.type === 'file-name');

  console.log(`\n${BOLD}📁 路径名称匹配 (${pathMatches.length} 个: ${dirs.length} 目录 + ${files.length} 文件)${RST}`);

  if (dirs.length > 0) {
    console.log(DIM + '─'.repeat(70) + RST);
    for (const d of dirs) {
      console.log(`   📂 ${d.relPath}  ${DIM}← ${d.matchedWord}${RST}`);
    }
  }

  if (files.length > 0) {
    console.log(DIM + '─'.repeat(70) + RST);
    for (const f of files) {
      console.log(`   📄 ${f.relPath}  ${DIM}← ${f.matchedWord}${RST}`);
    }
  }
}

// ── JSON 输出 ─────────────────────────────────────────────────────────

/**
 * 简洁版（仿 brand-words.json）：只输出标识符列表 + 计数。
 */
function buildConciseOutput(results, words, summary, baseDir, pathMatches, includePaths, excludedIdentifiers = null) {
  const identifiers = {};
  const fileCounts = {};
  for (const w of words) identifiers[w] = new Set();

  for (const r of results) {
    fileCounts[r.relPath] = (fileCounts[r.relPath] ?? 0) + 1;
    for (const [w, matches] of r.byWord) {
      for (const m of matches) {
        // 从匹配行提取包含该词的完整标识符（跳过 0x56EC000 这类字面量片段）
        for (const id of extractIdentifiers(m.text)) {
          if (excludedIdentifiers && excludedIdentifiers.has(id.toLowerCase())) continue;
          if (id.toLowerCase().includes(w.toLowerCase())) {
            identifiers[w].add(id);
          }
        }
      }
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    searchDir: baseDir,
    summary: {
      totalFilesScanned: summary.filesScanned,
      totalUniqueIdentifiers: Object.values(identifiers).reduce((s, set) => s + set.size, 0),
      filesWithMatches: summary.filesWithMatches,
      byWord: Object.fromEntries(
        Object.entries(identifiers).map(([k, v]) => [k, v.size])
      ),
    },
    identifiers: Object.fromEntries(
      Object.entries(identifiers).map(([k, v]) => [k, [...v].sort()])
    ),
  };

  if (includePaths) {
    output.pathMatches = {
      total: pathMatches.length,
      directories: pathMatches.filter(p => p.type === 'directory').map(p => p.name),
      fileNames: pathMatches.filter(p => p.type === 'file-name').map(p => p.name),
    };
  }

  return output;
}

function buildJsonOutput(results, words, summary, baseDir, pathMatches, includePaths, excludedIdentifiers = null) {
  const byWord = {};
  for (const w of words) byWord[w] = [];

  const allIdentifiers = new Set();

  for (const r of results) {
    for (const [w, matches] of r.byWord) {
      for (const m of matches) {
        byWord[w].push({
          file: r.relPath,
          line: m.line,
          col: m.col,
          matched: m.matched,
          context: m.context,
        });
        // 提取包含该词的完整标识符（跳过 0x56EC000 这类字面量片段）
        const idMatch = extractIdentifiers(m.text);
        if (idMatch) {
          for (const id of idMatch) {
            if (excludedIdentifiers && excludedIdentifiers.has(id.toLowerCase())) continue;
            if (id.toLowerCase().includes(w.toLowerCase())) {
              allIdentifiers.add(id);
            }
          }
        }
      }
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    searchDir: baseDir,
    summary: {
      ...summary,
      totalUniqueIdentifiers: allIdentifiers.size,
    },
    byWord: Object.fromEntries(
      Object.entries(byWord).map(([k, v]) => [k, {
        count: v.length,
        files: [...new Set(v.map(m => m.file))].length,
        matches: v,
      }])
    ),
    identifiers: [...allIdentifiers].sort(),
  };

  if (includePaths) {
    output.pathMatches = pathMatches.map(p => ({
      path: p.relPath,
      type: p.type,
      name: p.name,
      matchedWord: p.matchedWord,
      matchedToken: p.matchedToken,
    }));
  }

  return output;
}

// ── 主函数 ────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  // 从文件读取搜索词（合并到 -w 指定的词中）
  if (args.wordsFile) {
    try {
      const { words: fileWords, exactWords: fileExactWords } = readWordsFromFile(args.wordsFile);
      const existing = new Set(args.words.map(w => w.toLowerCase()));
      let added = 0, exactAdded = 0;
      for (const w of fileWords) {
        const isExact = fileExactWords.has(w);
        if (!existing.has(w.toLowerCase())) {
          args.words.push(w);
          existing.add(w.toLowerCase());
          added++;
        }
        // 精确标记始终生效（覆盖命令行中可能已有的非精确版本）
        if (isExact) {
          if (!args.exactWords.has(w)) exactAdded++;
          args.exactWords.add(w);
        }
      }
      const exactInfo = exactAdded > 0 ? ` (其中 ${exactAdded} 个精确匹配)` : '';
      process.stderr.write(`📋 从文件读取搜索词: ${args.wordsFile} (+${added} 个${exactInfo})\n`);
    } catch (e) {
      console.error(`⚠️  无法读取搜索词文件: ${e.message}`);
      if (args.words.length === 0) process.exit(1);
    }
  }

  // 默认不限制扩展名：扫描全部，排除项来自 scan-exclude.json（见 scan-config.mjs）

  // 从文件读取扩展名列表（--ext-file，与 --ext 等效；二者并用时合并）
  if (args.extFile) {
    let fileExts;
    try {
      fileExts = readExtensionsFromFile(args.extFile);
    } catch (e) {
      console.error(`⚠️  无法读取扩展名文件: ${e.message}`);
      process.exit(1);
    }
    if (fileExts.length === 0) {
      console.error(`⚠️  扩展名文件为空: ${args.extFile}`);
      process.exit(1);
    }
    if (args.extExplicit) {
      // 命令行也给了 --ext：合并（去重）
      const seen = new Set(args.extensions.map(normalizeExt));
      let added = 0;
      for (const e of fileExts) {
        const n = normalizeExt(e);
        if (!seen.has(n)) {
          args.extensions.push(n);
          seen.add(n);
          added++;
        }
      }
      process.stderr.write(`📋 从文件读取扩展名: ${args.extFile} (+${added} 个，与 --ext 合并)\n`);
    } else {
      // 等效 --ext：只扫描这些扩展名（默认是全部）
      args.extensions = fileExts.map(normalizeExt);
      args.extExplicit = true;
      process.stderr.write(`📋 从文件读取扩展名: ${args.extFile} (共 ${args.extensions.length} 个，仅扫描这些扩展名)\n`);
    }
  }

  // --include-ext：显式 --ext 时并入白名单；默认全量时靠过滤器的强制放行
  if (args.extExplicit) {
    for (const e of args.forceExts) {
      const n = normalizeExt(e);
      if (!args.extensions.some(x => normalizeExt(x) === n)) {
        args.extensions.push(n);
      }
    }
  }

  if (args.help || args.words.length === 0) {
    console.log(`敏感词搜索工具 — 生成"词 × 文件"交叉表

用法: node name-replacer/search-sensitive.mjs [options] --words <list>

选项:
  -w, --words <list>      搜索词，逗号/分号分隔（!前缀=精确匹配，可多次指定）
  --words-file <path>     从文件读取搜索词（JSON数组/对象 或 纯文本）
  -d, --dir <path>        搜索目录（默认当前目录）
  -o, --output <path>     JSON 输出文件路径
  --json                  终端输出 JSON（不输出表格）
  --whole-word            仅匹配标识符边界
  --no-paths              禁用路径名称搜索（仅搜索文件内容）
  --ext <exts>            只扫描这些扩展名，逗号分隔（默认：所有扩展名）
  --ext-file <path>       从文件读取扩展名列表（与 --ext 等效，二者并用时合并）
  --include-ext <exts>    强制包含被配置排除的扩展名（如 svg）
  --include-dirs <names>  强制进入被配置排除的目录（如 dist,lib）
  --protected-files <path> 保护文件配置（默认 name-replacer/protected-files.json）
  --no-protected-files    关闭保护文件（临时调试）
  --context <n>           上下文长度（默认 40 字符）
  --limit-files <n>       详情最多显示的文件数（默认 200）

搜索词文件 (--words-file) 支持三种格式:
  1. JSON 数组:    ["dgn", {"word":"Bentley","exact":true}]
  2. JSON 对象:    {"words": ["dgn", "DgnDb"]}
  3. 纯文本:       每行一个词，!前缀=精确匹配, #=注释

扩展名文件 (--ext-file) 支持三种格式（同约定）:
  1. JSON 数组:    ["ts", "js", "svg"]
  2. JSON 对象:    {"extensions": ["ts", "js", "svg"]}
  3. 纯文本:       每行一个扩展名，#=注释
  条目带不带前导点均可（'svg' / '.svg'）；与 --ext 并用时取并集

默认扫描范围:
  指定目录下的所有文件夹 + 所有扩展名。
  需要排除的目录 / 扩展名 / 文件名写在 name-replacer/scan-exclude.json：
    { "dirs": ["dist", "node_modules"], "exts": [".png"], "files": ["pnpm-lock.yaml"] }
  配置文件缺失时不排除任何内容。

基础替换词保护（自动生效）:
  已定稿的新词不参与提取：base-mapping.json 的值、replace-server-config.json
  的 baseName、exclude-list.json 的条目。szewec 里的 "ec" 不会被当成搜索词命中。
  额外补充写在 name-replacer/protected-words.json（数组或 { "words": [...] }）。

保护区域（自动生效）:
  name-replacer/protected-files.json 的 files / snippets（密码保护文件、代码片段）。
  files 整份不提取；snippets 只排除片段里会被当前搜索词命中的标识符。
  被排除的标识符在其他文件里也不再提取（见 protected-files.md）。

精确匹配 (!前缀 / exact:true):
  大小写不敏感，原样字面匹配，不生成全大小写变体。
  !Bentley → 匹配 "Bentley"/"bentley"/"BENTLEY"/... (/gi 字面匹配)
  dgn      → 匹配 "dgn"/"DGN"/"Dgn"/... (默认，全变体匹配)

两维度搜索:
  1. 文件内容 — 子串匹配（默认）或标识符边界匹配（--whole-word）
  2. 路径名称 — 目录名/文件名语义分词匹配（默认启用）

匹配规则:
  默认大小写不敏感（生成全部大小写变体做精确匹配）。
  默认子串匹配（"dgn" 可匹配 "DgnDb", "openDgnDb", "ECSchemas/Dgn/"）。
  加 --whole-word 则仅在标识符边界匹配。

示例:
  # DGN 相关全貌
  node name-replacer/search-sensitive.mjs \\
    -d itwinjs-core/core/backend/src \\
    -w "dgn,DgnDb,openDgnDb,dgn_View,DgnCore"

  # 从文件读取搜索词
  node name-replacer/search-sensitive.mjs \\
    -d itwinjs-core \\
    --words-file sensitive-words.txt

  # 文件 + 命令行合并
  node name-replacer/search-sensitive.mjs \\
    -d itwinjs-core \\
    --words-file sensitive-words.txt \\
    -w "额外词1,额外词2"

  # 仅搜索文件内容（跳过路径名称）
  node name-replacer/search-sensitive.mjs -d itwinjs-core -w "dgn" --no-paths

  # 导出 JSON
  node name-replacer/search-sensitive.mjs \\
    -d itwinjs-core/core/backend/src \\
    -w "dgn,DgnDb" -o dgn-result.json

  # 仅 JSON 输出到 stdout
  node name-replacer/search-sensitive.mjs -d ./src -w "iModel" --json`);
    process.exit(args.help ? 0 : 1);
  }

  const baseDir = normalize(args.dir);
  const collectPaths = !args.noPaths;

  // 基础替换词保护：已定稿的新词（szewec 等）内部不再命中品牌词
  const protector = loadProtector();
  const protectStats = { protectedSkipped: 0, protectedFileIdentifiersSkipped: 0 };

  // 保护区域：文件整份不提取；片段里的标识符在搜索时按当前搜索词筛选
  const protectFiles = args.noProtectedFiles
    ? null
    : loadProtectedFiles({ configPath: args.protectedFiles || undefined, repoRoot: ROOT, scanRoots: [baseDir] });

  // 排除配置：默认扫描全部，只有配置里列出的目录/扩展名/文件名会跳过
  const filter = loadScanFilter();
  const filterStats = filter.source
    ? `${filter.source} — ${filter.config.dirs.length} 目录 / ${filter.config.exts.length} 扩展名 / ${filter.config.files.length} 文件名`
    : '未找到 scan-exclude.json（不排除任何目录/扩展名）';

  // 进度信息到 stderr
  process.stderr.write(`🔍 搜索词: ${args.words.map(w => args.exactWords.has(w) ? `!${w}` : w).join(', ')}\n`);
  process.stderr.write(`📂 目录: ${baseDir}\n`);
  process.stderr.write(`📁 路径名称搜索: ${collectPaths ? '✅ 启用' : '❌ 禁用 (--no-paths)'}\n`);
  process.stderr.write(`📋 排除配置: ${filterStats}\n`);
  process.stderr.write(`🛡️  基础替换词保护: ${protector.terms.length} 个`
    + (protector.terms.length ? `（${protector.terms.slice(0, 10).join(', ')}${protector.terms.length > 10 ? ', …' : ''}）` : '') + '\n');
  if (protectFiles) {
    process.stderr.write(`🔒 保护区域: ${describeProtectedFiles(protectFiles, ROOT)}\n`);
  }
  process.stderr.write(`📄 扩展名范围: ${args.extExplicit ? args.extensions.join(', ') : '全部（按排除配置过滤）'}\n`);
  if (args.forceExts.size > 0 || args.forceDirs.size > 0) {
    const parts = [];
    if (args.forceExts.size > 0) parts.push(`强制扩展名: ${[...args.forceExts].join(', ')}`);
    if (args.forceDirs.size > 0) parts.push(`强制目录: ${[...args.forceDirs].join(', ')}`);
    process.stderr.write(`🔓 排除规则覆盖: ${parts.join('; ')}\n`);
  }

  // 收集文件 + 路径名称匹配
  const { files, pathMatches } = collectFiles(baseDir, args.extensions, {
    collectPaths,
    words: args.words,
    forceExts: args.forceExts,
    forceDirs: args.forceDirs,
    extExplicit: args.extExplicit,
    filter,
    protector,
  });
  // 输出文件自身不参与扫描（避免读到上一次的结果）
  if (args.output) {
    const outputRel = relative(baseDir, args.output).replace(/\\/g, '/');
    const idx = files.findIndex(f => relative(baseDir, f).replace(/\\/g, '/') === outputRel);
    if (idx !== -1) files.splice(idx, 1);
  }

  // 保护文件整体跳过（内容不提取）
  let protectFilesExcluded = 0;
  let scanFiles = files;
  if (protectFiles) {
    scanFiles = [];
    for (const f of files) {
      if (protectFiles.matcher.isProtectedFile(f)) protectFilesExcluded++;
      else scanFiles.push(f);
    }
  }
  process.stderr.write(`📊 扫描文件数: ${scanFiles.length}`
    + (protectFilesExcluded ? `（另有 ${protectFilesExcluded} 个保护文件跳过）` : '') + '\n');
  if (collectPaths) {
    const dirCount = pathMatches.filter(p => p.type === 'directory').length;
    const fileCount = pathMatches.filter(p => p.type === 'file-name').length;
    process.stderr.write(`📁 路径名称匹配: ${pathMatches.length} (${dirCount} 目录 + ${fileCount} 文件)\n`);
  }

  // 构建搜索模式（默认 case-insensitive）
  const patterns = buildSearchPatterns(args.words, {
    wholeWord: args.wholeWord,
    exactWords: args.exactWords,
  });

  // 精确匹配词提示
  if (args.exactWords.size > 0) {
    process.stderr.write(`🎯 精确匹配词: ${[...args.exactWords].join(', ')}\n`);
  }

  // 搜索：片段里的标识符只保留真正会被当前搜索词命中的
  const excludedIdentifiers = new Set(protectFiles ? protectFiles.identifiers : []);
  const protectedSnippetIdentifiers = [];
  if (protectFiles) {
    for (const id of protectFiles.snippetIdentifiers) {
      if (patterns.some(p => new RegExp(p.regex.source, p.regex.flags).test(id))) {
        excludedIdentifiers.add(id.toLowerCase());
        protectedSnippetIdentifiers.push(id);
      }
    }
    if (protectedSnippetIdentifiers.length > 0) {
      process.stderr.write(`   片段中命中搜索词的标识符: ${protectedSnippetIdentifiers.sort().join(', ')}\n`);
    }
  }
  const excluded = excludedIdentifiers.size > 0 ? excludedIdentifiers : null;

  const results = [];
  for (const file of scanFiles) {
    const r = searchFile(file, patterns, baseDir, args.context, protector, protectStats, excluded);
    if (r) results.push(r);
  }

  // 按路径排序
  results.sort((a, b) => a.relPath.localeCompare(b.relPath));

  // 按路径排序
  results.sort((a, b) => a.relPath.localeCompare(b.relPath));
  pathMatches.sort((a, b) => a.relPath.localeCompare(b.relPath));

  const summary = {
    words: args.words,
    wholeWord: args.wholeWord,
    extensions: args.extExplicit ? args.extensions : '*',
    excludeConfig: filter.source || null,
    protectedTerms: protector.terms,
    protectedMatchesSkipped: protectStats.protectedSkipped,
    protectedFiles: protectFiles
      ? protectFiles.files.map(f => relative(baseDir, f).replace(/\\/g, '/'))
      : [],
    protectedFileIdentifiers: protectFiles ? protectFiles.identifiers.size : 0,
    protectedSnippetIdentifiers: protectedSnippetIdentifiers.sort(),
    protectedFileMatchesSkipped: protectStats.protectedFileIdentifiersSkipped,
    protectedFilesExcluded: protectFilesExcluded,
    skipOverrides: (args.extExplicit || args.forceExts.size || args.forceDirs.size) ? {
      extExplicit: args.extExplicit,
      extFile: args.extFile,
      forceExts: [...args.forceExts],
      forceDirs: [...args.forceDirs],
    } : null,
    filesScanned: scanFiles.length,
    filesWithMatches: results.length,
    totalMatches: results.reduce((s, r) => {
      for (const arr of r.byWord.values()) s += arr.length;
      return s;
    }, 0),
    pathMatches: collectPaths ? {
      total: pathMatches.length,
      directories: pathMatches.filter(p => p.type === 'directory').length,
      fileNames: pathMatches.filter(p => p.type === 'file-name').length,
    } : null,
  };

  process.stderr.write(`🔎 内容匹配: ${summary.filesWithMatches} 文件, ${summary.totalMatches} 处`);
  if (protectStats.protectedSkipped) {
    process.stderr.write(`（另有 ${protectStats.protectedSkipped} 处落在基础替换词内部，已跳过）`);
  }
  if (protectStats.protectedFileIdentifiersSkipped) {
    process.stderr.write(`（另有 ${protectStats.protectedFileIdentifiersSkipped} 处属于保护区域中的标识符，已跳过）`);
  }
  process.stderr.write('\n');
  if (collectPaths) {
    process.stderr.write(`📁 路径匹配: ${summary.pathMatches.total} 个\n\n`);
  } else {
    process.stderr.write(`\n`);
  }

  // JSON 输出（--json 或 -o 指定了文件路径）
  if (args.json || args.output) {
    const json = args.concise
      ? buildConciseOutput(results, args.words, summary, baseDir, pathMatches, collectPaths, excludedIdentifiers)
      : buildJsonOutput(results, args.words, summary, baseDir, pathMatches, collectPaths, excludedIdentifiers);
    const output = JSON.stringify(json, null, 2);
    if (args.output) {
      mkdirSync(dirname(args.output), { recursive: true });
      writeFileSync(args.output, output, 'utf8');
      process.stderr.write(`✅ 已写入 ${args.output}\n`);
    } else {
      console.log(output);
    }
  }

  // 终端表格（除非只输出 JSON 到 stdout 即 --json 无 -o）
  if (!(args.json && !args.output)) {
    printCrossTable(results, args.words);
    console.log(); // 空行分隔
    printDetail(results, args.words, args.limitFiles);

    // 路径名称匹配
    if (collectPaths && pathMatches.length > 0) {
      printPathMatches(pathMatches, args.words);
    }
  }
}

// ── exports ───────────────────────────────────────────────────────────

export { parseArgs, buildSearchPatterns, tokenizePathName, pathNameContainsAnyWord, collectFiles, searchFile, printCrossTable, printDetail, printPathMatches, buildJsonOutput, buildConciseOutput };

// ── CLI 入口 ───────────────────────────────────────────────────────────

const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/');
if (isMain) {
  main();
}
