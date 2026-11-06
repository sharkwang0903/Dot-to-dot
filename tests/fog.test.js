/* 薄霧只影響視線；驗證逐層揭露、混合機關、洗牌及真實遊戲控制器。 */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = name => fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8');
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const file of ['levels', 'engine']) vm.runInContext(source(file), ctx);
const { Engine: E, LEVELS } = ctx.DotGame;
const M = (value, depth = 2) => depth * 1000 + value, I = value => 400 + value, B = color => 200 + color, PPA = 100;
const board = rows => [Array(rows[0].length + 2).fill(0), ...rows.map(row => [0, ...row, 0]), Array(rows[0].length + 2).fill(0)];
assert.equal(LEVELS.length, 100); assert.ok(LEVELS.slice(0, 59).every(l => !l.fog));
for (const [id, key] of [[20, 'bombs'], [40, 'ice'], [60, 'fog'], [80, 'clocks']]) {
  assert.ok(LEVELS[id - 1][key]);
  assert.ok(['bombs','ice','fog','clocks'].every(k => k === key || !LEVELS[id - 1][k]), '首次只放新機關');
}
for (const ice of [false,true]) for (const bomb of [false,true]) for (const depth of [0,1,2]) {
  const value = M((ice ? I : v => v)((bomb ? B : v => v)(3)), depth);
  assert.equal(E.baseValue(value), 3); assert.equal(E.isFrozen(value), ice);
  assert.equal(E.isBomb(value), bomb); assert.equal(E.fogDepth(value), depth);
}
assert.ok(E.isPPA(M(PPA))); assert.equal(E.isFrozen(M(PPA)), false);
const legal = board([[M(1), 1, M(PPA), PPA]]);
assert.ok(E.findPath(legal, { r: 1, c: 1 }, { r: 1, c: 2 }), '霧中普通牌仍可合法配對');
assert.ok(E.findPath(legal, { r: 1, c: 3 }, { r: 1, c: 4 }), '霧中 PPA 可觸發');

const reveal = board([[0,1,0,0], [1,M(4),2,2], [0,3,0,M(5)], [0,3,0,0]]);
let change = E.removePair(reveal, [{ r: 1, c: 2 }, { r: 2, c: 1 }]);
assert.equal(E.fogDepth(reveal[2][2]), 1, '同時鄰接兩端點也只減一層');
assert.equal(change.revealed.length, 1); assert.equal(E.fogDepth(reveal[3][4]), 2, '斜角不揭露');
change = E.removePair(reveal, [{ r: 2, c: 3 }, { r: 2, c: 4 }]);
assert.equal(reveal[2][2], 4); assert.equal(E.fogDepth(reveal[3][4]), 1);
const layered = board([[M(I(B(1))), 2, 2, 1]]);
change = E.removePair(layered, [{ r: 1, c: 2 }, { r: 1, c: 3 }]);
assert.equal(layered[1][1], M(B(1), 1)); assert.equal(change.thawed.length, 1); assert.equal(change.revealed.length, 1);
E.removePair(layered, [{ r: 1, c: 1 }, { r: 1, c: 4 }]);
assert.equal(layered[1][1], 0, '直接命中連霧與寶石一起清空');

const stuck = board([[M(1), M(2, 1)], [2, M(I(1))]]);
assert.equal(E.findMove(stuck), null);
const mixed = E.reshuffle(stuck, () => .99999);
assert.ok(E.findMove(mixed), '強制保底仍可配對');
stuck.forEach((row, r) => row.forEach((v, c) => {
  assert.equal(E.fogDepth(v), E.fogDepth(mixed[r][c])); assert.equal(E.isFrozen(v), E.isFrozen(mixed[r][c]));
}));
assert.equal(E.cells(mixed).map(p => E.tileValue(p.value)).sort().join(), '1,1,2,2');
const special = board([[M(I(B(2))), M(2), M(PPA), PPA]]);
for (const pairs of [E.bombTargets(special, () => 0), E.ppaTargets(special, 5, () => 0)]) {
  assert.equal(pairs.length, 1); assert.ok(pairs[0].every(p => E.baseValue(p.value) === 2));
  assert.ok(pairs[0].some(p => E.isFrozen(p.value) && E.isFogged(p.value)));
}

