// Positive and negative controls for the documentation checker; no network calls.
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const checker = path.join(__dirname, 'check-docs.cjs');
const root = path.join(__dirname, '..');
const run = (code) => {
  const result = spawnSync(process.execPath, ['-e', code], {
    cwd: root, encoding: 'utf8', timeout: 10000,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  return result;
};
const positive = run(`require(${JSON.stringify(checker)})`);
assert.equal(positive.status, 0, positive.stderr);
assert.match(positive.stdout, /PASS/);
const mutate = (removeGuard) => `
  const fs = require('node:fs');
  const originalRead = fs.readFileSync;
  fs.readFileSync = function(file, ...args) {
    let value = originalRead.call(this, file, ...args);
    if (String(file) === ${JSON.stringify(path.join(process.env.DOCS_PACKAGE_DIR || root, 'index.js'))}) {
      const previous = value;
      value = value.replace('CO2Accessory.prototype.getCo2Level = function (callback) {', 'CO2Accessory.prototype.getCo2Level = function (callback) { return;');
      if (value === previous) throw new Error('Negative control did not mutate its input');
    }
    if (${removeGuard} && String(file) === ${JSON.stringify(checker)}) {
      value = value.replace(/let completed = false;[\\s\\S]*?(?=\\(async \\(\\) => \\{)/, 'let completed = false;\\n');
    }
    return value;
  };
  require(${JSON.stringify(checker)});
`;
const negative = run(mutate(false));
assert.equal(negative.status, 1, negative.stderr);
assert.doesNotMatch(negative.stdout, /PASS/);
assert.match(negative.stderr, /example never settled/);
// Prove the control detects the old bug rather than a syntax or module error.
const unguarded = run(mutate(true));
assert.equal(unguarded.status, 0, unguarded.stderr);
assert.equal(unguarded.stdout, '');
assert.equal(unguarded.stderr, '');
console.log('Documentation checker positive, unsettled and unguarded controls PASS');
