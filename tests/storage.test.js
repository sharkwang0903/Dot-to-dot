/* 舊版進度升級到一百關，以及新增關卡的持久化。 */
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
const originalRecords = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [i + 1, { ...record, score: (i + 1) * 1000 }]));
const veteran = load({ unlocked: 16, sound: false, records: originalRecords });
assert.equal(veteran.storage.get().unlocked, 17);
assert.deepEqual(JSON.parse(JSON.stringify(veteran.storage.get().records)), originalRecords);
assert.equal(veteran.storage.get().sound, false);
assert.equal(load({ unlocked: 16, records: { 15: record } }).storage.get().unlocked, 16);
assert.equal(load({ unlocked: 12, records: { 11: record } }).storage.get().unlocked, 12);
console.log('PASS: 舊第 16 關通關者自動解鎖第 17 關；未通關者與中途進度維持原解鎖，所有舊紀錄與音效保留');
const fortyRecords = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i + 1, { ...record, score: (i + 1) * 1000 }]));
const completedForty = load({ unlocked: 40, sound: false, records: fortyRecords });
assert.equal(completedForty.storage.get().unlocked, 41);
assert.equal(completedForty.storage.get().sound, false);
assert.deepEqual(JSON.parse(JSON.stringify(completedForty.storage.get().records)), fortyRecords);
assert.equal(load({ unlocked: 40, records: { 39: record } }).storage.get().unlocked, 40);
console.log('PASS: 第 40 關通關者自動解鎖第 41 關，未通關者維持原進度，40 關紀錄與音效保留');
const fiftyNineRecords = Object.fromEntries(Array.from({ length: 59 }, (_, i) => [i + 1, { ...record, score: (i + 1) * 1000 }]));
const completedFiftyNine = load({ unlocked: 59, sound: false, records: fiftyNineRecords });
assert.equal(completedFiftyNine.storage.get().unlocked, 60);
assert.equal(completedFiftyNine.storage.get().sound, false);
assert.deepEqual(JSON.parse(JSON.stringify(completedFiftyNine.storage.get().records)), fiftyNineRecords);
assert.equal(load({ unlocked: 59, records: { 58: record } }).storage.get().unlocked, 59);
console.log('PASS: 第 59 關通關者自動解鎖第 60 關，未通關者保留進度，59 關紀錄與音效保留');
const seventyNineRecords = Object.fromEntries(Array.from({ length: 79 }, (_, i) => [i + 1, { ...record, score: (i + 1) * 1000 }]));
const completedSeventyNine = load({ unlocked: 79, sound: false, records: seventyNineRecords });
assert.equal(completedSeventyNine.storage.get().unlocked, 80);
assert.equal(completedSeventyNine.storage.get().sound, false);
assert.deepEqual(JSON.parse(JSON.stringify(completedSeventyNine.storage.get().records)), seventyNineRecords);
assert.equal(load({ unlocked: 79, records: { 78: record } }).storage.get().unlocked, 79);
console.log('PASS: 第 79 關通關者自動解鎖第 80 關，未通關者保留進度，79 關紀錄與音效保留');
const ninetyEightRecords = Object.fromEntries(Array.from({ length: 98 }, (_, i) => [i + 1, { ...record, score: (i + 1) * 1000 }]));
const completedNinetyEight = load({ unlocked: 98, sound: false, records: ninetyEightRecords });
assert.equal(completedNinetyEight.storage.get().unlocked, 99);
assert.equal(completedNinetyEight.storage.get().sound, false);
assert.deepEqual(JSON.parse(JSON.stringify(completedNinetyEight.storage.get().records)), ninetyEightRecords);
assert.equal(load({ unlocked: 98, records: { 97: record } }).storage.get().unlocked, 98);
console.log('PASS: 第 98 關通關者自動解鎖第 99 關，未通關者保留進度，98 關紀錄與音效保留');
for (let id = 9; id <= 100; id++) {
  old.storage.record(id, { ...record, score: id * 1000 });
  assert.equal(old.storage.get().unlocked, Math.min(100, id + 1));
}
const reopened = load(old.persisted()).storage;
assert.equal(reopened.get().unlocked, 100);
assert.equal(reopened.get().records[100].score, 100000);
assert.equal(reopened.get().records[98].score, 98000);
assert.equal(reopened.get().records[79].score, 79000);
assert.equal(reopened.get().records[59].score, 59000);
assert.equal(reopened.get().records[40].score, 40000);
assert.equal(reopened.get().records[16].score, 16000);
assert.equal(reopened.get().records[9].score, 9000);
reopened.record(9, { stars: 1, score: 20, time: 100 });
assert.equal(reopened.get().records[9].score, 9000);
assert.equal(reopened.get().records[9].stars, 3);
reopened.record(100, { stars: 1, score: 20, time: 100 });
assert.equal(reopened.get().records[100].score, 100000);
assert.equal(reopened.get().records[100].stars, 3);
assert.equal(reopened.get().records[100].time, record.time);
assert.equal(reopened.get().unlocked, 100);
console.log('PASS: 第 9～100 關可儲存、重新載入、重玩，最佳值保留，通關上限為第 100 關');
