/* PPA 流程回歸：真實控制器與規則，僅替換 DOM、時鐘及開局資料。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = name => fs.readFileSync(path.join(__dirname, '../js', name + '.js'), 'utf8');
const PPA = 100;
function board(rows) {
  const width = rows[0].length + 2;
  return [Array(width).fill(0), ...rows.map(row => [0,...row,0]), Array(width).fill(0)];
}
function boot(grid, reduced = false) {
  let now = 1000, serial = 0, rendered, clock = 0, combo = 0, dialog = '', toast = '', effects = 0;
  const jobs = new Map(), events = {}, nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { textContent:'', open:false, inert:false,
      classList:{add(){},remove(){}}, addEventListener(){}, style:{} });
    return nodes.get(id);
  };
  const ctx = { console, performance:{now:()=>now}, matchMedia:()=>({matches:reduced}),
    localStorage:{getItem:()=>null,setItem(){}},
    setTimeout(fn,ms){const id=++serial;jobs.set(id,{fn,at:now+ms});return id;},
    clearTimeout(id){jobs.delete(id);},
    requestAnimationFrame(fn){const id=++serial;jobs.set(id,{fn,at:now+16});return id;},
    cancelAnimationFrame(id){jobs.delete(id);},
    document:{hidden:false,addEventListener(type,fn){events[type]=fn;}},
    addEventListener(type,fn){events['window:'+type]=fn;}
  };
  ctx.window=ctx; vm.createContext(ctx);
  for(const name of ['levels','engine','storage']) vm.runInContext(source(name),ctx);
  const D=ctx.DotGame;
  D.CampaignUI={home(){}};
  D.Engine.createBoard=()=>({grid:grid.map(row=>row.slice()),palette:[1,2,3]});
  D.Audio={play(){}};
  D.UI={ $:node, icon:()=>'',stars:()=>'',clock:String,showView(){},levels(){},setupStage(){},
    board(g){rendered=g.map(row=>row.slice());},select(){},cell:()=>node('tile'),
    updateTime(ms){clock=ms;},combo(n){combo=n;},line(p,g,bonus){if(bonus)effects++;},clearLine(){},message(){},
    ppaFeedback(){},clearPPA(){},clearToast(){toast='';},toast(text){toast=text;},modal(html){dialog=html;node('modal').open=true;},
    closeModal(){dialog='';node('modal').open=false;},soundButton(){},pixelTitle(){},demo(){}
  };
  vm.runInContext(source('game'),ctx);
  function advance(ms) {
    const target=now+ms;
    for(let i=0;i<100000;i++) {
      const job=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];
      if(!job||job[1].at>target)break;
      now=job[1].at; jobs.delete(job[0]); job[1].fn();
    }
    now=target;
  }
  function action(action,level=1) {
    const button={dataset:{action,level:String(level)},closest:()=>null};
    events.click({target:{closest:s=>s==='[data-action]'?button:null}});
  }
  function tile(p) {
    const el={dataset:{r:String(p.r),c:String(p.c)}};
    events.click({target:{closest:s=>s==='[data-cell]'?el:null}});
  }
  function match(special=false) {
    const cells=D.Engine.cells(rendered).filter(p=>D.Engine.isPPA(p.value)===special);
    for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++) {
      if(D.Engine.findPath(rendered,cells[i],cells[j])){tile(cells[i]);tile(cells[j]);return;}
    }
    throw Error('測試沒有指定類型的合法配對');
  }
  action('play');advance(650);
  return {D,ctx,events,node,advance,action,tile,match,
    get grid(){return rendered;}, get clock(){return clock;},get combo(){return combo;},
    get count(){return D.Engine.cells(rendered).length;},get score(){return Number(node('score').textContent);},
    get dialog(){return dialog;},get toast(){return toast;},get effects(){return effects;} };
}
const roomy = board([[PPA,PPA,...Array(10).fill(1)],Array(12).fill(2),Array(12).fill(3)]);

// 相同 PPA 仍必須有合法路徑；PPA 與普通寶石不能互配。
{
  const blocked=board(Array.from({length:5},()=>Array(5).fill(1)));
  blocked[2][2]=blocked[4][4]=PPA;
  const t=boot(blocked);
  t.tile({r:2,c:2});t.tile({r:4,c:4});t.advance(1000);
  assert.equal(t.count,25);assert.equal(t.combo,0);assert.equal(t.score,0);assert.equal(t.effects,0);
  t.tile({r:1,c:1});assert.equal(t.score,0);
}
for(const reduced of [false,true]) {
  const t=boot(roomy,reduced), duration=reduced?140:640;
  t.match(true);assert.equal(t.combo,1);assert.equal(t.score,100);assert.equal(t.node('board').inert,true);
  const left=t.clock, count=t.count;
  t.match();assert.equal(t.count,count,'特效期間不接受普通配對');
  t.advance(duration-1);assert.equal(t.clock,left);
  t.advance(1);assert.equal(t.clock,left);assert.equal(t.count,32);assert.equal(t.score,200);
  assert.equal(t.combo,1);assert.match(t.toast,/1 對.*100/);
  t.advance(5000);t.action('pause');t.advance(10000);t.action('resume');
  t.match();assert.equal(t.combo,2,'特效後仍有完整五秒窗口，邊界暫停也不重置');
  t.advance(5000.01);t.match();assert.equal(t.combo,1);
}
console.log('PASS: PPA 合法觸發、Combo 1、輸入鎖定、特效凍結、精確五秒與減少動畫');

// 已用掉 3.5 秒時暫停，恢復後只保留 1.5 秒；不能重送完整窗口。
for(const interrupt of ['pause','blur','hidden']) for(const extra of [1500,1500.01]) {
  const t=boot(roomy);t.match();t.advance(3500);
  if(interrupt==='blur')t.events['window:blur']();
  else if(interrupt==='hidden'){t.ctx.document.hidden=true;t.events.visibilitychange();}
  else t.action('pause');
  t.advance(30000);t.ctx.document.hidden=false;t.action('resume');t.advance(extra);t.match();
  assert.equal(t.combo,extra===1500?2:1,'暫停／失焦只凍結原有剩餘窗口');
}
{
  const t=boot(roomy);t.match();t.advance(5000);assert.equal(t.combo,1);
  t.advance(64);assert.equal(t.combo,0,'超過五秒後畫面主動歸零');
}
console.log('PASS: 五秒窗口的部分時間暫停／失焦恢復、精確邊界及逾時歸零');

for(const ordinaryBefore of [4,6]) {
  const t=boot(roomy);
  for(let i=0;i<ordinaryBefore;i++)t.match();
  const before=t.count, score=t.score;
  t.match(true);t.advance(1920);
  assert.equal(t.count,before-12);assert.equal(t.combo,ordinaryBefore+1);
  assert.equal(t.score,score+100+ordinaryBefore*25+500);
  assert.equal(t.effects,5);assert.match(t.toast,/5 對.*500/);
}
// 不足五對只消兩對；剩餘 PPA 永遠不會被選為目標或觸發連鎖。
{
  const t=boot(board([[PPA,PPA,PPA,PPA,...Array(12).fill(1)]]));
  for(let i=0;i<4;i++)t.match();
  t.match(true);t.advance(960);
  assert.equal(t.count,2);assert.equal(t.combo,5);assert.equal(t.score,950);assert.equal(t.effects,2);
  assert.ok(t.grid.flat().filter(v=>v>0).every(v=>v===PPA));assert.match(t.toast,/2 對.*200/);
  assert.equal(t.dialog,'','仍有 PPA 不能提早通關');
  t.match(true);t.advance(320);
  assert.equal(t.count,0);assert.equal(t.combo,6);assert.equal(t.score,2075);
  assert.match(t.toast,/已無普通寶石/);t.advance(450);assert.match(t.dialog,/第 1 關完成/);
}
{
  const t=boot(board([[PPA,PPA]]));
  t.match(true);assert.equal(Object.keys(t.D.Storage.get().records).length,0);
  t.advance(320);assert.equal(t.score,1000);assert.equal(t.combo,1);
  t.advance(450);assert.match(t.dialog,/第 1 關完成/);
}
console.log('PASS: Combo 5 及以上封頂五對、不足／零對、排除其他 PPA、最後 PPA 通關與實際計分');

for(const delay of [100,400,550]) {
  for(const interrupt of ['pause','blur','hidden','help','leave']) {
    const t=boot(roomy);t.match(true);t.advance(delay);
    if(interrupt==='blur')t.events['window:blur']();
    else if(interrupt==='hidden'){t.ctx.document.hidden=true;t.events.visibilitychange();}
    else t.action(interrupt);
    const count=t.count, score=t.score, left=t.clock;
    t.advance(30000);assert.equal(t.count,count);assert.equal(t.score,score);assert.equal(t.clock,left);
    t.ctx.document.hidden=false;t.action(interrupt==='help'?'close-help':'resume');
    t.advance(640-delay);assert.equal(t.count,32);assert.equal(t.score,200);assert.equal(t.combo,1);
    assert.equal(t.clock,left);assert.equal(t.node('board').inert,false);
  }
  for(const action of ['retry','levels','home']) {
    const t=boot(roomy);t.match(true);t.advance(delay);
    if(action==='home') {t.action('home');assert.match(t.dialog,/先離開/);}
    t.action(action); // home 的第二次點擊模擬確認離開
    if(action==='home')t.action('levels');
    if(action==='retry') {
      t.advance(650);assert.equal(t.count,36);assert.equal(t.score,0);assert.equal(t.combo,0);
      t.advance(3000);assert.equal(t.count,36);assert.equal(t.score,0);
    } else {const count=t.count,score=t.score;t.advance(3000);assert.equal(t.count,count);assert.equal(t.score,score);assert.equal(t.dialog,'');}
  }
}
console.log('PASS: 各特效階段的暫停／失焦／隱藏／說明／離開與接續，重玩與切局清理');

// 特效後的死局統一洗牌；洗牌過程失焦也不會自行恢復倒數。
{
  const t=boot(board([[PPA,PPA,3,3],[1,2,0,0],[2,1,0,0]]));
  t.D.Engine.ppaTargets=()=>[[{r:1,c:3,value:3},{r:1,c:4,value:3}]];
  t.match(true);t.advance(640);assert.equal(t.node('board').inert,true);
  const left=t.clock;t.events['window:blur']();t.advance(650);
  assert.match(t.dialog,/時間與連擊已暫停/);t.advance(10000);assert.equal(t.clock,left);
  t.action('resume');assert.ok(t.D.Engine.findMove(t.grid));assert.equal(t.combo,1);
  t.advance(5000);t.match();assert.equal(t.combo,2,'PPA、洗牌及失焦接續後完整保留五秒');
}
console.log('PASS: PPA 結束後死局洗牌，以及過渡期間失焦保留倒數／連擊');

// 三對同 ID 沒有綁定固定伴侶，可跨原排列任選合法的兩顆。
{
  const t=boot(board([[PPA,PPA,PPA,PPA,PPA,PPA,...Array(20).fill(1)]]));
  const left=t.clock;
  t.tile({r:1,c:1});t.tile({r:1,c:4});t.advance(640);
  assert.equal(t.grid.flat().filter(v=>v===PPA).length,4);assert.equal(t.combo,1);assert.equal(t.score,200);
  t.match(true);t.advance(400);t.action('pause');
  const count=t.count,score=t.score;t.advance(30000);assert.equal(t.count,count);assert.equal(t.score,score);
  t.action('resume');t.advance(560);
  assert.equal(t.grid.flat().filter(v=>v===PPA).length,2);assert.equal(t.combo,2);assert.equal(t.score,525);
  t.match(true);t.advance(1280);
  assert.equal(t.grid.flat().filter(v=>v===PPA).length,0);assert.equal(t.combo,3);assert.equal(t.score,975);
  assert.equal(t.count,8);assert.equal(t.clock,left);assert.equal(t.effects,6);
}
{
  const t=boot(board([[PPA,PPA,PPA,PPA,PPA,PPA]]));
  for(let i=0;i<3;i++) {
    t.match(true);t.advance(320);
    assert.equal(t.count,4-i*2);assert.equal(t.combo,i+1);assert.equal(t.effects,0);
    if(i<2)assert.equal(Object.keys(t.D.Storage.get().records).length,0,'有 PPA 剩餘時不提早過關');
  }
  t.advance(450);assert.match(t.dialog,/第 1 關完成/);assert.equal(t.score,1275);
}
{
  const t=boot(board([[PPA,PPA,PPA,PPA,PPA,PPA,...Array(20).fill(1)]]));
  t.match(true);t.advance(640);t.match(true);t.advance(400);t.action('retry');t.advance(650);
  assert.equal(t.count,26);assert.equal(t.score,0);assert.equal(t.combo,0);
  t.advance(3000);assert.equal(t.count,26);assert.equal(t.score,0);
}
console.log('PASS: 三對 PPA 任選合法伴侶、多次觸發不連鎖、第二次演出暫停／重玩安全、純 PPA 尾盤通關');
