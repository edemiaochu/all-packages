#!/usr/bin/env node
// Generate dep-graph.html with LAYERED layout from dep-graph.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'dep-graph.json'), 'utf-8'));

// ── Color mapping ─────────────────────────────────────────────────────
const SUB_COLORS = {
  'itwinjs-core':            { color: '#4dd0e1', label: 'itwinjs-core (核心SDK)' },
  'appui':                   { color: '#64b5f6', label: 'appui (应用框架)' },
  'presentation':            { color: '#ffd54f', label: 'presentation (展示层)' },
  'viewer':                  { color: '#ff8a65', label: 'viewer (查看器)' },
  'viewer-components-react': { color: '#ffb74d', label: 'viewer-components-react (组件)' },
  'iTwinUI':                 { color: '#ba68c8', label: 'iTwinUI (UI组件库)' },
  'iTwinUI-layouts':         { color: '#ce93d8', label: 'iTwinUI-layouts (布局)' },
  'imodels-clients':         { color: '#81c784', label: 'imodels-clients (客户端)' },
  'auth-clients':            { color: '#a5d6a7', label: 'auth-clients (认证)' },
  'object-storage':          { color: '#4db6ac', label: 'object-storage (对象存储)' },
  'admin-components-react':  { color: '#f06292', label: 'admin-components-react (管理)' },
  'bis-schemas':             { color: '#00bcd4', label: 'bis-schemas (BIS)' },
  'reality-capture':         { color: '#26c6da', label: 'reality-capture (实景)' },
  'external':                { color: '#484f58', label: '外部包 (不在当前仓库)' },
};

const PACKAGES = DATA.packages;
const EDGES = DATA.edges;

// Collect external packages referenced in edges but not in PACKAGES
const externalPkgs = new Set();
EDGES.forEach(e => {
  if (!PACKAGES[e.from]) externalPkgs.add(e.from);
  if (!PACKAGES[e.to]) externalPkgs.add(e.to);
});

// Build extended package list: internal + external
const allPkgNames = [...Object.keys(PACKAGES), ...externalPkgs].sort();
const idxMap = {};
allPkgNames.forEach((name, i) => { idxMap[name] = i; });
const isExternal = new Set(externalPkgs);

// Edge external packages: external packages with ≤2 internal dependents
const edgeExternal = new Set(DATA.edgeExternal || []);
const validEdges = EDGES; // keep all edges, external packages included
console.log(`Packages: ${Object.keys(PACKAGES).length} internal + ${externalPkgs.size} external (${edgeExternal.size} edge), Edges: ${EDGES.length}`);

// ── Compute layer for each node ───────────────────────────────────────
// layer 0 = no internal deps (foundational)
const nodeLayer = {};
function computeLayer(name, visited = new Set()) {
  if (nodeLayer[name] !== undefined) return nodeLayer[name];
  if (visited.has(name)) { nodeLayer[name] = 0; return 0; } // cycle
  visited.add(name);
  let maxDep = -1;
  for (const e of validEdges) {
    if (e.from === name) {
      maxDep = Math.max(maxDep, computeLayer(e.to, visited));
    }
  }
  nodeLayer[name] = maxDep + 1;
  return nodeLayer[name];
}
Object.keys(idxMap).forEach(n => computeLayer(n, new Set()));

const maxLayer = Math.max(...Object.values(nodeLayer));
console.log(`Max layer depth: ${maxLayer}`);

// Group by layer
const layerGroups = {};
for (const [name, layer] of Object.entries(nodeLayer)) {
  if (!layerGroups[layer]) layerGroups[layer] = [];
  layerGroups[layer].push(name);
}

// Build nodeDefs with layer info: [id, label, group, title, baseR, subproject, color, layer, isExternal, isEdgeExternal]
const nodeDefs = allPkgNames.map((name, i) => {
  const pkg = PACKAGES[name];
  const ext = isExternal.has(name);
  const edge = edgeExternal.has(name);
  const sub = ext ? 'external' : (SUB_COLORS[pkg.subproject] ? pkg.subproject : 'other');
  const colorInfo = SUB_COLORS[sub] || { color: '#90a4ae' };
  const layer = nodeLayer[name] || 0;
  const baseR = edge ? 4.5 : ext ? 6 : (layer === 0 ? 15 : 12);
  const title = ext
    ? `${name}\n外部 npm 包 · ${edge ? '边缘依赖' : '核心依赖'}\n(不在当前仓库中)`
    : `${name}\nv${pkg.version}\n${pkg.subproject}\n${pkg.dir}`;
  return [i, name, sub, title, baseR, sub, colorInfo.color, layer, ext, edge];
});

const edgeDefs = validEdges.map(e => {
  const style = e.type === 'dep' ? 'solid' : e.type === 'peerDep' ? 'dashed' : 'dotted';
  return [idxMap[e.from], idxMap[e.to], style];
});

