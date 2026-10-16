// Test harness only. Executes the immutable public game chunk supplied by the
// user's diagnostic report. Real Mithril rendering, Tile, DropTargetSquare and
// drag/click controller code run unchanged; the game model stays local here.
export function installMalstadurClient(w,source,{letters='UUOKÆNV',values={},multipliers,initial=[]}={}) {
 const d=w.document,host=d.getElementById('client-fixture');
 if(!host)throw Error('A local client-fixture host is required.');
 w.eval(source);
 const modules=new Map(),cache=new Map();
 for(const chunk of w.TURBOPACK){let ids=[];for(const item of chunk.slice(1).flat()){
  if(typeof item==='number')ids.push(item);
  else if(typeof item==='function'){for(const id of ids)modules.set(id,{factory:item,ids});ids=[];}
 }}
 function load(id) {
  if(cache.has(id))return cache.get(id).exports;
  const group=modules.get(id);if(!group)throw Error('Missing public client module '+id);
  for(const alias of group.ids)cache.set(alias,{exports:{}});
  const record=cache.get(id);
  const context={r:load,i:load,s(bindings,target=id){
   let item=cache.get(target);if(!item){item={exports:{}};cache.set(target,item);}
   for(let p=0;p<bindings.length;){const name=bindings[p++],type=bindings[p++];
    if(type===0){const value=bindings[p++];Object.defineProperty(item.exports,name,{get:()=>value,enumerable:true});}
    else Object.defineProperty(item.exports,name,{get:type,enumerable:true});
   }
  }};
  group.factory(context,record,record.exports);return cache.get(id).exports;
 }
 const m=load(60628);
 // Supply the component's display/translation dependencies without starting the
 // application, authentication, routing, network model, Firebase, or analytics.
 cache.set(798570,{exports:{m}});
 cache.set(984,{exports:{d:{view:v=>m('button',v.attrs,v.children)}}});
 cache.set(582269,{exports:{Z:text=>text==='submit_move'?'Leika':text,A:(tag,text)=>m(tag,text)}});
 cache.set(5323,{exports:{$:()=> '\u00a0',G:()=>m.redraw(),w:()=>'',c:()=>{},y:()=>{}}});
 cache.set(557199,{exports:{C:7,l:'q',p:'zxmæ'}});
 const controls=load(565524),blanks=load(240938),buttons=load(495004).u,events=[],attempts=[];
 let opponent=false,submissions=0,submitReady=true;
 const score=letter=>letter==='?'?0:values[letter.toUpperCase()]??1;
 const tile=letter=>({tile:letter.toLowerCase(),letter:letter==='?'?' ':letter.toLowerCase(),score:score(letter),draggable:true});
 const game={tiles:{},selectedSq:null,showingDialog:null,askingForBlank:null,startSquare:'H8',localturn:true,alphabet:'aábdðeéfghiíjklmnoóprstuúvxyýþæö',
  allowDragDrop(){return !opponent&&!this.showingDialog;},
  squareClass(coord){if(coord[0]==='R')return '';const r=coord.charCodeAt(0)-65,c=+coord.slice(1)-1,p=multipliers?.[r]?.[c];return p?.word===3?'tw':p?.word===2?'dw':p?.letter===3?'tl':p?.letter===2?'dl':'';},
  attemptMove(from,to){
   attempts.push({from,to});if(from===to)return;
   if(!this.tiles[from]||this.tiles[to])throw Error('Invalid fixture tile move.');
   if(this.tiles[from].tile==='?'&&this.tiles[from].letter===' '){this.askingForBlank={from,to};this.showingDialog='blank';return;}
   this.tiles[to]=this.tiles[from];delete this.tiles[from];
  },
  placeBlank(letter){const {from,to}=this.askingForBlank;this.tiles[from].letter=letter;this.tiles[to]=this.tiles[from];delete this.tiles[from];this.askingForBlank=null;this.showingDialog=null;},
  cancelBlankDialog(){this.askingForBlank=null;this.showingDialog=null;},
  nickname:['Local tester','Opponent'],player:0,
  tilesPlaced(){return Object.keys(this.tiles).filter(coord=>coord[0]!=='R'&&this.tiles[coord].draggable);},
  buttonState(){const pending=this.tilesPlaced().length>0;return {tilesPlaced:pending,gameOver:false,localTurn:!opponent,showMove:pending&&!opponent,wordGood:pending&&submitReady,wordBad:false,canPlay:pending&&submitReady&&!opponent,showingDialog:!!this.showingDialog};},
  submitMove(){submissions++;}

 };
 for(const [i,letter]of [...letters].entries())game.tiles['R'+(i+1)]=tile(letter);
 for(const entry of initial){const coord='ABCDEFGHIJKLMNO'[entry.row]+(entry.col+1);game.tiles[coord]={...tile(entry.letter),draggable:false,...(entry.blank?{tile:'?',score:0}:{})};}
 const view={model:{reviewMove:null,game},updateScale(){}};
 const component={view:()=>m('div.netskrafl-container',[
  m('div#board-parent',m('table.board',m('tbody',[
   m('tr',[m('th'),...Array.from({length:15},(_,c)=>m('th',c+1))]),
   ...Array.from({length:15},(_,r)=>m('tr',[m('th',{key:'label'},'ABCDEFGHIJKLMNO'[r]),...Array.from({length:15},(_,c)=>{const coord='ABCDEFGHIJKLMNO'[r]+(c+1);return m(game.tiles[coord]?controls._:controls.k,{key:coord,view,game,coord});})]))
  ]))),
  m('div.rack',m(controls.g,{view,game})),
  game.askingForBlank?m(blanks.f,{game}):null,
  opponent?m('div.opp-turn','Opponent turn'):null,
  m('div.buttons',m(buttons,{view}))
 ])};
 const style=d.createElement('style');style.textContent='#client-fixture{width:570px}#client-fixture table{border-spacing:3px}#client-fixture td{width:32px;height:32px;padding:0;background:#1d2420}#client-fixture .netskrafl-tile{width:32px;height:32px;position:relative;background:#985e3c;color:white}#client-fixture .netskrafl-racktile{background:#505750}#client-fixture .tileletter{font:24px system-ui;text-transform:uppercase}#client-fixture .letterscore{position:absolute;right:2px;bottom:0;font:9px system-ui}#client-fixture .sel{outline:2px solid red}';d.head.append(style);
 for(const type of ['mousedown','mouseup','click'])d.addEventListener(type,event=>{if(event.isTrusted)return;const target=event.composedPath().find(node=>node?.id?.startsWith('sq_'));events.push({type,coord:target?.id||null});},{capture:true});
 m.mount(host,component);
 return {game,events,attempts,get submissions(){return submissions;},render(){m.redraw.sync();},setSubmitReady(value){submitReady=value;m.redraw.sync();},setOpponent(value){opponent=value;game.localturn=!value;m.redraw.sync();},commit(nextRack='KATTAIR'){
  for(const [coord,t]of Object.entries(game.tiles)){if(coord[0]==='R')delete game.tiles[coord];else t.draggable=false;}
  for(const [i,l]of [...nextRack].entries())game.tiles['R'+(i+1)]=tile(l);game.selectedSq=null;m.redraw.sync();
 },destroy(){m.mount(host,null);style.remove();}};
}
