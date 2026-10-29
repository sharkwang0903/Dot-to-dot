/* 可選的開發驗證：node tests/rules.test.js。使用 Node 內建模組，零套件。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = { console, localStorage: { getItem: () => null, setItem() {} } };
context.window = context;
vm.createContext(context);
for (const file of ['levels', 'engine', 'storage']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file + '.js'), 'utf8'), context);
const { Engine: E, LEVELS, Storage: S } = context.DotGame;
let seed = 87123;
const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
let assertions = 0;
function check(value, message) { assert.ok(value, message); assertions++; }

// 獨立的方向狀態搜尋，作為連線演算法的對照答案。
function referencePath(grid, a, b) {
  if (E.equal(a, b) || grid[a.r][a.c] <= 0 || grid[a.r][a.c] !== grid[b.r][b.c]) return false;
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  const queue = [{ ...a, dir: -1, turns: 0 }], seen = new Map();
  for (let index = 0; index < queue.length; index++) {
    const p = queue[index];
    for (let d = 0; d < 4; d++) {
      const turns = p.turns + (p.dir !== -1 && p.dir !== d ? 1 : 0);
      if (turns > 2) continue;
      const r = p.r + dirs[d][0], c = p.c + dirs[d][1];
      if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) continue;
      if (r === b.r && c === b.c) return true;
      if (grid[r][c] !== 0) continue;
      const key = `${r},${c},${d}`;
      if ((seen.get(key) ?? Infinity) <= turns) continue;
      seen.set(key, turns); queue.push({ r, c, dir: d, turns });
    }
  }
  return false;
}
function verifyRoute(grid, a, b, route) {
  check(route.length <= 4, '最多兩次轉彎');
  check(E.equal(route[0], a) && E.equal(route.at(-1), b), '路線端點正確');
  for (let i = 1; i < route.length; i++) {
    const p = route[i - 1], q = route[i];
    check(p.r === q.r || p.c === q.c, '每段都水平或垂直');
    const dr = Math.sign(q.r - p.r), dc = Math.sign(q.c - p.c);
    for (let r = p.r + dr, c = p.c + dc; r !== q.r || c !== q.c; r += dr, c += dc) check(grid[r][c] === 0, '路線沒有穿過障礙物');
    if (i < route.length - 1) check(grid[q.r][q.c] === 0, '轉角必須空白');
  }
}
for (let round = 0; round < 700; round++) {
  const grid = Array.from({ length: 7 }, (_, r) => Array.from({ length: 8 }, (_, c) => r === 0 || c === 0 || r === 6 || c === 7 ? 0 : rng() < .35 ? 0 : rng() < .2 ? -1 : 1 + Math.floor(rng() * 3)));
  const occupied = E.cells(grid);
  if (occupied.length < 2) continue;
  const a = occupied[Math.floor(rng() * occupied.length)], b = occupied[Math.floor(rng() * occupied.length)];
  const route = E.findPath(grid, a, b);
  check(!!route === referencePath(grid, a, b), '路線結果符合獨立方向搜尋');
  if (route) verifyRoute(grid, a, b, route);
}
console.log('PASS: 700 個隨機棋盤的連線結果與獨立搜尋一致');

let games = 0, shuffles = 0, bonuses = 0;
for (const [index, ordinary, ppa, colors, seconds] of [[0,28,2,7,90],[1,40,4,7,120],[2,42,6,8,135]]) {
  const level = LEVELS[index];
  check(level.tiles === ordinary + ppa && level.ppaPairs * 2 === ppa && level.colors === colors && level.seconds === seconds, '前三關固定總牌數、普通色數、限時及 PPA 配對數');
  for (let run = 0; run < 20; run++) {
    const { grid } = E.createBoard(level, rng), mixed = E.reshuffle(grid, rng);
    check(E.cells(mixed).filter(p => E.isPPA(p.value)).length === ppa, '多對 PPA 洗牌保留全部數量');
    check(E.cells(mixed).filter(p => !E.isPPA(p.value)).length === ordinary, '普通牌數不變');
    check(E.cells(grid).map(p => p.value).sort().join(',') === E.cells(mixed).map(p => p.value).sort().join(','), '洗牌保留每一種類的數量');
    grid.forEach((row,r) => row.forEach((v,c) => check(v > 0 ? mixed[r][c] > 0 : mixed[r][c] === v, '多對 PPA 洗牌仍保留格位及留白')));
    for (const pair of E.ppaTargets(mixed, 5, rng)) check(pair.every(p => !E.isPPA(p.value)), '自動消除排除所有 PPA');
  }
}
check(LEVELS.slice(3).every(level => !level.ppaPairs), '第 4～16 關不加入 PPA');
for (const level of LEVELS) {
  check(level.tiles % 2 === 0, `第 ${level.id} 關牌數成對`);
  check(level.layout.every(row => row.length === level.cols), '版型每列等寬');
  check(level.colors <= level.poolSize && level.poolSize <= context.DotGame.GEMS.length, '色數在該關可抽選集合內');
  check(level.tiles >= level.colors * 2, '每種顏色至少一組');
  check((level.id >= 4) === (level.walls > 0), '第 4 關開始有牆');
  // 任何兩個剩餘位置在只有牆壁時都能相連，避免洗牌也救不了的尾盤。
  const empty = E.createBoard(level, rng).grid.map(row => row.map(v => v === -1 ? -1 : 0));
  const positions = [];
  level.layout.forEach((row, r) => [...row].forEach((v, c) => { if (v === 'X') positions.push({ r: r + 1, c: c + 1 }); }));
  for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
    const a = positions[i], b = positions[j]; empty[a.r][a.c] = empty[b.r][b.c] = 1;
    check(E.findPath(empty, a, b), `第 ${level.id} 關尾盤不可相連：${JSON.stringify([a, b])}`);
    empty[a.r][a.c] = empty[b.r][b.c] = 0;
  }
  const signatures = new Set(), palettes = new Set();
  for (let run = 0; run < 35; run++) {
    let { grid, palette } = E.createBoard(level, rng);
    check(new Set(E.cells(grid).filter(p => !E.isPPA(p.value)).map(p => p.value)).size === level.colors, '普通顏色種類固定');
    check(E.cells(grid).filter(p => E.isPPA(p.value)).length === (level.ppaPairs || 0) * 2, 'PPA 完整成對且只在指定關卡');
    check(palette.every(id => id <= level.poolSize), '寶石依關卡逐步加入集合');
    for (const color of palette) check(E.cells(grid).filter(p => p.value === color).length % 2 === 0, '每種顏色成對');
    check(E.cells(grid).length === level.tiles, '牌數正確');
    check(E.findMove(grid), '開局有合法配對');
    signatures.add(JSON.stringify(grid)); palettes.add(palette.slice().sort().join(','));
    let steps = 0;
    while (E.cells(grid).length) {
      check(++steps < level.tiles, '有限步內完成');
      let move = E.findMove(grid);
      if (!move) {
        const before = grid.map(row => row.slice()), values = E.cells(grid).map(p => p.value).sort().join(',');
        grid = E.reshuffle(grid, rng); shuffles++;
        check(E.cells(grid).map(p => p.value).sort().join(',') === values, '洗牌保留顏色數量');
        before.forEach((row, r) => row.forEach((v, c) => { check((v > 0) === (grid[r][c] > 0), '洗牌保留位置'); if (v <= 0) check(grid[r][c] === v, '洗牌保留空格和牆'); }));
        move = E.findMove(grid); check(move, '洗牌後有合法配對');
      }
      verifyRoute(grid, move.a, move.b, move.path);
      const ppa = E.isPPA(grid[move.a.r][move.a.c]);
      grid[move.a.r][move.a.c] = grid[move.b.r][move.b.c] = 0;
      if (ppa) for (const pair of E.ppaTargets(grid, steps, rng)) {
        check(pair[0].value === pair[1].value && !E.isPPA(pair[0].value), 'PPA 只消普通同色完整配對');
        pair.forEach(p => { grid[p.r][p.c] = 0; }); bonuses++;
      }
    }
    check(grid.flat().filter(v => v === -1).length === level.walls, '通關不消除牆'); games++;
  }
  check(signatures.size === 35, '每次牌面隨機');
  check(level.colors === level.poolSize || palettes.size > 1, '每次隨機抽取顏色集合');
  console.log(`PASS: 第 ${level.id} 關，${level.tiles} 顆、${level.colors} 色、${level.walls} 牆，35 局全數完成`);
}
// 強制讓隨機洗牌一直返回原排列，驗證有上限的保底算法。
const stuck = [[0,0,0,0],[0,1,2,0],[0,2,1,0],[0,0,0,0]];
check(!E.findMove(stuck), '測試棋盤沒有合法組合');
const fixed = E.reshuffle(stuck, () => .99999);
check(E.findMove(fixed), '隨機重試失敗後保底仍有合法組合');
const special = context.DotGame.PPA.id;
const ppaStuck = stuck.map(row => row.map(v => v === 1 ? special : v));
const ppaFixed = E.reshuffle(ppaStuck, () => .99999);
check(E.findMove(ppaFixed) && E.cells(ppaFixed).filter(p => E.isPPA(p.value)).length === 2, '保底洗牌保留 PPA');
const mixed = [[0,0,0,0,0,0],[0,special,1,2,1,0],[0,2,special,3,3,0],[0,0,0,0,0,0]];
const original = JSON.stringify(mixed);
for (const combo of [1,2,5,6,50]) {
  const targets = E.ppaTargets(mixed, combo, rng);
  check(targets.length === Math.min(combo,3), '目標對數依連擊並受剩餘對數限制');
  check(new Set(targets.flat().map(p => `${p.r},${p.c}`)).size === targets.length * 2, '目標不重複');
  check(targets.flat().every(p => !E.isPPA(p.value)), '自動消除永遠排除 PPA');
  check(JSON.stringify(mixed) === original, '規劃效果不提早改動棋盤');
}
check(E.ppaTargets([[0,0,0,0],[0,special,special,0],[0,0,0,0]],5).length === 0, '只剩 PPA 時零對');
check(E.ppaStrength(0) === 1 && E.ppaStrength(5) === 5 && E.ppaStrength(100) === 5, 'PPA 強度上下限');
assert.throws(() => E.createBoard({ ...LEVELS[0], ppaPairs: 10 }), /完整 PPA/);
check([0,1,2,3].map(i => E.stars([0, 1, 25, 50.001][i], 100)).join(',') === '0,1,2,3', '星級基本門檻');
check(E.stars(50,100) === 2 && E.stars(24.999,100) === 1 && E.stars(25,100) === 2, '星級邊界精確');
check(context.DotGame.COMBO_WINDOW_MS === 5000, '連擊窗口統一為五秒');
check(E.nextCombo(4,100,5100) === 5 && E.nextCombo(4,100,5100.01) === 1, '連擊 5000ms 包含邊界');
check(E.nextCombo(5,100,500) === 6 && E.nextCombo(0,null,500) === 1, '第六擊延續與首次連擊');
check(E.nextCombo(10,100,500) === 11 && E.nextCombo(100,100,500) === 101, '連擊持續累積，不受五或十次限制');
S.record(1, { stars:3,score:1000,time:20 }); S.record(1,{ stars:1,score:500,time:40 });
check(S.get().records[1].stars === 3 && S.get().records[1].score === 1000 && S.get().records[1].time === 20, '重玩不覆蓋較佳紀錄');
S.record(2, { stars:2,score:2000,time:30 });
check(S.get().unlocked === 3 && S.get().records[1].score === 1000, '關卡獨立紀錄並逐關解鎖');
console.log(`PASS: ${games} 局、${shuffles} 次死局洗牌、${bonuses} 次獎勵、${assertions} 項斷言；星級／連擊／進度邊界全部通過`);
