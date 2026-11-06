/* 冰封、鄰接破冰、組合機關與真實控制器。只使用測試記憶體及虛擬時鐘。 */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = name => fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8');
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const file of ['levels', 'engine']) vm.runInContext(source(file), ctx);
const { Engine: E, LEVELS } = ctx.DotGame;
const F = value => value + 400, B = color => color + 200, PPA = 100;
const board = rows => [Array(rows[0].length + 2).fill(0), ...rows.map(row => [0, ...row, 0]), Array(rows[0].length + 2).fill(0)];
assert.ok(LEVELS.slice(0, 39).every(l => !l.ice));
assert.equal(LEVELS[39].ice, 8); assert.equal(LEVELS[39].bombs || 0, 0, '冰封首次出場只用冰封機關');
assert.equal(E.baseValue(F(B(3))), 3); assert.ok(E.isBomb(F(B(3)))); assert.ok(E.isFrozen(F(B(3))));
const closed = board([[F(1), 1, 2, 2]]);
assert.equal(E.findPath(closed, { r: 1, c: 1 }, { r: 1, c: 2 }), null);
const onlyIce = board([[F(1), F(1)]]);
assert.equal(E.findMove(onlyIce), null, '提示與合法配對不得選冰封牌');
assert.equal(E.ppaTargets(onlyIce, 5).length, 1, 'PPA 可直接消除冰封同色對');
assert.equal(E.bombTargets(onlyIce).length, 1, '炸彈可以直接消除冰封同色對');

const adjacent = board([[F(1), 2, F(3)], [4, 2, F(4)], [F(5), F(6), 5]]);
const { thawed } = E.removePair(adjacent, [{ r: 1, c: 2 }, { r: 2, c: 2 }]);
assert.equal(thawed.length, 4);
assert.equal(adjacent[1][1], 1); assert.equal(adjacent[1][3], 3);
assert.equal(adjacent[2][3], 4); assert.equal(adjacent[3][2], 6);
assert.equal(adjacent[3][1], F(5), '斜角不破冰');
const combined = board([[F(B(1)), 2, 2, 1]]);
E.removePair(combined, [{ r: 1, c: 2 }, { r: 1, c: 3 }]);
assert.equal(combined[1][1], B(1), '破冰保留炸彈標記與原色');
assert.ok(E.findPath(combined, { r: 1, c: 1 }, { r: 1, c: 4 }));

// 強制 24 次隨機洗牌原地不動，驗證保底能把冰內同色牌交換至可操作格。
const stuck = board([[1, 2], [2, F(1)]]);
assert.equal(E.findMove(stuck), null);
const mixed = E.reshuffle(stuck, () => .99999);
assert.ok(E.findMove(mixed));
assert.ok(E.isFrozen(mixed[2][2]));
assert.equal(E.cells(mixed).map(p => E.thawValue(p.value)).sort().join(), '1,1,2,2');
const stuckPPA = board([[F(1), 1, PPA], [PPA, F(2), 2]]);
const fixedPPA = E.reshuffle(stuckPPA, () => .99999);
assert.ok(E.findMove(fixedPPA));
assert.equal(E.cells(fixedPPA).filter(p => E.isPPA(p.value)).length, 2);
assert.ok(E.cells(fixedPPA).filter(p => E.isFrozen(p.value)).every(p => E.baseValue(p.value) !== PPA));

// 密集冰封的固定盤面：單次隨機排列放不滿，須仍能保留十顆安全冰格。
let denseSeed = 4;
const denseRng = () => { denseSeed = (denseSeed * 1664525 + 1013904223) >>> 0; return denseSeed / 4294967296; };
const dense = E.createBoard({ id:40, cols:6, rows:6, tiles:36, colors:3, poolSize:15,
  ppaPairs:1, ice:10, layout:Array(6).fill('XXXXXX') }, denseRng).grid;