let seed = 314159, games = 0;
const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
for (const level of LEVELS.filter(l => l.fog)) for (let run = 0; run < 20; run++) {
  let { grid } = E.createBoard(level, rng);
  assert.equal(E.cells(grid).filter(p => E.isFogged(p.value)).length, level.fogTiles);
  assert.ok(level.fogTiles > 0 && level.fogTiles <= (level.id >= 81 ? Math.floor(level.tiles / 2) : 12));
  assert.equal(E.cells(grid).filter(p => E.isPPA(p.value)).length, level.ppaPairs * 2);
  assert.ok(E.cells(grid).some(p => !E.isPPA(p.value) && !E.isBomb(p.value) && !E.isFrozen(p.value) && !E.isFogged(p.value)));
  grid.forEach((row, r) => row.forEach((v, c) => {
    if (!E.isFogged(v)) return;
    assert.ok(r > level.fog.row && r <= level.fog.row + level.fog.rows && c > level.fog.col && c <= level.fog.col + level.fog.cols);
    assert.equal(E.fogDepth(v), 2);
  }));
  for (let steps = 0; E.cells(grid).length; steps++) {
    assert.ok(steps < level.tiles);
    let move;
    const candidates = E.shuffle(E.cells(grid).filter(p => !E.isFrozen(p.value)), rng);
    for (const a of candidates) { const b = candidates.find(b => E.findPath(grid, a, b)); if (b) { move = { a, b }; break; } }
    if (!move) {
      const before = grid; grid = E.reshuffle(grid, rng);
      before.forEach((row, r) => row.forEach((v, c) => assert.equal(E.fogDepth(v), E.fogDepth(grid[r][c]))));
      move = E.findMove(grid); assert.ok(move);
    }
    const ppa = E.isPPA(grid[move.a.r][move.a.c]), bomb = [move.a,move.b].some(p => E.isBomb(grid[p.r][p.c]));
    E.removePair(grid, [move.a,move.b]);
    const extra = ppa ? E.ppaTargets(grid, steps + 1, rng) : bomb ? E.bombTargets(grid, rng) : [];
    for (const pair of extra) { E.removePair(grid, pair); assert.ok(pair.every(p => grid[p.r][p.c] === 0)); }
  }
  assert.equal(grid.flat().filter(v => E.isFogged(v)).length, 0); games++;
}
console.log(`PASS: ${games} 局薄霧與混合機關隨機操作全數通關，兩層揭露、洗牌保底、狀態疊加與 PPA／炸彈穿霧`);

