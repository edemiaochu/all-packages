#!/usr/bin/env node
/**
 * 一键执行搜索 → 合并词表 → 启动 replace-server → 打开网页。
 *
 * 实际执行的步骤：
 *   1. search-sensitive.mjs   → result.json
 *   2. search-ec.mjs          → ec-result.json
 *   3. merge-ids.mjs          → all-ids.json
 *   4. replace-server.mjs     → Web UI（自动打开浏览器）
 *
 * 用法:
 *   node name-replacer/start-ui.mjs
 *   node name-replacer/start-ui.mjs -d ./itwinjs-core --words-file base-words.json
 *   node name-replacer/start-ui.mjs --targets          # 按 targets.json 的目录提取
 *   node name-replacer/start-ui.mjs --skip-search       # 复用已有的 all-ids.json
 *   node name-replacer/start-ui.mjs --input all-ids.json --port 3458
 */

import { spawn, spawnSync } from 'child_process';
import { existsSync, mkdtempSync, rmSync } from 'fs';
import { dirname, join, resolve, relative } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import http from 'http';
import { readTargetDirs, uniqueDirs } from './targets-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const NODE = process.execPath;

function printHelp() {
  console.log(`一键搜索并打开替换配置界面

用法:
  node name-replacer/start-ui.mjs [选项]

选项:
  -d, --dir <path>        搜索目录，可重复（默认整个仓库根目录）
  --targets [path]        从 targets.json 读取搜索目录（stages[].dirs + replaceOnly），
                          省略路径时用 name-replacer/targets.json；可与 -d 叠加
  --words-file <path>     敏感词文件（默认 base-words.json）
  --fused                 search-ec 启用融合词匹配
  --input <path>          直接使用已有的合并词表，跳过搜索和合并
  --skip-search           跳过搜索和合并，使用默认的 all-ids.json
  -p, --port <n>          replace-server 端口（默认 3457）
  --no-open               启动后不自动打开浏览器
  -h, --help              显示帮助

执行顺序:
  search-sensitive → search-ec → merge-ids → replace-server

生成文件（仓库根目录）:
  result.json / ec-result.json / all-ids.json
`);
}

function fail(msg) {
  console.error('❌ ' + msg);
  process.exit(1);
}

function runStep(label, script, args) {
  console.log('');
  console.log('▶ ' + label);
  const result = spawnSync(NODE, [join(__dirname, script), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    fail(label + ' 失败（exit ' + (result.status ?? 'null') + '）');
  }
}

function resolveExisting(pathValue, fallbackRoot) {
  const fromCwd = resolve(process.cwd(), pathValue);
  if (existsSync(fromCwd)) return fromCwd;
  return resolve(fallbackRoot, pathValue);
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      spawn(process.env.ComSpec || 'cmd.exe', ['/c', 'start', '', url], {
        detached: true,
        stdio: 'ignore',
      }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    console.log('（自动打开浏览器失败，请手动访问 ' + url + '）');
  }
}

function waitForServer(port, timeoutMs = 30000) {
  return new Promise((resolveReady) => {
    const startedAt = Date.now();
    const attempt = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/', timeout: 1000 }, (res) => {
        res.resume();
        resolveReady(true);
      });
      req.on('timeout', () => req.destroy());
      req.on('error', () => {
        if (Date.now() - startedAt >= timeoutMs) resolveReady(false);
        else setTimeout(attempt, 300);
      });
    };
    attempt();
  });
}

// ── 参数 ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let searchDirs = [];
let targetsFile = null;
let wordsFile = 'base-words.json';
let mergedFile = 'all-ids.json';
let port = 3457;
let fused = false;
let skipSearch = false;
let inputFile = null;
let openPage = true;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-d' || arg === '--dir') {
    if (!args[i + 1]) fail(arg + ' 缺少目录参数');
    searchDirs.push(resolve(process.cwd(), args[++i]));
  } else if (arg === '--targets') {
    // 路径可选：跟一个非选项参数就用它，否则默认 name-replacer/targets.json
    const next = args[i + 1];
    targetsFile = next && !next.startsWith('-')
      ? resolve(process.cwd(), args[++i])
      : join(__dirname, 'targets.json');
  } else if (arg === '--words-file') {
    if (!args[i + 1]) fail('--words-file 缺少文件参数');
    wordsFile = args[++i];
  } else if (arg === '--input') {
    if (!args[i + 1]) fail('--input 缺少文件参数');
    inputFile = args[++i];
    skipSearch = true;
  } else if (arg === '--skip-search') {
    skipSearch = true;
  } else if (arg === '--fused') {
    fused = true;
  } else if (arg === '-p' || arg === '--port') {
    if (!args[i + 1]) fail(arg + ' 缺少端口参数');
    port = parseInt(args[++i], 10);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) fail('无效端口: ' + args[i]);
  } else if (arg === '--no-open') {
    openPage = false;
  } else if (arg === '-h' || arg === '--help') {
    printHelp();
    process.exit(0);
  } else {
    fail('未知选项: ' + arg + '（用 --help 查看用法）');
  }
}

