/* 活動紀錄與待閱讀的通關介紹獨立儲存，不讀寫自由挑戰的 key。 */
DotGame.CampaignStorage = (() => {
  const { storageKey: KEY, stages } = DotGame.Campaign;
  let data = { records: {}, pending: null }, persistent = true;
  const valid = item => item && ['score','time','stars'].every(key => Number.isFinite(item[key])) &&
    item.score >= 0 && item.time >= 0 && Number.isInteger(item.stars) && item.stars >= 1 && item.stars <= 3;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    // 只接續連續完成的活動關卡；自由模式通關不會解鎖活動。
    for (const { id } of stages) {
      const item = saved?.records?.[id];
      if (!valid(item)) break;
      data.records[id] = { score: item.score, time: item.time, stars: item.stars };
    }
    const pending = saved?.pending;
    if (pending && stages.some(stage => stage.id === pending.id) && data.records[pending.id] && valid(pending) &&
        Number.isFinite(pending.remaining) && pending.remaining >= 0 &&
        Number.isFinite(pending.bonus) && pending.bonus >= 0) data.pending = { ...pending };
  } catch { persistent = false; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { persistent = false; } };
  const next = () => stages.find(stage => !data.records[stage.id])?.id || null;
  const canPlay = id => stages.some(stage => stage.id === id) && (id === next() || !!data.records[id]);
  function record(id, result) {
    if (!canPlay(id) || !valid(result)) return false;
    const old = data.records[id];
    data.records[id] = { score: Math.max(old?.score || 0, result.score), stars: Math.max(old?.stars || 0, result.stars), time: Math.min(old?.time ?? Infinity, result.time) };
    data.pending = { ...result, id }; save();
    return !old || result.score > old.score;
  }
  function acknowledge() { data.pending = null; save(); }
  return { get: () => data, next, canPlay, record, acknowledge, persistent: () => persistent };
})();
