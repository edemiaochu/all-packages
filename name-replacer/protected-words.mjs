/**
 * ── 基础替换词保护（search-ec / search-sensitive / replace-server 共用）──
 *
 * 「基础替换词」指已经定稿的新词：base-mapping.json 的值、replace-server 配置里的
 * baseName、exclude-list.json 里人工排除的标识符。这些新词往往包含品牌片段：
 *
 *   szewec  含 "ec"   → search-ec 会把 szewEC / SzewECSchema 当成 EC 提取，
 *                        再按 EC→dm 替换就变成 szewdm（脏数据）
 *   szewec  含 "ec"   → --fused 下纯小写 szewec / szewecschema 也会被提取
 *
 * 本模块把它们当作「受保护字面量」，两个环节统一使用：
 *   1. 提取（search-ec / search-sensitive）：
 *      命中位置落在受保护串内部时不报告该命中；
 *      只要同一标识符里还有不受保护的命中，标识符仍会保留（仍需要替换）。
 *   2. 生成映射（replace-server）：
 *      受保护串先用占位符藏起来，全部词规则跑完再还原，
 *      等价于「已经替换过的部分不会被下一个词二次改写」。
 *
 * 配置来源（按顺序合并，文件缺失时自动跳过）：
 *   1. name-replacer/protected-words.json   手工补充（数组或 { "words": [...] }）
 *      示例见 name-replacer/protected-words.example.json
 *   2. name-replacer/base-mapping.json      所有值（去掉 $ 前缀）
 *   3. name-replacer/replace-server-config.json  各搜索词的 baseName
 *   4. name-replacer/exclude-list.json      字符串条目或全局 { text } 条目（带 paths 的跳过）
 *
 * 说明：
 * - 词长 < 3 的忽略（如 dm），避免把普通单词大面积遮住；
 * - 匹配大小写不敏感；
 * - 只接受标识符形态的词（字母数字开头，可含 _ . -）。
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const PROTECTED_WORDS_PATH = join(__dirname, 'protected-words.json');
export const BASE_MAPPING_PATH = join(__dirname, 'base-mapping.json');
export const SERVER_CONFIG_PATH = join(__dirname, 'replace-server-config.json');
export const EXCLUDE_LIST_PATH = join(__dirname, 'exclude-list.json');

/** 词长下限：更短的新词（dm/bld 这种）不参与保护，避免误遮普通文本。 */
export const MIN_TERM_LENGTH = 3;

const TERM_RE = /^[A-Za-z0-9][A-Za-z0-9_.\-]*$/;

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null; // 不存在或格式错误：跳过该来源
  }
}

