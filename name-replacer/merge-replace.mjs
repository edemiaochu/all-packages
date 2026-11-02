/**
 * ── 多词合并替换工具 ──
 *
 * 当一个标识符中同时存在多个需要替换的词时（如 iModelECObjects），
 * 协调多个搜索词，以语义分词方式统一替换，生成合并映射表。
 *
 * 用法：
 *   node name-replacer/merge-replace.mjs -w "EC=EntityClass" -w "iModel=iVault" --ids a.json,b.json
 *
 * 选项：
 *   -w, --word <KEY=VALUE>    搜索词=基准替换词（可多次指定）
 *   --ids <file1,file2,...>   标识符来源文件（逗号分隔）
 *   -o, --output <path>       输出映射表路径（默认 merged-mapping.json）
 *   --overrides <path>        按模式的覆盖 JSON 文件（可选）
 *   --words-config <path>     替换词配置文件（保存/加载 -w 参数，避免重复输入）
 *   --json                    仅输出 JSON 到终端（不输出报告表格）
 *
 * overrides.json 格式:
 *   { "EC": { "eC": "entityClassCustom" }, "iModel": { "IMODEL": "IVAULT" } }
 *
 * --words-config 配置文件格式:
 *   { "words": [{"searchWord":"EC","baseReplacement":"EntityClass"}],
 *     "overrides": {...}, "idFiles": ["ec-result.json"] }
 *
 * 示例：
 *   # 首次使用：指定替换词并保存
 *   node name-replacer/merge-replace.mjs \
 *     -w "EC=EntityClass" -w "iModel=iVault" \
 *     --ids ec-result.json,imodel-result.json \
 *     --words-config merge-words.json
 *
 *   # 下次使用：自动加载配置文件，无需重复输入 -w
 *   node name-replacer/merge-replace.mjs \
 *     --words-config merge-words.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import {
  splitCamelCase,
  extractPatterns,
  classifyPatternCase,
  deriveReplacement,
} from './replace-server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── CLI 参数解析 ──────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    words: [],       // [{ searchWord, baseReplacement }]
    idFiles: [],     // 标识符来源文件路径列表
    output: join(__dirname, 'merged-mapping.json'),
    overridesFile: null,
    wordsConfig: null,
    serve: false,
    port: 3457,
    json: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '-w': case '--word': {
        const raw = argv[++i];
        const eq = raw.indexOf('=');
        if (eq === -1) {
          console.error(`无效的 --word 格式: "${raw}"，应为 KEY=VALUE`);
          process.exit(1);
        }
        args.words.push({
          searchWord: raw.substring(0, eq),
          baseReplacement: raw.substring(eq + 1),
        });
        break;
      }
      case '--ids':
        args.idFiles = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
        break;
      case '-o': case '--output':
        args.output = argv[++i];
        break;
      case '--overrides':
        args.overridesFile = argv[++i];
        break;
      case '--serve':
        args.serve = true;
        break;
      case '-p': case '--port':
        args.port = parseInt(argv[++i], 10);
        break;
      case '--json':
        args.json = true;
        break;
      case '--words-config':
        args.wordsConfig = argv[++i];
        break;
      case '--help': case '-h':
        args.help = true;
        break;
    }
  }
  return args;
}

// ── 标识符收集 ────────────────────────────────────────────────────────

/**
 * 从搜索输出文件中提取标识符列表（自动检测格式）。
 * 支持 search-ec concise 和 search-sensitive concise 两种格式。
 */
function readIdentifiers(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  if (Array.isArray(data.identifiers)) {
    return data.identifiers;
  }
  if (data.identifiers && typeof data.identifiers === 'object') {
    // search-sensitive concise: { word: [...] }
    return Object.values(data.identifiers).flat();
  }

  throw new Error(`无法从 ${filePath} 提取标识符列表`);
}

/**
 * 从多个文件中收集标识符，取并集（去重）。
 */
function collectIdentifiers(idFiles) {
  const all = new Set();
  for (const file of idFiles) {
    try {
      const ids = readIdentifiers(file);
      for (const id of ids) all.add(id);
    } catch (e) {
      console.error(`⚠️  跳过 ${file}: ${e.message}`);
    }
  }
  return [...all].sort();
}

// ── 替换词配置的保存/加载 ──────────────────────────────────────────────

/**
 * 从配置文件加载替换词。
 * 如果文件不存在则返回 null。
 *
 * 配置文件格式:
 *   { "words": [{"searchWord":"EC","baseReplacement":"EntityClass"}],
 *     "overrides": {"EC":{"eC":"entityClassCustom"}},
 *     "idFiles": ["ec-result.json"] }
 */
function loadWordsConfig(configPath) {
  try {
    const data = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (!data || !Array.isArray(data.words)) {
      console.error(`⚠️  配置文件格式无效: ${configPath}（缺少 words 数组）`);
      return null;
    }
    // 验证每个词条目
    for (const w of data.words) {
      if (!w.searchWord) {
        console.error(`⚠️  配置文件格式无效: ${configPath}（缺少 searchWord）`);
        return null;
      }
    }
    return {
      words: data.words.map(w => ({
        searchWord: w.searchWord,
        baseReplacement: w.baseReplacement || w.searchWord,
      })),
      overrides: data.overrides || null,
      idFiles: Array.isArray(data.idFiles) ? data.idFiles : [],
    };
  } catch (e) {
    if (e.code === 'ENOENT') return null; // 文件不存在是正常的
    console.error(`⚠️  读取配置文件失败: ${e.message}`);
    return null;
  }
}

