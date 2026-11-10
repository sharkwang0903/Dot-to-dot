/* 首頁、通關短篇與活動獎勵；只渲染 display 稿，不外露候選／審稿註記。 */
DotGame.CampaignUI = (() => {
  const C = DotGame.Campaign, S = DotGame.CampaignStorage, U = DotGame.UI, J = DotGame.Journey, R = DotGame.Rewards;
  const escape = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const mascot = () => `<img class="campaign-mascot story-mascot" src="${C.mascot}" alt="粉紅水母陪你認識日常照護" width="1320" height="1200">`;
  const rules = () => `<details class="offer-details"><summary>活動辦法</summary><ul>${C.offer.rules.map(line=>`<li>${escape(line)}</li>`).join('')}</ul></details>`;
  function home() {
    U.$('campaign-name').textContent=C.name;
    U.$('home-heading').innerHTML=escape(C.title).replace('，','，<br>');
    U.$('campaign-intro').textContent=C.intro;
    U.$('campaign-detail').innerHTML=`<strong>${escape(C.offer.title)}</strong><span>${escape(C.offer.extra)}</span><small>${escape(C.detail)}</small>`;
    U.$('campaign-welcome').innerHTML=`<img class="campaign-mascot" src="${C.heroImage}" alt="粉紅水母抱著 PPA 按壓瓶" width="1315" height="1197"><div class="welcome-note"><span>LET’S MAKE A CONNECTION</span><p>跟我一起，連起日常保養的靈感。</p></div>`;
    const data=S.get(), count=J.count();
    U.$('campaign-start').textContent=data.pending||S.next()?(count?'繼續前三關挑戰':'開始三關挑戰'):'查看購買優惠';
    U.$('campaign-progress').textContent=`已完成 ${count}／100 關 · ${J.persistent()?'進度自動保存':'目前進度僅保留於此次開啟期間'}`;
    const completed=C.stages.filter(stage=>J.has(stage.id)).length;
    U.$('campaign-replay-details').hidden=completed===0;
    if(!completed) U.$('campaign-replay-details').open=false;
    U.$('campaign-replay-progress').textContent=`已完成 ${completed}／3 關`;
    U.$('campaign-replay').innerHTML=C.stages.map(stage=>`<button class="journey-step" data-action="campaign-play" data-level="${stage.id}" ${S.canPlay(stage.id)?'':'disabled'}><span class="journey-step-copy"><b>第 ${stage.id} 關</b><small>${J.has(stage.id)?'已完成 · 再挑戰':S.canPlay(stage.id)?'開始挑戰':'完成前關後開啟'}</small></span>${U.stars(data.records[stage.id]?.stars||0)}</button>`).join('');
  }
  function show(html) { U.$('modal').classList.remove('reward-modal'); U.$('modal').classList.add('campaign-modal'); U.modal(html); }
  function story(id) {
    const item=DotGame.Stories.forLevel(id);
    const {body, lineBreaks, compactBelow} = item.display;
    // 同一份原文插入分行標記；窄卡片可切換斷點，不重複朗讀內容。
    const markers = lineBreaks.map((offset, i) => ({offset, name:i ? 'compact' : 'default'})).sort((a,b)=>a.offset-b.offset);
    let start=0, copy='';
    for (const {offset,name} of markers) {
      copy += escape(body.slice(start,offset)) + `<br class="story-break-${name}">`;
      start=offset;
    }
    copy += escape(body.slice(start));
    return `<section class="level-story" aria-label="本關照護靈感"><p class="eyebrow">PPA · 日常照護靈感</p><h3>${escape(item.display.title)}</h3><p class="story-body${lineBreaks.length > 1 ? ` compact-below-${compactBelow}` : ''}">${copy}</p></section>`;
  }
  function milestone(notices=J.milestones()) {
    return notices.map(n=>`<aside class="milestone-notice" role="status"><strong>${n} 關里程碑達成！</strong><p>已完成 ${n} 個不同關卡。${R.purchase()==='verified'?'前往獎勵頁確認本階段申領資格。':'完成一次有效活動購買並通過驗證後，可申領本階段的 1 瓶 PPA＋1 個水母公仔。'}</p></aside>`).join('');
  }
  function result(result) {
    if(!C.stages.some(stage=>stage.id===result.id))return;
    const next=DotGame.Campaign.stages.find(stage=>stage.id===result.id)?.next;
    show(`<div class="campaign-result"><div class="story-top"><div><p class="eyebrow">PPA JOURNEY · ${result.id} / 3</p><h2>第 ${result.id} 關完成！</h2>${U.stars(result.stars)}</div>${mascot()}</div>${story(result.id)}<div class="guide-quote">${result.id===1?'洗後保濕，接著認識舒緩與舒適。':result.id===2?'再連起一道光，認識屏障的日常照護。':'前三關完成！可先查看購買優惠，也可繼續百關旅程。'}</div><div class="result-stats"><div><span>本次總分</span><strong class="gold">${result.score.toLocaleString()}</strong></div><div><span>通關耗時</span><strong>${result.time.toFixed(1)}<small> s</small></strong></div></div><p class="result-detail">剩餘 ${U.clock(result.remaining/1000)} · 時間獎勵 +${result.bonus}</p>${milestone()}${!S.persistent()?'<p>瀏覽器目前無法保存，進度僅保留於此次開啟期間。</p>':''}<div class="modal-actions">${result.id<3?`<button class="button button-primary" data-action="campaign-next" data-level="${result.id+1}">${escape(next)} ${U.icon('arrow')}</button>`:'<button class="button button-primary" data-action="campaign-info">查看購買優惠</button><button class="button button-secondary" data-action="journey-continue">繼續第 4 關</button>'}<button class="button button-secondary" data-action="campaign-play" data-level="${result.id}">重玩這一關</button><button class="text-button" data-action="home">返回活動首頁</button></div></div>`);
  }
  function rewards(notices=[],continueJourney=false) {
    const next=J.nextThreshold(), purchase={none:'尚未驗證購買',pending:'購買待驗證',verified:'購買已驗證'}[R.purchase()];
    const cards=[3,50,100].map(tier=>{
      const state=R.status(tier);
      return `<article class="reward-tier" data-tier="${tier}" data-state="${state.state}"><div class="reward-tier-heading"><h3>${tier===3?'前三關購買優惠':`${tier} 關加碼`}</h3><span>${state.reached?'關卡門檻已達成':'尚未達成'}</span></div><p class="reward-gift">${tier===3?'買一瓶 PPA、送一瓶 PPA<br>另贈 2 個水母公仔':`${tier===100?'再額外':'額外'} 1 瓶 PPA＋1 個水母公仔`}</p><p class="reward-status">${escape(state.label)}</p><small>${tier===3?'於購買時使用，每人限一次；通關本身不代表已購買或已兌換。':'需一次有效活動購買，本階段最多一次；不用為此再購買。'}</small>${state.canClaim||state.busy?`<button class="button button-primary" data-action="reward-claim" data-tier="${tier}" ${state.busy?'disabled':''}>${state.busy?'正在確認申領…':`申領 ${tier} 關加碼`}</button>`:''}</article>`;
    }).join('');
    show(`<div class="campaign-result rewards-page"><p class="eyebrow">PPA · 百關活動與獎勵</p><h2>你的百關旅程</h2><p class="journey-total">已完成 <strong>${J.count()}／100 關</strong></p><progress class="journey-progress" max="100" value="${J.count()}" aria-label="不同關卡完成進度"></progress><p>${next?`距離${next.tier===3?'前三關購買優惠':`${next.tier} 關門檻`}還差 ${next.remaining} 關${next.tier===3?'（第 1～3 關）':''}`:'百關門檻全部達成！'}</p>${milestone(notices)}<p class="purchase-state">${purchase} · ${R.available()?'購買與領取狀態由活動服務確認':'正式購買驗證與申領尚未開放'}</p>${R.error()?`<p class="reward-error" role="alert">${escape(R.error())}</p>`:''}<div class="reward-tiers">${cards}</div><p class="reward-total-note">50／100 關加碼合計為 2 瓶 PPA＋2 個公仔。若使用主要優惠並領完加碼，含購買的 1 瓶，最終合計 PPA 4 瓶、公仔 4 個。</p><p>贈送瓶規格、活動期間、運費與寄送安排待公司公告。</p>${!R.available()?'<p class="service-note">本頁展示活動方案與本機通關進度，尚未核發優惠、完成正式兌換或安排出貨。可先前往官網查看商品。</p>':''}${rules()}<div class="modal-actions"><a class="button button-primary official-link" href="${C.website}" target="_blank" rel="noopener noreferrer">前往官網查看 PPA ↗</a>${R.available()?'<button class="button button-secondary" data-action="reward-refresh">重新確認購買與領取狀態</button>':''}${continueJourney&&J.reached(3)?'<button class="button button-secondary" data-action="journey-continue">繼續第 4 關</button>':''}<button class="button button-secondary" data-action="close-rewards">返回剛才的畫面</button></div></div>`);
    U.$('modal').classList.add('reward-modal');
  }
  return {home,result,story,milestone,rewards,complete:rewards};
})();
