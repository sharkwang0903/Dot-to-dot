/* 終章的區域配置、光環起手、自由清除順序與特殊機關共存。 */
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const name of ['levels','engine']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8'),ctx);
const { Engine:E, LEVELS } = ctx.DotGame;
const inside = (p, z, level) => z.edge ? p.r === 1 || p.c === 1 || p.r === level.rows || p.c === level.cols :
  p.r > z.row && p.r <= z.row + z.rows && p.c > z.col && p.c <= z.col + z.cols;
const points = positions => positions.map(p => ({ r:p.r+1,c:p.c+1 }));
let seed=20261106, games=0;
const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
assert.equal(LEVELS.length,100); assert.equal(LEVELS[98].name,'四象交會'); assert.equal(LEVELS[99].name,'最後一道光');
const ring=LEVELS[99].layout;
assert.equal(ring.join('/'),ring.slice().reverse().join('/'),'光環上下對稱');
assert.ok(ring.every(row=>row===Array.from(row).reverse().join('')),'光環左右對稱');
assert.equal(ring[4].slice(4,8),'....'); assert.equal(ring[5].slice(4,8),'....');
for(const level of LEVELS.slice(98)) {
  assert.equal(level.tiles,100);assert.equal(level.ppaPairs,5);assert.equal(level.seconds,210);
  assert.equal(level.clocks.plus,0);assert.ok(level.clocks.minus>=6 && level.clocks.minus<=8);
  let iceFocus=0;const endings=new Set();
  for(let run=0;run<200;run++) {
    let {grid,palette}=E.createBoard(level,rng);const initial=E.cells(grid);
    assert.equal(initial.filter(p=>E.isPPA(p.value)).length,10);
    assert.equal(initial.filter(p=>E.isBomb(p.value)).length,8);
    assert.equal(initial.filter(p=>E.isFrozen(p.value)).length,level.ice);
    assert.equal(initial.filter(p=>E.isFogged(p.value)).length,level.fogTiles);
    assert.equal(initial.filter(p=>E.clockType(p.value)===2).length,level.clocks.minus);
    assert.ok(initial.filter(p=>E.clockType(p.value)).every(p=>inside(p,level.clockZone,level)&&!E.isFrozen(p.value)&&!E.isFogged(p.value)), '減時留在清楚可見的區域');
    assert.ok(initial.some(p=>!E.isPPA(p.value)&&!E.isBomb(p.value)&&!E.isFrozen(p.value)&&!E.isFogged(p.value)&&!E.clockType(p.value)));
    if(level.id===99) {
      assert.ok(initial.filter(p=>E.isBomb(p.value)).every(p=>inside(p,level.bombZone,level)),'炸彈集中左下區');
      iceFocus+=initial.filter(p=>E.isFrozen(p.value)&&inside(p,level.iceZone,level)).length;
    } else {
      assert.ok(initial.filter(p=>E.isFrozen(p.value)).every(p=>inside(p,level.iceZone,level)),'冰封只在內側');
      const opening=points(level.openingPair);
      assert.ok(E.findPath(grid,...opening));
      assert.ok(opening.every(p=>E.baseValue(grid[p.r][p.c])===grid[p.r][p.c]),'外圈起手為清楚、可直接選取的一般寶石');
    }
    const starter=points(level.bombPair);assert.ok(E.findPath(grid,...starter));
    assert.ok(starter.some(p=>E.isBomb(grid[p.r][p.c])),'保留一組可觸發的炸彈機會');
    for(const color of palette)assert.equal(initial.filter(p=>E.baseValue(p.value)===color).length%2,0,'起手排列不改各色成對');
    const shuffled=E.reshuffle(grid,rng);
    assert.equal(E.cells(shuffled).map(p=>E.tileValue(p.value)).sort().join(),initial.map(p=>E.tileValue(p.value)).sort().join());
    grid.forEach((row,r)=>row.forEach((v,c)=>{assert.equal(E.fogDepth(v),E.fogDepth(shuffled[r][c]));assert.equal(E.isFrozen(v),E.isFrozen(shuffled[r][c]));}));
    assert.ok(E.findMove(shuffled));
    let remaining=level.seconds*1000, last='';
    for(let step=0;E.cells(grid).length;step++) {
      assert.ok(step<level.tiles);
      let move;
      const candidates=E.shuffle(E.cells(grid).filter(p=>!E.isFrozen(p.value)),rng);
      for(const a of candidates){const b=candidates.find(b=>E.findPath(grid,a,b));if(b){move={a,b};break;}}
      if(!move){grid=E.reshuffle(grid,rng);move=E.findMove(grid);assert.ok(move);}
      const ppa=E.isPPA(grid[move.a.r][move.a.c]), bomb=[move.a,move.b].some(p=>E.isBomb(grid[p.r][p.c]));
      last=ppa?'ppa':bomb?'bomb':'ordinary';
      remaining=Math.max(0,remaining-2000+E.removePair(grid,[move.a,move.b]).timeDelta);
      assert.ok(remaining>0||!E.cells(grid).length,'每兩秒完成一組的模擬可正常通關');
      const extra=ppa?E.ppaTargets(grid,step+1,rng):bomb?E.bombTargets(grid,rng):[];
      for(const pair of extra){remaining=Math.max(0,remaining+E.removePair(grid,pair).timeDelta);assert.ok(remaining>0||!E.cells(grid).length);}
    }
    endings.add(last);assert.equal(E.cells(grid).length,0);games++;
  }
  assert.ok(endings.has('ordinary'),'最後一對可為普通寶石，沒有強制留下 PPA');
  if(level.id===99)assert.ok(iceFocus>=200*level.ice/2,'冰封優先集中右上安全格');
}
console.log(`PASS: ${games} 局終章隨機操作通關；四區配置、光環內側冰霧、可見減時、普通起手、PPA 數量與自由結尾均正確`);
