import {RULES} from './rules.js';
export const DEFAULT_VALUES=RULES.scores;
export function breakdown(board,multipliers,move,values=DEFAULT_VALUES,{rackSize=7,bingoBonus=50}={}){
 const n=board.length,dr=move.direction==='vertical'?1:0,dc=1-dr,placed=new Map(move.placedTiles.map(t=>[`${t.row},${t.column??t.col}`,t]));let sum=0,wm=1;const crosses=[];const value=t=>t.blank?0:values[t.letter]??0;
 for(let i=0;i<move.word.length;i++){const r=move.row+dr*i,c=(move.column??move.col)+dc*i,t=placed.get(`${r},${c}`);if(!t){sum+=value(board[r][c]);continue;}const m=multipliers[r][c];sum+=value(t)*m.letter;wm*=m.word;let cs=0,pre='',post='';for(let rr=r-dc,cc=c-dr;rr>=0&&cc>=0&&rr<n&&cc<n&&board[rr][cc];rr-=dc,cc-=dr){cs+=value(board[rr][cc]);pre=board[rr][cc].letter+pre;}for(let rr=r+dc,cc=c+dr;rr>=0&&cc>=0&&rr<n&&cc<n&&board[rr][cc];rr+=dc,cc+=dr){cs+=value(board[rr][cc]);post+=board[rr][cc].letter;}if(pre||post)crosses.push({word:pre+t.letter+post,score:(cs+value(t)*m.letter)*m.word});
 }const main=sum*wm,bonus=move.placedTiles.length===rackSize?bingoBonus:0;return {main,crosses,bonus,total:main+crosses.reduce((a,c)=>a+c.score,0)+bonus};
}
export function scoreMove(...args){return breakdown(...args).total;}
