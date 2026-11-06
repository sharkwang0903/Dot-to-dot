/* 純遊戲規則：不操作 DOM，也不依賴計時器，方便獨立驗證。 */
window.DotGame = window.DotGame || {};
DotGame.Engine = (() => {
  const equal = (a, b) => a.r === b.r && a.c === b.c;
  const clockType = value => value > 0 ? Math.floor(value / DotGame.CLOCK.offset) : 0;
  const clearClock = value => value > 0 ? value % DotGame.CLOCK.offset : value;
  const fogDepth = value => value > 0 ? Math.floor(clearClock(value) / DotGame.FOG.offset) : 0;
  const clearFog = value => value > 0 ? value - fogDepth(value) * DotGame.FOG.offset : value;
  const isFogged = value => fogDepth(value) > 0;
  const isFrozen = value => clearClock(clearFog(value)) > DotGame.ICE.offset;
  const thawValue = value => isFrozen(value) ? value - DotGame.ICE.offset : value;
  const tileValue = value => thawValue(clearFog(value));
  const isBomb = value => clearClock(tileValue(value)) > DotGame.BOMB.offset && clearClock(tileValue(value)) <= DotGame.BOMB.offset + DotGame.GEMS.length;
  const baseValue = value => isBomb(value) ? clearClock(tileValue(value)) - DotGame.BOMB.offset : clearClock(tileValue(value));
  const sameColor = (a, b) => baseValue(a) === baseValue(b);
  const stagePoints = points => (points || []).map(p => ({ r: p.r + 1, c: p.c + 1 }));
  const inZone = (p, zone, grid) => !zone || (zone.edge ? p.r === 1 || p.c === 1 ||
    p.r === grid.length - 2 || p.c === grid[0].length - 2 : p.r > zone.row && p.r <= zone.row + zone.rows &&
    p.c > zone.col && p.c <= zone.col + zone.cols);
  function zoneOrder(candidates, zone, strict, grid) {
    if (!zone) return candidates;
    const inside = candidates.filter(p => inZone(p, zone, grid));
    return strict ? inside : [...inside, ...candidates.filter(p => !inZone(p, zone, grid))];
  }
  // 終章只預先排好可配對的起手位置，不改各色數量，也不限制之後的清除順序。
  function seedPair(grid, points, color, protectedCells = []) {
    const targets = stagePoints(points), ready = grid.map(row => row.slice()), fixed = protectedCells.slice();
    if (targets.length !== 2 || targets.some(p => !(ready[p.r]?.[p.c] > 0))) throw new Error('起手配對位置必須是兩個寶石格。');
    for (const target of targets) {
      if (ready[target.r][target.c] !== color) {
        const source = cells(ready).find(p => p.value === color && !fixed.some(q => equal(p,q)));
        if (!source) throw new Error('起手配對必須保留原本成對的顏色數量。');
        [ready[target.r][target.c], ready[source.r][source.c]] = [ready[source.r][source.c], ready[target.r][target.c]];
      }
      fixed.push(target);
    }
    if (!findPath(ready, targets[0], targets[1])) throw new Error('起手配對必須有合法連線。');
    return ready;
  }
  function shuffle(items, rng = Math.random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function cells(grid) {
    const result = [];
    for (let r = 1; r < grid.length - 1; r++)
      for (let c = 1; c < grid[0].length - 1; c++)
        if (grid[r][c] > 0) result.push({ r, c, value: grid[r][c] });
    return result;
  }
  // grid 外框保留一格空白，讓路徑能從棋盤外繞行。
  function findPath(grid, a, b, geometryOnly = false) {
    if (equal(a, b) || !grid[a.r]?.[a.c] || !grid[b.r]?.[b.c]) return null;
    if (grid[a.r][a.c] < 1 || grid[b.r][b.c] < 1) return null;
    if (isFrozen(grid[a.r][a.c]) || isFrozen(grid[b.r][b.c])) return null;
    if (!geometryOnly && !sameColor(grid[a.r][a.c], grid[b.r][b.c])) return null;
    const open = p => grid[p.r]?.[p.c] === 0 || equal(p, a) || equal(p, b);
    function segment(p, q) {
      if (p.r !== q.r && p.c !== q.c) return false;
      if (!open(p) || !open(q)) return false;
      const dr = Math.sign(q.r - p.r), dc = Math.sign(q.c - p.c);
      let r = p.r + dr, c = p.c + dc;
      while (r !== q.r || c !== q.c) {
        if (grid[r]?.[c] !== 0) return false;
        r += dr; c += dc;
      }
      return true;
    }
    function check(points) {
      const path = points.filter((p, i) => !i || !equal(p, points[i - 1]));
      for (let i = 1; i < path.length; i++) if (!segment(path[i - 1], path[i])) return null;
      return path.filter((p, i) => !i || i === path.length - 1 ||
        !((path[i - 1].r === p.r && p.r === path[i + 1].r) ||
          (path[i - 1].c === p.c && p.c === path[i + 1].c)));
    }
    let path = check([a, b]);
    if (path) return path;
    path = check([a, { r: a.r, c: b.c }, b]) || check([a, { r: b.r, c: a.c }, b]);
    if (path) return path;
    const options = [];
    for (let r = 0; r < grid.length; r++) {
      const candidate = check([a, { r, c: a.c }, { r, c: b.c }, b]);
      if (candidate) options.push(candidate);
    }
    for (let c = 0; c < grid[0].length; c++) {
      const candidate = check([a, { r: a.r, c }, { r: b.r, c }, b]);
      if (candidate) options.push(candidate);
    }
    const length = route => route.slice(1).reduce((sum, p, i) => sum + Math.abs(p.r - route[i].r) + Math.abs(p.c - route[i].c), 0);
    return options.sort((p, q) => length(p) - length(q))[0] || null;
  }
  function findMove(grid, geometryOnly = false) {
    const occupied = cells(grid).filter(p => !isFrozen(p.value));
    for (let i = 0; i < occupied.length; i++) {
      for (let j = i + 1; j < occupied.length; j++) {
        if (!geometryOnly && !sameColor(occupied[i].value, occupied[j].value)) continue;
        const path = findPath(grid, occupied[i], occupied[j], geometryOnly);
        if (path) return { a: occupied[i], b: occupied[j], path };
      }
    }
    return null;
  }
  function reshuffle(grid, rng = Math.random) {
    const occupied = cells(grid);
    if (!occupied.length) return grid;
    const next = grid.map(row => row.slice());
    // 洗牌只交換冰層內的寶石，冰層留在原格，避免移到無鄰牌的位置。
    const values = occupied.map(p => tileValue(p.value));
    const assign = (list, positions = occupied) => {
      const mixed = list.slice();
      for (let i = 0; i < positions.length; i++) if (isFrozen(positions[i].value) && isPPA(mixed[i])) {
        const j = positions.findIndex((p, j) => !isFrozen(p.value) && !isPPA(mixed[j]));
        if (j < 0) throw new Error('冰封位置必須保留足夠普通寶石。');
        [mixed[i], mixed[j]] = [mixed[j], mixed[i]];
      }
      positions.forEach((p, i) => { next[p.r][p.c] = mixed[i] + (isFrozen(p.value) ? DotGame.ICE.offset : 0) + fogDepth(p.value) * DotGame.FOG.offset; });
    };
    for (let attempt = 0; attempt < 24; attempt++) {
      assign(shuffle(values, rng));
      if (findMove(next)) return next;
    }
    // 有限次隨機嘗試後，將同色一組放入確定能連線的兩格，避免無限洗牌。
    const move = findMove(next, true);
    if (!move) throw new Error('關卡版型沒有可連線的格子。');
    // 若仍有 PPA，先用它保底，確保其餘 PPA 仍能放在未冰封格。
    const paired = values.find(isPPA) || values.find(value => values.filter(v => sameColor(v, value)).length >= 2);
    if (!paired) throw new Error('寶石數量未成對。');
    const rest = values.slice();
    const first = rest.splice(rest.indexOf(paired), 1)[0];
    const second = rest.splice(rest.findIndex(value => sameColor(value, paired)), 1)[0];
    const mixed = shuffle(rest, rng);
    next[move.a.r][move.a.c] = first + fogDepth(grid[move.a.r][move.a.c]) * DotGame.FOG.offset;
    next[move.b.r][move.b.c] = second + fogDepth(grid[move.b.r][move.b.c]) * DotGame.FOG.offset;
    assign(mixed, occupied.filter(p => !equal(p, move.a) && !equal(p, move.b)));
    return next;
  }
  function createBoard(level, rng = Math.random) {
    if (level.id >= 90 && level.clocks?.plus) throw new Error('第 90 關起只能配置減時寶石。');
    const palette = shuffle(DotGame.GEMS.slice(0, level.poolSize).map(g => g.id), rng).slice(0, level.colors);
    const ppaPairs = level.ppaPairs || 0, ordinaryPairs = level.tiles / 2 - ppaPairs;
    if (!Number.isInteger(ppaPairs) || ppaPairs < 0 || !Number.isInteger(ordinaryPairs) || ordinaryPairs < level.colors)
      throw new Error('關卡必須保留完整 PPA 配對，以及每色至少一組普通寶石。');
    const values = [];
    for (let pair = 0; pair < ordinaryPairs; pair++) values.push(palette[pair % palette.length], palette[pair % palette.length]);
    for (let pair = 0; pair < ppaPairs; pair++) values.push(DotGame.PPA.id, DotGame.PPA.id);
    const mixed = shuffle(values, rng);
    let i = 0;
    const grid = Array.from({ length: level.rows + 2 }, () => Array(level.cols + 2).fill(0));
    level.layout.forEach((row, r) => [...row].forEach((cell, c) => {
      grid[r + 1][c + 1] = cell === '#' ? -1 : cell === 'X' ? mixed[i++] : 0;
    }));
    let ready = findMove(grid) ? grid : reshuffle(grid, rng);
    if (level.openingPair) ready = seedPair(ready, level.openingPair, palette[0]);
    if (level.bombPair) ready = seedPair(ready, level.bombPair, palette[1], stagePoints(level.openingPair));
    if (level.bombs) ready = addBombs(ready, level.bombs, rng, level);
    if (level.clocks) ready = addClocks(ready, level.clocks, rng, level);
    if (level.ice) ready = addIce(ready, level.ice, rng, level);
    if (level.fog) {
      const { row, col, rows, cols } = level.fog;
      if (![row, col, rows, cols].every(Number.isInteger) || row < 0 || col < 0 || rows < 1 || cols < 1 ||
        row + rows > level.rows || col + cols > level.cols) throw new Error('薄霧區域超出版型。');
      for (let r = row + 1; r <= row + rows; r++) for (let c = col + 1; c <= col + cols; c++) {
        if (ready[r][c] > 0) ready[r][c] += DotGame.FOG.layers * DotGame.FOG.offset;
      }
    }
    return { grid: ready, palette };
  }
  // 每次手動炸彈配對只抽全盤一對普通同色寶石，不受位置／路徑限制。
  // PPA 不入選；自動命中的標記不連鎖。沒有普通配對時才回傳空集合。
  function bombTargets(grid, rng = Math.random) {
    const pair = randomPair(grid, rng, true);
    return pair ? [pair] : [];
  }
  function addBombs(grid, count, rng, level = {}) {
    const clear = stagePoints(level.openingPair);
    const ordinary = cells(grid).filter(p => !isPPA(p.value) && !clear.some(q => equal(p,q)));
    if (!Number.isInteger(count) || count < 1 || count >= ordinary.length) throw new Error('炸彈標記數量不正確。');
    const ready = grid.map(row => row.slice());
    // 優先放在開局能手動配對的位置，額外目標可來自棋盤任何地方。
    const candidates = zoneOrder(shuffle(ordinary, rng), level.bombZone, level.bombZoneStrict, ready);
    if (candidates.length < count) throw new Error('炸彈區域無法容納指定數量。');
    const required = stagePoints(level.bombPair)[0];
    const starter = required ? candidates.find(p => equal(p,required)) : candidates.find(a => ordinary.some(b => findPath(ready, a, b))) || candidates[0];
    if (!starter) throw new Error('炸彈起手位置必須位於指定區域。');
    const marked = [starter, ...candidates.filter(p => !equal(p, starter)).slice(0, count - 1)];
    for (const p of marked) ready[p.r][p.c] += DotGame.BOMB.offset;
    return ready;
  }
  function randomPair(grid, rng = Math.random, includeFrozen = false) {
    const groups = new Map();
    cells(grid).filter(p => !isPPA(p.value) && (includeFrozen || !isFrozen(p.value))).forEach(p => {
      const color = baseValue(p.value);
      if (!groups.has(color)) groups.set(color, []); groups.get(color).push(p);
    });
    const eligible = [...groups.values()].filter(group => group.length >= 2);
    if (!eligible.length) return null;
    return shuffle(eligible[Math.floor(rng() * eligible.length)], rng).slice(0, 2);
  }
  const isPPA = value => clearClock(tileValue(value)) === DotGame.PPA.id;
  function addClocks(grid, config, rng, level = {}) {
    const plus = config.plus || 0, minus = config.minus || 0;
    if (minus > DotGame.CLOCK.maxMinusPairs * 2) throw new Error('減時寶石最多五對（十顆）。');
    const clear = stagePoints(level.openingPair);
    const ready = grid.map(row => row.slice()), ordinary = cells(ready).filter(p => !isPPA(p.value) && !isBomb(p.value) && !clear.some(q => equal(p,q)));
    if (![plus,minus].every(n => Number.isInteger(n) && n >= 0) || plus + minus < 1 || plus + minus >= ordinary.length)
      throw new Error('時鐘標記數量不正確，須保留一般寶石。');
    const candidates = zoneOrder(shuffle(ordinary, rng), level.clockZone, level.clockZoneStrict, ready);
    if (candidates.length < plus + minus) throw new Error('時鐘區域無法容納指定數量。');
    const starter = candidates.find(a => ordinary.some(b => findPath(ready, a, b))) || candidates[0];
    const marked = [starter, ...candidates.filter(p => !equal(p, starter))];
    marked.slice(0, plus + minus).forEach((p, i) => { ready[p.r][p.c] += (i < plus ? 1 : 2) * DotGame.CLOCK.offset; });
    return ready;
  }
  const neighbors = p => [{ r: p.r - 1, c: p.c }, { r: p.r + 1, c: p.c },
    { r: p.r, c: p.c - 1 }, { r: p.r, c: p.c + 1 }];
  function addIce(grid, count, rng, level = {}) {
    if (!Number.isInteger(count) || count < 1) throw new Error('冰封數量不正確。');
    const ready = grid.map(row => row.slice());
    const occupied = cells(ready);
    let first;
    for (const a of occupied.filter(p => isBomb(p.value))) {
      const b = occupied.find(b => findPath(ready, a, b));
      if (b) { first = { a, b }; break; }
    }
    first ||= findMove(ready);
    const protectedCells = [first.a, first.b, ...stagePoints(level.openingPair), ...stagePoints(level.bombPair)];
    // 冰塊彼此不相鄰，北／西各留一顆鄰牌，西北轉角不可是牆。
    // 任何鄰牌消除即破冰，冰層洗牌時固定。最上方冰塊的兩顆鄰牌
    // 必能經西北空角連線，或與仍在該角的普通牌連線，確保洗牌保底有解。
    const candidates = zoneOrder(shuffle(cells(ready).filter(p => !isPPA(p.value) && !isBomb(p.value) &&
      (!level.iceAvoidClocks || !clockType(p.value)) &&
      !protectedCells.some(q => equal(p, q)) && ready[p.r - 1]?.[p.c] > 0 &&
      ready[p.r]?.[p.c - 1] > 0 && ready[p.r - 1]?.[p.c - 1] >= 0), rng), level.iceZone, level.iceZoneStrict, ready);
    let added = 0;
    for (const p of candidates) {
      if (neighbors(p).some(q => isFrozen(ready[q.r]?.[q.c]))) continue;
      ready[p.r][p.c] += DotGame.ICE.offset;
      if (++added === count) return ready;
    }
    // 高密度冰封若隨機貪婪排列未放滿，改選棋盤同一奇偶色的安全候選格。
    // 同色格互不相鄰，仍保留北／西鄰牌、轉角及開局保護配對。
    if (count > 8) {
      const groups = [0, 1].map(parity => candidates.filter(p => (p.r + p.c) % 2 === parity));
      if (level.iceZone) groups.sort((a,b) => b.filter(p => inZone(p,level.iceZone,ready)).length - a.filter(p => inZone(p,level.iceZone,ready)).length);
      const safe = groups.find(group => group.length >= count);
      if (safe) {
        candidates.forEach(p => { ready[p.r][p.c] = grid[p.r][p.c]; });
        safe.slice(0, count).forEach(p => { ready[p.r][p.c] += DotGame.ICE.offset; });
        return ready;
      }
    }
    throw new Error('版型無法配置指定數量的安全冰封格。');
  }
  // 手動／特殊效果均以完整配對消除；相鄰冰層移除，薄霧每次配對減一層。
  // 同一格同時鄰接兩個端點也只揭露一次；直接命中則連霧與寶石一起清除。
  function removePair(grid, pair) {
    const timeDelta = pair.reduce((sum, p) => {
      const type = clockType(grid[p.r][p.c]);
      return sum + (type === 1 ? DotGame.CLOCK.ms : type === 2 ? -DotGame.CLOCK.ms : 0);
    }, 0);
    pair.forEach(p => { grid[p.r][p.c] = 0; });
    const thawed = [], revealed = [], seen = new Set();
    for (const p of pair) for (const q of neighbors(p)) {
      const key = `${q.r},${q.c}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (isFrozen(grid[q.r]?.[q.c])) { grid[q.r][q.c] = thawValue(grid[q.r][q.c]); thawed.push(q); }
      if (isFogged(grid[q.r]?.[q.c])) { grid[q.r][q.c] -= DotGame.FOG.offset; revealed.push(q); }
    }
    return { thawed, revealed, timeDelta };
  }
  // 初版強度：更新後的手動 Combo，最多五對；只隨機選目標。
  const ppaStrength = combo => Math.min(DotGame.PPA.maxPairs, Math.max(1, combo));
  function ppaTargets(grid, combo, rng = Math.random) {
    const copy = grid.map(row => row.slice()), pairs = [];
    for (let i = 0; i < ppaStrength(combo); i++) {
      const pair = randomPair(copy, rng, true);
      if (!pair) break;
      pairs.push(pair); pair.forEach(p => { copy[p.r][p.c] = 0; });
    }
    return pairs;
  }
  const stars = (remaining, total) => remaining <= 0 ? 0 : remaining / total > .5 ? 3 : remaining / total >= .25 ? 2 : 1;
  const nextCombo = (count, lastAt, now) => lastAt !== null && now - lastAt <= DotGame.COMBO_WINDOW_MS ? count + 1 : 1;
  return { equal, shuffle, cells, findPath, findMove, reshuffle, createBoard, randomPair,
    isPPA, isBomb, isFrozen, thawValue, tileValue, clockType, clearClock, isFogged, fogDepth, clearFog, baseValue, sameColor, removePair, bombTargets, ppaStrength, ppaTargets, stars, nextCombo };
})();
