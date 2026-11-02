/**
 * ── 关键词合并工具 ──
 *
 * 将 search-ec 和 search-sensitive 输出的全部词（标识符 + 路径名）合并到一个文件。
 *
 * 用法:
 *   node name-replacer/merge-ids.mjs <file1.json> <file2.json> [...] [-o output.json]
 *
 * 示例:
 *   node name-replacer/merge-ids.mjs ec-result.json result.json -o all-ids.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── 参数解析 ──

function parseArgs(argv) {
  const inputs = [];
  let output = null;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-o' || argv[i] === '--output') {
      output = argv[++i];
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log(`关键词合并工具 — 合并标识符 + 路径名到一个词集合

用法: node name-replacer/merge-ids.mjs <file1.json> <file2.json> [...] [-o output.json]

输入文件:
  search-ec 简洁输出   → identifiers + pathMatches
  search-sensitive 简洁输出 → identifiers + pathMatches

合并内容:
  文件内容中提取的标识符 + 匹配到的目录名/文件名 → 统一去重排序

示例:
  # 合并 EC + 敏感词 全部结果
  node name-replacer/merge-ids.mjs ec-result.json result.json -o all-ids.json

  # 合并多个
  node name-replacer/merge-ids.mjs a.json b.json c.json -o all.json`);
      process.exit(0);
    } else if (!argv[i].startsWith('-')) {
      inputs.push(argv[i]);
    }
  }

  return { inputs, output };
}

// ── 读取 ──

/**
 * 从文件中提取标识符列表。
 * 支持两种格式：
 *   - 数组: ["ECDb", "ECClass", ...]          (search-ec concise)
 *   - 对象: {"dgn": [...], "iModel": [...]}   (search-sensitive concise)
 */
function readIdentifiers(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  if (!data.identifiers) {
    console.error(`⚠️  跳过 ${filePath}: 缺少 identifiers 字段`);
    return [];
  }

  if (Array.isArray(data.identifiers)) {
    return data.identifiers;
  }

  if (typeof data.identifiers === 'object') {
    return Object.values(data.identifiers).flat();
  }

  console.error(`⚠️  跳过 ${filePath}: identifiers 格式无法识别`);
  return [];
}

/**
 * 从文件中提取路径名称匹配。
 */
function readPathMatches(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  if (!data.pathMatches) return null;
  return {
    directories: data.pathMatches.directories || [],
    fileNames: data.pathMatches.fileNames || [],
  };
}

// ── 合并 ──

function mergeIdentifiers(inputFiles) {
  const all = new Set();
  const sources = {};

  for (const file of inputFiles) {
    let idCount = 0, pathCount = 0;

    try {
      const ids = readIdentifiers(file);
      for (const id of ids) all.add(id);
      idCount = ids.length;
    } catch (e) {
      console.error(`⚠️  跳过 ${file}: ${e.message}`);
      continue;
    }

    // 路径名称也合并到同一个词集合
    try {
      const pm = readPathMatches(file);
      if (pm) {
        for (const d of pm.directories) all.add(d);
        for (const f of pm.fileNames) all.add(f);
        pathCount = pm.directories.length + pm.fileNames.length;
      }
    } catch { /* pathMatches 可选 */ }

    sources[file] = { identifiers: idCount, pathNames: pathCount };
    console.error(`📂 ${file}: ${idCount} 个标识符 + ${pathCount} 个路径名`);
  }

  const sorted = [...all].sort();
  return { identifiers: sorted, sources, total: sorted.length };
}

// ── 主函数 ──

function main() {
  const { inputs, output } = parseArgs(process.argv.slice(2));

  if (inputs.length === 0) {
    console.error('❌ 请指定至少一个输入文件');
    console.error('用法: node name-replacer/merge-ids.mjs <file1.json> <file2.json> [...] [-o output.json]');
    process.exit(1);
  }

  const { identifiers, sources, total } = mergeIdentifiers(inputs);

  const result = {
    generatedAt: new Date().toISOString(),
    sources,
    totalUniqueIdentifiers: total,
    identifiers,
  };

  if (output) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(result, null, 2), 'utf-8');
    console.error(`\n✅ 已写入 ${output}`);
    console.error(`   合计: ${total} 个唯一词（含标识符 + 路径名）`);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

main();
