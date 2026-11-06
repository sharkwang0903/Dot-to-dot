/* 炸彈規則與真實控制器；虛擬時鐘及存檔，不碰玩家資料。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = name => fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8');
const context = { console }; context.window = context; vm.createContext(context);
for (const name of ['levels', 'engine']) vm.runInContext(source(name), context);
const { Engine: E, LEVELS } = context.DotGame;
const B = color => 200 + color, PPA = 100;
const board = rows => [Array(rows[0].length + 2).fill(0), ...rows.map(row => [0, ...row, 0]), Array(rows[0].length + 2).fill(0)];
let seed = 123456;
const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
assert.ok(LEVELS.slice(0, 19).every(l => !l.bombs));
assert.equal(LEVELS[19].bombs, 2);
assert.ok(LEVELS.slice(20).some(l => !l.bombs), '後續保留無炸彈的關卡');
assert.ok(LEVELS.every(l => l.ppaPairs > 0 && l.tiles > l.ppaPairs * 2 + (l.bombs || 0)));

// 標記與普通同色互配，仍必須符合最多兩轉的合法路線。
const matchable = board([[B(1), 1, B(2), 2, PPA, PPA]]);
assert.ok(E.findPath(matchable, { r: 1, c: 1 }, { r: 1, c: 2 }));
assert.equal(E.findPath(matchable, { r: 1, c: 1 }, { r: 1, c: 3 }), null);
assert.equal(E.findPath(matchable, { r: 1, c: 1 }, { r: 1, c: 5 }), null);
const blocked = board(Array.from({ length: 5 }, () => Array(5).fill(2)));
blocked[2][2] = B(1); blocked[4][4] = 1;
assert.equal(E.findPath(blocked, { r: 2, c: 2 }, { r: 4, c: 4 }), null);
const stuck = board([[B(1), 2], [2, 1]]);
assert.equal(E.findMove(stuck), null);
const fixed = E.reshuffle(stuck, () => .99999);
assert.ok(E.findMove(fixed));
assert.equal(E.cells(fixed).map(p => p.value).sort().join(), E.cells(stuck).map(p => p.value).sort().join());

// 全盤隨機一對，保留牆壁／PPA，範圍外及沒有合法連線的同色牌也可被抽中。
const areaBoard = board([[1, 1, 2, 2, 3], [PPA, -1, B(4), 4, 3], [5, 5, 6, 6, 7], [7, 8, 8, 9, 9]]);
const original = JSON.stringify(areaBoard);
const targets = E.bombTargets(areaBoard, rng);
assert.equal(targets.length, 1);
assert.equal(new Set(targets.flat().map(p => `${p.r},${p.c}`)).size, 2);
assert.ok(targets.every(pair => E.sameColor(pair[0].value, pair[1].value)));
assert.ok(targets.flat().every(p => !E.isPPA(p.value) && p.value > 0));
assert.equal(JSON.stringify(areaBoard), original, '規劃不提前移除');
assert.equal(E.bombTargets(board([[PPA, PPA, -1, 0]])).length, 0);
assert.equal(E.bombTargets(board([[0, 0]])).length, 0);
const unreachable = board([[0, -1, 0, -1, 0], [-1, 2, -1, 2, -1], [0, -1, 0, -1, 0]]);
assert.equal(E.findPath(unreachable, { r: 2, c: 2 }, { r: 2, c: 4 }), null);
assert.equal(E.bombTargets(unreachable, rng).length, 1, '額外目標不需要合法連線');
const colorsSeen = new Set(), positionsSeen = new Set();
for (let run = 0; run < 200; run++) {
  const [pair] = E.bombTargets(areaBoard, rng);
  colorsSeen.add(E.baseValue(pair[0].value));
  for (const p of pair) positionsSeen.add(`${p.r},${p.c}`);
}
assert.equal(colorsSeen.size, 9, '目標來自全盤各種普通顏色');
assert.equal(positionsSeen.size, 18, '全盤每顆普通寶石皆有機會入選');
const markedOnly = board([[B(1), 1, PPA, PPA]]);
assert.equal(E.ppaTargets(markedOnly, 5, rng).length, 1, 'PPA 仍能消除帶標記的普通寶石');
assert.ok(E.ppaTargets(markedOnly, 5, rng)[0].some(p => E.isBomb(p.value)));

// 每個有炸彈關卡多次開局，檢查標記數、顏色、PPA、洗牌及可直接發現的有效引爆。
let openings = 0;
for (const level of LEVELS.filter(l => l.bombs)) for (let run = 0; run < 100; run++) {
  const { grid, palette } = E.createBoard(level, rng), cells = E.cells(grid);
  assert.equal(cells.filter(p => E.isBomb(p.value)).length, level.bombs);
  assert.equal(cells.filter(p => E.isPPA(p.value)).length, level.ppaPairs * 2);
  assert.equal(cells.length, level.tiles);
  for (const color of palette) assert.equal(cells.filter(p => E.baseValue(p.value) === color).length % 2, 0);
  const mixed = E.reshuffle(grid, rng);
  assert.equal(E.cells(mixed).map(p => E.tileValue(p.value)).sort().join(), cells.map(p => E.tileValue(p.value)).sort().join());
  let useful = false;
  for (const a of cells.filter(p => E.isBomb(p.value))) for (const b of cells) {
    if (!E.findPath(grid, a, b)) continue;
    const copy = grid.map(row => row.slice()); E.removePair(copy, [a, b]);
    if (E.bombTargets(copy, rng).length === 1) useful = true;
  }
  assert.ok(useful, `第 ${level.id} 關應有開局能合法引爆且有額外目標的炸彈`);
  openings++;
}
console.log(`PASS: ${openings} 次炸彈開局、全盤隨機恰好一對、不受連線限制、PPA 互動與成對規則`);

function boot(input, reduced = false) {
  let now = 1000, serial = 0, grid, clock = 0, combo = 0, dialog = '', toast = '', blasts = 0;
  const jobs = new Map(), events = {}, nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { textContent: '', inert: false, open: false, style: {},
      classList: { add() {}, remove() {} }, addEventListener() {} });
    return nodes.get(id);
  };
  const controlledMath = Object.create(Math); controlledMath.random = () => 0;
  const ctx = { console, Math: controlledMath, performance: { now: () => now }, matchMedia: () => ({ matches: reduced }),
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout(fn, ms) { const id = ++serial; jobs.set(id, { fn, at: now + ms }); return id; },
    clearTimeout(id) { jobs.delete(id); },
    requestAnimationFrame(fn) { const id = ++serial; jobs.set(id, { fn, at: now + 16 }); return id; },
    cancelAnimationFrame(id) { jobs.delete(id); },
    document: { hidden: false, addEventListener(type, fn) { events[type] = fn; } },
    addEventListener(type, fn) { events['window:' + type] = fn; }
  };
  ctx.window = ctx; vm.createContext(ctx);
  for (const name of ['levels', 'engine', 'storage']) vm.runInContext(source(name), ctx);
  const D = ctx.DotGame;
  D.Engine.createBoard = () => ({ grid: input.map(row => row.slice()), palette: [1, 2, 3] });
  D.Audio = { play() {} }; D.CampaignUI = { home() {} };
  D.UI = { $: node, icon: () => '', stars: () => '', clock: String, showView() {}, levels() {}, setupStage() {},
    board(g) { grid = g.map(row => row.slice()); }, select() {}, cell: () => node('tile'),
    updateTime(ms) { clock = ms; }, combo(n) { combo = n; },
    line() {}, clearLine() {}, message() {}, ppaFeedback() {}, clearPPA() {},
    blast() { blasts++; }, clearBomb() {}, clearToast() {}, soundButton() {},
    toast(text) { toast = text; }, modal(html) { dialog = html; node('modal').open = true; },
    closeModal() { dialog = ''; node('modal').open = false; }
  };
  vm.runInContext(source('game'), ctx);
  function advance(ms) {
    const target = now + ms;
    for (let i = 0; i < 100000; i++) {
      const job = [...jobs].sort((a, b) => a[1].at - b[1].at)[0];
      if (!job || job[1].at > target) break;
      now = job[1].at; jobs.delete(job[0]); job[1].fn();
    }
    now = target;
  }
  function action(action) {
    const button = { dataset: { action, level: '1' }, closest: () => null };
    events.click({ target: { closest: s => s === '[data-action]' ? button : null } });
  }
  function tile(r, c) {
    const el = { dataset: { r: String(r), c: String(c) } };
    events.click({ target: { closest: s => s === '[data-cell]' ? el : null } });
  }
  action('play'); advance(650);
  return { D, ctx, events, node, advance, action, tile,
    get grid() { return grid; }, get clock() { return clock; }, get combo() { return combo; },
    get score() { return Number(node('score').textContent); }, get dialog() { return dialog; },
    get toast() { return toast; }, get blasts() { return blasts; } };
}
const roomy = board([[B(1), 1, 3, 3, PPA, PPA], [2, 2, 4, 4, 5, 5], [6, 6, 7, 7, 8, 8]]);
for (const reduced of [false, true]) {
  const t = boot(roomy, reduced), reveal = reduced ? 60 : 320, settle = reduced ? 40 : 160;
  t.tile(1, 1); t.tile(1, 2);
  assert.equal(t.score, 100); assert.equal(t.combo, 1); assert.equal(t.node('board').inert, true);
  const left = t.clock; t.tile(3, 1); t.tile(3, 2); assert.equal(t.score, 100, '特效期間輸入鎖定');
  t.advance(reveal - 1); assert.equal(t.score, 100); assert.equal(t.clock, left);
  t.advance(1); assert.equal(t.score, 200); assert.equal(t.grid[1][3], 0); assert.equal(t.grid[1][4], 0);
  assert.equal(t.combo, 1); assert.equal(t.grid[1][5], PPA); assert.equal(t.clock, left);
  t.advance(settle); assert.equal(t.node('board').inert, false); assert.match(t.toast, /爆破 1 對 \+100/);
  t.advance(5000); t.tile(3, 1); t.tile(3, 2); assert.equal(t.combo, 2);
  t.advance(5000.01); t.tile(2, 3); t.tile(2, 4); assert.equal(t.combo, 1);
}
// 演出兩個階段皆可暫停／失焦／隱藏／說明，且重開與離開不殘留舊回呼。
for (const offset of [100, 350]) for (const kind of ['pause', 'blur', 'hidden', 'help', 'leave', 'retry', 'levels']) {
  const t = boot(roomy); t.tile(1, 1); t.tile(1, 2); t.advance(offset);
  if (kind === 'blur') t.events['window:blur']();
  else if (kind === 'hidden') { t.ctx.document.hidden = true; t.events.visibilitychange(); }
  else t.action(kind);
  const count = E.cells(t.grid).length, score = t.score, clock = t.clock;
  t.advance(30000);
  assert.equal(E.cells(t.grid).length, count); assert.equal(t.score, score);
  if (kind === 'retry') { assert.equal(t.blasts, offset >= 320 ? 2 : 1); assert.equal(t.score, 0); continue; }
  assert.equal(t.clock, clock);
  if (kind === 'levels') { assert.equal(t.dialog, ''); continue; }
  t.ctx.document.hidden = false; t.action(kind === 'help' ? 'close-help' : 'resume'); t.advance(600);
  assert.equal(t.score, 200); assert.equal(t.combo, 1); assert.equal(t.node('board').inert, false);
}
// 周圍無牌仍有額外效果；命中標記不連鎖，兩顆炸彈互配仍只額外一對。
const isolated = boot(board([[B(1), 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [PPA, PPA, 0, 0, 2, 2]]));
isolated.tile(1, 1); isolated.tile(1, 2); isolated.advance(480);
assert.equal(isolated.score, 200); assert.equal(isolated.grid[3][5], 0); assert.equal(isolated.grid[3][6], 0);
assert.equal(isolated.grid[3][1], PPA); assert.equal(isolated.grid[3][2], PPA);
const noChain = boot(board([[B(1), 1, 0, 0], [B(2), 2, 4, 4], [5, 5, PPA, PPA]]));
noChain.tile(1, 1); noChain.tile(1, 2); noChain.advance(480);
assert.equal(noChain.blasts, 2); assert.equal(noChain.score, 200); assert.equal(noChain.combo, 1);
assert.ok(noChain.grid[3][1] > 0, '不發生第二次爆破');
const double = boot(board([[B(1), B(1), 3, 3], [2, 2, 4, 4], [PPA, PPA, 5, 5]]));
double.tile(1, 1); double.tile(1, 2); double.advance(480);
assert.equal(double.score, 200, '一組手動配對即使有兩顆炸彈，也只額外消除一對');
const last = boot(board([[B(1), 1]])); last.tile(1, 1); last.tile(1, 2); last.advance(1000);
assert.match(last.dialog, /第 1 關完成/); assert.equal(last.D.Storage.get().unlocked, 2);
const ppaThenBomb = boot(board([[PPA, PPA, B(1), 1]]));
ppaThenBomb.tile(1, 1); ppaThenBomb.tile(1, 2); ppaThenBomb.advance(1200);
assert.equal(ppaThenBomb.blasts, 0, 'PPA 消除標記不引爆'); assert.match(ppaThenBomb.dialog, /第 1 關完成/);
const illegal = boot(blocked); illegal.tile(2, 2); illegal.tile(4, 4); illegal.advance(600);
assert.equal(illegal.blasts, 0); assert.equal(illegal.score, 0);
console.log('PASS: 炸彈實際計分／連擊／時間凍結、減少動畫、特效暫停與接續、切局清理、不連鎖及尾盤通關');

// 實際 UI 保留角落標記、標示全盤目標，不顯示九宮格預覽。
const uiNodes = new Map();
function uiNode(id) {
  if (!uiNodes.has(id)) {
    const classes = new Set(), el = { children: [], dataset: {}, textContent: '',
      style: { setProperty() {} },
      classList: { add(...names) { names.forEach(n => classes.add(n)); },
        remove(...names) { names.forEach(n => classes.delete(n)); }, contains: name => classes.has(name) },
      setAttribute(name, value) { this[name] = value; }
    };
    let html = '';
    Object.defineProperty(el, 'innerHTML', { get: () => html, set(value) {
      html = value;
      if (id !== 'board') return;
      el.children = [...value.matchAll(/<(?:button|span) class="board-cell ([^"]*)"([^>]*)>/g)].map((match, i) => {
        const child = uiNode('tile-' + i);
        for (const name of ['selected', 'bomb-hit', 'bomb-origin']) child.classList.remove(name);
        for (const name of match[1].split(' ').filter(Boolean)) child.classList.add(name);
        child.dataset.cell = match[2].match(/data-cell="([^"]+)"/)?.[1];
        return child;
      });
    } });
    uiNodes.set(id, el);
  }
  return uiNodes.get(id);
}
const document = {
  getElementById: uiNode,
  querySelector(selector) { return uiNode('board').children.find(el => el.dataset.cell === selector.match(/data-cell="([^"]+)"/)?.[1]); },
  querySelectorAll(selector) {
    return uiNode('board').children.filter(el => selector.split(',').some(s => s.trim().split('.').filter(Boolean).every(name => el.classList.contains(name))));
  }
};
const uiContext = { DotGame: context.DotGame, document };
vm.runInNewContext(source('ui'), uiContext);
const U = uiContext.DotGame.UI;
U.board(roomy);
assert.equal((uiNode('board').innerHTML.match(/class="bomb-badge"/g) || []).length, 1);
assert.match(uiNode('board').innerHTML, /帶炸彈標記的紅色寶石/);
U.select({ r: 1, c: 1 });
assert.equal(document.querySelectorAll('.bomb-preview,.bomb-area,.bomb-preview-origin').length, 0, '選取不再顯示範圍預覽');
assert.equal(document.querySelectorAll('.selected').length, 1);
U.select({ r: 1, c: 2 });
assert.equal(document.querySelectorAll('.bomb-hit').length, 0, '選取時尚未抽目標');
const afterMatch = roomy.map(row => row.slice()); afterMatch[1][1] = afterMatch[1][2] = 0;
const blastTargets = E.bombTargets(afterMatch, () => 0);
U.board(afterMatch); U.blast([{ r: 1, c: 1 }], afterMatch, blastTargets);
assert.equal(document.querySelectorAll('.bomb-area').length, 0);
assert.equal(document.querySelectorAll('.bomb-hit').length, 2);
assert.ok(document.querySelector('[data-cell="1,4"]').classList.contains('bomb-hit'), '標示遠處被抽中的寶石');
U.clearBomb();
assert.equal(document.querySelectorAll('.bomb-area,.bomb-hit,.bomb-origin').length, 0);
U.board(E.createBoard(LEVELS[18], rng).grid);
assert.doesNotMatch(uiNode('board').innerHTML, /bomb-badge|bomb-tile/);
console.log('PASS: 真實 UI 無九宮格預覽、全盤目標標示、結束清理與前十九關無標記');
