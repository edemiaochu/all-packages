/**
 * ── 通用替换词配置服务器 ──
 *
 * 读取搜索输出文件（search-ec.mjs 或 search-sensitive.mjs），
 * 提供 Web 界面配置替换映射，生成与 apply-replace.mjs 兼容的映射表。
 *
 * 用法：
 *   node name-replacer/replace-server.mjs --input <file> [options]
 *
 * 选项：
 *   -i, --input <path>    搜索输出 JSON 文件（必填）
 *   -w, --word <name>     指定配置哪个搜索词（多词文件时使用）
 *   -p, --port <n>        HTTP 端口（默认 3457）
 *   -o, --output <path>   映射表输出路径（默认从输入文件名推导）
 *   --config <path>       UI 配置保存路径（默认从输入文件名推导）
 *
 * 输入文件支持的格式：
 *   A. search-ec --concise:    { searchWord, identifiers: [...] }
 *   B. search-sensitive --concise: { words, identifiers: { word: [...] } }
 *      （旧版输出缺顶层 words 也支持，词列表从 identifiers 的键推导）
 *   C. search-sensitive 完整:  { words, identifiers: [...] }
 *   D. merge-ids 输出:        { identifiers: [...] }（不含搜索词，词来自配置文件）
 *
 * 模式：
 *   单词模式 — 文件只含一个词或用 --word 指定，界面单卡片
 *   多词模式 — 多键 concise / full / merge-ids 输入且不带 --word：
 *             按已保存配置渲染全部词卡片（可继续添加/移除），
 *             保存时整体更新配置并生成逐词串联的合并映射表
 *
 * 输出：
 *   {Word}-mapping.json — 扁平映射表 { "oldId": "newId", ... }
 *   replace-server-config.json — UI 配置（按搜索词分组，启动时自动恢复）
 *
 * 架构参照 server.mjs，但泛化为任意搜索词，去掉品牌硬编码。
 */

import { readFileSync, writeFileSync } from 'fs';
import { createServer } from 'http';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── CLI 参数解析 ──────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    input: null,
    word: null,
    port: 3457,
    output: null,
    configPath: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '-i': case '--input':
        args.input = argv[++i];
        break;
      case '-w': case '--word':
        args.word = argv[++i];
        break;
      case '-p': case '--port':
        args.port = parseInt(argv[++i], 10);
        break;
      case '-o': case '--output':
        args.output = argv[++i];
        break;
      case '--config':
        args.configPath = argv[++i];
        break;
      case '--help': case '-h':
        args.help = true;
        break;
    }
  }
  return args;
}

// ── 输出路径推导 ──────────────────────────────────────────────────────

function deriveOutputPaths(inputPath, outputOverride, configOverride) {
  const inputBase = basename(inputPath, extname(inputPath));
  // 去掉常见的 -result 后缀
  const stem = inputBase.replace(/-result$/, '');

  return {
    mapping: outputOverride || join(__dirname, `${stem}-mapping.json`),
    config: configOverride || join(__dirname, 'replace-server-config.json'),
    legacyConfig: join(__dirname, `${stem}-config.json`),  // 旧版单文件配置，作为回退
    exclude: join(__dirname, 'exclude-list.json'),
  };
}

/**
 * 读取共享配置文件 replace-server-config.json，结构为按搜索词分组的对象。
 * 文件不存在或损坏时返回空对象。
 */
function readConfigFile(configPath) {
  try {
    const data = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch { /* 不存在或格式错误时视为空 */ }
  return {};
}

/**
 * 读取指定搜索词的已保存 UI 配置。
 * 优先读 replace-server-config.json；旧版 {stem}-config.json（如 ec-config.json）作为回退，
 * 首次保存后会自动迁移到共享配置文件。
 */
function loadSavedConfig(paths, searchWord) {
  const shared = readConfigFile(paths.config);
  if (shared[searchWord]) return shared[searchWord];

  const legacy = readConfigFile(paths.legacyConfig);
  if (legacy.baseName || legacy.overrides || legacy.noModify) return legacy;

  return null;
}

/**
 * 多词模式：以文件派生的词为底座，合并当前配置文件里的全部词。
 * 配置里的条目覆盖 saved 状态，配置独有的词（如之前在其他会话里添加的）补充进来。
 * 页面每次请求都会调用，外部修改配置文件后刷新浏览器即可生效。
 */
function refreshWords(baseWords, identifiers, paths) {
  const savedAll = readConfigFile(paths.config);
  const wordMap = new Map(baseWords.map(w => [w.word, { ...w }]));
  for (const [word, saved] of Object.entries(savedAll)) {
    if (word.startsWith('_')) continue;  // 保留字（_manual/_manualTokens/_manualSkip），不是搜索词
    const existing = wordMap.get(word);
    wordMap.set(word, existing ? { ...existing, saved } : { word, patterns: extractPatterns(identifiers, word), saved });
  }
  return [...wordMap.values()];
}

/**
 * 解析启动会话：确定单词模式还是多词模式。
 *
 * 单词模式：--word 显式指定，或文件只含一个词（ec-format / 单键 concise）。
 * 多词模式：多键 concise、sensitive-full、merge-ids 输出 —— 词列表来自文件本身
 *   （concise / full，wordSource='file'）或已保存配置（merge-ids，wordSource='config'），
 *   界面里可继续添加/移除词。wordSource 决定刷新页面时的重建方式：
 *   file 保留文件词并叠加配置，config 完全以配置为准。
 * 保存时多词模式会整体重写配置文件并生成逐词串联的合并映射表。
 */
function resolveSession(args, paths) {
  const data = JSON.parse(readFileSync(args.input, 'utf-8'));
  const shape = detectInputShape(data);

  const baseInfo = {
    generatedAt: data.generatedAt,
    searchDir: data.searchDir,
    matchMode: data.matchMode || (shape === 'ec-format' ? 'semantic-token' : 'substring'),
    originalSummary: data.summary,
  };

  // --word 显式指定 → 单词模式
  if (args.word) {
    const parsed = parseInputFile(args.input, args.word);
    return { mode: 'single', ...parsed, saved: loadSavedConfig(paths, parsed.searchWord) };
  }

  if (shape === 'ec-format') {
    const parsed = parseInputFile(args.input);
    return { mode: 'single', ...parsed, saved: loadSavedConfig(paths, parsed.searchWord) };
  }

  if (shape === 'sensitive-concise') {
    const keys = data.words || Object.keys(data.identifiers || {});
    if (keys.length === 1) {
      const parsed = parseInputFile(args.input);
      return { mode: 'single', ...parsed, saved: loadSavedConfig(paths, parsed.searchWord) };
    }
    const merged = [...new Set(Object.values(data.identifiers || {}).flat())];
    const baseWords = keys.map(w => ({
      word: w,
      patterns: extractPatterns(data.identifiers[w] || [], w),
    }));
    return {
      mode: 'multi',
      identifiers: merged,
      wordSource: 'file',
      words: refreshWords(baseWords, merged, paths),
      sourceInfo: baseInfo,
    };
  }

  if (shape === 'sensitive-full') {
    const ids = Array.isArray(data.identifiers) ? data.identifiers : [];
    const baseWords = (data.words || []).map(w => ({
      word: w,
      patterns: extractPatterns(ids, w),
    }));
    return {
      mode: 'multi',
      identifiers: [...new Set(ids)],
      wordSource: 'file',
      words: refreshWords(baseWords, [...new Set(ids)], paths),
      sourceInfo: baseInfo,
    };
  }

  if (shape === 'merged-ids') {
    // 词列表完全来自已保存配置（replace-server-config.json），界面可继续添加新词
    return {
      mode: 'multi',
      identifiers: [...new Set(data.identifiers)],
      wordSource: 'config',
      words: refreshWords([], [...new Set(data.identifiers)], paths),
      sourceInfo: { ...baseInfo, matchMode: 'merged' },
    };
  }

  throw new Error('无法识别输入文件格式。支持的格式: search-ec --concise, search-sensitive --concise, search-sensitive 完整 JSON, merge-ids 输出');
}

// ── 输入文件解析 ──────────────────────────────────────────────────────

/**
 * 检测搜索输出文件的格式。
 * @returns {'ec-format' | 'sensitive-concise' | 'sensitive-full' | 'merged-ids' | 'unknown'}
 */
function detectInputShape(data) {
  if (data.searchWord) return 'ec-format';
  // 旧版 search-sensitive --concise 输出没有顶层 words 字段，identifiers 按词分组的对象即可识别
  if (data.identifiers && !Array.isArray(data.identifiers)) return 'sensitive-concise';
  if (data.words) return 'sensitive-full';
  // merge-ids.mjs 输出：多来源合并的扁平标识符列表，不含搜索词信息（需 --word 指定）
  if (Array.isArray(data.identifiers)) return 'merged-ids';
  return 'unknown';
}

/**
 * 从搜索输出文件中提取 searchWord 和 identifiers。
 */
function parseInputFile(filePath, targetWord) {
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    throw new Error(`无法读取输入文件: ${filePath}\n${e.message}`);
  }

  const shape = detectInputShape(data);

  let searchWord, identifiers, sourceInfo;

  switch (shape) {
    case 'ec-format': {
      // search-ec --concise 输出
      searchWord = targetWord || data.searchWord;
      if (!searchWord) throw new Error('输入文件中未找到 searchWord，请用 --word 指定');
      identifiers = Array.isArray(data.identifiers) ? data.identifiers : [];
      sourceInfo = {
        generatedAt: data.generatedAt,
        searchDir: data.searchDir,
        matchMode: data.matchMode || 'semantic-token',
        originalSummary: data.summary,
      };
      break;
    }

    case 'sensitive-concise': {
      // search-sensitive --concise 输出（旧版文件缺顶层 words，从 identifiers 的键推导）
      const words = data.words || Object.keys(data.identifiers || {});
      if (!targetWord && words.length === 1) {
        targetWord = words[0];
      }
      if (!targetWord) {
        throw new Error(`多词文件中请用 --word 指定要配置的词。可用词: ${words.join(', ')}`);
      }
      searchWord = targetWord;
      const idMap = data.identifiers || {};
      identifiers = idMap[searchWord] || [];
      sourceInfo = {
        generatedAt: data.generatedAt,
        searchDir: data.searchDir,
        matchMode: 'substring',
        originalSummary: data.summary,
      };
      break;
    }

    case 'sensitive-full': {
      // search-sensitive 完整 JSON 输出
      const words = data.words || [];
      if (!targetWord && words.length === 1) {
        targetWord = words[0];
      }
      if (!targetWord) {
        throw new Error(`多词文件中请用 --word 指定要配置的词。可用词: ${words.join(', ')}`);
      }
      searchWord = targetWord;
      // identifiers 是所有词的合并列表
      identifiers = Array.isArray(data.identifiers) ? data.identifiers : [];
      sourceInfo = {
        generatedAt: data.generatedAt,
        searchDir: data.searchDir,
        matchMode: 'substring',
        originalSummary: data.summary,
      };
      break;
    }

    case 'merged-ids': {
      // merge-ids.mjs 输出（多来源合并的扁平标识符列表，不含搜索词信息）
      if (!targetWord) {
        throw new Error('该文件不含搜索词信息，请用 --word 指定要配置的词，例如: --word dgn');
      }
      searchWord = targetWord;
      identifiers = data.identifiers;
      sourceInfo = {
        generatedAt: data.generatedAt,
        searchDir: null,
        matchMode: 'merged',
        originalSummary: data.sources,
      };
      break;
    }

    default:
      throw new Error('无法识别输入文件格式。支持的格式: search-ec --concise, search-sensitive --concise, search-sensitive 完整 JSON, merge-ids 输出（需 --word）');
  }

  // 去重
  identifiers = [...new Set(identifiers)];

  return { searchWord, identifiers, sourceInfo };
}

// ── 大小写模式提取 ───────────────────────────────────────────────────

/**
 * 从标识符列表中提取搜索词的全部大小写变体及出现次数。
 * （与 server.mjs 逻辑一致）
 */
function extractPatterns(identifiers, searchWord) {
  const lower = searchWord.toLowerCase();
  const patterns = new Map();
  for (const id of identifiers) {
    const regex = new RegExp(lower, 'gi');
    let m;
    while ((m = regex.exec(id)) !== null) {
      const found = m[0];
      patterns.set(found, (patterns.get(found) || 0) + 1);
    }
  }
  return [...patterns.entries()].sort((a, b) => b[1] - a[1]);
}

