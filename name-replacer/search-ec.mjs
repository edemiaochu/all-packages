/**
 * ── EC 语义关键词搜索工具 ──
 *
 * 专门提取 "EC" 作为独立语义单元的代码标识符。
 * "EC" 在标识符中作为独立的 camelCase/PascalCase/snake_case 分词单元时才匹配，
 * 而不是简单的子串匹配。
 *
 * 两维度搜索：
 *   1. 文件内容 — 代码标识符中 "EC" 作为独立 token
 *   2. 路径名称 — 目录名/文件名中 "EC" 作为独立 token
 *
 * 匹配规则（语义分词）：
 *   ECEntityClass   → ["EC","Entity","Class"]    ✅ EC 是独立 token
 *   ECDb            → ["EC","Db"]                 ✅
 *   myEcSchema      → ["my","Ec","Schema"]        ✅
 *   EC              → ["EC"]                      ✅ 独立标识符
 *   EC_Class        → ["EC","Class"]              ✅ snake_case
 *   select          → ["select"]                  ❌ ec 只是 select 的子串
 *   AEC             → ["AEC"]                     ❌ AEC 是一个 token
 *   check           → ["check"]                   ❌
 *   project         → ["project"]                 ❌
 *   $EC             → ["EC"]                      ✅ 去掉 $ 后分词
 *   _ecSchema       → ["ec","Schema"]             ✅ 去掉 _ 后分词
 *   SECONDS         → ["SECONDS"]                 ❌ 全大写不分词
 *   ABCConnector    → ["ABC","Connector"]         ❌ EC 不在 token 列表中
 *   ECXML           → ["ECXML"]                   ❌（--fused 可命中，见下）
 *
 * 路径名称匹配：
 *   ec-schema/      → ["ec","schema"]             ✅ 目录名
 *   my-ec-utils.ts  → ["my","ec","utils"]         ✅ 文件名
 *   ec/             → ["ec"]                      ✅ 独立目录
 *   project/        → ["project"]                 ❌
 *   select.ts       → ["select"]                  ❌
 *
 * 架构参照 search-sensitive.mjs，输出 "词 × 文件" 交叉表。
 *
 * 用法：
 *   node name-replacer/search-ec.mjs [options]
 *
 * 选项：
 *   -d, --dir <path>         搜索目录（默认当前目录）
 *   -o, --output <path>      JSON 输出文件路径
 *   --json                   终端输出 JSON 而非表格
 *   --concise                简洁 JSON（仅标识符列表 + 计数）
 *   --ext <exts>             只扫描这些扩展名，逗号分隔（默认：所有扩展名）
 *   --include-ext <exts>     强制包含被配置排除的扩展名
 *   --include-dirs <names>   强制进入被配置排除的目录
 *   --context <n>            显示 N 字上下文（默认 40）
 *   --limit-files <n>        最多显示 N 个文件（默认 200）
 *   --case-sensitive         大小写敏感（默认不敏感：Ec/ec/EC 都视为 EC）
 *   --no-paths               禁用路径名称搜索（仅搜索文件内容）
 *   --fused                  融合词匹配：整段（_ / . / - 分隔）纯大写或纯小写的标识符
 *                            做子串匹配（与 replace-server 的"融合词替换"对称）。
 *                            ECXML/ECSQLREADER 这类全大写融合缩写会被提取；
 *                            ⚠️ DECLARE/RECREATE/SELECTION 等含 ec 的英文单词
 *                            也会被捞进来——提取 ≠ 替换，replace-server 里 EC
 *                            不开启融合词替换就不会动它们。
 *
 * 默认扫描范围: 指定目录下的所有文件夹 + 所有扩展名。
 *   需要排除的目录 / 扩展名 / 文件名写在 name-replacer/scan-exclude.json：
 *     { "dirs": [...], "exts": [...], "files": [...] }
 *   配置文件缺失时不排除任何内容。
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname, relative, resolve, dirname, normalize } from 'path';
import { fileURLToPath } from 'url';
import { loadScanFilter, readTextFileSafely, normalizeExt } from './scan-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── CLI 参数解析 ──────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    dir: process.cwd(),
    output: null,
    json: false,
    concise: false,
    caseSensitive: false,
    noPaths: false,
    fused: false,
    // 空数组 = 不限制扩展名（扫描全部）；--ext 才会变成包含白名单
    extensions: [],
    extExplicit: false,     // --ext 显式指定时只扫这些扩展名
    forceExts: new Set(),   // --include-ext：强制包含被配置排除的扩展名
    forceDirs: new Set(),   // --include-dirs：强制进入被配置排除的目录
    context: 40,
    limitFiles: 200,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '-d': case '--dir':
        args.dir = resolve(argv[++i]);
        break;
      case '-o': case '--output':
        args.output = resolve(argv[++i]);
        break;
      case '--json':
        args.json = true;
        break;
      case '--concise':
        args.concise = true;
        break;
      case '--case-sensitive':
        args.caseSensitive = true;
        break;
      case '--ext':
        args.extensions = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
        args.extExplicit = true;
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
      case '--fused':
        args.fused = true;
        break;
      case '--help': case '-h':
        args.help = true;
        break;
    }
  }

  return args;
}

/**
 * 判断是否为随机字符串（hash/token），不是代码标识符。
 *
 * 三类噪声来源：
 *   1. 锁文件中的 base64 integrity hash → 靠 scan-exclude.json 的 files 段在文件级过滤
 *   2. CHANGELOG/文档中的 git commit SHA → hex 纯数字+字母，≥32 字符
 *   3. 其他 base64/随机串 → 长度 > 40 + 无下划线 + 大写占比 > 25%
 *
 * 正常标识符如 "AbstractECConstraint..."(45字符, 18%大写) 不会被误杀。
 */
