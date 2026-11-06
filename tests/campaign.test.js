/* 百關活動入口、真實通關介紹及控制流程。 */
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-harness');
const saved=new Map(); let t=boot(saved);
assert.equal(t.D.LEVELS.length,100);assert.equal(t.D.CampaignStorage.next(),1);
assert.match(t.node('campaign-products').innerHTML,/買一次符合活動條件/);
assert.doesNotMatch(t.node('campaign-products').innerHTML,/NT\$|30 mL|止痛/);
t.action('campaign-play',3);assert.equal(t.stage,0);
for(let id=1;id<=3;id++) {
  t.action(id===1?'campaign-start':'campaign-next',id,true);t.advance(650);
  assert.equal(t.mode,'campaign');assert.equal(t.stage,id);assert.equal(t.clock,t.D.LEVELS[id-1].seconds*1000);
  t.solve();assert.match(t.dialog,new RegExp(t.D.Stories.forLevel(id).display.title));
  assert.equal(t.D.Journey.count(),id);assert.equal(t.D.Storage.get().unlocked,id+1);
  assert.equal(Object.keys(t.D.Storage.get().records).length,0,'活動分數不搬到自由模式');
  const left=t.clock;t.advance(180000);assert.equal(t.clock,left);
  t=boot(saved);t.action('campaign-start');assert.equal(t.stage,0);assert.match(t.dialog,new RegExp(`第 ${id} 關完成`));
}
assert.match(t.dialog,/查看購買優惠/);assert.match(t.dialog,/繼續第 4 關/);
t.action('campaign-info',1,true);assert.match(t.dialog,/已完成 <strong>3／100 關/);
assert.match(t.dialog,/已解鎖購買優惠/);assert.match(t.dialog,/尚未核發優惠/);
assert.match(t.dialog,/rel="noopener noreferrer"/);assert.equal(t.D.Rewards.status(3).claim,'none');
t.action('close-rewards');assert.match(t.dialog,/第 3 關完成/);
t.action('journey-continue');t.advance(650);assert.equal(t.stage,4);assert.equal(t.mode,'free');assert.equal(t.clock,140000);
t.solve();assert.equal(t.D.Journey.count(),4);assert.match(t.dialog,new RegExp(t.D.Stories.forLevel(4).display.title));
assert.ok(t.D.Storage.get().records[4]);assert.equal(Object.keys(t.D.CampaignStorage.get().records).length,3);
// 自由前三關可重讀，與活動去重；沒有活動分數時也可用共享資格接續。
t.action('play',1);t.advance(650);t.solve();assert.equal(t.D.Journey.count(),4);
assert.ok(t.D.Storage.get().records[1]);assert.ok(t.D.CampaignStorage.get().records[1]);
const freeOnly=new Map([['dot-to-dot.v1',JSON.stringify({unlocked:4,records:Object.fromEntries([1,2,3].map(id=>[id,{stars:2,score:100,time:20}]))})]]);
let f=boot(freeOnly);assert.equal(f.D.CampaignStorage.next(),null);assert.equal(f.D.Journey.count(),3);
f.action('campaign-start');assert.match(f.dialog,/已解鎖購買優惠/);
f.action('journey-continue');f.advance(650);assert.equal(f.stage,4);
// 遊戲中查看獎勵暫停並恢復；Esc 與返回都可用，不消耗倒數。
const before=f.clock;f.action('rewards');assert.match(f.dialog,/你的百關旅程/);f.advance(60000);assert.equal(f.clock,before);
f.action('close-rewards');assert.equal(f.dialog,'');f.advance(1000);assert.ok(f.clock<before&&f.clock>before-1100);
f.action('rewards');const left=f.clock;f.advance(60000);f.events['modal:cancel']({preventDefault(){}});f.advance(1000);assert.ok(f.clock<left&&f.clock>left-1100);
f.action('levels');f.advance(10000);assert.equal(f.dialog,'');
console.log('PASS: 活動 1～3 介紹、刷新／閱讀不扣時、共用資格與獨立分數、3→4、自由模式去重、遊戲中獎勵頁暫停／Esc 返回');
// 49→50 與 99→100 真實控制器通關，提示只出現一次。
const records=Object.fromEntries(Array.from({length:49},(_,i)=>[i+1,{score:100,time:20,stars:2}]));
const mem=new Map([['dot-to-dot.v1',JSON.stringify({unlocked:50,records,sound:false})]]);
t=boot(mem);t.action('play',50);t.advance(650);t.solve();assert.match(t.dialog,/50 關里程碑達成/);assert.equal(t.D.Journey.count(),50);
const summary=t.dialog;t.action('rewards');t.action('close-rewards');assert.equal(t.dialog,summary,'返回保留原結算');
t.action('retry');t.advance(650);t.solve();assert.doesNotMatch(t.dialog,/50 關里程碑達成/);
t=boot(mem);t.action('rewards');assert.doesNotMatch(t.dialog,/50 關里程碑達成/);
for(let id=51;id<=98;id++)t.D.Storage.record(id,{score:100,time:20,stars:2});
t.action('play',99);t.advance(650);t.solve();assert.match(t.dialog,/前往第 100 關/);assert.equal(t.D.Journey.count(),99);
t.action('play',100);t.advance(650);t.solve();assert.equal(t.D.Journey.count(),100);assert.match(t.dialog,/100 關里程碑達成/);
assert.match(t.dialog,/100 關的旅程/);assert.match(t.dialog,/通關之後，把照護帶回生活/);assert.doesNotMatch(t.dialog,/前往第 101 關/);
t=boot(mem);t.action('rewards');assert.doesNotMatch(t.dialog,/100 關里程碑達成/);assert.match(t.dialog,/購買驗證後可申領/);
console.log('PASS: 49→50、99→100、百關結算與內容，重玩／刷新／切換模式不重複里程碑');
// 失敗不計入；阻擋存檔仍能完成當次旅程。
t=boot();t.action('campaign-start');t.advance(650);t.advance(90200);assert.match(t.dialog,/時間到了/);assert.equal(t.D.Journey.count(),0);assert.doesNotMatch(t.dialog,/level-story/);
t.action('retry');t.advance(650);assert.equal(t.mode,'campaign');t.solve();assert.equal(t.D.Journey.count(),1);
const blocked=boot(new Map(),true);blocked.action('campaign-start');blocked.advance(650);blocked.solve();assert.equal(blocked.D.Journey.count(),1);assert.equal(blocked.D.Journey.persistent(),false);assert.match(blocked.dialog,/無法保存/);
console.log('PASS: 失敗不累計、重試、無存檔權限備援；所有測試資料均與玩家存檔隔離');
// 不連續舊紀錄可證明各自通關，但不冒稱入門全部完成。
const gapped=boot(new Map([['ppa-campaign.v1',JSON.stringify({records:{3:{score:100,time:20,stars:2}},pending:{id:3,score:100,time:20,stars:2,remaining:30000,bonus:300}})]]));
assert.equal(gapped.D.Journey.count(),1);assert.equal(gapped.D.Journey.reached(3),false);
gapped.action('campaign-start');gapped.advance(650);assert.equal(gapped.stage,1);
