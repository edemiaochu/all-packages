#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function getArgValue(name) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.slice(`--${name}=`.length) : undefined;
}

const repoRootStr = getArgValue("repo-root");
const repoRoot = repoRootStr
  ? path.resolve(repoRootStr)
  : path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

const outputStr = getArgValue("output");
const outputPath = outputStr
  ? path.resolve(outputStr)
  : path.resolve(fileURLToPath(new URL("brand-words.json", import.meta.url)));

const NO_MENTIONS = process.argv.includes('--no-mentions');

const sourceExtensions = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mts", ".cts",
  ".md", ".json", ".html", ".css", ".scss", ".less",
  ".py", ".sh", ".bat", ".ps1", ".yml", ".yaml", ".xml",
]);

const skippedDirectories = new Set([
  ".git", ".rush", "node_modules", "common/temp",
  "lib", "cjs", "esm", "dist", "build", "coverage", "obj", "bin",
]);

// 生成一个单词的全部大小写排列（2^n 种）
function allCaseVariations(word) {
  const results = [];
  const n = word.length;
  const total = 1 << n; // 2^n
  for (let mask = 0; mask < total; mask++) {
    let variant = '';
    for (let bit = 0; bit < n; bit++) {
      const ch = word[bit];
      variant += (mask & (1 << bit)) ? ch.toUpperCase() : ch.toLowerCase();
    }
    results.push(variant);
  }
  return results;
}

function buildBrandRegex(word) {
  const variants = allCaseVariations(word);
  // 按长度降序排，长变体优先匹配
  variants.sort((a, b) => b.length - a.length);
  const escaped = variants.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp('\\b(' + escaped.join('|') + ')\\b', 'g');
}

const brandPatterns = [
  { label: "iTwin",  regex: buildBrandRegex("iTwin") },
  { label: "iModel", regex: buildBrandRegex("iModel") },
  { label: "Bentley", regex: buildBrandRegex("Bentley") },
];

function normalizeRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function shouldSkipDirectory(absDir) {
  const rel = normalizeRelative(absDir);
  if (!rel) return false;
  const parts = rel.split("/");
  return parts.some((part) => skippedDirectories.has(part)) || skippedDirectories.has(rel);
}

function walkFiles(dir, files = [], dirNames = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return { files, dirNames };
  }
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Collect directory name for brand-word extraction
      dirNames.push({ name: entry.name, path: normalizeRelative(abs) });
      if (!shouldSkipDirectory(abs)) walkFiles(abs, files, dirNames);
      continue;
    }
    if (entry.isFile()) files.push(abs);
  }
  return { files, dirNames };
}

/** Extract brand-related words from file content (both identifiers and plain mentions) */
function extractBrandWords(text, relPath) {
  const hits = [];
  for (const { label, regex } of brandPatterns) {
    const copy = new RegExp(regex.source, regex.flags);
    for (const m of text.matchAll(copy)) {
      hits.push({
        brand: label,
        word: m[1],
        context: (text.substring(Math.max(0, m.index - 30), m.index + m[1].length + 30)
          .replace(/\s+/g, " ").trim()),
        file: relPath,
      });
    }
  }
  return hits;
}

/** Extract identifiers containing brand words (split out for clearer categorization) */
function extractBrandIdentifiers(text, relPath) {
  const idRegex = /\b([A-Za-z_$][\w$]*)\b/g;
  const identifiers = [];
  const seen = new Set();
  for (const m of text.matchAll(idRegex)) {
    const name = m[1];
    const lower = name.toLowerCase();
    if ((lower.includes("itwin") || lower.includes("imodel") || lower.includes("bentley"))
        && !seen.has(name)) {
      seen.add(name);
      identifiers.push({ name, file: relPath });
    }
  }
  return identifiers;
}

/** Extract brand words from directory names.
 *  Directory names often contain hyphens (e.g. itwinjs-core, itwin-platform-access),
 *  so we split on non-alpha chars and check each segment. Also checks the full name
 *  as a mention (for the brand regex). */
