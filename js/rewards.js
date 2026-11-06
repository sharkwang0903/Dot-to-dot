/* 正式服務邊界：不從 localStorage、網址或表單接受購買／核銷證明。 */
DotGame.Rewards = (() => {
  let adapter = null, generation = 0, snapshot = {purchase:'none',claims:{}}, error = '';
  const inFlight = new Map();
  const normalize = value => {
    if (!value || !['none','pending','verified'].includes(value.purchase)) throw Error('無法確認購買狀態，請稍後重試。');
    const claims = {};
    for (const tier of [3,50,100]) {
      const status = value.claims?.[tier] || 'none';
      if (!['none','claimed','shipped'].includes(status)) throw Error('領取狀態尚無法確認。');
      claims[tier] = status;
    }
    return {purchase:value.purchase,claims};
  };
  // 僅供日後正式 bootstrap 安裝同一會員／訂單服務；目前頁面不安裝 adapter。
  function connect(service) {
    if (!service || typeof service.getStatus !== 'function' || typeof service.claim !== 'function') throw Error('獎勵服務介面不完整。');
    adapter = service; generation++; snapshot = {purchase:'none',claims:{}}; error=''; inFlight.clear();
  }
  async function refresh() {
    if (!adapter) return;
    if (inFlight.size) await Promise.allSettled([...inFlight.values()]);
    const token = ++generation;
    // 查詢未完成前撤回舊的可申領資格，避免退款／取消後沿用舊購買狀態。
    snapshot = {purchase:'pending',claims:{}}; error='';
    try { const data = normalize(await adapter.getStatus()); if (token === generation) snapshot = data; }
    catch (e) { if (token === generation) { snapshot={purchase:'pending',claims:{}}; error='目前無法確認購買與領取狀態，請稍後重試。'; } }
  }
  function status(tier) {
    const reached = DotGame.Journey.reached(tier), claim = snapshot.claims[tier] || 'none';
    let label, state;
    if (claim === 'shipped') { state='shipped'; label='已出貨'; }
    else if (claim === 'claimed') { state='claimed'; label=tier===3?'主要優惠已兌換':'已申領，待出貨'; }
    else if (!reached) { state='locked'; label=tier===3?'完成第 1～3 關後解鎖':`完成 ${tier} 個不同關卡後達成`; }
    else if (tier===3) { state='offer'; label='已解鎖購買優惠，於購買時使用'; }
    else if (snapshot.purchase==='verified' && adapter) { state='eligible'; label='購買已驗證，可申領'; }
    else { state='awaiting-purchase'; label=`${tier} 關已達成，${snapshot.purchase==='pending'?'購買待驗證，驗證後可申領':'完成購買驗證後可申領'}`; }
    return {tier,reached,state,label,purchase:snapshot.purchase,claim,canClaim:!!adapter&&reached&&tier!==3&&snapshot.purchase==='verified'&&claim==='none'&&inFlight.size===0,busy:inFlight.has(tier)};
  }
  function claim(tier) {
    if (inFlight.has(tier)) return inFlight.get(tier);
    if (!status(tier).canClaim) return Promise.resolve(false);
    const service = adapter, token = generation;
    const task = Promise.resolve().then(async()=>{
      try {
        // 每人一次、購買有效性、門檻與重送冪等由伺服器驗證；本機完成數不作證明。
        const data = normalize(await service.claim({tier}));
        if (token===generation) { snapshot=data; error=''; }
        return token===generation && ['claimed','shipped'].includes(data.claims[tier]);
      } catch { if(token===generation) error='申領結果尚未確認，請重新整理狀態後重試。'; return false; }
      finally { if(inFlight.get(tier)===task) inFlight.delete(tier); }
    });
    inFlight.set(tier,task); return task;
  }
  return {connect,refresh,claim,status,available:()=>!!adapter,purchase:()=>snapshot.purchase,error:()=>error};
})();
