/* 依內容 ID 保存人工語意斷點；驗證原文，避免換稿後沿用錯誤位置。 */
const breaks = require('./story-line-breaks.json');

module.exports = function storyLayout(contentId, body) {
  const layout = breaks[contentId];
  if (!layout || !layout.after) throw Error(`內容 ${contentId} 缺少分行設定。`);
  const prefixes = [layout.after, ...(layout.compactAfter ? [layout.compactAfter] : [])];
  if (layout.compactAfter && ![280,300].includes(layout.compactBelow)) throw Error(`內容 ${contentId} 的窄版寬度無效。`);
  const lineBreaks = prefixes.map(prefix => {
    if (!prefix || !body.startsWith(prefix) || prefix.length >= body.length) {
      throw Error(`內容 ${contentId} 的分行設定與顯示稿不符，請更新 tools/story-line-breaks.json。`);
    }
    return prefix.length;
  });
  return {lineBreaks, ...(layout.compactAfter ? {compactBelow:layout.compactBelow} : {})};
};
