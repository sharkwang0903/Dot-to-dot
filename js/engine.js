/* 純遊戲規則：不操作 DOM，也不依賴計時器，方便獨立驗證。 */
window.DotGame = window.DotGame || {};
DotGame.Engine = (() => {
  const equal = (a, b) => a.r === b.r && a.c === b.c;
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
    if (!geometryOnly && grid[a.r][a.c] !== grid[b.r][b.c]) return null;
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
    const occupied = cells(grid);
    for (let i = 0; i < occupied.length; i++) {
      for (let j = i + 1; j < occupied.length; j++) {
        if (!geometryOnly && occupied[i].value !== occupied[j].value) continue;
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
    const values = occupied.map(p => p.value);
    const assign = list => occupied.forEach((p, i) => { next[p.r][p.c] = list[i]; });
    for (let attempt = 0; attempt < 24; attempt++) {
      assign(shuffle(values, rng));
      if (findMove(next)) return next;
    }
    // 有限次隨機嘗試後，將同色一組放入確定能連線的兩格，避免無限洗牌。
    const move = findMove(next, true);
    if (!move) throw new Error('關卡版型沒有可連線的格子。');
    const paired = values.find(value => values.filter(v => v === value).length >= 2);
    if (!paired) throw new Error('寶石數量未成對。');
    const rest = values.slice();
    rest.splice(rest.indexOf(paired), 1); rest.splice(rest.indexOf(paired), 1);
    const mixed = shuffle(rest, rng);
    next[move.a.r][move.a.c] = paired; next[move.b.r][move.b.c] = paired;
    occupied.filter(p => !equal(p, move.a) && !equal(p, move.b)).forEach((p, i) => { next[p.r][p.c] = mixed[i]; });
    return next;
  }
  function createBoard(level, rng = Math.random) {
    const palette = shuffle(DotGame.GEMS.slice(0, level.poolSize).map(g => g.id), rng).slice(0, level.colors);
    const values = [];
    for (let pair = 0; pair < level.tiles / 2; pair++) values.push(palette[pair % palette.length], palette[pair % palette.length]);
    const mixed = shuffle(values, rng);
    let i = 0;
    const grid = Array.from({ length: level.rows + 2 }, () => Array(level.cols + 2).fill(0));
    level.layout.forEach((row, r) => [...row].forEach((cell, c) => {
      grid[r + 1][c + 1] = cell === '#' ? -1 : cell === 'X' ? mixed[i++] : 0;
    }));
    return { grid: findMove(grid) ? grid : reshuffle(grid, rng), palette };
  }
  function randomPair(grid, rng = Math.random) {
    const groups = new Map();
    cells(grid).forEach(p => { if (!groups.has(p.value)) groups.set(p.value, []); groups.get(p.value).push(p); });
    const eligible = [...groups.values()].filter(group => group.length >= 2);
    if (!eligible.length) return null;
    return shuffle(eligible[Math.floor(rng() * eligible.length)], rng).slice(0, 2);
  }
  const stars = (remaining, total) => remaining <= 0 ? 0 : remaining / total > .5 ? 3 : remaining / total >= .25 ? 2 : 1;
  const nextCombo = (count, lastAt, now) => lastAt !== null && now - lastAt <= 2000 ? count % 5 + 1 : 1;
  return { equal, shuffle, cells, findPath, findMove, reshuffle, createBoard, randomPair, stars, nextCombo };
})();
