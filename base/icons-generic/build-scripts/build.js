"use strict";

// Regenerates icon-list.json from the icons/ directory.
// Run: npm run build (inside icons-generic)

const glob = require("glob");
const path = require("path");
const fs = require("fs-extra");

const ICONS_DIR = path.join(__dirname, "..", "icons");
const OUT_FILE = path.join(__dirname, "..", "icon-list.json");

const svgFiles = glob.sync("**/*.svg", { cwd: ICONS_DIR }).sort();

fs.writeFileSync(OUT_FILE, JSON.stringify(svgFiles));

console.log(`icon-list.json regenerated with ${svgFiles.length} icons.`);
