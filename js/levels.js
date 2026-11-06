/* 關卡與像素寶石資料。X = 寶石、# = 牆、. = 留白。 */
window.DotGame = window.DotGame || {};
DotGame.COMBO_WINDOW_MS = 5000;
DotGame.GEMS = [
  { id: 1, name: '紅', color: '#f46b87', light: '#ffc0c9', dark: '#9b345d', mark: 'cross' },
  { id: 2, name: '藍', color: '#60aff4', light: '#c0e5ff', dark: '#3463ac', mark: 'bar' },
  { id: 3, name: '黃', color: '#f2ca66', light: '#fff2b5', dark: '#a7792d', mark: 'dot' },
  { id: 4, name: '綠', color: '#7bd6aa', light: '#caffdf', dark: '#3a8e72', mark: 'diagonal' },
  { id: 5, name: '黑', color: '#929aaa', light: '#dce2ed', dark: '#4e546e', mark: 'square' },
  { id: 6, name: '白', color: '#e3e7e2', light: '#ffffff', dark: '#949fb4', mark: 'diamond' },
  { id: 7, name: '紫', color: '#b59aee', light: '#e9d9ff', dark: '#7452ae', mark: 'twins' },
  { id: 8, name: '橘', color: '#f49755', light: '#ffd2a3', dark: '#b65c35', mark: 'chevron' },
  { id: 9, name: '青', color: '#51d4da', light: '#c1ffff', dark: '#258996', mark: 'equals' },
  { id: 10, name: '玫紅', color: '#df65c5', light: '#ffd1f3', dark: '#943d85', mark: 'heart' },
  { id: 11, name: '萊姆', color: '#b6da48', light: '#eeffa9', dark: '#738e2d', mark: 'leaf' },
  { id: 12, name: '靛', color: '#7477dd', light: '#d1d0ff', dark: '#434b9b', mark: 'moon' },
  { id: 13, name: '琥珀', color: '#bc884b', light: '#f8ddb2', dark: '#80522f', mark: 'crown' },
  { id: 14, name: '孔雀', color: '#299d8a', light: '#a5f4dc', dark: '#176052', mark: 'hourglass' },
  { id: 15, name: '珊瑚', color: '#eb927f', light: '#ffe0cd', dark: '#a55650', mark: 'spark' }
];
// PPA 不屬於十五色寶石集合；正值 ID 讓它沿用相同的連線與洗牌規則。
DotGame.PPA = { id: 100, maxPairs: 5, pairScore: 100 };
// 標記附在普通寶石上，顏色／配對身分不變；不占用額外牌位。
DotGame.BOMB = { offset: 200, pairScore: 100 };
DotGame.ICE = { offset: 400 };
DotGame.FOG = { offset: 1000, layers: 2 };
DotGame.CLOCK = { offset: 10000, ms: 3000, maxMinusPairs: 5 };
DotGame.LEVELS = [
  { id: 1, colors: 7, seconds: 90, layout: ['XXXXXX','XXXXXX','XXXXXX','XXXXXX','XXXXXX'] },
  { id: 2, colors: 7, seconds: 120, layout: ['.XXXXXX.','XXXXXXXX','XXXXXXXX','XXXXXXXX','XXXXXXXX','.XXXXXX.'] },
  { id: 3, colors: 8, seconds: 135, layout: ['..XXXX..','.XXXXXX.','XXXXXXXX','XXX..XXX','XXX..XXX','XXXXXXXX','.XXXXXX.','..XXXX..'] },
  { id: 4, colors: 7, seconds: 140, layout: ['XXXXXXXX','XXXXXXXX','XXX##XXX','XXX##XXX','XXXXXXXX','XXXXXXXX'] },
  { id: 5, colors: 8, seconds: 165, layout: ['.XXXXXX.','XXXXXXXX','XXXXXXXX','X##XX##X','XXXXXXXX','XXXXXXXX','XXXXXXXX','.XXXXXX.'] },
  { id: 6, colors: 8, seconds: 180, layout: ['..XXXXXX..','XXXXXXXXXX','XXXX##XXXX','XXXX##XXXX','XXXX##XXXX','XXXX##XXXX','XXXXXXXXXX','..XXXXXX..'] },
  { id: 7, colors: 9, seconds: 195, layout: ['.XXXXXXXX.','XXXXXXXXXX','XX......XX','XXXXXXXXXX','X##X##X##X','XXXXXXXXXX','XXXXXXXXXX','.XXXXXXXX.'] },
  { id: 8, colors: 9, seconds: 210, layout: ['XXXXXXXXXX','XXXXXXXXXX','XXXXXXXXXX','XX######XX','XXXXXXXXXX','XXXXXXXXXX','XXXXXXXXXX','XXXXXXXXXX'] },
  // 第 9～14 關每關擴充一種可抽選寶石；版型中的空白可通行，牆不可通行。
  { id: 9, colors: 10, poolSize: 10, seconds: 210, layout: [
    'XXXXX..XXXXX','XXXXX..XXXXX','XXXXX..XXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXX..XXXXX','XXXXX..XXXXX','XXXXX..XXXXX'] },
  { id: 10, colors: 10, poolSize: 11, seconds: 200, layout: [
    'XXXXX..XXXXX','XXXXX..XXXXX','XXXXX..XXXXX','XXXXX..XXXXX','..########..',
    '..########..','XXXXX..XXXXX','XXXXX..XXXXX','XXXXX..XXXXX','XXXXX..XXXXX'] },
  { id: 11, colors: 11, poolSize: 12, seconds: 205, layout: [
    '.XXXX..XXXX.','XXXXX..XXXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXX######XXX',
    'XXXXXXXXXXXX','XXXXX..XXXXX','XXXXX..XXXXX','.XXXX..XXXX.'] },
  { id: 12, colors: 12, poolSize: 13, seconds: 205, layout: [
    'XXXXXXXXXXXX','XXXX....XXXX','XXXX.##.XXXX','XXXX.##.XXXX','XXXX.##.XXXX',
    'XXXX.##.XXXX','XXXX.##.XXXX','XXXX.##.XXXX','XXXX....XXXX','XXXXXXXXXXXX'] },
  { id: 13, colors: 12, poolSize: 14, seconds: 210, layout: [
    'XXXX.XX.XXXX','XXXX.XX.XXXX','XXXXXXXXXXXX','XX##XXXX##XX','............',
    'XXXXXXXXXXXX','XXXX.XX.XXXX','XXXX.XX.XXXX','XXXXXXXXXXXX','XXXXXXXXXXXX'] },
  { id: 14, colors: 13, poolSize: 15, seconds: 205, layout: [
    'XXXXXX..XXXX','XXXXXX..XXXX','XXXXXX..XXXX','XXXXXX..XXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXX..XXXXXX','XXXX..XXXXXX','XXXX..XXXXXX','XXXX..XXXXXX'] },
  { id: 15, colors: 14, poolSize: 15, seconds: 190, layout: [
    'XXXXXX.XXXXX','XXXXXX.XXXXX','XXXXXX.XXXXX','XXXXXX.XXXXX','X##########X',
    '............','XXXXX.XXXXXX','XXXXX.XXXXXX','XXXXX.XXXXXX','XXXXX.XXXXXX'] },
  { id: 16, colors: 15, poolSize: 15, seconds: 210, layout: [
    'XXXXXXXXXXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','X###X##X###X',
    '..XX....XX..','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXXXXXXXXXX'] },
  // 第 17～40 關交錯安排大小盤面；沿用十五色集合與既有規則，不逐關加壓。
  // 花窗、雙翼、階梯與分島等輪廓只使用寶石、留白與牆壁。
  { id: 17, colors: 7, poolSize: 15, seconds: 140, layout: [
    '..XXXX..','.XXXXXX.','XXXXXXXX','XXX##XXX',
    'XXX##XXX','XXXXXXXX','.XXXXXX.','..XXXX..'] },
  { id: 18, colors: 10, poolSize: 15, seconds: 190, layout: [
    'XXXX..XXXX','XXXXX.XXXX','XXXXXXXXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXXXXXXXX','XXXX.XXXXX','XXXX..XXXX'] },
  { id: 19, colors: 11, poolSize: 15, seconds: 205, layout: [
    'XXXXX..XXXXX','XXXXX..XXXXX','XXXXX..XXXXX','............','..########..',
    '..########..','............','XXXXX..XXXXX','XXXXX..XXXXX','XXXXX..XXXXX'] },
  { id: 20, bombs: 2, colors: 8, poolSize: 15, seconds: 155, layout: [
    'XXXXXXXXXX','.XXXXXXXX.','..XXXXXX..','..XX##XX..',
    '..XX##XX..','..XXXXXX..','.XXXXXXXX.','XXXXXXXXXX'] },
  { id: 21, bombs: 2, colors: 12, poolSize: 15, seconds: 210, layout: [
    '..XXXXXXXX..','.XXXXXXXXXX.','XXXXXXXXXXXX','XXXXX##XXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXX##XXXXX','XXXXXXXXXXXX','.XXXXXXXXXX.','..XXXXXXXX..'] },
  { id: 22, colors: 7, poolSize: 15, seconds: 135, layout: [
    'XXX..XXX','XXXXXXXX','XXX##XXX','XXX##XXX','XXXXXXXX','XXX..XXX'] },
  { id: 23, bombs: 3, colors: 9, poolSize: 15, seconds: 180, layout: [
    'XXXXXXXXXX','XXXX..XXXX','XXX....XXX','XXX.##.XXX',
    'XXX.##.XXX','XXX....XXX','XXXX..XXXX','XXXXXXXXXX'] },
  { id: 24, bombs: 3, colors: 12, poolSize: 15, seconds: 205, layout: [
    'XXXX....XXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXX######XXX',
    '............','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXXX..XXXXX','XXXX....XXXX'] },
  { id: 25, colors: 8, poolSize: 15, seconds: 150, layout: [
    'XXXXXX..','XXXXXXX.','XXXXXXXX','XXX##XXX',
    'XXX##XXX','XXXXXXXX','.XXXXXXX','..XXXXXX'] },
  { id: 26, bombs: 2, colors: 10, poolSize: 15, seconds: 195, layout: [
    'XXXX..XXXX','XXXX..XXXX','XXXXXXXXXX','XX######XX',
    '..........','XXXXXXXXXX','XXXX..XXXX','XXXX..XXXX'] },
  { id: 27, bombs: 4, colors: 13, poolSize: 15, seconds: 210, layout: [
    'XXXXXXXXXXXX','XXXXXXXXXXXX','XXX..XX..XXX','XXX..XX..XXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXX..XX..XXX','XXX..XX..XXX','XXXXXXXXXXXX','XXXXXXXXXXXX'] },
  { id: 28, bombs: 2, colors: 8, poolSize: 15, seconds: 155, layout: [
    '..XXXXXX..','.XXXXXXXX.','XXXXXXXXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXXXXXXXX','.XXXXXXXX.','..XXXXXX..'] },
  { id: 29, colors: 11, poolSize: 15, seconds: 200, layout: [
    'XXXXX..XXXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXX..XXXXX','XXXXX..XXXXX'] },
  { id: 30, bombs: 2, colors: 7, poolSize: 15, seconds: 140, layout: [
    'XXXXXXXX','XX....XX','XXXXXXXX','XXX##XXX',
    'XXX##XXX','XXXXXXXX','XX....XX','XXXXXXXX'] },
  { id: 31, bombs: 3, colors: 10, poolSize: 15, seconds: 190, layout: [
    'XXX....XXX','XXXX..XXXX','XXXXXXXXXX','XXXXXXXXXX',
    'XX######XX','XXXXXXXXXX','XXXX..XXXX','XXX....XXX'] },
  { id: 32, bombs: 4, colors: 14, poolSize: 15, seconds: 210, layout: [
    'XXXXXXXXXXXX','XXXX.XX.XXXX','XXXX.XX.XXXX','XXXXXXXXXXXX','XX########XX',
    '............','XXXXXXXXXXXX','XXXX.XX.XXXX','XXXX.XX.XXXX','XXXXXXXXXXXX'] },
  { id: 33, colors: 8, poolSize: 15, seconds: 145, layout: [
    '.XXXXXX.','XXXXXXXX','XXXXXXXX','XX####XX','XXXXXXXX','.XXXXXX.'] },
  { id: 34, bombs: 3, colors: 11, poolSize: 15, seconds: 200, layout: [
    'XXXXXX..XXXX','XXXXXX..XXXX','XXXXXXXXXXXX','XXXX....XXXX',
    'XXXX####XXXX','XXXXXXXXXXXX','XXXX..XXXXXX','XXXX..XXXXXX'] },
  { id: 35, bombs: 2, colors: 9, poolSize: 15, seconds: 180, layout: [
    'XXXXXXXXXX','XXX....XXX','XXXXXXXXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXXXXXXXX','XXX....XXX','XXXXXXXXXX'] },
  { id: 36, bombs: 4, colors: 12, poolSize: 15, seconds: 205, layout: [
    'XXXX....XXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXX....XXXX'] },
  { id: 37, colors: 7, poolSize: 15, seconds: 140, layout: [
    'XX....XX','XXX..XXX','XXXXXXXX','XXX##XXX',
    'XXX##XXX','XXXXXXXX','XXX..XXX','XX....XX'] },
  { id: 38, bombs: 3, colors: 10, poolSize: 15, seconds: 190, layout: [
    'XXXXXXXXXX','XXXX..XXXX','XXXXXXXXXX','XX######XX',
    'XX......XX','XXXXXXXXXX','XXXX..XXXX','XXXXXXXXXX'] },
  { id: 39, bombs: 4, colors: 13, poolSize: 15, seconds: 210, layout: [
    'XXXXXX..XXXX','XXXXXX..XXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXX####XXXX',
    '............','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXX..XXXXXX','XXXX..XXXXXX'] },
  { id: 40, ice: 8, colors: 10, poolSize: 15, seconds: 195, layout: [
    '...XXXXXX...','..XXXXXXXX..','.XXXXXXXXXX.','XXXXXXXXXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXXXXXXXXX','.XXXXXXXXXX.','..XXXXXXXX..','...XXXXXX...'] },
  // 第 41～59 關沿用炸彈／冰封，自由搭配；一般寶石與 PPA 每關都有。
  { id: 41, ice: 6, colors: 9, poolSize: 15, seconds: 185, layout: [
    '.XXXXXXXX.','XXXXXXXXXX','XXX....XXX','XXXX##XXXX',
    'XXXX##XXXX','XXX....XXX','XXXXXXXXXX','.XXXXXXXX.'] },
  { id: 42, bombs: 2, ice: 6, colors: 11, poolSize: 15, seconds: 200, layout: [
    'XXXX....XXXX','XXXXXXXXXXXX','XXXXX..XXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXXX....XXXX'] },
  { id: 43, ice: 4, colors: 7, poolSize: 15, seconds: 150, layout: [
    '.XXXXXX.','.XXXXXX.','XXXXXXXX','XX####XX',
    'XXXXXXXX','XXXXXXXX','.XXXXXX.','.XXXXXX.'] },
  { id: 44, bombs: 3, colors: 9, poolSize: 15, seconds: 185, layout: [
    'XXXXXX....','XXXXXXXX..','XXXXXXXXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXXXXXXXX','..XXXXXXXX','....XXXXXX'] },
  { id: 45, bombs: 3, ice: 8, colors: 12, poolSize: 15, seconds: 210, layout: [
    '..XXXXXXXX..','XXXXXXXXXXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXXXXXXXXXX','..XXXXXXXX..'] },
  { id: 46, ice: 6, colors: 9, poolSize: 15, seconds: 185, layout: [
    'XXXXXXXXXX','XXXXX..XXX','XXXXX..XXX','XXXX##XXXX',
    'XXXX##XXXX','XXX..XXXXX','XXX..XXXXX','XXXXXXXXXX'] },
  { id: 47, colors: 7, poolSize: 15, seconds: 140, layout: [
    '.XXXXXX.','XXXXXXXX','XX####XX','XXXXXXXX','XXXXXXXX','.XXXXXX.'] },
  { id: 48, bombs: 2, ice: 6, colors: 10, poolSize: 15, seconds: 200, layout: [
    'XXXXX..XXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXX####XXXX',
    'XXXXXXXXXXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXX..XXXXX'] },
  { id: 49, ice: 8, colors: 12, poolSize: 15, seconds: 210, layout: [
    '.XXXXXXXXXX.','XXXXXXXXXXXX','XXXX....XXXX','XXXXX..XXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXX..XXXXX','XXXX....XXXX','XXXXXXXXXXXX','.XXXXXXXXXX.'] },
  { id: 50, bombs: 3, colors: 9, poolSize: 15, seconds: 180, layout: [
    'XXX....XXX','XXXXXXXXXX','XXXX..XXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXX..XXXX','XXXXXXXXXX','XXX....XXX'] },
  { id: 51, ice: 4, colors: 8, poolSize: 15, seconds: 160, layout: [
    'XXXXXXXX','.XXXXXX.','XXXXXXXX','XXX##XXX',
    'XXX##XXX','XXXXXXXX','.XXXXXX.','XXXXXXXX'] },
  { id: 52, bombs: 4, ice: 8, colors: 13, poolSize: 15, seconds: 210, layout: [
    'XXXXXXXXXXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXX..XXXXX','XXXXXXXXXXXX'] },
  { id: 53, ice: 6, colors: 9, poolSize: 15, seconds: 190, layout: [
    '..XXXXXX..','XXXXXXXXXX','XXX....XXX','XXXX##XXXX',
    'XXXX##XXXX','XXX....XXX','XXXXXXXXXX','..XXXXXX..'] },
  { id: 54, bombs: 2, ice: 4, colors: 8, poolSize: 15, seconds: 165, layout: [
    'XXXX..XX','XXXXXXXX','XXXXXXXX','XXX##XXX',
    'XXX##XXX','XXXXXXXX','XXXXXXXX','XX..XXXX'] },
  { id: 55, colors: 10, poolSize: 15, seconds: 195, layout: [
    'XXXXXXXXXXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXXXXXXXXXX'] },
  { id: 56, ice: 8, colors: 12, poolSize: 15, seconds: 210, layout: [
    'XXXXX..XXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXX..XXXXX'] },
  { id: 57, bombs: 3, colors: 9, poolSize: 15, seconds: 185, layout: [
    'XXXXXXXXXX','XX......XX','XXXXXXXXXX','XXX####XXX',
    'XXXXXXXXXX','XXXXXXXXXX','XX......XX','XXXXXXXXXX'] },
  { id: 58, ice: 6, colors: 9, poolSize: 15, seconds: 190, layout: [
    '.XXXXXXXX.','XXXXXXXXXX','XXXX..XXXX','XXX####XXX',
    'XXX....XXX','XXXX..XXXX','XXXXXXXXXX','.XXXXXXXX.'] },
  { id: 59, bombs: 4, ice: 8, colors: 12, poolSize: 15, seconds: 210, layout: [
    '..XXXXXXXX..','XXXXXXXXXXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXXXXXXXXXX','XXXXX..XXXXX','XXXXXXXXXXXX','..XXXXXXXX..'] },
  // 第 60 關僅薄霧；新機關首次出場不混搭舊機關，之後再自由組合。
  // fog 的 row／col 是內部版型零起算座標，只覆蓋區域內有寶石的格位。
  { id: 60, fog: { row: 1, col: 2, rows: 3, cols: 3 }, colors: 8, poolSize: 15, seconds: 180, layout: [
    '.XXXXXXXX.','XXXXXXXXXX','XXXXXXXXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXXXXXXXX','XXXXXXXXXX','.XXXXXXXX.'] },
  { id: 61, ice: 6, fog: { row: 3, col: 6, rows: 3, cols: 3 }, colors: 9, poolSize: 15, seconds: 195, layout: [
    'XXXX..XXXX','XXXXXXXXXX','XXXXX..XXX','XXXX##XXXX',
    'XXXX##XXXX','XXX..XXXXX','XXXXXXXXXX','XXXX..XXXX'] },
  { id: 62, bombs: 2, fog: { row: 1, col: 1, rows: 3, cols: 3 }, colors: 10, poolSize: 15, seconds: 200, layout: [
    '.XXXX..XXXX.','XXXXXXXXXXXX','XXXXX..XXXXX','XXXX####XXXX',
    'XXXXXXXXXXXX','XXXXX..XXXXX','XXXXXXXXXXXX','.XXXX..XXXX.'] },
  { id: 63, ice: 4, colors: 8, poolSize: 15, seconds: 165, layout: [
    'XXXXXX..','XXXXXXXX','XXXX..XX','XXX##XXX',
    'XXX##XXX','XX..XXXX','XXXXXXXX','..XXXXXX'] },
  { id: 64, fog: { row: 1, col: 2, rows: 2, cols: 3 }, colors: 7, poolSize: 15, seconds: 150, layout: [
    '..XXXX..','XXXXXXXX','XXXXXXXX','XXX##XXX',
    'XXX##XXX','XXXXXXXX','XXXXXXXX','..XXXX..'] },
  { id: 65, bombs: 3, ice: 8, fog: { row: 5, col: 1, rows: 3, cols: 3 }, colors: 12, poolSize: 15, seconds: 210, layout: [
    'XXXXXXXXXXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXX..XXXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXXXXXXXXXX'] },
  { id: 66, bombs: 3, colors: 9, poolSize: 15, seconds: 185, layout: [
    '..XXXXXX..','XXXXXXXXXX','XXXXXXXXXX','XXX####XXX',
    'XXX....XXX','XXXXXXXXXX','XXXXXXXXXX','..XXXXXX..'] },
  { id: 67, ice: 6, fog: { row: 2, col: 8, rows: 3, cols: 3 }, colors: 10, poolSize: 15, seconds: 200, layout: [
    'XXXX....XXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXXXXXXXXX','XXXXX..XXXXX','XXXX....XXXX'] },
  { id: 68, bombs: 2, fog: { row: 4, col: 1, rows: 3, cols: 3 }, colors: 9, poolSize: 15, seconds: 185, layout: [
    'XXXXXXXXXX','XXXX..XXXX','XXX....XXX','XXXX##XXXX',
    'XXXXXXXXXX','XXX....XXX','XXXX..XXXX','XXXXXXXXXX'] },
  { id: 69, colors: 7, poolSize: 15, seconds: 140, layout: [
    'XXXXXXXX','.XXXXXX.','XXX##XXX','XXX##XXX','.XXXXXX.','XXXXXXXX'] },
  { id: 70, fog: { row: 1, col: 6, rows: 3, cols: 3 }, colors: 9, poolSize: 15, seconds: 190, layout: [
    'XXX....XXX','XXXXXXXXXX','XXXXXXXXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXXXXXXXX','XXXXXXXXXX','XXX....XXX'] },
  { id: 71, bombs: 4, ice: 8, fog: { row: 6, col: 4, rows: 3, cols: 4 }, colors: 12, poolSize: 15, seconds: 210, layout: [
    'XXXXXXXXXXXX','XXXXX..XXXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXXX..XXXXX','XXXXXXXXXXXX'] },
  { id: 72, ice: 6, colors: 9, poolSize: 15, seconds: 190, layout: [
    '.XXXXXXXX.','XXXXXXXXXX','XXXXX..XXX','XXX####XXX',
    'XXXXXXXXXX','XXX..XXXXX','XXXXXXXXXX','.XXXXXXXX.'] },
  { id: 73, bombs: 2, fog: { row: 4, col: 4, rows: 2, cols: 3 }, colors: 8, poolSize: 15, seconds: 165, layout: [
    '.XXXXXX.','XXXXXXXX','XX..XXXX','XXX##XXX',
    'XXX##XXX','XXXX..XX','XXXXXXXX','.XXXXXX.'] },
  { id: 74, ice: 8, fog: { row: 2, col: 1, rows: 3, cols: 3 }, colors: 12, poolSize: 15, seconds: 210, layout: [
    'XXXX....XXXX','XXXXXXXXXXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXXXXXXXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXXX....XXXX'] },
  { id: 75, bombs: 3, ice: 6, colors: 9, poolSize: 15, seconds: 190, layout: [
    'XXXXXXXXXX','XXXXX..XXX','XXXXXXXXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXXXXXXXX','XXX..XXXXX','XXXXXXXXXX'] },
  { id: 76, fog: { row: 2, col: 1, rows: 3, cols: 2 }, colors: 8, poolSize: 15, seconds: 165, layout: [
    'XXXXXXXX','XXX..XXX','XXXXXXXX','XXX##XXX',
    'XXX##XXX','XXXXXXXX','XXX..XXX','XXXXXXXX'] },
  { id: 77, bombs: 3, ice: 8, fog: { row: 1, col: 7, rows: 3, cols: 4 }, colors: 12, poolSize: 15, seconds: 210, layout: [
    '.XXXXXXXXXX.','XXXXXXXXXXXX','XXXXX..XXXXX','XXXX....XXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXX....XXXX','XXXXX..XXXXX','XXXXXXXXXXXX','.XXXXXXXXXX.'] },
  { id: 78, ice: 6, fog: { row: 4, col: 5, rows: 3, cols: 3 }, colors: 9, poolSize: 15, seconds: 195, layout: [
    'XXXXXXXXXX','.XXXXXXXX.','XXXX..XXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXX..XXXX','.XXXXXXXX.','XXXXXXXXXX'] },
  { id: 79, bombs: 4, ice: 8, fog: { row: 6, col: 1, rows: 3, cols: 4 }, colors: 12, poolSize: 15, seconds: 210, layout: [
    'XXXXXXXXXXXX','.XXXXXXXXXX.','XXXXX..XXXXX','XXXXXXXXXXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXXXXXXXXXX','XXXXX..XXXXX','.XXXXXXXXXX.','XXXXXXXXXXXX'] },
  // 第 80 關僅時鐘機關（＋／－），之後交錯混搭。
  { id: 80, clocks: { plus: 2, minus: 2 }, colors: 8, poolSize: 15, seconds: 180, layout: [
    'XXXXXXXXXX','.XXXXXXXX.','XXXXXXXXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXXXXXXXX','.XXXXXXXX.','XXXXXXXXXX'] },
  // 第 81 關起至少兩種機關；以大量霧／炸彈／冰封交錯出題，後段再收緊時間與色數。
  { id: 81, clocks: { plus: 2, minus: 2 }, ice: 8, colors: 10, poolSize: 15, seconds: 190, layout: [
    '.XXXXXXXX.','XXXXXXXXXX','XXXX..XXXX','XXXX##XXXX',
    'XXXXXXXXXX','XXXX..XXXX','XXXXXXXXXX','.XXXXXXXX.'] },
  { id: 82, clocks: { plus: 2, minus: 1 }, bombs: 8, colors: 10, poolSize: 15, seconds: 190, layout: [
    'XXXXX..XXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXX..XXXXX'] },
  { id: 83, clocks: { plus: 2, minus: 2 }, fog: { row: 1, col: 1, rows: 5, cols: 7 }, colors: 10, poolSize: 15, seconds: 185, layout: [
    'XXXX....XX','XXXXXXXXXX','XXXXXXXXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXXXXXXXX','XXXXXXXXXX','XX....XXXX'] },
  { id: 84, ice: 8, fog: { row: 1, col: 1, rows: 4, cols: 5 }, colors: 9, poolSize: 15, seconds: 165, layout: [
    '.XXXXXX.','XXXXXXXX','XXX..XXX','XX####XX',
    'XXXXXXXX','XXX..XXX','XXXXXXXX','.XXXXXX.'] },
  { id: 85, clocks: { plus: 3, minus: 2 }, bombs: 6, ice: 10, fog: { row: 2, col: 0, rows: 5, cols: 6 }, colors: 13, poolSize: 15, seconds: 200, layout: [
    'XXXXX..XXXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXX....XXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXX....XXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXXX..XXXXX'] },
  { id: 86, clocks: { plus: 2, minus: 0 }, bombs: 8, colors: 8, poolSize: 15, seconds: 150, layout: [
    '..XXXX..','.XXXXXX.','XXXXXXXX','XXX##XXX',
    'XXXXXXXX','XXXXXXXX','.XXXXXX.','..XXXX..'] },
  { id: 87, clocks: { plus: 1, minus: 2 }, bombs: 4, ice: 10, colors: 11, poolSize: 15, seconds: 195, layout: [
    'XXXXXXXXXXXX','XXXXX..XXXXX','XXXX....XXXX','XXXXX##XXXXX',
    'XXXXXXXXXXXX','XXXX....XXXX','XXXXX..XXXXX','XXXXXXXXXXXX'] },
  { id: 88, clocks: { plus: 2, minus: 2 }, ice: 8, fog: { row: 1, col: 0, rows: 6, cols: 5 }, colors: 10, poolSize: 15, seconds: 185, layout: [
    'XXXXXXXXXX','XXXX..XXXX','.XXXXXXXX.','XXXX##XXXX',
    'XXXX##XXXX','.XXXXXXXX.','XXXX..XXXX','XXXXXXXXXX'] },
  { id: 89, bombs: 6, fog: { row: 1, col: 1, rows: 3, cols: 5 }, colors: 8, poolSize: 15, seconds: 145, layout: [
    '.XXXXXX.','XXXXXXXX','XXX##XXX','XXXXXXXX','XXX##XXX','.XXXXXX.'] },
  // 第 90 關起僅減時時鐘；最多五對（十顆），目前配置兩至六顆，不放滿上限。
  { id: 90, clocks: { plus: 0, minus: 2 }, bombs: 8, colors: 10, poolSize: 15, seconds: 180, layout: [
    'XXXXXXXXXX','XXX....XXX','XXXXXXXXXX','XXXX##XXXX',
    'XXXXXXXXXX','XXX....XXX','XXXXXXXXXX','XXXXXXXXXX'] },
  { id: 91, clocks: { plus: 0, minus: 4 }, ice: 12, fog: { row: 1, col: 1, rows: 6, cols: 6 }, colors: 13, poolSize: 15, seconds: 200, layout: [
    'XXXXXXXXXXXX','XXXX....XXXX','XXXXX..XXXXX','XXXXXXXXXXXX','XXXXX##XXXXX',
    'XXXXX##XXXXX','XXXXXXXXXXXX','XXXXX..XXXXX','XXXX....XXXX','XXXXXXXXXXXX'] },
  { id: 92, clocks: { plus: 0, minus: 4 }, bombs: 10, colors: 10, poolSize: 15, seconds: 175, layout: [
    'XXXXXX....','XXXXXXXXXX','XXXXXXXXXX','XXXX##XXXX',
    'XXXX##XXXX','XXXXXXXXXX','XXXXXXXXXX','....XXXXXX'] },
  { id: 93, clocks: { plus: 0, minus: 4 }, ice: 8, fog: { row: 1, col: 1, rows: 5, cols: 5 }, colors: 9, poolSize: 15, seconds: 165, layout: [
    'XX..XXXX','XXXXXXXX','XXXXXXXX','XXX##XXX',
    'XXX##XXX','XXXXXXXX','XXXXXXXX','XXXX..XX'] },
  { id: 94, clocks: { plus: 0, minus: 6 }, bombs: 8, ice: 12, fog: { row: 1, col: 0, rows: 7, cols: 6 }, colors: 14, poolSize: 15, seconds: 200, layout: [
    'XXXXXXXXXXXX','.XXXXXXXXXX.','XXXX....XXXX','XXXXXXXXXXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXXXXXXXXXX','XXXX....XXXX','.XXXXXXXXXX.','XXXXXXXXXXXX'] },
  { id: 95, clocks: { plus: 0, minus: 2 }, ice: 10, fog: { row: 1, col: 0, rows: 6, cols: 5 }, colors: 10, poolSize: 15, seconds: 185, layout: [
    '.XXXXXXXX.','XXXXXXXXXX','XXX....XXX','XXXX##XXXX',
    'XXXXXXXXXX','XXX....XXX','XXXXXXXXXX','.XXXXXXXX.'] },
  { id: 96, clocks: { plus: 0, minus: 4 }, bombs: 10, ice: 8, colors: 12, poolSize: 15, seconds: 190, layout: [
    'XXXX....XXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXX####XXXX',
    'XXXXXXXXXXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXX....XXXX'] },
  { id: 97, clocks: { plus: 0, minus: 4 }, bombs: 6, fog: { row: 1, col: 1, rows: 6, cols: 6 }, colors: 11, poolSize: 15, seconds: 180, layout: [
    'XXXXXXXXXX','XXXXX..XXX','XXX....XXX','XXXX##XXXX',
    'XXXX##XXXX','XXX....XXX','XXX..XXXXX','XXXXXXXXXX'] },
  { id: 98, clocks: { plus: 0, minus: 6 }, bombs: 8, ice: 12, fog: { row: 1, col: 0, rows: 7, cols: 6 }, colors: 14, poolSize: 15, seconds: 195, layout: [
    'XXXXXXXXXXXX','XXXXX..XXXXX','.XXXXXXXXXX.','XXXXXXXXXXXX','XXXX####XXXX',
    'XXXX####XXXX','XXXXXXXXXXXX','.XXXXXXXXXX.','XXXXX..XXXXX','XXXXXXXXXXXX'] },
  // 終章僅調整既有機關的位置與構圖；區域座標仍以版型零起算。
  { id: 99, name: '四象交會', bombs: 8, ice: 10, clocks: { plus: 0, minus: 6 },
    fog: { row: 0, col: 0, rows: 5, cols: 5 },
    bombZone: { row: 6, col: 0, rows: 4, cols: 5 }, bombZoneStrict: true,
    clockZone: { row: 6, col: 6, rows: 4, cols: 6 }, clockZoneStrict: true,
    iceZone: { row: 0, col: 6, rows: 5, cols: 6 }, iceAvoidClocks: true,
    bombPair: [{ r: 9, c: 1 }, { r: 9, c: 2 }],
    colors: 14, poolSize: 15, seconds: 210, layout: [
      'XXXXX.XXXXXX','XXXXX.XXXXXX','XXXXX.XXXXXX','XXXXX.XXXXXX','XXXXX.XXXXXX',
      'X...###.....','XXXXX.XXXXXX','XXXXX.XXXXXX','XXXXX.XXXXXX','XXXXX.XXXXXX'] },
  { id: 100, name: '最後一道光', bombs: 8, ice: 12, clocks: { plus: 0, minus: 8 },
    fog: { row: 2, col: 3, rows: 6, cols: 6 },
    bombZone: { row: 1, col: 1, rows: 8, cols: 10 },
    iceZone: { row: 1, col: 1, rows: 8, cols: 10 }, iceZoneStrict: true,
    clockZone: { edge: true }, clockZoneStrict: true,
    openingPair: [{ r: 0, c: 4 }, { r: 0, c: 5 }], bombPair: [{ r: 1, c: 2 }, { r: 1, c: 3 }],
    colors: 15, poolSize: 15, seconds: 210, layout: [
      '.XXXXXXXXXX.','XXXXXXXXXXXX','XXXXXXXXXXXX','XX#XX..XX#XX','XXXX....XXXX',
      'XXXX....XXXX','XX#XX..XX#XX','XXXXXXXXXXXX','XXXXXXXXXXXX','.XXXXXXXXXX.'] }
].map(level => {
  const tiles = level.layout.join('').split('').filter(cell => cell === 'X').length;
  // 每 20 顆可消除方塊配置一對 PPA，捨去小數，至少一對、最多五對。
  return { ...level, poolSize: level.poolSize ?? 9, rows: level.layout.length, cols: level.layout[0].length,
    ...(level.fog ? { fogTiles: level.layout.reduce((sum, row, r) => sum + [...row].filter((v, c) =>
      v === 'X' && r >= level.fog.row && r < level.fog.row + level.fog.rows && c >= level.fog.col && c < level.fog.col + level.fog.cols).length, 0) } : {}),
    tiles, ppaPairs: Math.min(5, Math.max(1, Math.floor(tiles / 20))),
    walls: level.layout.join('').split('').filter(cell => cell === '#').length };
});