const sidebarGroups = {};
nodeDefs.forEach(n => {
  const sp = n[5];
  if (!sidebarGroups[sp]) sidebarGroups[sp] = [];
  sidebarGroups[sp].push(n);
});

const spOrder = Object.keys(sidebarGroups).sort((a, b) => {
  const aMin = Math.min(...sidebarGroups[a].map(n => n[7]));
  const bMin = Math.min(...sidebarGroups[b].map(n => n[7]));
  return aMin - bMin;
});

const EMBED = JSON.stringify({
  nodeDefs, edgeDefs, sidebarGroups, spOrder,
  subColors: SUB_COLORS, maxLayer,
  layerGroups,
  stats: DATA.stats,
  edgeExternal: [...edgeExternal],
});

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>iTwin2026 包依赖关系图 — 分层布局</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; overflow: hidden; user-select: none; }
#canvas { display: block; position: fixed; top: 48px; left: 0; }
#header { background: #161b22; color: #e6edf3; padding: 9px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; position: fixed; top: 0; left: 0; right: 0; z-index: 10; height: 48px; }
#header h1 { font-size: 16px; font-weight: 600; }
#header .header-right { display: flex; align-items: center; gap: 12px; }
#searchWrap { position: relative; display: flex; align-items: center; gap: 4px; }
#searchInput { background: #21262d; border: 1px solid #30363d; border-radius: 6px; padding: 4px 10px; color: #c9d1d9; font-size: 12px; width: 200px; outline: none; }
#searchInput:focus { border-color: #58a6ff; }
#searchInput::placeholder { color: #484f58; }
#searchNav button { background: #21262d; border: 1px solid #30363d; border-radius: 4px; padding: 2px 7px; color: #8b949e; font-size: 12px; cursor: pointer; }
#searchNav button:hover { border-color: #58a6ff; }
#searchNav button:disabled { opacity: 0.3; cursor: default; }
#searchCount { font-size: 11px; color: #8b949e; min-width: 36px; text-align: center; }
#stats { font-size: 12px; color: #8b949e; }
#sidebar { position: fixed; left: 0; top: 48px; width: 260px; height: calc(100vh - 48px); background: rgba(13,17,23,0.95); border-right: 1px solid #30363d; z-index: 5; overflow-y: auto; font-size: 11px; }
#sidebar::-webkit-scrollbar { width: 3px; }
#sidebar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }
#sidebar .cat-header { padding: 7px 14px 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6e7681; border-top: 1px solid #21262d; }
#sidebar .cat-header:first-child { border-top: none; }
#sidebar .pkg-item { padding: 3px 10px 3px 18px; cursor: pointer; display: flex; align-items: center; gap: 6px; border-left: 2px solid transparent; color: #8b949e; }
#sidebar .pkg-item:hover { background: rgba(255,255,255,0.04); color: #c9d1d9; }
#sidebar .pkg-item.active { background: rgba(88,166,255,0.1); border-left-color: #58a6ff; color: #e6edf3; }
#sidebar .pkg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
#sidebar .pkg-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.legend { position: fixed; top: 56px; right: 12px; background: rgba(22,27,34,0.92); border-radius: 6px; padding: 10px 14px; border: 1px solid #30363d; z-index: 10; font-size: 11px; line-height: 1.8; max-height: 70vh; overflow-y: auto; }
.legend .leg-item { display: flex; align-items: center; gap: 8px; }
.legend .leg-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend .leg-line { width: 18px; height: 2px; flex-shrink: 0; }
.legend .leg-dashed { border-top: 1.5px dashed #8b949e; width: 18px; }
.legend .leg-dotted { border-top: 1.5px dotted #8b949e; width: 18px; }
.legend .leg-section { font-size: 10px; color: #6e7681; padding-top: 6px; margin-top: 2px; border-top: 1px solid #21262d; }
#tooltip { position: fixed; background: rgba(22,27,34,0.97); border-radius: 8px; padding: 14px; color: #c9d1d9; border: 1px solid #30363d; max-width: 420px; max-height: 80vh; overflow-y: auto; z-index: 20; display: none; line-height: 1.5; font-size: 12px; pointer-events: auto; }
#tooltip h3 { font-size: 13px; color: #f0f6fc; word-break: break-all; margin-bottom: 6px; }
#tooltip .tt-section { font-size: 10px; color: #6e7681; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; margin-bottom: 2px; }
#tooltip .tt-item { padding: 1px 0; color: #8b949e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#tooltip .tt-item .arrow { color: #58a6ff; margin: 0 4px; }
#ctxMenu { position: fixed; background: #1c2128; border-radius: 10px; padding: 6px 0; border: 1px solid #373e47; z-index: 30; display: none; min-width: 200px; box-shadow: 0 12px 36px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset; backdrop-filter: blur(12px); animation: ctxIn 0.12s ease-out; }
@keyframes ctxIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
#ctxMenu .mi { padding: 7px 16px; cursor: pointer; display: flex; align-items: center; gap: 10px; user-select: none; transition: all 0.1s; font-size: 12px; }
#ctxMenu .mi:hover { background: #2d333b; color: #f0f6fc; }
#ctxMenu .mi:active { background: #1f6feb; color: #fff; }
#ctxMenu .mi-header { padding: 5px 16px 4px; font-size: 10px; color: #6e7681; text-transform: uppercase; letter-spacing: 0.5px; pointer-events: none; }
#ctxMenu .mi .mi-count { margin-left: auto; font-size: 10px; background: #2d333b; border-radius: 10px; padding: 1px 7px; }
#directionHint { position: fixed; bottom: 20px; left: 280px; z-index: 10; display: flex; align-items: center; gap: 8px; background: rgba(22,27,34,0.92); border: 1px solid #30363d; border-radius: 6px; padding: 8px 14px; font-size: 12px; color: #8b949e; }
#directionHint .dir-arrow { color: #58a6ff; font-size: 16px; }
#toast { position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); background: #1f6feb; color: #fff; padding: 8px 20px; border-radius: 8px; font-size: 13px; z-index: 50; opacity: 0; transition: opacity 0.2s; pointer-events: none; white-space: nowrap; }
#toast.show { opacity: 1; }
</style>
</head>
<body oncontextmenu="return false">

<div id="header">
  <h1>iTwin2026 包依赖关系图 — 分层布局</h1>
  <div class="header-right">
    <div id="searchWrap">
      <input id="searchInput" placeholder="搜索包名..." oninput="doSearch()" onkeydown="onSearchKey(event)">
      <div id="searchNav">
        <button id="btnPrev" onclick="searchPrev()" disabled>▲</button>
        <button id="btnNext" onclick="searchNext()" disabled>▼</button>
      </div>
      <span id="searchCount"></span>
    </div>
    <span id="stats">${Object.keys(PACKAGES).length}内部包 + ${externalPkgs.size}外部包 · ${validEdges.length}条依赖</span>
  </div>
</div>

<div id="sidebar"></div>
<canvas id="canvas"></canvas>

<div class="legend" id="legend"></div>
<div id="tooltip"></div>
<div id="ctxMenu"></div>
<div id="directionHint">
  <span>Layer 0 基础层</span>
  <span class="dir-arrow">▼</span>
  <span>依赖方向 ▼</span>
  <span class="dir-arrow">▼</span>
  <span>Layer ${maxLayer} 应用层</span>
</div>
<div id="toast"></div>

<script>
const EMBED = ${EMBED};
const nodeDefs = EMBED.nodeDefs;
const edgeDefs = EMBED.edgeDefs;
const sidebarGroups = EMBED.sidebarGroups;
const spOrder = EMBED.spOrder;
const SUB_COLORS = EMBED.subColors;
const maxLayer = EMBED.maxLayer;

// ── Layout params ─────────────────────────────────────────────────────
const LAYER_GAP = 180;   // vertical space between layers
const LAYER_WIDTH = 2200; // horizontal spread within each layer

// ── Initialize nodes with layer-based positions ───────────────────────
const nodes = nodeDefs.map((n, i) => {
  const layer = n[7]; // depth layer
  const countInLayer = EMBED.layerGroups[layer] ? EMBED.layerGroups[layer].length : 1;
  const idxInLayer = EMBED.layerGroups[layer] ? EMBED.layerGroups[layer].indexOf(n[1]) : 0;
  return {
    id: i,
    label: n[1],
    group: n[2],
    title: n[3],
    baseR: n[4],
    subproject: n[5],
    color: n[6],
    layer: layer,
    isExternal: n[8] || false,
    // Y = layer * gap (layer 0 at top, higher layers below)
    // X = spread evenly within this layer
    targetY: -(maxLayer / 2) * LAYER_GAP + layer * LAYER_GAP,
    targetX: (idxInLayer / Math.max(1, countInLayer - 1) - 0.5) * LAYER_WIDTH,
    x: (Math.random() - 0.5) * 600,
    y: -(maxLayer / 2) * LAYER_GAP + layer * LAYER_GAP + (Math.random() - 0.5) * 60,
    vx: 0, vy: 0,
    anchorX: (idxInLayer / Math.max(1, countInLayer - 1) - 0.5) * LAYER_WIDTH,
  };
});

const nodeById = {};
nodes.forEach(n => { nodeById[n.id] = n; });

const edges = edgeDefs.map(e => ({ from: e[0], to: e[1], style: e[2] }));

const outEdges = {}, inEdges = {};
nodes.forEach(n => { outEdges[n.id] = []; inEdges[n.id] = []; });
edges.forEach(e => {
  if (outEdges[e.from]) outEdges[e.from].push(e);
  if (inEdges[e.to]) inEdges[e.to].push(e);
});

// ── Canvas ────────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight - 48; }
resize();
window.addEventListener('resize', resize);

// ── Camera ────────────────────────────────────────────────────────────
let camX = 0, camY = 0, zoom = 0.45, targetCamX = 0, targetCamY = 0;
let userPanned = false;

function worldToScreen(wx, wy) {
  return [(wx + camX) * zoom + canvas.width / 2, (wy + camY) * zoom + canvas.height / 2];
}
function screenToWorld(sx, sy) {
  return [(sx - canvas.width / 2) / zoom - camX, (sy - canvas.height / 2) / zoom - camY];
}

// ── Input ─────────────────────────────────────────────────────────────
let selectedNode = null, hoveredNode = null;
let dragging = false, panning = false, dragNode = null;
let lastMouseX = 0, lastMouseY = 0;
let tooltipVisible = false;
let searchMatched = [], searchIdx = -1, searchNodeId = null;
let toastMsg = '', toastTimer = 0;

canvas.addEventListener('mousedown', e => {
  const [wx, wy] = screenToWorld(e.offsetX, e.offsetY);
  const hit = hitTest(wx, wy);
  if (e.button === 0) {
    if (hit !== null) { dragging = true; dragNode = hit; selectNode(hit); }
    else { panning = true; selectNode(null); }
    lastMouseX = e.offsetX; lastMouseY = e.offsetY;
  }
});
canvas.addEventListener('mousemove', e => {
  const [wx, wy] = screenToWorld(e.offsetX, e.offsetY);
  if (dragging && dragNode !== null) {
    const n = nodeById[dragNode];
    n.x = wx; n.y = wy; n.vx = 0; n.vy = 0;
    userPanned = true;
  } else if (panning) {
    camX -= (e.offsetX - lastMouseX) / zoom;
    camY -= (e.offsetY - lastMouseY) / zoom;
    lastMouseX = e.offsetX; lastMouseY = e.offsetY;
    userPanned = true;
  } else {
    const hit = hitTest(wx, wy);
    hoveredNode = hit;
    canvas.style.cursor = hit !== null ? 'pointer' : 'grab';
    if (hit !== null && !dragging) showTooltip(e.clientX, e.clientY, hit);
    else if (!tooltipVisible) hideTooltip();
  }
});
canvas.addEventListener('mouseup', () => {
  if (dragNode !== null) { nodeById[dragNode].anchorX = nodeById[dragNode].x; }
  dragging = false; panning = false; dragNode = null;
});
canvas.addEventListener('mouseleave', () => { dragging = false; panning = false; dragNode = null; hideTooltip(); });
canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.max(0.04, Math.min(6, zoom * (e.deltaY < 0 ? 1.08 : 0.92))); });
canvas.addEventListener('dblclick', () => { targetCamX = 0; targetCamY = 0; zoom = 0.45; userPanned = false; });
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  const [wx, wy] = screenToWorld(e.offsetX, e.offsetY);
  const hit = hitTest(wx, wy);
  if (hit !== null) showContextMenu(e.clientX, e.clientY, hit);
  else hideContextMenu();
});
document.addEventListener('click', e => { if (!e.target.closest('#ctxMenu') && !e.target.closest('#tooltip')) hideContextMenu(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { selectNode(null); hideContextMenu(); hideTooltip(); document.getElementById('searchInput').value = ''; doSearch(); }
});

function hitTest(wx, wy) {
  let best = null, bestDist = Infinity;
  for (const n of nodes) {
    const dist = Math.hypot(wx - n.x, wy - n.y);
    const rScreen = Math.max(6, n.baseR * zoom);
    if (dist * zoom < rScreen * 2.2 + 18 / zoom && dist < bestDist) { bestDist = dist; best = n.id; }
  }
  return best;
}

function copyLayerPackages(layer) {
  const pkgs = EMBED.layerGroups[layer] || [];
  const text = pkgs.join('\\n');
  navigator.clipboard.writeText(text).then(() => {
    hideContextMenu();
    showToast('已复制 Layer ' + layer + ' 的 ' + pkgs.length + ' 个包名');
  }).catch(() => {});
}
function showToast(msg) {
  toastMsg = msg;
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); toastMsg = ''; }, 2000);
}
function selectNode(id) { selectedNode = id; updateSidebarActive(); hideTooltip(); }
function updateSidebarActive() {
  document.querySelectorAll('#sidebar .pkg-item').forEach(el => el.classList.toggle('active', el.dataset.id == selectedNode));
}

