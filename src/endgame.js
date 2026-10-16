import {SEARCH_CONFIG} from './strategy-config.js';
import {searchPositionKey} from './search-key.js';
import {solve} from './solver.js';
import {placeMove} from './board.js';
import {DEFAULT_VALUES} from './scoring.js';
const rackScore=(r,values=DEFAULT_VALUES)=>r.reduce((s,l)=>s+(values[l]||0),0);
export function solveEndgame(board,myRack,opponentRack,dictionary,multipliers,{maxNodes=SEARCH_CONFIG.endgameNodes,timeBudgetMs=3000,maxDepth=SEARCH_CONFIG.endgameDepth,passes=0,scoreDifference=0,solveOptions={},cacheEntries=SEARCH_CONFIG.cacheEntries,maxCachedMoves=20000}={}){
 const start=performance.now(),cache=new Map(),moveCache=new Map();let nodes=0,cutoffs=0,cachedMoves=0;const deadline=start+timeBudgetMs;
 const key=(board,rack,opponentRack,turn,passes,scoreDifference=0)=>searchPositionKey({board,rack,opponentRack,turn,passes,scoreDifference,bag:[]});
 let transpositionHits=0,moveCacheHits=0,lookups=0;
 function search(b,racks,turn,p,depth,alpha,beta,difference=scoreDifference){
  if(++nodes>maxNodes||performance.now()-start>timeBudgetMs)throw Error('budget');
  if(!racks[0].length)return {value:2*rackScore(racks[1],solveOptions.values),complete:true};if(!racks[1].length)return {value:-2*rackScore(racks[0],solveOptions.values),complete:true};
  if(p>=6)return {value:rackScore(racks[1],solveOptions.values)-rackScore(racks[0],solveOptions.values),complete:true};
  if(!depth)return {value:rackScore(racks[1],solveOptions.values)-rackScore(racks[0],solveOptions.values),complete:false};
  const k=key(b,...racks,turn,p,difference),cached=cache.get(k+'|'+depth);lookups++;if(cached){transpositionHits++;return cached;}
  const mk=key(b,racks[turn],[],0,0);let moves=moveCache.get(mk);if(moves)moveCacheHits++;if(!moves){moves=solve(b,racks[turn],dictionary,multipliers,{...solveOptions,deadline}).moves;if(moves.length<=maxCachedMoves){while(moveCache.size&&(cachedMoves+moves.length>maxCachedMoves||moveCache.size>=cacheEntries)){const first=moveCache.keys().next().value;cachedMoves-=moveCache.get(first).length;moveCache.delete(first);}moveCache.set(mk,moves);cachedMoves+=moves.length;}}
  const initialAlpha=alpha,initialBeta=beta;let best=turn===0?-Infinity:Infinity,bestMove=null,complete=true,pruned=false;
  for(const move of [...moves,null]){const next=move?placeMove(b,racks[turn],move):{board:b,rack:racks[turn]},nr=[...racks];nr[turn]=next.rack;const delta=move?(turn===0?move.score:-move.score):0;const child=search(next.board,nr,1-turn,move?0:p+1,depth-1,alpha-delta,beta-delta,difference+delta),v=delta+child.value;complete&&=child.complete;
   if(turn===0?v>best:v<best){best=v;bestMove=move;}if(turn===0)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);if(alpha>=beta){cutoffs++;pruned=true;break;}}
  const result={value:best,bestMove,complete};if(!pruned&&best>initialAlpha&&best<initialBeta){if(cache.size>=cacheEntries)cache.delete(cache.keys().next().value);cache.set(k+'|'+depth,result);}return result;
 }
 let result=null,depth=0;try{for(let d=1;d<=maxDepth;d++){const next=search(board,[myRack,opponentRack],0,passes,d,-Infinity,Infinity);result=next;depth=d;if(next.complete)break;}}catch(e){if(!['budget','analysis-budget'].includes(e.message))throw e;}
 return {bestMove:result?.bestMove||null,finalScoreSwing:result?.value??null,exact:!!result?.complete,depth,nodes,cutoffs,transpositionHits,moveCacheHits,lookups,cacheHitRate:lookups?transpositionHits/lookups:0,cachedPositions:moveCache.size,cachedMoves,transpositionEntries:cache.size,ms:performance.now()-start,pass:!!result&&!result.bestMove&&myRack.length>0&&opponentRack.length>0};
}
