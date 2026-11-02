const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = __dirname;

// Flexible patterns for variations of the copyright header
const copyrightLine = "Copyright \\(c\\) Szew Systems(?:,)? Incorporated\\. All rights reserved\\.";
const licenseLine =
  "See (?:LICENSE|COPYRIGHT)\\.md in the (?:project|repository|iProject) root for (?:license terms and )?full copyright notice\\.";

const PATTERNS = [
  // 1. /* --- */ block (any number of dashes)
  {
    regex: new RegExp(
      `^\\/\\*-+\\s*\\r?\\n\\s*\\*\\s*${copyrightLine}\\s*\\r?\\n\\s*\\*\\s*${licenseLine}\\s*\\r?\\n\\s?\\*-+\\*\\/\\s*\\r?\\n?`,
      "m"
    ),
    name: "JS/TS block"
  },
  // 2. // /* --- */ (commented-out block, each line starts with //)
  {
    regex: new RegExp(
      `^\\/\\/\\s*\\/\\*-+\\s*\\r?\\n\\s*\\/\\/\\s*\\*\\s*${copyrightLine}\\s*\\r?\\n\\s*\\/\\/\\s*\\*\\s*${licenseLine}\\s*\\r?\\n\\s*\\/\\/\\s*\\*-+\\*\\/\\s*\\r?\\n?`,
      "m"
    ),
    name: "// block (commented out)"
  },
  // 3. // two-line comment
  {
    regex: new RegExp(
      `^\\/\\/\\s*${copyrightLine}\\s*\\r?\\n\\s*\\/\\/\\s*${licenseLine}\\s*\\r?\\n?`,
      "m"
    ),
    name: "// two-line"
  },
  // 4. // one-line copyright only
  {
    regex: new RegExp(
      `^\\/\\/\\s*${copyrightLine}\\s*\\r?\\n?`,
      "m"
    ),
    name: "// one-line"
  },
  // 5. Python # comments
  {
    regex: new RegExp(
      `^# ${copyrightLine}\\s*\\r?\\n# ${licenseLine}\\s*\\r?\\n(\\r?\\n)?`,
      "m"
    ),
    name: "Python"
  },
  // 6. HTML <!-- --> block
  {
    regex: new RegExp(
      `^<!--\\s*\\r?\\n\\s*${copyrightLine}\\s*\\r?\\n\\s*${licenseLine}\\s*\\r?\\n-->\\s*\\r?\\n?`,
      "m"
    ),
    name: "HTML <!-- -->"
  },
  // 7. HTML <!--- --> block (dashes in tags, with * prefix)
  {
    regex: new RegExp(
      `^<!-+\\s*\\r?\\n\\s*\\*\\s*${copyrightLine}\\s*\\r?\\n\\s*\\*\\s*${licenseLine}\\s*\\r?\\n\\s*\\*?-+>\\s*\\r?\\n?`,
      "m"
    ),
    name: "HTML <!--- -->"
  },
];

// Files to skip entirely
const SKIP_PATTERNS = [
  /copyright-?[Ll]inter/i,
  /remove-copyright\.js$/,
  /[/\\]LICENSE\.md$/i,
  /[/\\]\.github[/\\]/,
];

function shouldSkip(file) {
  return SKIP_PATTERNS.some(p => p.test(file));
}

const result = execSync(
  `grep -rl "Copyright (c) Szew Systems" "${ROOT}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.scss" --include="*.css" --include="*.py" --include="*.mjs" --include="*.html" --include="*.tsv" --include="*.md"`,
  { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }
);

const files = result.trim().split("\n").filter(Boolean);

let removed = 0;
let skipped = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);

  if (shouldSkip(file)) {
    skipped++;
    console.log(`[SKIP] ${rel} — excluded`);
    continue;
  }

  let content = fs.readFileSync(file, "utf8");
  let matched = false;

  for (const pat of PATTERNS) {
    const newContent = content.replace(pat.regex, "");
    if (newContent !== content) {
      const cleaned = newContent.replace(/^\r?\n/, "");
      fs.writeFileSync(file, cleaned);
      removed++;
      console.log(`[OK] ${rel} (${pat.name})`);
      matched = true;
      break;
    }
  }

  if (!matched) {
    // Last resort: print first 5 lines for manual inspection
    const lines = content.split(/\r?\n/).slice(0, 6);
    console.log(`[SKIP] ${rel} — unrecognized (starts: "${lines[0]?.substring(0, 60)}")`);
    skipped++;
  }
}

console.log(`\nDone: ${removed} removed, ${skipped} skipped`);