// ── Tooltip ───────────────────────────────────────────────────────────
function showTooltip(cx, cy, nodeId) {
  const n = nodeById[nodeId];
  const out = outEdges[nodeId] || [], inn = inEdges[nodeId] || [];
  const outList = out.slice(0, 30).map(e => nodeById[e.to].label).sort();
  const inList = inn.slice(0, 30).map(e => nodeById[e.from].label).sort();

  const tt = document.getElementById('tooltip');
  let html = '<h3>' + n.label + '</h3>';
  html += '<div style="font-size:11px;color:#8b949e">' + n.title.replace(/\\n/g, '<br>') + '</div>';
  html += '<div style="font-size:11px;color:#58a6ff;margin-top:4px">第 ' + n.layer + ' 层 (依赖深度)</div>';
  if (outList.length > 0) {
    html += '<div class="tt-section">依赖以下包 (' + out.length + ')</div>';
    html += outList.map(l => '<div class="tt-item"><span class="arrow">→</span>' + l + '</div>').join('');
    if (out.length > 30) html += '<div class="tt-item" style="color:#6e7681">...还有 ' + (out.length - 30) + ' 个</div>';
  }
  if (inList.length > 0) {
    html += '<div class="tt-section">被以下包依赖 (' + inn.length + ')</div>';
    html += inList.map(l => '<div class="tt-item"><span class="arrow">←</span>' + l + '</div>').join('');
    if (inn.length > 30) html += '<div class="tt-item" style="color:#6e7681">...还有 ' + (inn.length - 30) + ' 个</div>';
  }
  tt.innerHTML = html;
  tt.style.display = 'block';
  tt.style.left = Math.min(cx + 15, window.innerWidth - 440) + 'px';
  tt.style.top = Math.min(cy + 10, window.innerHeight - 400) + 'px';
  tooltipVisible = true;
}
function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; tooltipVisible = false; }

