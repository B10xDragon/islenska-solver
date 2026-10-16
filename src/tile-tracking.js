import {RULES} from './rules.js';
// Unseen includes the opponent rack AND the draw bag. Exchanges return tiles;
// never subtract an exchange history a second time.
export function getUnseenTileBag(board,rack,{counts=RULES.counts,knownOutOfPlay=[]}={}){
 const bag={...counts},errors=[];
 for(const token of [...board.flat().filter(Boolean).map(t=>t.blank?'?':t.letter),...rack.filter(Boolean),...knownOutOfPlay]){if(!(token in bag)||--bag[token]<0)errors.push(`Inconsistent tile count: ${token}`);}
 return {counts:bag,tiles:Object.entries(bag).flatMap(([l,n])=>Array(Math.max(0,n)).fill(l)),valid:!errors.length,errors};
}
export function seededRandom(seed=1){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function sampleOpponentRack(unseen,random=Math.random,size=7){const tiles=[...(unseen.tiles||unseen)],rack=[];while(tiles.length&&rack.length<size)rack.push(tiles.splice(Math.floor(random()*tiles.length),1)[0]);return rack;}
export function gamePhase(board,unseen){return unseen.tiles.length<=14?'ENDGAME':board.flat().filter(Boolean).length<28?'EARLY':'MIDGAME';}
