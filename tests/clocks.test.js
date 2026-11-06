/* 加／減時寶石：真實控制器、虛擬時鐘，不寫玩家存檔。 */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = name => fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8');
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const name of ['levels','engine']) vm.runInContext(source(name), ctx);
const { Engine: E, LEVELS } = ctx.DotGame;
const PLUS = value => 10000 + value, MINUS = value => 20000 + value;
const ICE = value => 400 + value, FOG = value => 2000 + value, BOMB = value => 200 + value, PPA = 100;
const board = rows => [Array(rows[0].length + 2).fill(0), ...rows.map(row => [0,...row,0]), Array(rows[0].length + 2).fill(0)];
assert.equal(LEVELS.length, 100); assert.ok(LEVELS.slice(0,79).every(l => !l.clocks));
assert.equal(LEVELS[79].clocks.plus, 2); assert.equal(LEVELS[79].clocks.minus, 2);
assert.ok(!LEVELS[79].bombs && !LEVELS[79].ice && !LEVELS[79].fog);
assert.equal(ctx.DotGame.CLOCK.maxMinusPairs,5);
assert.throws(()=>E.createBoard({...LEVELS[89],clocks:{plus:1,minus:2}}),/只能配置減時/);
assert.throws(()=>E.createBoard({...LEVELS[89],clocks:{plus:0,minus:11}}),/最多五對/);
let seed=456789;
const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(const level of LEVELS.slice(89))for(let run=0;run<100;run++) {
  assert.equal(level.clocks.plus,0);
  assert.ok(level.clocks.minus>0 && level.clocks.minus<=10);
  const {grid}=E.createBoard(level,rng),mixed=E.reshuffle(grid,rng);
  for(const g of [grid,mixed]) {
    const cells=E.cells(g);
    assert.equal(cells.filter(p=>E.clockType(p.value)===1).length,0);
    assert.equal(cells.filter(p=>E.clockType(p.value)===2).length,level.clocks.minus);
    assert.equal(cells.filter(p=>E.isPPA(p.value)).length,level.ppaPairs*2);
    assert.ok(cells.some(p=>!E.isPPA(p.value)&&!E.isBomb(p.value)&&!E.isFrozen(p.value)&&!E.clockType(p.value)));
  }
}
const cap=E.createBoard({...LEVELS[89],clocks:{plus:0,minus:10}},rng).grid;
assert.equal(E.cells(cap).filter(p=>E.clockType(p.value)===2).length,10,'上限五對可正常開局');
console.log('PASS: 第 90～100 關 1100 次開局及洗牌只有減時、保留 PPA 與一般寶石，五對上限允許、超量或加時配置拒絕');
for (const mark of [PLUS,MINUS]) for (const ice of [false,true]) for (const fog of [false,true]) for (const bomb of [false,true]) {
  const value = mark((ice ? ICE : v => v)((fog ? FOG : v => v)((bomb ? BOMB : v => v)(3))));
  assert.equal(E.baseValue(value), 3); assert.equal(E.isFrozen(value), ice); assert.equal(E.isFogged(value), fog);
  assert.equal(E.isBomb(value), bomb); assert.equal(E.clockType(value), mark === PLUS ? 1 : 2);
}
for (const [a,b,expected] of [[PLUS(1),1,3000],[MINUS(1),1,-3000],[PLUS(1),PLUS(1),6000],
  [MINUS(1),MINUS(1),-6000],[PLUS(1),MINUS(1),0]]) {
  const grid = board([[a,b]]); assert.ok(E.findPath(grid,{r:1,c:1},{r:1,c:2}));
  assert.equal(E.removePair(grid,[{r:1,c:1},{r:1,c:2}]).timeDelta, expected);
}
const buried = board([[FOG(ICE(MINUS(2))),FOG(2),PPA,PPA]]);
for (const pairs of [E.ppaTargets(buried,5,()=>0), E.bombTargets(buried,()=>0)]) {
  assert.equal(pairs.length,1); assert.ok(pairs[0].some(p => E.clockType(p.value) === 2));
}
const stuck = board([[PLUS(1),2],[2,MINUS(1)]]);
assert.equal(E.findMove(stuck),null);
const mixed = E.reshuffle(stuck,()=>.99999);
assert.ok(E.findMove(mixed));
assert.equal(E.cells(mixed).map(p=>p.value).sort().join(), E.cells(stuck).map(p=>p.value).sort().join());