// ── Context Menu ──────────────────────────────────────────────────────
function showContextMenu(cx, cy, nodeId) {
  const n = nodeById[nodeId];
  const out = outEdges[nodeId] || [], inn = inEdges[nodeId] || [];
  const layerCount = (EMBED.layerGroups[n.layer] || []).length;
  const menu = document.getElementById('ctxMenu');
  menu.innerHTML =
    '<div class="mi-header">' + n.label + ' (层' + n.layer + ')</div>' +
    '<div class="mi" onclick="copyPkgName(' + nodeId + ')">📋 复制包名</div>' +
    '<div class="mi" onclick="copyLayerPackages(' + n.layer + ')"><span>📦 复制 Layer ' + n.layer + ' 全部包名</span><span class="mi-count">' + layerCount + '</span></div>' +
    '<div class="mi" onclick="flyTo(' + nodeId + ')">🔍 聚焦此节点</div>' +
    '<div class="mi" onclick="showAllDeps(' + nodeId + ')"><span>→ 展开依赖</span><span class="mi-count">' + out.length + '</span></div>' +
    '<div class="mi" onclick="showAllRevDeps(' + nodeId + ')"><span>← 展开反向依赖</span><span class="mi-count">' + inn.length + '</span></div>';
  menu.style.display = 'block';
  menu.style.left = Math.min(cx, window.innerWidth - 240) + 'px';
  menu.style.top = Math.min(cy, window.innerHeight - 200) + 'px';
  menu.style.minWidth = '240px';
}
function hideContextMenu() { document.getElementById('ctxMenu').style.display = 'none'; }
function copyPkgName(nodeId) { const n = nodeById[nodeId]; navigator.clipboard.writeText(n.label).then(() => { hideContextMenu(); }).catch(() => {}); }
function flyTo(nodeId) { const n = nodeById[nodeId]; targetCamX = -n.x; targetCamY = -n.y; userPanned = false; selectNode(nodeId); hideContextMenu(); }
function showAllDeps(nodeId) { const n = nodeById[nodeId]; const [sx, sy] = worldToScreen(n.x, n.y); showTooltip(sx + 20, sy + 20, nodeId); hideContextMenu(); }
function showAllRevDeps(nodeId) { const n = nodeById[nodeId]; const [sx, sy] = worldToScreen(n.x, n.y); showTooltip(sx + 20, sy + 20, nodeId); hideContextMenu(); }

