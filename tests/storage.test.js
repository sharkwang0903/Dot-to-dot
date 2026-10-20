/* 舊八關進度升級到十六關，以及新增關卡的持久化。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function load(saved) {
  let persisted = saved;
  const context = { localStorage: {
    getItem: key => { assert.equal(key, 'dot-to-dot.v1'); return JSON.stringify(persisted); },
    setItem: (key, value) => { assert.equal(key, 'dot-to-dot.v1'); persisted = JSON.parse(value); }
  } };
  context.window = context; vm.createContext(context);
  for (const file of ['levels','storage']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file + '.js'), 'utf8'), context);
  return { storage: context.DotGame.Storage, persisted: () => persisted };
}
const record = { stars: 3, score: 4321, time: 38.5 };
const old = load({ unlocked: 8, sound: false, records: { 1: record, 8: record } });
assert.equal(old.storage.get().unlocked, 9);
assert.equal(old.storage.get().sound, false);
assert.equal(old.storage.get().records[8].score, 4321);
assert.equal(old.storage.get().records[1].time, 38.5);
assert.equal(load({ unlocked: 8, records: { 7: record } }).storage.get().unlocked, 8);
assert.equal(load(null).storage.get().unlocked, 1);
console.log('PASS: 已通關第 8 關會解鎖第 9 關，未通關者保留原進度');
for (let id = 9; id <= 16; id++) {
  old.storage.record(id, { ...record, score: id * 1000 });
  assert.equal(old.storage.get().unlocked, Math.min(16, id + 1));
}
const reopened = load(old.persisted()).storage;
assert.equal(reopened.get().unlocked, 16);
assert.equal(reopened.get().records[16].score, 16000);
assert.equal(reopened.get().records[9].score, 9000);
reopened.record(9, { stars: 1, score: 20, time: 100 });
assert.equal(reopened.get().records[9].score, 9000);
assert.equal(reopened.get().records[9].stars, 3);
console.log('PASS: 第 9～16 關可儲存、重新載入、重玩，通關上限為第 16 關');