function boot(input, reduced = false) {
  let now=1000, serial=0, grid, clock=0, combo=0, dialog='', selected=null, toasts=[];
  const events={}, jobs=new Map(), nodes=new Map();
  const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',inert:false,open:false,dataset:{},style:{},classList:{add(){},remove(){}},addEventListener(){}});return nodes.get(id);};
  const math=Object.create(Math);math.random=()=>0;
  const c={Math:math,performance:{now:()=>now},matchMedia:()=>({matches:reduced}),localStorage:{getItem:()=>null,setItem(){}},
    setTimeout(fn,ms){const id=++serial;jobs.set(id,{fn,at:now+ms});return id;},clearTimeout(id){jobs.delete(id);},
    requestAnimationFrame(fn){const id=++serial;jobs.set(id,{fn,at:now+16});return id;},cancelAnimationFrame(id){jobs.delete(id);},
    document:{hidden:false,addEventListener(type,fn){events[type]=fn;}},addEventListener(type,fn){events['window:'+type]=fn;}};
  c.window=c;vm.createContext(c);for(const name of ['levels','engine','storage'])vm.runInContext(source(name),c);
  const D=c.DotGame;D.Engine.createBoard=()=>({grid:input.map(row=>row.slice()),palette:[1,2,3]});
  D.CampaignUI={home(){}};D.Audio={play(){}};
  D.UI={$:node,icon:()=>'',stars:n=>`stars:${n}`,clock:String,showView(){},levels(){},setupStage(){},
    board(g){grid=g.map(row=>row.slice());},select(p){selected=p;},cell:()=>node('tile'),updateTime(ms){clock=ms;},combo(n){combo=n;},
    line(){},clearLine(){},message(){},ppaFeedback(){},clearPPA(){},blast(){},clearBomb(){},clearToast(){},soundButton(){},
    toast(text){toasts.push(text);},modal(html){dialog=html;node('modal').open=true;},closeModal(){dialog='';node('modal').open=false;}};
  vm.runInContext(source('game'),c);
  function advance(ms){const until=now+ms;for(let n=0;n<100000;n++){const job=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!job||job[1].at>until)break;now=job[1].at;jobs.delete(job[0]);job[1].fn();}now=until;}
  function action(action){const el={dataset:{action,level:'1'},closest:()=>null};events.click({target:{closest:s=>s==='[data-action]'?el:null}});}
  function tile(r,c){const el={dataset:{r,c}};events.click({target:{closest:s=>s==='[data-cell]'?el:null}});}
  action('play');advance(650);
  return {D,node,action,tile,advance,get grid(){return grid;},get clock(){return clock;},get combo(){return combo;},
    get score(){return Number(node('score').textContent);},get dialog(){return dialog;},get selected(){return selected;},get toasts(){return toasts;}};
}
const plus=boot(board([[PLUS(1),1,2,2],[3,3,PPA,PPA]]));
plus.tile(1,1);plus.tile(1,2);assert.equal(plus.clock,93000);assert.equal(plus.score,100);assert.equal(plus.combo,1);
assert.match(plus.toasts.at(-1),/\+3 秒/);
plus.advance(100);plus.tile(1,3);plus.tile(1,4);assert.equal(plus.combo,2);assert.equal(plus.score,225);
const negative=boot(board([[MINUS(1),1,2,2]]));negative.advance(88000);negative.tile(1,1);negative.tile(1,2);
assert.equal(negative.clock,0);assert.equal(negative.combo,1);assert.equal(negative.node('board').inert,true);
negative.advance(150);assert.match(negative.dialog,/時間到了/);assert.equal(Object.keys(negative.D.Storage.get().records).length,0);
negative.tile(1,3);negative.tile(1,4);negative.advance(1000);assert.equal(E.cells(negative.grid).length,2);
for (const [a,b,expected] of [[MINUS(1),1,0],[MINUS(1),MINUS(1),0],[PLUS(1),MINUS(1),2000],[PLUS(1),PLUS(1),8000]]) {
  const last=boot(board([[a,b]]));last.advance(88000);last.tile(1,1);last.tile(1,2);
  assert.equal(last.clock,expected);last.advance(1000);assert.match(last.dialog,/第 1 關完成/);
  assert.equal(last.D.Storage.get().records[1].time,88,'加減時不改變實際通關耗時');
  assert.equal(last.D.Storage.get().records[1].stars,1);assert.equal(last.D.Storage.get().unlocked,2);
  if(!expected)assert.equal(last.D.Storage.get().records[1].score,100,'最後一對歸零通關，不給時間獎勵');
}
const fast=boot(board([[PLUS(1),1]]));fast.advance(1000);fast.tile(1,1);fast.tile(1,2);fast.advance(1000);
assert.equal(fast.D.Storage.get().records[1].time,1);assert.equal(fast.D.Storage.get().records[1].stars,3);
console.log('PASS: 每顆 ±3 秒、雙標記累加／抵銷、手動連擊、非尾盤歸零立即失敗、最後一對通關與正確耗時／星級');

