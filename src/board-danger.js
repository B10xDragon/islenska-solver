import {FEATURE_CONFIG as F} from './strategy-config.js';
import {ALPHABET} from './dictionary.js';
import {DEFAULT_VALUES} from './scoring.js';
const hookCaches=new WeakMap();
export function legalHooks(word,dictionary){let cache=hookCaches.get(dictionary);if(!cache)hookCaches.set(dictionary,cache=new Map());if(cache.has(word))return cache.get(word);const result={front:[...ALPHABET].filter(l=>dictionary.has(l+word)),back:[...ALPHABET].filter(l=>dictionary.has(word+l))};if(cache.size>20000)cache.clear();cache.set(word,result);return result;}
export const countLegalFrontHooks=(word,dictionary)=>legalHooks(word,dictionary).front.length;
export const countLegalBackHooks=(word,dictionary)=>legalHooks(word,dictionary).back.length;
export function boardFeatures(board,multipliers,dictionary){
 // Four linear sweeps replace a ray walk from every premium square.
 const n=board.length,total=n*n,access=new Float64Array(total);
 let anchors=0,parallel=0,longLanes=0,frontHooks=0,backHooks=0;
 for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!board[r][c]){const a=+(r>0&&!!board[r-1][c]) + +(r+1<n&&!!board[r+1][c]) + +(c>0&&!!board[r][c-1]) + +(c+1<n&&!!board[r][c+1]);if(a){anchors++;access[r*n+c]=1+a*F.adjacency;}}
 for(let axis=0;axis<2;axis++)for(let line=0;line<n;line++){
  const at=i=>axis?board[i][line]:board[line][i],index=i=>axis?i*n+line:line*n+i;
  // Each contiguous empty run is a possible lane; perpendicular adjacency matters.
  for(let i=0;i<n;){if(at(i)){i++;continue;}const start=i;let touches=0;while(i<n&&!at(i)){const r=axis?i:line,c=axis?line:i;if(axis?(c>0&&board[r][c-1]||c+1<n&&board[r][c+1]):(r>0&&board[r-1][c]||r+1<n&&board[r+1][c]))touches++;i++;}if(i-start>=7&&touches)longLanes++;if(touches>=2)parallel+=touches-1;}
  for(const direction of [1,-1]){let distance=F.reach+1,value=0,occupied=false;
   for(let i=direction===1?0:n-1;i>=0&&i<n;i+=direction){const t=at(i);if(t){value=(occupied?value:0)+(t.blank?0:DEFAULT_VALUES[t.letter]||0);distance=0;occupied=true;}else{distance++;occupied=false;if(distance<=F.reach){const k=index(i);access[k]=Math.max(access[k],(F.reach+1-distance)/F.reach*(1+value/F.valueScale));}}}
  }
  if(dictionary)for(let i=0;i<n;){if(!at(i)){i++;continue;}const start=i;let word='';while(i<n&&at(i))word+=at(i++).letter;if(word.length<2)continue;const h=legalHooks(word,dictionary);if(start>0)frontHooks+=h.front.length;if(i<n)backHooks+=h.back.length;}
 }
 const premium=new Map();for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!board[r][c]){const m=multipliers[r][c];if(m.word===1&&m.letter===1)continue;premium.set(r*n+c,{type:m.word===3?'TW':m.word===2?'DW':m.letter===3?'TL':'DL',access:access[r*n+c]});}
 return {anchors,parallel,longLanes,hooks:frontHooks+backHooks,frontHooks,backHooks,premium};
}
export function boardOpenScore(board,multipliers,dictionary){const f=boardFeatures(board,multipliers,dictionary);return openness(f);}
export function openness(f){return f.anchors*F.anchor+f.parallel*F.parallel+f.longLanes*F.longLane+f.hooks*F.hook;}
export function analyzeBoardDanger(before,after,multipliers,dictionary,beforeFeatures){const a=beforeFeatures||boardFeatures(before,multipliers,dictionary),b=boardFeatures(after,multipliers,dictionary),exposure={TW:0,DW:0,TL:0,DL:0};for(const [key,p]of b.premium)exposure[p.type]+=Math.max(0,p.access-(a.premium.get(key)?.access||0));return {exposure,anchors:b.anchors-a.anchors,frontHooks:Math.max(0,b.frontHooks-a.frontHooks),backHooks:Math.max(0,b.backHooks-a.backHooks),parallelPlayRisk:Math.max(0,b.parallel-a.parallel),hookRisk:Math.max(0,b.hooks-a.hooks),bingoLanes:Math.max(0,b.longLanes-a.longLanes),opennessDelta:openness(b)-openness(a),beforeOpenScore:openness(a),afterOpenScore:openness(b)};}