// ── Sidebar ───────────────────────────────────────────────────────────
function buildSidebar(filterText) {
  const sb = document.getElementById('sidebar');
  let html = '';
  for (const sp of spOrder) {
    const pkgs = sidebarGroups[sp] || [];
    const subInfo = SUB_COLORS[sp] || { color: '#90a4ae', label: sp };
    const visiblePkgs = filterText ? pkgs.filter(n => n[1].toLowerCase().includes(filterText)) : pkgs;
    if (visiblePkgs.length === 0) continue;
    html += '<div class="cat-header">' + subInfo.label + ' (' + visiblePkgs.length + '/' + pkgs.length + ')</div>';
    for (const n of visiblePkgs) {
      const cls = (selectedNode === n[0]) ? ' active' : '';
      html += '<div class="pkg-item' + cls + '" data-id="' + n[0] + '" onclick="sidebarClick(' + n[0] + ', event)" oncontextmenu="sidebarRightClick(' + n[0] + ', event)">';
      html += '<span class="pkg-dot" style="background:' + n[6] + '"></span>';
      html += '<span class="pkg-name" title="' + n[1] + ' (层' + n[7] + ')">' + n[1] + '</span>';
      html += '</div>';
    }
  }
  sb.innerHTML = html || '<div style="padding:14px;color:#6e7681;font-size:11px">无匹配结果</div>';
}
function sidebarClick(nodeId, event) { flyTo(nodeId); }
function sidebarRightClick(nodeId, event) { event.preventDefault(); showContextMenu(event.clientX, event.clientY, nodeId); }

