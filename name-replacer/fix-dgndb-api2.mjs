/**
 * ─── 临时修复：还原 DgnDb 外部 API 的误替换 ───
 *
 * 背景：品牌词替换把 @bentley/imodeljs-native 的 DgnDb API 方法名也改了，
 * 但外部包类型定义不变 → 40+ TS2339 错误。
 *
 * 本脚本根据 core-backend.md 中的编译错误，(行号, 列号) 精确定位每个误替换，
 * 只替换该位置的标识符，不依赖字符串搜索，不会误伤同行其他文本。
 *
 * 等 exclude-list 机制完善后可整体删除。
 *
 * 用法：
 *   node name-replacer/fix-dgndb-api.mjs [targetDir]
 *
 *   targetDir 默认: ../NameReplaceTest （相对于 name-replacer 目录）
 *
 * DELETE ME
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 逐行逐列替换映射表
 *
 * 每条记录: { line, col, to }
 * - line: 行号（从 1 开始）
 * - col:  列号（从 1 开始，TS 编译器报错中的列）
 * - to:   正确的原文
 *
 * 实际替换时，读取 (line, col) 处的标识符，替换为 to。
 * 同一行的多条记录按 col 降序处理，避免前列替换后影响后列偏移。
 */
const FIXES = {

  'src/BriefcaseManager.ts': [
    // (193,59): getIProjectId          (193,88): getIWorkId
    { line: 193, col: 59, to: 'getITwinId' },
    // (193,86): getIWorkId — 同行前列 getIProjectId(13)→getIWorkId(10) 后右移3列
    { line: 193, col: 88, to: 'getIModelId' },
    // (288,16): openIWork
    { line: 288, col: 16, to: 'openIModel' },
    // (332,21): getIWorkId
    { line: 332, col: 21, to: 'getIModelId' },
  ],

  'src/CatalogDb.ts': [
    // (180,16): openIWork
    { line: 180, col: 16, to: 'openIModel' },
    // (181,16): setIProjectId
    { line: 181, col: 16, to: 'setIModelId' },
    // (182,16): setIWorkId
    { line: 182, col: 16, to: 'setIModelId' },
  ],

  'src/CheckpointManager.ts': [
    // (371,45): getIWorkId
    { line: 371, col: 45, to: 'getIModelId' },
    // (378,16): setIWorkId
    { line: 378, col: 16, to: 'setIModelId' },
    // (386,48): getIProjectId
    { line: 386, col: 48, to: 'getIModelId' },
    // (398,16): openIWork
    { line: 398, col: 16, to: 'openIModel' },
    // (403,53): getIWorkId
    { line: 403, col: 53, to: 'getIModelId' },
  ],

  'src/EditTxn.ts': [
    // (603,27): updateIWorkProps
    { line: 603, col: 27, to: 'updateIModelProps' },
  ],

  'src/IWorkDb.ts': [
    // (578,48): getIProjectId          (578,88): getIWorkId
    { line: 578,  col: 48, to: 'getITwinId' },
    // (578,86): getIWorkId — 同行前列 getIProjectId(13)→getIWorkId(10) 后右移3列
    { line: 578,  col: 88, to: 'getIModelId' },
    // (596,21): setIWorkDb
    { line: 596,  col: 21, to: 'setIModelDb' },
    // (807,35): getIWorkProps
    { line: 807,  col: 35, to: 'getIModelProps' },
    // (1303,25): getIProjectId
    { line: 1303, col: 25, to: 'getIModelId' },
    // (1444,33): getIProjectId
    { line: 1444, col: 33, to: 'getIModelId' },
    // (1463,27): getIProjectId
    { line: 1463, col: 27, to: 'getIModelId' },
    // (1597,16): openIWork
    { line: 1597, col: 16, to: 'openIModel' },
    // (2087,38): getIWorkCoordinatesFromGeoCoordinates
    { line: 2087, col: 38, to: 'getIModelCoordinatesFromGeoCoordinates' },
    // (2098,38): getGeoCoordinatesFromIWorkCoordinates
    { line: 2098, col: 38, to: 'getGeoCoordinatesFromIModelCoordinates' },
    // (3913,21): openIWork
    { line: 3913, col: 21, to: 'openIModel' },
    // (3916,21): setIWorkDb
    { line: 3916, col: 21, to: 'setIModelDb' },
    // (3922,42): getIWorkId            (3922,94): getIProjectId
    { line: 3922, col: 42, to: 'getIModelId' },
    { line: 3922, col: 94, to: 'getIModelId' },
    // (4157,14): createIWork
    { line: 4157, col: 14, to: 'createIModel' },
    // (4185,14): openIWork
    { line: 4185, col: 14, to: 'openIModel' },
    // (4190,16): setIWorkId
    { line: 4190, col: 16, to: 'setIModelId' },
    // (4226,30): getIWorkId
    { line: 4226, col: 30, to: 'getIModelId' },
    // (4349,14): createIWork
    { line: 4349, col: 14, to: 'createIModel' },
    // (4356,14): setIProjectId
    { line: 4356, col: 14, to: 'setIModelId' },
    // (4409,35): getIProjectId
    { line: 4409, col: 35, to: 'getIModelId' },
    // (4428,14): openIWork
    { line: 4428, col: 14, to: 'openIModel' },
    // (4429,14): setIProjectId
    { line: 4429, col: 14, to: 'setIModelId' },
  ],

  'src/LocalHub.ts': [
    // (126,16): setIProjectId
    { line: 126, col: 16, to: 'setIModelId' },
    // (127,16): setIWorkId
    { line: 127, col: 16, to: 'setIModelId' },
  ],

  'src/SchemaSync.ts': [
    // (47,16): openIWork
    { line: 47, col: 16, to: 'openIModel' },
  ],

  'src/StashManager.ts': [
    // (231,11): Property 'iWorkId' does not exist on type 'DgnDb'
    { line: 231, col: 11, to: 'iModelId' },
    // (232,98): Object literal — shorthand property iWorkId 需匹配 DgnDb 类型中的 iModelId
    // 配合 L231 col=11（变量声明同步改为 iModelId），不会产生 TS18004
    { line: 232, col: 98, to: 'iModelId' },
  ],

  // ── iworks-access-backend ───────────────────────────────────
  // 包路径: itwin-platform-access/iworks-access-backend/
  'src/BackendIWorksAccess.ts': [
    // (705,16): setIProjectId          arg.iProjectId 也要修
    { line: 705, col: 16, to: 'setITwinId' },
    { line: 705, col: 33, to: 'iTwinId' },
  ],

  // ── 测试文件 ─────────────────────────────────────────────────────
  'src/test/element/ElementDependencyGraph.test.ts': [
    // (161,14): openIWork
    { line: 161, col: 14, to: 'openIModel' },
  ],

  'src/test/iwork/IWork.test.ts': [
    // (1182,44): getIWorkProps
    { line: 1182, col: 44, to: 'getIModelProps' },
  ],

  'src/test/standalone/TileCache.test.ts': [
    // (128,27): setIProjectId
    { line: 128, col: 27, to: 'setIModelId' },
  ],

  'src/test/standalone/TxnManager.test.ts': [
    // (61,14): openIWork
    { line: 61, col: 14, to: 'openIModel' },
  ],
};

