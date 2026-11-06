#!/usr/bin/env node
// 仅替换"文件后缀 / 扩展名 / 文件格式字面量"相关的 bim 词族 → dtw 词族（独立工具，不影响主替换流程）。
//
// 背景:
//   name-mapping.json 里的裸词映射 "bim":"dtw" 是无上下文的 \bbim\b 全文替换，
//   中文注释/文档里 "bim模型""bim数据" 这类建筑语义的 bim 也会被误替换
//   (中文字符不属于 \w，\bbim\b 能命中 "bim模" 中的 bim)。
//   因此裸词映射已从 name-mapping.json 移除，主流程只保留 ".bim":".dtw"
//  (点号开头，天然只出现在文件后缀语境)；不带点的裸 bim 由本工具按上下文处理。
//
//   token: bim→dtw  ibim→idtw  bims→dtws
//
//   规则A  后缀      .bim → .dtw   .ibim → .idtw   (任意位置，含注释; foo.bim、'*.ibim')
//   规则B  扩展名表  "bim" → "dtw"                  (extensions/fileTypes 数组里的裸字面量;
//                                                   bim 语义敏感，仅限扩展名表上下文)
//   规则D  字面量    "ibim" → "idtw"  "bims" → "dtws"  (引号包裹、任意位置;
//                                                   这两个词只指文件格式，无建筑语义歧义，
//                                                   覆盖 filters 里的 name: "bims" 显示标签)
//
//   磁盘重命名仅限文件后缀: *.bim→*.dtw、*.ibim→*.idtw。
//   不修改路径: 路径段里的 bim ("D:/bim"、"../../bim/index.dtw")、名为 bim/ibim/bims
//   的目录均保持原样，代码引用与磁盘目录一致。
//   标识符(bimFileName/getBimFiles/ibimFile)、大写 BIM/IBIM/BIMS、bim-scratch 一律不动。
//
// 用法 (建议在主流程 replace-staged 跑完之后运行，两者幂等、先后皆可):
//   node name-replacer/replace-bim.mjs --dry-run --targets name-replacer/targets.json
//   node name-replacer/replace-bim.mjs --dry-run --dir test/src
//   node name-replacer/replace-bim.mjs --targets name-replacer/targets.json --dir other/pkg
//
// 排除规则: 与 search-ec / search-sensitive / apply-replace 一致，统一读
//   name-replacer/scan-exclude.json 的 dirs / exts / files；
//   配置文件缺失时不排除任何目录或扩展名（二进制仍由内容探测兜底跳过）。

import { readFileSync, writeFileSync, readdirSync, renameSync, statSync } from 'fs';
import { join, dirname, relative, basename, extname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadScanFilter } from './scan-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── CLI ─────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');

const targetIdx = process.argv.indexOf('--targets');
const TARGETS_FILE = targetIdx !== -1 ? process.argv[targetIdx + 1] : null;

const dirArgs = [];
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--dir' && process.argv[i + 1]) dirArgs.push(process.argv[i + 1]);
}
if (TARGETS_FILE) {
  let config;
  try {
    config = JSON.parse(readFileSync(TARGETS_FILE, 'utf-8'));
  } catch (e) {
    console.error('读取 targets 文件失败: ' + TARGETS_FILE + ' (' + e.message + ')');
    process.exit(1);
  }
  // 与 replace-staged.mjs 一致：兼容数组和 { registry, stages } 对象格式，
  // dirs + replaceOnly 都处理，路径相对 ROOT
  const entries = Array.isArray(config) ? config : (config.stages || []);
  if (!Array.isArray(entries)) {
    console.error('targets 文件的 stages 必须是数组');
    process.exit(1);
  }
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      console.error('targets 文件的每个批次必须是对象');
      process.exit(1);
    }
    for (const d of [...(entry.dirs || []), ...(entry.replaceOnly || [])]) dirArgs.push(d);
  }
}

if (dirArgs.length === 0) {
  console.log('用法:');
  console.log('  node name-replacer/replace-bim.mjs --dry-run --targets name-replacer/targets.json');
  console.log('  node name-replacer/replace-bim.mjs --dry-run --dir <相对ROOT的目录> [--dir <目录2> ...]');
  console.log('  示例: node name-replacer/replace-bim.mjs --dry-run --dir test/src');
  process.exit(0);
}

const targets = [...new Set(dirArgs.map(d => resolve(ROOT, d)))];
for (const t of targets) {
  if (!statSync(t, { throwIfNoEntry: false })?.isDirectory()) {
    console.error('目标目录不存在: ' + t);
    process.exit(1);
  }
}