function boot(input, reduced = false) {
  let now = 1000, serial = 0, grid, clock = 0, combo = 0, selected = null, dialog = '', blasts = 0;
  const events = {}, jobs = new Map(), nodes = new Map();
  const node = id => { if (!nodes.has(id)) nodes.set(id, { textContent: '', inert: false, style: {}, classList: { add() {}, remove() {} }, addEventListener() {} }); return nodes.get(id); };
  const math = Object.create(Math); math.random = () => 0;
  const c = { Math: math, performance: { now: () => now }, matchMedia: () => ({ matches: reduced }),
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout(fn, ms) { const id = ++serial; jobs.set(id, { fn, at: now + ms }); return id; }, clearTimeout(id) { jobs.delete(id); },
    requestAnimationFrame(fn) { const id = ++serial; jobs.set(id, { fn, at: now + 16 }); return id; }, cancelAnimationFrame(id) { jobs.delete(id); },
    document: { hidden: false, addEventListener(type, fn) { events[type] = fn; } }, addEventListener(type, fn) { events['window:' + type] = fn; } };
  c.window = c; vm.createContext(c); for (const f of ['levels','engine','storage']) vm.runInContext(source(f), c);
  const D = c.DotGame; D.Engine.createBoard = () => ({ grid: input.map(r => r.slice()), palette: [1,2,3] });
  D.Audio = { play() {} }; D.CampaignUI = { home() {} };
  D.UI = { $: node, icon: () => '', stars: () => '', clock: String, showView() {}, levels() {}, setupStage() {},
    board(g) { grid = g.map(row => row.slice()); }, select(p) { selected = p; }, cell: () => node('tile'),
    updateTime(ms) { clock = ms; }, combo(n) { combo = n; }, line() {}, clearLine() {}, message() {}, ppaFeedback() {}, clearPPA() {},
    blast() { blasts++; }, clearBomb() {}, clearToast() {}, toast() {}, soundButton() {},
    modal(html) { dialog = html; node('modal').open = true; }, closeModal() { dialog = ''; node('modal').open = false; } };
  vm.runInContext(source('game'), c);
  function advance(ms) { const until = now + ms; for (let i = 0; i < 100000; i++) { const job = [...jobs].sort((a,b) => a[1].at - b[1].at)[0]; if (!job || job[1].at > until) break; now = job[1].at; jobs.delete(job[0]); job[1].fn(); } now = until; }
  function action(action) { const el = { dataset: { action, level: '1' }, closest: () => null }; events.click({ target: { closest: s => s === '[data-action]' ? el : null } }); }
  function tile(r, c) { const el = { dataset: { r, c } }; events.click({ target: { closest: s => s === '[data-cell]' ? el : null } }); }
  action('play'); advance(650);
  return { node, action, tile, advance, get grid() { return grid; }, get clock() { return clock; }, get combo() { return combo; },
    get selected() { return selected; }, get score() { return Number(node('score').textContent); }, get dialog() { return dialog; }, get blasts() { return blasts; } };
}
const manual = boot(board([[M(1),1,2,2], [M(3),3,PPA,PPA]]));
manual.tile(1,1); assert.equal(manual.selected.c, 1); manual.tile(1,2);
assert.equal(manual.grid[1][1], 0); assert.equal(E.fogDepth(manual.grid[2][1]), 1);
assert.equal(manual.score, 100); assert.equal(manual.combo, 1, '揭露本身不加分或增加連擊');
const gradual = boot(board([[0,1,0,0], [1,M(4),2,2], [0,3,0,4], [0,3,0,0]]));
gradual.tile(1,2); gradual.tile(2,1); assert.equal(E.fogDepth(gradual.grid[2][2]), 1);
gradual.advance(100); gradual.tile(2,3); gradual.tile(2,4); assert.equal(gradual.grid[2][2], 4);
for (const reduced of [false,true]) for (const kind of ['ppa','bomb']) {
  const trigger = kind === 'ppa' ? M(PPA) : M(B(1));
  const other = kind === 'ppa' ? PPA : 1;
  const t = boot(board([[trigger,other,0,0], [0,0,M(I(B(2))),M(2)], [3,3,M(PPA),PPA]]), reduced);
  t.tile(1,1); t.tile(1,2); const left = t.clock; t.action('pause'); t.advance(30000);
  assert.equal(t.grid[2][3], M(I(B(2)))); assert.equal(t.clock, left);
  t.action('resume'); t.advance(reduced ? kind === 'ppa' ? 140 : 100 : kind === 'ppa' ? 640 : 480);
  assert.equal(t.grid[2][3], 0); assert.equal(t.grid[2][4], 0); assert.equal(t.score, 200); assert.equal(t.combo, 1);
  assert.equal(E.tileValue(t.grid[3][3]), PPA); assert.equal(E.fogDepth(t.grid[3][3]), 1, '其他 PPA 保留，鄰牌消除仍會讓霧變薄');
  assert.equal(t.blasts, kind === 'ppa' ? 0 : 2, '自動命中標記不連鎖');
  t.action('retry'); t.advance(650); t.advance(2000); assert.equal(t.grid[2][3], M(I(B(2))), '重玩不殘留舊效果');
}
const last = boot(board([[M(1),1]])); last.tile(1,1); last.tile(1,2); last.advance(1000); assert.match(last.dialog, /第 1 關完成/);

const nodes = new Map(), node = id => { if (!nodes.has(id)) nodes.set(id, { innerHTML: '' }); return nodes.get(id); };
vm.runInNewContext(source('ui'), { DotGame: ctx.DotGame, document: { getElementById: node } });
const U = ctx.DotGame.UI;
U.board(board([[M(1),M(PPA),M(B(2)),M(I(3)),4]]));
let buttons = [...node('board').innerHTML.matchAll(/<button\b[^>]*>/g)].map(m => m[0]);
assert.equal((node('board').innerHTML.match(/class="fog-veil"/g) || []).length, 4);
assert.equal(buttons.filter(s => s.includes('disabled')).length, 1, '薄霧不會禁用，只有冰封禁用');
assert.ok(buttons.slice(0,4).every(s => s.includes('薄霧中的寶石') && !/紅色寶石|PPA 特殊瓶子|帶炸彈標記/.test(s)), '無障礙名稱不洩露被遮住牌色／道具');
U.board(board([[M(1,1),2]]), null, [], [{ r: 1, c: 1 }]); assert.match(node('board').innerHTML, /fog-thinning/);
U.board(board([[1,2]]), null, [], [{ r: 1, c: 1 }]); assert.match(node('board').innerHTML, /fog-reveal/);
assert.match(node('board').innerHTML, /紅色寶石/);
console.log('PASS: 霧中可點選／觸發、PPA與炸彈連霧消除、暫停／重玩／結算、霧層與逐層揭露及無障礙名稱');
