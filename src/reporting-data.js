export const REPORT_TARGET='jonsolvi12';
export function matchedPlayers({botUser,opponent}={}){return [['Bot user',botUser],['Opponent',opponent]].filter(([,name])=>typeof name==='string'&&name.trim().toLowerCase()===REPORT_TARGET).map(([role])=>role);}
export function readDisplayedPlayers(root){
 const visible=e=>{for(let n=e;n?.nodeType===1;n=n.parentElement){const s=n.ownerDocument.defaultView?.getComputedStyle(n);if(n.hidden||n.getAttribute('aria-hidden')==='true'||s?.display==='none'||s?.visibility==='hidden')return false;}return true;};
 function name(selector){const found=[...root.querySelectorAll(selector)].filter(visible).map(e=>{const copy=e.cloneNode(true);for(const n of copy.querySelectorAll('svg,img,.glyphicon,.left-to-move,.right-to-move,.scoreleft,.scoreright,[aria-hidden="true"]'))n.remove();return copy.textContent.trim();}).filter(Boolean);const unique=[...new Set(found)];return unique.length===1?unique[0]:null;}
 return {botUser:name('.playerwrapper .humancolor .player-btn,.playerwrapper .humancolor .robot-btn'),opponent:name('.playerwrapper .autoplayercolor .player-btn,.playerwrapper .autoplayercolor .robot-btn')};
}
export function makeNotification({botUser,opponent,word,points,version,timestamp=new Date().toISOString(),test=false}){
 const matched=matchedPlayers({botUser,opponent});if(!matched.length)return null;
 if([botUser,opponent,word,version].some(x=>typeof x!=='string'||!x.trim()||x.length>200)||!Number.isFinite(points)||points<0||!Number.isFinite(Date.parse(timestamp)))throw Error('Reporting fields are incomplete.');
 return {allowed_mentions:{parse:[]},embeds:[{title:test?'TEST — Íslenska Solver (mock players)':'Íslenska Solver — confirmed move',color:test?0xd89c31:0x17644e,fields:[{name:'Bot user',value:botUser,inline:true},{name:'Opponent',value:opponent,inline:true},{name:'Matched jonsolvi12',value:matched.join(' and ')},{name:'Word played',value:word,inline:true},{name:'Points',value:String(points),inline:true},{name:'Bot version',value:version}],timestamp:new Date(timestamp).toISOString(),footer:{text:test?'Mock notification; no game move was played.':'Visible player names shared with explicit reporting consent.'}}]};
}
export function committedMove(before,after,move){return !!(after?.detected&&before.gameId&&after.gameId===before.gameId&&move?.placedTiles?.length&&move.placedTiles.every(t=>{const col=t.col??t.column,cell=after.board?.[t.row]?.[col];return !before.board?.[t.row]?.[col]&&cell?.letter===t.letter&&!!cell.blank===!!t.blank;}));}