// ── Search ────────────────────────────────────────────────────────────
function doSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  if (!q) { searchMatched = []; searchIdx = -1; searchNodeId = null; document.getElementById('searchCount').textContent = ''; document.getElementById('btnPrev').disabled = true; document.getElementById('btnNext').disabled = true; buildSidebar(''); return; }
  searchMatched = nodes.filter(n => n.label.toLowerCase().includes(q)).map(n => n.id);
  searchIdx = searchMatched.length > 0 ? 0 : -1;
  updateSearch();
}
function updateSearch() {
  const count = searchMatched.length;
  document.getElementById('searchCount').textContent = count > 0 ? (searchIdx + 1) + '/' + count : '0/0';
  document.getElementById('btnPrev').disabled = count <= 1; document.getElementById('btnNext').disabled = count <= 1;
  if (count > 0 && searchIdx >= 0) { searchNodeId = searchMatched[searchIdx]; flyTo(searchNodeId); selectNode(searchNodeId); }
  else { searchNodeId = null; }
  buildSidebar(document.getElementById('searchInput').value.toLowerCase().trim());
}
function searchNext() { if (searchMatched.length < 2) return; searchIdx = (searchIdx + 1) % searchMatched.length; updateSearch(); }
function searchPrev() { if (searchMatched.length < 2) return; searchIdx = (searchIdx - 1 + searchMatched.length) % searchMatched.length; updateSearch(); }
function onSearchKey(e) { if (e.key === 'Enter') { if (searchMatched.length > 0 && searchIdx < 0) { searchIdx = 0; updateSearch(); } else searchNext(); } if (e.key === 'Escape') { document.getElementById('searchInput').value = ''; doSearch(); } }

// ── Legend ────────────────────────────────────────────────────────────
function buildLegend() {
  const leg = document.getElementById('legend');
  let html = '<div style="font-weight:600;margin-bottom:4px">Layer ▼ 子项目</div>';
  for (const [sp, info] of Object.entries(SUB_COLORS)) {
    html += '<div class="leg-item"><span class="leg-dot" style="background:' + info.color + '"></span>' + info.label + '</div>';
  }
  html += '<div class="leg-section">外部包类型</div>';
  html += '<div class="leg-item"><span class="leg-dot" style="background:#484f58;border:1px solid #6e7681"></span> 核心外部包</div>';
  html += '<div class="leg-item"><span class="leg-dot" style="background:#484f58;border:1px dashed #6e7681;opacity:0.6;width:7px;height:7px"></span> 边缘外部包 (≤2依赖)</div>';
  html += '<div class="leg-section">依赖类型</div>';
  html += '<div class="leg-item"><span class="leg-line" style="background:#8b949e"></span> dependencies</div>';
  html += '<div class="leg-item"><span class="leg-dashed"></span> peerDependencies</div>';
  html += '<div class="leg-item"><span class="leg-dotted"></span> devDependencies</div>';
  leg.innerHTML = html;
}
buildLegend();
buildSidebar('');

// ── Physics (layer-constrained) ───────────────────────────────────────
const REP = 8000, SLEN = 200, SK = 0.02, MV = 10;
const LAYER_ANCHOR = 0.5; // strong vertical pull toward layer targetY
const DAMP = 0.75;
let physAlpha = 1.0;

