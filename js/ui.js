/* 畫面繪製與共用 UI。SVG 都是程式產生的像素圖形。 */
DotGame.UI = (() => {
  const $ = id => document.getElementById(id);
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const stars = count => `<span class="stars" role="img" aria-label="${count} 顆星">${[1, 2, 3].map(i => `<svg class="icon ${i > count ? 'empty-star' : ''}" aria-hidden="true"><use href="#i-star"/></svg>`).join('')}</span>`;
  const clock = seconds => `${String(Math.floor(Math.ceil(Math.max(0, seconds)) / 60)).padStart(2, '0')}:${String(Math.ceil(Math.max(0, seconds)) % 60).padStart(2, '0')}`;
  const formatTime = seconds => `${seconds.toFixed(1)} 秒`;
  const marks = {
    cross: '<path d="M11 8h2v3h3v2h-3v3h-2v-3H8v-2h3z"/>',
    bar: '<path d="M8 11h8v3H8z"/>', dot: '<path d="M10 10h4v4h-4z"/>',
    diagonal: '<path d="M8 14h3v-3h3V8h3v3h-3v3h-3v3H8z"/>',
    square: '<path fill-rule="evenodd" d="M8 8h8v8H8zM10 10v4h4v-4z"/>',
    diamond: '<path d="M11 8h2v2h2v2h-2v2h-2v-2H9v-2h2z"/>',
    twins: '<path d="M8 9h3v6H8zm6 0h3v6h-3z"/>',
    chevron: '<path d="M7 13h2v-2h2V9h2v2h2v2h2v2h-4v-2h-2v2H7z"/>',
    equals: '<path d="M8 9h8v2H8zm0 5h8v2H8z"/>',
    heart: '<path d="M7 9h4v2h2V9h4v6h-2v2h-2v2h-2v-2H9v-2H7z"/>',
    leaf: '<path d="M11 7h6v6h-2v2h-4v2H9v2H7v-4h2v-4h2z"/>',
    moon: '<path d="M10 7h5v2h-3v6h3v2h-5v-2H8V9h2z"/>',
    crown: '<path d="M7 9h2v3h2V9h2v3h2V9h2v8H7z"/>',
    hourglass: '<path d="M8 8h8v3h-2v4h2v3H8v-3h2v-4H8zm3 3v4h2v-4z" fill-rule="evenodd"/>',
    spark: '<path d="M11 7h2v4h4v2h-4v4h-2v-4H7v-2h4zM7 7h2v2H7zm8 8h2v2h-2z"/>'
  };
  function gem(id) {
    const g = DotGame.GEMS[id - 1];
    return `<svg class="gem" viewBox="0 0 24 27" shape-rendering="crispEdges" aria-hidden="true"><path fill="${g.dark}" d="M6 1h12v3h3v3h2v12h-3v3h-3v3H7v-3H4v-3H1V7h2V4h3z"/><path fill="${g.color}" d="M6 3h12v3h3v11h-3v4h-4v2h-4v-2H6v-4H3V7h3z"/><path fill="${g.light}" d="M6 3h12v3H9v3H6v7H3V7h3z"/><path fill="${g.dark}" opacity=".65" d="M18 9h3v8h-3v4h-4v2h-4v-3h6v-4h2z"/><g fill="${g.light}" opacity=".85">${marks[g.mark]}</g><path fill="#fff" opacity=".6" d="M6 4h3v3H6z"/></svg>`;
  }
  const wall = '<svg class="wall-art" viewBox="0 0 30 28" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M2 3h11v6H2zm14 0h12v6H16zM2 12h5v6H2zm8 0h12v6H10zm15 0h3v6h-3zM2 21h11v5H2zm14 0h12v5H16z"/></svg>';
  function pixelTitle() {
    const letters = { D: ['11110','10001','10001','10001','10001','10001','11110'], O: ['01110','11011','10001','10001','10001','11011','01110'], T: ['11111','00100','00100','00100','00100','00100','00100'] };
    const word = (text, x, y, color) => [...text].map((letter, n) => letters[letter]?.map((row, r) => [...row].map((v, c) => v === '1' ? `<rect x="${x + n * 6 + c}" y="${y + r}" width="1" height="1" fill="${color}"/>` : '').join('')).join('')).join('');
    $('pixel-title').innerHTML = `<svg viewBox="0 0 42 16" shape-rendering="crispEdges">${word('DOT', 0, 0, '#f1f0e8')}${word('TO', 21, 0, '#98e2bb')}${word('DOT', 0, 9, '#f1f0e8')}<path fill="#98e2bb" d="M22 12h13v-2h2v2h2v2h-2v2h-2v-2H22z"/><rect x="19" y="12" width="1" height="2" fill="#638674"/></svg>`;
  }
  function demo() {
    const values = [1,3,7,2,6,4, 2,4,0,0,3,7, 7,1,0,0,4,2, 4,6,3,0,0,3, 3,7,2,4,6,1];
    $('demo-board').innerHTML = values.map((v, i) => `<div class="demo-cell ${!v ? 'empty' : ''} ${i === 10 || i === 23 ? 'highlight' : ''}">${v ? gem(v) : ''}</div>`).join('') + '<svg class="demo-route" viewBox="0 0 360 300" preserveAspectRatio="none"><path d="M265 92H207V208H323"/></svg>';
  }
  function showView(name) {
    document.body.dataset.view = name;
    document.querySelectorAll('.view').forEach(el => { el.hidden = el.id !== `${name}-view`; });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function levels() {
    const data = DotGame.Storage.get();
    $('star-total').textContent = String(Object.values(data.records).reduce((sum, rec) => sum + rec.stars, 0)).padStart(2, '0');
    $('level-grid').innerHTML = DotGame.LEVELS.map(level => {
      const rec = data.records[level.id], locked = level.id > data.unlocked;
      const mini = level.layout.map(row => [...row].map(v => `<span class="preview-cell ${v === '.' ? 'hole' : v === '#' ? 'wall' : ''}"></span>`).join('')).join('');
      return `<button class="level-card ${locked ? 'locked' : !rec ? 'next' : ''}" data-action="play" data-level="${level.id}" ${locked ? 'disabled' : ''} aria-label="第 ${level.id} 關，${locked ? '尚未解鎖' : rec ? `${rec.stars} 顆星，可重新挑戰` : '開始挑戰'}"><div class="level-card-top"><h2>第 ${level.id} 關</h2><span>${String(level.id).padStart(2, '0')} / ${DotGame.LEVELS.length}</span></div><div class="level-preview" style="--preview-cols:${level.cols}">${mini}</div>${locked ? `<span class="lock-icon">${icon('lock')}</span>` : ''}<div class="level-info"><span>${level.colors} 色 · ${level.tiles} 顆${level.walls ? ' · 牆壁' : ''}</span><span>${icon('clock')}${clock(level.seconds)}</span></div><div class="level-card-bottom">${stars(rec?.stars || 0)}<span>${locked ? `通過第 ${level.id - 1} 關解鎖` : rec ? `${rec.score.toLocaleString()} 分` : '開始挑戰 →'}</span></div></button>`;
    }).join('');
    $('save-note').textContent = DotGame.Storage.persistent() ? '進度會自動儲存在這個瀏覽器。' : '瀏覽器目前無法儲存，關閉頁面後紀錄可能消失。';
  }
  function setupStage(level, palette) {
    const rec = DotGame.Storage.get().records[level.id];
    $('game-heading').textContent = `第 ${level.id} 關`;
    $('game-stage-label').textContent = `STAGE ${String(level.id).padStart(2, '0')} / ${DotGame.LEVELS.length}`;
    $('color-count').textContent = `${level.colors} 色`;
    $('palette').innerHTML = palette.map(id => `<span title="${DotGame.GEMS[id - 1].name}色寶石">${gem(id)}</span>`).join('');
    $('wall-count').textContent = level.walls ? `${level.walls} 格` : '無';
    $('best-stars').innerHTML = stars(rec?.stars || 0);
    $('best-score').textContent = rec ? rec.score.toLocaleString() : '—';
    $('best-time').textContent = rec ? formatTime(rec.time) : '—';
    $('board-shell').classList.remove('cleared', 'paused', 'shuffling');
    $('board').style.setProperty('--cols', level.cols + 2);
    $('board').style.setProperty('--rows', level.rows + 2);
    $('board').style.setProperty('--inner-cols', level.cols);
    $('board').style.setProperty('--inner-rows', level.rows);
    $('board-shell').style.setProperty('--board-ratio', (level.cols + 1) / (level.rows + 1));
    $('hint-button').disabled = false;
    $('hint-button').innerHTML = `${icon('hint')} 給我提示`;
    clearLine(); message('');
  }
  function board(grid, selected) {
    const focus = document.activeElement?.closest('[data-cell]');
    const focusKey = focus?.dataset.cell;
    $('board').innerHTML = grid.map((row, r) => row.map((value, c) => {
      const edge = r === 0 || c === 0 || r === grid.length - 1 || c === row.length - 1;
      if (edge) return '<span class="board-cell outer" aria-hidden="true"></span>';
      if (!value) return '<span class="board-cell empty" aria-hidden="true"></span>';
      if (value === -1) return `<span class="board-cell wall" role="img" aria-label="牆壁，第 ${r} 列第 ${c} 格">${wall}</span>`;
      const isSelected = selected && selected.r === r && selected.c === c;
      return `<button class="board-cell ${isSelected ? 'selected' : ''}" data-cell="${r},${c}" data-r="${r}" data-c="${c}" aria-label="${DotGame.GEMS[value - 1].name}色寶石，第 ${r} 列第 ${c} 格" aria-pressed="${!!isSelected}">${gem(value)}</button>`;
    }).join('')).join('');
    if (focusKey) {
      const replacement = document.querySelector(`[data-cell="${focusKey}"]`) || $('board').querySelector('button');
      replacement?.focus({ preventScroll: true });
    }
    $('remaining').textContent = `剩餘 ${DotGame.Engine.cells(grid).length / 2} 組`;
  }
  function select(point) {
    document.querySelectorAll('.board-cell.selected').forEach(el => { el.classList.remove('selected'); el.setAttribute('aria-pressed', 'false'); });
    if (point) {
      const el = cell(point); el?.classList.add('selected'); el?.setAttribute('aria-pressed', 'true');
    }
  }
  const cell = p => document.querySelector(`[data-cell="${p.r},${p.c}"]`);
  function updateTime(ms, total) {
    const fraction = Math.max(0, ms / (total * 1000));
    const rating = DotGame.Engine.stars(ms, total * 1000);
    $('time-text').textContent = clock(ms / 1000);
    $('timer-fill').style.width = `${fraction * 100}%`;
    $('timer-track').className = `timer-track ${rating === 2 ? 'two' : rating <= 1 ? 'one' : ''}`;
    $('timer-track').setAttribute('aria-valuenow', Math.ceil(fraction * 100));
    $('timer-track').setAttribute('aria-valuetext', `剩餘 ${clock(ms / 1000)}，目前 ${rating} 星`);
    if ($('live-stars').dataset.rating !== String(rating)) {
      $('live-stars').innerHTML = stars(rating); $('live-stars').dataset.rating = rating;
    }
  }
  function combo(count, ratio) {
    $('combo-count').innerHTML = `${count}<span> / 5</span>`;
    $('combo-pips').innerHTML = [1, 2, 3, 4, 5].map(i => `<span class="combo-pip ${i <= count ? 'filled' : ''}"></span>`).join('');
    $('combo-fill').style.width = `${Math.max(0, ratio) * 100}%`;
    $('combo-caption').textContent = count === 5 ? '五連擊達成！額外消除一組。' : count ? `再連消 ${5 - count} 組，就有額外獎勵。` : '連續消除五組，額外送一組。';
  }
  function line(path, grid, bonus = false) {
    const boardEl = $('board'), layer = $('connection-layer');
    const rect = boardEl.getBoundingClientRect();
    const point = p => {
      const tile = boardEl.children[p.r * grid[0].length + p.c].getBoundingClientRect();
      return { x: tile.left - rect.left + tile.width / 2, y: tile.top - rect.top + tile.height / 2, w: tile.width, h: tile.height };
    };
    layer.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    if (bonus) {
      layer.innerHTML += path.map(p => { const q = point(p); return `<rect class="bonus-ring" x="${q.x - q.w * .4}" y="${q.y - q.h * .4}" width="${q.w * .8}" height="${q.h * .8}"/>`; }).join('');
    } else {
      const route = path.map(point);
      layer.innerHTML = `<polyline class="route-line" points="${route.map(p => `${p.x},${p.y}`).join(' ')}"/>${[route[0], route[route.length - 1]].map(p => `<rect class="route-end" x="${p.x - 3}" y="${p.y - 3}" width="6" height="6"/>`).join('')}`;
    }
  }
  function clearLine() { $('connection-layer').innerHTML = ''; }
  function message(text) { $('board-message').textContent = text; $('board-message').hidden = !text; }
  function soundButton() {
    const on = DotGame.Storage.get().sound;
    document.querySelectorAll('.sound-toggle').forEach(el => { el.innerHTML = icon(on ? 'sound' : 'mute'); el.setAttribute('aria-label', on ? '關閉音效' : '開啟音效'); el.setAttribute('aria-pressed', String(on)); });
  }
  let toastTimer;
  function toast(text) {
    clearTimeout(toastTimer); $('toast').textContent = text; $('toast').classList.add('visible');
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2600);
  }
  function modal(html) {
    $('modal-content').innerHTML = html;
    const heading = $('modal-content').querySelector('h2');
    if (heading) { heading.id = 'dialog-heading'; $('modal').setAttribute('aria-labelledby', 'dialog-heading'); }
    if (!$('modal').open) $('modal').showModal();
  }
  function closeModal() { if ($('modal').open) $('modal').close(); }
  return { $, icon, stars, clock, formatTime, gem, pixelTitle, demo, showView, levels, setupStage, board, select, cell, updateTime, combo, line, clearLine, message, soundButton, toast, modal, closeModal };
})();
