/* 公司活動草案集中於此，方便後續審稿；不由遊戲規則推導產品功效。 */
DotGame.Campaign = {
  storageKey: 'ppa-campaign.v1',
  mascot: 'assets/ppa-jellyfish-pink-guide-v1.png',
  heroImage: 'assets/ppa-pink-guide-holding-product-v1.png',
  name: 'PPA 肌膚升級之旅',
  title: '完成三關挑戰，解鎖水母好禮！',
  intro: '跟著水母玩連連看，一起認識 PPA。',
  detail: '完成挑戰，取得官網購買優惠。',
  // 保留內部價格資料；優惠提案版不渲染價格、不產生優惠券。
  products: [{ size: '30 mL', price: 600 }, { size: '100 mL', price: 1800 }],
  website: 'https://www.012s.com.tw/products/ppa1-%E7%9A%AE%E8%86%9A%E5%95%8F%E9%A1%8C%E5%B0%88%E7%94%A8',
  stages: [
    { id: 1, title: '保濕潤膚，從日常開始',
      paragraphs: ['乾燥時需要照護，平常也值得好好保養。', 'PPA 主打保濕潤膚，為肌膚補上日常滋潤。從臉部到身體，把保養放進每天的生活節奏。'],
      guide: '第一段挑戰完成！接下來，一起認識 PPA 的舒緩照護。', next: '繼續第二關' },
    { id: 2, title: '止癢舒緩，照顧敏感不適',
      paragraphs: ['乾燥、搔癢與敏感不適，都是讓人在意的肌膚困擾。', 'PPA 主打止癢舒緩與抗過敏，從有需要時的局部照護開始，讓肌膚保養多一份選擇。'],
      guide: '又完成一段挑戰！最後一關，認識從照護到日常的保養安排。', next: '前往第三關' },
    { id: 3, title: '肌膚修護，讓保養更完整',
      paragraphs: ['保養可以從在意的局部開始，也可以成為每天的習慣。', 'PPA 結合保濕潤膚與肌膚修護，從乾燥、搔癢與敏感不適時的局部照護，延伸到每天的臉部與身體保養。'],
      guide: '三關挑戰完成！把遊戲裡認識的 PPA，帶進你的日常保養。', next: '查看獎勵' }
  ],
  offer: {
    title: 'PPA 30 mL 買一送一', extra: '再加贈兩個水母公仔',
    imageNote: '角色示意，實際款式依活動公告',
    rules: [
      '完成活動三關，解鎖 PPA 30 mL 購買優惠提案。',
      '買一瓶 30 mL，送同規格一瓶，共兩瓶；再加贈兩個水母公仔。',
      '優惠於購買時兌換，並非無購買即可免費寄送贈品。',
      '提案每人限兌換一次；公仔款式與活動期間待公告。',
      '此為優惠方案展示，實際兌換方式與活動期間待公告。目前尚未真實核發優惠或串接官網。'
    ],
    handoff: '目前為方案展示，官網優惠尚未串接；可先前往查看商品'
  },
  complete: { title: '挑戰完成，好禮解鎖！', intro: '你已完成 PPA 三關挑戰！',
    description: '一瓶自用，一瓶分享，還有兩位水母夥伴陪你帶回家。',
    redemption: '前往官網購買並使用活動優惠，即可兌換。' }
};