// ── 大小写分类与替换推导 ────────────────────────────────────────────

/**
 * 将模式分类为 4 种基本大小写类型。
 * 不需要品牌词知识，纯形态分类。
 *
 * 特殊规则：短全大写模式（≤ 3 字符）在代码标识符中通常作为
 * PascalCase 缩写使用（如 "ECDb"、"DB"、"API"），而非 ALL_CAPS。
 * 因此将其归类为 PascalCase 以避免 ECDb → ENTITYCLASSDb 的误映射。
 */
function classifyPatternCase(pattern) {
  if (pattern === pattern.toUpperCase() && pattern.length > 3) return 'ALL_CAPS';
  // 短大写（如 "EC"）→ 当作 PascalCase 缩写
  if (pattern === pattern.toUpperCase() && pattern.length <= 3) return 'PascalCase';
  if (pattern === pattern.toLowerCase()) return 'lowercase';
  if (pattern[0] === pattern[0].toLowerCase()) return 'camelCase';
  return 'PascalCase';
}

/**
 * 根据模式的大小写类型，从基准替换词推导替换结果。
 * 泛化版本：不需要 BRAND_FORMS 查找表。
 */
function deriveReplacement(pattern, baseWord) {
  const targetUpper = baseWord.toUpperCase();
  const targetPascal = baseWord[0].toUpperCase() + baseWord.slice(1);
  const targetCamel = baseWord[0].toLowerCase() + baseWord.slice(1);
  const targetLower = baseWord.toLowerCase();

  const caseType = classifyPatternCase(pattern);
  switch (caseType) {
    case 'ALL_CAPS':   return targetUpper;
    case 'PascalCase': return targetPascal;
    case 'camelCase':  return targetCamel;
    case 'lowercase':  return targetLower;
    default:           return baseWord;
  }
}

// ── 映射表生成 ────────────────────────────────────────────────────────

/**
 * 拆分 camelCase / PascalCase 段（与 search-ec.mjs 一致）。
 */
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
 * 在 token 序列里匹配以 subTokens[i] 结尾的搜索词游程。
 *
 * 命中方式（按优先级）：
 *   1. 直接命中：token 本身等于搜索词（"ECDb" 的 "EC"）
 *   2. 复数命中：token 等于搜索词 + s（"ITWINS"，词长 ≥3 才启用）
 *   3. 拼接命中：往前拼接整 token 后等于搜索词（"Auto"+"PIPE"→AutoPIPE、
 *      "AEC"+"Osim"→AECOsim、"i"+"T"+"Win"→iTWin）
 *   4. 剥字命中：前一个多字符 token 的末字符与后续 token 拼合后等于搜索词
 *      （"myi"+"Twin"→iTwin），仅限混合大小写的品牌形态，避免纯小写子串误伤
 *
 * @returns {{start:number, form:string, plural?:boolean, peel?:boolean} | null}
 */
function matchTokenRun(subTokens, i, lower) {
  const pluralOk = lower.length >= 3;
  const tok = subTokens[i];
  const tokLow = tok.toLowerCase();
  if (tokLow === lower) return { start: i, form: tok };
  if (pluralOk && tokLow === lower + 's') return { start: i, form: tok, plural: true };

  let concat = tok;
  let j = i;
  while (j > 0) {
    const prev = subTokens[j - 1];
    const cand = prev + concat;
    const over = cand.length > lower.length + 1;
    if (prev.length > 1 && over) {
      // 窗口超长且无法穿过多字符 token，只能试剥末字符
      const peeled = prev[prev.length - 1] + concat;
      if (peeled.length <= lower.length + 1) {
        if (peeled.toLowerCase() === lower && classifyPatternCase(peeled) === 'camelCase') {
          return { start: j - 1, form: peeled, peel: true };
        }
        if (pluralOk && peeled.toLowerCase() === lower + 's' && classifyPatternCase(peeled) === 'camelCase') {
          return { start: j - 1, form: peeled, plural: true, peel: true };
        }
      }
      return null;
    }
    if (!over) {
      if (cand.toLowerCase() === lower) return { start: j - 1, form: cand };
      if (pluralOk && cand.toLowerCase() === lower + 's') return { start: j - 1, form: cand, plural: true };
    }
    concat = cand;
    j--;
  }
  return null;
}

/**
 * 融合词子串替换（短词的词卡片上开启 fused 后生效）：
 * 整个字母数字段（分隔符之间的部分）纯大写或纯小写时，把段内出现的搜索词做子串替换。
 *   "DGNPLATFORM" → "BLDPLATFORM"、"dgndb" → "blddb"、"exportdgn" → "exportbld"
 * 混合大小写/含数字的段不碰——随机哈希串（dgndWOriYSm5...）是混合大小写，
 * 天然被排除（camel 拆出的子 token 可能恰好纯小写，所以必须在整段层面判断）。
 * framework/diagram 这类含 ram 的真单词是纯小写，
 * ram/ec 等容易撞英文单词的短词不要开启。
 * @returns {string | null} 替换结果，null 表示不适用
 */
function fusedCompoundReplace(segment, searchWord, patternMap, base, used) {
  if (segment.length <= searchWord.length) return null;
  if (/^[A-Z]+$/.test(segment)) {
    const needle = searchWord.toUpperCase();
    if (!segment.includes(needle)) return null;
    const repl = patternMap[needle] || deriveReplacement(needle, base);
    if (used) used.add(repl);
    return segment.split(needle).join(repl);
  }
  if (/^[a-z]+$/.test(segment)) {
    const needle = searchWord.toLowerCase();
    if (!segment.includes(needle)) return null;
    const repl = patternMap[needle] || deriveReplacement(needle, base);
    if (used) used.add(repl);
    return segment.split(needle).join(repl);
  }
  return null;
}

/**
 * 长词（≥5 字符）直接做区间替换：正则匹配标识符里出现的搜索词（任意大小写形态），
 * 只替换命中区间。长词几乎不可能作为子串藏在无关单词里（itwin/ecschema/bentley），
 * 无需 token 边界保护；ITWINS→SZEWTWINS、ITWINJS→SZEWTWINJS、
 * DGNPLATFORM→BLDPLATFORM 这类复数/融合形态全部自动覆盖。
 */
function spanReplace(id, searchWord, patternMap, base, used) {
  const escaped = searchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  return id.replace(regex, m => {
    const repl = patternMap[m] || deriveReplacement(m, base);
    if (used) used.add(repl);
    return repl;
  });
}

/**
 * 语义分词替换：长词直接区间替换（见 spanReplace），短词守 token 边界。
 *
 * 短词（<5 字符，如 EC/DGN/RAM）必须分词，避免子串误伤：
 *   "Check" → "Check"             ✅ "ec" 不是独立 token，保留
 *   "ECDb" → "EntityClassDb"     ✅ 整体 token 替换
 *
 * 短词的命中方式（详见 matchTokenRun）：
 *   "iTwinDb" → 替换 "i"+"Twin" 拼合形态；"myiTwinApp" 只换 "iTwin" 保留 "my"
 *   "Auto"+"PIPE" 整游程命中；"ITWINS" 复数命中
 *
 * 标识符按非字母数字字符拆段（_ . - / 等都是边界，适配文件名/包名），
 * 段内按 camel 分词做游程匹配，段间分隔符原样保留。
 *
 * @param {string} id - 原始标识符
 * @param {string} searchWord - 搜索词
 * @param {Map<string,string>} patternMap - { "EC": "EntityClass", "iTwin": "szewTwin", ... }
 * @param {string} baseReplacement - 基准替换词（PascalCase）
 * @param {{fused?:boolean}} opts - fused: 短词开启融合词子串替换（词卡片上勾选）
 * @returns {string} 替换后的标识符
 */
function smartReplaceIdentifier(id, searchWord, patternMap, baseReplacement, opts = {}) {
  if (searchWord.length >= 5) {
    return spanReplace(id, searchWord, patternMap, baseReplacement, opts.used);
  }

  const lower = searchWord.toLowerCase();
  const prefix = (id.match(/^[^a-zA-Z0-9]+/) || [''])[0];
  const body = id.substring(prefix.length);

  // 按非字母数字字符拆分，奇数位是分隔符原样保留
  const parts = body.split(/([^a-zA-Z0-9]+)/);
  const out = parts.map((p, idx) => {
    if (idx % 2 === 1) return p;
    if (!p) return '';

    const subTokens = splitCamelCase(p);
    const result = subTokens.map(t => [t]);
    for (let i = 0; i < subTokens.length; i++) {
      if (result[i] === null) continue;  // 已被前面的命中吞并
      const hit = matchTokenRun(subTokens, i, lower);
      if (hit) {
        const { start, form, plural, peel } = hit;
        const repl = plural
          ? (patternMap[form] || deriveReplacement(form.slice(0, -1), baseReplacement)) + form[form.length - 1]
          : patternMap[form] || deriveReplacement(form, baseReplacement);
        if (opts.used) opts.used.add(repl);
        result[start] = peel ? [subTokens[start].slice(0, -1), repl] : [repl];
        for (let k = start + 1; k <= i; k++) result[k] = null;
      }
    }
    // 融合词替换（需开启）：整段纯大写/纯小写时做子串替换（token 游程没命中才轮到它）
    if (opts.fused) {
      const comp = fusedCompoundReplace(p, searchWord, patternMap, baseReplacement, opts.used);
      if (comp !== null) return comp;
    }
    return result.filter(r => r !== null).flat().join('');
  });

  return prefix + out.join('');
}

/**
 * 按搜索词推导形态替换结果（比 deriveReplacement 多一层复数感知）：
 * 模式是搜索词 + s 的复数形态时（ITWINS / iTwins），按单数形态推导后补回 s，
 * 否则 ALL_CAPS 推导会丢掉复数（ITWINS → SZEWTWIN 而非 SZEWTWINS）。
 */
function derivePatternReplacement(pattern, searchWord, baseWord) {
  const lower = searchWord.toLowerCase();
  if (searchWord.length >= 3 && pattern.toLowerCase() === lower + 's') {
    return deriveReplacement(pattern.slice(0, -1), baseWord) + pattern[pattern.length - 1];
  }
  return deriveReplacement(pattern, baseWord);
}

/**
 * 构建某词的 patternMap（形态→替换词）。generateMapping / generateMultiMapping /
 * computePendingReview 共用。
 * @returns {{ patternMap: Record<string,string>, baseWord: string }}
 */
function buildPatternMap(word, config, ids) {
  const baseWord = config.baseName || word;
  const overrides = config.overrides || {};
  const patterns = extractPatterns(ids, word);
  const patternMap = {};
  for (const [pattern] of patterns) {
    const replacement = overrides[pattern] || derivePatternReplacement(pattern, word, baseWord);
    if (replacement && replacement !== pattern) patternMap[pattern] = replacement;
  }
  return { patternMap, baseWord };
}

/**
 * 根据配置生成完整的标识符→替换映射表。
 * @returns {{ mapping: Record<string,string>, stats: { changed, unchanged, total } }}
 */
