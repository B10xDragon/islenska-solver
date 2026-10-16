import {solve} from '../../src/solver.js';
import {placeMove} from '../../src/board.js';
import {DEFAULT_VALUES} from '../../src/scoring.js';
const rackScore=(r,values=DEFAULT_VALUES)=>r.reduce((s,l)=>s+(values[l]||0),0);
export function solveEndgame(board,myRack,opponentRack,dictionary,multipliers,{maxNodes=100000,timeBudgetMs=3000,maxDepth=96,passes=0,solveOptions={}}={}){
 const start=performance.now(),cache=new Map(),moveCache=new Map();let nodes=0,cutoffs=0;
 const key=(b,a,z,turn,p)=>b.map(row=>row.map(t=>t?(t.blank?t.letter.toLowerCase():t.letter):'.').join('')).join('/')+'|'+[...a].sort().join('')+'|'+[...z].sort().join('')+'|'+turn+'|'+p;
 function search(b,racks,turn,p,depth,alpha,beta){
  if(++nodes>maxNodes||performance.now()-start>timeBudgetMs)throw Error('budget');
  if(!racks[0].length)return {value:2*rackScore(racks[1],solveOptions.values),complete:true};if(!racks[1].length)return {value:-2*rackScore(racks[0],solveOptions.values),complete:true};
  if(p>=6)return {value:rackScore(racks[1],solveOptions.values)-rackScore(racks[0],solveOptions.values),complete:true};
  if(!depth)return {value:rackScore(racks[1],solveOptions.values)-rackScore(racks[0],solveOptions.values),complete:false};
  const k=key(b,...racks,turn,p),cached=cache.get(k+'|'+depth);if(cached)return cached;
  const mk=key(b,racks[turn],[],0,0);let moves=moveCache.get(mk);if(!moves){moves=solve(b,racks[turn],dictionary,multipliers,solveOptions).moves;moveCache.set(mk,moves);}
  const initialAlpha=alpha,initialBeta=beta;let best=turn===0?-Infinity:Infinity,bestMove=null,complete=true,pruned=false;
  for(const move of [...moves,null]){const next=move?placeMove(b,racks[turn],move):{board:b,rack:racks[turn]},nr=[...racks];nr[turn]=next.rack;const delta=move?(turn===0?move.score:-move.score):0;const child=search(next.board,nr,1-turn,move?0:p+1,depth-1,alpha-delta,beta-delta),v=delta+child.value;complete&&=child.complete;
   if(turn===0?v>best:v<best){best=v;bestMove=move;}if(turn===0)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);if(alpha>=beta){cutoffs++;pruned=true;break;}}
  const result={value:best,bestMove,complete};if(!pruned&&best>initialAlpha&&best<initialBeta)cache.set(k+'|'+depth,result);return result;
 }
 let result=null,depth=0;try{for(let d=1;d<=maxDepth;d++){const next=search(board,[myRack,opponentRack],0,passes,d,-Infinity,Infinity);result=next;depth=d;if(next.complete)break;}}catch(e){if(e.message!=='budget')throw e;}
 return {bestMove:result?.bestMove||null,finalScoreSwing:result?.value??null,exact:!!result?.complete,depth,nodes,cutoffs,ms:performance.now()-start,pass:!!result&&!result.bestMove&&myRack.length>0&&opponentRack.length>0};
}
