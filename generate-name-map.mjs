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
  : path.resolve(fileURLToPath(new URL("name-map.json", import.meta.url)));

const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts"]);
const skippedDirectories = new Set([
  ".git",
  ".rush",
  "node_modules",
  "common/temp",
  "lib",
  "cjs",
  "esm",
  "dist",
  "build",
  "coverage",
  "obj",
  "bin",
]);

const identifierKeywords = new Set([
  // ECMAScript reserved words
  "break", "case", "catch", "class", "const", "continue", "debugger",
  "default", "delete", "do", "else", "enum", "export", "extends",
  "false", "finally", "for", "function", "if", "import", "in",
  "instanceof", "new", "null", "return", "super", "switch", "this",
  "throw", "true", "try", "typeof", "var", "void", "while", "with",
  "yield", "await",

  // Restricted bindings / globals / common built-in properties
  "arguments", "eval", "undefined", "NaN", "Infinity", "constructor",
  "length", "name", "prototype", "caller",

  // TypeScript keywords
  "abstract", "any", "as", "asserts", "bigint", "boolean", "declare",
  "from", "get", "global", "implements", "infer", "interface", "is",
  "keyof", "let", "module", "namespace", "never", "number", "object",
  "of", "package", "private", "protected", "public", "readonly",
  "require", "satisfies", "set", "static", "string", "symbol", "type",
  "typeof", "unique", "unknown", "using",

  // Math functions
  "abs", "acos", "acosh", "asin", "asinh", "atan", "atanh", "atan2",
  "cbrt", "ceil", "clz32", "cos", "cosh", "exp", "expm1", "floor",
  "fround", "hypot", "imul", "log", "log1p", "log2", "log10", "max",
  "min", "pow", "random", "round", "sign", "sin", "sinh", "sqrt",
  "tan", "tanh", "trunc",

  // Global functions
  "isFinite", "isNaN", "parseFloat", "parseInt",
  "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent",

  // Fundamental global constructors
  "Number", "String", "Boolean", "Symbol", "BigInt",

  // Common Object static methods
  "assign", "create", "defineProperty", "defineProperties", "entries",
  "freeze", "fromEntries", "getOwnPropertyDescriptor",
  "getOwnPropertyDescriptors", "getOwnPropertyNames",
  "getOwnPropertySymbols", "getPrototypeOf", "hasOwn", "isExtensible",
  "isFrozen", "isSealed", "keys", "preventExtensions", "seal",
  "setPrototypeOf", "values",

  // Common Array / String / Reflect / JSON / Promise methods
  "from", "isArray", "at", "concat", "copyWithin", "every", "fill",
  "filter", "find", "findIndex", "findLast", "findLastIndex",
  "flat", "flatMap", "forEach", "includes", "indexOf", "join",
  "lastIndexOf", "map", "pop", "push", "reduce", "reduceRight",
  "reverse", "shift", "slice", "some", "sort", "splice",
  "toReversed", "toSorted", "toSpliced", "unshift", "with",
  "charAt", "charCodeAt", "codePointAt", "endsWith", "isWellFormed",
  "localeCompare", "match", "matchAll", "normalize", "padEnd",
  "padStart", "repeat", "replace", "replaceAll", "search", "split",
  "startsWith", "substr", "substring", "toLocaleLowerCase",
  "toLocaleUpperCase", "toLowerCase", "toString", "toUpperCase",
  "toWellFormed", "trim", "trimEnd", "trimStart", "valueOf",
  "toLocaleString",
  "apply", "construct", "deleteProperty", "has", "ownKeys",
  "parse", "stringify",
  "all", "allSettled", "any", "race", "reject", "resolve",
  "withResolvers",

  // Global constructors / built-in objects
  "Error", "TypeError", "RangeError", "SyntaxError",
  "ReferenceError", "URIError", "EvalError", "AggregateError",
  "Map", "Set", "WeakMap", "WeakSet", "Date", "RegExp",
  "Array", "Object", "Function", "Proxy", "Reflect", "Intl",
  "WeakRef", "FinalizationRegistry",
  "ArrayBuffer", "SharedArrayBuffer", "DataView",
  "Uint8Array", "Uint8ClampedArray", "Int8Array",
  "Float32Array", "Float64Array", "Float16Array",
  "Int16Array", "Uint16Array", "Int32Array", "Uint32Array",
  "BigInt64Array", "BigUint64Array", "Atomics",

  // Common Web/global APIs (prevent accidental rename)
  "console", "fetch", "globalThis", "queueMicrotask",
  "structuredClone", "setTimeout", "clearTimeout", "setInterval",
  "clearInterval", "requestAnimationFrame", "cancelAnimationFrame",
  "Blob", "File", "FormData", "URL", "URLSearchParams",
  "TextEncoder", "TextDecoder",
]);

function normalizeRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}

function shouldSkipDirectory(absDir) {
  const rel = normalizeRelative(absDir);
  if (!rel) return false;
  const parts = rel.split("/");
  return parts.some((part) => skippedDirectories.has(part)) || skippedDirectories.has(rel);
}

function walkFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(abs)) walkFiles(abs, files);
      continue;
    }
    if (entry.isFile()) files.push(abs);
  }
  return files;
}

function stripCommentsAndStrings(text) {
  let output = "";
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") {
        output += " ";
        i += 1;
      }
      continue;
    }

    if (char === "/" && next === "*") {
      output += "  ";
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        output += text[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      if (i < text.length) {
        output += "  ";
        i += 2;
      }
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      const quote = char;
      output += " ";
      i += 1;
      while (i < text.length) {
        if (text[i] === "\\") {
          output += " ";
          i += 1;
          if (i < text.length) {
            output += text[i] === "\n" ? "\n" : " ";
            i += 1;
          }
          continue;
        }
        if (text[i] === quote) {
          output += " ";
          i += 1;
          break;
        }
        output += text[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      continue;
    }

    output += char;
    i += 1;
  }

  return output;
}

function addIdentifier(found, kind, name, relPath) {
  if (!name || identifierKeywords.has(name)) return;
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) return;
  const key = name;
  const item = found.get(key) ?? { kind: "identifier", oldName: name, observedKinds: new Set(), files: new Set() };
  item.observedKinds.add(kind);
  item.files.add(relPath);
  found.set(key, item);
}

function extractIdentifiers(text, relPath, found) {
  const code = stripCommentsAndStrings(text);

  for (const match of code.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)) {
    addIdentifier(found, "class", match[1], relPath);
  }
  for (const match of code.matchAll(/\binterface\s+([A-Za-z_$][\w$]*)/g)) {
    addIdentifier(found, "interface", match[1], relPath);
  }
  for (const match of code.matchAll(/\benum\s+([A-Za-z_$][\w$]*)/g)) {
    addIdentifier(found, "enum", match[1], relPath);
  }
  for (const match of code.matchAll(/\btype\s+([A-Za-z_$][\w$]*)\s*=/g)) {
    addIdentifier(found, "type", match[1], relPath);
  }
  for (const match of code.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)) {
    addIdentifier(found, "function", match[1], relPath);
  }

  for (const match of code.matchAll(/\b(?:const|let|var)\s+([^;\n]+)/g)) {
    const declaration = match[1].split("=")[0];
    for (const nameMatch of declaration.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)) {
      addIdentifier(found, "variable", nameMatch[1], relPath);
    }
  }
}

