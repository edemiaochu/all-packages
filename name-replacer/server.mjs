import { readFileSync, writeFileSync } from 'fs';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname);
const BRAND_WORDS = JSON.parse(readFileSync(join(ROOT, 'brand-words.json'), 'utf-8'));
const MAPPING_PATH = join(ROOT, 'name-mapping.json');
const EXCLUDE_PATH = join(ROOT, 'exclude-list.json');

// ── Extract case patterns ──────────────────────────────────────────
function extractPatterns(ids, brandName) {
  const lower = brandName.toLowerCase();
  const patterns = new Map();
  for (const id of ids) {
    const regex = new RegExp(lower, 'gi');
    let m;
    while ((m = regex.exec(id)) !== null) {
      const found = m[0];
      patterns.set(found, (patterns.get(found) || 0) + 1);
    }
  }
  return [...patterns.entries()].sort((a, b) => b[1] - a[1]);
}

function classifyPattern(pattern, brandName) {
  const upper = brandName.toUpperCase();
  const pascal = brandName[0].toUpperCase() + brandName.slice(1).toLowerCase();
  const lower = brandName.toLowerCase();
  const camel = brandName[0].toLowerCase() + brandName.slice(1);

  if (pattern === upper) return 'ALL_CAPS';
  if (pattern === pascal) return 'PascalCase';
  if (pattern === camel) return 'camelCase';
  if (pattern === lower) return 'lowercase';
  if (pattern === pascal[0].toUpperCase() + lower.slice(1)) return 'PascalCase'; // Itwin / Imodel
  return 'other';
}

// ── Build pattern config for each brand ─────────────────────────────
const brands = ['iTwin', 'iModel', 'Bentley'];
const brandPatterns = {};
for (const brand of brands) {
  const ids = BRAND_WORDS.identifiers[brand];
  brandPatterns[brand] = {
    count: ids.length,
    patterns: extractPatterns(ids, brand),
    baseName: brand,
  };
}

// ── Canonical case forms for each brand ──────────────────────────────
const BRAND_FORMS = {
  iTwin:   { upper: 'ITWIN',  pascal: 'ITwin',  camel: 'iTwin',  lower: 'itwin' },
  iModel:  { upper: 'IMODEL', pascal: 'IModel', camel: 'iModel', lower: 'imodel' },
  Bentley: { upper: 'BENTLEY',pascal: 'Bentley',camel: 'bentley',lower: 'bentley' },
};

// ── Pattern → replacement derivation ────────────────────────────────
function deriveReplacement(pattern, brandName, baseWord) {
  const forms = BRAND_FORMS[brandName];
  const targetUpper = baseWord.toUpperCase();
  const targetPascal = baseWord[0].toUpperCase() + baseWord.slice(1);
  const targetCamel = baseWord[0].toLowerCase() + baseWord.slice(1);
  const targetLower = baseWord.toLowerCase();

  if (forms) {
    if (pattern === forms.upper) return targetUpper;
    if (pattern === forms.pascal) return targetPascal;
    if (pattern === forms.camel) return targetCamel;
    if (pattern === forms.lower) return targetLower;
  }

  // Fallback for non-canonical variants
  if (pattern === pattern.toUpperCase()) return targetUpper;
  if (pattern[0] === pattern[0].toUpperCase()) return targetPascal;
  return targetLower;
}

// ── Apply mapping ───────────────────────────────────────────────────
function applyMapping(config) {
  const allIds = [...BRAND_WORDS.identifiers.iTwin, ...BRAND_WORDS.identifiers.iModel, ...BRAND_WORDS.identifiers.Bentley];

  // Build replacement rules from config
  const rules = [];
  for (const brand of brands) {
    const overrides = config[brand]?.overrides || {};
    const base = config[brand]?.baseName || brand;
    const patterns = brandPatterns[brand].patterns;

    for (const [pattern, count] of patterns) {
      const replacement = overrides[pattern] || deriveReplacement(pattern, brand, base);
      if (replacement && replacement !== pattern) {
        rules.push([new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement]);
      }
    }
  }

  // Sort by pattern length (longest first) to handle nested matches
  rules.sort((a, b) => b[0].source.length - a[0].source.length);

  // Also add brand-specific rules that shouldn't be overridden generically
  // Remove the per-brand generic rules and use only pattern-specific ones
  const filteredRules = [];
  const seen = new Set();
  for (const [regex, repl] of rules) {
    const key = regex.source;
    if (!seen.has(key)) {
      seen.add(key);
      filteredRules.push([regex, repl]);
    }
  }

  const mapping = {};
  let changed = 0, unchanged = 0;

  for (const id of [...new Set(allIds)]) {
    let result = id;
    for (const [pat, repl] of filteredRules) {
      result = result.replace(pat, repl);
    }
    if (result !== id) {
      mapping[id] = result;
      changed++;
    } else {
      unchanged++;
    }
  }

  // Sort by key
  const sorted = {};
  Object.keys(mapping).sort().forEach(k => { sorted[k] = mapping[k]; });

  writeFileSync(MAPPING_PATH, JSON.stringify(sorted, null, 2), 'utf-8');
  return { changed, unchanged, total: changed + unchanged };
}