function isLikelyRandomString(id) {
  const len = id.length;

  // 规则 1：纯十六进制字符串 ≥ 32 字符（git SHA / MD5 / SHA-256）
  if (len >= 32 && /^[0-9a-fA-F]+$/.test(id)) {
    return true;
  }

  // 规则 2：超长无下划线 + 高大写占比（base64 随机串特征）
  if (len > 40 && !id.includes('_')) {
    let upper = 0;
    for (const ch of id) {
      if (ch >= 'A' && ch <= 'Z') upper++;
    }
    if ((upper / len) > 0.25) return true;
  }

  return false;
}

// ── 语义分词 ──────────────────────────────────────────────────────────

/**
 * 将 camelCase / PascalCase / snake_case 标识符拆分为语义 token 列表。
 *
 * 规则：
 *   1. 先去掉前导的 $ 和 _（保留语义部分）
 *   2. 按下划线 _ 拆分为段
 *   3. 每段按大小写边界拆分：
 *      - 小写→大写边界：   "myEc"     → ["my", "Ec"]
 *      - 大写+大写→小写：  "ECDb"     → ["EC", "Db"]
 *      - 全大写连续段：    "SECONDS"   → ["SECONDS"]（不再拆分）
 *      - 数字边界也拆分：  "abc123def" → ["abc", "123", "def"]
 *
 * 示例：
 *   "ECEntityClass"     → ["EC", "Entity", "Class"]
 *   "ECDb"              → ["EC", "Db"]
 *   "myEcSchema"        → ["my", "Ec", "Schema"]
 *   "$EC"               → ["EC"]
 *   "_ecSchema"         → ["ec", "Schema"]
 *   "XMLParser"         → ["XML", "Parser"]
 *   "IPreference"       → ["I", "Preference"]
 *   "AEC"               → ["AEC"]
 *   "select"            → ["select"]
 */
