/* 公司活動草案集中於此，方便後續審稿；不由遊戲規則推導產品功效。 */
DotGame.Campaign = {
  storageKey: 'ppa-campaign.v1',
  mascot: 'assets/ppa-jellyfish-pink-guide-v1.png',
  heroImage: 'assets/ppa-pink-guide-holding-product-v1.png',
  name: 'PPA 肌膚升級之旅',
  title: '完成三關挑戰，解鎖水母好禮！',
  intro: '跟著水母玩連連看，一起認識 PPA。',
  detail: '前三關解鎖購買優惠，接著挑戰百關加碼。',
  // 保留內部價格資料；優惠提案版不渲染價格、不產生優惠券。
  products: [{ size: '30 mL', price: 600 }, { size: '100 mL', price: 1800 }],
  website: 'https://www.012s.com.tw/products/ppa1-%E7%9A%AE%E8%86%9A%E5%95%8F%E9%A1%8C%E5%B0%88%E7%94%A8',
  stages: [
    { id: 1, title: DotGame.Stories.forLevel(1).display.title,
      paragraphs: [DotGame.Stories.forLevel(1).display.body],
      guide: '第一段挑戰完成！接下來，一起認識 PPA 的舒緩照護。', next: '繼續第二關' },
    { id: 2, title: DotGame.Stories.forLevel(2).display.title,
      paragraphs: [DotGame.Stories.forLevel(2).display.body],
      guide: '又完成一段挑戰！最後一關，認識從照護到日常的保養安排。', next: '前往第三關' },
    { id: 3, title: DotGame.Stories.forLevel(3).display.title,
      paragraphs: [DotGame.Stories.forLevel(3).display.body],
      guide: '三關挑戰完成！把遊戲裡認識的 PPA，帶進你的日常保養。', next: '查看獎勵' }
  ],
  offer: {
    title: 'PPA 買一瓶、送一瓶', extra: '另贈 2 個水母公仔',
    imageNote: '角色示意，實際款式依活動公告',
    rules: [
      '完成第 1～3 關，解鎖主要購買優惠；於購買時使用，每人限一次。',
      '買一瓶 PPA、送一瓶 PPA，另贈 2 個水母公仔。',
      '優惠於購買時兌換，並非無購買即可免費寄送贈品。',
      '買一次符合活動條件的 PPA，完成 50 個不同關卡額外贈 1 瓶 PPA＋1 個水母公仔；完成 100 關再額外贈 1 瓶＋1 個公仔，各階段最多一次，不必再購買。',
      '可先玩再買或先買再玩；通關與有效購買兩項條件齊備後，才具備加碼申領資格。',
      '50／100 關加碼合計 2 瓶 PPA＋2 個公仔；若使用主要優惠並領完加碼，含購買的 1 瓶，合計 PPA 4 瓶、公仔 4 個。',
      '贈送瓶規格、公仔款式、活動期間、領取期限、運費及寄送安排待公司公告。',
      '本頁尚未開放正式兌換；購買驗證、每人一次核銷及出貨待官網服務串接，並未核發優惠或寄出贈品。'
    ]
  }
};
