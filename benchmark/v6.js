import fs from 'node:fs';
import {runGames,pairedTasks} from './run.js';
const phase=process.argv[2]||'train',count=Number(process.argv[3]||20),seedStart=phase==='test'?62020000:61020000;
const tasks=pairedTasks({id:'v6'},[{id:'v5.2',v5:true}],Array.from({length:count},(_,i)=>seedStart+i));
const result=await runGames(tasks,{file:`benchmark/results/v6-${phase}.json`,workers:2});console.log(JSON.stringify(result.summary,null,2));
