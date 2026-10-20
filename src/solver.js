import {ALPHABET} from './dictionary.js';
import {DEFAULT_VALUES,breakdown} from './scoring.js';
// Generator yields between bounded chunks so fallback execution remains responsive.
export function* generate(board,rack,dictionary,multipliers,options={}){
 const started=performance.now(),n=board.length,inside=(r,c)=>r>=0&&c>=0&&r<n&&c<n,occupied=board.some(row=>row.some(Boolean)),anchors=new Set(),values=options.values||DEFAULT_VALUES;
 const value=t=>t.blank?0:values[t.letter]??0;
 for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!board[r][c]&&(!occupied?r===Math.floor(n/2)&&c===Math.floor(n/2):[[1,0],[-1,0],[0,1],[0,-1]].some(([dr,dc])=>inside(r+dr,c+dc)&&board[r+dr][c+dc])))anchors.add(r*n+c);
 const boardKey=options.crossCache?board.map(row=>row.map(t=>t?(t.blank?t.letter.toLowerCase():t.letter):'.').join('')).join('/'):'';
 const cacheScope=options.crossCache?dictionaryScope(dictionary,values):'';
 const counts=new Map();for(const c of rack)counts.set(c,(counts.get(c)||0)+1);const moves=[],seen=new Set();let nodes=0,legalMoves=0;
 for(const direction of ['horizontal','vertical']){const dr=direction==='vertical'?1:0,dc=1-dr,cacheKey=cacheScope+'|'+boardKey+'|'+direction,cross=options.crossCache?.get(cacheKey)||new Map();
 if(!cross.size)for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(!board[r][c]){let pre='',post='',sum=0;for(let rr=r-dc,cc=c-dr;inside(rr,cc)&&board[rr][cc];rr-=dc,cc-=dr){pre=board[rr][cc].letter+pre;sum+=value(board[rr][cc]);}for(let rr=r+dc,cc=c+dr;inside(rr,cc)&&board[rr][cc];rr+=dc,cc+=dr){post+=board[rr][cc].letter;sum+=value(board[rr][cc]);}cross.set(r*n+c,{has:!!(pre||post),sum,allowed:pre||post?crossLetters(dictionary,pre,post):null});}
 if(options.crossCache&&!options.crossCache.has(cacheKey)){if(options.crossCache.size>=128)options.crossCache.delete(options.crossCache.keys().next().value);options.crossCache.set(cacheKey,cross);}
 const starts=new Set();for(const a of anchors){let r=Math.floor(a/n),c=a%n,empty=0;while(inside(r,c)){if(!board[r][c])empty++;if(empty>rack.length)break;if(!inside(r-dr,c-dc)||!board[r-dr][c-dc])starts.add(r*n+c);r-=dr;c-=dc;}}
 for(const start of starts){const sr=Math.floor(start/n),sc=start%n;
 function* walk(r,c,node,word,tiles,touches,subtotal,wordMultiplier,crossTotal){if(++nodes%1024===0){if(options.shouldCancel?.())throw Error('Search cancelled.');if(options.deadline&&performance.now()>options.deadline)throw Error('analysis-budget');yield null;}const on=inside(r,c),cell=on?board[r][c]:null;
 if(node.end&&word.length>=2&&tiles.length&&touches&&!cell){const key=tiles.map(t=>`${t.row},${t.column},${t.letter},${+t.blank}`).sort().join(';');if(!seen.has(key)){seen.add(key);legalMoves++;const score=subtotal*wordMultiplier+crossTotal+(tiles.length===(options.rackSize??7)?options.bingoBonus??50:0);if(!options.bestOnly||!moves.length||moves[0].score<score){if(options.bestOnly)moves.length=0;moves.push({word,row:sr,col:sc,column:sc,direction,placedTiles:tiles.map(t=>({...t,col:t.column})),score});}}}
 if(!on)return;if(cell){const child=node.children.get(cell.letter);if(child)yield*walk(r+dr,c+dc,child,word+cell.letter,tiles,touches,subtotal+value(cell),wordMultiplier,crossTotal);return;}if(tiles.length>=rack.length)return;
 const x=cross.get(r*n+c),m=multipliers[r][c];for(const[letter,child]of node.children){if(x.allowed&&!x.allowed.has(letter))continue;for(const token of [letter,'?']){if(token==='?'&&options.blankEnabled===false)continue;const available=counts.get(token)||0;if(!available)continue;counts.set(token,available-1);const tile={row:r,column:c,letter,blank:token==='?'},v=value(tile)*m.letter;tiles.push(tile);yield*walk(r+dr,c+dc,child,word+letter,tiles,touches||anchors.has(r*n+c),subtotal+v,wordMultiplier*m.word,crossTotal+(x.has?(x.sum+v)*m.word:0));tiles.pop();counts.set(token,available);}}
 }yield*walk(sr,sc,typeof dictionary.root==='function'?dictionary.root():dictionary.root,'',[],false,0,1,0);
 }}moves.sort((a,b)=>b.score-a.score);for(const move of (options.bestOnly||options.includeBreakdown===false?[]:moves.slice(0,100)))move.breakdown=breakdown(board,multipliers,move,values,options);return {bestMove:moves[0]||null,moves,stats:{nodes,anchors:anchors.size,legalMoves,ms:performance.now()-started}};
}
export function solve(...args){const it=generate(...args);let next;do{next=it.next();}while(!next.done);return next.value;}
export async function solveAsync(...args){const it=generate(...args);let next;do{next=it.next();if(!next.done)await new Promise(r=>setTimeout(r,0));}while(!next.done);return next.value;}

const dictionaryIds=new WeakMap();let nextDictionaryId=0;
function dictionaryScope(dictionary,values){if(!dictionaryIds.has(dictionary))dictionaryIds.set(dictionary,++nextDictionaryId);return dictionaryIds.get(dictionary)+'|'+JSON.stringify(Object.entries(values).sort());}

function crossLetters(dictionary,pre,post){let node=typeof dictionary.root==='function'?dictionary.root():dictionary.root;for(const letter of pre){node=node.children.get(letter);if(!node)return new Set();}const result=new Set();for(const [letter,child]of node.children){let tail=child;for(const c of post){tail=tail.children.get(c);if(!tail)break;}if(tail?.end)result.add(letter);}return result;}
