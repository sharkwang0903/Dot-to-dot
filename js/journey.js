/* 百關首次完成資格；分數仍各自留在原模式。此本機進度不作正式領獎證明。 */
DotGame.Journey = (() => {
  const KEY = 'ppa-journey.v1', completed = new Set(), seen = new Set();
  let persistent = true;
  const validId = id => Number.isInteger(id) && id >= 1 && id <= DotGame.LEVELS.length;
  const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { persistent = false; return null; } };
  const saved = read(KEY);
  for (const id of Array.isArray(saved?.completed) ? saved.completed : []) if (validId(id)) completed.add(id);
  for (const id of Array.isArray(saved?.milestonesSeen) ? saved.milestonesSeen : []) if ([50,100].includes(id)) seen.add(id);
  const validRecord = item => item && Number.isFinite(item.score) && item.score >= 0 && Number.isFinite(item.time) && item.time >= 0 &&
    Number.isInteger(item.stars) && item.stars >= 1 && item.stars <= 3;
  // 解鎖數字不當作通關證據；只讀有成功星級與有效紀錄的關卡。
  for (const [key, limit] of [['dot-to-dot.v1',100],['ppa-campaign.v1',3]]) {
    const old = read(key);
    for (let id = 1; id <= limit; id++) if (validRecord(old?.records?.[id])) completed.add(id);
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({completed:[...completed].sort((a,b)=>a-b),milestonesSeen:[...seen]})); } catch { persistent = false; } };
  const syncUnlock = () => { if (completed.size) DotGame.Storage.unlock(Math.min(100,Math.max(...completed) + 1)); };
  function complete(id) { if (!validId(id)) return false; const fresh = !completed.has(id); completed.add(id); syncUnlock(); save(); return fresh; }
  function milestones() {
    const notices = [50,100].filter(n=>completed.size>=n&&!seen.has(n));
    for (const n of notices) seen.add(n);
    if (notices.length) save();
    return notices;
  }
  const reached = tier => tier === 3 ? [1,2,3].every(id=>completed.has(id)) : [50,100].includes(tier)&&completed.size>=tier;
  const nextThreshold = () => !reached(3) ? {tier:3,remaining:[1,2,3].filter(id=>!completed.has(id)).length} :
    completed.size < 50 ? {tier:50,remaining:50-completed.size} : completed.size < 100 ? {tier:100,remaining:100-completed.size} : null;
  syncUnlock(); save();
  return {complete,has:id=>completed.has(id),ids:()=>[...completed].sort((a,b)=>a-b),count:()=>completed.size,reached,nextThreshold,milestones,persistent:()=>persistent};
})();