function stripMarkers(s) {
  return String(s).trim().replace(/^[$_]+/, '').replace(/[$_]+$/, '');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 读取全部保护词及其来源。
 * @returns {{
 *   entries: Array<{ term: string, sources: Array<{ source: string, detail: string }> }>,
 *   ignored: Array<{ raw: string, reason: string, source: string }>
 * }}
 */
export function collectProtectedTerms() {
  const byLower = new Map();
  const ignored = [];

  const add = (raw, source, detail) => {
    if (typeof raw !== 'string' || !raw.trim()) return;
    const term = stripMarkers(raw);
    if (!TERM_RE.test(term)) {
      ignored.push({ raw: raw.trim(), reason: '非标识符形态', source });
      return;
    }
    if (term.length < MIN_TERM_LENGTH) {
      ignored.push({ raw: term, reason: `长度 < ${MIN_TERM_LENGTH}`, source });
      return;
    }
    const lower = term.toLowerCase();
    let entry = byLower.get(lower);
    if (!entry) {
      entry = { term, sources: [] };
      byLower.set(lower, entry);
    }
    if (!entry.sources.some(s => s.source === source && s.detail === detail)) {
      entry.sources.push({ source, detail });
    }
  };

  // 1. 手工补充
  const manual = readJson(PROTECTED_WORDS_PATH);
  const manualList = Array.isArray(manual)
    ? manual
    : (manual && typeof manual === 'object' && Array.isArray(manual.words) ? manual.words : []);
  for (const entry of manualList) {
    if (typeof entry === 'string') add(entry, 'protected-words.json', '手工补充');
    else if (entry && typeof entry === 'object') add(entry.word ?? entry.text, 'protected-words.json', '手工补充');
  }

  // 2. base-mapping.json 的值（$bentley → $szewec 里的 szewec）
  const base = readJson(BASE_MAPPING_PATH);
  if (base && typeof base === 'object' && !Array.isArray(base)) {
    for (const [k, v] of Object.entries(base)) {
      add(v, 'base-mapping.json', `${k} → ${v}`);
    }
  }

  // 3. replace-server 配置里的基准替换词
  const config = readJson(SERVER_CONFIG_PATH);
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    for (const [word, cfg] of Object.entries(config)) {
      if (word.startsWith('_') || !cfg || typeof cfg !== 'object') continue;
      add(cfg.baseName, 'replace-server-config.json', `词 "${word}" 的 baseName`);
    }
  }

  // 4. exclude-list.json（人工排除的标识符 = 已确认不能改）
  //    只取全局条目：带 paths 的条目只在指定路径生效，提取阶段没有路径上下文，
  //    交给 apply-replace 的占位符保护处理。
  const exclude = readJson(EXCLUDE_LIST_PATH);
  if (Array.isArray(exclude)) {
    for (const entry of exclude) {
      if (typeof entry === 'string') add(entry, 'exclude-list.json', '全局排除项');
      else if (entry && typeof entry === 'object' && !entry.paths) {
        add(entry.text, 'exclude-list.json', '全局排除项');
      }
    }
  }

  const entries = [...byLower.values()].sort(
    (a, b) => b.term.length - a.term.length || a.term.localeCompare(b.term)
  );
  return { entries, ignored };
}

/**
 * 读取全部基础替换词（已归一化、去重、按长度降序）。
 * @returns {string[]}
 */
export function loadProtectedTerms() {
  return collectProtectedTerms().entries.map(e => e.term);
}

/**
 * 创建保护器。terms 已按长度降序时最优；内部会再排序一次。
 */
export function createProtector(terms = loadProtectedTerms()) {
  const list = [];
  const seen = new Set();
  for (const raw of terms || []) {
    if (typeof raw !== 'string') continue;
    const term = stripMarkers(raw);
    if (term.length < MIN_TERM_LENGTH || !TERM_RE.test(term)) continue;
    const lower = term.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    list.push(term);
  }
  list.sort((a, b) => b.length - a.length);
  const lowerList = list.map(t => t.toLowerCase());

  /** 文本里所有受保护片段的区间 */
  function findSpans(text) {
    if (lowerList.length === 0) return [];
    const s = String(text).toLowerCase();
    const spans = [];
    for (const term of lowerList) {
      let i = s.indexOf(term);
      while (i !== -1) {
        spans.push({ start: i, end: i + term.length, term });
        i = s.indexOf(term, i + 1);
      }
    }
    return spans;
  }

  /** [start, end) 这一段是否完全落在某个受保护片段内 */
  function isRangeProtected(text, start, end) {
    if (lowerList.length === 0) return false;
    return findSpans(text).some(sp => start >= sp.start && end <= sp.end);
  }

  /**
   * matchedToken 的所有出现位置是否都落在受保护片段内。
   * 只要有一处不受保护 → false（该标识符仍需要替换；生成映射时只遮住受保护片段）。
   */
  function isMatchProtected(text, matchedToken) {
    if (lowerList.length === 0 || !matchedToken) return false;
    const s = String(text).toLowerCase();
    const tok = String(matchedToken).toLowerCase();
    if (!tok) return false;
    const spans = findSpans(s);
    if (spans.length === 0) return false;

    let seen = false;
    let i = s.indexOf(tok);
    while (i !== -1) {
      seen = true;
      const end = i + tok.length;
      if (!spans.some(sp => i >= sp.start && end <= sp.end)) return false;
      i = s.indexOf(tok, i + 1);
    }
    return seen;
  }

  /** 文本中是否含任一受保护片段 */
  function contains(text) {
    return findSpans(text).length > 0;
  }

  /**
   * 把受保护片段替换成占位符（长词优先，避免 Product1 先吃掉 Product10）。
   * @param {string} text
   * @param {(word:string)=>string} makePlaceholder 占位符工厂
   * @returns {{ text: string, hidden: Array<[string, string]> }}
   */
  function maskText(text, makePlaceholder) {
    let out = String(text);
    const hidden = [];
    if (lowerList.length === 0) return { text: out, hidden };
    for (const term of list) {
      out = out.replace(new RegExp(escapeRegExp(term), 'gi'), (m) => {
        const ph = makePlaceholder(m);
        hidden.push([ph, m]);
        return ph;
      });
    }
    return { text: out, hidden };
  }

  /** 还原 maskText 产生的占位符 */
  function restoreText(text, hidden) {
    let out = String(text);
    for (const [ph, original] of hidden || []) {
      if (out.includes(ph)) out = out.split(ph).join(original);
    }
    return out;
  }

  return { terms: list, findSpans, isRangeProtected, isMatchProtected, contains, maskText, restoreText };
}

