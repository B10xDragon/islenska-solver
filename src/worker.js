import {Dawg} from './dawg.js';
import {solve} from './solver.js';
let dictionary;
self.onmessage=({data})=>{try{if(data.type==='init'){dictionary=new Dawg(data.buffer);postMessage({type:'ready'});}else{const result=solve(data.board,data.rack,dictionary,data.multipliers);postMessage({type:'result',id:data.id,...result});}}catch(e){postMessage({type:'error',message:e.message});}};