function stepPhysics() {
  for (const n of nodes) {
    if (dragging && dragNode === n.id) continue;
    let fx = 0, fy = 0;

    // Repulsion (vertical only to prevent overlap, horizontal is free)
    for (const m of nodes) {
      if (m.id === n.id) continue;
      const dx = n.x - m.x, dy = n.y - m.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const force = REP / (d * d);
      fy += (dy / d) * force * 0.3;
    }

    // Edge spring (vertical only)
    const allEdges = [...(outEdges[n.id] || []), ...(inEdges[n.id] || [])];
    for (const e of allEdges) {
      const other = nodeById[e.from === n.id ? e.to : e.from];
      const dx = other.x - n.x, dy = other.y - n.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const force = (d - SLEN) * SK;
      fy += (dy / d) * force * 0.6;
    }

    // X: completely free, lock vx
    n.vx = 0;

    n.vx = Math.max(-MV, Math.min(MV, (n.vx + fx * physAlpha) * DAMP));
    n.vy = Math.max(-MV, Math.min(MV, (n.vy + fy * physAlpha) * DAMP));
    n.x += n.vx;
    n.y += n.vy;
  }
  if (physAlpha > 0.001) physAlpha *= 0.992;

  // Direct snap-back to layer + lock horizontal when physics settled
  const settled = physAlpha < 0.01;
  for (const n of nodes) {
    if (dragging && dragNode === n.id) continue;
    // Vertical: always snap back to layer
    if (Math.abs(n.y - n.targetY) > 0.5) {
      n.y += (n.targetY - n.y) * 0.25;
      n.vy *= 0.3;
    }
    // Horizontal: lock in place once physics settles
    if (settled) {
      n.vx = 0;
    }
  }
}

// ── Render ────────────────────────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!userPanned && !dragging) {
    camX += (targetCamX - camX) * 0.05;
    camY += (targetCamY - camY) * 0.05;
  }

  const searchMode = searchMatched.length > 0;
  const searchSet = searchMode ? new Set(searchMatched) : null;

  // ── Draw layer bands ────────────────────────────────────────────
  for (let layer = 0; layer <= maxLayer; layer++) {
    const layerY = -(maxLayer / 2) * LAYER_GAP + layer * LAYER_GAP;
    const [sx1, sy1] = worldToScreen(-LAYER_WIDTH, layerY - LAYER_GAP * 0.45);
    const [, sy2] = worldToScreen(LAYER_WIDTH, layerY + LAYER_GAP * 0.45);

    ctx.fillStyle = 'rgba(48,54,61,' + (layer % 2 === 0 ? 0.08 : 0.15) + ')';
    ctx.fillRect(0, sy1, canvas.width, sy2 - sy1);

    // Layer label (right side)
    const [lx,] = worldToScreen(LAYER_WIDTH * 0.55, layerY);
    ctx.fillStyle = '#484f58';
    ctx.font = Math.max(9, 12 * zoom) + 'px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const label = 'Layer ' + layer + '  (' + (EMBED.layerGroups[layer]?.length || 0) + ' 包)';
    const desc = layer === 0 ? ' — 无内部依赖（基础层）'
               : layer === maxLayer ? ' — 依赖最深（应用层）'
               : ' — 依赖深度 ' + layer;
    ctx.fillText(label + desc, Math.min(canvas.width - 10, lx), sy1 + 14 * zoom);
  }

  // ── Draw edges ──────────────────────────────────────────────────
  for (const e of edges) {
    const fromNode = nodeById[e.from], toNode = nodeById[e.to];
    if (!fromNode || !toNode) continue;
    let alpha = 0.35;
    if (searchMode) alpha = (searchSet.has(e.from) || searchSet.has(e.to)) ? 0.5 : 0.04;
    if (selectedNode !== null) {
      if (e.from !== selectedNode && e.to !== selectedNode) alpha = Math.min(alpha, 0.04);
      else alpha = 0.65;
    }

    const [x1, y1] = worldToScreen(fromNode.x, fromNode.y);
    const [x2, y2] = worldToScreen(toNode.x, toNode.y);

    ctx.beginPath();
    if (e.style === 'dashed') ctx.setLineDash([6, 4]);
    else if (e.style === 'dotted') ctx.setLineDash([2, 4]);
    else ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(139,148,158,' + alpha + ')';
    ctx.lineWidth = 0.8;
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrowhead (pointing to dependent = downward)
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const toR = Math.max(6, toNode.baseR * zoom);
    const ax = x2 - Math.cos(angle) * toR;
    const ay = y2 - Math.sin(angle) * toR;
    const aSize = 5 * zoom;
    ctx.beginPath();
    ctx.fillStyle = 'rgba(139,148,158,' + alpha + ')';
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - Math.cos(angle - 0.5) * aSize, ay - Math.sin(angle - 0.5) * aSize);
    ctx.lineTo(ax - Math.cos(angle + 0.5) * aSize, ay - Math.sin(angle + 0.5) * aSize);
    ctx.closePath();
    ctx.fill();
  }

  // ── Draw nodes ───────────────────────────────────────────────────
  for (const n of nodes) {
    const [sx, sy] = worldToScreen(n.x, n.y);
    const r = Math.max(6, n.baseR * zoom);
    let alpha = 1;
    if (searchMode && !searchSet.has(n.id)) alpha = 0.12;
    if (selectedNode !== null && n.id !== selectedNode) {
      const connected = outEdges[selectedNode]?.some(e => e.to === n.id) ||
                        inEdges[selectedNode]?.some(e => e.from === n.id);
      if (!connected) alpha = Math.min(alpha, 0.12);
    }
    if (alpha < 0.12) continue;

    // Glow
    if (n.id === selectedNode || n.id === searchNodeId) {
      ctx.beginPath(); ctx.arc(sx, sy, r + 8 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(88,166,255,0.2)'; ctx.fill();
      ctx.beginPath(); ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
      ctx.arc(sx, sy, r + 4 * zoom, 0, Math.PI * 2); ctx.stroke();
    }

    // Node circle
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2);
    const hex = n.color;
    const isEdge = n[9];  // isEdgeExternal
    const extAlpha = n.isExternal ? (isEdge ? 0.28 : 0.45) : 1;
    ctx.fillStyle = 'rgba(' + parseInt(hex.slice(1,3),16) + ',' + parseInt(hex.slice(3,5),16) + ',' + parseInt(hex.slice(5,7),16) + ',' + (alpha * extAlpha) + ')';
    ctx.fill();
    if (isEdge) {
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = 'rgba(72,79,88,' + (alpha * 0.35) + ')';
    } else if (n.isExternal) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(72,79,88,' + (alpha * 0.6) + ')';
    } else {
      ctx.setLineDash([]);
      ctx.strokeStyle = selectedNode === n.id ? '#fff' : 'rgba(255,255,255,' + (alpha * 0.3) + ')';
    }
    ctx.lineWidth = selectedNode === n.id ? 2 : 0.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = 'rgba(201,209,217,' + (alpha * (isEdge ? 0.35 : n.isExternal ? 0.5 : 1)) + ')';
    ctx.font = Math.max(7, 7.5 * zoom) + 'px -apple-system, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(n.label, sx, sy + r + 2 * zoom);
  }
}

