#!/usr/bin/env node
/**
 * ── 映射表合并工具 ──
 *
 * 把多个扁平的 JSON 映射表 `{ "原词": "替换词" }` 合并成一份。
 * 命令行中越靠后的文件优先级越高：同一个原词出现不同替换值时，后传入的覆盖先传入的。
 *
 * 用法:
 *   node name-replacer/merge-mapping.mjs
 *       默认合并 name-replacer/base-mapping.json（缺失时用 name-mapping.json）
 *       + name-replacer/all-ids-mapping.json
 *
 *   node name-replacer/merge-mapping.mjs <file1.json> <file2.json> [...]
 *       按给定顺序合并任意多个文件（不传文件时才使用默认列表）
 *
 *   node name-replacer/merge-mapping.mjs --into <目标.json> <来源1.json> [来源2.json ...]
 *       把一个或多个文件的内容合并进已有目标文件（默认写回目标文件）。
 *       目标是底层，来源在后 → 来源覆盖目标中的同名原词，目标独有的条目保留。
 *
 * 选项:
 *   -o, --output <path>   输出文件（默认：仓库根目录 all-mapping.json；--into 默认目标文件）
 *   --into <path>         合并进已有文件（目标先读入，来源文件覆盖目标）
 *   --no-sort             保持合并时的键顺序（默认按原词排序输出）
 *   --show-conflicts      打印全部冲突明细（默认只打印前 20 条）
 *   -h, --help            显示帮助
 *
 * 示例:
 *   node name-replacer/merge-mapping.mjs
 *   node name-replacer/merge-mapping.mjs name-replacer/base-mapping.json \
 *     name-replacer/all-ids-mapping.json name-replacer/complements-mapping.json \
 *     -o all-mapping.json
 *   node name-replacer/merge-mapping.mjs --into all-mapping.json \
 *     name-replacer/base-mapping.json name-replacer/all-ids-mapping.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join, resolve, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');

// base 在前、all-ids 在后 → all-ids-mapping 中的值覆盖基础映射
// 基础映射优先用 base-mapping.json，没有时回退到 name-mapping.json
const BASE_MAPPING = [
  join(__dirname, 'base-mapping.json'),
  join(__dirname, 'name-mapping.json'),
].find((p) => existsSync(p)) || join(__dirname, 'name-mapping.json');

const DEFAULT_INPUTS = [
  BASE_MAPPING,
  join(__dirname, 'all-ids-mapping.json'),
];
const DEFAULT_OUTPUT = join(REPO_ROOT, 'all-mapping.json');

// ── 参数解析 ────────────────────────────────────────────────────────

function printHelp() {
  console.log(`映射表合并工具 — 把多个 { 原词: 替换词 } JSON 合并成一份

用法:
  node name-replacer/merge-mapping.mjs [file1.json file2.json ...] [选项]
  node name-replacer/merge-mapping.mjs --into <目标.json> <来源1.json> [来源2.json ...]

不传文件时默认合并:
  ${DEFAULT_INPUTS.join('\n  ')}

选项:
  -o, --output <path>   输出路径（默认 ${DEFAULT_OUTPUT}）
  --into <path>         合并进已有目标文件；目标先读入，来源覆盖同名原词，
                        目标独有的条目保留。不传 -o 时直接写回目标文件
  --no-sort             保持合并顺序（默认按原词排序）
  --show-conflicts      打印全部冲突明细（默认只列前 20 条）
  -h, --help            显示本帮助

冲突规则:
  --into 模式下目标是底层、来源文件在后；普通模式下按命令行顺序。
  同一个原词值不同时，后面的替换值覆盖前面的；值相同视为重复项。`);
}

function parseArgs(argv) {
  const inputs = [];
  let output = DEFAULT_OUTPUT;
  let outputExplicit = false;
  let into = null;
  let sort = true;
  let showConflicts = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-o' || arg === '--output') {
      if (!argv[i + 1]) throw new Error(`${arg} 缺少路径参数`);
      output = resolve(process.cwd(), argv[++i]);
      outputExplicit = true;
    } else if (arg === '--into') {
      if (!argv[i + 1]) throw new Error('--into 缺少目标文件参数');
      into = resolve(process.cwd(), argv[++i]);
    } else if (arg === '--no-sort') {
      sort = false;
    } else if (arg === '--show-conflicts') {
      showConflicts = true;
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith('-')) {
      throw new Error(`未知选项: ${arg}（用 --help 查看用法）`);
    } else {
      inputs.push(resolve(process.cwd(), arg));
    }
  }

  if (into) {
    if (inputs.length === 0) {
      throw new Error('--into 需要至少一个要合并进去的来源文件');
    }
    if (!existsSync(into)) {
      throw new Error(`目标文件不存在: ${into}`);
    }
    // 目标先读入作为底层，再按顺序叠加来源文件（来源覆盖目标）
    inputs.unshift(into);
    if (!outputExplicit) output = into;
  } else if (inputs.length === 0) {
    inputs.push(...DEFAULT_INPUTS);
  }

  return { inputs, output, into, sort, showConflicts };
}

// ── 读取与校验 ──────────────────────────────────────────────────────

/**
 * 读取一个扁平映射表。
 * 只接受 { "原词": "替换词" } 这种所有值都是字符串的对象。
 * 搜索工具的 identifiers 输出、数组等一律报错，避免把词表误当映射表。
 */