const semanticWordMap = new Map(Object.entries({
  app: "program",
  application: "program",
  arc: "curve",
  args: "options",
  backend: "server",
  base: "root",
  batch: "group",
  batched: "grouped",
  builder: "assembler",
  cache: "store",
  cached: "stored",
  canvas: "surface",
  class: "category",
  client: "consumer",
  code: "key",
  common: "shared",
  config: "settings",
  connection: "link",
  context: "scope",
  converter: "adapter",
  core: "kernel",
  create: "make",
  creator: "maker",
  data: "record",
  database: "repository",
  db: "repository",
  default: "standard",
  display: "screen",
  draw: "paint",
  driver: "adapter",
  dynamic: "active",
  element: "item",
  enum: "choices",
  event: "signal",
  export: "publish",
  feature: "facet",
  file: "document",
  font: "typeface",
  frontend: "client",
  geometry: "shape",
  graphic: "visual",
  graphics: "visuals",
  group: "cluster",
  handler: "agent",
  host: "runtime",
  id: "key",
  image: "picture",
  import: "load",
  info: "details",
  input: "entry",
  item: "unit",
  json: "json",
  layer: "plane",
  list: "catalog",
  load: "fetch",
  loader: "fetcher",
  manager: "coordinator",
  map: "map",
  mesh: "surfaceMesh",
  metadata: "descriptor",
  model: "schema",
  native: "platform",
  node: "vertex",
  object: "entity",
  options: "settings",
  output: "result",
  package: "bundle",
  params: "settings",
  parser: "reader",
  point: "spot",
  primitive: "basicShape",
  project: "workspace",
  props: "fields",
  provider: "source",
  query: "request",
  range: "span",
  ray: "beam",
  read: "scan",
  reader: "scanner",
  record: "entry",
  render: "draw",
  renderer: "painter",
  rendering: "drawing",
  request: "call",
  response: "reply",
  result: "outcome",
  rpc: "bridge",
  schema: "layout",
  script: "routine",
  selection: "choice",
  server: "service",
  service: "facility",
  session: "visit",
  settings: "preferences",
  snapshot: "capture",
  source: "origin",
  spatial: "regional",
  state: "condition",
  status: "state",
  string: "text",
  style: "style",
  symbol: "mark",
  system: "engine",
  target: "destination",
  test: "test",
  tile: "chunk",
  tiles: "chunks",
  token: "ticket",
  tool: "instrument",
  transform: "convert",
  tree: "hierarchy",
  type: "form",
  ui: "panel",
  update: "refresh",
  url: "url",
  user: "operator",
  util: "helper",
  utils: "helpers",
  value: "value",
  vector: "direction",
  view: "scene",
  viewport: "viewPanel",
  webgl: "gpuCanvas",
  workspace: "workArea",
  write: "store",
  writer: "storer",
  xml: "xml",
}));

const exactNameMap = new Map(Object.entries({
  Ray2d: "PlanarRay",
  RenderGraphic: "DrawVisual",
  Renderer: "Painter",
  Viewport: "ViewPanel",
  ViewState: "SceneState",
  GraphicBuilder: "VisualAssembler",
  TileTree: "ChunkHierarchy",
  Tile: "Chunk",
}));

const suffixByKind = {
  class: "Object",
  interface: "Contract",
  enum: "Choices",
  type: "Spec",
  function: "Action",
  variable: "Value",
  identifier: "Item",
};

const collisionWords = [
  "Amber", "Beryl", "Cobalt", "Delta", "Ember", "Flint", "Grove", "Harbor",
  "Indigo", "Jade", "Keystone", "Lumen", "Meadow", "Nimbus", "Opal", "Pillar",
  "Quartz", "River", "Summit", "Timber", "Umber", "Vista", "Willow", "Xenon",
  "Yonder", "Zenith",
];

function splitIdentifierWords(name) {
  return name.match(/[A-Z]+(?=[A-Z][a-z]|\d|$)|[A-Z]?[a-z]+|[0-9]+|_+|\$+/g) ?? [name];
}

function wordStyle(word) {
  if (/^_+$|^\$+$|^\d+$/.test(word)) return "literal";
  if (word.toUpperCase() === word) return "upper";
  if (word.toLowerCase() === word) return "lower";
  if (/^[A-Z]/.test(word)) return "pascal";
  return "camel";
}

function applyWordStyle(replacement, style) {
  if (style === "literal") return replacement;
  if (style === "upper") return replacement.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
  if (style === "lower") return replacement.toLowerCase();
  return replacement[0].toUpperCase() + replacement.slice(1);
}

