/**
 * ── 扫描排除配置（search-sensitive / search-ec / apply-replace / replace-staged 共用）──
 *
 * 默认行为：扫描指定目录下的「所有文件夹 + 所有扩展名」。
 * 只有写进本配置的条目才会被排除；配置文件缺失时不做任何排除。
 *
 * 配置文件 name-replacer/scan-exclude.json：
 *   {
 *     "dirs":        ["node_modules", ".git", "**\/common/temp", ".claude*"],
 *     "includeDirs": ["base/icons-generic-webfont/dist"],
 *     "exts":        [".png", "woff2", "*.zip"],
 *     "files":       ["pnpm-lock.yaml", "name-mapping.json", "*.min.js"]
 *   }
 *
 * 匹配规则：
 *   - 含 "/" 的条目 → 相对扫描根目录的路径（* 不跨 /，** 跨层级）
 *   - 不含 "/" 的条目 → 目录名 / 文件名（basename）匹配
 *   - 支持 * 和 ? 通配符；名称匹配大小写不敏感
 *   - exts 写法兼容 "png" / ".png" / "*.PNG"，统一按小写 ".png" 匹配
 *   - includeDirs 是目录白名单：命中后无视 dirs 规则强制进入（如包里的 dist
 *     目录仍要替换），优先级最高，路径条目优先于包目录启发式
 *
 * scan-exclude.json 不存在时 → 不排除任何目录 / 扩展名（扫描全部）。
 */

import { readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const SCAN_EXCLUDE_PATH = join(__dirname, 'scan-exclude.json');

/** 文本文件大小上限：超过则跳过，避免把大二进制读进内存。 */
export const MAX_TEXT_FILE_SIZE = 5 * 1024 * 1024;

/** 扩展名归一化：'*.PNG' / 'png' / '.png' → '.png' */
export function normalizeExt(e) {
  let s = String(e).trim().toLowerCase();
  if (!s) return '';
  if (s.startsWith('*.')) s = s.slice(1);
  return s.startsWith('.') ? s : '.' + s;
}

function toStrArray(v) {
  if (!Array.isArray(v)) return [];
  return v.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim());
}

/** glob → 正则：* 不跨 /，** 跨层级，同时支持 ?（protected-files.mjs 也用） */
export function globToRegExp(pattern) {
  const p = String(pattern).replace(/\\/g, '/');
  let re = '^';
  for (let i = 0; i < p.length; i++) {
    const ch = p[i];
    if (ch === '*') {
      if (p[i + 1] === '*') {
        i++;
        if (p[i + 1] === '/') { re += '(?:.*/)?'; i++; }
        else re += '.*';
      } else {
        re += '[^/]*';
      }
    } else if (ch === '?') {
      re += '[^/]';
    } else {
      re += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  re += '$';
  return new RegExp(re, 'i');
}

/** 把配置文件原始 JSON 归一化为 { dirs, includeDirs, exts, files } */
export function normalizeScanExclude(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { dirs: [], includeDirs: [], exts: [], files: [] };
  }
  const dirs = toStrArray(raw.dirs ?? raw.directories ?? raw.excludeDirs);
  const includeDirs = toStrArray(raw.includeDirs ?? raw.forceDirs ?? raw.dirOverrides);
  const exts = toStrArray(raw.exts ?? raw.extensions ?? raw.excludeExts)
    .map(normalizeExt)
    .filter(Boolean);
  const files = toStrArray(raw.files ?? raw.fileNames ?? raw.excludeFiles);
  return { dirs, includeDirs, exts, files };
}

/**
 * 读取排除配置。
 * @param {string|null} configPath 显式配置路径；null = 默认 scan-exclude.json
 * @returns {{ config: {dirs:string[],includeDirs:string[],exts:string[],files:string[]}, source: string|null }}
 */
export function loadScanExclude(configPath = null) {
  const path = configPath || SCAN_EXCLUDE_PATH;
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8'));
    return { config: normalizeScanExclude(raw), source: path };
  } catch (e) {
    if (e.code !== 'ENOENT') {
      process.stderr.write(`⚠️  排除配置解析失败，已忽略: ${path} (${e.message})\n`);
    }
    return { config: { dirs: [], includeDirs: [], exts: [], files: [] }, source: null };
  }
}