/**
 * 保存替换词到配置文件。
 */
function saveWordsConfig(configPath, words, overrides, idFiles) {
  const data = {
    savedAt: new Date().toISOString(),
    words: words.map(w => ({
      searchWord: w.searchWord,
      baseReplacement: w.baseReplacement,
    })),
    idFiles,
  };
  if (overrides && Object.keys(overrides).length > 0) {
    data.overrides = overrides;
  }
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf-8');
  console.error(`💾 替换词配置已保存: ${configPath}`);
}

// ── Token Map 构建 ────────────────────────────────────────────────────

/**
 * 为每个搜索词构建 token→replacement 映射。
 *
 * 例如 searchWord="EC", baseReplacement="EntityClass":
 *   从标识符中提取 EC 的大小写模式 → { "EC": "EntityClass", "ec": "entityclass", ... }
 *
 * @returns {Map<string, string>} token → replacement
 */
function buildTokenMap(identifiers, words, overrides) {
  const tokenMap = new Map();

  for (const { searchWord, baseReplacement } of words) {
    const patterns = extractPatterns(identifiers, searchWord);
    const wordOverrides = (overrides && overrides[searchWord]) || {};

    for (const [pattern] of patterns) {
      const replacement = wordOverrides[pattern] || deriveReplacement(pattern, baseReplacement);
      if (replacement && replacement !== pattern) {
        // 冲突处理：如果两个搜索词产生相同的 token，
        // 保留更长的搜索词对应的替换（更具体）
        if (tokenMap.has(pattern)) {
          const existingSearchWord = [...words].find(w =>
            extractPatterns(identifiers, w.searchWord).some(([p]) => p === pattern)
          );
          // 比较搜索词长度
          const existingLen = existingSearchWord ? existingSearchWord.searchWord.length : 0;
          if (searchWord.length <= existingLen) continue; // 保留已有的（更长的）
        }
        tokenMap.set(pattern, replacement);
      }
    }
  }

  return tokenMap;
}

// ── 语义合并替换 ──────────────────────────────────────────────────────

/**
 * 对标识符执行严格替换：正则匹配 → 语义边界验证 → 查表替换。
 *
 * 1. 对 tokenMap 每个 key（按长度降序），在原始标识符中正则查找
 * 2. 验证匹配位置是否在语义边界上
 * 3. 非重叠匹配中，用 tokenMap 精确查表替换
 *
 * @param {string} id - 原始标识符
 * @param {Map<string, string>} tokenMap - token → replacement 映射
 * @returns {string} 替换后的标识符
 */