function tokenizeIdentifier(id) {
  // 去掉前导的 $ 和 _
  const clean = id.replace(/^[$_]+/, '');

  const tokens = [];

  // 先按 _ 拆分
  const segments = clean.split('_');

  for (const seg of segments) {
    if (!seg) continue; // 跳过空段

    // 在每段内按大小写边界 + 数字边界拆分
    const subTokens = splitCamelCase(seg);
    tokens.push(...subTokens);
  }

  return tokens;
}

/**
 * 拆分 camelCase / PascalCase 段。
 * 核心规则：
 *   - 全大写（长度>1 且全是大写字母）→ 保持整体
 *   - 大写序列后跟小写字母 → 在最后一个大写字母前断开（ECDb → EC | Db）
 *   - 小写后跟大写 → 断开
 *   - 数字边界 → 断开
 */
function splitCamelCase(seg) {
  const tokens = [];
  let current = '';
  const len = seg.length;

  for (let i = 0; i < len; i++) {
    const ch = seg[i];
    const next = i + 1 < len ? seg[i + 1] : null;

    // 数字边界
    if (/\d/.test(ch)) {
      if (current && !/\d/.test(current[current.length - 1])) {
        // 字母→数字边界
        tokens.push(current);
        current = '';
      }
      current += ch;
      if (next && !/\d/.test(next)) {
        // 数字→字母边界
        tokens.push(current);
        current = '';
      }
      continue;
    }

    // 小写字母
    if (/[a-z]/.test(ch)) {
      current += ch;
      // 小写→大写边界
      if (next && /[A-Z]/.test(next)) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    // 大写字母
    if (/[A-Z]/.test(ch)) {
      // 大写序列后跟小写 → 在最后一个大写前断开
      // 例如 ECDb: current="EC", ch="D", next="b"
      // 此时应把 "EC" 推入，用 "D" 开始新 token
      if (current && /[A-Z]/.test(current[current.length - 1]) && next && /[a-z]/.test(next)) {
        tokens.push(current);
        current = '';
      }
      current += ch;
      continue;
    }

    // 其他字符（不太可能出现在标识符中，但做防御）
    current += ch;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * 融合词匹配（--fused 开启后、token 匹配未命中时的兜底）：
 * 整段（_ / . / - 分隔）纯大写或纯小写、段长大于词长、包含词子串时命中。
 * 与 replace-server 的 fusedCompoundReplace 规则对称：
 *   "ECXML"（纯大写含 EC）✅   "ecsqlreader"（纯小写含 ec）✅
 *   "EcXmlReader"（混合大小写）❌   随机哈希串（混合大小写）❌
 * ⚠️ DECLARE/RECREATE/SELECTION 等含 ec 的英文单词也会命中——
 * 提取 ≠ 替换，replace-server 里 EC 不开融合词替换就不会动它们。
 * @param {string[]} segments - 按 _ 拆分后的段（path 已把 . - 归一为 _）
 * @returns {string | null} 命中的段（作为 matchedToken 展示），未命中返回 null
 */
function containsFusedSegment(segments, targetWord) {
  const upper = targetWord.toUpperCase();
  const lower = targetWord.toLowerCase();
  for (const seg of segments) {
    if (seg.length <= targetWord.length) continue;
    if (/^[A-Z]+$/.test(seg) && seg.includes(upper)) return seg;
    if (/^[a-z]+$/.test(seg) && seg.includes(lower)) return lower;
  }
  return null;
}

/**
 * 检查标识符中是否包含目标词的语义 token。
 * @param {string} id - 原始标识符
 * @param {string} targetWord - 目标词（如 "EC"）
 * @param {boolean} caseSensitive - 是否大小写敏感
 * @param {boolean} fused - 是否启用融合词匹配（纯大写/纯小写段子串）
 * @returns {{ matched: boolean, matchedToken: string | null }}
 */
function idContainsToken(id, targetWord, caseSensitive, fused) {
  const tokens = tokenizeIdentifier(id);
  const cmp = caseSensitive
    ? (t) => t === targetWord
    : (t) => t.toUpperCase() === targetWord.toUpperCase();

  for (const token of tokens) {
    if (cmp(token)) {
      return { matched: true, matchedToken: token };
    }
  }
  if (fused) {
    const seg = containsFusedSegment(id.replace(/^[$_]+/, '').split('_'), targetWord);
    if (seg) return { matched: true, matchedToken: seg };
  }
  return { matched: false, matchedToken: null };
}

// ── 路径名称分词 ──────────────────────────────────────────────────────

/**
 * 对文件/目录名做语义分词。
 * 与标识符分词类似，但额外处理 . 和 - 作为分隔符。
 *
 * 示例：
 *   "ec-schema"        → ["ec", "schema"]
 *   "my.ec.utils"      → ["my", "ec", "utils"]
 *   "ECDb"             → ["EC", "Db"]
 *   "ec"               → ["ec"]
 */
function tokenizePathName(name) {
  return tokenizeIdentifier(pathBaseSegments(name).join('_'));
}

/**
 * 路径名的段列表：去掉扩展名，把 . 和 - 归一为分隔符后按 _ 拆分。
 * tokenizePathName（token 匹配）与 --fused（段级子串匹配）共用。
 */
function pathBaseSegments(name) {
  const lastDot = name.lastIndexOf('.');
  const base = lastDot > 0 ? name.substring(0, lastDot) : name;
  return base.replace(/[.-]/g, '_').split('_');
}

/**
 * 检查路径名中是否包含目标词的语义 token。
 */
function pathNameContainsToken(name, targetWord, caseSensitive, fused) {
  const tokens = tokenizePathName(name);
  const cmp = caseSensitive
    ? (t) => t === targetWord
    : (t) => t.toUpperCase() === targetWord.toUpperCase();

  for (const token of tokens) {
    if (cmp(token)) {
      return { matched: true, matchedToken: token };
    }
  }
  if (fused) {
    const seg = containsFusedSegment(pathBaseSegments(name), targetWord);
    if (seg) return { matched: true, matchedToken: seg };
  }
  return { matched: false, matchedToken: null };
}

// ── 文件收集 ──────────────────────────────────────────────────────────

function collectFiles(rootDir, extensions, { collectPaths, targetWord, caseSensitive, fused, forceExts = new Set(), forceDirs = new Set(), extExplicit = false, filter = loadScanFilter() } = {}) {
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

        // 检查目录名是否匹配
        if (collectPaths) {
          const { matched, matchedToken } = pathNameContainsToken(entry.name, targetWord, caseSensitive, fused);
          if (matched) {
            pathMatches.push({
              relPath,
              type: 'directory',
              name: entry.name,
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

        // 检查文件名是否匹配
        if (collectPaths) {
          const { matched, matchedToken } = pathNameContainsToken(entry.name, targetWord, caseSensitive, fused);
          if (matched) {
            pathMatches.push({
              relPath,
              type: 'file-name',
              name: entry.name,
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

// ── 标识符提取正则 ───────────────────────────────────────────────────

const IDENTIFIER_RE = /[A-Za-z_$][\w$]*/g;

// ── 搜索 ──────────────────────────────────────────────────────────────

/**
 * 搜索一个文件，找出所有包含"EC 作为语义 token"的标识符。
 * @param {boolean} fused - 启用融合词匹配（纯大写/纯小写段子串，见 containsFusedSegment）
 * @returns {null | { relPath: string, matches: Array<{line, col, identifier, matchedToken}> }}
 */
function searchFile(filePath, word, caseSensitive, baseDir, ctxLen, fused) {
  // 兜底：超大文件 / 二进制（前 4KB 含 NUL）直接跳过
  const text = readTextFileSafely(filePath);
  if (text == null) return null;

  const matches = [];
  const seenOnLine = new Set(); // 同行同标识符去重

  for (const m of text.matchAll(IDENTIFIER_RE)) {
    const id = m[0];
    // 过滤随机字符串（hash/token）：超长无下划线很可能是 base64 hash
    if (isLikelyRandomString(id)) continue;
    const { matched, matchedToken } = idContainsToken(id, word, caseSensitive, fused);
    if (!matched) continue;

    const col = m.index + 1;
    const before = text.substring(0, m.index);
    const line = (before.match(/\n/g) || []).length + 1;

    // 同行去重（同一个标识符在同一行只报告一次）
    const dedupKey = `${line}:${id}`;
    if (seenOnLine.has(dedupKey)) continue;
    seenOnLine.add(dedupKey);

    // 提取该行文本
    const lineStart = before.lastIndexOf('\n') + 1;
    const lineEnd = text.indexOf('\n', m.index + id.length);
    const lineText = (lineEnd === -1
      ? text.substring(lineStart)
      : text.substring(lineStart, lineEnd)).trim();

    // 短上下文
    const ctxStart = Math.max(0, m.index - ctxLen);
    const ctxEnd = Math.min(text.length, m.index + id.length + ctxLen);
    const context = text.substring(ctxStart, ctxEnd)
      .replace(/\s+/g, ' ').trim();

    // 高亮该标识符在行中的位置
    const beforeId = lineText.substring(0, col - (before.length - lineStart.length + 1));
    const afterId = lineText.substring(beforeId.length + id.length);

    matches.push({
      line,
      col,
      identifier: id,
      matchedToken,
      text: lineText.substring(0, 120),
      context,
      display: `${beforeId}\x1b[1;31m${id}\x1b[0m${afterId}`,
    });
  }

  if (matches.length === 0) return null;

  return {
    relPath: relative(baseDir, filePath).replace(/\\/g, '/'),
    matches,
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
 * 输出交叉表（词 × 文件）。
 */
function printCrossTable(results, word) {
  if (results.length === 0) {
    console.log('✅ 未找到匹配项');
    return;
  }

  const maxPathLen = Math.max(6, ...results.map(r => r.relPath.length), 30);
  const COL_W = 8;

  // 表头
  const header = `${pad('File', maxPathLen)} │ ${padL(word, COL_W)}`;
  console.log(BOLD + header + RST);
  console.log('─'.repeat(maxPathLen) + '─┼─' + '─'.repeat(COL_W));

  // 数据行
  let grandTotal = 0;
  for (const r of results) {
    grandTotal += r.matches.length;
    console.log(`${pad(trunc(r.relPath, maxPathLen), maxPathLen)} │ ${padL(String(r.matches.length), COL_W)}`);
  }

  // 汇总
  console.log('─'.repeat(maxPathLen) + '─┼─' + '─'.repeat(COL_W));
  console.log(BOLD + `${pad('TOTAL', maxPathLen)} │ ${padL(String(grandTotal), COL_W)}` + RST);
  console.log(`\n${results.length} 个文件, ${grandTotal} 处匹配`);
}

/**
 * 逐行详情输出。
 */
function printDetail(results, word, limit) {
  let shown = 0;
  for (const r of results) {
    if (shown >= limit) {
      console.log(`\n${DIM}... 还有 ${results.length - limit} 个文件未显示${RST}`);
      break;
    }
    shown++;

    console.log(`\n${BOLD}📄 ${r.relPath}${RST}`);

    for (const m of r.matches) {
      const tag = `${word}[${m.matchedToken}]`;
      // 高亮标识符
      const re = new RegExp(m.identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const highlighted = m.text.replace(re, x => `${RED}${x}${RST}`);
      console.log(`   ${DIM}${tag.padEnd(14)}${RST} L${padL(m.line, 5)}:${pad(String(m.col), 4)} │ ${highlighted}`);
    }
  }
}

// ── JSON 输出 ─────────────────────────────────────────────────────────

function buildConciseOutput(results, word, summary, baseDir, pathMatches, includePaths, fused) {
  const idSet = new Set();
  const fileCounts = {};

  for (const r of results) {
    fileCounts[r.relPath] = (fileCounts[r.relPath] ?? 0) + 1;
    for (const m of r.matches) {
      idSet.add(m.identifier);
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    searchDir: baseDir,
    searchWord: word,
    matchMode: fused ? 'semantic-token+fused' : 'semantic-token',
    summary: {
      totalFilesScanned: summary.filesScanned,
      totalUniqueIdentifiers: idSet.size,
      filesWithMatches: summary.filesWithMatches,
    },
    identifiers: [...idSet].sort(),
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

function buildJsonOutput(results, word, summary, baseDir, pathMatches, includePaths, fused) {
  const allIdentifiers = new Set();
  const fileResults = results.map(r => ({
    file: r.relPath,
    count: r.matches.length,
    matches: r.matches.map(m => ({
      line: m.line,
      col: m.col,
      identifier: m.identifier,
      matchedToken: m.matchedToken,
      context: m.context,
    })),
  }));

  for (const r of results) {
    for (const m of r.matches) {
      allIdentifiers.add(m.identifier);
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    searchDir: baseDir,
    searchWord: word,
    matchMode: fused ? 'semantic-token+fused' : 'semantic-token',
    summary: {
      ...summary,
      totalUniqueIdentifiers: allIdentifiers.size,
    },
    results: fileResults,
    identifiers: [...allIdentifiers].sort(),
  };

  if (includePaths) {
    output.pathMatches = pathMatches.map(p => ({
      path: p.relPath,
      type: p.type,
      name: p.name,
      matchedToken: p.matchedToken,
    }));
  }

  return output;
}

/**
 * 路径名称匹配输出。
 */
function printPathMatches(pathMatches, word) {
  const dirs = pathMatches.filter(p => p.type === 'directory');
  const files = pathMatches.filter(p => p.type === 'file-name');

  console.log(`\n${BOLD}📁 路径名称匹配 (${pathMatches.length} 个: ${dirs.length} 目录 + ${files.length} 文件)${RST}`);

  if (dirs.length > 0) {
    console.log(DIM + '─'.repeat(70) + RST);
    for (const d of dirs) {
      console.log(`   📂 ${d.relPath}  ${DIM}← ${d.matchedToken}${RST}`);
    }
  }

  if (files.length > 0) {
    console.log(DIM + '─'.repeat(70) + RST);
    for (const f of files) {
      console.log(`   📄 ${f.relPath}  ${DIM}← ${f.matchedToken}${RST}`);
    }
  }
}

// ── 主函数 ────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  const WORD = 'EC';

  if (args.help) {
    console.log(`EC 语义关键词搜索工具 — 提取独立语义单元的 "EC"

用法: node name-replacer/search-ec.mjs [options]

选项:
  -d, --dir <path>         搜索目录（默认当前目录）
  -o, --output <path>      JSON 输出文件路径
  --json                   终端输出 JSON（不输出表格）
  --concise                简洁 JSON（仅标识符列表 + 计数）
  --case-sensitive         大小写敏感（默认不敏感）
  --no-paths               禁用路径名称搜索（仅搜索文件内容）
  --fused                  融合词匹配：整段纯大写/纯小写的标识符做子串匹配
                           （ECXML/ECSQLREADER 这类全大写融合缩写；
                           ⚠️ DECLARE/RECREATE 等含 ec 的英文单词也会出现，
                           提取 ≠ 替换，replace-server 里 EC 不开融合替换即可）
  --ext <exts>             只扫描这些扩展名，逗号分隔（默认：所有扩展名）
  --include-ext <exts>     强制包含被配置排除的扩展名
  --include-dirs <names>   强制进入被配置排除的目录
  --context <n>            上下文长度（默认 40 字符）
  --limit-files <n>        详情最多显示的文件数（默认 200）

默认扫描范围:
  指定目录下的所有文件夹 + 所有扩展名。
  需要排除的目录 / 扩展名 / 文件名写在 name-replacer/scan-exclude.json：
    { "dirs": ["dist", "node_modules"], "exts": [".png"], "files": ["pnpm-lock.yaml"] }
  配置文件缺失时不排除任何内容。

两维度搜索:
  1. 文件内容 — 代码标识符中 "EC" 作为独立 token
  2. 路径名称 — 目录名/文件名中 "EC" 作为独立 token（默认启用）

匹配规则 — 语义分词:
  将标识符拆分为 camelCase/PascalCase/snake_case 的分词单元，
  "EC" 必须作为独立 token 出现才匹配。

  ✅ 匹配:  ECEntityClass → ["EC","Entity","Class"]
  ✅ 匹配:  ECDb → ["EC","Db"]
  ✅ 匹配:  myEcSchema → ["my","Ec","Schema"]
  ✅ 匹配:  EC → ["EC"]
  ✅ 匹配:  ec-schema/ 目录名 → ["ec","schema"]
  ✅ 匹配:  my-ec-utils.ts 文件名 → ["my","ec","utils"]
  ❌ 不匹配: select → ["select"]
  ❌ 不匹配: AEC → ["AEC"]
  ❌ 不匹配: project → ["project"]
  ❌ 不匹配: ECXML → ["ECXML"]（默认；加 --fused 后 ✅ 融合命中）

示例:
  # 搜索当前目录（含路径名称）
  node name-replacer/search-ec.mjs -d itwinjs-core

  # 仅搜索文件内容（跳过路径名称）
  node name-replacer/search-ec.mjs -d itwinjs-core --no-paths

  # 导出 JSON
  node name-replacer/search-ec.mjs -d itwinjs-core -o ec-result.json

  # 简洁输出（仅标识符列表）
  node name-replacer/search-ec.mjs -d itwinjs-core --concise -o ec-result.json

  # 含融合词（ECXML/ECSQLREADER 等全大写/全小写融合形态）
  node name-replacer/search-ec.mjs -d itwinjs-core --concise --fused -o ec-result.json`);
    process.exit(0);
  }

  const baseDir = normalize(args.dir);
  const collectPaths = !args.noPaths;

  // 排除配置：默认扫描全部，只有配置里列出的目录/扩展名/文件名会跳过
  const filter = loadScanFilter();
  const filterStats = filter.source
    ? `${filter.source} — ${filter.config.dirs.length} 目录 / ${filter.config.exts.length} 扩展名 / ${filter.config.files.length} 文件名`
    : '未找到 scan-exclude.json（不排除任何目录/扩展名）';

  process.stderr.write(`🔍 搜索模式: 语义分词匹配 "${WORD}"\n`);
  process.stderr.write(`📂 目录: ${baseDir}\n`);
  process.stderr.write(`📁 路径名称搜索: ${collectPaths ? '✅ 启用' : '❌ 禁用 (--no-paths)'}\n`);
  process.stderr.write(`📋 排除配置: ${filterStats}\n`);
  process.stderr.write(`📄 扩展名范围: ${args.extExplicit ? args.extensions.join(', ') : '全部（按排除配置过滤）'}\n`);
  if (args.forceExts.size > 0 || args.forceDirs.size > 0) {
    const parts = [];
    if (args.forceExts.size > 0) parts.push(`强制扩展名: ${[...args.forceExts].join(', ')}`);
    if (args.forceDirs.size > 0) parts.push(`强制目录: ${[...args.forceDirs].join(', ')}`);
    process.stderr.write(`🔓 排除规则覆盖: ${parts.join('; ')}\n`);
  }
  if (args.fused) {
    process.stderr.write(`🔀 融合词匹配: ✅ 启用 (--fused，纯大写/纯小写段子串；含 ec 的英文单词如 DECLARE 也会出现)\n`);
  }
  if (args.caseSensitive) {
    process.stderr.write(`🔤 大小写敏感\n`);
  }

  // 收集文件 + 路径名称匹配
  const { files, pathMatches } = collectFiles(baseDir, args.extensions, {
    collectPaths,
    targetWord: WORD,
    caseSensitive: args.caseSensitive,
    fused: args.fused,
    forceExts: args.forceExts,
    forceDirs: args.forceDirs,
    extExplicit: args.extExplicit,
    filter,
  });
  if (args.output) {
    const outputRel = relative(baseDir, args.output).replace(/\\/g, '/');
    const idx = files.findIndex(f => relative(baseDir, f).replace(/\\/g, '/') === outputRel);
    if (idx !== -1) {
      files.splice(idx, 1);
      process.stderr.write(`⚠️  已排除输出文件: ${outputRel}\n`);
    }
  }
  process.stderr.write(`📊 扫描文件数: ${files.length}\n`);
  if (collectPaths) {
    const dirCount = pathMatches.filter(p => p.type === 'directory').length;
    const fileCount = pathMatches.filter(p => p.type === 'file-name').length;
    process.stderr.write(`📁 路径名称匹配: ${pathMatches.length} (${dirCount} 目录 + ${fileCount} 文件)\n`);
  }

  // 搜索文件内容
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const r = searchFile(files[i], WORD, args.caseSensitive, baseDir, args.context, args.fused);
    if (r) results.push(r);

    // 每 500 个文件输出进度
    if ((i + 1) % 500 === 0) {
      process.stderr.write(`  ⏳ 进度: ${i + 1}/${files.length}\n`);
    }
  }

  // 按路径排序
  results.sort((a, b) => a.relPath.localeCompare(b.relPath));
  pathMatches.sort((a, b) => a.relPath.localeCompare(b.relPath));

  const summary = {
    word: WORD,
    matchMode: args.fused ? 'semantic-token+fused' : 'semantic-token',
    caseSensitive: args.caseSensitive,
    extensions: args.extExplicit ? args.extensions : '*',
    excludeConfig: filter.source || null,
    filesScanned: files.length,
    filesWithMatches: results.length,
    totalMatches: results.reduce((s, r) => s + r.matches.length, 0),
    pathMatches: collectPaths ? {
      total: pathMatches.length,
      directories: pathMatches.filter(p => p.type === 'directory').length,
      fileNames: pathMatches.filter(p => p.type === 'file-name').length,
    } : null,
  };

  process.stderr.write(`🔎 内容匹配: ${summary.filesWithMatches} 文件, ${summary.totalMatches} 处\n`);
  if (collectPaths) {
    process.stderr.write(`📁 路径匹配: ${summary.pathMatches.total} 个\n\n`);
  } else {
    process.stderr.write(`\n`);
  }

  // JSON 输出
  if (args.json || args.output) {
    const json = args.concise
      ? buildConciseOutput(results, WORD, summary, baseDir, pathMatches, collectPaths, args.fused)
      : buildJsonOutput(results, WORD, summary, baseDir, pathMatches, collectPaths, args.fused);
    const output = JSON.stringify(json, null, 2);
    if (args.output) {
      mkdirSync(dirname(args.output), { recursive: true });
      writeFileSync(args.output, output, 'utf8');
      process.stderr.write(`✅ 已写入 ${args.output}\n`);
    } else {
      console.log(output);
    }
  }

  // 终端表格
  if (!(args.json && !args.output)) {
    printCrossTable(results, WORD);
    console.log();
    printDetail(results, WORD, args.limitFiles);

    // 路径名称匹配
    if (collectPaths && pathMatches.length > 0) {
      printPathMatches(pathMatches, WORD);
    }
  }
}

// ── exports ───────────────────────────────────────────────────────────

export { parseArgs, tokenizeIdentifier, idContainsToken, tokenizePathName, pathNameContainsToken, containsFusedSegment, collectFiles, searchFile, printCrossTable, printDetail, printPathMatches, buildJsonOutput, buildConciseOutput };

// ── CLI 入口 ───────────────────────────────────────────────────────────

const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/');
if (isMain) {
  main();
}