assert.equal(E.cells(dense).filter(p => E.isFrozen(p.value)).length, 10);
assert.ok(E.findMove(dense));
for (const p of E.cells(dense).filter(p => E.isFrozen(p.value))) {
  assert.ok(dense[p.r - 1][p.c] > 0 && dense[p.r][p.c - 1] > 0 && dense[p.r - 1][p.c - 1] >= 0);
  assert.ok([dense[p.r-1][p.c],dense[p.r+1][p.c],dense[p.r][p.c-1],dense[p.r][p.c+1]].every(v => !E.isFrozen(v)));
}
assert.ok(E.findMove(E.reshuffle(dense,denseRng)));

let seed = 90210;
const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
let games = 0, frozenHits = 0, ppaHits = 0, shuffles = 0;
for (const config of [{ bombs: 4, ice: 8 }, { bombs: 0, ice: 8 }, { bombs: 4, ice: 0 }]) {
  const level = { ...LEVELS[39], ...config };
  for (let run = 0; run < 100; run++) {
    let { grid } = E.createBoard(level, rng);
    assert.equal(E.cells(grid).filter(p => E.isFrozen(p.value)).length, config.ice);
    assert.equal(E.cells(grid).filter(p => E.isBomb(p.value)).length, config.bombs);
    assert.equal(E.cells(grid).filter(p => E.isPPA(p.value)).length, level.ppaPairs * 2);
    assert.ok(E.cells(grid).some(p => !E.isFrozen(p.value) && !E.isBomb(p.value) && !E.isPPA(p.value)));
    assert.ok(E.findMove(grid), '開局保留合法配對');
    for (const p of E.cells(grid).filter(p => E.isFrozen(p.value))) {
      const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dr, dc]) => grid[p.r + dr]?.[p.c + dc]);
      assert.ok(neighbors.filter(v => v > 0 && !E.isFrozen(v)).length >= 2);
      assert.ok(neighbors.every(v => !E.isFrozen(v)));
      assert.ok(grid[p.r - 1][p.c] > 0 && grid[p.r][p.c - 1] > 0 && grid[p.r - 1][p.c - 1] >= 0, '北／西鄰牌與安全轉角保留');
    }
    const shuffled = E.reshuffle(grid, rng);
    assert.equal(E.cells(shuffled).map(p => E.thawValue(p.value)).sort().join(), E.cells(grid).map(p => E.thawValue(p.value)).sort().join());
    grid.forEach((row, r) => row.forEach((v, c) => assert.equal(E.isFrozen(v), E.isFrozen(shuffled[r][c]))));
    assert.equal(E.cells(shuffled).filter(p => E.isPPA(p.value)).length, level.ppaPairs * 2);
    assert.ok(E.findMove(shuffled)); grid = shuffled;
    for (let steps = 0; E.cells(grid).length; steps++) {
      assert.ok(steps < level.tiles, '有限步內通關');
      const candidates = E.shuffle(E.cells(grid).filter(p => !E.isFrozen(p.value)), rng);
      let move;
      for (const a of candidates) {
        const b = candidates.find(b => E.findPath(grid, a, b));
        if (b) { move = { a, b }; break; }
      }
      if (!move) {
        const before = grid;
        grid = E.reshuffle(grid, rng); shuffles++;
        before.forEach((row, r) => row.forEach((v, c) => {
          assert.equal(E.isFrozen(v), E.isFrozen(grid[r][c]));
          if (v <= 0) assert.equal(v, grid[r][c]);
        }));
        move = E.findMove(grid); assert.ok(move, '洗牌後仍有可選配對');
      }
      const ppa = E.isPPA(grid[move.a.r][move.a.c]);
      const bomb = E.isBomb(grid[move.a.r][move.a.c]) || E.isBomb(grid[move.b.r][move.b.c]);
      E.removePair(grid, [move.a, move.b]);
      const extra = ppa ? E.ppaTargets(grid, 5, rng) : bomb ? E.bombTargets(grid, rng) : [];
      for (const pair of extra) {
        if (bomb) frozenHits += pair.filter(p => E.isFrozen(grid[p.r][p.c])).length;
        if (ppa) ppaHits += pair.filter(p => E.isFrozen(grid[p.r][p.c])).length;
        E.removePair(grid, pair);
      }
      for (const color of ctx.DotGame.GEMS) assert.equal(E.cells(grid).filter(p => E.baseValue(p.value) === color.id).length % 2, 0);
    }
    assert.equal(grid.flat().filter(v => v === -1).length, level.walls); games++;
  }
}
assert.ok(frozenHits > 0);
assert.ok(ppaHits > 0);
console.log(`PASS: ${games} 局機關組合全數通關，${shuffles} 次洗牌，炸彈／PPA 分別直接消除 ${frozenHits}／${ppaHits} 顆冰封牌`);