function extractBrandFromDirNames(dirNames) {
  const identifiers = [];
  const mentions = [];
  const seenIds = new Set();

  for (const { name, path: dirPath } of dirNames) {
    // 1. Full-name mention check via brand regex
    for (const { label, regex } of brandPatterns) {
      const copy = new RegExp(regex.source, regex.flags);
      for (const m of name.matchAll(copy)) {
        mentions.push({
          brand: label,
          word: m[1],
          context: '目录名: ' + dirPath,
          file: dirPath + '/',
        });
      }
    }

    // 2. Split on non-alpha chars and check each segment for brand substrings
    const segments = name.split(/[^A-Za-z0-9]+/).filter(Boolean);
    for (const seg of segments) {
      const lower = seg.toLowerCase();
      if ((lower.includes("itwin") || lower.includes("imodel") || lower.includes("bentley"))
          && !seenIds.has(seg)) {
        seenIds.add(seg);
        identifiers.push({ name: seg, file: dirPath + '/' });
      }
    }
  }

  return { identifiers, mentions };
}

console.log("Scanning files and directories...");
const { files: allFiles, dirNames: allDirNames } = walkFiles(repoRoot);
allFiles.sort((a, b) => normalizeRelative(a).localeCompare(normalizeRelative(b)));

const allHits = [];
const allIdentifiers = [];

let scanned = 0;
for (const file of allFiles) {
  const relPath = normalizeRelative(file);
  const ext = path.extname(file);
  if (!sourceExtensions.has(ext)) continue;

  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }

  scanned++;
  if (!NO_MENTIONS) {
    for (const hit of extractBrandWords(text, relPath)) allHits.push(hit);
  }
  for (const id of extractBrandIdentifiers(text, relPath)) allIdentifiers.push(id);
}

// Extract brand words from directory names
const dirResult = extractBrandFromDirNames(allDirNames);
if (!NO_MENTIONS) {
  for (const hit of dirResult.mentions) allHits.push(hit);
}
for (const id of dirResult.identifiers) allIdentifiers.push(id);

console.log(`Files scanned: ${scanned}`);
console.log(`Directories scanned: ${allDirNames.length}`);
console.log(`Dir mentions: ${dirResult.mentions.length}`);
console.log(`Dir identifiers: ${dirResult.identifiers.length}`);

// Group identifiers by brand category
function categorize(name) {
  const lower = name.toLowerCase();
  const cats = [];
  if (lower.includes("itwin")) cats.push("iTwin");
  if (lower.includes("imodel")) cats.push("iModel");
  if (lower.includes("bentley")) cats.push("Bentley");
  return cats.length > 0 ? cats : ["other"];
}

const byBrand = {};
for (const id of allIdentifiers) {
  const cats = categorize(id.name);
  for (const cat of cats) {
    if (!byBrand[cat]) byBrand[cat] = new Set();
    byBrand[cat].add(id.name);
  }
}

// File counts per brand
const fileCounts = {};
for (const hit of allHits) {
  fileCounts[hit.file] = (fileCounts[hit.file] ?? 0) + 1;
}

const result = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  summary: {
    totalFilesScanned: scanned,
    totalMentions: NO_MENTIONS ? 0 : allHits.length,
    totalUniqueIdentifiers: allIdentifiers.length,
    filesWithBrandWords: NO_MENTIONS ? 0 : Object.keys(fileCounts).length,
    byBrand: Object.fromEntries(
      Object.entries(byBrand).map(([k, v]) => [k, v.size])
    ),
  },
  identifiers: Object.fromEntries(
    Object.entries(byBrand).map(([k, v]) => [k, [...v].sort()])
  ),
};
if (!NO_MENTIONS) {
  result.mentions = allHits;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

console.log(`Scanned: ${scanned} files`);
console.log(`Mentions found: ${allHits.length}`);
console.log(`Unique identifiers: ${allIdentifiers.length}`);
console.log(`Wrote ${outputPath}`);