function transformIdentifierName(oldName, kind) {
  if (exactNameMap.has(oldName)) return exactNameMap.get(oldName);

  const parts = splitIdentifierWords(oldName);
  let changed = false;
  const transformed = parts.map((part) => {
    if (/^_+$|^\$+$|^\d+$/.test(part)) return part;
    const replacement = semanticWordMap.get(part.toLowerCase());
    if (!replacement) return part;
    changed = true;
    return applyWordStyle(replacement, wordStyle(part));
  }).join("");

  if (changed && transformed !== oldName) return transformed;

  const suffix = suffixByKind[kind] ?? "Item";
  if (oldName.startsWith("_")) return `${oldName}${suffix}`;
  if (/^[a-z]/.test(oldName)) return `${oldName}${suffix}`;
  return `${oldName}${suffix}`;
}

function makeUniqueName(baseName, usedNames) {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }

  let attempt = baseName;
  let map = 0;
  while (usedNames.has(attempt)) {
    const first = collisionWords[map % collisionWords.length];
    const secondMap = Math.floor(map / collisionWords.length) - 1;
    const second = secondMap >= 0 ? collisionWords[secondMap % collisionWords.length] : "";
    attempt = `${baseName}Variant${first}${second}`;
    map += 1;
  }
  usedNames.add(attempt);
  return attempt;
}

function replacementFor(entry, usedNames) {
  const kind = [...entry.observedKinds].sort()[0] ?? entry.kind;
  const candidate = transformIdentifierName(entry.oldName, kind);
  return makeUniqueName(candidate, usedNames);
}

function transformFileBaseName(baseName) {
  const parts = baseName.split(/([._-]+)/);
  let changed = false;
  const transformed = parts.map((part) => {
    if (/^[._-]+$/.test(part)) return part;
    const next = transformIdentifierName(part, "file");
    if (next !== part) changed = true;
    return next;
  }).join("");
  return changed ? transformed : `${baseName}-module`;
}

function fileReplacement(relPath) {
  const parsed = path.posix.parse(relPath.replaceAll("\\", "/"));
  return path.posix.join(parsed.dir, `${transformFileBaseName(parsed.name)}${parsed.ext}`);
}

const allFiles = walkFiles(repoRoot).sort((a, b) => normalizeRelative(a).localeCompare(normalizeRelative(b)));
const identifiers = new Map();
const fileEntries = [];
const usedFilePaths = new Set();
const previousMap = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, "utf8")) : undefined;

let fileMap = 1;
for (const file of allFiles) {
  const relPath = normalizeRelative(file);
  const ext = path.extname(file);
  const isSource = sourceExtensions.has(ext);
  fileEntries.push({
    kind: "file",
    oldPath: relPath,
    oldName: path.basename(file),
    newPath: isSource ? makeUniqueName(fileReplacement(relPath, fileMap), usedFilePaths) : relPath,
    renameOnApply: isSource,
  });
  fileMap += 1;

  if (!isSource) continue;
  const text = fs.readFileSync(file, "utf8");
  extractIdentifiers(text, relPath, identifiers);
}

const usedIdentifierNames = new Set();
const identifierEntries = [...identifiers.values()]
  .sort((a, b) => a.oldName.localeCompare(b.oldName))
  .map((entry, map) => ({
    kind: entry.kind,
    oldName: entry.oldName,
    newName: replacementFor(entry, usedIdentifierNames),
    observedKinds: [...entry.observedKinds].sort(),
    files: [...entry.files].sort(),
  }));

const map = {
  generatedAt: new Date().toISOString(),
  repoRoot,
  note: "Generated by tools/name-mapper/generate-name-map.mjs. Review before applying.",
  files: fileEntries,
  identifiers: identifierEntries,
  brandWeakening: previousMap?.brandWeakening,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(map, null, 2)}\n`);

console.log(`Wrote ${outputPath}`);
console.log(`Files recorded: ${fileEntries.length}`);
console.log(`Identifiers recorded: ${identifierEntries.length}`);
