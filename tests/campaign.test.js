/* 活動實際控制器＋文案／儲存；虛擬 DOM 與時鐘不寫玩家存檔。 */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=name=>fs.readFileSync(path.join(__dirname,'../js',name+'.js'),'utf8');
const old=JSON.stringify({unlocked:16,records:{1:{score:99999,time:12,stars:3},16:{score:88888,time:23,stars:3}},sound:false});
const saved=new Map([['dot-to-dot.v1',old]]);
function boot(memory=saved,deny=false){
 let now=1000,serial=0,rendered=[],dialog='',clock=0,mode='',stage=0;
 const jobs=new Map(),events={},nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',dataset:{},style:{},inert:false,focus(){},scrollIntoView(){},classList:{add(){},remove(){}},addEventListener(type,fn){events[id+':'+type]=fn;}});return nodes.get(id);};
 const ctx={console,performance:{now:()=>now},matchMedia:()=>({matches:false}),
  localStorage:{getItem(key){if(deny)throw Error('blocked');return memory.get(key)||null;},setItem(key,val){if(deny)throw Error('blocked');memory.set(key,val);}},
  setTimeout(fn,ms){const id=++serial;jobs.set(id,{fn,at:now+ms});return id;},clearTimeout(id){jobs.delete(id);},
  requestAnimationFrame(fn){const id=++serial;jobs.set(id,{fn,at:now+16});return id;},cancelAnimationFrame(id){jobs.delete(id);},
  document:{hidden:false,addEventListener(type,fn){events[type]=fn;}},addEventListener(type,fn){events['window:'+type]=fn;}};
 ctx.window=ctx;vm.createContext(ctx);
 for(const file of ['levels','campaign','engine','storage','campaign-storage'])vm.runInContext(source(file),ctx);
 const D=ctx.DotGame;D.Audio={play(){}};
 D.UI={$:node,icon:()=>'',stars:n=>`stars:${n}`,clock:n=>String(n),gem:()=>'<svg></svg>',
  showView(){},levels(){},setupStage(l,p,m){stage=l.id;mode=m;},board(g){rendered=g.map(r=>r.slice());},select(){},cell:()=>node('tile'),
  updateTime(ms){clock=ms;},combo(){},line(){},clearLine(){},message(){},ppaFeedback(){},clearPPA(){},clearToast(){},toast(){},soundButton(){},
  modal(html){dialog=html;node('modal').open=true;},closeModal(){dialog='';node('modal').open=false;}};
 vm.runInContext(source('campaign-ui'),ctx);vm.runInContext(source('game'),ctx);
 function advance(ms){const target=now+ms;for(let i=0;i<100000;i++){const item=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!item||item[1].at>target)break;now=item[1].at;jobs.delete(item[0]);item[1].fn();}now=target;}
 function action(action,level=1,inDialog=false){const el={dataset:{action,level:String(level)},closest:()=>inDialog?node('modal'):null};events.click({target:{closest:s=>s==='[data-action]'?el:null}});}
 function tile(p){const el={dataset:{r:String(p.r),c:String(p.c)}};events.click({target:{closest:s=>s==='[data-cell]'?el:null}});}
 function solve(){for(let i=0;D.Engine.cells(rendered).length&&i<100;i++){const move=D.Engine.findMove(rendered);assert.ok(move);tile(move.a);tile(move.b);advance(30);for(let w=0;node('board').inert&&D.Engine.cells(rendered).length&&w<40;w++)advance(100);}advance(1000);assert.equal(D.Engine.cells(rendered).length,0);}
 return {D,ctx,events,node,action,advance,solve,get dialog(){return dialog;},get clock(){return clock;},get mode(){return mode;},get stage(){return stage;}};
}
let t=boot();assert.equal(t.node('campaign-start').textContent,'開始挑戰，解鎖好禮');
assert.match(t.node('campaign-detail').innerHTML,/PPA 買一送一/);
assert.doesNotMatch(t.node('campaign-products').innerHTML,/NT\$|即將公布|product-prices/);
assert.equal(t.D.LEVELS.length,16);assert.equal(t.D.CampaignStorage.next(),1);assert.equal(t.D.Storage.get().unlocked,16);
t.action('campaign-play',3);assert.equal(t.stage,0,'不可跳過未完成活動關卡');
t.action('campaign-start');t.advance(650);assert.equal(t.mode,'campaign');assert.equal(t.stage,1);assert.equal(t.clock,90000);
t.solve();assert.match(t.dialog,/保濕潤膚，從日常開始/);assert.match(t.dialog,/繼續第二關/);
assert.equal(saved.get('dot-to-dot.v1'),old,'活動通關不寫自由紀錄');
const remaining=t.clock;t.advance(180000);assert.equal(t.clock,remaining);assert.match(t.dialog,/保濕潤膚/);
// 通關介紹待閱讀時重新整理，活動入口接回介紹，不提前啟動下一關。
t=boot();assert.equal(t.node('campaign-start').textContent,'繼續挑戰，解鎖好禮');t.action('campaign-start');assert.equal(t.stage,0);assert.match(t.dialog,/保濕潤膚/);
t.action('campaign-next',2,true);t.advance(650);assert.equal(t.stage,2);assert.equal(t.clock,120000);
// 進行中刷新會重玩第一個未完成關卡，已完成的紀錄不受影響。
t=boot();t.action('campaign-start');t.advance(650);assert.equal(t.stage,2);assert.equal(t.clock,120000);
t.action('pause');t.advance(60000);assert.equal(t.clock,120000);t.action('resume');
t.solve();assert.match(t.dialog,/止癢舒緩，照顧敏感不適/);assert.match(t.dialog,/前往第三關/);
const secondTime=t.clock;t.ctx.document.hidden=true;t.events.visibilitychange();t.advance(60000);assert.equal(t.clock,secondTime);t.ctx.document.hidden=false;
t.action('campaign-next',3,true);t.advance(650);assert.equal(t.stage,3);assert.equal(t.clock,135000);
t.solve();assert.match(t.dialog,/肌膚修護，讓保養更完整/);assert.match(t.dialog,/查看獎勵/);assert.doesNotMatch(t.dialog,/前往第 4 關/);
t.action('campaign-info',1,true);assert.match(t.dialog,/挑戰完成，好禮解鎖！/);assert.match(t.dialog,/再加贈兩個水母公仔/);
assert.doesNotMatch(t.dialog,/NT\$|即將公布|product-prices|completion-records/);assert.match(t.dialog,/30 mL 買一送一/);assert.match(t.dialog,/rel="noopener noreferrer"/);assert.match(t.dialog,/繼續挑戰/);
assert.equal(saved.get('dot-to-dot.v1'),old);assert.equal(t.D.CampaignStorage.next(),null);assert.equal(t.D.CampaignStorage.get().pending,null);
assert.match(t.dialog,/角色示意，實際款式依活動公告/);assert.match(t.dialog,/提案每人限兌換一次/);
assert.match(t.dialog,/<summary>查看挑戰紀錄<\/summary>/);assert.match(t.dialog,/<summary>活動辦法<\/summary>/);
const beforeRedeem=saved.get('ppa-campaign.v1');
t.action('campaign-redeem',1,true);assert.equal(t.node('reward-handoff').hidden,false);assert.equal(t.node('reward-redeem').hidden,true);
assert.match(t.dialog,/官網優惠尚未串接/);
t.action('campaign-redeem-cancel',1,true);assert.equal(t.node('reward-handoff').hidden,true);assert.equal(t.node('reward-redeem').hidden,false);
assert.equal(saved.get('ppa-campaign.v1'),beforeRedeem,'展示兌換提示不核發或改寫紀錄');
t=boot();assert.equal(t.node('campaign-start').textContent,'查看已解鎖好禮');t.action('campaign-start');assert.match(t.dialog,/挑戰完成，好禮解鎖/);
t.action('levels',1,true);t.action('play',16);t.advance(650);assert.equal(t.mode,'free');assert.equal(t.stage,16);assert.equal(t.clock,210000);
t.action('levels');t.advance(10000);assert.equal(t.dialog,'');
console.log('PASS: 活動完整三關介紹／完成資訊、計時凍結、進度與舊16關隔離、刷新接續、自由模式入口');
// 已完成活動可以重玩；失敗不出產品卡，重試沿用活動模式。
t=boot();t.action('campaign-play',2);t.advance(650);t.advance(120200);assert.match(t.dialog,/時間到了/);assert.doesNotMatch(t.dialog,/止癢舒緩/);
t.action('retry',1,true);t.advance(650);assert.equal(t.mode,'campaign');assert.equal(t.stage,2);assert.equal(t.clock,120000);
t.action('home');assert.match(t.dialog,/先離開/);t.action('home',1,true);t.advance(50000);assert.equal(t.dialog,'');
assert.equal(saved.get('dot-to-dot.v1'),old);
// 無法儲存及損壞存檔的安全備援。
const blocked=boot(new Map(),true);assert.equal(blocked.D.CampaignStorage.persistent(),false);blocked.action('campaign-start');blocked.advance(650);blocked.solve();assert.match(blocked.dialog,/保濕潤膚/);
const bad=boot(new Map([['ppa-campaign.v1','{"records":{"3":{"score":1,"time":2,"stars":3}},"pending":{"id":3}}']]));assert.equal(bad.D.CampaignStorage.next(),1);assert.equal(bad.D.CampaignStorage.get().pending,null);
console.log('PASS: 活動重玩／失敗／離開／延遲取消、無儲存權限及非連續存檔備援');