// 所有可能的误替换标识符（按长度降序，用于在 col 位置提取匹配）
const WRONG_TOKENS = [
  'getIWorkCoordinatesFromGeoCoordinates',
  'getGeoCoordinatesFromIWorkCoordinates',
  'updateIWorkProps',
  'getIWorkProps',
  'getIProjectId',
  'setIProjectId',
  'getIWorkId',
  'setIWorkId',
  'createIWork',
  'setIWorkDb',
  'openIWork',
  'iProjectId',
  'iWorkId',
];

// ── 主逻辑 ─────────────────────────────────────────────────────────

/**
 * 根据 (行号, 列号) 精确定位并替换标识符
 *
 * @param {string} filePath
 * @param {Array<{line: number, col: number, to: string}>} fixes
 * @returns {{ fixed: number, errors: string[] }}
 */
function fixFile(filePath, fixes) {
  const lines = readFileSync(filePath, 'utf8').split('\n');
  let fixed = 0;
  const errors = [];

  // 按行分组，每组内按 col 降序（右→左），避免前列替换影响后列偏移
  const byLine = new Map();
  for (const f of fixes) {
    if (!byLine.has(f.line)) byLine.set(f.line, []);
    byLine.get(f.line).push(f);
  }
  for (const entries of byLine.values()) {
    entries.sort((a, b) => b.col - a.col);
  }

  for (const [lineNo, entries] of byLine) {
    const idx = lineNo - 1;
    if (idx < 0 || idx >= lines.length) {
      errors.push(`⚠ 行 ${lineNo} 越界（文件只有 ${lines.length} 行），跳过`);
      continue;
    }

    let lineText = lines[idx];

    for (const { col, to } of entries) {
      const pos = col - 1; // 0-based offset into line
      if (pos >= lineText.length) {
        errors.push(`⚠ 行 ${lineNo} 列 ${col} 越界，跳过`);
        continue;
      }

      // 在 (line, col) 处匹配已知的误替换标识符
      const tail = lineText.slice(pos);
      let matched = null;
      for (const wrong of WRONG_TOKENS) {
        if (tail.startsWith(wrong)) {
          matched = wrong;
          break;
        }
      }

      if (!matched) {
        // 可能已被之前的修复还原，或品牌替换产生了未知变体
        // 检查是否已是正确值
        if (tail.startsWith(to)) {
          continue; // 已正确，无需修复
        }
        errors.push(`⚠ 行 ${lineNo} 列 ${col}: 未匹配到已知误替换标识符 (tail="${tail.slice(0,30)}...")`);
        continue;
      }

      // 精确替换：只换这个位置的标识符
      lineText = lineText.slice(0, pos) + to + lineText.slice(pos + matched.length);
      fixed++;
    }

    if (lineText !== lines[idx]) {
      lines[idx] = lineText;
    }
  }

  writeFileSync(filePath, lines.join('\n'), 'utf8');
  return { fixed, errors };
}