/** 默认保护器（读取全部配置来源） */
export function loadProtector() {
  return createProtector(loadProtectedTerms());
}

// ── CLI: 列出当前生效的保护词 ──────────────────────────────────────

function printProtectedWords(asJson) {
  const { entries, ignored } = collectProtectedTerms();

  if (asJson) {
    console.log(JSON.stringify({ protectedWords: entries, ignored }, null, 2));
    return;
  }

  console.log(`🛡️  当前生效的保护词: ${entries.length} 个（大小写不敏感，按长度降序）`);
  console.log('');
  const width = Math.max(6, ...entries.map(e => e.term.length));
  console.log('  ' + '词'.padEnd(width) + '  来源');
  console.log('  ' + '─'.repeat(width) + '  ' + '─'.repeat(48));
  for (const e of entries) {
    const src = e.sources.map(s => `${s.source}: ${s.detail}`).join(' | ');
    console.log('  ' + e.term.padEnd(width) + '  ' + src);
  }

  if (ignored.length > 0) {
    console.log('');
    console.log(`未纳入的保护项: ${ignored.length} 个`);
    for (const i of ignored) {
      console.log(`  ${i.raw}  — ${i.reason}（${i.source}）`);
    }
  }

  console.log('');
  console.log('说明: 保护只跳过落在这些词内部的命中；标识符里其它位置仍正常提取/替换。');
}

/**
 * 把当前保护词导出成 JSON 快照，便于 review / diff / CI。
 * 注意：快照只是输出，不会被本模块读取；真正的来源仍是
 * base-mapping.json / replace-server-config.json / exclude-list.json /
 * protected-words.json。
 */
function writeProtectedWordsFile(outPath) {
  const { entries, ignored } = collectProtectedTerms();
  const data = { count: entries.length, protectedWords: entries, ignored };
  writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ 已写入 ${outPath}（${entries.length} 个保护词）`);
}

export { printProtectedWords, writeProtectedWordsFile };

const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/');
if (isMain) {
  const argv = process.argv.slice(2);
  const outIdx = argv.indexOf('--out');
  if (outIdx !== -1) {
    const outPath = argv[outIdx + 1];
    if (!outPath) {
      console.error('用法: node name-replacer/protected-words.mjs --out <文件路径>');
      process.exit(1);
    }
    writeProtectedWordsFile(resolve(process.cwd(), outPath));
  } else {
    printProtectedWords(argv.includes('--json'));
  }
}