// ── 扫描排除配置（与 search-ec / search-sensitive / apply-replace 共用）──
// 默认扫描目标目录下的所有文件夹和所有扩展名；需要排除的目录 / 扩展名 /
// 文件名统一写在 name-replacer/scan-exclude.json，配置文件缺失时不排除任何内容。
const scanFilter = loadScanFilter();

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isBinary(filePath) {
  if (scanFilter.shouldSkipExt(extname(filePath).toLowerCase())) return true;
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

// ── 替换规则 ─────────────────────────────────────────────────────────
const TOKEN_MAP = { bim: 'dtw', ibim: 'idtw', bims: 'dtws' };

// 规则A: 点号后缀 (尾部加 \b，避免 .bimrc 这类误伤；首字符 '.' 非单词字符，无需 \b)
const RULE_A = /\.ibim\b|\.bim\b/g;
const SUFFIX_NAME_RE = /\.ibim\b|\.bim\b/; // 重命名判断用 (非全局，无 lastIndex 状态)

// 规则B: 扩展名数组上下文里的裸 'bim' 字面量 (精确匹配带引号的整个 token)
const EXT_CONTEXT = /\b(fileExtensions|extensions?|fileTypes|allowedExtensions)\s*:\s*\[/;
const RULE_B = /(["'`])bim\1/g;

// 规则D: 引号包裹的 'ibim'/'bims' 字面量，任意位置
const RULE_D = /(["'`])(ibim|bims)\1/g;

function replaceContent(content) {
  const counts = { a: 0, b: 0, d: 0 };
  const lines = content.split('\n');
  let inExt = false; // 跨行的 extensions: [ ... ] 数组

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const ctx = inExt || EXT_CONTEXT.test(line);

    line = line.replace(RULE_A, m => { counts.a++; return m === '.ibim' ? '.idtw' : '.dtw'; });
    if (ctx) {
      line = line.replace(RULE_B, (_, q) => { counts.b++; return q + 'dtw' + q; });
    }
    line = line.replace(RULE_D, (_, q, tok) => { counts.d++; return q + TOKEN_MAP[tok] + q; });

    // 数组状态延续: 上下文本行未闭合则延续到下一行
    if (ctx) inExt = !line.includes(']');
    lines[i] = line;
  }

  return { content: lines.join('\n'), counts };
}

// ── 磁盘重命名 ───────────────────────────────────────────────────────
function renameDisk(oldPath, newPath, stats) {
  if (DRY_RUN) {
    console.log('  [rename] ' + relative(ROOT, oldPath) + ' → ' + basename(newPath));
  } else {
    try {
      renameSync(oldPath, newPath);
      console.log('  ~ ' + relative(ROOT, oldPath) + ' → ' + relative(ROOT, newPath));
    } catch (e) {
      console.log('  ✗ 重命名失败: ' + relative(ROOT, oldPath) + ' (' + e.message + ')');
      return;
    }
  }
  stats.renames++;
}

// ── 遍历 ─────────────────────────────────────────────────────────────
function walk(dir, stats) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(ROOT, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      // 目录排除：scan-exclude.json 的 dirs
      if (scanFilter.shouldSkipDir(entry.name, relPath)) continue;
      walk(fullPath, stats);
    } else if (entry.isFile()) {
      // 文件名排除：scan-exclude.json 的 files；扩展名排除见 isBinary
      if (scanFilter.shouldSkipName(entry.name, relPath)) continue;
      if (isBinary(fullPath)) continue;
      stats.scanned++;

      let content;
      try { content = readFileSync(fullPath, 'utf-8'); } catch { continue; }
      const { content: newContent, counts } = replaceContent(content);
      if (counts.a + counts.b + counts.d > 0) {
        stats.files++;
        const tag = [];
        if (counts.a) tag.push('后缀×' + counts.a);
        if (counts.b) tag.push('扩展名×' + counts.b);
        if (counts.d) tag.push('字面量×' + counts.d);
        console.log('  ' + relative(ROOT, fullPath) + '  [' + tag.join(' ') + ']');
        if (!DRY_RUN) writeFileSync(fullPath, newContent, 'utf-8');
      }

      // 文件重命名: *.ibim → *.idtw, *.bim → *.dtw (目录不做任何改名)
      if (SUFFIX_NAME_RE.test(entry.name)) {
        renameDisk(fullPath, join(dir, entry.name.replace(RULE_A, m => m === '.ibim' ? '.idtw' : '.dtw')), stats);
      }
    }
  }
}

// ── 主流程 ───────────────────────────────────────────────────────────
console.log('模式: ' + (DRY_RUN ? '预览 (--dry-run)' : '执行'));
console.log('规则: A=.bim/.ibim后缀  B=扩展名数组  D=ibim/bims字面量  (路径/建筑语义/标识符不动)');
console.log('排除配置: ' + (scanFilter.source
  ? scanFilter.source + ' — ' + scanFilter.config.dirs.length + ' 目录 / ' +
    scanFilter.config.exts.length + ' 扩展名 / ' + scanFilter.config.files.length + ' 文件名 / ' +
    scanFilter.config.includeDirs.length + ' 目录白名单'
  : '未找到 scan-exclude.json（不排除任何目录/扩展名）'));
if (TARGETS_FILE) console.log('targets: ' + TARGETS_FILE);
const stats = { scanned: 0, files: 0, renames: 0 };
const start = Date.now();

for (const t of targets) {
  console.log('目标: ' + relative(ROOT, t));
  walk(t, stats);
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log('');
console.log('扫描文件: ' + stats.scanned + ' | 替换文件: ' + stats.files + ' | 重命名: ' + stats.renames + ' | ' + elapsed + 's');
if (DRY_RUN && stats.files + stats.renames > 0) {
  console.log('(预览模式，未实际修改。去掉 --dry-run 以执行)');
}