/**
 * 还原 core-backend 中所有 DgnDb 外部 API 的误替换
 *
 * @param {string} backendDir - core-backend 包的绝对路径
 * @returns {{ filesFixed: number, totalFixed: number, errors: string[], fileResults: Array<{relPath: string, fixed: number}> }}
 */
export function fixDgnDbApi(backendDir) {
  let totalFixed = 0;
  let filesFixed = 0;
  const allErrors = [];
  const fileResults = [];

  for (const [relPath, fixes] of Object.entries(FIXES)) {
    const absPath = join(backendDir, relPath);

    try {
      const { fixed, errors } = fixFile(absPath, fixes);
      if (fixed > 0) {
        totalFixed += fixed;
        filesFixed++;
        fileResults.push({ relPath, fixed });
      }
      for (const err of errors) {
        allErrors.push(relPath + ': ' + err);
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        // 文件不存在 — 目录结构不同，静默跳过
      } else {
        allErrors.push(relPath + ': ' + e.message);
      }
    }
  }

  return { filesFixed, totalFixed, errors: allErrors, fileResults };
}

// ── CLI 入口 ───────────────────────────────────────────────────────

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const targetDir = process.argv[2] || join(__dirname, '..', 'NameReplaceTest');
  const backendDir = join(targetDir, 'itwinjs-core', 'core', 'backend');

  console.log('🔧 fix-dgndb-api — 还原 DgnDb 外部 API 误替换\n');
  console.log(`Target: ${backendDir}\n`);

  const result = fixDgnDbApi(backendDir);

  for (const { relPath, fixed } of result.fileResults) {
    console.log(`✅ ${relPath}  (${fixed} 处还原)`);
  }
  for (const err of result.errors) {
    console.log(err);
  }

  console.log(`\n完成: ${result.filesFixed} 个文件, ${result.totalFixed} 处替换还原`);
  console.log(`\n⚠  此脚本仅修复 DgnDb 外部 API 误替换，不影响其他品牌词替换。`);
  console.log(`⚠  流水线跑通后可删除此文件。`);
}
