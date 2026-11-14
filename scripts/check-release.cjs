'use strict';
// Validate the actual deployable bundle, not development files.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../dist');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root);
const missing = [];
for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const href = match[1];
    if (/^(?:[a-z]+:|\/\/|#)/i.test(href)) continue;
    const relative = href.split(/[?#]/)[0];
    let target = path.resolve(path.dirname(file), relative);
    if (target === path.join(root, 'connected/config.js')) continue;
    if (relative.endsWith('/')) target = path.join(target, 'index.html');
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
      missing.push(path.relative(root, file) + ' → ' + href);
    }
  }
}
assert.deepEqual(missing, [], 'Broken local page or asset references');
for (const forbidden of ['script.js', 'phase1.js', 'portal-flows.js', 'notebook.js',
  'connected/notebook.js', 'supabase', 'verification', 'tests', 'HANDOVER_CHECKLIST.md']) {
  assert.equal(fs.existsSync(path.join(root, forbidden)), false, 'Development/deferred file shipped: ' + forbidden);
}
assert.ok(fs.readFileSync(path.join(root, 'connected/index.html'), 'utf8').includes('autocomplete="current-password"'));
console.log('Release bundle checked: ' + files.length + ' files; local links resolve; legacy demo and development files excluded.');
