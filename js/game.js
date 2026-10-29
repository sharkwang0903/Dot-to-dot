/* 遊戲流程：輸入、倒數、連擊、洗牌、暫停、結算與導覽。 */
(() => {
  'use strict';
  const { Engine: E, UI: U, Storage: S, Audio: A, LEVELS } = DotGame;
  let state = null, view = 'home', modalKind = '', frame = 0, lastPaint = 0;
  let session = 0;
  const pending = new Set();
  // 所有延遲均綁定當局；離開或重開時不會讓舊動畫改到新棋盤。
  function later(callback, ms) {
    const token = session;
    const id = setTimeout(() => { pending.delete(id); if (token === session) callback(); }, ms);
    pending.add(id); return id;
  }
  function clearPending() { pending.forEach(clearTimeout); pending.clear(); }
  const remaining = () => state?.status === 'playing' ? Math.max(0, state.deadline - performance.now()) : state?.remaining || 0;
  function go(name) {
    cancelAnimationFrame(frame); clearPending(); session++; U.closeModal(); modalKind = '';
    state = null; view = name;
    if (name === 'levels') U.levels();
    U.showView(name);
  }
  function start(id) {
    if (!Number.isInteger(id) || id < 1 || id > S.get().unlocked || id > LEVELS.length) return;
    cancelAnimationFrame(frame); clearPending(); session++; U.closeModal(); modalKind = '';
    const level = LEVELS[id - 1], made = E.createBoard(level);
    state = { level, grid: made.grid, palette: made.palette, selected: null, score: 0, combo: 0, lastMatch: null,
      remaining: level.seconds * 1000, deadline: 0, status: 'ready', pausedCombo: 0 };
    view = 'game'; U.setupStage(level, made.palette); U.board(state.grid); U.combo(0);
    U.$('score').textContent = '00000'; U.updateTime(state.remaining, level.seconds); U.showView('game');
    U.message('準備連起你的第一道光');
    U.$('board').inert = true;
    later(() => {
      state.status = 'playing'; state.deadline = performance.now() + state.remaining;
      U.message(''); U.$('board').inert = false; tick();
      if (document.hidden) pauseDialog();
    }, 650);
    A.play('select');
  }
  function tick() {
    cancelAnimationFrame(frame);
    if (!state || state.status !== 'playing') return;
    const now = performance.now(), left = Math.max(0, state.deadline - now);
    if (!left) { finish(false, 0); return; }
    if (now - lastPaint > 40) {
      U.updateTime(left, state.level.seconds);
      if (state.lastMatch !== null && now - state.lastMatch > 2000) {
        state.combo = 0; state.lastMatch = null; U.combo(0);
      }
      lastPaint = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function choose(point) {
    if (!state || state.status !== 'playing') return;
    const now = performance.now(), left = state.deadline - now;
    if (left <= 0) { finish(false, 0); return; }
    if (state.grid[point.r]?.[point.c] < 1) return;
    if (!state.selected) { state.selected = point; U.select(point); A.play('select'); return; }
    if (E.equal(state.selected, point)) { state.selected = null; U.select(null); return; }
    const a = state.selected, path = E.findPath(state.grid, a, point);
    if (!path) {
      const target = U.cell(point); target?.classList.add('wrong');
      later(() => target?.classList.remove('wrong'), 270);
      state.selected = point; U.select(point); A.play('error'); return;
    }
    state.combo = E.nextCombo(state.combo, state.lastMatch, now); state.lastMatch = now;
    state.score += 100 + (state.combo - 1) * 25;
    state.grid[a.r][a.c] = 0; state.grid[point.r][point.c] = 0; state.selected = null;
    U.line(path, state.grid);
    if (state.combo % 5 === 0) {
      const reward = E.randomPair(state.grid);
      if (reward) {
        reward.forEach(p => { state.grid[p.r][p.c] = 0; }); state.score += 100;
        U.line(reward, state.grid, true); U.toast(`${state.combo} 連擊！額外消除一組寶石 +100`);
      } else U.toast(`${state.combo} 連擊！漂亮地清空棋盤。`);
      A.play('bonus');
    } else A.play('match');
    U.board(state.grid); U.combo(state.combo); U.$('score').textContent = String(state.score).padStart(5, '0');
    const effectAt = now;
    later(() => { if (state?.lastMatch === effectAt || state?.status === 'won') U.clearLine(); }, 420);
    if (!E.cells(state.grid).length) { finish(true, left); return; }
    if (!E.findMove(state.grid)) autoShuffle();
  }
  function autoShuffle() {
    state.remaining = remaining();
    if (!state.remaining) { finish(false, 0); return; }
    state.status = 'shuffling'; state.selected = null;
    // 洗牌演出不扣關卡時間，連擊的 2 秒也一起凍結。
    const started = performance.now();
    cancelAnimationFrame(frame); U.$('board').inert = true;
    U.$('board-shell').classList.add('shuffling'); U.message('沒有可連線組合，自動洗牌中'); A.play('shuffle');
    state.grid = E.reshuffle(state.grid);
    later(() => {
      U.board(state.grid); U.clearLine(); U.message(''); U.$('board-shell').classList.remove('shuffling');
      if (state.lastMatch !== null) state.lastMatch += performance.now() - started;
      state.status = 'playing'; state.deadline = performance.now() + state.remaining;
      U.$('board').inert = false; tick();
      if (document.hidden) pauseDialog();
    }, 650);
  }
  function pause(kind = 'pause') {
    if (!state || state.status !== 'playing') return false;
    state.remaining = remaining();
    if (state.remaining <= 0) { finish(false, 0); return false; }
    state.pausedCombo = state.lastMatch === null ? 0 : Math.max(0, 2000 - (performance.now() - state.lastMatch));
    state.status = 'paused'; cancelAnimationFrame(frame);
    U.clearLine(); U.$('board-shell').classList.add('paused'); U.$('board').inert = true;
    modalKind = kind;
    return true;
  }
  function resume() {
    if (!state || state.status !== 'paused') return;
    U.closeModal(); modalKind = ''; state.status = 'playing';
    const now = performance.now();
    state.deadline = now + state.remaining;
    state.lastMatch = state.pausedCombo > 0 ? now - (2000 - state.pausedCombo) : null;
    if (!state.lastMatch) { state.combo = 0; U.combo(0); }
    U.$('board-shell').classList.remove('paused'); U.$('board').inert = false; tick();
  }
  function pauseDialog() {
    if (!pause()) return;
    U.modal(`<div class="modal-ornament">Ⅱ</div><div class="eyebrow">A LITTLE PAUSE</div><h2>休息一下，也很好。</h2><p>時間與連擊已暫停。<br>準備好了，就接回剛才的節奏。</p><div class="modal-actions"><button class="button button-primary" data-action="resume">繼續遊戲 ${U.icon('arrow')}</button><button class="button button-secondary" data-action="retry">重新挑戰</button><button class="text-button" data-action="levels">返回關卡選擇</button></div>`);
  }
  function leave(destination = 'levels') {
    if (!state || !['playing', 'paused'].includes(state.status)) return;
    if (state.status === 'playing' && !pause('leave')) return;
    modalKind = 'leave';
    U.modal(`<div class="eyebrow">UNTIL NEXT TIME</div><h2>先離開這一局？</h2><p>這一局尚未完成的分數不會保存。<br>已取得的通關紀錄都會保留。</p><div class="modal-actions"><button class="button button-primary" data-action="resume">繼續這一局 ${U.icon('arrow')}</button><button class="button button-secondary" data-action="${destination}">確認離開</button></div>`);
  }
  function finish(won, left) {
    if (!state || ['won', 'lost'].includes(state.status)) return;
    state.remaining = Math.max(0, left); state.status = won ? 'won' : 'lost'; state.selected = null;
    cancelAnimationFrame(frame); U.$('board').inert = true; U.select(null); U.updateTime(state.remaining, state.level.seconds);
    const time = (state.level.seconds * 1000 - state.remaining) / 1000;
    const rating = won ? E.stars(state.remaining, state.level.seconds * 1000) : 0;
    const bonus = won ? Math.ceil(state.remaining / 1000) * 10 : 0;
    state.score += bonus; U.$('score').textContent = String(state.score).padStart(5, '0');
    const best = won ? S.record(state.level.id, { stars: rating, score: state.score, time }) : false;
    if (won) U.$('board-shell').classList.add('cleared');
    A.play(won ? 'win' : 'lose');
    later(() => {
      modalKind = 'result';
      const last = state.level.id === LEVELS.length;
      U.modal(`<div class="eyebrow">${won ? last ? 'ALL STAGES. BEAUTIFULLY CONNECTED.' : 'A BEAUTIFUL CONNECTION' : 'ONE MORE CONNECTION?'}</div><h2>${won ? `第 ${state.level.id} 關完成！` : '時間到了。再來一局？'}</h2>${won ? `<div class="result-stars">${U.stars(rating)}</div><p>${last ? '所有關卡的光都亮起了。回到喜歡的關卡，繼續收集星星。' : rating === 3 ? '節奏剛剛好，三顆星都屬於你。' : '又點亮一關！下次試著更快找到相同的寶石。'}</p>` : '<div class="modal-ornament">↻</div><p>寶石們還在等你。換個節奏，再試一次。<br>已保存的最佳紀錄不受影響。</p>'}<div class="result-stats"><div><span>${won ? '本次總分' : '本次分數'}</span><strong class="gold">${state.score.toLocaleString()}</strong></div><div><span>${won ? '通關耗時' : '本次耗時'}</span><strong>${time.toFixed(1)}<small> s</small></strong></div></div>${won ? `<p>剩餘 ${U.clock(state.remaining / 1000)} · 時間獎勵 +${bonus}</p>${best ? '<p class="new-best">✦ NEW PERSONAL BEST ✦</p>' : ''}${!S.persistent() ? '<p>瀏覽器無法永久儲存，目前紀錄僅保留於此次開啟期間。</p>' : ''}` : ''}<div class="modal-actions">${won && !last ? `<button class="button button-primary" data-action="play" data-level="${state.level.id + 1}">前往第 ${state.level.id + 1} 關 ${U.icon('arrow')}</button>` : `<button class="button button-primary" data-action="${won ? 'levels' : 'retry'}">${won ? '回到關卡選擇' : '再挑戰一次'} ${U.icon(won ? 'arrow' : 'retry')}</button>`}<button class="button button-secondary" data-action="${won ? 'retry' : 'levels'}">${won ? '重玩這一關' : '返回關卡選擇'}</button>${won && !last ? '<button class="text-button" data-action="levels">返回關卡選擇</button>' : ''}</div>`);
    }, won ? 450 : 150);
  }
  function help() {
    if (state && ['ready', 'shuffling'].includes(state.status)) return;
    if (state?.status === 'playing' && !pause('help')) return;
    modalKind = 'help';
    U.modal(`<div class="eyebrow">THE LITTLE RULEBOOK</div><h2>連起來，就對了。</h2><ol class="help-list"><li>點選兩顆<b>相同顏色</b>的寶石。路線最多轉彎兩次，可以繞到棋盤外。</li><li>路線不能穿過其他寶石或牆壁。第 4 關起出現<b>不可消除的牆壁</b>。</li><li>沒有合法配對時<b>自動洗牌</b>，保留牆壁與空格。洗牌演出不扣時間。</li><li>每次成功消除間隔在 <b>2 秒內</b>，連擊可持續累積。第 5、10、15……擊額外隨機消除一組；獎勵無須連線，也不累積或重置連擊。</li><li>第 n 次連擊的配對得分為 <b>100 + (n − 1) × 25</b>，每次遞增 25 分，直到連擊中斷。獎勵配對再加 100，通關每剩餘 1 秒（無條件進位）加 10 分。</li><li>倒數歸零即失敗。通關解鎖下一關，各關<b>分別保存</b>最高分、最快時間與最佳星級。</li></ol><p class="help-stars">★★★ 剩餘 >50%　★★ 剩餘 25～50%<br>★ 剩餘 >0% 且 <25%</p><p style="margin-top:12px">可用滑鼠或觸控。Tab／方向鍵移動，Enter 選取。<br>Esc 暫停；切換分頁也會自動暫停。</p><div class="modal-actions"><button class="button button-primary" data-action="close-help">知道了，開始連線 ${U.icon('arrow')}</button></div>`);
  }
  document.addEventListener('click', event => {
    const tile = event.target.closest('[data-cell]');
    if (tile) { choose({ r: Number(tile.dataset.r), c: Number(tile.dataset.c) }); return; }
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    switch (action) {
      case 'home': if (view === 'game' && state && ['playing', 'paused'].includes(state.status) && !button.closest('dialog')) leave('home'); else if (!state || !['ready', 'shuffling'].includes(state.status)) go('home'); break;
      case 'levels': go('levels'); break;
      case 'play': start(Number(button.dataset.level)); break;
      case 'retry': if (state) start(state.level.id); break;
      case 'leave': leave(); break;
      case 'pause': pauseDialog(); break;
      case 'resume': resume(); break;
      case 'help': help(); break;
      case 'close-help': U.closeModal(); if (state?.status === 'paused') resume(); modalKind = ''; break;
      case 'sound': S.sound(!S.get().sound); U.soundButton(); if (S.get().sound) A.play('select'); break;
    }
  });
  U.$('modal').addEventListener('cancel', event => {
    event.preventDefault();
    if (['pause', 'leave', 'help'].includes(modalKind)) { U.closeModal(); if (state?.status === 'paused') resume(); modalKind = ''; }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !U.$('modal').open && state?.status === 'playing') { event.preventDefault(); pauseDialog(); return; }
    if (!state || state.status !== 'playing' || !event.key.startsWith('Arrow')) return;
    const focused = document.activeElement.closest('[data-cell]');
    if (!focused) return;
    event.preventDefault();
    const [dr, dc] = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] }[event.key] || [0,0];
    let r = Number(focused.dataset.r) + dr, c = Number(focused.dataset.c) + dc;
    while (r > 0 && c > 0 && r <= state.level.rows && c <= state.level.cols) {
      if (state.grid[r][c] > 0) { U.cell({ r, c })?.focus({ preventScroll: true }); break; }
      r += dr; c += dc;
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && state?.status === 'playing') pauseDialog(); });
  window.addEventListener('blur', () => { if (state?.status === 'playing') pauseDialog(); });
  U.pixelTitle(); U.demo(); U.soundButton(); U.combo(0);
})();