const resultFile = resolve(ROOT, 'result.json');
const ecFile = resolve(ROOT, 'ec-result.json');
const allIdsFile = resolve(ROOT, mergedFile);
let inputPath = allIdsFile;

// --targets 的目录与 -d 合并；两者都没给时扫描整个仓库
if (targetsFile && skipSearch) {
  console.log('⏭ 跳过搜索，忽略 --targets');
} else if (targetsFile) {
  if (!existsSync(targetsFile)) fail('找不到 targets 文件: ' + targetsFile);
  let targetDirs;
  try {
    targetDirs = readTargetDirs(targetsFile, ROOT);
  } catch (e) {
    fail(e.message);
  }
  console.log('🎯 从 targets 读取 ' + targetDirs.length + ' 个目录: ' + targetsFile);
  for (const d of targetDirs) console.log('   • ' + relative(ROOT, d).replace(/\\/g, '/'));
  searchDirs = uniqueDirs([...searchDirs, ...targetDirs]);
}
if (searchDirs.length === 0) searchDirs = [ROOT];

for (const d of searchDirs) {
  if (!existsSync(d)) fail('搜索目录不存在: ' + d);
}

// ── 搜索 / 合并 ─────────────────────────────────────────────────────

if (skipSearch) {
  if (inputFile) inputPath = resolve(process.cwd(), inputFile);
  console.log('⏭ 跳过搜索，直接使用: ' + inputPath);
  if (!existsSync(inputPath)) fail('找不到合并词表: ' + inputPath);
} else {
  const wordsPath = resolveExisting(wordsFile, ROOT);
  if (!existsSync(wordsPath)) fail('找不到敏感词文件: ' + wordsPath);

  if (searchDirs.length === 1) {
    // 单目录：直接把搜索输出写到仓库根目录的 result.json / ec-result.json
    const searchDir = searchDirs[0];
    runStep('搜索敏感词', 'search-sensitive.mjs', [
      '-d', searchDir,
      '--words-file', wordsPath,
      '--concise',
      '-o', resultFile,
    ]);

    runStep('搜索 EC', 'search-ec.mjs', [
      '-d', searchDir,
      '--concise',
      '-o', ecFile,
      ...(fused ? ['--fused'] : []),
    ]);

    runStep('合并词表', 'merge-ids.mjs', [
      ecFile,
      resultFile,
      '-o', allIdsFile,
    ]);
  } else {
    // 多目录：逐个扫描到临时目录，再合并成 result.json / ec-result.json / all-ids.json
    const workDir = mkdtempSync(join(tmpdir(), 'name-replacer-'));
    try {
      const resultFiles = [];
      const ecFiles = [];
      searchDirs.forEach((dir, idx) => {
        const tag = `[${idx + 1}/${searchDirs.length}] ${relative(ROOT, dir).replace(/\\/g, '/') || dir}`;
        const rf = join(workDir, `result-${idx}.json`);
        const ef = join(workDir, `ec-${idx}.json`);

        runStep('搜索敏感词 ' + tag, 'search-sensitive.mjs', [
          '-d', dir,
          '--words-file', wordsPath,
          '--concise',
          '-o', rf,
        ]);
        resultFiles.push(rf);

        runStep('搜索 EC ' + tag, 'search-ec.mjs', [
          '-d', dir,
          '--concise',
          '-o', ef,
          ...(fused ? ['--fused'] : []),
        ]);
        ecFiles.push(ef);
      });

      runStep('合并敏感词结果', 'merge-ids.mjs', [...resultFiles, '-o', resultFile]);
      runStep('合并 EC 结果', 'merge-ids.mjs', [...ecFiles, '-o', ecFile]);
      runStep('合并词表', 'merge-ids.mjs', [ecFile, resultFile, '-o', allIdsFile]);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  }
  inputPath = allIdsFile;
}

// ── 启动 replace-server ─────────────────────────────────────────────

const url = 'http://localhost:' + port + '/';
console.log('');
console.log('▶ 启动 replace-server: ' + url);

const server = spawn(
  NODE,
  [join(__dirname, 'replace-server.mjs'), '--input', inputPath, '-p', String(port)],
  { cwd: ROOT, stdio: 'inherit' }
);

server.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => {
  server.kill('SIGINT');
  process.exit(130);
});

if (openPage) {
  waitForServer(port).then((ok) => {
    if (ok) {
      console.log('打开浏览器: ' + url);
      openBrowser(url);
    } else {
      console.log('（服务启动较慢或失败，请手动访问 ' + url + '）');
    }
  });
} else {
  console.log('（--no-open，请手动访问 ' + url + '）');
}