function generateMapping(config, identifiers, searchWord, excludeList) {
  const baseWord = config.baseName || searchWord;
  const excludeSet = new Set(excludeList || []);

  // 构建 patternMap：{ "EC": "EntityClass", "ec": "entityclass", ... }
  const { patternMap } = buildPatternMap(searchWord, config, identifiers);

  // 没有有效的替换规则 → 返回空映射
  if (Object.keys(patternMap).length === 0) {
    return { mapping: {}, stats: { changed: 0, unchanged: identifiers.length, total: identifiers.length } };
  }

  const mapping = {};
  let changed = 0, unchanged = 0;

  for (const id of identifiers) {
    if (excludeSet.has(id)) {
      unchanged++;
      continue;
    }

    const result = smartReplaceIdentifier(id, searchWord, patternMap, baseWord, { fused: !!config.fused });

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

/**
 * 多词模式：按词序逐个执行语义替换（前一个词的结果作为后一个词的输入），
 * 生成合并映射表。noModify 的词跳过。
 * 人工确认的融合 token 规则（manualTokens）在词链之后套用：
 * camel token 精确命中、大小写形态跟随（ECXML→DMXML、ecclassid→dmclassid），
 * 一条 token 规则批量作用于所有含该 token（作为独立分词单元）的标识符。
 * 人工确认映射（manual，按标识符逐条）最后套用，优先级最高。
 * @param {Record<string,{baseName?,overrides?,noModify?,fused?}>} wordConfigs
 * @param {Record<string,string>} manual - 人工确认映射 { 原标识符: 最终替换结果 }
 * @param {Record<string,string>} manualTokens - 人工确认的融合 token 规则 { token: 替换词 }
 * @returns {{ mapping: Record<string,string>, stats: { changed, unchanged, total } }}
 */
function generateMultiMapping(wordConfigs, identifiers, excludeList, manual, manualTokens) {
  const excludeSet = new Set(excludeList || []);
  let current = [...identifiers];

  // ── 已产出替换结果的保护 ─────────────────────────────────────────
  // 多词是链式应用：后面的词会作用在前一个词的输出上。例如 bentley 把
  // "beNTlEY" 换成 "szewEC"，随后的 EC 词（短词走 camel token）会把其中的
  // "EC" 再改成 "DM"，得到 "szewDM" —— 这就是 name-mapping.json 里
  // "beNTlEY": "szewDM" 这类脏数据的来源。
  // 这里把每一步实际产出的替换串用带边界的占位符藏起来，后续词规则看不到，
  // 全部跑完后再还原。只保护"产出串"本身，相邻的原始文本照常参与后续规则。
  const hiddenText = new Map();   // 占位符 → 原文
  let hiddenSeq = 0;
  const hideProduced = (s, produced) => {
    if (produced.length === 0) return s;
    let out = s;
    for (const p of produced) {
      if (!p || p.length < 2 || !out.includes(p)) continue;
      const ph = '\u0001Qz' + (hiddenSeq++) + 'Qz\u0001';
      hiddenText.set(ph, p);
      out = out.split(p).join(ph);
    }
    return out;
  };
  const restoreHidden = (s) => {
    if (hiddenText.size === 0 || s.indexOf('\u0001') === -1) return s;
    let out = s;
    for (const [ph, txt] of hiddenText) {
      if (out.includes(ph)) out = out.split(ph).join(txt);
    }
    return out;
  };

  const produced = [];  // 前面词已经产生过的替换串（不能被后续词再改写）
  // 长词先执行：避免 EC 先吃掉 ECSchema、dgn 先吃掉 dgnplatform 这类子串冲突
  const entries = Object.entries(wordConfigs).sort((a, b) => b[0].length - a[0].length);
  for (const [word, config] of entries) {
    if (!config || config.noModify) continue;
    const stage = produced.length === 0
      ? current
      : current.map(id => excludeSet.has(id) ? id : hideProduced(id, produced));
    const { patternMap, baseWord } = buildPatternMap(word, config, stage);
    if (Object.keys(patternMap).length === 0) { current = stage; continue; }
    const used = new Set();
    current = stage.map(id => excludeSet.has(id) ? id : smartReplaceIdentifier(id, word, patternMap, baseWord, { fused: !!config.fused, used }));
    for (const repl of used) if (repl && repl.length >= 2) produced.push(repl);
  }

  // 融合 token 规则按长度分两档（与"长词直替、短词守边界"的总体哲学一致）：
  //   长规则（≥5 字符，如 ecinstanceid）——子串替换（大小写不敏感、形态跟随，
  //     长规则先应用）：足够长不会藏进无关英文词，能覆盖 sourceecinstanceid
  //     这种 ec 不是独立分词单元的全小写融合名
  //   短规则（<5 字符，如 ecc/ecs/ECN）——只做 camel token 精确命中：
  //     按子串会误伤 specs/ECCENTRIC/rebeccapurple/VECN 这类含同子串的英文词
  const tokenEntries = Object.entries(manualTokens || {}).filter(([, repl]) => repl && repl.trim() !== '');
  if (tokenEntries.length > 0) {
    const caseForm = (repl, t) =>
      t === t.toUpperCase() ? repl.toUpperCase()
      : t === t.toLowerCase() ? repl.toLowerCase()
      : repl[0].toUpperCase() + repl.slice(1);
    const longRules = tokenEntries
      .filter(([tok]) => tok.length >= 5)
      .sort((a, b) => b[0].length - a[0].length)
      .map(([tok, repl]) => ({ re: new RegExp(tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), repl }));
    const shortMap = new Map(tokenEntries.filter(([tok]) => tok.length < 5).map(([tok, repl]) => [tok.toLowerCase(), repl]));
    current = current.map(id => {
      if (excludeSet.has(id)) return id;
      let out = id;
      for (const { re, repl } of longRules) {
        out = out.replace(re, m => caseForm(repl, m));
      }
      if (shortMap.size > 0) {
        const prefix = (out.match(/^[^a-zA-Z0-9]+/) || [''])[0];
        const parts = out.slice(prefix.length).split(/([^a-zA-Z0-9]+)/);
        out = prefix + parts.map((p, idx) => {
          if (idx % 2 === 1 || !p) return p;
          const mapped = splitCamelCase(p).map(t => {
            const repl = shortMap.get(t.toLowerCase());
            return repl === undefined ? t : caseForm(repl, t);
          });
          return mapped.join('');
        }).join('');
      }
      return out;
    });
  }

  // 还原被保护的替换串（所有词规则/manualTokens 都已跑完）
  current = current.map(restoreHidden);

  const mapping = {};
  let changed = 0;
  identifiers.forEach((orig, i) => {
    if (excludeSet.has(orig)) return;
    let final = current[i];
    if (manual && manual[orig] && manual[orig] !== orig) final = manual[orig];  // 人工确认的替换优先
    if (final !== orig) {
      mapping[orig] = final;
      changed++;
    }
  });

  const sorted = {};
  Object.keys(mapping).sort().forEach(k => { sorted[k] = mapping[k]; });
  return { mapping: sorted, stats: { changed, unchanged: identifiers.length - changed, total: identifiers.length } };
}

/**
 * 从"同前缀长词"反推短词在复合词里的替换约定（多数票）。
 *
 * 独立 token 和复合前缀的映射可能不同：用户配置 EC→db（独立）但
 * ecschema→dmschema、ecdb→dmdb（复合里 ec→dm）。融合 token（ecclassid）
 * 属于复合语境，建议词应反推复合约定：长词 = 词+后缀 且基准词 = 候选+同后缀
 * 时，候选投一票（dm: dmschema/dmdb，Db: DbSql）→ dm 胜出。
 * @returns {string | null} 复合前缀替换约定，无法反推时 null
 */
function inferCompoundPrefix(word, wordConfigs) {
  const wl = word.toLowerCase();
  const votes = new Map();
  for (const [w2, cfg2] of Object.entries(wordConfigs)) {
    if (!cfg2 || cfg2.noModify || w2.length <= word.length) continue;
    const w2l = w2.toLowerCase();
    if (!w2l.startsWith(wl)) continue;
    const suffix = w2l.slice(wl.length);              // "ecschema" = "ec" + "schema"
    const b2 = cfg2.baseName || w2;
    if (!b2.toLowerCase().endsWith(suffix)) continue;  // 基准词保留同样的后缀
    const cand = b2.slice(0, b2.length - suffix.length);
    if (!cand || cand.toLowerCase() === wl) continue;
    votes.set(cand, (votes.get(cand) || 0) + 1);
  }
  if (votes.size === 0) return null;
  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * 待人工确认清单：程序无法自行判断的**融合缩写**，按 token 归组。
 *
 * 判定：标识符里存在这样的 camel token —— 纯大写/纯小写、以短词开头、比词长
 * （ECXML/ecclassid 对 EC、DGNPLATFORM 对 dgn），即"缩写+后缀融合"形态。
 * 程序无法确定这是品牌缩写（需要替换）还是别的东西，所以交人工批量勾选——
 * 决策单位是 token 而不是标识符：ecclassid 一勾，17 个标识符一起处理。
 * 以下都是"程序能识别的"，一律不列出：
 *   - 英文单词：EC 不在词首的（select/DECLARE），以及以词开头的真单词
 *     （echo/ecosystem 对 ec——用 english-words.txt 判定）
 *   - 随机哈希串（isLikelyRandomString，混合大小写天然受保护）
 *   - token 已被链上规则消化（ecschema 文件名已被 ecschema 长词替换）
 *   - 已确认替换的 token（_manualTokens，应用后最终结果不再残留，自然离开清单）
 *   - 长词（≥5 字符）始终区间替换，含即被替，没有盲区
 *
 * 已忽略的 token（_manualSkip）仍然返回给前端，由前端按 skipState 隐藏；
 * 这样点"撤销忽略"时才有原始 token 信息可以重新显示。
 * @param {Record<string,string>} finalMapping - 全链规则（含 token 规则）的映射结果
 * @returns {Record<string, Array<{token:string, count:number, suggestion:string, samples:{id:string,auto:string}[]}>>}
 */
function computePendingReview(wordConfigs, identifiers, excludeList, finalMapping) {
  const excludeSet = new Set(excludeList || []);
  const byWord = {};
  // token 只归最长前缀词的组：ecdbf 归 ecdb 组（建议 dmdbf），不再重复出现在 EC 组（建议 dbdbf 是错的）
  const wordEntries = Object.entries(wordConfigs)
    .filter(([word, config]) => word.length < 5 && config && !config.noModify)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [word, config] of wordEntries) {
    const { patternMap, baseWord } = buildPatternMap(word, config, identifiers);
    if (Object.keys(patternMap).length === 0) continue;
    const upper = word.toUpperCase();
    const lower = word.toLowerCase();
    const groups = new Map();  // token → Set<id>
    for (const id of identifiers) {
      if (excludeSet.has(id) || isLikelyRandomString(id)) continue;
      if (!id.toLowerCase().includes(lower)) continue;
      const final = (finalMapping && finalMapping[id]) || id;
      for (const seg of id.replace(/^[$_]+/, '').split(/[^a-zA-Z0-9]+/)) {
        for (const t of splitCamelCase(seg)) {
          if (t.length <= word.length) continue;
          const isUpperSeg = /^[A-Z]+$/.test(t);
          if (!isUpperSeg && !/^[a-z]+$/.test(t)) continue;      // 混合大小写（哈希子串）
          if (!(isUpperSeg ? t.startsWith(upper) : t.startsWith(lower))) continue;  // 词不在开头
          if (isEnglishExplainable(t, word)) continue;           // echo/ecosystem 这类真英文
          if (!final.toLowerCase().includes(t.toLowerCase())) continue;  // 已被链上/token 规则消化
          if (!groups.has(t)) groups.set(t, new Set());
          groups.get(t).add(id);
        }
      }
    }
    const list = [];
    // 复合约定优先（EC→db 独立 / ecschema→dmschema 反推复合里 ec→dm），反推不出再用基准词
    const compound = inferCompoundPrefix(word, wordConfigs) || baseWord;
    for (const [token, idSet] of groups) {
      const ids = [...idSet].sort();
      // 建议替换词：token 内的词换成复合约定（大小写形态跟随）
      const suggestion = /^[A-Z]+$/.test(token)
        ? token.replace(upper, compound.toUpperCase())
        : token.replace(lower, compound.toLowerCase());
      list.push({
        token,
        count: ids.length,
        suggestion,
        samples: ids.slice(0, 3).map(x => ({ id: x, auto: (finalMapping && finalMapping[x]) || x })),
      });
    }
    list.sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));
    if (list.length > 0) byWord[word] = list;
  }
  // 短词组过滤掉已被更长词组认领的 token（EC 组里的 ecdbf 已归 ecdb 组）
  for (const [word, list] of Object.entries(byWord)) {
    const filtered = list.filter(it => {
      // 该 token 若以更长词的前缀形态被认领过则剔除：直接检查其它组是否含此 token
      for (const [w2, list2] of Object.entries(byWord)) {
        if (w2 !== word && w2.length > word.length && list2.some(it2 => it2.token === it.token)) return false;
      }
      return true;
    });
    if (filtered.length > 0) byWord[word] = filtered;
    else delete byWord[word];
  }
  return byWord;
}

// ── 英文字典 + 随机串识别（融合词候选过滤）──────────────────────────

// 排除 echo/ecosystem 这类同样以短词开头的真英文单词——它们是"程序能识别的"，
// 不该进人工确认清单。词典缺失时退化为仅形态规则（多几条英文候选，无功能影响）。
let englishWordsCache = null;
function loadEnglishWords() {
  if (englishWordsCache) return englishWordsCache;
  try {
    englishWordsCache = new Set(
      readFileSync(join(__dirname, 'english-words.txt'), 'utf8').split('\n').filter(Boolean)
    );
  } catch { englishWordsCache = new Set(); }
  return englishWordsCache;
}

