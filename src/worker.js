import {Dawg} from './dawg.js';
import {solveStrategic} from './strategy.js';
let dictionary;
self.onmessage=async({data})=>{try{if(data.type==='init'){dictionary=new Dawg(data.buffer);postMessage({type:'ready'});}else{const result=await solveStrategic(data.board,data.rack,dictionary,data.multipliers,{...data.options,worker:true});postMessage({type:'result',id:data.id,...result});}}catch(e){postMessage({type:'error',message:e.message});}};