// ── Main loop ─────────────────────────────────────────────────────────
function loop() { stepPhysics(); render(); requestAnimationFrame(loop); }
loop();
</script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'dep-graph.html'), HTML);
console.log('Written dep-graph.html');
console.log('Packages: ' + Object.keys(PACKAGES).length + ' + ' + externalPkgs.size + ' external, Edges: ' + validEdges.length + ', Layers: ' + (maxLayer + 1));
for (let l = 0; l <= maxLayer; l++) {
  console.log('  Layer ' + l + ': ' + (layerGroups[l]?.length || 0) + ' packages');
}

// ── Generate dep-layers.md ───────────────────────────────────────────────
let md = '# iTwin2026 包依赖分层总览\n\n';
md += '> 生成时间：' + new Date().toISOString() + '\n';
md += '> 共 ' + Object.keys(PACKAGES).length + ' 个内部包 + ' + externalPkgs.size + ' 个外部引用，' + validEdges.length + ' 条依赖边，' + (maxLayer + 1) + ' 层\n';
md += '> \n';
md += '> **Layer 0 = 基础层（不依赖任何内部包），Layer ' + maxLayer + ' = 应用层（依赖最深）**\n\n';
md += '---\n';

for (let l = 0; l <= maxLayer; l++) {
  const names = layerGroups[l] || [];
  const internalPkgs = names.filter(n => PACKAGES[n]);
  const externalPkgsInLayer = names.filter(n => !PACKAGES[n]);
  const total = internalPkgs.length + externalPkgsInLayer.length;

  md += '\n## Layer ' + l + ' — ' + total + ' 个包（内部 ' + internalPkgs.length + ' + 外部 ' + externalPkgsInLayer.length + '）\n\n';
  if (l === 0) {
    md += '> ⬆ 基础层：不依赖任何内部包，是整个仓库构建的起点\n\n';
  }
  if (l === maxLayer) {
    md += '> ⬇ 应用层：依赖链最深\n\n';
  }

  md += '| # | 包名 | 目录 | 子项目 | 版本 | 类型 |\n';
  md += '|---|------|------|--------|------|------|\n';

  let idx = 0;
  for (const name of internalPkgs) {
    idx++;
    const p = PACKAGES[name];
    md += '| ' + idx + ' | ' + name + ' | ' + (p.dir || '') + ' | ' + (p.subproject || '') + ' | ' + (p.version || '') + ' | 内部 |\n';
  }
  for (const name of externalPkgsInLayer) {
    idx++;
    const tag = edgeExternal.has(name) ? '外部·边缘' : '外部';
    md += '| ' + idx + ' | ' + name + ' | (外部 npm 包) | external | | ' + tag + ' |\n';
  }
}

fs.writeFileSync(path.join(__dirname, 'dep-layers.md'), md);
console.log('Written dep-layers.md');
