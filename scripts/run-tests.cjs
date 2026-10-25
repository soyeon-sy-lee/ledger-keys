const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
const commands = [
  'scripts/check-site.cjs', 'tests/test.cjs', 'tests/audit.cjs',
  'tests/formula-test.cjs', 'tests/learner-test.cjs', 'tests/accounting-test.cjs', 'tests/migration-test.cjs',
  'tests/keyboard-lock-test.cjs'
];
for (const command of commands) {
  const result = spawnSync(process.execPath, [path.join(root, command)], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('All 회계사 엑셀 훈련소 checks passed.');