function smartMergeReplace(id, tokenMap) {
  // 收集所有 tokenMap key（去重大小写变体）
  const uniqueKeys = new Map(); // keyLower → [exactKeys]
  for (const [key] of tokenMap) {
    const kl = key.toLowerCase();
    if (!uniqueKeys.has(kl)) uniqueKeys.set(kl, []);
    uniqueKeys.get(kl).push(key);
  }

  // 按 key 长度降序生成查找用的 regex
  const searchList = [...uniqueKeys.entries()]
    .sort((a, b) => b[0].length - a[0].length);

  // 在原始 id 上收集所有候选匹配
  const candidates = [];
  for (const [keyLower, exactKeys] of searchList) {
    const regex = new RegExp(exactKeys[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let m;
    while ((m = regex.exec(id)) !== null) {
      candidates.push({ start: m.index, end: m.index + m[0].length, match: m[0] });
    }
  }

  // 排序：起始位置 → 长度降序
  candidates.sort((a, b) => a.start - b.start || b.match.length - a.match.length);

  // 筛选：非重叠 + 查表 + 语义边界
  const valid = [];
  let lastEnd = 0;
  for (const c of candidates) {
    if (c.start < lastEnd) continue;

    // 精确匹配的文本必须在 tokenMap 中
    const replacement = tokenMap.get(c.match);
    if (!replacement) continue;

    // 短词（≤3）语义边界：防止 "ec" 误匹配 "electron"
    if (c.match.length <= 3) {
      const before = c.start > 0 ? id[c.start - 1] : '';
      const after = c.end < id.length ? id[c.end] : '';
      const startCh = c.match[0];
      const endCh = c.match[c.match.length - 1];

      const startBoundary = c.start === 0
        || /[^a-zA-Z]/.test(before)
        || (/[a-z]/.test(before) && /[A-Z]/.test(startCh))
        || (/[A-Z]/.test(before) && /[A-Z]/.test(startCh));

      const endBoundary = c.end === id.length
        || /[^a-zA-Z]/.test(after)
        || (/[a-z]/.test(endCh) && /[A-Z]/.test(after))
        || (/[A-Z]/.test(endCh) && /[A-Z]/.test(after));

      if (!startBoundary || !endBoundary) continue;
    }

    valid.push({ ...c, replacement });
    lastEnd = c.end;
  }

  if (valid.length === 0) return id;

  let result = '';
  let pos = 0;
  for (const v of valid) {
    result += id.slice(pos, v.start);
    result += v.replacement;
    pos = v.end;
  }
  result += id.slice(pos);
  return result;
}


// ── 映射表生成 ────────────────────────────────────────────────────────

/**
 * 为所有标识符生成合并替换映射表。
 */
function generateMergedMapping(identifiers, tokenMap, excludeSet) {
  const mapping = {};
  let changed = 0, unchanged = 0;

  for (const id of identifiers) {
    if (excludeSet && excludeSet.has(id)) {
      unchanged++;
      continue;
    }

    const result = smartMergeReplace(id, tokenMap);

    if (result !== id) {
      mapping[id] = result;
      changed++;
    } else {
      unchanged++;
    }
  }

  // 按键排序
  const sorted = {};
  Object.keys(mapping).sort().forEach(k => { sorted[k] = mapping[k]; });

  return { mapping: sorted, stats: { changed, unchanged, total: changed + unchanged } };
}

// ── 终端报告 ──────────────────────────────────────────────────────────

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RST = '\x1b[0m';

function pad(s, w) { return String(s).padEnd(w); }
function padL(s, w) { return String(s).padStart(w); }

function printReport(words, tokenMap, identifiers, stats) {
  console.log('');
  console.log(BOLD + '═══ 合并替换报告 ═══' + RST);
  console.log('');

  // 搜索词 → 模式表
  console.log(BOLD + '替换规则:' + RST);
  for (const { searchWord, baseReplacement } of words) {
    console.log(`  ${searchWord} → ${baseReplacement}`);
  }

  // Token map
  console.log('');
  console.log(BOLD + 'Token 映射表:' + RST);
  const maxTok = Math.max(...[...tokenMap.keys()].map(t => t.length), 8);
  const header = `${pad('Token', maxTok)} │ Replacement`;
  console.log(DIM + header + RST);
  console.log(DIM + '─'.repeat(maxTok) + '─┼─' + '─'.repeat(30) + RST);
  for (const [token, repl] of tokenMap) {
    console.log(`${pad(token, maxTok)} │ ${repl}`);
  }

  // 统计
  console.log('');
  console.log(`${GREEN}标识符总数: ${identifiers.length}${RST}`);
  console.log(`  ${GREEN}替换: ${stats.changed}${RST}  未变: ${stats.unchanged}`);

  // 示例
  console.log('');
  console.log(BOLD + '替换示例（前 10 条）:' + RST);
  const entries = Object.entries(tokenMap);
  // 显示几个多词标识符的替换结果
  // 找包含多个不同搜索词的标识符示例
  const multiWordExamples = [];
  const singleWordExamples = [];

  const searchTokens = new Set(words.map(w => w.searchWord));
  for (const id of identifiers.slice(0, 500)) {
    const result = smartMergeReplace(id, tokenMap);
    if (result === id) continue;

    // 检查这个标识符涉及几个搜索词
    const involvedWords = new Set();
    for (const { searchWord } of words) {
      const lower = searchWord.toLowerCase();
      for (const tok of splitCamelCase(id)) {
        if (tok.toLowerCase() === lower) involvedWords.add(searchWord);
      }
    }
    if (involvedWords.size >= 2) {
      multiWordExamples.push([id, result, involvedWords.size]);
    } else if (singleWordExamples.length < 10) {
      singleWordExamples.push([id, result, 1]);
    }
  }

  if (multiWordExamples.length > 0) {
    console.log(`  ${DIM}涉及 ${GREEN}多词${RST}${DIM} 的标识符:${RST}`);
    for (const [id, result, count] of multiWordExamples.slice(0, 5)) {
      console.log(`    ${id.padEnd(40)} → ${GREEN}${result}${RST}  (${count} 个词)`);
    }
  }
  if (singleWordExamples.length > 0 && multiWordExamples.length === 0) {
    for (const [id, result] of singleWordExamples.slice(0, 10)) {
      console.log(`    ${id.padEnd(40)} → ${GREEN}${result}${RST}`);
    }
  }
}

// ── Web UI（--serve 模式）───────────────────────────────────────────

function buildMergeHtml(identifiers, initialWords, outputPath) {
  const totalIds = identifiers.length;
  const sampleIds = identifiers.slice(0, 12);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>多词合并替换配置</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f5f5f5; color: #333; }
.header { background: #1a1a2e; color: #fff; padding: 16px 28px; display: flex; justify-content: space-between; align-items: center; }
.header h1 { font-size: 18px; font-weight: 600; }
.header .stats { font-size: 13px; color: #8892b0; }
.main { max-width: 960px; margin: 20px auto; padding: 0 16px; display: flex; flex-direction: column; gap: 16px; }
.word-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); overflow: hidden; }
.word-header { padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; background: #fafbfc; }
.word-header h3 { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.word-header .badge { font-size: 11px; color: #666; background: #f0f0f0; padding: 2px 8px; border-radius: 10px; }
.word-header .del-btn { width: 24px; height: 24px; border: none; background: #fee; color: #c92a2a; border-radius: 50%; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.word-header .del-btn:hover { background: #fcc; }
.word-body { padding: 14px 20px; }
.word-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.word-row label { font-weight: 600; font-size: 13px; white-space: nowrap; min-width: 50px; }
.word-row input.base { flex: 1; padding: 6px 10px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; font-family: 'SF Mono', monospace; }
.word-row input.base:focus { outline: none; border-color: #4a6cf7; }
.word-row .preview { font-size: 11px; color: #888; white-space: nowrap; }
.pattern-mini { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.pattern-mini .pm { font-size: 12px; font-family: 'SF Mono', monospace; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; padding: 3px 8px; display: flex; align-items: center; gap: 4px; }
.pattern-mini .pm .tok { color: #c7254e; }
.pattern-mini .pm .cnt { color: #999; font-size: 10px; }
.pattern-mini .pm .repl { color: #22863a; font-weight: 600; }
.pattern-mini .pm input.ovr { width: 90px; padding: 2px 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 11px; font-family: 'SF Mono', monospace; }
.pattern-mini .pm.overridden { border-color: #e67700; background: #fff9f0; }
.add-card { background: #fff; border: 2px dashed #4a6cf7; border-radius: 10px; padding: 16px 20px; display: flex; gap: 10px; align-items: center; }
.add-card input { flex: 1; padding: 8px 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; font-family: 'SF Mono', monospace; }
.add-card input:focus { outline: none; border-color: #4a6cf7; }
.add-card button { padding: 8px 20px; background: #4a6cf7; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.add-card button:hover { background: #3b5de7; }
.token-map-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); overflow: hidden; }
.token-map-header { padding: 12px 20px; border-bottom: 1px solid #eee; font-size: 14px; font-weight: 600; background: #fafbfc; }
.token-map-body { padding: 12px 20px; display: flex; flex-wrap: wrap; gap: 6px; min-height: 32px; }
.token-tag { font-size: 12px; font-family: 'SF Mono', monospace; background: #e8f0fe; color: #1967d2; border-radius: 4px; padding: 3px 8px; }
.token-tag .arrow { color: #888; padding: 0 3px; }
.token-tag .to { color: #22863a; font-weight: 600; }
.actions { display: flex; gap: 10px; justify-content: center; padding: 8px 0 24px; }
.actions button { padding: 10px 28px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-save { background: #4a6cf7; color: #fff; }
.btn-save:hover { background: #3b5de7; }
.btn-preview { background: #fff; color: #4a6cf7; border: 2px solid #4a6cf7 !important; }
.btn-preview:hover { background: #eef1ff; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.modal { background: #fff; border-radius: 12px; width: 92vw; max-width: 1100px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
.modal-header { padding: 16px 24px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { font-size: 16px; }
.modal-header .close-btn { width: 28px; height: 28px; border: none; background: #f0f0f0; border-radius: 50%; cursor: pointer; font-size: 16px; }
.modal-toolbar { padding: 10px 24px; border-bottom: 1px solid #f0f0f0; display: flex; gap: 8px; align-items: center; }
.modal-toolbar .search { flex: 1; padding: 5px 12px; border: 1px solid #ddd; border-radius: 14px; font-size: 12px; outline: none; }
.modal-toolbar .search:focus { border-color: #4a6cf7; }
.modal-body { flex: 1; overflow-y: auto; padding: 6px 0; }
.transform-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.transform-table th { position: sticky; top: 0; background: #fafafa; padding: 8px 14px; text-align: left; font-weight: 600; color: #666; border-bottom: 2px solid #eee; z-index: 1; }
.transform-table td { padding: 5px 14px; border-bottom: 1px solid #f4f4f4; }
.transform-table .old { font-family: 'SF Mono', monospace; color: #c7254e; }
.transform-table .arrow { color: #aaa; padding: 0 6px; }
.transform-table .new { font-family: 'SF Mono', monospace; color: #22863a; font-weight: 600; }
.transform-table tr:hover td { background: #fafbff; }
.toast { position: fixed; top: 16px; right: 16px; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; z-index: 999; animation: slideIn .3s ease; }
.toast.success { background: #d3f9d8; color: #2b8a3e; border: 1px solid #b2f2bb; }
.toast.error { background: #ffe3e3; color: #c92a2a; border: 1px solid #ffc9c9; }
@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
</style>
</head>
<body>
<div class="header">
  <h1>多词合并替换配置</h1>
  <span class="stats" id="headerStats">${totalIds} 个标识符 | <span id="wordCount">${initialWords.length}</span> 个搜索词</span>
</div>
<div class="main">
  <!-- 静态：添加搜索词区域（不依赖 JS） -->
  <div class="add-card">
    <input id="addSearch" placeholder="搜索词  如: EC">
    <span style="color:#888;font-size:18px">→</span>
    <input id="addReplace" placeholder="替换为  如: EntityClass">
    <button id="addBtn">添加搜索词</button>
  </div>

  <!-- 动态：词卡片区域 -->
  <div id="wordCards"></div>

  <!-- 合并 Token 映射 -->
  <div class="token-map-card">
    <div class="token-map-header">合并 Token 映射</div>
    <div class="token-map-body" id="tokenMapBody">
      <span style="font-size:12px;color:#999">${initialWords.length > 0 ? '加载中...' : '请在上方添加搜索词'}</span>
    </div>
  </div>
</div>
<div class="actions">
  <button class="btn-preview" id="previewBtn">预览变更</button>
  <button class="btn-save" id="saveBtn">保存映射表</button>
</div>

<script>
var ALL_IDS = ${JSON.stringify(identifiers)};
var INITIAL_WORDS = ${JSON.stringify(initialWords)};

// ── State ──
var words = INITIAL_WORDS.map(function(w) { return {searchWord: w.searchWord, baseReplacement: w.baseReplacement, overrides: w.overrides || {}}; });

// ── API helpers ──
async function fetchPatterns(word, base) {
  const resp = await fetch('/patterns?word=' + encodeURIComponent(word) + '&base=' + encodeURIComponent(base || word));
  return await resp.json();
}

async function fetchTokenMap() {
  const resp = await fetch('/tokenmap', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({words})
  });
  return await resp.json();
}

// ── Render ──
async function render() {
  var container = document.getElementById('wordCards');
  if (!container) return;
  var html = '';

  for (var wi = 0; wi < words.length; wi++) {
    var w = words[wi];
    html += '<div class="word-card">';
    html += '<div class="word-header">';
    html += '<h3><span>' + w.searchWord + '</span> <span class="badge" id="badge_' + wi + '">加载中...</span></h3>';
    html += '<button class="del-btn" onclick="removeWord(' + wi + ')" title="删除">×</button>';
    html += '</div>';
    html += '<div class="word-body">';
    html += '<div class="word-row">';
    html += '<label>替换为</label>';
    html += '<input class="base" id="base_' + wi + '" value="' + w.baseReplacement + '" oninput="onBaseChange(' + wi + ')" placeholder="PascalCase">';
    html += '<span class="preview" id="preview_' + wi + '"></span>';
    html += '</div>';
    html += '<div class="pattern-mini" id="patterns_' + wi + '">加载中...</div>';
    html += '</div></div>';
  }

  container.innerHTML = html;

  // Load patterns for each word
  for (let wi = 0; wi < words.length; wi++) {
    await loadWordPatterns(wi);
  }
  await updateTokenMap();
}

async function loadWordPatterns(wi) {
  const w = words[wi];
  try {
    const data = await fetchPatterns(w.searchWord, w.baseReplacement);
    const badge = document.getElementById('badge_' + wi);
    if (badge) badge.textContent = data.patternCount + ' 种模式';

    const container = document.getElementById('patterns_' + wi);
    if (!container) return;
    if (!data.patterns || data.patterns.length === 0) {
      container.innerHTML = '<span style="font-size:12px;color:#999">未找到匹配模式</span>';
      return;
    }
    container.innerHTML = data.patterns.map(([pattern, count]) => {
      const derived = data.derived[pattern] || '';
      const ovrKey = 'ovr_' + wi + '_' + pattern.replace(/[^a-zA-Z0-9]/g, '_');
      const ovrVal = (w.overrides && w.overrides[pattern]) || '';
      const hasOvr = ovrVal !== '' && ovrVal !== derived;
      return '<span class="pm' + (hasOvr ? ' overridden' : '') + '">' +
        '<span class="tok">' + pattern + '</span>' +
        '<span class="cnt">×' + count + '</span>' +
        '→ <span class="repl" id="repl_' + wi + '_' + pattern.replace(/[^a-zA-Z0-9]/g, '_') + '">' + (ovrVal || derived) + '</span>' +
        '<input class="ovr" id="' + ovrKey + '" value="' + ovrVal + '" placeholder="覆盖" oninput="onOverride(' + wi + ',\\'' + pattern + '\\')">' +
        '</span>';
    }).join('');
  } catch(e) {
    console.error('加载模式失败:', e);
  }
}

async function updateTokenMap() {
  const body = document.getElementById('tokenMapBody');
  if (!body) return;
  try {
    const data = await fetchTokenMap();
    if (!data.tokenMap || Object.keys(data.tokenMap).length === 0) {
      body.innerHTML = '<span style="font-size:12px;color:#999">暂无映射（请添加搜索词）</span>';
      return;
    }
    body.innerHTML = Object.entries(data.tokenMap).map(([tok, repl]) =>
      '<span class="token-tag"><span>' + tok + '</span><span class="arrow">→</span><span class="to">' + repl + '</span></span>'
    ).join('');
  } catch(e) {
    body.innerHTML = '<span style="font-size:12px;color:#c92a2a">加载失败</span>';
  }
}

// ── User actions ──
function onBaseChange(wi) {
  const input = document.getElementById('base_' + wi);
  words[wi].baseReplacement = input?.value || words[wi].searchWord;
  // Reload patterns with new derivation
  loadWordPatterns(wi).then(() => updateTokenMap());
}

function onOverride(wi, pattern) {
  const key = pattern.replace(/[^a-zA-Z0-9]/g, '_');
  const ovrEl = document.getElementById('ovr_' + wi + '_' + key);
  if (!ovrEl) return;
  if (!words[wi].overrides) words[wi].overrides = {};
  words[wi].overrides[pattern] = ovrEl.value;

  // 直接更新显示，不重新渲染（否则会销毁正在输入的 input 元素）
  const replEl = document.getElementById('repl_' + wi + '_' + key);
  if (replEl) replEl.textContent = ovrEl.value;

  // 切换 overridden 样式
  const pmEl = ovrEl.closest('.pm');
  if (pmEl) {
    if (ovrEl.value) pmEl.classList.add('overridden');
    else pmEl.classList.remove('overridden');
  }

  updateTokenMap();
}

async function addWord() {
  const searchInput = document.getElementById('addSearch');
  const replaceInput = document.getElementById('addReplace');
  const searchWord = searchInput.value.trim();
  const baseReplacement = replaceInput.value.trim();
  if (!searchWord) { showToast('请输入搜索词', 'error'); searchInput.focus(); return; }
  if (!baseReplacement) { showToast('请输入替换词', 'error'); replaceInput.focus(); return; }
  if (words.some(w => w.searchWord === searchWord)) {
    showToast('搜索词 "' + searchWord + '" 已存在', 'error');
    return;
  }
  words.push({searchWord, baseReplacement, overrides: {}});
  searchInput.value = '';
  replaceInput.value = '';
  searchInput.focus();
  await render();
}

async function removeWord(wi) {
  words.splice(wi, 1);
  await render();
}

// ── Preview ──
async function showPreview() {
  if (words.length === 0) { showToast('请先添加搜索词', 'error'); return; }
  try {
    const resp = await fetch('/preview', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({words})
    });
    const data = await resp.json();
    if (!data.success) throw new Error(data.error);

    let rows = '';
    const sorted = Object.entries(data.mapping).sort((a,b) => a[0].localeCompare(b[0]));
    for (const [oldId, newId] of sorted) {
      rows += '<tr><td class="old">' + oldId + '</td><td class="arrow">→</td><td class="new">' + newId + '</td></tr>';
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal">' +
      '<div class="modal-header"><h2>变更预览 — ' + data.stats.changed + ' / ' + data.stats.total + ' 项</h2>' +
      '<button class="close-btn" onclick="this.closest(\\'.modal-overlay\\').remove()">×</button></div>' +
      '<div class="modal-toolbar">' +
      '<input class="search" placeholder="搜索..." oninput="const q=this.value.toLowerCase();document.querySelectorAll(\\'.transform-table tbody tr\\').forEach(r=>r.style.display=q===\\'\\'||r.textContent.toLowerCase().includes(q)?\\'\\':\\'none\\')">' +
      '<span style="font-size:12px;color:#888">共 ' + data.stats.changed + ' 条变更</span></div>' +
      '<div class="modal-body"><table class="transform-table">' +
      '<thead><tr><th>原名称</th><th></th><th>新名称</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  } catch(e) {
    showToast('预览失败: ' + e.message, 'error');
  }
}

// ── Save ──
async function save() {
  if (words.length === 0) { showToast('请先添加搜索词', 'error'); return; }
  const btn = document.getElementById('saveBtn');
  btn.disabled = true; btn.textContent = '保存中...';
  try {
    const resp = await fetch('/save', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({words})
    });
    const data = await resp.json();
    if (data.success) {
      showToast('已保存！' + data.stats.changed + ' 条映射 → ${outputPath.replace(/\\\\/g, '\\\\\\\\')}', 'success');
    } else {
      showToast('保存失败: ' + data.error, 'error');
    }
  } catch(e) {
    showToast('请求失败: ' + e.message, 'error');
  }
  btn.disabled = false; btn.textContent = '保存映射表';
}

function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Event bindings for static HTML ──
document.getElementById('addBtn').addEventListener('click', async function() {
  var si = document.getElementById('addSearch'), ri = document.getElementById('addReplace');
  var sw = si.value.trim(), rp = ri.value.trim();
  if (!sw) { showToast('请输入搜索词', 'error'); return; }
  if (!rp) { showToast('请输入替换词', 'error'); return; }
  if (words.some(function(w) { return w.searchWord === sw; })) {
    showToast('搜索词 "' + sw + '" 已存在', 'error'); return;
  }
  words.push({searchWord: sw, baseReplacement: rp, overrides: {}});
  si.value = ''; ri.value = ''; si.focus();
  document.getElementById('wordCount').textContent = words.length;
  await render();
});
document.getElementById('addReplace').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('addBtn').click();
});
document.getElementById('previewBtn').addEventListener('click', showPreview);
document.getElementById('saveBtn').addEventListener('click', save);

// Event delegation for word card inputs
document.addEventListener('input', function(e) {
  var el = e.target, action = el.dataset && el.dataset.action;
  if (action === 'baseChange') {
    var wi = parseInt(el.dataset.wi);
    words[wi].baseReplacement = el.value || words[wi].searchWord;
    loadWordPatterns(wi).then(updateTokenMap);
  } else if (action === 'override') {
    var wi = parseInt(el.dataset.wi), pattern = el.dataset.pattern;
    if (!words[wi].overrides) words[wi].overrides = {};
    words[wi].overrides[pattern] = el.value;
    loadWordPatterns(wi).then(updateTokenMap);
  }
});
document.addEventListener('click', function(e) {
  var el = e.target;
  if (el.dataset && el.dataset.action === 'remove') {
    var wi = parseInt(el.dataset.wi);
    words.splice(wi, 1);
    document.getElementById('wordCount').textContent = words.length;
    render();
  }
});

// ── Init ──
render();
</script>
</body>
</html>`;
}

function createMergeApp(identifiers, words, outputPath, wordsConfigPath) {
  const html = buildMergeHtml(identifiers, words, outputPath);

  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');

    // GET /
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // GET /patterns?word=EC&base=EntityClass
    if (req.method === 'GET' && url.pathname === '/patterns') {
      const searchWord = url.searchParams.get('word');
      const baseReplacement = url.searchParams.get('base') || searchWord;
      if (!searchWord) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing ?word=' }));
        return;
      }
      const patterns = extractPatterns(identifiers, searchWord);
      const derived = {};
      for (const [p] of patterns) {
        derived[p] = deriveReplacement(p, baseReplacement);
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ searchWord, patterns, derived, patternCount: patterns.length }));
      return;
    }

    // POST /tokenmap — build combined token map from client words
    if (req.method === 'POST' && url.pathname === '/tokenmap') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { words: clientWords } = JSON.parse(body);
          const wordObjs = (clientWords || []).map(w => ({
            searchWord: w.searchWord,
            baseReplacement: w.baseReplacement || w.searchWord,
          }));
          const overrides = {};
          for (const w of (clientWords || [])) {
            if (w.overrides && Object.keys(w.overrides).length > 0) {
              overrides[w.searchWord] = w.overrides;
            }
          }
          const tokenMap = buildTokenMap(identifiers, wordObjs, Object.keys(overrides).length > 0 ? overrides : null);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ tokenMap: Object.fromEntries(tokenMap) }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }

    // POST /preview
    if (req.method === 'POST' && url.pathname === '/preview') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { words: clientWords } = JSON.parse(body);
          const wordObjs = (clientWords || []).map(w => ({
            searchWord: w.searchWord,
            baseReplacement: w.baseReplacement || w.searchWord,
          }));
          const overrides = {};
          for (const w of (clientWords || [])) {
            if (w.overrides && Object.keys(w.overrides).length > 0) {
              overrides[w.searchWord] = w.overrides;
            }
          }
          const tokenMap = buildTokenMap(identifiers, wordObjs, Object.keys(overrides).length > 0 ? overrides : null);
          const { mapping, stats } = generateMergedMapping(identifiers, tokenMap, null);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, mapping, stats }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // POST /save
    if (req.method === 'POST' && url.pathname === '/save') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const { words: clientWords } = JSON.parse(body);
          const wordObjs = (clientWords || []).map(w => ({
            searchWord: w.searchWord,
            baseReplacement: w.baseReplacement || w.searchWord,
          }));
          const overrides = {};
          for (const w of (clientWords || [])) {
            if (w.overrides && Object.keys(w.overrides).length > 0) {
              overrides[w.searchWord] = w.overrides;
            }
          }
          const tokenMap = buildTokenMap(identifiers, wordObjs, Object.keys(overrides).length > 0 ? overrides : null);
          const { mapping, stats } = generateMergedMapping(identifiers, tokenMap, null);

          const output = {
            generatedAt: new Date().toISOString(),
            words: Object.fromEntries(wordObjs.map(w => [w.searchWord, w.baseReplacement])),
            tokenMap: Object.fromEntries(tokenMap),
            identifiersMerged: identifiers.length,
            mapping,
            stats,
          };
          mkdirSync(dirname(outputPath), { recursive: true });
          writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

          // 同时保存替换词配置（如果指定了 --words-config）
          if (wordsConfigPath) {
            try {
              saveWordsConfig(wordsConfigPath, wordObjs, Object.keys(overrides).length > 0 ? overrides : null, []);
            } catch (e) {
              console.error(`⚠️  无法保存替换词配置: ${e.message}`);
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, stats, outputPath }));
        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }

    // 404
    res.writeHead(404);
    res.end('Not found');
  });
}

// ── 主函数 ────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  // --serve 模式：启动 Web 界面
  if (args.serve) {
    // 从 words-config 加载初始替换词（在检查 idFiles 之前）
    let serveWords = args.words;
    if (args.wordsConfig) {
      const saved = loadWordsConfig(args.wordsConfig);
      if (saved) {
        console.error(`📋 已加载替换词配置: ${args.wordsConfig}`);
        // 合并：配置文件中的词 + 命令行 -w（命令行优先）
        const cmdWords = new Set(args.words.map(w => w.searchWord));
        serveWords = [...args.words];
        for (const w of saved.words) {
          if (!cmdWords.has(w.searchWord)) {
            serveWords.push(w);
          }
        }
        console.error(`   ${serveWords.map(w => `${w.searchWord}→${w.baseReplacement}`).join(', ')}`);
        // 配置文件中的 overrides 注入到对应词条
        if (saved.overrides && Object.keys(saved.overrides).length > 0) {
          for (const w of serveWords) {
            if (saved.overrides[w.searchWord]) {
              w.overrides = { ...saved.overrides[w.searchWord] };
            }
          }
          const ovrCount = Object.values(saved.overrides).reduce((s, o) => s + Object.keys(o).length, 0);
          console.error(`   📋 已加载 ${ovrCount} 条覆盖规则`);
        }
        // 配置文件中的 idFiles（合并到命令行指定的）
        if (saved.idFiles.length > 0) {
          const savedIds = saved.idFiles.filter(f => !args.idFiles.includes(f));
          if (savedIds.length > 0) {
            args.idFiles = [...new Set([...args.idFiles, ...savedIds])];
            console.error(`   --ids: ${args.idFiles.join(', ')}`);
          }
        }
      }
    }

    if (args.idFiles.length === 0) {
      console.error('❌ --serve 模式需要 --ids 指定标识符来源文件');
      process.exit(1);
    }

    const identifiers = collectIdentifiers(args.idFiles);
    console.error(`📊 合并标识符: ${identifiers.length} 个（去重）`);
    const app = createMergeApp(identifiers, serveWords, args.output, args.wordsConfig);
    app.listen(args.port, () => {
      console.error(`🌐 配置界面已启动: http://localhost:${args.port}`);
      console.error('   在浏览器中打开上述地址，添加搜索词并配置替换');
      if (args.wordsConfig) {
        console.error(`   💾 点击"保存映射表"时自动保存替换词到: ${args.wordsConfig}`);
      }
    });
    app.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${args.port} 已被占用，请尝试: --port ${args.port + 1}`);
        process.exit(1);
      }
      throw e;
    });
    return;
  }

  // ── 加载替换词配置 ──
  if (args.wordsConfig) {
    const saved = loadWordsConfig(args.wordsConfig);
    if (saved) {
      console.error(`📋 已加载替换词配置: ${args.wordsConfig}`);
      console.error(`   ${saved.words.map(w => `${w.searchWord}→${w.baseReplacement}`).join(', ')}`);
      // 合并配置中的词和命令行 -w 指定的词（命令行优先追加，不覆盖）
      const cmdWords = new Set(args.words.map(w => w.searchWord));
      const mergedWords = [...args.words]; // 命令行的放前面（优先）
      for (const w of saved.words) {
        if (!cmdWords.has(w.searchWord)) {
          mergedWords.push(w);
        }
      }
      args.words = mergedWords;
      // 配置文件中的 idFiles（仅在命令行未指定时使用）
      if (args.idFiles.length === 0 && saved.idFiles.length > 0) {
        args.idFiles = saved.idFiles;
        console.error(`   --ids: ${saved.idFiles.join(', ')}（来自配置）`);
      }
      // 配置文件中的 overrides（与 --overrides 指定的合并）
      if (saved.overrides && !args.overridesFile) {
        args._loadedOverrides = saved.overrides;
      }
    }
  }

  if (args.help || args.words.length === 0 || args.idFiles.length === 0) {
    console.log(`多词合并替换工具 — 协调多个搜索词统一替换

用法: node name-replacer/merge-replace.mjs [options]

CLI 模式（命令行直接生成映射表）:
  node name-replacer/merge-replace.mjs -w "KEY=VALUE" [...] --ids <files>

Web 界面模式（浏览器中配置）:
  node name-replacer/merge-replace.mjs --serve --ids <files> [-p 3457]

选项:
  -w, --word <KEY=VALUE>   搜索词=基准替换词（可多次指定）
  --ids <file1,file2,...>  标识符来源文件（逗号分隔）
  --serve                  启动 Web 配置界面
  -p, --port <n>           Web 端口（默认 3457）
  -o, --output <path>      输出映射表路径（默认 merged-mapping.json）
  --overrides <path>       按模式的覆盖 JSON 文件（可选）
  --words-config <path>    替换词配置文件（自动保存/加载 -w 参数）
  --json                   仅输出 JSON 到终端（不输出报告表格）

替换词配置 (--words-config):
  首次使用时，指定 -w 和 --ids 后会保存到文件:
    下次只需 --words-config 即可复用，无需重复输入 -w 和 --ids

示例:
  # CLI: 命令行直接生成
  node name-replacer/merge-replace.mjs \\
    -w "EC=EntityClass" -w "iModel=iVault" \\
    --ids ec-result.json,imodel-result.json

  # 保存替换词配置，方便下次复用
  node name-replacer/merge-replace.mjs \\
    -w "EC=EntityClass" -w "iModel=iVault" \\
    --ids ec-result.json,imodel-result.json \\
    --words-config merge-words.json

  # 下次直接使用配置，无需重复输入 -w
  node name-replacer/merge-replace.mjs --words-config merge-words.json

  # Web UI: 浏览器中交互式配置
  node name-replacer/merge-replace.mjs \\
    --serve --ids ec-result.json,imodel-result.json

  # 生成 name-mapping.json（可直接用于 apply-replace.mjs）
  node name-replacer/merge-replace.mjs \\
    -w "EC=EntityClass" -w "iModel=iVault" \\
    --ids ec-result.json,imodel-result.json \\
    -o name-mapping.json

场景说明:
  当一个标识符中同时包含多个需要替换的词时（如 iModelECObjects），
  本工具正确处理多词协调替换:
    iModelECObjects → iVaultEntityClassObjects
    其中 iModel→iVault, EC→EntityClass`);
    process.exit(args.help ? 0 : 1);
  }

  // 收集标识符
  console.error(`📂 读取标识符文件: ${args.idFiles.join(', ')}`);
  const identifiers = collectIdentifiers(args.idFiles);
  console.error(`📊 合并标识符: ${identifiers.length} 个（去重）`);

  // 读取覆盖配置
  let overrides = null;
  if (args.overridesFile) {
    try {
      overrides = JSON.parse(readFileSync(args.overridesFile, 'utf-8'));
      console.error(`📋 加载覆盖配置: ${args.overridesFile}`);
    } catch (e) {
      console.error(`⚠️  无法读取覆盖文件: ${e.message}`);
    }
  }
  // 合并配置文件中的 overrides
  if (args._loadedOverrides) {
    if (!overrides) overrides = {};
    Object.assign(overrides, args._loadedOverrides);
    console.error(`📋 已合并配置文件中的覆盖规则`);
  }

  // 构建 token map（每个搜索词提取模式 → 推导替换 → 合并）
  console.error(`🔤 搜索词: ${args.words.map(w => `${w.searchWord}→${w.baseReplacement}`).join(', ')}`);
  const tokenMap = buildTokenMap(identifiers, args.words, overrides);

  // 输出每个搜索词的模式信息
  for (const { searchWord } of args.words) {
    const patterns = extractPatterns(identifiers, searchWord);
    console.error(`  ${searchWord}: ${patterns.length} 种模式 (${patterns.map(([p, c]) => p + '×' + c).join(', ')})`);
  }
  console.error(`🗺️  Token 映射: ${tokenMap.size} 条`);

  // 生成映射
  const { mapping, stats } = generateMergedMapping(identifiers, tokenMap, null);

  // 输出结果
  const output = {
    generatedAt: new Date().toISOString(),
    words: Object.fromEntries(args.words.map(w => [w.searchWord, w.baseReplacement])),
    tokenMap: Object.fromEntries(tokenMap),
    identifiersMerged: identifiers.length,
    mapping,
    stats,
  };

  // 写文件
  mkdirSync(dirname(args.output), { recursive: true });
  writeFileSync(args.output, JSON.stringify(output, null, 2), 'utf-8');
  console.error(`✅ 已写入 ${args.output}`);

  // 终端输出
  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    printReport(args.words, tokenMap, identifiers, stats);
  }

  // 保存替换词配置（如果指定了 --words-config）
  if (args.wordsConfig) {
    saveWordsConfig(args.wordsConfig, args.words, overrides, args.idFiles);
  }
}

// ── exports ───────────────────────────────────────────────────────────

export {
  parseArgs,
  collectIdentifiers,
  loadWordsConfig,
  saveWordsConfig,
  buildTokenMap,
  smartMergeReplace,
  generateMergedMapping,
};

// ── CLI 入口 ───────────────────────────────────────────────────────────

const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/');
if (isMain) {
  main();
}