for(const reduced of [false,true])for(const kind of ['ppa','bomb']) {
  const t=boot(board([[kind==='ppa'?PPA:BOMB(1),kind==='ppa'?PPA:1,PLUS(2),2],[3,3,4,4]]),reduced);
  t.tile(1,1);t.tile(1,2);
  const removal=reduced?(kind==='ppa'?100:60):(kind==='ppa'?520:320);
  const settle=reduced?40:(kind==='ppa'?120:160);
  t.advance(removal);assert.equal(t.clock,93000);assert.equal(t.score,200);assert.equal(t.combo,1);
  t.action('pause');t.advance(30000);assert.equal(t.clock,93000);
  t.action('resume');t.advance(settle);assert.equal(t.clock,93000);assert.equal(t.score,200,'恢復不重複加時或計分');
  t.advance(5000);t.tile(2,1);t.tile(2,2);assert.equal(t.combo,2,'加時不改五秒連擊窗口');
  t.action('retry');t.advance(650);assert.equal(t.clock,90000);assert.equal(t.score,0);
}
for(const kind of ['ppa','bomb'])for(const lastPair of [false,true]) {
  const trigger=kind==='ppa'?PPA:BOMB(1), other=kind==='ppa'?PPA:1;
  const t=boot(board([[trigger,other,FOG(ICE(MINUS(2))),2,...(lastPair?[]:[3,3])]]));
  t.advance(88000);t.tile(1,1);t.tile(1,2);t.advance(1200);
  assert.equal(t.clock,0);assert.equal(t.grid[1][3],0);assert.equal(t.grid[1][4],0);
  assert.match(t.dialog,lastPair?/第 1 關完成/:/時間到了/);
  assert.equal(t.combo,1,'特殊消除不額外累積連擊');
  if(lastPair)assert.equal(t.D.Storage.get().records[1].stars,1);
  else assert.equal(E.cells(t.grid).length,2);
}
// 五連擊 PPA 規劃多對消除，第一對減時歸零時應立刻停止，不可再消後續目標。
const abort=boot(board([[PPA,PPA,MINUS(2),2,3,3,4,4,5,5],[6,6,7,7,8,8,9,9,10,10]]));
abort.advance(87500);for(let c=1;c<=7;c+=2){abort.tile(2,c);abort.tile(2,c+1);abort.advance(100);}
assert.equal(abort.combo,4);abort.tile(1,1);abort.tile(1,2);assert.equal(abort.combo,5);
abort.advance(1000);assert.match(abort.dialog,/時間到了/);assert.equal(abort.score,850);
assert.ok(abort.grid[1][5]>0 && abort.grid[1][7]>0 && abort.grid[1][9]>0);
const count=E.cells(abort.grid).length;abort.advance(30000);assert.equal(E.cells(abort.grid).length,count);
console.log('PASS: PPA／炸彈消除時鐘、冰封／薄霧時鐘、特效暫停接續與減少動畫、即時失敗中止後續目標、重玩清理');

const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',dataset:{},style:{},setAttribute(k,v){this[k]=v;}});return nodes.get(id);};
vm.runInNewContext(source('ui'),{DotGame:ctx.DotGame,document:{getElementById:node}});
const U=ctx.DotGame.UI;U.board(board([[PLUS(1),MINUS(2),FOG(PLUS(3))]]));
assert.equal((node('board').innerHTML.match(/class="clock-badge clock-plus"/g)||[]).length,2);
assert.equal((node('board').innerHTML.match(/class="clock-badge clock-minus"/g)||[]).length,1);
assert.match(node('board').innerHTML,/加時，紅色寶石/);assert.match(node('board').innerHTML,/減時，藍色寶石/);
U.updateTime(96000,90);assert.equal(node('timer-fill').style.width,'100%');assert.equal(node('timer-track')['aria-valuenow'],100);
assert.equal(node('time-text').textContent,'01:36');U.updateTime(0,90);assert.equal(node('timer-fill').style.width,'0%');
U.updateTime(0,90,true);assert.equal(node('live-stars').dataset.rating,1,'最後一對歸零通關時，遊戲內星級與結算一致');
console.log('PASS: 時鐘加減號、無障礙名稱、加時超過限時時顯示正確秒數，時間條不溢出');
