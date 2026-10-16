import {detectGame} from './game-detection.js';
import {normalize} from './dictionary.js';
import {describeElement,recordPlacement} from './placement-diagnostics.js';
export function positionKey(s){return s?.detected?JSON.stringify([s.gameId,s.board.map(row=>row.map(t=>t?[t.letter,!!t.blank]:null)),[...s.rack].filter(Boolean).sort(),s.multipliers]):'unreadable';}
function observationKey(s){return JSON.stringify([positionKey(s),s?.rackSlots,s?.pendingTiles,s?.canStage,s?.stageReason,s?.message]);}
function ownNode(node){const e=node?.nodeType===1?node:node?.parentElement;return e?.closest?.('#islenska-solver-host')||e?.getRootNode?.().host?.id==='islenska-solver-host';}
export function watchGame({read,onChange,doc=document,interval=1000,debounce=220}){
 let stopped=false,timer,poll,last,observers=[];const observed=new Set();
 function attach(root){if(!root||observed.has(root))return;observed.add(root);const w=root.ownerDocument?.defaultView||root.defaultView||doc.defaultView,Observer=w?.MutationObserver;if(!Observer)return;const o=new Observer(records=>{if(records.some(r=>!ownNode(r.target)))schedule();});o.observe(root.documentElement||root,{subtree:true,childList:true,characterData:true,attributes:true});observers.push(o);}
 function check(){if(stopped)return;let s;try{s=read();}catch(e){s={detected:false,message:e.message};}attach(s?.live?.root);const key=observationKey(s);if(key!==last){last=key;onChange(s);}}
 function schedule(){clearTimeout(timer);timer=setTimeout(check,debounce);}
 attach(doc);poll=setInterval(check,interval);check();return {refresh:check,stop(){stopped=true;clearTimeout(timer);clearInterval(poll);for(const o of observers)o.disconnect();observers=[];}};
}
function abort(signal){if(signal?.aborted)throw Error('Placement stopped. Review any tiles already staged in the game.');}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(test,{signal,timeout=3500,delay=40,message='The game did not accept the tile click. Placement stopped; review the board.'}={}){const start=Date.now();while(Date.now()-start<timeout){abort(signal);const value=test();if(value)return value;await pause(delay);}throw Error(message);}
function sameTile(a,b){return !!a&&!!b&&a.letter===b.letter&&!!a.blank===!!b.blank;}
function pendingMap(s){return new Map((s.pendingTiles||[]).map(t=>[`${t.row},${t.col}`,t]));}
function clickAt(element) {
 const root=element.getRootNode();
 recordPlacement(root,{phase:'click',target:describeElement(element),method:typeof element.click==='function'?'HTMLElement.click':'composed MouseEvent'});
 if(typeof element.click==='function')element.click();
 else {const w=element.ownerDocument.defaultView,rect=element.getBoundingClientRect();element.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,composed:true,view:w,detail:1,button:0,clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2}));}
}
function rackTile(cell) {
 return cell.matches('.tile,.racktile,.rack-tile,[data-letter],[data-tile]') ? cell : cell.querySelector('.tile,.racktile,.rack-tile,[data-letter],[data-tile]') || cell;
}
function isSelected(cell) {
 const selector='.sel,.selected,.is-selected,.selected-tile,[aria-selected="true"],[aria-pressed="true"],[data-selected="true"]';
 return cell.matches(selector)||!!cell.querySelector(selector);
}
// Clicking a container does not activate handlers attached to its letter child.
// Target the letter's text element, as a person tapping the face of the tile does.
function letterTarget(cell,letter) {
 const tile=rackTile(cell),walker=cell.ownerDocument.createTreeWalker(tile,4);
 if(letter==='?'){const face=tile.querySelector('.tile-letter,.letter,[data-letter]');if(face)return face;}
 let text;while((text=walker.nextNode())) {
  const parent=text.parentElement;
  if(parent.closest('.letterscore,.score,.tile-score,sup,small'))continue;
  const scored=parent.closest('[data-score]');if(scored&&scored!==tile)continue;
  if(normalize(text.textContent).trim()===letter||(letter==='?'&&!text.textContent.trim()&&parent!==tile))return parent;
 }
 return tile;
}
function squareTarget(cell) {
 const explicit=cell.querySelector('[data-drop-target],.drop-target');if(explicit)return explicit;
 const rect=cell.getBoundingClientRect(),hit=cell.ownerDocument.elementFromPoint?.(rect.left+rect.width/2,rect.top+rect.height/2);
 return hit&&cell.contains(hit)?hit:cell;
}
export async function stageMove({read,move,expected,signal,onProgress=()=>{},onStep=()=>{}}) {
 if(!move?.placedTiles?.length)throw Error('No move to place.');
 const key=typeof expected==='string'?expected:positionKey(expected),planned=new Map();
 for(const t of move.placedTiles) {
  const row=t.row,col=t.col??t.column;
  if(!Number.isInteger(row)||!Number.isInteger(col)||row<0||col<0||row>14||col>14||planned.has(`${row},${col}`))throw Error('Invalid move coordinates.');
  planned.set(`${row},${col}`,{row,col,letter:t.letter,blank:!!t.blank});
 }
 function checked() {
  abort(signal);const snapshot=read();
  if(!snapshot?.detected||!snapshot.live||positionKey(snapshot)!==key)throw Error('The position changed. Recalculate before placing.');
  if(snapshot.canStage===false)throw Error(snapshot.stageReason||'The game is not ready for placement.');
  for(const [coord,tile]of pendingMap(snapshot))if(!sameTile(tile,planned.get(coord)))throw Error('Different tiles are already staged. Recall them in the game before placing this move.');
  return snapshot;
 }
 let snapshot=checked();recordPlacement(snapshot.live.root,{phase:'start',word:move.word||'',tiles:planned.size});const counts=new Map();
 for(const letter of snapshot.rackSlots||[])if(letter)counts.set(letter,(counts.get(letter)||0)+1);
 for(const [coord,tile]of planned) {
  if(snapshot.board[tile.row][tile.col])throw Error('A destination square is occupied.');
  if(pendingMap(snapshot).has(coord))continue;
  const token=tile.blank?'?':tile.letter,count=counts.get(token)||0;
  if(!count)throw Error('A required rack tile is no longer available.');counts.set(token,count-1);
 }
 let done=pendingMap(snapshot).size;
 for(const [coord,tile]of planned) {
  snapshot=checked();if(pendingMap(snapshot).has(coord))continue;
  const token=tile.blank?'?':tile.letter;
  // Prefer an already selected matching rack tile; do not toggle it off.
  let index=snapshot.rackSlots.findIndex((letter,i)=>letter===token&&isSelected(snapshot.live.rack[i]));
  if(index<0)index=snapshot.rackSlots.findIndex(letter=>letter===token);
  let source=snapshot.live.rack[index];
  if(!source?.isConnected)throw Error('The rack changed. Recalculate before placing.');
  onStep({phase:'select',letter:token,slot:index+1,row:tile.row,col:tile.col});
  if(!isSelected(source))clickAt(letterTarget(source,token));
  // Some clients mark selection using styles or internal state rather than a
  // known CSS class. Give redraws time, but verify success on the actual board
  // instead of refusing to send the second click because a CSS marker is absent.
  const started=Date.now();let confirmed=false;
  while(Date.now()-started<600) {
   snapshot=checked();source=snapshot.live.rack[index];
   if(snapshot.rackSlots[index]!==token)throw Error('The selected rack slot changed. Recalculate before placing.');
   if(source?.isConnected&&isSelected(source)){confirmed=true;break;}
   await pause(40);
  }
  snapshot=checked();
  if(snapshot.live.rack.some((cell,i)=>i!==index&&isSelected(cell)))throw Error('The game selected a different rack tile. Placement stopped before clicking the board.');
  recordPlacement(snapshot.live.root,{phase:'selection',slot:index+1,letter:token,markerConfirmed:confirmed,source:describeElement(snapshot.live.rack[index])});
  const destination=snapshot.live.cells.find(cell=>cell.row===tile.row&&cell.col===tile.col)?.e;
  if(!destination?.isConnected)throw Error('The destination square disappeared.');
  onStep({phase:'destination',letter:tile.letter,slot:index+1,row:tile.row,col:tile.col});
  clickAt(squareTarget(destination));
  if(tile.blank) {
   await until(()=>{
    abort(signal);
    const root=snapshot.live.root,choice=[...root.querySelectorAll('#blank-meaning .blank-choice,#blank-dialog .blank-choice,[data-blank-choice]')].find(element=>normalize(element.getAttribute('data-blank-choice')||element.textContent).replace(/\s/g,'')===tile.letter);
    if(choice){onStep({phase:'blank',letter:tile.letter,row:tile.row,col:tile.col});clickAt(letterTarget(choice,tile.letter));return true;}
    return sameTile(pendingMap(read()).get(coord),tile);
   },{signal,message:`The blank-letter picker did not open for ${tile.letter}. Placement stopped.`});
  }
  await until(()=>sameTile(pendingMap(checked()).get(coord),tile),{signal,message:`The game did not place ${tile.letter} at ${'ABCDEFGHIJKLMNO'[tile.row]}${tile.col+1}. Both clicks were sent. Placement stopped; use Settings → Copy detection report for diagnostics.`});
  recordPlacement(snapshot.live.root,{phase:'verified',row:tile.row,col:tile.col,letter:tile.letter});onProgress(++done,planned.size);await pause(55);
 }
 snapshot=checked();if(pendingMap(snapshot).size!==planned.size)throw Error('The staged tiles do not match the move.');return snapshot;
}
export function gameReader(doc=document,href=()=>location.href){let baseline=null;return ()=>{const s=detectGame(doc,typeof href==='function'?href():href,true);if(!s.detected)return s;
 if(baseline&&baseline.gameId===s.gameId&&baseline.historyStamp===s.historyStamp&&baseline.canStage!==false&&s.canStage!==false){let unchanged=true;const draft=new Map((s.pendingTiles||[]).map(t=>[`${t.row},${t.col}`,t]));for(let r=0;r<15;r++)for(let c=0;c<15;c++){const old=baseline.board[r][c],now=s.board[r][c];if(old&&!sameTile(old,now))unchanged=false;if(!old&&now)draft.set(`${r},${c}`,{row:r,col:c,letter:now.letter,blank:now.blank});}
 const inventory=[...s.rackSlots.filter(Boolean),...[...draft.values()].map(t=>t.blank?'?':t.letter)].sort().join(''),original=baseline.rack.filter(Boolean).sort().join('');if(unchanged&&draft.size&&inventory===original){s.board=baseline.board.map(row=>row.map(t=>t?{...t}:null));s.pendingTiles=[...draft.values()].sort((a,b)=>a.row-b.row||a.col-b.col);s.pending=s.pendingTiles.length;s.occupied=s.board.flat().filter(Boolean).length;s.rack=[...s.rackSlots];for(const t of s.pendingTiles){const i=s.rack.indexOf('');if(i<0)break;s.rack[i]=t.blank?'?':t.letter;}s.draftSource='rack inventory';}}
 if(!baseline||baseline.gameId!==s.gameId||s.pending===0||baseline.historyStamp!==s.historyStamp)baseline={gameId:s.gameId,historyStamp:s.historyStamp,canStage:s.canStage,board:s.board.map(row=>row.map(t=>t?{...t}:null)),rack:[...s.rack]};return s;};}
