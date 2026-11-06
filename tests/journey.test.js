const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-harness');
const rec={score:1234,time:22.5,stars:2};
const records=n=>Object.fromEntries(Array.from({length:n},(_,i)=>[i+1,{...rec,score:rec.score+i}]));
const memory=(n,extra={})=>new Map([['dot-to-dot.v1',JSON.stringify({unlocked:Math.min(100,n+1),records:records(n),sound:false,...extra})]]);
async function run() {
  let t=boot(),D=t.D;
  assert.equal(D.Stories.contents.length,100);assert.equal(D.Stories.mapping.length,100);
  assert.equal(new Set(D.Stories.mapping).size,100);assert.equal(new Set(D.Stories.contents.map(e=>e.contentId)).size,100);
  assert.equal(JSON.stringify(D.Stories.mapping.slice(0,3)),JSON.stringify([11,9,86]));
  assert.equal(JSON.stringify(D.Stories.contents.filter(e=>e.category==='ingredients').map(e=>e.contentId)),JSON.stringify([3,4,5]));
  for(let id=1;id<=100;id++) {
    const item=D.Stories.forLevel(id),html=D.CampaignUI.story(id);
    assert.ok(item.contentId>=1&&item.contentId<=100&&item.display.title&&item.display.body);
    assert.ok(html.includes(item.display.title)&&html.includes(item.display.body));
    assert.doesNotMatch(html,/company-review|candidate-awaiting|authorized-neutral|公司確認|成品資料支持|止痛用途|候選題目|Markdown/);
    if(item.contentId>=91&&item.contentId<=95) {
      assert.equal(item.reviewStatus,'candidate-awaiting-company');assert.equal(item.display.status,'authorized-neutral-fallback');
      assert.notEqual(item.sourceDraft.title,item.display.title);assert.doesNotMatch(html,/止痛|疼痛|刺痛|傷口|疾病/);
    } else {assert.equal(item.display.title,item.sourceDraft.title);assert.equal(item.display.body,item.sourceDraft.body);}
  }
  const table=fs.readFileSync(path.join(__dirname,'../docs/關卡與內容對照表.md'),'utf8');
  assert.equal((table.match(/^\| \d+ \|/gm)||[]).length,100);
  console.log('PASS: 百關內容各映射一次、11／09／86 入門、三篇成分故事、91～95 候選與中性顯示稿分離、完整對照表');
  for(const n of [16,40,98,100]) {
    const mem=memory(n),before=JSON.parse(mem.get('dot-to-dot.v1'));t=boot(mem);D=t.D;
    assert.equal(D.Journey.count(),n);assert.equal(JSON.stringify(D.Storage.get().records),JSON.stringify(before.records));
    assert.equal(D.Storage.get().sound,false);assert.equal(D.Rewards.purchase(),'none');
    assert.equal(D.Rewards.status(50).claim,'none');assert.equal(D.Rewards.status(100).claim,'none');
    assert.equal(D.Journey.reached(50),n>=50);assert.equal(D.Journey.reached(100),n===100);
    assert.equal(boot(mem).D.Journey.count(),n);
  }
  t=boot(memory(0,{unlocked:100,records:{2:rec,50:{score:1,time:2,stars:0},51:{score:-1,time:2,stars:3},52:{score:1,time:-2,stars:3}}}));
  assert.equal(t.D.Journey.count(),1,'解鎖與無效紀錄不計入實際完成數');assert.equal(t.D.Journey.reached(3),false);
  const mem=memory(2);mem.set('ppa-campaign.v1',JSON.stringify({records:{1:rec,2:rec,3:rec}}));
  t=boot(mem);assert.equal(t.D.Journey.count(),3);assert.equal(t.D.Storage.get().unlocked,4);assert.equal(Object.keys(t.D.Storage.get().records).length,2);
  t.D.CampaignStorage.record(2,rec);t.D.Storage.record(2,rec);assert.equal(t.D.Journey.count(),3);
  const spoof=memory(0);spoof.set('ppa-journey.v1',JSON.stringify({completed:[],purchase:'verified',claims:{50:'shipped',100:'claimed'}}));
  t=boot(spoof);assert.equal(t.D.Rewards.purchase(),'none');assert.equal(t.D.Rewards.status(50).claim,'none');
  t.action('rewards');assert.match(t.dialog,/正式購買驗證與申領尚未開放/);assert.doesNotMatch(t.dialog,/data-action="reward-claim"|<input/);
  assert.equal(await t.D.Rewards.claim(50),false);
  console.log('PASS: 舊 16／40／98／100 紀錄與音效保留、完成集合去重、解鎖不冒充通關、遷移不建立購買／兌換');
  t=boot(memory(100));D=t.D;
  let server={purchase:'none',claims:{}},calls=[],release;
  const service={getStatus:async()=>structuredClone(server),claim:async({tier})=>{
    calls.push(tier);if(release)await new Promise(resolve=>{release.resolve=resolve;});
    // 僅測試用伺服器，模擬同一會員／活動／門檻的冪等核銷。
    if(server.purchase!=='verified')throw Error('purchase invalid');
    server.claims[tier]='claimed';return structuredClone(server);
  }};
  D.Rewards.connect(service);await D.Rewards.refresh();
  assert.equal(D.Rewards.status(3).state,'offer');assert.equal(D.Rewards.status(50).state,'awaiting-purchase');
  assert.equal(await D.Rewards.claim(50),false);assert.equal(calls.length,0);
  server.purchase='pending';await D.Rewards.refresh();assert.equal(D.Rewards.purchase(),'pending');assert.match(D.Rewards.status(50).label,/購買待驗證/);
  server.purchase='verified';await D.Rewards.refresh();
  assert.equal(D.Rewards.status(50).canClaim,true);assert.equal(D.Rewards.status(100).canClaim,true,'百關才驗證購買，兩階段都符合');
  release={};const first=D.Rewards.claim(50),second=D.Rewards.claim(50);assert.equal(first,second);await Promise.resolve();assert.deepEqual(calls,[50]);
  assert.equal(D.Rewards.status(50).busy,true);release.resolve();await first;release=null;
  assert.equal(D.Rewards.status(50).state,'claimed');assert.equal(await D.Rewards.claim(50),false);assert.deepEqual(calls,[50]);
  assert.equal(D.Rewards.status(100).canClaim,true);await D.Rewards.claim(100);assert.deepEqual(calls,[50,100]);
  server.claims[50]='shipped';server.claims[3]='claimed';await D.Rewards.refresh();
  assert.equal(D.Rewards.status(50).state,'shipped');assert.equal(D.Rewards.status(3).label,'主要優惠已兌換');
  t.D.CampaignUI.rewards();assert.match(t.dialog,/已出貨/);assert.match(t.dialog,/已申領，待出貨/);assert.match(t.dialog,/主要優惠已兌換/);
  const again=boot(t.memory);assert.equal(again.D.Rewards.purchase(),'none','正式購買狀態不由 localStorage 重建');assert.equal(again.D.Rewards.status(50).claim,'none');
  console.log('PASS: 未購買／待驗證／已驗證、百關晚驗證可領兩階段、同時重送僅一請求、已申領／已出貨／主要優惠兌換各自呈現');
  // 先買後玩，50 階段已領取時，百關只新增另一組。
  t=boot(memory(49));D=t.D;server={purchase:'verified',claims:{}};calls=[];
  D.Rewards.connect(service);await D.Rewards.refresh();assert.equal(D.Rewards.status(50).canClaim,false);
  D.Storage.record(50,rec);assert.equal(D.Rewards.status(50).canClaim,true);await D.Rewards.claim(50);
  for(let id=51;id<=100;id++)D.Storage.record(id,rec);
  assert.equal(D.Rewards.status(50).canClaim,false);assert.equal(D.Rewards.status(100).canClaim,true);await D.Rewards.claim(100);assert.deepEqual(calls,[50,100]);
  server.purchase='none';server.claims={};await D.Rewards.refresh();assert.equal(D.Rewards.status(100).canClaim,false,'退款／取消後不沿用購買資格');
  D.Rewards.connect({getStatus(){throw Error('offline');},claim(){throw Error('offline');}});await D.Rewards.refresh();assert.equal(D.Rewards.purchase(),'pending');assert.equal(D.Rewards.status(50).canClaim,false);assert.ok(D.Rewards.error());
  D.Rewards.connect({getStatus:async()=>({purchase:'verified',claims:{}}),claim(){throw Error('offline');}});await D.Rewards.refresh();assert.equal(await D.Rewards.claim(50),false);assert.equal(D.Rewards.status(50).busy,false);assert.equal(D.Rewards.status(50).claim,'none');
  console.log('PASS: 先買後玩、50 已領後百關僅新增一組、退款資格撤回、服務離線／同步拋錯不虛構核銷，測試服務完全隔離');
  // 真實獎勵渲染與控制器，模擬申領連點及查詢離頁後才返回。
  t=boot(memory(100));D=t.D;let finishClaim,finishQuery,claimCalls=0;
  D.Rewards.connect({getStatus:async()=>({purchase:'verified',claims:{}}),claim:()=>{claimCalls++;return new Promise(resolve=>{finishClaim=resolve;});}});
  await D.Rewards.refresh();t.action('rewards');await new Promise(resolve=>setImmediate(resolve));
  t.action('reward-claim',1,true,50);t.action('reward-claim',1,true,50);await Promise.resolve();
  assert.equal(claimCalls,1);assert.match(t.dialog,/正在確認申領/);
  finishClaim({purchase:'verified',claims:{50:'claimed'}});await new Promise(resolve=>setImmediate(resolve));
  assert.match(t.dialog,/已申領，待出貨/);assert.equal(D.Rewards.status(100).canClaim,true);
  t.action('close-rewards');D.Rewards.connect({getStatus:()=>new Promise(resolve=>{finishQuery=resolve;}),claim:async()=>({purchase:'none',claims:{}})});
  t.action('rewards');t.action('close-rewards');finishQuery({purchase:'verified',claims:{}});await new Promise(resolve=>setImmediate(resolve));
  assert.equal(t.dialog,'','離開後的舊查詢不覆蓋目前畫面');
  console.log('PASS: 真實獎勵頁申領連點合併、等待／完成狀態與離開後延遲回應清理');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
