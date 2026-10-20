/* 本機進度與偏好。瀏覽器禁止儲存時，仍可繼續玩。 */
DotGame.Storage = (() => {
  const KEY = 'dot-to-dot.v1';
  const levelCount = DotGame.LEVELS.length;
  const fresh = () => ({ unlocked: 1, records: {}, sound: true });
  let data = fresh(), persistent = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved === 'object') {
      data.unlocked = Math.max(1, Math.min(levelCount, Math.floor(Number(saved.unlocked) || 1)));
      data.sound = saved.sound !== false;
      for (let id = 1; id <= levelCount; id++) {
        const item = saved.records?.[id];
        if (item && Number.isFinite(item.score) && Number.isFinite(item.time) && Number.isFinite(item.stars)) {
          data.records[id] = { score: Math.max(0, item.score), time: Math.max(0, item.time), stars: Math.max(1, Math.min(3, Math.floor(item.stars))) };
          // 舊版最後一關已通關時，自動銜接新增的下一關。
          data.unlocked = Math.max(data.unlocked, Math.min(levelCount, id + 1));
        }
      }
    }
  } catch { persistent = false; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { persistent = false; } }
  function record(id, result) {
    const old = data.records[id];
    data.records[id] = {
      stars: Math.max(old?.stars || 0, result.stars),
      score: Math.max(old?.score || 0, result.score),
      time: Math.min(old?.time ?? Infinity, result.time)
    };
    data.unlocked = Math.max(data.unlocked, Math.min(levelCount, id + 1));
    save();
    return !old || result.score > old.score;
  }
  return { get: () => data, record, sound(value) { data.sound = value; save(); }, persistent: () => persistent };
})();
