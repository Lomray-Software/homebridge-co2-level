const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const config = JSON.parse(fs.readFileSync(path.join(root, 'context7.json')));
assert(config.rules.every((rule) => rule.length <= 255));
for (const match of readme.matchAll(/\]\(([^)]+)\)/g)) {
  const link = match[1].split('#')[0];
  if (link && !/^(https?:|mailto:)/.test(link)) {
    assert(fs.existsSync(path.join(root, link)), link);
  }
}
const vm = require('node:vm');
// Requires lodash, already a package dependency. External requests and intervals are mocked.
const lodash = require('lodash');
const packageDir = process.env.DOCS_PACKAGE_DIR || root;
const source = fs.readFileSync(path.join(packageDir, 'index.js'), 'utf8');
const example = JSON.parse([...readme.matchAll(/```json\n([\s\S]*?)```/g)][0][1]);
const accessoryConfig = example.accessories[0];
assert.equal(accessoryConfig.calculate, 'none');
assert.equal(accessoryConfig.loginUrl, null);
assert.equal(lodash.get({ data: { co2: 650 } }, accessoryConfig.valuePath), 650);
let Accessory;
let intervalMs;
const updates = {};
class Service {
  getCharacteristic(key) {
    return { on() {}, updateValue(value) { updates[key] = value; } };
  }
  setCharacteristic() { return this; }
}
const requests = [];
const context = {
  module: { exports: {} },
  require(name) {
    if (name === 'lodash') return lodash;
    if (name === './package.json') return JSON.parse(fs.readFileSync(path.join(packageDir, name)));
    assert.equal(name, 'axios');
    return {
      get() { throw new Error('No login expected'); },
      request(config) { requests.push(config); return Promise.resolve({ data: { co2: 650 } }); },
    };
  },
  setInterval(callback, ms) { intervalMs = ms; },
};
vm.runInNewContext(source, context);
context.module.exports({
  hap: { Service: { CarbonDioxideSensor: Service, AccessoryInformation: Service },
    Characteristic: { CarbonDioxideDetected: 'detected', CarbonDioxideLevel: 'level' } },
  registerAccessory(plugin, name, ctor) { assert.equal(name, accessoryConfig.accessory); Accessory = ctor; },
});
let completed = false;
process.on('exit', (code) => {
  if (!completed && code === 0) {
    console.error('Documentation check did not finish: the example never settled.');
    process.exitCode = 1;
  }
});
(async () => {
  const accessory = new Accessory(() => {}, accessoryConfig);
  const value = await new Promise((resolve, reject) => accessory.getCo2Level((error, result) => error ? reject(error) : resolve(result)));
  assert.equal(value, 650);
  assert.equal(intervalMs, accessoryConfig.interval * 1000);
  assert(requests.every((config) => config.url === accessoryConfig.axiosConfig.url));
  accessory.setCo2Detected(999); assert.equal(updates.detected, 0);
  accessory.setCo2Detected(1000); assert.equal(updates.detected, 1);
  assert.equal(config.branch, 'master');
  completed = true;
  console.log('README JSON and mocked Homebridge reading PASS');
})().catch((error) => { console.error(error); process.exitCode = 1; });
