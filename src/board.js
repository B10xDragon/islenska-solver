import {RULES} from './rules.js';
import {ALPHABET,normalize} from './dictionary.js';
export function createBoard(size=15){return Array.from({length:size},()=>Array(size).fill(null));}
export function standardMultipliers(size=15){return Array.from({length:size},(_,r)=>Array.from({length:size},(_,c)=>({letter:size===15?Number(RULES._LSC[r][c])||1:1,word:size===15?Number(RULES._WSC[r][c])||1:1})));}
export function parseRack(text,{blankEnabled=true,rackSize=7}={}){const r=[...normalize(text).replace(/\s/g,'')];if(r.length>rackSize||r.some(c=>!ALPHABET.includes(c)&&!(c==='?'&&blankEnabled)))throw Error(`Rack must contain at most ${rackSize} Icelandic letters${blankEnabled?' or ? blanks':''}.`);return r;}
export function placeMove(board,rack,move){
 if(!move?.placedTiles.length)throw Error('No move to place.');const next=board.map(row=>row.map(t=>t?{...t}:null)),remaining=[...rack],seen=new Set();
 for(const t of move.placedTiles){const key=`${t.row},${t.column}`;if(!next[t.row]||t.column<0||t.column>=next.length||next[t.row][t.column]||seen.has(key))throw Error('Board changed; solve again.');seen.add(key);const i=remaining.indexOf(t.blank?'?':t.letter);if(i<0)throw Error('Rack changed; solve again.');remaining.splice(i,1);next[t.row][t.column]={letter:t.letter,blank:!!t.blank};}return {board:next,rack:remaining};
}
