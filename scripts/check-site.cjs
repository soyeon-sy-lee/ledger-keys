const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'docs');
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match => match[1].split('?')[0]).filter(value => !/^(?:[a-z]+:|#)/i.test(value));
for (const asset of assets) {
  assert(!asset.startsWith('/'), `Use relative asset paths for project Pages: ${asset}`);
  assert(fs.statSync(path.resolve(site, asset)).isFile(), `Missing asset: ${asset}`);
}
for (const file of fs.readdirSync(site).filter(file => file.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', path.join(site, file)], { stdio: 'inherit' });
  assert.equal(result.status, 0, `Invalid JavaScript: ${file}`);
}
for (const id of ['learnerDialog', 'promotionDialog', 'learnerBadge', 'app']) {
  assert(html.includes(`id="${id}"`), `Missing app element: ${id}`);
}
assert(fs.existsSync(path.join(site, '.nojekyll')));
console.log(`PASS: ${assets.length} relative assets, script syntax, entry point and Pages layout`);
