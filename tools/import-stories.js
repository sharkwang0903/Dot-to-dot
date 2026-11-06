/* 一次性內容匯入工具：只讀外部來源，產出遊戲模組與完整對照表。 */
const fs = require('node:fs'), path = require('node:path');
const source = process.argv[2];
if (!source) throw Error('請提供百題 Markdown 來源路徑。');
const text = fs.readFileSync(source, 'utf8');
const entries = [...text.matchAll(/^\| (\d{2,3}) \| ([^|]+) \| ([^|]+) \|\s*$/gm)].map(m => ({contentId:Number(m[1]), title:m[2].trim(), body:m[3].trim()}));
if (entries.length !== 100 || new Set(entries.map(e=>e.contentId)).size !== 100) throw Error('來源必須包含 100 個不同 ID。');
const fallbacks = [
  ['局部乾燥，少量補足','使用 PPA 照顧局部乾燥時，可先薄塗，再依柔潤與舒適感調整用量。'],
  ['指節保養，輕柔塗開','在乾燥的完整指節皮膚上，將 PPA 輕柔塗勻，不必反覆用力按摩。'],
  ['衣物接觸，也照顧膚觸','PPA 可納入乾燥部位的柔潤保養，同時留意衣料與反覆摩擦。'],
  ['洗後保養，接續柔潤','完成清潔並輕按多餘水分後，可在需要的完整皮膚上均勻塗開 PPA。'],
  ['把舒適感放進日常','依需要使用 PPA，觀察乾澀、緊繃與塗抹後的膚觸，找到合適的保養節奏。']
];
const contents = entries.map(e => {
  const candidate = e.contentId >= 91 && e.contentId <= 95;
  return {...e, category:e.contentId>=3&&e.contentId<=5?'ingredients':'daily-care',
    reviewStatus:candidate?'candidate-awaiting-company':'company-review-draft',
    sourceDraft:{title:e.title,body:e.body},
    display:candidate?{title:fallbacks[e.contentId-91][0],body:fallbacks[e.contentId-91][1],status:'authorized-neutral-fallback'}:{title:e.title,body:e.body,status:'source-draft'}};
});
// 身體部位、環境、使用方式與其他日常主題交錯；前三篇與最後一篇固定。
const groups = [entries.filter(e=>e.contentId>=31&&e.contentId<=50),entries.filter(e=>e.contentId>=51&&e.contentId<=70),
  entries.filter(e=>e.contentId>=71&&e.contentId<=80),entries.filter(e=>e.contentId<=30||e.contentId>=81)]
  .map(g=>g.map(e=>e.contentId).filter(id=>![11,9,86,100].includes(id)));
const mapping=[11,9,86];
while (groups.some(g=>g.length)) for (const g of groups) if(g.length) mapping.push(g.shift());
mapping.push(100);
const data={source:{file:path.basename(source),date:'2026-11-06',note:'公司審閱稿；91～95 保留候選原稿，玩家使用交接指定中性備案。'},mapping,contents};
fs.writeFileSync(path.join(__dirname,'../js/stories.js'),'/* 由 tools/import-stories.js 匯入；審稿資料不直接渲染給玩家。 */\nDotGame.Stories = (() => {\n  const data = '+JSON.stringify(data,null,2)+';\n  return { ...data, forLevel(id) { return data.contents.find(item => item.contentId === data.mapping[id - 1]); } };\n})();\n');
fs.writeFileSync(path.join(__dirname,'../docs/關卡與內容對照表.md'),'# 百關通關介紹對照表\n\n來源：`'+path.basename(source)+'`。內容 ID 各使用一次；審稿狀態僅供內部追溯，不顯示於玩家畫面。\n\n| 關卡 | 內容 ID | 顯示標題 | 稿件狀態 |\n| --- | --- | --- | --- |\n'+mapping.map((id,i)=>{const e=contents.find(e=>e.contentId===id);return `| ${i+1} | ${String(id).padStart(2,'0')} | ${e.display.title} | ${e.reviewStatus}${id>=91&&id<=95?'；顯示中性備案':''} |`;}).join('\n')+'\n');
console.log('已匯入 100 則內容與 100 關完整對照表。');
