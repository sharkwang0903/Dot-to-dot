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
DotGame.LEVELS = [
  { id: 1, colors: 7, seconds: 90, ppaPairs: 1, layout: ['XXXXXX','XXXXXX','XXXXXX','XXXXXX','XXXXXX'] },
  { id: 2, colors: 7, seconds: 120, ppaPairs: 2, layout: ['.XXXXXX.','XXXXXXXX','XXXXXXXX','XXXXXXXX','XXXXXXXX','.XXXXXX.'] },
  { id: 3, colors: 8, seconds: 135, ppaPairs: 3, layout: ['..XXXX..','.XXXXXX.','XXXXXXXX','XXX..XXX','XXX..XXX','XXXXXXXX','.XXXXXX.','..XXXX..'] },
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
    '..XX....XX..','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXXXXXXXXXX','XXXXXXXXXXXX'] }
].map(level => ({ ...level, poolSize: level.poolSize ?? 9, rows: level.layout.length, cols: level.layout[0].length,
  tiles: level.layout.join('').split('').filter(cell => cell === 'X').length,
  walls: level.layout.join('').split('').filter(cell => cell === '#').length }));