// englishPrefixCache: 词 → 字典里以该词开头的更长单词（echo/ecosystem 对 ec）
const englishPrefixCache = new Map();
function isEnglishExplainable(token, word) {
  const t = token.toLowerCase();
  const wl = word.toLowerCase();
  let prefixes = englishPrefixCache.get(wl);
  if (prefixes === undefined) {
    prefixes = [];
    for (const w of loadEnglishWords()) {
      if (w.length > wl.length && w.startsWith(wl)) prefixes.push(w);
    }
    englishPrefixCache.set(wl, prefixes);
  }
  return prefixes.some(p => t.startsWith(p));
}

// 随机字符串（git SHA / base64 hash）识别，与 search-ec.mjs 一致，
// 额外补一条：≥24 字符无分隔符 + 大小写混杂 + 含数字（如 dgndWOriYSm5... 这类 32 位 base64 串）
function isLikelyRandomString(id) {
  const len = id.length;
  if (len >= 32 && /^[0-9a-fA-F]+$/.test(id)) return true;  // 纯十六进制 ≥32
  if (len >= 24 && !/[_./-]/.test(id) && /[a-z]/.test(id) && /[A-Z]/.test(id) && /\d/.test(id)) return true;
  if (len > 40 && !id.includes('_')) {                       // 超长无下划线 + 高大写占比
    let upper = 0;
    for (const ch of id) if (ch >= 'A' && ch <= 'Z') upper++;
    if ((upper / len) > 0.25) return true;
  }
  return false;
}

// ── Web UI HTML 模板 ──────────────────────────────────────────────────

/**
 * 生成完整的 HTML 页面。模板变量通过 ${} 内联。
 */
