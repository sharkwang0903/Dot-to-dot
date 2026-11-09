/* 真實模組與控制器，虛擬時鐘／DOM／隔離存檔；不碰玩家資料。 */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const assertRenderedText=require('./assert-rendered-text');
const source=name=>fs.readFileSync(path.join(__dirname,'../../js',name+'.js'),'utf8');
function boot(memory=new Map(),deny=false) {
  let now=1000,serial=0,rendered=[],dialog='',clock=0,mode='',stage=0;
  const jobs=new Map(),events={},nodes=new Map();
  function node(id) {
    if(!nodes.has(id)) { const classes=new Set(); nodes.set(id,{textContent:'',innerHTML:'',dataset:{},style:{},inert:false,focus(){},scrollIntoView(){},
      classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},contains:n=>classes.has(n)},
      addEventListener(type,fn){events[id+':'+type]=fn;}});
      for(const key of ['innerHTML','textContent']) {
        let value='';
        Object.defineProperty(nodes.get(id),key,{get:()=>value,set(next){assertRenderedText(next,`${id}.${key}`);value=next;}});
      }
    }
    return nodes.get(id);
  }
  const ctx={console,performance:{now:()=>now},matchMedia:()=>({matches:false}),
    localStorage:{getItem(key){if(deny)throw Error('blocked');return memory.get(key)||null;},setItem(key,val){if(deny)throw Error('blocked');memory.set(key,val);}},
    setTimeout(fn,ms){const id=++serial;jobs.set(id,{fn,at:now+ms});return id;},clearTimeout(id){jobs.delete(id);},
    requestAnimationFrame(fn){const id=++serial;jobs.set(id,{fn,at:now+16});return id;},cancelAnimationFrame(id){jobs.delete(id);},
    document:{hidden:false,addEventListener(type,fn){events[type]=fn;}},addEventListener(type,fn){events['window:'+type]=fn;}};
  ctx.window=ctx;vm.createContext(ctx);
  for(const file of ['levels','stories','campaign','engine','storage','campaign-storage','journey','rewards'])vm.runInContext(source(file),ctx);
  const D=ctx.DotGame; D.Audio={play(){}};
  D.UI={$:node,icon:()=>'',stars:n=>`stars:${n}`,clock:n=>String(n),gem:()=>'<svg></svg>',
    showView(){},levels(){},setupStage(l,p,m){stage=l.id;mode=m;},board(g){rendered=g.map(r=>r.slice());},select(){},cell:()=>node('tile'),
    updateTime(ms){clock=ms;},combo(){},line(){},clearLine(){},message(text){assertRenderedText(text,'棋盤提示');},ppaFeedback(){},clearPPA(){},blast(){},clearBomb(){},clearToast(){},toast(text){assertRenderedText(text,'浮動提示');},soundButton(){},
    modal(html){dialog=html;node('modal-content').innerHTML=html;node('modal').open=true;},closeModal(){dialog='';node('modal-content').innerHTML='';node('modal').open=false;node('modal').classList.remove('campaign-modal','reward-modal');}};
  vm.runInContext(source('campaign-ui'),ctx);vm.runInContext(source('game'),ctx);
  function advance(ms){const target=now+ms;for(let i=0;i<100000;i++){const item=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!item||item[1].at>target)break;now=item[1].at;jobs.delete(item[0]);item[1].fn();}now=target;}
  function action(action,level=1,inDialog=false,tier) {const el={dataset:{action,level:String(level),tier:String(tier)},closest:()=>inDialog?node('modal'):null};events.click({target:{closest:s=>s==='[data-action]'?el:null}});}
  function tile(p){const el={dataset:{r:String(p.r),c:String(p.c)}};events.click({target:{closest:s=>s==='[data-cell]'?el:null}});}
  function solve() {for(let i=0;D.Engine.cells(rendered).length&&i<100;i++){const move=D.Engine.findMove(rendered);assert.ok(move);tile(move.a);tile(move.b);advance(30);for(let w=0;node('board').inert&&D.Engine.cells(rendered).length&&w<40;w++)advance(100);}advance(1000);assert.equal(D.Engine.cells(rendered).length,0);}
  return {D,ctx,events,node,action,advance,solve,memory,get dialog(){return dialog;},get clock(){return clock;},get mode(){return mode;},get stage(){return stage;}};
}
module.exports={boot};