function readMapping(filePath) {
  let text;
  try {
    text = readFileSync(filePath, 'utf-8');
  } catch (e) {
    throw new Error(`无法读取文件: ${e.message}`);
  }

  // 兼容 Windows 下带 BOM 的 JSON
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`不是合法 JSON: ${e.message}`);
  }

  if (Array.isArray(data) || data === null || typeof data !== 'object') {
    throw new Error('顶层必须是对象 { "原词": "替换词" }，当前不是');
  }

  if ('identifiers' in data) {
    throw new Error('这是搜索/ID 列表文件（含 identifiers 字段），不是映射表；请改用 merge-ids.mjs');
  }

  const entries = Object.entries(data);
  if (entries.length === 0) {
    throw new Error('映射表为空');
  }

  for (const [key, value] of entries) {
    if (typeof value !== 'string') {
      throw new Error(`原词 "${key}" 的替换值不是字符串（${JSON.stringify(value)}）`);
    }
  }

  return data;
}

// ── 合并 ────────────────────────────────────────────────────────────

function mergeMappings(inputs) {
  /** @type {Map<string, string>} */
  const merged = new Map();
  /** 记录每个原词最后一次来自哪个文件 */
  const origin = new Map();
  const conflicts = [];
  const stats = [];

  for (const file of inputs) {
    const mapping = readMapping(file);
    let added = 0;
    let same = 0;
    let overridden = 0;

    for (const [key, value] of Object.entries(mapping)) {
      if (!merged.has(key)) {
        merged.set(key, value);
        origin.set(key, file);
        added++;
        continue;
      }

      const previous = merged.get(key);
      if (previous === value) {
        same++;
        continue;
      }

      conflicts.push({
        key,
        from: previous,
        fromFile: origin.get(key),
        to: value,
        toFile: file,
      });
      merged.set(key, value);
      origin.set(key, file);
      overridden++;
    }

    stats.push({ file, total: Object.keys(mapping).length, added, same, overridden });
  }

  return { entries: [...merged.entries()], conflicts, stats };
}

// ── 输出 ────────────────────────────────────────────────────────────

function relativeForDisplay(filePath) {
  const rel = filePath.startsWith(REPO_ROOT)
    ? filePath.slice(REPO_ROOT.length + 1)
    : filePath;
  return rel || basename(filePath);
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }

  const { inputs, output, into, sort, showConflicts } = options;

  let entries, conflicts, stats;
  try {
    ({ entries, conflicts, stats } = mergeMappings(inputs));
  } catch (e) {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  }

  console.error('📂 输入:');
  for (const s of stats) {
    const parts = [`新增 ${s.added}`];
    if (s.same > 0) parts.push(`重复 ${s.same}`);
    if (s.overridden > 0) parts.push(`覆盖 ${s.overridden}`);
    console.error(`   ${relativeForDisplay(s.file)} — ${s.total} 条（${parts.join('，')}）`);
  }

  if (conflicts.length > 0) {
    console.error(`\n⚠️  冲突 ${conflicts.length} 处（后传入的文件优先）:`);
    const limit = showConflicts ? conflicts.length : Math.min(20, conflicts.length);
    for (let i = 0; i < limit; i++) {
      const c = conflicts[i];
      console.error(
        `   ${c.key}: ${JSON.stringify(c.from)} (${relativeForDisplay(c.fromFile)})` +
          ` → ${JSON.stringify(c.to)} (${relativeForDisplay(c.toFile)})`,
      );
    }
    if (limit < conflicts.length) {
      console.error(`   ... 还有 ${conflicts.length - limit} 处，加 --show-conflicts 查看全部`);
    }
  }

  const sorted = sort ? [...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)) : entries;
  const result = Object.fromEntries(sorted);

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n', 'utf-8');

  if (into && output === into) {
    console.error(`\n✅ 已合并回 ${relativeForDisplay(output)}`);
  } else if (into) {
    console.error(`\n✅ 已合并 ${relativeForDisplay(into)} 的内容并写入 ${relativeForDisplay(output)}`);
  } else {
    console.error(`\n✅ 已写入 ${relativeForDisplay(output)}`);
  }
  console.error(`   合计 ${sorted.length} 条映射`);
}

main();
