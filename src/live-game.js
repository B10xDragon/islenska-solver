import {detectGame} from './game-detection.js';
import {normalize} from './dictionary.js';
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
async function until(test,{signal,timeout=1800,delay=35}={}){const start=Date.now();while(Date.now()-start<timeout){abort(signal);const value=test();if(value)return value;await pause(delay);}throw Error('The game did not accept the tile click. Placement stopped; review the board.');}
function sameTile(a,b){return !!a&&!!b&&a.letter===b.letter&&!!a.blank===!!b.blank;}
function pendingMap(s){return new Map((s.pendingTiles||[]).map(t=>[`${t.row},${t.col}`,t]));}
function clickAt(element){const w=element.ownerDocument.defaultView,rect=element.getBoundingClientRect();element.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true,view:w,detail:1,button:0,buttons:0,clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2}));}
function isSelected(tile,cell){const selector='.sel,.selected,[aria-selected="true"],[data-selected="true"]';return tile.matches(selector)||cell.matches(selector);}
export async function stageMove({read,move,expected,signal,onProgress=()=>{}}){
 if(!move?.placedTiles?.length)throw Error('No move to place.');const key=typeof expected==='string'?expected:positionKey(expected),planned=new Map();
 for(const t of move.placedTiles){const r=t.row,c=t.col??t.column;if(!Number.isInteger(r)||!Number.isInteger(c)||r<0||c<0||r>14||c>14||planned.has(`${r},${c}`))throw Error('Invalid move coordinates.');planned.set(`${r},${c}`,{row:r,col:c,letter:t.letter,blank:!!t.blank});}
 function checked(){abort(signal);const s=read();if(!s?.detected||!s.live||positionKey(s)!==key)throw Error('The position changed. Recalculate before placing.');if(s.canStage===false)throw Error(s.stageReason||'The game is not ready for placement.');const pending=pendingMap(s);for(const [coord,t]of pending){if(!sameTile(t,planned.get(coord)))throw Error('Different tiles are already staged. Recall them in the game before placing this move.');}return s;}
 let s=checked();const counts=new Map();for(const l of s.rackSlots||[])if(l)counts.set(l,(counts.get(l)||0)+1);for(const [coord,t]of planned){if(s.board[t.row][t.col])throw Error('A destination square is occupied.');if(pendingMap(s).has(coord))continue;const token=t.blank?'?':t.letter,n=counts.get(token)||0;if(!n)throw Error('A required rack tile is no longer available.');counts.set(token,n-1);}
 let done=pendingMap(s).size;
 for(const [coord,t]of planned){s=checked();if(pendingMap(s).has(coord))continue;const token=t.blank?'?':t.letter,index=s.rackSlots.findIndex(l=>l===token),cell=s.live.rack[index];if(!cell?.isConnected)throw Error('The rack changed. Recalculate before placing.');const tile=cell.querySelector('.tile,.racktile,[data-letter],[data-tile],.rack-tile')||cell;
 if(!isSelected(tile,cell))clickAt(tile);await pause(70);s=checked();const destination=s.live.cells.find(c=>c.row===t.row&&c.col===t.col)?.e;if(!destination?.isConnected)throw Error('The destination square disappeared.');clickAt(destination);
 if(t.blank){await until(()=>{abort(signal);const root=s.live.root,choice=[...root.querySelectorAll('#blank-meaning .blank-choice,#blank-dialog .blank-choice,[data-blank-choice]')].find(e=>normalize(e.getAttribute('data-blank-choice')||e.textContent).replace(/\s/g,'')===t.letter);if(choice){clickAt(choice.closest('td,button')||choice);return true;}const now=read();return now.detected&&sameTile(pendingMap(now).get(coord),t);},{signal});}
 await until(()=>{const now=checked();return sameTile(pendingMap(now).get(coord),t);},{signal});onProgress(++done,planned.size);await pause(55);
 }
 s=checked();if(pendingMap(s).size!==planned.size)throw Error('The staged tiles do not match the move.');return s;
}
export function gameReader(doc=document,href=()=>location.href){let baseline=null;return ()=>{const s=detectGame(doc,typeof href==='function'?href():href,true);if(!s.detected)return s;
 if(baseline&&baseline.gameId===s.gameId&&baseline.historyStamp===s.historyStamp&&baseline.canStage!==false&&s.canStage!==false){let unchanged=true;const draft=new Map((s.pendingTiles||[]).map(t=>[`${t.row},${t.col}`,t]));for(let r=0;r<15;r++)for(let c=0;c<15;c++){const old=baseline.board[r][c],now=s.board[r][c];if(old&&!sameTile(old,now))unchanged=false;if(!old&&now)draft.set(`${r},${c}`,{row:r,col:c,letter:now.letter,blank:now.blank});}
 const inventory=[...s.rackSlots.filter(Boolean),...[...draft.values()].map(t=>t.blank?'?':t.letter)].sort().join(''),original=baseline.rack.filter(Boolean).sort().join('');if(unchanged&&draft.size&&inventory===original){s.board=baseline.board.map(row=>row.map(t=>t?{...t}:null));s.pendingTiles=[...draft.values()].sort((a,b)=>a.row-b.row||a.col-b.col);s.pending=s.pendingTiles.length;s.occupied=s.board.flat().filter(Boolean).length;s.rack=[...s.rackSlots];for(const t of s.pendingTiles){const i=s.rack.indexOf('');if(i<0)break;s.rack[i]=t.blank?'?':t.letter;}s.draftSource='rack inventory';}}
 if(!baseline||baseline.gameId!==s.gameId||s.pending===0||baseline.historyStamp!==s.historyStamp)baseline={gameId:s.gameId,historyStamp:s.historyStamp,canStage:s.canStage,board:s.board.map(row=>row.map(t=>t?{...t}:null)),rack:[...s.rack]};return s;};}
