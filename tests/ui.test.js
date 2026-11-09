/* 實際 UI 繪製函式搭配最小 DOM，驗證一百關選單與牌面，不寫玩家存檔。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assertRenderedText = require('./helpers/assert-rendered-text');
const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) {
    nodes.set(id, {
    textContent: '', innerHTML: '', hidden: false,
    style: { setProperty(key, value) { this[key] = value; } },
    classList: { remove() {} }
    });
    for (const key of ['innerHTML', 'textContent']) {
      let value = '';
      Object.defineProperty(nodes.get(id), key, { get: () => value, set(next) { assertRenderedText(next, `${id}.${key}`); value = next; } });
    }
  }
  return nodes.get(id);
}
const context = { document: { getElementById: node, querySelectorAll: () => [] }, localStorage: { getItem: () => null, setItem() {} } };
context.window = context; vm.createContext(context);
for (const file of ['levels', 'stories', 'campaign', 'engine', 'storage', 'campaign-storage', 'journey', 'rewards', 'ui']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file + '.js'), 'utf8'), context);
}
const D = context.DotGame;
const cards = () => node('level-grid').innerHTML.match(/<button\b[^>]*>/g);
const enabled = () => cards().filter(card => !card.includes('disabled')).length;
D.UI.levels();
assert.equal(cards().length, 100);
assert.equal(enabled(), 1);
assert.equal(node('star-limit').textContent, '300');
assert.equal(node('star-total').textContent, '00');
assert.match(cards()[99], /data-level="100".*disabled/);
D.Storage.record(16, { stars: 3, score: 1000, time: 20 });
D.UI.levels();
assert.equal(enabled(), 17);
assert.match(cards()[16], /data-level="17"/);
assert.doesNotMatch(cards()[16], /disabled/);
assert.match(cards()[17], /disabled/);
D.Storage.record(40, { stars: 3, score: 1000, time: 20 }); D.UI.levels();
assert.equal(enabled(), 41); assert.doesNotMatch(cards()[40], /disabled/); assert.match(cards()[41], /disabled/);
D.Storage.record(59, { stars: 3, score: 1000, time: 20 }); D.UI.levels();
assert.equal(enabled(), 60); assert.doesNotMatch(cards()[59], /disabled/); assert.match(cards()[60], /disabled/);
D.Storage.record(79, { stars: 3, score: 1000, time: 20 }); D.UI.levels();
assert.equal(enabled(), 80); assert.doesNotMatch(cards()[79], /disabled/); assert.match(cards()[80], /disabled/);
D.Storage.record(98, { stars: 3, score: 1000, time: 20 }); D.UI.levels();
assert.equal(enabled(), 99); assert.doesNotMatch(cards()[98], /disabled/); assert.match(cards()[99], /disabled/);
assert.match(node('level-grid').innerHTML, /四象交會/); assert.match(node('level-grid').innerHTML, /最後一道光/);
for (const level of D.LEVELS) {
  const { grid, palette } = D.Engine.createBoard(level);
  D.UI.setupStage(level, palette);
  D.UI.board(grid);
  assert.equal(node('game-stage-label').textContent, `STAGE ${String(level.id).padStart(2, '0')} / 100`);
  assert.equal(node('stage-name').textContent, level.name || '');
  assert.equal(node('stage-name').hidden, !level.name);
  assert.equal((node('board').innerHTML.match(/data-cell=/g) || []).length, level.tiles);
  assert.equal((node('board').innerHTML.match(/class="board-cell ppa-tile/g) || []).length, level.ppaPairs * 2);
  assert.equal((node('board').innerHTML.match(/class="board-cell wall"/g) || []).length, level.walls);
  assert.equal((node('board').innerHTML.match(/class="board-cell bomb-tile/g) || []).length, level.bombs || 0);
  assert.equal((node('board').innerHTML.match(/class="bomb-badge"/g) || []).length, level.bombs || 0);
  assert.equal((node('board').innerHTML.match(/class="ice-shell"/g) || []).length, level.ice || 0);
  assert.equal((node('board').innerHTML.match(/disabled aria-label="冰封/g) || []).length, level.ice || 0);
  assert.equal((node('board').innerHTML.match(/class="fog-veil"/g) || []).length, level.fogTiles || 0);
  assert.equal((node('board').innerHTML.match(/class="clock-badge clock-plus"/g) || []).length, level.clocks?.plus || 0);
  assert.equal((node('board').innerHTML.match(/class="clock-badge clock-minus"/g) || []).length, level.clocks?.minus || 0);
  assert.match(node('ppa-notice').innerHTML, new RegExp(`本關 ${level.ppaPairs} 對 PPA（${level.ppaPairs * 2} 顆）`));
  D.Storage.record(level.id, { stars: 3, score: 1000, time: 20 });
}
D.UI.levels();
assert.equal(enabled(), 100);
assert.equal(node('star-total').textContent, '300');
assert.equal(node('star-limit').textContent, '300');
for (const level of D.LEVELS.slice(0, 3)) {
  D.UI.setupStage(level, D.Engine.createBoard(level).palette, 'campaign');
  assert.equal(node('game-stage-label').textContent, `PPA JOURNEY ${level.id} / 3`);
}
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert.match(html, /100 關自由挑戰/);
assert.match(html, /100 關獨立挑戰/);
assert.doesNotMatch(html, /(?:16|40|59|79|98) 關|\/ 48|STAGE 01 \/ (?:40|59|79|98)/);
console.log('PASS: 100 張關卡卡片、98→99 解鎖、300 星總數、終章關名、全關牌面及機關、三關活動標示正確');
// 共用首次資格不複製星級：活動完成但自由模式沒有紀錄時，選單清楚標示。
const firstRecord=D.Storage.get().records[1];delete D.Storage.get().records[1];D.UI.levels();
assert.match(cards()[0],/活動已完成，可挑戰自由模式紀錄/);assert.match(node('level-grid').innerHTML,/活動已完成/);
D.Storage.get().records[1]=firstRecord;
