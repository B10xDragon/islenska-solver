import fs from 'node:fs';
import {solveStrategic} from '../src/strategy.js';
import {solveStrategic as old} from './v5/strategy.js';
import {Dawg} from '../src/dawg.js';
import {standardMultipliers} from '../src/board.js';
import {quantile,mean} from './statistics.js';
const bytes=fs.readFileSync('public/dictionary.bin'),positions=JSON.parse(fs.readFileSync('benchmark/results/positions.json')),rows=[];
for(let repeat=0;repeat<3;repeat++)for(const p of positions)for(const [name,run] of repeat%2?[['v6',solveStrategic],['v5',old]]:[['v5',old],['v6',solveStrategic]]){const d=new Dawg(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),s=p.snapshot;const r=await run(s.board,s.rack,d,standardMultipliers(),{headless:true,worker:true,analysis:'balanced',myScore:s.myScore,opponentScore:s.opponentScore,consecutivePasses:null,endgameOptions:{maxNodes:500,timeBudgetMs:Infinity}});rows.push({name,position:p.name,repeat,generationMs:r.stats.generationMs,strategyMs:r.stats.strategyMs,totalMs:r.stats.totalMs,word:r.bestMove?.word,score:r.bestMove?.score,nodes:r.stats.nodes});}
const summary={};for(const name of ['v5','v6']){summary[name]={};for(const key of ['generationMs','strategyMs','totalMs']){const a=rows.filter(r=>r.name===name).map(r=>r[key]);summary[name][key]={median:quantile(a,.5),p95:quantile(a,.95),mean:mean(a),worst:Math.max(...a)};}}
fs.writeFileSync('benchmark/results/v6-latency.json',JSON.stringify({method:'Interleaved cold-DAWG Node measurements, 14 fixed positions × 3 repeats per version. Not a physical iPad benchmark.',summary,rows},null,2)+'\n');console.log(summary);
