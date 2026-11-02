const fs = require('fs');

let raw = fs.readFileSync('rush.json','utf8');
// Remove comments
let stripped = raw.replace(/^ *\/\/.*$/gm,'');
// Fix: ensure commas before decoupledLocalDependencies (missing commas from line-based edit)
stripped = stripped.replace(/"([a-zA-Z]+)"\s*\n\s*"decoupledLocalDependencies"/g, '"$1",\n      "decoupledLocalDependencies"');

try {
  const rush = JSON.parse(stripped);
  // Rewrite cleanly
  fs.writeFileSync('rush.json', JSON.stringify(rush, null, 2), 'utf8');
  console.log('Fixed and prettified. Projects: ' + rush.projects.length);
} catch(e) {
  console.log('Still invalid: ' + e.message);
}