function boot(input, reduced = false) {
  let now = 1000, serial = 0, grid, combo = 0, clock = 0, selected = null, melts = [], dialog = '';
  const events = {}, jobs = new Map(), nodes = new Map();
  const node = id => { if (!nodes.has(id)) nodes.set(id, { textContent: '', inert: false, style: {}, classList: { add() {}, remove() {} }, addEventListener() {} }); return nodes.get(id); };
  const math = Object.create(Math); math.random = () => 0;
  const c = { console, Math: math, performance: { now: () => now }, matchMedia: () => ({ matches: reduced }),
    localStorage: { getItem: () => null, setItem() {} },
    setTimeout(fn, ms) { const id = ++serial; jobs.set(id, { fn, at: now + ms }); return id; }, clearTimeout(id) { jobs.delete(id); },
    requestAnimationFrame(fn) { const id = ++serial; jobs.set(id, { fn, at: now + 16 }); return id; }, cancelAnimationFrame(id) { jobs.delete(id); },
    document: { hidden: false, addEventListener(type, fn) { events[type] = fn; } }, addEventListener(type, fn) { events['window:' + type] = fn; } };
  c.window = c; vm.createContext(c);
  for (const file of ['levels', 'engine', 'storage']) vm.runInContext(source(file), c);
  const D = c.DotGame; D.Engine.createBoard = () => ({ grid: input.map(r => r.slice()), palette: [1, 2, 3] });
  D.CampaignUI = { home() {} }; D.Audio = { play() {} };
  D.UI = { $: node, icon: () => '', stars: () => '', clock: String, showView() {}, levels() {}, setupStage() {},
    board(g, _, thawed = []) { grid = g.map(row => row.slice()); melts = thawed; }, select(p) { selected = p; }, cell: () => node('tile'),
    updateTime(ms) { clock = ms; }, combo(n) { combo = n; }, line() {}, clearLine() {}, message() {}, ppaFeedback() {}, clearPPA() {},
    blast() {}, clearBomb() {}, clearToast() {}, toast() {}, soundButton() {}, modal(html) { dialog = html; node('modal').open = true; },
    closeModal() { dialog = ''; node('modal').open = false; } };
  vm.runInContext(source('game'), c);
  function advance(ms) { const until = now + ms; for (let i = 0; i < 100000; i++) { const job = [...jobs].sort((a, b) => a[1].at - b[1].at)[0]; if (!job || job[1].at > until) break; now = job[1].at; jobs.delete(job[0]); job[1].fn(); } now = until; }
  function action(action) { const el = { dataset: { action, level: '1' }, closest: () => null }; events.click({ target: { closest: s => s === '[data-action]' ? el : null } }); }
  function tile(r, c) { const el = { dataset: { r, c } }; events.click({ target: { closest: s => s === '[data-cell]' ? el : null } }); }
  action('play'); advance(650);
  return { D, node, tile, action, advance, get grid() { return grid; }, get selected() { return selected; }, get melts() { return melts; },
    get score() { return Number(node('score').textContent); }, get combo() { return combo; }, get clock() { return clock; }, get dialog() { return dialog; } };
}
const normal = boot(board([[F(1), 2, 2, 1], [3, 3, PPA, PPA]]));
normal.tile(1, 1); assert.equal(normal.selected, null); assert.equal(normal.score, 0);
normal.tile(1, 2); normal.tile(1, 1); assert.equal(normal.selected.c, 2, '點冰封牌不改原選取');
normal.tile(1, 3); assert.equal(normal.grid[1][1], 1); assert.equal(normal.melts.length, 1);
assert.equal(normal.score, 100); assert.equal(normal.combo, 1, '破冰不額外計分或累加連擊');
normal.advance(100); normal.tile(1, 1); normal.tile(1, 4); assert.equal(normal.combo, 2);
for (const reduced of [false, true]) {
  const bomb = boot(board([[B(1), 1, 0, 0], [0, 0, F(2), 2], [PPA, PPA, 3, 3]]), reduced);
  bomb.tile(1, 1); bomb.tile(1, 2); const left = bomb.clock;
  bomb.action('pause'); bomb.advance(30000); assert.ok(E.isFrozen(bomb.grid[2][3])); assert.equal(bomb.clock, left);
  bomb.action('resume'); bomb.advance(reduced ? 100 : 480);
  assert.equal(bomb.grid[2][3], 0); assert.equal(bomb.grid[2][4], 0);
  assert.equal(bomb.score, 200); assert.equal(bomb.combo, 1); assert.equal(bomb.grid[3][1], PPA);
}
for (const reduced of [false, true]) {
  const ppa = boot(board([[PPA, PPA, 0, 0], [0, 0, F(2), F(2)], [3, 3, PPA, PPA]]), reduced);
  ppa.tile(1, 1); ppa.tile(1, 2); const left = ppa.clock;
  ppa.action('pause'); ppa.advance(30000); assert.equal(ppa.clock, left); assert.ok(E.isFrozen(ppa.grid[2][3]));
  ppa.action('resume'); ppa.advance(reduced ? 140 : 640);
  assert.equal(ppa.grid[2][3], 0); assert.equal(ppa.grid[2][4], 0, 'PPA 直接移除冰封同色對');
  assert.equal(ppa.grid[3][3], PPA); assert.equal(ppa.grid[3][4], PPA);
  assert.equal(ppa.score, 200); assert.equal(ppa.combo, 1); assert.equal(ppa.clock, left);
}
const ppaNeighbors = boot(board([[PPA, PPA, 2, 2, F(3), 3]]));
ppaNeighbors.tile(1, 1); ppaNeighbors.tile(1, 2); ppaNeighbors.advance(640);
assert.equal(ppaNeighbors.grid[1][5], 3, 'PPA 消除鄰牌仍可以破冰');
const ppaLastIce = boot(board([[PPA, PPA, F(B(1)), F(1)]]));
ppaLastIce.tile(1, 1); ppaLastIce.tile(1, 2); ppaLastIce.advance(1200);
assert.match(ppaLastIce.dialog, /第 1 關完成/); assert.equal(E.cells(ppaLastIce.grid).length, 0, 'PPA 清除最後冰封對可通關，不引爆標記');
const final = boot(board([[F(1), 2, 2, 1]])); final.tile(1, 2); final.tile(1, 3); final.advance(100);
final.tile(1, 1); final.tile(1, 4); final.advance(1000); assert.match(final.dialog, /第 1 關完成/);

const uiNodes = new Map();
const uiNode = id => { if (!uiNodes.has(id)) uiNodes.set(id, { innerHTML: '', classList: { remove() {} } }); return uiNodes.get(id); };
vm.runInNewContext(source('ui'), { DotGame: ctx.DotGame, document: { getElementById: uiNode } });
ctx.DotGame.UI.board(board([[F(1), F(B(2)), PPA, 3]]));
assert.equal((uiNode('board').innerHTML.match(/class="ice-shell"/g) || []).length, 2);
assert.equal((uiNode('board').innerHTML.match(/disabled aria-label="冰封/g) || []).length, 2);
assert.match(uiNode('board').innerHTML, /冰封，帶炸彈標記的藍色寶石/);
ctx.DotGame.UI.board(board([[1, 2]]), null, [{ r: 1, c: 1 }]);
assert.match(uiNode('board').innerHTML, /ice-thaw/); assert.doesNotMatch(uiNode('board').innerHTML, /disabled/);
console.log('PASS: 禁止選取冰封牌、鄰接破冰、炸彈／PPA 穿冰、PPA 冰封尾盤通關、暫停與減少動畫、冰塊外框');
