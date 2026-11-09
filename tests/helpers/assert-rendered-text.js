/* 渲染輸出檢查：避免普通字串中的模板變數直接出現在玩家介面。 */
const assert = require('node:assert/strict');
module.exports = function assertRenderedText(value, label) {
  assert.doesNotMatch(String(value), /\$\{/, `${label} 不得顯示未替換的模板變數`);
};
