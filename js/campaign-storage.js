/* 活動分數與待閱讀介紹獨立儲存；首次通關資格透過 Journey 共用。 */
DotGame.CampaignStorage = (() => {
  const { storageKey: KEY, stages } = DotGame.Campaign;
  let data = { records: {}, pending: null }, persistent = true;
  const valid = item => item && ['score','time','stars'].every(key => Number.isFinite(item[key])) &&
    item.score >= 0 && item.time >= 0 && Number.isInteger(item.stars) && item.stars >= 1 && item.stars <= 3;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    // 保留每一筆有效通關紀錄；共用資格由 Journey 去重，分數仍獨立。
    for (const { id } of stages) {
      const item = saved?.records?.[id];
      if (!valid(item)) continue;
      data.records[id] = { score: item.score, time: item.time, stars: item.stars };
    }
    const pending = saved?.pending;
    if (pending && stages.some(stage => stage.id === pending.id) && data.records[pending.id] && valid(pending) &&
        Number.isFinite(pending.remaining) && pending.remaining >= 0 &&
        Number.isFinite(pending.bonus) && pending.bonus >= 0) data.pending = { ...pending };
  } catch { persistent = false; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { persistent = false; } };
  const next = () => stages.find(stage => !data.records[stage.id] && !DotGame.Journey?.has(stage.id))?.id || null;
  const canPlay = id => stages.some(stage => stage.id === id) && (id === next() || !!data.records[id] || !!DotGame.Journey?.has(id));
  function record(id, result) {
    if (!canPlay(id) || !valid(result)) return false;
    const old = data.records[id];
    data.records[id] = { score: Math.max(old?.score || 0, result.score), stars: Math.max(old?.stars || 0, result.stars), time: Math.min(old?.time ?? Infinity, result.time) };
    data.pending = { ...result, id }; save();
    DotGame.Journey?.complete(id);
    return !old || result.score > old.score;
  }
  function acknowledge() { data.pending = null; save(); }
  return { get: () => data, next, canPlay, record, acknowledge, persistent: () => persistent };
})();
