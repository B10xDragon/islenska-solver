import {FEATURE_CONFIG as F} from './strategy-config.js';
import {ALPHABET} from './dictionary.js';
import {DEFAULT_VALUES} from './scoring.js';
const hookCaches=new WeakMap();
export function legalHooks(word,dictionary){let cache=hookCaches.get(dictionary);if(!cache)hookCaches.set(dictionary,cache=new Map());if(cache.has(word))return cache.get(word);const result={front:[...ALPHABET].filter(l=>dictionary.has(l+word)),back:[...ALPHABET].filter(l=>dictionary.has(word+l))};if(cache.size>20000)cache.clear();cache.set(word,result);return result;}
export const countLegalFrontHooks=(word,dictionary)=>legalHooks(word,dictionary).front.length;
export const countLegalBackHooks=(word,dictionary)=>legalHooks(word,dictionary).back.length;
export function boardFeatures(board,multipliers,dictionary){
 const n=board.length,inside=(r,c)=>r>=0&&c>=0&&r<n&&c<n,anchors=new Set(),premium=new Map();let parallel=0,longLanes=0,hooks=0,frontHooks=0,backHooks=0;
 for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!board[r][c]){
  const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dr,dc])=>inside(r+dr,c+dc)&&board[r+dr][c+dc]);if(adjacent.length)anchors.add(r*n+c);
  for(const [dr,dc]of [[1,0],[0,1]]){
   if(!inside(r-dr,c-dc)||board[r-dr][c-dc]){let length=0,touches=0;for(let rr=r,cc=c;inside(rr,cc)&&!board[rr][cc];rr+=dr,cc+=dc){length++;if([[dc,dr],[-dc,-dr]].some(([a,b])=>inside(rr+a,cc+b)&&board[rr+a][cc+b]))touches++;}if(length>=7&&touches)longLanes++;if(touches>=2)parallel+=touches-1;}
  }
  const m=multipliers[r][c];if(m.word===1&&m.letter===1)continue;
  let access=0;for(const [dr,dc]of [[1,0],[-1,0],[0,1],[0,-1]])for(let d=1;d<=F.reach;d++){const rr=r+dr*d,cc=c+dc*d;if(!inside(rr,cc))break;if(board[rr][cc]){let value=0;for(let a=rr,b=cc;inside(a,b)&&board[a][b];a+=dr,b+=dc)value+=board[a][b].blank?0:DEFAULT_VALUES[board[a][b].letter]||0;access=Math.max(access,(F.reach+1-d)/F.reach*(1+value/F.valueScale));break;}}
  if(adjacent.length)access=Math.max(access,1+adjacent.length*F.adjacency);premium.set(r*n+c,{type:m.word===3?'TW':m.word===2?'DW':m.letter===3?'TL':'DL',access});
 }
 if(dictionary)for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(board[r][c])for(const [dr,dc]of [[1,0],[0,1]]){if(inside(r-dr,c-dc)&&board[r-dr][c-dc])continue;let word='',rr=r,cc=c;while(inside(rr,cc)&&board[rr][cc]){word+=board[rr][cc].letter;rr+=dr;cc+=dc;}if(word.length<2)continue;const h=legalHooks(word,dictionary);if(inside(r-dr,c-dc)){hooks+=h.front.length;frontHooks+=h.front.length;}if(inside(rr,cc)){hooks+=h.back.length;backHooks+=h.back.length;}}
 return {anchors:anchors.size,parallel,longLanes,hooks,frontHooks,backHooks,premium};
}
export function boardOpenScore(board,multipliers,dictionary){const f=boardFeatures(board,multipliers,dictionary);return openness(f);}
export function openness(f){return f.anchors*F.anchor+f.parallel*F.parallel+f.longLanes*F.longLane+f.hooks*F.hook;}
export function analyzeBoardDanger(before,after,multipliers,dictionary,beforeFeatures){const a=beforeFeatures||boardFeatures(before,multipliers,dictionary),b=boardFeatures(after,multipliers,dictionary),exposure={TW:0,DW:0,TL:0,DL:0};for(const [key,p]of b.premium)exposure[p.type]+=Math.max(0,p.access-(a.premium.get(key)?.access||0));return {exposure,anchors:b.anchors-a.anchors,frontHooks:Math.max(0,b.frontHooks-a.frontHooks),backHooks:Math.max(0,b.backHooks-a.backHooks),parallelPlayRisk:Math.max(0,b.parallel-a.parallel),hookRisk:Math.max(0,b.hooks-a.hooks),bingoLanes:Math.max(0,b.longLanes-a.longLanes),opennessDelta:openness(b)-openness(a),beforeOpenScore:openness(a),afterOpenScore:openness(b)};}
