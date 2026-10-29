/* 可選驗證：以可控制的時鐘測試遊戲流程，無須真的等待倒數。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
let now = 1000, serial = 0;
const jobs = new Map(), events = {}, nodes = new Map();
function node(id) {
  if (!nodes.has(id)) nodes.set(id, { innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){}},addEventListener(){},inert:false });
  return nodes.get(id);
}
const context = { console, performance:{now:()=>now}, localStorage:{getItem:()=>null,setItem(){}},
  setTimeout(fn,ms){const id=++serial;jobs.set(id,{fn,at:now+ms});return id;},clearTimeout(id){jobs.delete(id);},
  requestAnimationFrame(fn){const id=++serial;jobs.set(id,{fn,at:now+16});return id;},cancelAnimationFrame(id){jobs.delete(id);},
  document:{hidden:false,querySelectorAll:()=>[],addEventListener(name,fn){events[name]=fn;}},
  addEventListener(name,fn){events['window:'+name]=fn;}
};
context.window=context;vm.createContext(context);
for(const file of ['levels','engine','storage'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file+'.js'),'utf8'),context);
const D=context.DotGame;
let rendered=[], clockValue=0, dialog='', comboCount=0, rewardEffects=0;
D.Audio={play(){}};
D.UI={
  $:node,icon:()=>'',stars:n=>`stars:${n}`,clock:n=>String(n),formatTime:n=>String(n),
  showView(){},levels(){},setupStage(){},board(grid){rendered=grid.map(row=>row.slice());},
  select(){},cell:()=>node('tile'),updateTime(ms){clockValue=ms;},combo(count){comboCount=count;},line(path,grid,bonus){if(bonus)rewardEffects++;},clearLine(){},message(){},
  soundButton(){},toast(){},modal(html){dialog=html;node('modal').open=true;},closeModal(){dialog='';node('modal').open=false;},pixelTitle(){},demo(){}
};
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/game.js'),'utf8'),context);
function advance(ms){const target=now+ms;for(let safe=0;safe<100000;safe++){let entry=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!entry||entry[1].at>target)break;now=entry[1].at;jobs.delete(entry[0]);entry[1].fn();}now=target;}
function click(action,level){const button={dataset:{action,level:String(level)},closest:()=>null};events.click({target:{closest:s=>s==='[data-action]'?button:null}});}
function tile(p){const el={dataset:{r:String(p.r),c:String(p.c)}};events.click({target:{closest:s=>s==='[data-cell]'?el:null}});}
function match(){const move=D.Engine.findMove(rendered);assert.ok(move);tile(move.a);tile(move.b);}
click('play',1);advance(650);
assert.equal(clockValue,90000);
advance(1000);const beforePause=clockValue;click('pause');
advance(90000);assert.equal(clockValue,beforePause);assert.match(dialog,/時間與連擊已暫停/);
click('resume');advance(1000);assert.ok(clockValue<beforePause&&clockValue>beforePause-1100);
console.log('PASS: 暫停 90 秒不消耗關卡時間，恢復後繼續倒數');

// 同色大棋盤確保長連擊測試不受隨機牌面、洗牌或提早通關影響。
const originalLevel = D.LEVELS[0];
D.LEVELS[0] = { ...originalLevel, cols:10, rows:6, tiles:60, colors:1, poolSize:1, layout:Array(6).fill('XXXXXXXXXX') };
click('retry');advance(650);
rewardEffects = 0;
let expectedScore = 0;
for(let n=1;n<=16;n++) {
  const before = D.Engine.cells(rendered).length;
  match();
  const isReward = n % 5 === 0;
  expectedScore += 100 + (n - 1) * 25 + (isReward ? 100 : 0);
  assert.equal(comboCount, n, `第 ${n} 擊持續累積`);
  assert.equal(Number(node('score').textContent), expectedScore, `第 ${n} 擊得分`);
  assert.equal(rewardEffects, Math.floor(n / 5), '僅第 5、10、15 擊各觸發一次獎勵');
  assert.equal(before - D.Engine.cells(rendered).length, isReward ? 4 : 2, '獎勵配對不計入連擊');
  if(n === 5) assert.equal(expectedScore,850);
  if(n === 10) assert.equal(expectedScore,2325);
  if(n === 6) { click('pause'); advance(30000); click('resume'); }
  if(n < 16) advance(100);
}
// 正好 2 秒仍延續；超過 2 秒即重新從第一擊、100 分開始。
advance(2000);match();expectedScore += 500;
assert.equal(comboCount,17);assert.equal(Number(node('score').textContent),expectedScore);
advance(2000.01);match();
assert.equal(comboCount,1);assert.equal(Number(node('score').textContent),expectedScore+100);
assert.equal(rewardEffects,3);
D.LEVELS[0] = originalLevel;
console.log('PASS: 連擊跨越 5、10、15 持續加分且各獎勵一次，暫停保留連擊，2 秒邊界與超時重置正確');

click('retry');advance(650);advance(90001);advance(150);
assert.equal(clockValue,0);assert.match(dialog,/時間到了/);assert.equal(Object.keys(D.Storage.get().records).length,0);
const countAtLoss=D.Engine.cells(rendered).length;tile(D.Engine.cells(rendered)[0]);assert.equal(D.Engine.cells(rendered).length,countAtLoss);
console.log('PASS: 倒數歸零失敗、停止接受配對、不保存失敗紀錄');

click('retry');advance(650);
for(let steps=0;D.Engine.cells(rendered).length&&steps<40;steps++){match();advance(100);if(!D.Engine.findMove(rendered)&&D.Engine.cells(rendered).length)advance(650);}
advance(500);assert.match(dialog,/第 1 關完成/);assert.equal(D.Storage.get().records[1].stars,3);assert.equal(D.Storage.get().unlocked,2);
const savedScore=D.Storage.get().records[1].score;
click('play',2);advance(650);assert.equal(clockValue,120000);assert.equal(node('score').textContent,'00000');
click('retry');advance(650);assert.equal(D.Storage.get().records[1].score,savedScore);
console.log('PASS: 通關保存並解鎖，下一關獨立滿時間與零分，重玩不清除前關紀錄');

context.document.hidden=true;events.visibilitychange();assert.match(dialog,/時間與連擊已暫停/);advance(30000);
assert.notEqual(clockValue,0);context.document.hidden=false;click('resume');advance(20);
click('levels');advance(10000);assert.equal(dialog,'');
console.log('PASS: 分頁隱藏自動暫停，離開後舊計時與延遲不再生效');

// 從原最後一關實際跑完整段遊戲流程，涵蓋第 8→9、15→16 與最終結算。
D.Storage.record(7, { stars: 3, score: 1000, time: 20 });
for (let id = 8; id <= 16; id++) {
  click('play', id); advance(650);
  assert.equal(clockValue, D.LEVELS[id - 1].seconds * 1000);
  assert.equal(node('score').textContent, '00000');
  for (let steps = 0; D.Engine.cells(rendered).length && steps < 100; steps++) {
    match(); advance(100);
    if (!D.Engine.findMove(rendered) && D.Engine.cells(rendered).length) advance(650);
  }
  advance(500);
  assert.match(dialog, new RegExp(`第 ${id} 關完成`));
  assert.equal(D.Storage.get().records[id].stars, 3);
  if (id < 16) assert.match(dialog, new RegExp(`前往第 ${id + 1} 關`));
  else { assert.match(dialog, /所有關卡的光都亮起了/); assert.doesNotMatch(dialog, /前往第 17 關/); }
}
console.log('PASS: 第 8～16 關完整流程可通關，下一關與最終結算正確');

// 使用實際 UI 繪製函式，檢查精簡介面只更新當前連擊數。
const uiContext = { DotGame:{}, document:{getElementById:node} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/ui.js'),'utf8'),uiContext);
for(const count of [0,1,4,5,6,9,10,11,15,16,100,101]) {
  uiContext.DotGame.UI.combo(count);
  assert.equal(node('combo-count').textContent,String(count));
}
console.log('PASS: COMBO 顯示當前連擊數，包含零與超過五次的連擊');