function buildHtml(session) {
  const { mode, searchWord, identifiers, patterns, words, sourceInfo, saved, pendingReview, manual, manualTokens, manualSkip } = session;
  const totalIds = identifiers.length;
  const sampleIds = identifiers.slice(0, 12);

  // 嵌入页面的数据（服务端渲染，减少 AJAX 请求）
  const pageData = {
    mode,
    searchWord: mode === 'single' ? searchWord : null,
    totalIds,
    sampleIds,
    patterns: mode === 'single' ? patterns : null,
    words: mode === 'multi' ? words : null,
    sourceInfo,
    saved: mode === 'single' ? (saved || null) : null,
    pendingReview: mode === 'multi' ? (pendingReview || {}) : null,  // 融合 token 盲区 { 词: [{token, count, suggestion, samples}] }
    manual: mode === 'multi' ? (manual || {}) : null,                // 已保存的人工映射 { id: 新名 }
    manualTokens: mode === 'multi' ? (manualTokens || {}) : null,    // 已确认的 token 替换规则 { token: 新名 }
    manualSkip: mode === 'multi' ? (manualSkip || []) : null,        // 已忽略的 token
  };

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>替换配置: ${searchWord}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f5f5f5; color: #333; }
.header { background: #1a1a2e; color: #fff; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; }
.header h1 { font-size: 20px; font-weight: 600; }
.header .stats { font-size: 13px; color: #8892b0; }
.no-modify-toggle { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #ccc; cursor: pointer; user-select: none; transition: color .2s; }
.no-modify-toggle input { width: 16px; height: 16px; cursor: pointer; accent-color: #e03131; }
.no-modify-toggle.active { color: #e03131; font-weight: 600; }
body.no-modify .word-card { opacity: .7; }
body.no-modify input:not(#noModifyCheck) { pointer-events: none; background: #f5f5f5; color: #999; border-style: dashed; }
.main { max-width: 900px; margin: 24px auto; padding: 0 16px; display: flex; flex-direction: column; gap: 20px; }
.word-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); overflow: visible; }
.tip-toggle { position: relative; }
.tip-toggle::after {
  content: attr(data-tip);
  position: absolute; top: calc(100% + 8px); right: 0;
  width: 320px; padding: 10px 12px;
  background: #1a1a2e; color: #dfe3ee;
  font-size: 12px; font-weight: 400; line-height: 1.65; text-align: left;
  border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,.3);
  white-space: normal; z-index: 50; pointer-events: none;
  opacity: 0; visibility: hidden; transition: opacity .15s ease;
}
.tip-toggle:hover::after { opacity: 1; visibility: visible; }
.word-header { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
.word-header h2 { font-size: 16px; font-weight: 600; }
.word-header .badge { font-size: 12px; color: #666; background: #f0f0f0; padding: 3px 10px; border-radius: 12px; }
.word-header .word-tools { display: flex; align-items: center; gap: 10px; }
.word-header .word-tools .no-modify-toggle { font-size: 13px; }
.del-word { width: 22px; height: 22px; border-radius: 50%; border: none; background: #ffc9c9; color: #c92a2a; font-size: 13px; cursor: pointer; line-height: 1; padding: 0; }
.del-word:hover { background: #ffa8a8; }
.word-card.no-modify-word { opacity: .7; }
.word-card.no-modify-word input:not(.tool-check) { pointer-events: none; background: #f5f5f5; color: #999; border-style: dashed; }
.add-word-card { border: 2px dashed #ddd; background: #fafafa; box-shadow: none; }
.add-word-card .word-body { display: flex; gap: 10px; }
.add-word-card input { flex: 1; padding: 8px 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; font-family: 'SF Mono','Cascadia Code','Consolas',monospace; }
.add-word-card input:focus { outline: none; border-color: #22863a; }
.add-word-btn { padding: 8px 20px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; background: #22863a; color: #fff; transition: background .2s; }
.add-word-btn:hover { background: #1c7430; }
.word-body { padding: 20px 24px; }
.base-input-row { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px dashed #eee; }
.base-input-row label { font-weight: 600; font-size: 14px; white-space: nowrap; min-width: 140px; }
.base-input-row input { flex: 1; padding: 8px 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 15px; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; transition: border-color .2s; }
.base-input-row input:focus { outline: none; border-color: #4a6cf7; }
.base-input-row .derived-preview { font-size: 12px; color: #888; white-space: nowrap; }
.pattern-list { display: flex; flex-wrap: wrap; gap: 10px; }
.pattern-item { display: flex; align-items: center; gap: 8px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 8px 14px; font-size: 13px; }
.pattern-item .orig { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; color: #c7254e; background: #fdf2f5; padding: 2px 6px; border-radius: 3px; min-width: 60px; text-align: center; }
.pattern-item .arrow { color: #888; }
.pattern-item .repl { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; color: #22863a; background: #f0fff4; padding: 2px 6px; border-radius: 3px; min-width: 60px; text-align: center; font-weight: 600; }
.pattern-item .count { font-size: 11px; color: #999; }
.pattern-item input.override { width: 120px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
.pattern-item input.override:focus { outline: none; border-color: #e67700; }
.pattern-item.overridden { border-color: #e67700; background: #fff9f0; }
.pattern-empty { font-size: 13px; color: #999; padding: 12px 0; }
.actions { display: flex; gap: 12px; justify-content: center; padding: 8px 0 32px; }
.actions button { padding: 12px 32px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-save { background: #4a6cf7; color: #fff; }
.btn-save:hover { background: #3b5de7; }
.btn-save:disabled { background: #adb5bd; cursor: not-allowed; }
.btn-reset { background: #fff; color: #666; border: 2px solid #ddd !important; }
.btn-reset:hover { background: #f8f9fa; }
.btn-preview { background: #fff; color: #4a6cf7; border: 2px solid #4a6cf7 !important; }
.btn-preview:hover { background: #eef1ff; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal { background: #fff; border-radius: 12px; width: 90vw; max-width: 1000px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
.modal-header { padding: 20px 28px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { font-size: 18px; font-weight: 600; }
.modal-header .close-btn { width: 32px; height: 32px; border: none; background: #f0f0f0; border-radius: 50%; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; }
.modal-header .close-btn:hover { background: #e0e0e0; }
.modal-toolbar { padding: 12px 28px; border-bottom: 1px solid #f0f0f0; display: flex; gap: 10px; align-items: center; }
.modal-toolbar .search { flex: 1; min-width: 180px; padding: 6px 14px; border: 1px solid #ddd; border-radius: 16px; font-size: 13px; outline: none; }
.modal-toolbar .search:focus { border-color: #4a6cf7; }
.modal-toolbar .stats-text { font-size: 13px; color: #888; white-space: nowrap; }
.modal-toolbar .btn-mini { padding: 5px 14px; border: 1px solid #ddd; border-radius: 14px; background: #fff; color: #666; font-size: 12px; cursor: pointer; white-space: nowrap; }
.modal-toolbar .btn-mini:hover { border-color: #4a6cf7; color: #4a6cf7; }
.tag { display: inline-block; font-size: 11px; background: #fdf2f5; color: #c7254e; padding: 2px 8px; border-radius: 10px; margin-left: 6px; white-space: nowrap; }
.tag-excluded { background: #ffe3e3; color: #c92a2a; }
.tag-none { background: #f8f9fa; color: #999; }
.pending-hint { font-size: 13px; color: #888; margin-bottom: 12px; line-height: 1.6; }
.pending-search { width: 100%; padding: 8px 14px; border: 1px solid #ddd; border-radius: 16px; font-size: 13px; outline: none; margin-bottom: 14px; }
.pending-search:focus { border-color: #4a6cf7; }
.pending-group { font-size: 13px; font-weight: 600; color: #c7254e; margin: 12px 0 4px; }
.pending-row { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-bottom: 1px solid #f4f4f4; font-size: 13px; flex-wrap: wrap; }
.pending-row:hover { background: #fafbff; }
.pending-row .old { font-family: 'SF Mono','Cascadia Code','Consolas',monospace; color: #c7254e; word-break: break-all; }
.pending-row .auto { font-family: 'SF Mono','Cascadia Code','Consolas',monospace; color: #22863a; word-break: break-all; }
.pending-row input[type="checkbox"] { width: 15px; height: 15px; cursor: pointer; accent-color: #4a6cf7; flex-shrink: 0; }
.pending-row.checked { background: #f0fff4; }
.pending-input { flex: 1; min-width: 160px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
.pending-input:focus { outline: none; border-color: #22863a; }
.pending-more { margin: 8px 0; padding: 4px 14px; border: 1px solid #ddd; border-radius: 14px; background: #fff; color: #666; font-size: 12px; cursor: pointer; }
.pending-more:hover { border-color: #4a6cf7; color: #4a6cf7; }
.manual-entry { display: flex; align-items: center; gap: 8px; padding: 5px 8px; background: #f0fff4; border: 1px solid #b2f2bb; border-radius: 6px; font-size: 13px; margin-bottom: 6px; flex-wrap: wrap; }
.manual-entry .old { font-family: 'SF Mono','Cascadia Code','Consolas',monospace; color: #c7254e; word-break: break-all; }
.manual-entry .auto { font-family: 'SF Mono','Cascadia Code','Consolas',monospace; color: #22863a; word-break: break-all; font-weight: 600; }
.skip-chip { display: inline-flex; align-items: center; gap: 6px; background: #f1f3f5; border: 1px solid #dee2e6; border-radius: 16px; padding: 4px 10px; font-size: 12px; font-family: 'SF Mono','Cascadia Code','Consolas',monospace; color: #868e96; margin: 0 6px 6px 0; }
.skip-chip .del { width: 16px; height: 16px; border-radius: 50%; border: none; background: #ced4da; color: #495057; font-size: 11px; cursor: pointer; line-height: 1; padding: 0; }
.skip-chip .del:hover { background: #adb5bd; }
.pending-row .samples { font-size: 11px; color: #adb5bd; word-break: break-all; flex-basis: 100%; padding-left: 23px; }
.pending-group .pending-more { margin-left: 8px; }
.pending-actions { margin: 2px 0 10px; }
.batch-skip { padding: 5px 14px; border: 1px solid #ffc9c9; border-radius: 14px; background: #fff5f5; color: #e03131; font-size: 12px; cursor: pointer; }
.batch-skip:hover { background: #ffe3e3; border-color: #ff8787; }
.btn-skip { padding: 2px 10px; border: 1px solid #dee2e6; border-radius: 12px; background: #fff; color: #868e96; font-size: 11px; cursor: pointer; white-space: nowrap; }
.btn-skip:hover { border-color: #fa5252; color: #fa5252; }
.modal-body { flex: 1; overflow-y: auto; padding: 6px 0; }
.transform-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.transform-table th { position: sticky; top: 0; background: #fafafa; padding: 10px 16px; text-align: left; font-weight: 600; color: #666; border-bottom: 2px solid #eee; z-index: 1; }
.transform-table td { padding: 6px 16px; border-bottom: 1px solid #f4f4f4; }
.transform-table .old { font-family: 'SF Mono','Cascadia Code','Consolas',monospace; color: #c7254e; }
.transform-table .arrow { color: #aaa; padding: 0 8px; }
.transform-table .new { font-family: 'SF Mono','Cascadia Code','Consolas',monospace; color: #22863a; font-weight: 600; }
.transform-table tr:hover td { background: #fafbff; }
.toast { position: fixed; top: 20px; right: 20px; padding: 14px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; z-index: 999; animation: slideIn .3s ease; }
.toast.success { background: #d3f9d8; color: #2b8a3e; border: 1px solid #b2f2bb; }
.toast.error { background: #ffe3e3; color: #c92a2a; border: 1px solid #ffc9c9; }
@keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.preview-section { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); overflow: hidden; }
.preview-header { padding: 14px 24px; border-bottom: 1px solid #eee; font-size: 16px; font-weight: 600; }
.preview-body { padding: 16px 24px; display: flex; flex-wrap: wrap; gap: 8px; }
.preview-item { font-size: 12px; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; background: #f8f9fa; border-radius: 4px; padding: 4px 10px; display: flex; gap: 6px; }
.preview-item .from { color: #c7254e; }
.preview-item .to { color: #22863a; }
.exclude-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); overflow: hidden; }
.exclude-header { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
.exclude-header h2 { font-size: 16px; font-weight: 600; }
.exclude-header .badge { font-size: 12px; color: #e03131; background: #fff0f0; padding: 3px 10px; border-radius: 12px; }
.exclude-body { padding: 16px 24px; }
.exclude-input-row { display: flex; gap: 10px; margin-bottom: 14px; }
.exclude-input-row input { flex: 1; padding: 8px 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 14px; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; transition: border-color .2s; }
.exclude-input-row input:focus { outline: none; border-color: #e03131; }
.exclude-input-row button { padding: 8px 20px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; background: #e03131; color: #fff; transition: background .2s; }
.exclude-input-row button:hover { background: #c92a2a; }
.exclude-tags { display: flex; flex-wrap: wrap; gap: 8px; min-height: 32px; }
.exclude-tag { display: flex; align-items: center; gap: 6px; background: #ffe3e3; border: 1px solid #ffc9c9; border-radius: 16px; padding: 5px 10px 5px 14px; font-size: 13px; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; color: #c92a2a; }
.exclude-tag .del { width: 18px; height: 18px; border-radius: 50%; border: none; background: #e03131; color: #fff; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0; }
.exclude-tag .del:hover { background: #c92a2a; }
.exclude-empty { font-size: 13px; color: #999; }
.info-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); overflow: hidden; }
.info-body { padding: 14px 24px; font-size: 13px; color: #666; display: flex; gap: 24px; flex-wrap: wrap; }
.info-body span { white-space: nowrap; }
</style>
</head>
<body>
<div class="header">
  <h1>${mode === 'multi' ? '替换配置（多词）' : `替换配置: ${searchWord}`}</h1>
  <span class="stats">${mode === 'multi' ? `${words.length} 个词 | ` : ''}共 ${totalIds} 个标识符 | ${sourceInfo.searchDir || '未知目录'}</span>
  ${mode === 'single' ? `
  <div style="display:flex;align-items:center;gap:18px">
    <label class="no-modify-toggle tip-toggle" data-tip="开启后，整段纯大写/纯小写的标识符做子串替换：DGNPLATFORM→BLDPLATFORM、dgndb→blddb、exportdgn→exportbld；混合大小写的段（如随机哈希串）不受影响。⚠ framework、diagram 这类英文单词是纯小写且含 ram——ec、ram 等容易撞英文单词的短词请勿开启。长词（≥5 字符）始终直接替换，无需开启。"><input type="checkbox" id="fusedCheck" onchange="onFusedToggle()"> 融合词替换</label>
    <label class="no-modify-toggle"><input type="checkbox" id="noModifyCheck" onchange="onNoModifyToggle()"> 不修改（仅查看）</label>
  </div>` : ''}
</div>
<div class="main" id="app"></div>
<div class="exclude-card">
  <div class="exclude-header"><h2>排除列表（不替换的关键词）</h2><span class="badge" id="excludeBadge">0 个</span></div>
  <div class="exclude-body">
    <div class="exclude-input-row">
      <input id="excludeInput" placeholder="输入要排除的关键词（精确匹配，区分大小写）" onkeydown="if(event.key==='Enter')addExclude()">
      <button onclick="addExclude()">添加</button>
    </div>
    <div class="exclude-tags" id="excludeTags"><span class="exclude-empty">暂无排除项</span></div>
  </div>
</div>
<div class="actions">
  <button class="btn-reset" onclick="resetAll()">恢复初始值</button>
  <button class="btn-preview" onclick="showPreview()">预览变更</button>
  <button class="btn-save" id="saveBtn" onclick="save()">保存并更新映射表</button>
</div>

<script>
const PAGE_DATA = ${JSON.stringify(pageData)};
const MODE = PAGE_DATA.mode;                            // 'single' | 'multi'
const ALL_IDS_FULL = ${JSON.stringify(identifiers)};    // 完整列表用于生成映射
const SAMPLE_IDS = PAGE_DATA.sampleIds;
const SEARCH_WORD = PAGE_DATA.searchWord || (PAGE_DATA.words && PAGE_DATA.words[0] ? PAGE_DATA.words[0].word : '');
const SAVED = PAGE_DATA.saved || {};                    // 单词模式：上次保存的配置

// ── 词状态（单词模式也走同一结构，统一逻辑）──
// WORD_STATE: word → { patterns: [[形态, 数量], ...], noModify: bool }
// WORD_SAVED: word → 上次保存的配置 { baseName, overrides } | {}
const WORD_STATE = {};
const WORD_SAVED = {};
const KEY_TO_WORD = {};
{
  const initWords = MODE === 'multi'
    ? (PAGE_DATA.words || [])
    : [{ word: SEARCH_WORD, patterns: PAGE_DATA.patterns || [], saved: SAVED }];
  for (const w of initWords) {
    if (!w.word) continue;
    WORD_STATE[w.word] = { patterns: w.patterns || [], noModify: !!(w.saved && w.saved.noModify), fused: !!(w.saved && w.saved.fused) };
    WORD_SAVED[w.word] = w.saved || {};
    // 配置里已保存、但当前输入文件里没出现的形态也要渲染出来（计数 0）。
    // 否则保存时只遍历当前 patterns，会把之前会话里配好的 overrides 静默删掉。
    const savedOvr = WORD_SAVED[w.word].overrides || {};
    const seenPatterns = new Set(WORD_STATE[w.word].patterns.map(([p]) => p));
    for (const p of Object.keys(savedOvr)) {
      if (!seenPatterns.has(p) && savedOvr[p]) {
        WORD_STATE[w.word].patterns.push([p, 0]);
        seenPatterns.add(p);
      }
    }
    KEY_TO_WORD[encodeKey(w.word)] = w.word;
  }
}

// ── 待人工确认（融合 token）状态 ──
// PENDING: { 词: [{token, count, suggestion, samples}] }，决策单位是 token：
// 勾选 ecclassid 一条，全部含该 token 的标识符一起处理。建议替换词预填（词→基准词）
// manualTokenState: { token: 替换词 }，勾选即加入，保存时随配置写入 _manualTokens
// skipState: Set<token>，忽略的 token 不再出现在待确认列表（写入 _manualSkip）
const PENDING = PAGE_DATA.pendingReview || {};
const TOKEN_INFO = {};          // token → {token, count, suggestion, samples}
const PENDING_KEY_TO_TOKEN = {};
let manualState = { ...(PAGE_DATA.manual || {}) };
let manualTokenState = { ...(PAGE_DATA.manualTokens || {}) };
let skipState = new Set(PAGE_DATA.manualSkip || []);
// 忽略优先：配置里同一 token 若同时存在确认规则和忽略记录，以忽略为准
for (const tok of skipState) delete manualTokenState[tok];
let pendingExpanded = {};   // 词 → 是否已展开全部（默认每组只显示前 50 个 token）
for (const items of Object.values(PENDING)) {
  for (const it of items) {
    TOKEN_INFO[it.token] = it;
    PENDING_KEY_TO_TOKEN[encodeKey(it.token)] = it.token;
  }
}
// 已确认/已忽略的 token 可能不再是候选（规则已生效），但仍需可寻址（用于删除/撤销忽略）
for (const tok of [...Object.keys(manualTokenState), ...skipState]) {
  if (!PENDING_KEY_TO_TOKEN[encodeKey(tok)]) PENDING_KEY_TO_TOKEN[encodeKey(tok)] = tok;
}
// 按标识符的人工映射（_manual），仅用于删除时寻址
const MANUAL_KEY_TO_ID = {};
for (const id of Object.keys(manualState)) MANUAL_KEY_TO_ID[encodeKey(id)] = id;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Case classification (must match server-side) ─────────────────

function classifyPatternCase(pattern) {
  // 与服务端一致：短全大写（≤3 字符）按 PascalCase 缩写处理，避免 ECDb → XXXDb 变成 XXXXXXDb
  if (pattern === pattern.toUpperCase() && pattern.length > 3) return 'ALL_CAPS';
  if (pattern === pattern.toUpperCase() && pattern.length <= 3) return 'PascalCase';
  if (pattern === pattern.toLowerCase()) return 'lowercase';
  if (pattern[0] === pattern[0].toLowerCase()) return 'camelCase';
  return 'PascalCase';
}

function deriveReplacement(pattern, baseWord) {
  const targetUpper = baseWord.toUpperCase();
  const targetPascal = baseWord[0].toUpperCase() + baseWord.slice(1);
  const targetCamel = baseWord[0].toLowerCase() + baseWord.slice(1);
  const targetLower = baseWord.toLowerCase();

  const caseType = classifyPatternCase(pattern);
  switch (caseType) {
    case 'ALL_CAPS':   return targetUpper;
    case 'PascalCase': return targetPascal;
    case 'camelCase':  return targetCamel;
    case 'lowercase':  return targetLower;
    default:           return baseWord;
  }
}

// 复数形态按单数推导后补回 s（与服务端 derivePatternReplacement 一致）
function deriveForWord(pattern, word, base) {
  const lower = word.toLowerCase();
  if (word.length >= 3 && pattern.toLowerCase() === lower + 's') {
    return deriveReplacement(pattern.slice(0, -1), base) + pattern[pattern.length - 1];
  }
  return deriveReplacement(pattern, base);
}

// ── UI state ────────────────────────────────────────────────────

let noModify = false;

function onNoModifyToggle() {
  noModify = document.getElementById('noModifyCheck').checked;
  document.getElementById('noModifyCheck').parentElement.classList.toggle('active', noModify);
  document.body.classList.toggle('no-modify', noModify);
  render();
}

function encodeKey(pattern) {
  return pattern.replace(/[^a-zA-Z0-9]/g, '_');
}

function render() {
  const app = document.getElementById('app');
  let html = '';

  // ── 添加搜索词（多词模式）──
  if (MODE === 'multi') {
    html += '<div class="word-card add-word-card">';
    html += '<div class="word-header"><h2>添加搜索词</h2></div>';
    html += '<div class="word-body">';
    html += '<input id="newWordInput" placeholder="输入搜索词，如 itwin" onkeydown="if(event.key===\\'Enter\\')addWord()">';
    html += '<button class="add-word-btn" onclick="addWord()">添加</button>';
    html += '</div></div>';
  }

  for (const word of Object.keys(WORD_STATE)) {
    const wk = encodeKey(word);
    const st = WORD_STATE[word];
    const saved = WORD_SAVED[word] || {};
    const nm = st.noModify;
    const baseVal = document.getElementById('base_' + wk)?.value || saved.baseName || word;

    html += '<div class="word-card' + (nm ? ' no-modify-word' : '') + '" id="wcard_' + wk + '">';
    html += '<div class="word-header"><h2>' + word + '</h2>';
    html += '<span class="badge">' + (MODE === 'multi' ? countWordIds(word) : PAGE_DATA.totalIds) + ' 个标识符</span>';
    if (MODE === 'multi') {
      html += '<span class="word-tools">' +
        '<label class="no-modify-toggle tip-toggle" data-tip="开启后，整段纯大写/纯小写的标识符做子串替换：DGNPLATFORM→BLDPLATFORM、dgndb→blddb、exportdgn→exportbld；混合大小写的段（如随机哈希串）不受影响。⚠ framework、diagram 这类英文单词是纯小写且含 ram——ec、ram 等容易撞英文单词的短词请勿开启。长词（≥5 字符）始终直接替换，无需开启。"><input type="checkbox"' + (st.fused ? ' checked' : '') + ' onchange="onWordFused(\\'' + wk + '\\')"> 融合词替换</label>' +
        '<label class="no-modify-toggle"><input type="checkbox" class="tool-check"' + (nm ? ' checked' : '') + ' onchange="onWordNoModify(\\'' + wk + '\\')"> 不修改</label>' +
        '<button class="del-word" onclick="removeWord(\\'' + wk + '\\')" title="移除该词（保存后从配置中删除）">×</button>' +
        '</span>';
    }
    html += '</div>';
    html += '<div class="word-body">';

    // Base input
    html += '<div class="base-input-row">';
    html += '<label>基准替换词 (PascalCase)</label>';
    html += '<input id="base_' + wk + '" value="' + baseVal + '" oninput="onBaseChange(\\'' + wk + '\\')" placeholder="例如: EntityClass"' + (nm ? ' disabled' : '') + '>';
    html += '<span class="derived-preview" id="derivedPreview_' + wk + '"></span>';
    html += '</div>';

    // Pattern list
    html += '<div class="pattern-list">';
    if (st.patterns.length === 0) {
      html += '<span class="pattern-empty">未提取到大小写模式</span>';
    }
    for (const [pattern, count] of st.patterns) {
      const pk = encodeKey(pattern);
      const derived = deriveForWord(pattern, word, baseVal);
      const savedOvr = saved.overrides ? (saved.overrides[pattern] || '') : '';
      const ovrVal = document.getElementById('ovr_' + wk + '_' + pk)?.value || savedOvr;
      const hasOverride = ovrVal !== '' && ovrVal !== derived;
      html += '<div class="pattern-item' + (hasOverride ? ' overridden' : '') + '" id="item_' + wk + '_' + pk + '">';
      html += '<span class="orig">' + pattern + '</span>';
      html += '<span class="count">(' + count + ')</span>';
      html += '<span class="arrow">→</span>';
      html += '<span class="repl" id="repl_' + wk + '_' + pk + '">' + (ovrVal || derived) + '</span>';
      html += '<input class="override" id="ovr_' + wk + '_' + pk + '" value="' + ovrVal + '" placeholder="自定义" oninput="onOverride(\\'' + wk + '\\', \\'' + pk + '\\')"' + (nm ? ' disabled' : '') + '>';
      html += '</div>';
    }
    html += '</div></div></div>';
  }

  // ── 待人工确认（融合 token，批量决策）──
  // 忽略的 token 立即从列表隐藏（和服务端刷新后的过滤规则保持一致）
  const visiblePending = {};
  for (const [w, items] of Object.entries(PENDING)) {
    const visible = items.filter(it => !skipState.has(it.token));
    if (visible.length > 0) visiblePending[w] = visible;
  }
  const pendingWords = Object.keys(visiblePending);
  let tokenTotal = 0;
  for (const w of pendingWords) tokenTotal += visiblePending[w].length;
  const savedTokenEntries = Object.entries(manualTokenState);
  const skipArr = [...skipState].sort();
  const manualEntries = Object.entries(manualState);
  if (pendingWords.length > 0 || manualEntries.length > 0 || savedTokenEntries.length > 0 || skipArr.length > 0) {
    html += '<div class="word-card" id="pendingCard">';
    html += '<div class="word-header"><h2>待人工确认（融合缩写）</h2><span class="badge">' + tokenTotal + ' 个 token</span></div>';
    html += '<div class="word-body">';
    html += '<div class="pending-hint">规则替换后仍残留的融合缩写 token（纯大写/纯小写、以短词开头，如 ECXML、ecclassid——程序无法自行判断是否为品牌缩写）。<b>按 token 批量确认</b>：一行 = 一条替换规则，长 token（≥5 字符）按子串生效、短 token 只匹配独立分词单元（不误伤 specs/ECCENTRIC 这类含同子串的英文词）；建议替换词已预填，可直接编辑。不需要替换的 token 点"忽略"。英文单词和随机哈希已自动排除。</div>';
    if (tokenTotal > 0) {
      html += '<div class="pending-actions"><button class="batch-skip" title="忽略当前全部待确认 token，之后可在「已忽略」区域逐个或全部撤销" onclick="skipAllPending()">全部忽略（' + tokenTotal + ' 个 token）</button></div>';
    }
    if (manualEntries.length > 0) {
      html += '<div class="pending-group">已确认的人工替换（按标识符，' + manualEntries.length + ' 条）</div>';
      for (const [id, val] of manualEntries) {
        html += '<div class="manual-entry"><span class="old">' + esc(id) + '</span><span class="arrow">→</span><span class="auto">' + esc(val) + '</span><button class="del-word" title="删除该人工映射" onclick="removeManual(\\'' + encodeKey(id) + '\\')">×</button></div>';
      }
    }
    if (savedTokenEntries.length > 0) {
      html += '<div class="pending-group">已确认的 token 替换（' + savedTokenEntries.length + ' 条）<button class="pending-more" onclick="clearAllTokens()">全部取消</button></div>';
      for (const [tok, repl] of savedTokenEntries) {
        html += '<div class="manual-entry"><span class="old">' + esc(tok) + '</span><span class="arrow">→</span><span class="auto">' + esc(repl) + '</span><button class="del-word" title="删除该 token 规则" onclick="removeToken(\\'' + encodeKey(tok) + '\\')">×</button></div>';
      }
    }
    if (skipArr.length > 0) {
      html += '<div class="pending-group">已忽略的 token（' + skipArr.length + ' 个，点 × 撤销）' +
        '<button class="pending-more" onclick="unskipAllTokens()">全部撤销</button></div>';
      for (const tok of skipArr) {
        html += '<span class="skip-chip">' + esc(tok) + '<button class="del" title="撤销忽略，回到待确认列表" onclick="unskipToken(\\'' + encodeKey(tok) + '\\')">×</button></span>';
      }
    }
    if (pendingWords.length > 0) {
      html += '<input class="pending-search" placeholder="搜索 token / 样本标识符..." oninput="onPendingSearch(this.value)">';
      for (const word of pendingWords) {
        const items = visiblePending[word];
        const checkedCount = items.filter(it => Object.prototype.hasOwnProperty.call(manualTokenState, it.token)).length;
        html += '<div class="pending-group">含 ' + esc(word) + '（' + items.length + ' 个 token' + (checkedCount > 0 ? '，已选 ' + checkedCount : '') + '）' +
          '<button class="pending-more" onclick="checkAllTokens(\\'' + encodeKey(word) + '\\')">全选</button>' +
          '<button class="pending-more" onclick="uncheckAllTokens(\\'' + encodeKey(word) + '\\')">清空</button>' +
          '<button class="pending-more" onclick="skipAllTokens(\\'' + encodeKey(word) + '\\')">全部忽略</button></div>';
        const shown = pendingExpanded[word] ? items : items.slice(0, 50);
        for (const it of shown) {
          const checked = Object.prototype.hasOwnProperty.call(manualTokenState, it.token);
          html += '<div class="pending-row' + (checked ? ' checked' : '') + '">';
          html += '<input type="checkbox"' + (checked ? ' checked' : '') + ' onchange="onTokenToggle(\\'' + encodeKey(it.token) + '\\')">';
          html += '<span class="old">' + esc(it.token) + '</span>';
          html += '<span class="tag">' + it.count + ' 处</span>';
          html += '<span class="arrow">→</span>';
          if (checked) {
            html += '<input class="pending-input" value="' + esc(manualTokenState[it.token]) + '" oninput="onTokenInput(\\'' + encodeKey(it.token) + '\\', this.value)">';
          } else {
            html += '<span class="auto">' + esc(it.suggestion) + '</span>';
          }
          html += '<button class="btn-skip" title="忽略该 token，不再出现在待确认列表" onclick="skipToken(\\'' + encodeKey(it.token) + '\\')">忽略</button>';
          const sampleText = it.samples.map(s => esc(s.id) + (s.auto && s.auto !== s.id ? ' → ' + esc(s.auto) : '')).join('；');
          html += '<span class="samples">' + sampleText + '</span>';
          html += '</div>';
        }
        if (!pendingExpanded[word] && items.length > 50) {
          html += '<button class="pending-more" onclick="expandPending(\\'' + encodeKey(word) + '\\')">显示全部 ' + items.length + ' 个</button>';
        }
      }
    }
    html += '</div></div>';
  }

  // ── Preview section ──
  html += '<div class="preview-section">';
  html += '<div class="preview-header">转换预览</div>';
  html += '<div class="preview-body" id="previewSamples"></div>';
  html += '</div>';

  app.innerHTML = html;
  for (const word of Object.keys(WORD_STATE)) onBaseChange(encodeKey(word));
  updatePreviewSamples();
}

function onBaseChange(wk) {
  const word = KEY_TO_WORD[wk] || SEARCH_WORD;
  const input = document.getElementById('base_' + wk);
  const base = input?.value || word;
  const upper = base.toUpperCase();
  const lower = base.toLowerCase();
  const pascal = base[0].toUpperCase() + base.slice(1);
  const camel = base[0].toLowerCase() + base.slice(1);
  const preview = document.getElementById('derivedPreview_' + wk);
  if (preview) {
    preview.textContent = '自动: ' + pascal + ' / ' + camel + ' / ' + lower + ' / ' + upper;
  }

  for (const [pattern] of WORD_STATE[word].patterns) {
    const pk = encodeKey(pattern);
    const replEl = document.getElementById('repl_' + wk + '_' + pk);
    const ovrEl = document.getElementById('ovr_' + wk + '_' + pk);
    if (replEl && (!ovrEl || ovrEl.value === '')) {
      replEl.textContent = deriveForWord(pattern, word, base);
    }
  }
  updatePreviewSamples();
}

function onOverride(wk, pk) {
  const word = KEY_TO_WORD[wk];
  const ovrEl = document.getElementById('ovr_' + wk + '_' + pk);
  const replEl = document.getElementById('repl_' + wk + '_' + pk);
  const itemEl = document.getElementById('item_' + wk + '_' + pk);
  const baseInput = document.getElementById('base_' + wk);
  const pattern = patternFromKey(word, pk);
  const base = baseInput?.value || word;
  const derived = deriveForWord(pattern, word, base);
  const val = ovrEl.value;
  if (val !== '' && val !== derived) {
    replEl.textContent = val;
    itemEl.classList.add('overridden');
  } else {
    replEl.textContent = derived;
    itemEl.classList.remove('overridden');
    if (val === derived) ovrEl.value = '';
  }
  updatePreviewSamples();
}

// ── 多词管理 ──────────────────────────────────────────────────────

function patternFromKey(word, pk) {
  for (const [p] of WORD_STATE[word].patterns) {
    if (encodeKey(p) === pk) return p;
  }
  return pk;
}

function countWordIds(word) {
  const lower = word.toLowerCase();
  let n = 0;
  for (const id of ALL_IDS_FULL) {
    if (id.toLowerCase().includes(lower)) n++;
  }
  return n;
}

// 客户端版 extractPatterns（与服务端逻辑一致），用于界面添加的新词
function extractPatternsClient(word) {
  const lower = word.toLowerCase();
  const patterns = new Map();
  for (const id of ALL_IDS_FULL) {
    const regex = new RegExp(lower, 'gi');
    let m;
    while ((m = regex.exec(id)) !== null) {
      patterns.set(m[0], (patterns.get(m[0]) || 0) + 1);
    }
  }
  return [...patterns.entries()].sort((a, b) => b[1] - a[1]);
}

function addWord() {
  const input = document.getElementById('newWordInput');
  const w = (input?.value || '').trim();
  if (!w) return;
  if (WORD_STATE[w]) { showToast('该词已在列表中', 'error'); return; }
  WORD_STATE[w] = { patterns: extractPatternsClient(w), noModify: false, fused: false };
  WORD_SAVED[w] = {};
  KEY_TO_WORD[encodeKey(w)] = w;
  input.value = '';
  render();
  if (WORD_STATE[w].patterns.length === 0) {
    showToast('已添加 ' + w + '（标识符列表中未找到该词）', 'error');
  } else {
    showToast('已添加 ' + w, 'success');
  }
}

function removeWord(wk) {
  const word = KEY_TO_WORD[wk];
  delete WORD_STATE[word];
  delete WORD_SAVED[word];
  delete KEY_TO_WORD[wk];
  render();
}

function onWordNoModify(wk) {
  const word = KEY_TO_WORD[wk];
  WORD_STATE[word].noModify = !WORD_STATE[word].noModify;
  render();
}

function onWordFused(wk) {
  const word = KEY_TO_WORD[wk];
  WORD_STATE[word].fused = !WORD_STATE[word].fused;
  render();
}

// ── 待人工确认（token 批量）─────────────────────────────────────────

// 勾选 = 加入 token 规则（预填建议替换词）；取消勾选 = 移除
function onTokenToggle(tk) {
  const tok = PENDING_KEY_TO_TOKEN[tk];
  if (!tok) return;
  if (Object.prototype.hasOwnProperty.call(manualTokenState, tok)) delete manualTokenState[tok];
  else manualTokenState[tok] = TOKEN_INFO[tok] ? TOKEN_INFO[tok].suggestion : tok;
  render();
}

// 编辑替换词（不重渲染，保持输入焦点）
function onTokenInput(tk, val) {
  const tok = PENDING_KEY_TO_TOKEN[tk];
  if (!tok) return;
  manualTokenState[tok] = val;
}

function removeToken(tk) {
  const tok = PENDING_KEY_TO_TOKEN[tk];
  if (!tok) return;
  delete manualTokenState[tok];
  render();
}

// 忽略：从待确认列表移除并持久化（_manualSkip），撤销后回到列表
function skipToken(tk) {
  const tok = PENDING_KEY_TO_TOKEN[tk];
  if (!tok) return;
  delete manualTokenState[tok];
  skipState.add(tok);
  render();
}

function unskipToken(tk) {
  const tok = PENDING_KEY_TO_TOKEN[tk];
  if (!tok) return;
  skipState.delete(tok);
  render();
}

// 忽略一个组里的全部待确认 token（已忽略的跳过，可整组撤销后恢复）
function skipAllTokens(wk) {
  let n = 0;
  for (const [word, items] of Object.entries(PENDING)) {
    if (encodeKey(word) !== wk) continue;
    for (const it of items) {
      if (skipState.has(it.token)) continue;
      delete manualTokenState[it.token];
      skipState.add(it.token);
      n++;
    }
  }
  render();
  if (n > 0) showToast('已忽略 ' + n + ' 个 token', 'success');
}

// 忽略全部待确认 token（不影响已确认的替换）
function skipAllPending() {
  let n = 0;
  for (const items of Object.values(PENDING)) {
    for (const it of items) {
      if (skipState.has(it.token)) continue;
      delete manualTokenState[it.token];
      skipState.add(it.token);
      n++;
    }
  }
  render();
  if (n > 0) showToast('已忽略全部 ' + n + ' 个 token', 'success');
}

// 撤销全部忽略，回到待确认列表
function unskipAllTokens() {
  if (skipState.size === 0) return;
  const n = skipState.size;
  skipState.clear();
  render();
  showToast('已撤销 ' + n + ' 个忽略', 'success');
}

// 整组全选（预填建议，已编辑过的保留）/ 清空
function checkAllTokens(wk) {
  for (const [word, items] of Object.entries(PENDING)) {
    if (encodeKey(word) !== wk) continue;
    for (const it of items) {
      if (skipState.has(it.token)) continue;
      if (!Object.prototype.hasOwnProperty.call(manualTokenState, it.token)) manualTokenState[it.token] = it.suggestion;
    }
  }
  render();
}

function uncheckAllTokens(wk) {
  for (const [word, items] of Object.entries(PENDING)) {
    if (encodeKey(word) !== wk) continue;
    for (const it of items) delete manualTokenState[it.token];
  }
  render();
}

function clearAllTokens() {
  manualTokenState = {};
  render();
}

function removeManual(ik) {
  const id = MANUAL_KEY_TO_ID[ik];
  if (!id) return;
  delete manualState[id];
  render();
}

function expandPending(wk) {
  for (const word of Object.keys(PENDING)) {
    if (encodeKey(word) === wk) pendingExpanded[word] = true;
  }
  render();
}

function onPendingSearch(q) {
  const lower = q.toLowerCase();
  const card = document.getElementById('pendingCard');
  if (!card) return;
  card.querySelectorAll('.pending-row').forEach(r => {
    r.style.display = lower === '' || r.textContent.toLowerCase().includes(lower) ? '' : 'none';
  });
}

function onFusedToggle() {
  WORD_STATE[SEARCH_WORD].fused = !!document.getElementById('fusedCheck').checked;
}

// 转换预览小样例：走服务端 /preview（与保存同一套语义分词引擎），
// 避免前端朴素子串替换给出假阳性（$select → $seldmt 这类）。输入防抖 150ms。
let previewTimer = null;
function updatePreviewSamples() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(async () => {
    const container = document.getElementById('previewSamples');
    if (!container) return;
    const hint = (msg) => { container.innerHTML = '<span style="color:#888;font-size:13px">' + msg + '</span>'; };
    if (noModify) { hint('(不修改模式 — 无变更)'); return; }
    try {
      const config = MODE === 'multi' ? getMultiConfig() : getConfig();
      const resp = await fetch('/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const result = await resp.json();
      if (!result.success) throw new Error(result.error);
      // 优先显示前几个样本标识符的变更，样本都没变时取映射开头
      let entries = SAMPLE_IDS.filter(id => result.mapping[id]).map(id => [id, result.mapping[id]]);
      if (entries.length === 0) {
        const all = Object.entries(result.mapping);
        if (all.length === 0) { hint('(无变更 — 请设置基准替换词)'); return; }
        entries = all.slice(0, 12);
      }
      container.innerHTML = entries.map(([from, to]) =>
        '<div class="preview-item"><span class="from">' + esc(from) + '</span><span>→</span><span class="to">' + esc(to) + '</span></div>'
      ).join('');
    } catch (e) {
      hint('预览失败: ' + esc(e.message));
    }
  }, 150);
}

function getWordConfig(word) {
  const wk = encodeKey(word);
  const baseInput = document.getElementById('base_' + wk);
  const config = {
    baseName: baseInput?.value || word,
    overrides: {},
    fused: !!WORD_STATE[word].fused
  };
  for (const [pattern] of WORD_STATE[word].patterns) {
    const pk = encodeKey(pattern);
    const ovrEl = document.getElementById('ovr_' + wk + '_' + pk);
    if (ovrEl && ovrEl.value !== '') {
      config.overrides[pattern] = ovrEl.value;
    }
  }
  return config;
}

// 单词模式：扁平配置（兼容原保存接口）
function getConfig() {
  return getWordConfig(Object.keys(WORD_STATE)[0]);
}

// 多词模式：{ multiWord: true, words: { 词: 配置 }, manual: { 原标识符: 最终结果 },
//            manualTokens: { token: 替换词 }, manualSkip: [token] }
function getMultiConfig() {
  const words = {};
  for (const word of Object.keys(WORD_STATE)) {
    words[word] = WORD_STATE[word].noModify ? { noModify: true } : getWordConfig(word);
  }
  return {
    multiWord: true,
    words,
    manual: { ...manualState },
    manualTokens: { ...manualTokenState },
    manualSkip: [...skipState],
  };
}

// ── Save ─────────────────────────────────────────────────────────

async function save() {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = '保存中...';
  try {
    const config = MODE === 'multi' ? getMultiConfig() : (noModify ? { noModify: true } : getConfig());
    const resp = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const result = await resp.json();
    if (result.success) {
      showToast('已保存！映射 ' + result.changed + ' 个，未变 ' + result.unchanged + ' 个', 'success');
      if (result.unchangedIds && result.unchangedIds.length > 0) {
        showUnchanged(result.unchangedIds);
      }
    } else {
      showToast('保存失败: ' + result.error, 'error');
    }
  } catch (e) {
    showToast('请求失败: ' + e.message, 'error');
  }
  btn.disabled = false;
  btn.textContent = '保存并更新映射表';
}

function resetAll() {
  for (const word of Object.keys(WORD_STATE)) {
    const wk = encodeKey(word);
    const baseInput = document.getElementById('base_' + wk);
    if (baseInput) baseInput.value = word;
    for (const [pattern] of WORD_STATE[word].patterns) {
      const ovrEl = document.getElementById('ovr_' + wk + '_' + encodeKey(pattern));
      if (ovrEl) ovrEl.value = '';
    }
  }
  render();
}

// ── Preview modal ────────────────────────────────────────────────

async function showPreview() {
  if (noModify) { showToast('不修改模式下无变更', 'error'); return; }
  if (Object.keys(WORD_STATE).length === 0) { showToast('请先添加搜索词', 'error'); return; }

  // 使用服务端语义替换（避免子串误伤）
  const config = MODE === 'multi' ? getMultiConfig() : getConfig();
  let mapping, stats;
  try {
    const resp = await fetch('/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const result = await resp.json();
    if (!result.success) throw new Error(result.error);
    mapping = result.mapping;
    stats = result.stats;
    lastUnchangedIds = result.unchangedIds || [];
  } catch (e) {
    showToast('预览失败: ' + e.message, 'error');
    return;
  }

  let rows = '';
  const sorted = Object.entries(mapping).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [oldId, newId] of sorted) {
    rows += '<tr><td class="old">' + oldId + '</td><td class="arrow">→</td><td class="new">' + newId + '</td></tr>';
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'previewModal';
  overlay.innerHTML = '<div class="modal">' +
    '<div class="modal-header">' +
      '<h2>变更预览 — ' + stats.changed + ' / ' + stats.total + ' 项将被替换</h2>' +
      '<button class="close-btn" onclick="closePreview()">×</button>' +
    '</div>' +
    '<div class="modal-toolbar">' +
      '<input class="search" placeholder="搜索..." oninput="searchPreview(this.value)">' +
      '<button class="btn-mini" onclick="showUnchanged(lastUnchangedIds)">未变更 ' + stats.unchanged + ' 条</button>' +
      '<span class="stats-text">共 ' + stats.changed + ' 条变更</span>' +
    '</div>' +
    '<div class="modal-body">' +
      '<table class="transform-table">' +
        '<thead><tr><th>原名称</th><th></th><th>新名称</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>' +
  '</div>';

  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closePreview(); });
}

function closePreview() {
  const modal = document.getElementById('previewModal');
  if (modal) modal.remove();
}

function searchPreview(q) {
  const lower = q.toLowerCase();
  const rows = document.querySelectorAll('.transform-table tbody tr');
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = lower === '' || text.includes(lower) ? '' : 'none';
  });
}

// ── 未变更清单 ──────────────────────────────────────────────────────

let lastUnchangedIds = [];

// 展示未命中任何替换规则的标识符，并标注原因：
// 已排除（在排除列表）/ 含某词但未构成 token 边界 / 不含任何配置词
function showUnchanged(ids) {
  closeUnchanged();
  if (!ids || ids.length === 0) { showToast('没有未变更的标识符', 'success'); return; }
  const words = Object.keys(WORD_STATE).map(w => w.toLowerCase());
  let rows = '';
  for (const id of ids) {
    const idLow = id.toLowerCase();
    const hits = words.filter(w => idLow.includes(w));
    let tags = '';
    if (excludeList.includes(id)) {
      tags += '<span class="tag tag-excluded">已排除</span>';
    }
    if (hits.length > 0) {
      tags += '<span class="tag">含 ' + hits.join(' / ') + '</span>';
    }
    if (!tags) {
      tags = '<span class="tag tag-none">不含配置词</span>';
    }
    rows += '<tr><td class="old">' + id + '</td><td>' + tags + '</td></tr>';
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'unchangedModal';
  overlay.innerHTML = '<div class="modal" style="max-width:800px">' +
    '<div class="modal-header">' +
      '<h2>未变更 — ' + ids.length + ' 条</h2>' +
      '<button class="close-btn" onclick="closeUnchanged()">×</button>' +
    '</div>' +
    '<div class="modal-toolbar">' +
      '<input class="search" placeholder="搜索..." oninput="searchUnchanged(this.value)">' +
      '<span class="stats-text">未命中任何替换规则的标识符</span>' +
    '</div>' +
    '<div class="modal-body">' +
      '<table class="transform-table">' +
        '<thead><tr><th>标识符</th><th>原因</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>' +
  '</div>';

  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) closeUnchanged(); });
}

function closeUnchanged() {
  const modal = document.getElementById('unchangedModal');
  if (modal) modal.remove();
}

function searchUnchanged(q) {
  const lower = q.toLowerCase();
  const modal = document.getElementById('unchangedModal');
  if (!modal) return;
  modal.querySelectorAll('.transform-table tbody tr').forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = lower === '' || text.includes(lower) ? '' : 'none';
  });
}

// ── Toast ────────────────────────────────────────────────────────

function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Exclude list ─────────────────────────────────────────────────

let excludeList = [];

async function loadExcludeList() {
  try {
    const resp = await fetch('/exclude');
    excludeList = await resp.json();
  } catch { excludeList = []; }
  renderExcludeTags();
}

function renderExcludeTags() {
  const container = document.getElementById('excludeTags');
  const badge = document.getElementById('excludeBadge');
  if (excludeList.length === 0) {
    container.innerHTML = '<span class="exclude-empty">暂无排除项</span>';
    badge.textContent = '0 个';
    return;
  }
  badge.textContent = excludeList.length + ' 个';
  container.innerHTML = excludeList.map((w, i) =>
    '<span class="exclude-tag">' + w + '<button class="del" onclick="removeExclude(' + i + ')">×</button></span>'
  ).join('');
}

function addExclude() {
  const input = document.getElementById('excludeInput');
  const word = input.value.trim();
  if (!word) return;
  if (excludeList.includes(word)) { input.value = ''; return; }
  excludeList.push(word);
  excludeList.sort();
  input.value = '';
  renderExcludeTags();
  saveExclude();
}

function removeExclude(index) {
  excludeList.splice(index, 1);
  renderExcludeTags();
  saveExclude();
}

async function saveExclude() {
  try {
    await fetch('/save-exclude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(excludeList)
    });
  } catch {}
}

// ── Init ─────────────────────────────────────────────────────────

loadExcludeList();
render();

// 恢复"不修改"勾选状态
if (SAVED.noModify) {
  const cb = document.getElementById('noModifyCheck');
  if (cb) { cb.checked = true; onNoModifyToggle(); }
}
// 恢复"融合词替换"勾选状态（单词模式）
if (WORD_STATE[SEARCH_WORD] && WORD_STATE[SEARCH_WORD].fused) {
  const fc = document.getElementById('fusedCheck');
  if (fc) fc.checked = true;
}
</script>
</body>
</html>`;
}

// ── HTTP Server ──────────────────────────────────────────────────────

function createApp(session, paths) {
  const { mode, identifiers } = session;
  const searchWord = mode === 'single' ? session.searchWord : null;

  // 每次页面请求都重读配置并重建页面 —— 外部修改/重新添加配置词后刷新浏览器即可生效
  const buildPage = () => {
    if (mode === 'multi') {
      const baseWords = session.wordSource === 'config' ? [] : session.words;
      const words = refreshWords(baseWords, identifiers, paths);
      const savedAll = readConfigFile(paths.config);
      const manual = savedAll._manual || {};
      const manualTokens = savedAll._manualTokens || {};
      const manualSkip = savedAll._manualSkip || [];
      // 已保存配置的词才有规则；用完整链（含 token 规则）算出各标识符的现状
      const wordConfigs = {};
      for (const w of words) {
        if (w.saved && !w.saved.noModify) wordConfigs[w.word] = w.saved;
      }
      const exclude = readExclude();
      const { mapping } = generateMultiMapping(wordConfigs, identifiers, exclude, manual, manualTokens);
      const pendingReview = computePendingReview(wordConfigs, identifiers, exclude, mapping);
      return buildHtml({ ...session, words, pendingReview, manual, manualTokens, manualSkip });
    }
    return buildHtml({ ...session, saved: loadSavedConfig(paths, searchWord) });
  };

  const readExclude = () => {
    try { return JSON.parse(readFileSync(paths.exclude, 'utf-8')); } catch { return []; }
  };

  return createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(buildPage());

    } else if (req.method === 'GET' && req.url === '/exclude') {
      try {
        const list = JSON.parse(readFileSync(excludePath, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(list));
      } catch {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify([]));
      }

    } else if (req.method === 'POST' && req.url === '/save-exclude') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const list = JSON.parse(body);
          if (!Array.isArray(list)) throw new Error('Expected an array');
          writeFileSync(excludePath, JSON.stringify(list, null, 2), 'utf-8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, count: list.length }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });

    } else if (req.method === 'POST' && req.url === '/preview') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const config = JSON.parse(body);
          let mapping, stats;
          if (config.multiWord) {
            ({ mapping, stats } = generateMultiMapping(config.words || {}, identifiers, readExclude(), config.manual || {}, config.manualTokens || {}));
          } else if (config.noModify) {
            mapping = {};
            stats = { changed: 0, unchanged: identifiers.length, total: identifiers.length };
          } else {
            ({ mapping, stats } = generateMapping(config, identifiers, searchWord, readExclude()));
          }
          const unchangedIds = identifiers.filter(id => mapping[id] === undefined);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, mapping, stats, unchangedIds }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });

    } else if (req.method === 'POST' && req.url === '/save') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const config = JSON.parse(body);
          let result, finalMapping = {};
          if (config.multiWord) {
            // 多词：配置文件整体重写为界面当前词列表（移除的词即删除），生成逐词串联的合并映射。
            // 人工确认结果存入保留字：_manual（按标识符）、_manualTokens（按 token）、_manualSkip（忽略）
            const words = config.words || {};
            const manual = config.manual || {};
            const manualTokens = config.manualTokens || {};
            const manualSkip = config.manualSkip || [];
            const merged = { ...words };
            if (Object.keys(manual).length > 0) merged._manual = manual;
            if (Object.keys(manualTokens).length > 0) merged._manualTokens = manualTokens;
            if (manualSkip.length > 0) merged._manualSkip = manualSkip;
            writeFileSync(paths.config, JSON.stringify(merged, null, 2), 'utf-8');
            const { mapping, stats } = generateMultiMapping(words, identifiers, readExclude(), manual, manualTokens);
            writeFileSync(paths.mapping, JSON.stringify(mapping, null, 2), 'utf-8');
            finalMapping = mapping;
            result = stats;
          } else {
            // 单词：按词合并进共享配置，下次启动自动恢复
            const allConfigs = readConfigFile(paths.config);
            allConfigs[searchWord] = config;
            writeFileSync(paths.config, JSON.stringify(allConfigs, null, 2), 'utf-8');

            if (config.noModify) {
              writeFileSync(paths.mapping, JSON.stringify({}, null, 2), 'utf-8');
              result = { changed: 0, unchanged: identifiers.length, total: identifiers.length };
            } else {
              const { mapping, stats } = generateMapping(config, identifiers, searchWord, readExclude());
              writeFileSync(paths.mapping, JSON.stringify(mapping, null, 2), 'utf-8');
              finalMapping = mapping;
              result = stats;
            }
          }
          const unchangedIds = identifiers.filter(id => finalMapping[id] === undefined);
          const payload = { ...result, unchangedIds };
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, ...payload }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });

    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}

// ── 主函数 ────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.input) {
    console.log(`通用替换词配置服务器 — 读取搜索输出文件，配置替换映射

用法: node name-replacer/replace-server.mjs --input <file> [options]

选项:
  -i, --input <path>     搜索输出 JSON 文件（必填）
  -w, --word <name>      指定配置哪个搜索词（多词文件时使用）
  -p, --port <n>         HTTP 端口（默认 3457）
  -o, --output <path>    映射表输出路径（默认从输入文件名推导）
  --config <path>        UI 配置保存路径（默认 name-replacer/replace-server-config.json）

输入文件格式:
  A. search-ec --concise:     { searchWord, identifiers: [...] }
  B. search-sensitive --concise: { words, identifiers: { word: [...] } }
     （旧版输出缺顶层 words 也支持，词列表从 identifiers 的键推导）
  C. search-sensitive 完整:   { words, identifiers: [...] }
  D. merge-ids 输出:          { identifiers: [...] }（不含搜索词）

模式:
  单词模式 — 文件只含一个词，或用 --word 指定：界面只显示该词的卡片
  多词模式 — 多键 concise / full / merge-ids 输入且不带 --word：
             按已保存配置显示全部词的卡片（merge-ids 输入的词来自配置文件），
             界面可继续添加/移除词；保存时整体更新配置并生成逐词串联的合并映射表

示例:
  # 基本用法（单词模式）
  node name-replacer/replace-server.mjs --input ec-result.json

  # 指定端口
  node name-replacer/replace-server.mjs -i ec-result.json -p 3458

  # 多词文件中聚焦单个词（单词模式）
  node name-replacer/replace-server.mjs -i dgn-result.json -w "DgnDb"

  # 多词模式：一次配置全部已保存的词，可继续添加新词
  node name-replacer/replace-server.mjs -i all-ids.json

输出:
  {Word}-mapping.json  — 扁平映射表 { "oldId": "newId", ... }（从输入文件名推导）
  replace-server-config.json — UI 配置，按搜索词分组 { "EC": { baseName, overrides } }
                          下次启动自动恢复，无需重新输入

与 apply-replace.mjs 的配合:
  生成的映射表格式与 name-mapping.json 完全兼容，可直接传递给 apply-replace.mjs`);
    process.exit(args.help ? 0 : 1);
  }

  // 推导输出路径
  const paths = deriveOutputPaths(args.input, args.output, args.configPath);

  // 确保 exclude-list.json 存在
  try { readFileSync(paths.exclude); } catch {
    writeFileSync(paths.exclude, '[]', 'utf-8');
  }

  // 解析会话：单词模式或按已保存配置的多词模式
  const session = resolveSession(args, paths);
  session.patterns = session.mode === 'single'
    ? extractPatterns(session.identifiers, session.searchWord)
    : null;

  // 启动信息
  if (session.mode === 'single') {
    console.log(`🔤 搜索词: ${session.searchWord}（单词模式）`);
    console.log(`📊 标识符: ${session.identifiers.length} 个`);
    console.log(`📋 大小写模式: ${session.patterns.length} 种 (${session.patterns.map(([p, c]) => p + '×' + c).join(', ')})`);
    console.log(`📁 配置:   ${paths.config}${session.saved ? ' (已恢复上次配置)' : ' (首次使用，无历史配置)'}`);
  } else {
    const wordList = session.words.map(w => w.word);
    console.log(`🔤 多词模式: ${wordList.length > 0 ? wordList.join(', ') : '(暂无，请在界面添加)'}`);
    console.log(`📊 标识符: ${session.identifiers.length} 个`);
    const restored = session.words.filter(w => w.saved).length;
    console.log(`📋 词卡片: ${session.words.length} 个（${restored} 个已从配置恢复）`);
    console.log(`📁 配置:   ${paths.config}（多词保存时整体更新）`);
  }
  console.log(`📁 输入:   ${args.input}`);
  console.log(`📁 映射表: ${paths.mapping}`);
  console.log(`📁 排除:   ${paths.exclude}`);
  console.log('');

  // 启动服务器
  const app = createApp(session, paths);

  app.listen(args.port, () => {
    console.log(`🌐 配置界面已启动: http://localhost:${args.port}`);
    console.log('   在浏览器中打开上述地址，设置基准替换词后点击保存');
  });

  app.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${args.port} 已被占用，请尝试其他端口: --port ${args.port + 1}`);
      process.exit(1);
    }
    throw e;
  });
}

// ── exports ───────────────────────────────────────────────────────────

export {
  parseArgs,
  detectInputShape,
  parseInputFile,
  extractPatterns,
  classifyPatternCase,
  deriveReplacement,
  derivePatternReplacement,
  fusedCompoundReplace,
  buildPatternMap,
  generateMapping,
  generateMultiMapping,
  computePendingReview,
  deriveOutputPaths,
  splitCamelCase,
  smartReplaceIdentifier,
  resolveSession,
};

// ── CLI 入口 ───────────────────────────────────────────────────────────

const isMain = process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/');
if (isMain) {
  main();
}
