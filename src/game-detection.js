import {ALPHABET,normalize} from './dictionary.js';
import {createBoard,standardMultipliers} from './board.js';
export function detectGame(doc=document,href=location.href){
 const seen=new Set(),docs=[],blocked=[];function visit(d){if(seen.has(d))return;seen.add(d);docs.push(d);for(const f of d.querySelectorAll('iframe')){if(f.closest('#islenska-solver-host'))continue;try{const inner=f.contentDocument;if(inner)visit(inner);else blocked.push(f.src);}catch{blocked.push(f.src);}}}visit(doc);
 const id=href.match(/(?:#!?\/|\/)(?:game|review)\/([a-f\d-]{36})/i)?.[1]||null;
 for(const d of docs){const container=d.querySelector('#board-parent')||d;const cells=Array.from(container.querySelectorAll('[id^="sq_"]')).filter(e=>/^sq_[A-O](?:[1-9]|1[0-5])$/.test(e.id));if(cells.length!==225)continue;
 const board=createBoard(),multipliers=standardMultipliers(),rack=Array(7).fill('');let pending=0;
 function read(cell,isRack){const tile=cell?.querySelector('.tile');if(!tile)return null;const copy=tile.cloneNode(true);for(const e of copy.querySelectorAll('.letterscore,.score,[data-score]'))e.remove();const raw=normalize(copy.textContent).replace(/\s/g,'');const letter=[...raw].find(c=>ALPHABET.includes(c));const blank=tile.classList.contains('blanktile')||raw==='?'||tile.querySelector('.letterscore')?.textContent.trim()==='0';if(isRack&&blank)return {letter:'?',blank:true};if(!letter)throw Error(`Square ${cell.id}: cannot read its Icelandic letter. Wait for the board to finish rendering and import again.`);return {letter,blank};}
 for(const cell of cells){const match=cell.id.match(/^sq_([A-O])(\d+)$/),r=match[1].charCodeAt(0)-65,c=+match[2]-1;let tile=read(cell,false);if(cell.querySelector('.tile.racktile')){pending++;tile=null;}board[r][c]=tile;const list=cell.classList;multipliers[r][c]={letter:list.contains('dl')?2:list.contains('tl')?3:1,word:list.contains('dw')?2:list.contains('tw')?3:1};}
 for(let i=0;i<7;i++){const cell=d.getElementById('sq_R'+(i+1));rack[i]=read(cell,true)?.letter||'';}
 // Preserve unsubmitted tiles as rack tiles in the private snapshot, without moving them live.
 for(const cell of cells)if(cell.querySelector('.tile.racktile')){const t=read(cell,true),empty=rack.indexOf('');if(empty<0)throw Error('More than seven current rack tiles detected.');rack[empty]=t.letter;}
 return {detected:true,gameId:id,board,rack,multipliers,pending,source:'visible DOM'};
 }
 return {detected:false,gameId:id,blockedFrames:blocked,message:id?(blocked.length?'Game link detected, but the board is in a frame this page cannot read. Open that game frame in its own tab and tap the bookmark there.':'Game link detected, but no readable 15×15 board is present. Wait for the game to finish loading, then import again.'):'No Netskrafl game board detected. You can use the private editor.'};
}