// ── HTTP Server ─────────────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>品牌词替换配置</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; background: #f5f5f5; color: #333; }
.header { background: #1a1a2e; color: #fff; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; }
.header h1 { font-size: 20px; font-weight: 600; }
.header .stats { font-size: 13px; color: #8892b0; }
.no-modify-toggle { display: flex; align-items: center; gap: 6px; font-size: 14px; color: #ccc; cursor: pointer; user-select: none; transition: color .2s; }
.no-modify-toggle input { width: 16px; height: 16px; cursor: pointer; accent-color: #e03131; }
.no-modify-toggle.active { color: #e03131; font-weight: 600; }
body.no-modify .brand-card { opacity: .7; }
body.no-modify input:not(#noModifyCheck) { pointer-events: none; background: #f5f5f5; color: #999; border-style: dashed; }
.main { max-width: 960px; margin: 24px auto; padding: 0 16px; display: flex; flex-direction: column; gap: 20px; }
.brand-card { background: #fff; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,.08); overflow: hidden; }
.brand-header { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
.brand-header h2 { font-size: 16px; font-weight: 600; }
.brand-header .badge { font-size: 12px; color: #666; background: #f0f0f0; padding: 3px 10px; border-radius: 12px; }
.brand-body { padding: 20px 24px; }
.base-input-row { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding-bottom: 16px; border-bottom: 1px dashed #eee; }
.base-input-row label { font-weight: 600; font-size: 14px; white-space: nowrap; min-width: 110px; }
.base-input-row input { flex: 1; padding: 8px 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 15px; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; transition: border-color .2s; }
.base-input-row input:focus { outline: none; border-color: #4a6cf7; }
.base-input-row .derived-preview { font-size: 12px; color: #888; white-space: nowrap; }
.pattern-list { display: flex; flex-wrap: wrap; gap: 10px; }
.pattern-item { display: flex; align-items: center; gap: 8px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 8px 14px; font-size: 13px; }
.pattern-item .orig { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; color: #c7254e; background: #fdf2f5; padding: 2px 6px; border-radius: 3px; min-width: 60px; text-align: center; }
.pattern-item .arrow { color: #888; }
.pattern-item .repl { font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; color: #22863a; background: #f0fff4; padding: 2px 6px; border-radius: 3px; min-width: 60px; text-align: center; font-weight: 600; }
.pattern-item .count { font-size: 11px; color: #999; }
.pattern-item input.override { width: 100px; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace; }
.pattern-item input.override:focus { outline: none; border-color: #e67700; }
.pattern-item.overridden { border-color: #e67700; background: #fff9f0; }
.actions { display: flex; gap: 12px; justify-content: center; padding: 8px 0 32px; }
.actions button { padding: 12px 32px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-save { background: #4a6cf7; color: #fff; }
.btn-save:hover { background: #3b5de7; }
.btn-save:disabled { background: #adb5bd; cursor: not-allowed; }
.btn-reset { background: #fff; color: #666; border: 2px solid #ddd !important; }
.btn-reset:hover { background: #f8f9fa; }
.btn-preview { background: #fff; color: #4a6cf7; border: 2px solid #4a6cf7 !important; }
.btn-preview:hover { background: #eef1ff; }
/* ── Preview Modal ─────────── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal { background: #fff; border-radius: 12px; width: 90vw; max-width: 1000px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
.modal-header { padding: 20px 28px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { font-size: 18px; font-weight: 600; }
.modal-header .close-btn { width: 32px; height: 32px; border: none; background: #f0f0f0; border-radius: 50%; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #666; }
.modal-header .close-btn:hover { background: #e0e0e0; }
.modal-toolbar { padding: 12px 28px; border-bottom: 1px solid #f0f0f0; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.modal-toolbar .tab { padding: 6px 16px; border-radius: 16px; border: 1px solid #ddd; background: #fff; font-size: 13px; cursor: pointer; transition: all .15s; }
.modal-toolbar .tab.active { background: #4a6cf7; color: #fff; border-color: #4a6cf7; }
.modal-toolbar .tab:hover:not(.active) { border-color: #4a6cf7; color: #4a6cf7; }
.modal-toolbar .search { flex: 1; min-width: 180px; padding: 6px 14px; border: 1px solid #ddd; border-radius: 16px; font-size: 13px; outline: none; }
.modal-toolbar .search:focus { border-color: #4a6cf7; }
.modal-toolbar .stats-text { font-size: 13px; color: #888; margin-left: auto; }
.modal-body { flex: 1; overflow-y: auto; padding: 6px 0; }
.transform-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.transform-table th { position: sticky; top: 0; background: #fafafa; padding: 10px 16px; text-align: left; font-weight: 600; color: #666; border-bottom: 2px solid #eee; z-index: 1; }
.transform-table td { padding: 6px 16px; border-bottom: 1px solid #f4f4f4; }
.transform-table .old { font-family: 'SF Mono','Cascadia Code','Consolas',monospace; color: #c7254e; }
.transform-table .arrow { color: #aaa; padding: 0 8px; }
.transform-table .new { font-family: 'SF Mono','Cascadia Code','Consolas',monospace; color: #22863a; font-weight: 600; }
.transform-table .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500; }
.badge-itwin { background: #e8f0fe; color: #1967d2; }
.badge-imodel { background: #fce8e6; color: #c5221f; }
.badge-bentley { background: #e6f4ea; color: #137333; }
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
</style>
</head>
<body>
<div class="header">
  <h1>品牌词替换配置</h1>
  <span class="stats">共 ${[...new Set([...BRAND_WORDS.identifiers.iTwin, ...BRAND_WORDS.identifiers.iModel, ...BRAND_WORDS.identifiers.Bentley])].length} 个标识符 | 涉及 ${BRAND_WORDS.summary.filesWithBrandWords} 个文件</span>
  <label class="no-modify-toggle"><input type="checkbox" id="noModifyCheck" onchange="onNoModifyToggle()"> 不修改（仅查看）</label>
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
const BRAND_PATTERNS = ${JSON.stringify(brandPatterns)};
const ALL_IDS = ${JSON.stringify({
  iTwin: BRAND_WORDS.identifiers.iTwin,
  iModel: BRAND_WORDS.identifiers.iModel,
  Bentley: BRAND_WORDS.identifiers.Bentley,
})};
const SAMPLE_IDS = ${JSON.stringify({
  iTwin: BRAND_WORDS.identifiers.iTwin.slice(0, 12),
  iModel: BRAND_WORDS.identifiers.iModel.slice(0, 12),
  Bentley: BRAND_WORDS.identifiers.Bentley.slice(0, 8),
})};

const BRAND_FORMS = {
  iTwin:   { upper: 'ITWIN',  pascal: 'ITwin',  camel: 'iTwin',  lower: 'itwin' },
  iModel:  { upper: 'IMODEL', pascal: 'IModel', camel: 'iModel', lower: 'imodel' },
  Bentley: { upper: 'BENTLEY',pascal: 'Bentley',camel: 'bentley',lower: 'bentley' },
};

function deriveReplacement(pattern, brandName, baseWord) {
  const forms = BRAND_FORMS[brandName];
  const targetUpper = baseWord.toUpperCase();
  const targetPascal = baseWord[0].toUpperCase() + baseWord.slice(1);
  const targetCamel = baseWord[0].toLowerCase() + baseWord.slice(1);
  const targetLower = baseWord.toLowerCase();

  if (forms) {
    if (pattern === forms.upper) return targetUpper;
    if (pattern === forms.pascal) return targetPascal;
    if (pattern === forms.camel) return targetCamel;
    if (pattern === forms.lower) return targetLower;
  }

  if (pattern === pattern.toUpperCase()) return targetUpper;
  if (pattern[0] === pattern[0].toUpperCase()) return targetPascal;
  return targetLower;
}

let noModify = false;
function onNoModifyToggle() {
  noModify = document.getElementById('noModifyCheck').checked;
  document.getElementById('noModifyCheck').parentElement.classList.toggle('active', noModify);
  document.body.classList.toggle('no-modify', noModify);
  if (noModify) {
    // Reset all brands to original names
    for (const brand of ['iTwin', 'iModel', 'Bentley']) {
      const baseInput = document.getElementById('base_' + brand);
      if (baseInput) baseInput.value = brand;
      const info = BRAND_PATTERNS[brand];
      for (const [pattern] of info.patterns) {
        const key = pattern.replace(/[^a-zA-Z]/g, '_');
        const ovrEl = document.getElementById('ovr_' + brand + '_' + key);
        if (ovrEl) ovrEl.value = '';
      }
    }
  }
  render();
}

function render() {
  const app = document.getElementById('app');
  let html = '';
  const brands = ['iTwin', 'iModel', 'Bentley'];
  for (const brand of brands) {
    const info = BRAND_PATTERNS[brand];
    const baseVal = document.getElementById('base_' + brand)?.value || brand;
    html += '<div class="brand-card">';
    html += '<div class="brand-header"><h2>' + brand + '</h2><span class="badge">' + info.count + ' 个标识符</span></div>';
    html += '<div class="brand-body">';
    html += '<div class="base-input-row">';
    html += '<label>基准替换词 (PascalCase)</label>';
    html += '<input id="base_' + brand + '" value="' + baseVal + '" oninput="onBaseChange(\\'' + brand + '\\')" placeholder="例如: Twin / TwinPlatform"' + (noModify ? ' disabled' : '') + '>';
    html += '<span class="derived-preview" id="preview_' + brand + '"></span>';
    html += '</div>';
    html += '<div class="pattern-list">';
    for (const [pattern, count] of info.patterns) {
      const derived = deriveReplacement(pattern, brand, baseVal);
      const overrideVal = document.getElementById('ovr_' + brand + '_' + pattern)?.value || '';
      const hasOverride = overrideVal !== '' && overrideVal !== derived;
      html += '<div class="pattern-item' + (hasOverride ? ' overridden' : '') + '" id="item_' + brand + '_' + pattern.replace(/[^a-zA-Z]/g, '_') + '">';
      html += '<span class="orig">' + pattern + '</span>';
      html += '<span class="count">(' + count + ')</span>';
      html += '<span class="arrow">→</span>';
      html += '<span class="repl" id="repl_' + brand + '_' + pattern.replace(/[^a-zA-Z]/g, '_') + '">' + (overrideVal || derived) + '</span>';
      html += '<input class="override" id="ovr_' + brand + '_' + pattern.replace(/[^a-zA-Z]/g, '_') + '" value="' + overrideVal + '" placeholder="自定义" oninput="onOverride(\\'' + brand + '\\', \\'' + pattern + '\\')"' + (noModify ? ' disabled' : '') + '>';
      html += '</div>';
    }
    html += '</div></div></div>';
  }

  // Preview section
  html += '<div class="preview-section">';
  html += '<div class="preview-header">转换预览</div>';
  html += '<div class="preview-body" id="previewSamples"></div>';
  html += '</div>';

  app.innerHTML = html;
  updateAllPreviews();

  // Init preview for each brand
  for (const brand of brands) {
    onBaseChange(brand);
  }
}

function onBaseChange(brand) {
  const input = document.getElementById('base_' + brand);
  const base = input.value || brand;
  const info = BRAND_PATTERNS[brand];
  // Update derived preview
  const upper = base.toUpperCase();
  const lower = base.toLowerCase();
  const pascal = base[0].toUpperCase() + base.slice(1).toLowerCase();
  const preview = document.getElementById('preview_' + brand);
  preview.textContent = '自动: ' + pascal + ' / ' + lower + ' / ' + upper;

  // Update pattern display
  for (const [pattern] of info.patterns) {
    const key = pattern.replace(/[^a-zA-Z]/g, '_');
    const replEl = document.getElementById('repl_' + brand + '_' + key);
    const ovrEl = document.getElementById('ovr_' + brand + '_' + key);
    if (replEl && (!ovrEl || ovrEl.value === '')) {
      replEl.textContent = deriveReplacement(pattern, brand, base);
    }
  }
  updatePreviewSamples();
}

function onOverride(brand, pattern) {
  const key = pattern.replace(/[^a-zA-Z]/g, '_');
  const ovrEl = document.getElementById('ovr_' + brand + '_' + key);
  const replEl = document.getElementById('repl_' + brand + '_' + key);
  const itemEl = document.getElementById('item_' + brand + '_' + key);
  const baseInput = document.getElementById('base_' + brand);
  const base = baseInput?.value || brand;
  const derived = deriveReplacement(pattern, brand, base);
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

function updateAllPreviews() {
  for (const brand of ['iTwin', 'iModel', 'Bentley']) {
    onBaseChange(brand);
  }
}

function updatePreviewSamples() {
  const container = document.getElementById('previewSamples');
  if (!container) return;
  const allRules = collectRules();
  let html = '';
  const allSamples = [...SAMPLE_IDS.iTwin, ...SAMPLE_IDS.iModel, ...SAMPLE_IDS.Bentley];
  for (const id of allSamples) {
    let result = id;
    for (const [pat, repl] of allRules) {
      result = result.replace(pat, repl);
    }
    if (result !== id) {
      html += '<div class="preview-item"><span class="from">' + id + '</span><span>→</span><span class="to">' + result + '</span></div>';
    } else {
      html += '<div class="preview-item"><span class="from">' + id + '</span><span>→</span><span style="color:#888">(不变)</span></div>';
    }
  }
  container.innerHTML = html || '<span style="color:#888;font-size:13px">预览加载中...</span>';
}

function collectRules() {
  if (noModify) return [];
  const rules = [];
  for (const brand of ['iTwin', 'iModel', 'Bentley']) {
    const baseInput = document.getElementById('base_' + brand);
    const base = baseInput?.value || brand;
    const info = BRAND_PATTERNS[brand];
    for (const [pattern] of info.patterns) {
      const key = pattern.replace(/[^a-zA-Z]/g, '_');
      const ovrEl = document.getElementById('ovr_' + brand + '_' + key);
      let repl;
      if (ovrEl && ovrEl.value !== '') {
        repl = ovrEl.value;
      } else {
        repl = deriveReplacement(pattern, brand, base);
      }
      if (repl && repl !== pattern) {
        const escaped = pattern.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
        rules.push([new RegExp(escaped, 'g'), repl]);
      }
    }
  }
  rules.sort((a, b) => b[0].source.length - a[0].source.length);
  return rules;
}

function getConfig() {
  const config = {};
  for (const brand of ['iTwin', 'iModel', 'Bentley']) {
    const baseInput = document.getElementById('base_' + brand);
    config[brand] = {
      baseName: baseInput?.value || brand,
      overrides: {}
    };
    const info = BRAND_PATTERNS[brand];
    for (const [pattern] of info.patterns) {
      const key = pattern.replace(/[^a-zA-Z]/g, '_');
      const ovrEl = document.getElementById('ovr_' + brand + '_' + key);
      if (ovrEl && ovrEl.value !== '') {
        config[brand].overrides[pattern] = ovrEl.value;
      }
    }
  }
  return config;
}

async function save() {
  const btn = document.getElementById('saveBtn');
  btn.disabled = true;
  btn.textContent = '保存中...';
  try {
    const config = noModify ? { noModify: true } : getConfig();
    const resp = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const result = await resp.json();
    if (result.success) {
      showToast('已保存！映射 ' + result.changed + ' 个，未变 ' + result.unchanged + ' 个', 'success');
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
  for (const brand of ['iTwin', 'iModel', 'Bentley']) {
    const baseInput = document.getElementById('base_' + brand);
    if (baseInput) baseInput.value = brand;
    const info = BRAND_PATTERNS[brand];
    for (const [pattern] of info.patterns) {
      const key = pattern.replace(/[^a-zA-Z]/g, '_');
      const ovrEl = document.getElementById('ovr_' + brand + '_' + key);
      if (ovrEl) ovrEl.value = '';
    }
  }
  render();
}

function showPreview() {
  const rules = collectRules();
  if (rules.length === 0) { showToast('请先设置替换词', 'error'); return; }

  // Build per-brand results
  const results = { iTwin: [], iModel: [], Bentley: [] };
  let totalChanged = 0, totalUnchanged = 0;

  for (const brand of ['iTwin', 'iModel', 'Bentley']) {
    const ids = ALL_IDS[brand] || [];
    for (const id of ids) {
      let result = id;
      for (const [pat, repl] of rules) {
        result = result.replace(pat, repl);
      }
      if (result !== id) {
        results[brand].push({ old: id, new: result });
        totalChanged++;
      } else {
        totalUnchanged++;
      }
    }
  }

  const brandLabel = { iTwin: 'iTwin', iModel: 'iModel', Bentley: 'Bentley' };
  const brandClass = { iTwin: 'badge-itwin', iModel: 'badge-imodel', Bentley: 'badge-bentley' };

  let rows = '';
  for (const brand of ['iTwin', 'iModel', 'Bentley']) {
    for (const item of results[brand]) {
      rows += '<tr data-brand="' + brand + '"><td><span class="badge ' + brandClass[brand] + '">' + brandLabel[brand] + '</span></td><td class="old">' + item.old + '</td><td class="arrow">→</td><td class="new">' + item.new + '</td></tr>';
    }
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'previewModal';
  overlay.innerHTML = '<div class="modal">' +
    '<div class="modal-header">' +
      '<h2>变更预览 — ' + totalChanged + ' 项将被替换，' + totalUnchanged + ' 项不变</h2>' +
      '<button class="close-btn" onclick="closePreview()">×</button>' +
    '</div>' +
    '<div class="modal-toolbar">' +
      '<span class="tab active" onclick="filterPreview(\\'all\\',this)">全部 (' + (totalChanged + totalUnchanged) + ')</span>' +
      '<span class="tab" onclick="filterPreview(\\'iTwin\\',this)">iTwin</span>' +
      '<span class="tab" onclick="filterPreview(\\'iModel\\',this)">iModel</span>' +
      '<span class="tab" onclick="filterPreview(\\'Bentley\\',this)">Bentley</span>' +
      '<input class="search" placeholder="搜索..." oninput="searchPreview(this.value)">' +
      '<span class="stats-text">共 ' + totalChanged + ' 条变更</span>' +
    '</div>' +
    '<div class="modal-body">' +
      '<table class="transform-table">' +
        '<thead><tr><th style="width:80px">品牌</th><th>原名称</th><th></th><th>新名称</th></tr></thead>' +
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

function filterPreview(brand, el) {
  const rows = document.querySelectorAll('.transform-table tbody tr');
  rows.forEach(r => { r.style.display = (brand === 'all' || r.dataset.brand === brand) ? '' : 'none'; });
  document.querySelectorAll('.modal-toolbar .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
}

function searchPreview(q) {
  const lower = q.toLowerCase();
  const rows = document.querySelectorAll('.transform-table tbody tr');
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = lower === '' || text.includes(lower) ? '' : 'none';
  });
}

function showToast(msg, type) {
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Exclude list management ───────────────────────────────────
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

loadExcludeList();
render();
</script>
</body>
</html>`;

// ── Start server ────────────────────────────────────────────────────
const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
  } else if (req.method === 'GET' && req.url === '/exclude') {
    try {
      const list = JSON.parse(readFileSync(EXCLUDE_PATH, 'utf-8'));
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
        writeFileSync(EXCLUDE_PATH, JSON.stringify(list, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, count: list.length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const config = JSON.parse(body);
        let result;
        if (config.noModify) {
          // No-modify mode: write empty mapping (no replacements)
          writeFileSync(MAPPING_PATH, JSON.stringify({}, null, 2), 'utf-8');
          const allIds = [...new Set([...BRAND_WORDS.identifiers.iTwin, ...BRAND_WORDS.identifiers.iModel, ...BRAND_WORDS.identifiers.Bentley])];
          result = { changed: 0, unchanged: allIds.length, total: allIds.length };
        } else {
          result = applyMapping(config);
          writeFileSync(join(__dirname, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, ...result }));
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

const PORT = 3456;
server.listen(PORT, () => {
  console.log('配置界面已启动: http://localhost:' + PORT);
  console.log('在浏览器中打开上述地址，配置完成后点击保存即可自动更新 name-mapping.json');
});
