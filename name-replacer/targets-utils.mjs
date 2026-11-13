/**
 * ── targets.json 目录读取（start-ui / apply-replace 共用）──
 *
 * 支持两种格式：
 *   - 顶层数组: [{ dirs: [...], replaceOnly: [...] }, ...]
 *   - 对象:     { registry, stages: [...] }
 *
 * 每批的 dirs 和 replaceOnly 都算目标目录：replaceOnly 只是不发布，
 * 内容照样需要提取 / 替换。路径与 replace-staged / replace-bim 一致，
 * 相对仓库根目录（name-replacer 的上一级）解析。
 */

import { readFileSync } from 'fs';
import { isAbsolute, relative, resolve } from 'path';

/**
 * 去重并去掉被上层目录包含的子目录，避免同一批文件被处理多次。
 * @param {string[]} list 绝对路径
 * @returns {string[]}
 */
export function uniqueDirs(list) {
  const dirs = [...new Set(list)];
  return dirs.filter((d) => !dirs.some((other) => {
    if (other === d) return false;
    const rel = relative(other, d);
    return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
  }));
}

/**
 * 读取 targets 文件中的目标目录。
 * @param {string} filePath targets 文件路径
 * @param {string} rootDir 相对路径的基准目录（仓库根目录）
 * @returns {string[]} 绝对路径（已去重、去掉嵌套子目录）
 */
export function readTargetDirs(filePath, rootDir) {
  let data;
  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    throw new Error('无法读取 targets 文件: ' + filePath + '（' + e.message + '）');
  }

  const stages = Array.isArray(data)
    ? data
    : (data && Array.isArray(data.stages) ? data.stages : null);
  if (!stages) throw new Error('targets 文件格式不对，应为数组或含 stages 数组: ' + filePath);

  const raw = [];
  for (const stage of stages) {
    if (!stage || typeof stage !== 'object') continue;
    for (const key of ['dirs', 'replaceOnly']) {
      if (Array.isArray(stage[key])) raw.push(...stage[key]);
    }
  }
  if (raw.length === 0) throw new Error('targets 文件中没有 dirs / replaceOnly: ' + filePath);

  return uniqueDirs(raw.map((d) => resolve(rootDir, d)));
}
