/* 活動首頁、通關介紹與完成資訊；沿用同一個 dialog，沒有額外計時器。 */
DotGame.CampaignUI = (() => {
  const C = DotGame.Campaign, S = DotGame.CampaignStorage, U = DotGame.UI;
  const escape = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const mascot = (className = '') => `<img class="campaign-mascot ${className}" src="${C.mascot}" alt="戴花瓣頭飾、笑著招手的粉紅水母" width="1320" height="1200">`;
  const paragraphs = lines => lines.map(line => `<p>${escape(line)}</p>`).join('');
  const rules = () => `<details class="offer-details"><summary>活動辦法</summary><ul>${C.offer.rules.map(line => `<li>${escape(line)}</li>`).join('')}</ul></details>`;
  const duo = () => `<figure class="gift-duo"><div class="gift-duo-images">${mascot('gift-mascot')}${mascot('gift-mascot')}<b class="gift-count" aria-label="兩個公仔">×2</b></div><figcaption>${escape(C.offer.imageNote)}</figcaption></figure>`;
  function productInfo() {
    return `<div class="product-info offer-overview"><p class="eyebrow">PPA · 通關好禮提案</p><h3>${escape(C.offer.title)}</h3><p class="offer-extra">${escape(C.offer.extra)}！</p>${duo()}<p>購買一瓶 30 mL，送同規格一瓶，共兩瓶加兩個公仔。</p>${rules()}<a class="button button-secondary official-link" href="${C.website}" target="_blank" rel="noopener noreferrer">前往官網查看 PPA <span aria-hidden="true">↗</span></a></div>`;
  }
  function home() {
    U.$('campaign-name').textContent = C.name;
    U.$('home-heading').innerHTML = escape(C.title).replace('，', '，<br>');
    U.$('campaign-intro').textContent = C.intro;
    U.$('campaign-detail').innerHTML = `<strong>PPA 買一送一</strong><span>${escape(C.offer.extra)}！</span><small>適用 30 mL · ${escape(C.detail)}</small>`;
    U.$('campaign-welcome').innerHTML = `<img class="campaign-mascot" src="${C.heroImage}" alt="戴花瓣頭飾的粉紅水母抱著 PPA 按壓瓶" width="1315" height="1197"><div class="welcome-note"><span>LET’S MAKE A CONNECTION</span><p>跟我一起，連起日常保養的靈感。</p></div>`;
    U.$('campaign-products').innerHTML = productInfo();
    const data = S.get(), count = Object.keys(data.records).length;
    U.$('campaign-start').textContent = count === 0 ? '開始挑戰，解鎖好禮' : data.pending || count < 3 ? '繼續挑戰，解鎖好禮' : '查看已解鎖好禮';
    U.$('campaign-progress').textContent = `已完成 ${count} / 3 關${S.persistent() ? ' · 進度自動保存' : ' · 目前進度僅保留於此次開啟期間'}`;
    U.$('campaign-replay').innerHTML = C.stages.map(stage => `<button class="journey-step" data-action="campaign-play" data-level="${stage.id}" ${S.canPlay(stage.id) ? '' : 'disabled'}><span class="journey-number">0${stage.id}</span><span><b>第 ${stage.id} 關</b><small>${data.records[stage.id] ? '已完成 · 再挑戰' : S.canPlay(stage.id) ? '開始挑戰' : '完成前關後開啟'}</small></span>${U.stars(data.records[stage.id]?.stars || 0)}</button>`).join('');
  }
  function show(html) {
    U.$('modal').classList.remove('reward-modal');
    U.$('modal').classList.add('campaign-modal'); U.modal(html);
  }
  function result(result) {
    const stage = C.stages.find(stage => stage.id === result.id);
    if (!stage) return;
    show(`<div class="campaign-result"><div class="story-top"><div><p class="eyebrow">PPA JOURNEY · ${result.id} / 3</p><p class="stage-complete">第 ${result.id} 關完成！</p>${U.stars(result.stars)}</div>${mascot('story-mascot')}</div><h2>${escape(stage.title)}</h2><div class="story-copy">${paragraphs(stage.paragraphs)}</div><div class="guide-quote">${escape(stage.guide)}</div><div class="result-stats"><div><span>本次總分</span><strong class="gold">${result.score.toLocaleString()}</strong></div><div><span>通關耗時</span><strong>${result.time.toFixed(1)}<small> s</small></strong></div></div><p class="result-detail">剩餘 ${U.clock(result.remaining / 1000)} · 時間獎勵 +${result.bonus}</p>${!S.persistent() ? '<p>瀏覽器目前無法保存，進度僅保留於此次開啟期間。</p>' : ''}<div class="modal-actions"><button class="button button-primary" data-action="${result.id === 3 ? 'campaign-info' : 'campaign-next'}" data-level="${result.id + 1}">${escape(stage.next)} ${U.icon('arrow')}</button><button class="button button-secondary" data-action="campaign-play" data-level="${result.id}">重玩這一關</button><button class="text-button" data-action="home">返回活動首頁</button></div></div>`);
  }
  function complete() {
    const data = S.get();
    show(`<div class="campaign-result reward-card"><header class="reward-heading"><p class="eyebrow">PPA · 通關好禮提案</p><h2>${escape(C.complete.title)}</h2><p>${escape(C.complete.intro)}</p></header><div class="reward-layout">${duo()}<div class="reward-copy"><h3>${escape(C.offer.title)}</h3><p class="offer-extra">${escape(C.offer.extra)}</p><p class="reward-emotion">${escape(C.complete.description)}</p><p class="reward-redemption">${escape(C.complete.redemption)}</p><button id="reward-redeem" class="button button-primary" data-action="campaign-redeem">前往官網兌換優惠 ${U.icon('arrow')}</button><div id="reward-handoff" class="reward-handoff" hidden><p id="reward-handoff-note" tabindex="-1">${escape(C.offer.handoff)}</p><a class="button button-primary official-link" href="${C.website}" target="_blank" rel="noopener noreferrer">前往官網查看 PPA <span aria-hidden="true">↗</span></a><button class="text-button" data-action="campaign-redeem-cancel">取消，留在這裡</button></div><button class="button button-secondary reward-continue" data-action="levels">繼續挑戰</button></div></div><div class="reward-secondary">${rules()}<details class="offer-details"><summary>查看挑戰紀錄</summary><div class="reward-records">${C.stages.map(stage=>`<p><b>第 ${stage.id} 關</b> ${U.stars(data.records[stage.id]?.stars || 0)}<span>${data.records[stage.id]?.score.toLocaleString() || '—'} 分 · ${data.records[stage.id]?.time.toFixed(1) || '—'} 秒</span></p>`).join('')}</div></details></div><button class="text-button reward-home" data-action="home">返回活動首頁</button></div>`);
    U.$('modal').classList.add('reward-modal');
  }
  function redeem(showNotice = true) {
    U.$('reward-handoff').hidden = !showNotice; U.$('reward-redeem').hidden = showNotice;
    const target = U.$(showNotice ? 'reward-handoff-note' : 'reward-redeem');
    target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'nearest' });
  }
  return { home, result, complete, redeem };
})();
