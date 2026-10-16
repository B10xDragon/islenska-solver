// Run only after validation and TRAIN-position performance analysis, before final test.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
export function finalize(){
 if(fs.existsSync('benchmark/results/final-test.json'))throw Error('Final test already unsealed. Use a new experiment directory and fresh holdout seeds; do not retune this release.');
 const path='benchmark/results/',c=JSON.parse(fs.readFileSync(path+'optimized-strategy.json'));
 c.version='5.0.0';
 c.analysis={fast:{samples:0,candidates:10,timeBudgetMs:500},balanced:{samples:0,candidates:30,timeBudgetMs:1500},deep:{samples:16,candidates:10,timeBudgetMs:12000}};
 c.provenance={method:'Seeded random/local search, eight-way tournament, paired validation; latency tie-break among statistically indistinguishable finalists',games:576,selection:c.id,samplingWeights:'Unidentified by zero-sample self-play; restored to v4 priors',performance:'Balanced uses all-move heuristics: sampled candidate rounds took seconds on two held training positions'};
 c.weights.opponentScoreWeight=.55;c.weights.opponentP90Weight=.12;for(const phase of Object.values(c.phases))if('opponentScoreWeight'in phase)phase.opponentScoreWeight=1;
 const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
 const lock=JSON.parse(fs.readFileSync(path+'selection-lock.json'));lock.configuration=c;lock.configurationSHA256=createHash('sha256').update(JSON.stringify(stable(c)).replace(/[^\x00-\x7F]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'))).digest('hex');lock.finalizedBeforeTest=true;
 fs.writeFileSync(path+'optimized-strategy.json',JSON.stringify(c,null,2)+'\n');fs.writeFileSync(path+'selection-lock.json',JSON.stringify(lock,null,2)+'\n');
 fs.writeFileSync('src/optimized-strategy.js','// Selected by seeded self-play and held-out validation, before final-test evaluation.\n// See benchmark-report.md for uncertainty, complete parameters, and performance limits.\nexport const OPTIMIZED_STRATEGY = '+JSON.stringify(c,null,2)+';\n');
}
if(process.argv[1]?.endsWith('/finalize.js'))finalize();
