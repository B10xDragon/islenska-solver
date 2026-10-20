import {positionKey} from './live-game.js';
import {recordPlacement,describeElement} from './placement-diagnostics.js';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function visible(element) {
 if(!element?.isConnected)return false;
 for(let node=element;node?.nodeType===1;node=node.parentElement){
  if(node.hidden||node.getAttribute('aria-hidden')==='true')return false;
  const style=node.ownerDocument.defaultView?.getComputedStyle(node);
  if(style?.display==='none'||style?.visibility==='hidden')return false;
 }
 return true;
}
function readyButton(root) {
 const indicators=[...root.querySelectorAll('.word-check,.score.word-good,.score.word-bad,.score.manual')].filter(visible);
 if(indicators.length&&!indicators.some(e=>e.classList.contains('word-good')||e.classList.contains('manual')))return null;
 if(indicators.some(e=>e.classList.contains('word-bad')))return null;
 return [...root.querySelectorAll('#submitmove,.submitmove,#move-mobile,[data-action="submit-move"]')].find(element=>visible(element)&&!element.disabled&&!element.closest('[disabled],[aria-disabled="true"],.disabled')&&(element.id!=='move-mobile'||element.classList.contains('word-good')||element.classList.contains('manual')));
}
export function createSubmitter({read,beforeSubmit=async()=>{}}) {
 const clicked=new Set(),running=new Map();
 return function submit({move,expected,signal,isEnabled=()=>false,timeout=10000}) {
  const key=typeof expected==='string'?expected:positionKey(expected);
  if(clicked.has(key))return Promise.resolve({clicked:false,alreadyClicked:true});
  if(running.has(key))return running.get(key);
  const task=(async()=>{
   const planned=new Map();
   for(const tile of move?.placedTiles||[]){const row=tile.row,col=tile.col??tile.column,coord=`${row},${col}`;if(!Number.isInteger(row)||!Number.isInteger(col)||planned.has(coord))throw Error('Invalid move for submission.');planned.set(coord,tile);}
   if(!planned.size)throw Error('No verified move to submit.');
   function checked() {
    if(signal?.aborted||!isEnabled())throw Error('Auto submit stopped. The staged tiles remain for review.');
    const snapshot=read();
    if(!snapshot?.detected||!snapshot.live||positionKey(snapshot)!==key)throw Error('The position changed. Leika was not clicked.');
    if(snapshot.canStage===false)throw Error(snapshot.stageReason||'The game is not ready to submit.');
    const pending=snapshot.pendingTiles||[];
    if(pending.length!==planned.size||pending.some(tile=>{const t=planned.get(`${tile.row},${tile.col}`);return !t||t.letter!==tile.letter||!!t.blank!==!!tile.blank;}))throw Error('The staged tiles changed. Leika was not clicked.');
    return snapshot;
   }
   const start=Date.now();
   while(Date.now()-start<timeout) {
    let snapshot=checked(),button=readyButton(snapshot.live.root);
    if(button){
     await beforeSubmit();
     snapshot=checked();button=readyButton(snapshot.live.root);if(!button)continue;
     // Record before activation: a thrown or delayed client response must not
     // cause an automatic second submission of the same position.
     clicked.add(key);if(clicked.size>256)clicked.delete(clicked.values().next().value);recordPlacement(snapshot.live.root,{phase:'submit',target:describeElement(button),word:move.word});button.click();return {clicked:true};
    }
    await pause(80);
   }
   throw Error('Leika is not ready. The move remains staged; review it in the game.');
  })();
  running.set(key,task);task.finally(()=>running.delete(key)).catch(()=>{});return task;
 };
}
