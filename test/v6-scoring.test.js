import test from 'node:test';import assert from 'node:assert/strict';
import {createBoard,standardMultipliers} from '../src/board.js';import {Dictionary} from '../src/dictionary.js';import {solve} from '../src/solver.js';import {seededRandom} from '../src/tile-tracking.js';
const words=['AA','AT','TA','AR','RA','TAR','ART','RAT','ATA','TATA','ÞÁ','ÁR','RÁ','RATA','TARA'],values={A:1,T:2,R:1,Á:3,Þ:7};
// Deliberately independent: enumerate full words, coordinates and every real/blank
// assignment, then calculate points without calling production scoring functions.
function exhaustive(board,rack,m){let best=null;const n=board.length,inside=(r,c)=>r>=0&&c>=0&&r<n&&c<n,occupied=board.some(row=>row.some(Boolean)),value=t=>t.blank?0:values[t.letter];
 for(const word of words)for(const [dr,dc]of [[1,0],[0,1]])for(let row=0;row<n;row++)for(let col=0;col<n;col++){
  if(!inside(row+dr*(word.length-1),col+dc*(word.length-1))||inside(row-dr,col-dc)&&board[row-dr][col-dc]||inside(row+dr*word.length,col+dc*word.length)&&board[row+dr*word.length][col+dc*word.length])continue;
  function assign(i,remaining,tiles){if(i===word.length){if(!tiles.length)return;const map=new Map(tiles.map(t=>[t.row*n+t.col,t]));let sum=0,mult=1,crossTotal=0,touches=false;
   for(let j=0;j<word.length;j++){const r=row+dr*j,c=col+dc*j,old=board[r][c],t=map.get(r*n+c);if(old){sum+=value(old);touches=true;continue;}sum+=value(t)*m[r][c].letter;mult*=m[r][c].word;
    let pre='',post='',cross=0;for(let a=r-dc,b=c-dr;inside(a,b)&&board[a][b];a-=dc,b-=dr){pre=board[a][b].letter+pre;cross+=value(board[a][b]);}for(let a=r+dc,b=c+dr;inside(a,b)&&board[a][b];a+=dc,b+=dr){post+=board[a][b].letter;cross+=value(board[a][b]);}
    if(pre||post){if(!words.includes(pre+t.letter+post))return;touches=true;crossTotal+=(cross+value(t)*m[r][c].letter)*m[r][c].word;}if(!occupied&&r===2&&c===2)touches=true;
   }if(touches)best=Math.max(best??-Infinity,sum*mult+crossTotal+(tiles.length===4?50:0));return;}
   const r=row+dr*i,c=col+dc*i;if(board[r][c]){if(board[r][c].letter===word[i])assign(i+1,remaining,tiles);return;}
   for(const token of [word[i],'?']){const index=remaining.indexOf(token);if(index<0)continue;const next=[...remaining];next.splice(index,1);assign(i+1,next,[...tiles,{row:r,col:c,letter:word[i],blank:token==='?'}]);}
  }assign(0,rack,[]);
 }return best;}
test('V6 agrees with independent blank/multiplier/bingo oracle on 60 seeded boards',()=>{const rng=seededRandom(68020),dictionary=new Dictionary(words);for(let i=0;i<60;i++){const board=createBoard(5),m=standardMultipliers(5);if(i%3)board[2][2]={letter:i%2?'A':'T',blank:i%5===0};if(i%4===0)board[2][3]={letter:'A'};for(const row of m)for(const square of row){if(rng()<.15)square.word=rng()<.5?2:3;if(rng()<.15)square.letter=rng()<.5?2:3;}const rack=[...(i%2?'TA??':'AR?Á')],actual=solve(board,rack,dictionary,m,{values,rackSize:4,bingoBonus:50});assert.equal(actual.bestMove?.score??null,exhaustive(board,rack,m),'fixture '+i);}});