/**
 * 根据配置创建匹配器。
 * 所有方法都只回答「是否排除」；配置为空时全部返回 false（= 扫描全部）。
 */
export function createScanFilter(config) {
  const exts = new Set((config.exts || []).map(normalizeExt).filter(Boolean));

  function build(entries) {
    const names = new Set();
    const nameRes = [];
    const pathRes = [];
    for (const raw of entries || []) {
      const p = String(raw).trim().replace(/\\/g, '/').replace(/\/+$/, '');
      if (!p) continue;
      if (p.includes('/')) pathRes.push(globToRegExp(p));
      else if (/[*?]/.test(p)) nameRes.push(globToRegExp(p));
      else names.add(p.toLowerCase());
    }
    return { names, nameRes, pathRes };
  }

  const dirs = build(config.dirs);
  const includeDirs = build(config.includeDirs);
  const files = build(config.files);

  function match(entry, name, relPath) {
    const n = String(name).toLowerCase();
    if (entry.names.has(n)) return true;
    for (const re of entry.nameRes) if (re.test(n)) return true;
    if (relPath != null) {
      const rp = String(relPath).replace(/\\/g, '/');
      for (const re of entry.pathRes) if (re.test(rp)) return true;
    }
    return false;
  }

  function shouldSkipExt(ext) {
    const n = normalizeExt(ext);
    return n !== '' && exts.has(n);
  }

  function shouldSkipName(name, relPath) {
    return match(files, name, relPath);
  }

  /** 目录是否在 includeDirs 白名单里（优先于所有排除规则） */
  function isDirIncluded(name, relPath) {
    return match(includeDirs, name, relPath);
  }

  return {
    config,
    exts,
    shouldSkipExt,
    shouldSkipName,
    isDirIncluded,

    /** 目录是否排除（name = basename，relPath = 相对扫描根的路径；includeDirs 白名单优先） */
    shouldSkipDir(name, relPath) {
      if (isDirIncluded(name, relPath)) return false;
      return match(dirs, name, relPath);
    },

    /**
     * 目录是否被「显式路径规则」（dirs 里含 "/" 的条目，如 "**\/common/temp"）排除。
     * 调用方可据此判断：路径规则是用户明确指定的，应优先于 basename 启发式规则
     * （如 apply-replace 的"真实包目录例外"）。
     */
    shouldSkipDirByPath(relPath) {
      if (relPath == null) return false;
      const rp = String(relPath).replace(/\\/g, '/');
      if (isDirIncluded(rp.split('/').pop(), rp)) return false;
      for (const re of dirs.pathRes) if (re.test(rp)) return true;
      return false;
    },

    /** 文件是否排除（扩展名 + 文件名规则；目录规则由遍历逻辑单独处理） */
    shouldSkipFile(name, relPath, ext) {
      if (ext != null && shouldSkipExt(ext)) return true;
      return shouldSkipName(name, relPath);
    },
  };
}

/** 读取默认配置并创建匹配器（附带 source / config 供日志使用）。 */
export function loadScanFilter(configPath = null) {
  const { config, source } = loadScanExclude(configPath);
  return Object.assign(createScanFilter(config), { source, config });
}

/**
 * 安全读取文本文件：过大或含 NUL 字节（二进制）时返回 null。
 * 这是兜底保护，与扩展名排除无关——配置里没排除的二进制也不会被当文本扫描。
 */
export function readTextFileSafely(filePath, maxSize = MAX_TEXT_FILE_SIZE) {
  try {
    if (statSync(filePath).size > maxSize) return null;
    const buf = readFileSync(filePath);
    const limit = Math.min(buf.length, 4096);
    for (let i = 0; i < limit; i++) {
      if (buf[i] === 0) return null;
    }
    return buf.toString('utf8');
  } catch {
    return null;
  }
}
