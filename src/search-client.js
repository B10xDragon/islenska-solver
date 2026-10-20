import {Dawg} from './dawg.js';
import {loadDictionary} from './dictionary-cache.js';
import {solveStrategic} from './strategy.js';
export function createSearchClient({window:w=window,dictionaryUrl}) {
 let ready,dictionary,worker,workerUrl,request=0,pending=null,destroyed=false,epoch=0;
 function stopWorker(error){worker?.terminate();worker=null;if(workerUrl){w.URL.revokeObjectURL(workerUrl);workerUrl=null;}if(pending){w.clearTimeout(pending.timer);pending.reject(error);pending=null;}}
 function prepare(status=()=>{}) {
  const preparingEpoch=epoch;
  if(!ready)ready=(async()=>{
   const buffer=await loadDictionary(status,dictionaryUrl);if(destroyed||preparingEpoch!==epoch)throw Error('Search cancelled.');dictionary=new Dawg(buffer);
   try{workerUrl=w.URL.createObjectURL(new w.Blob([WORKER_SOURCE],{type:'application/javascript'}));worker=new w.Worker(workerUrl);
    worker.onmessage=({data})=>{if(data.type==='error'){stopWorker(Error(data.message));return;}if(!pending||data.id!==pending.id)return;const current=pending;w.clearTimeout(current.timer);pending=null;if(data.type==='result')current.resolve(data);else current.reject(Error(data.message));};
    worker.onerror=event=>{event.preventDefault?.();stopWorker(Error(event.message||'Worker unavailable.'));};worker.postMessage({type:'init',buffer});
   }catch{stopWorker(Error('Worker unavailable.'));}
  })().catch(error=>{if(preparingEpoch===epoch)ready=null;throw error;});return ready;
 }
 let queue=Promise.resolve();const client={prepare,async solve(snapshot,options={}){const generation=epoch;await prepare();if(generation!==epoch)throw Error('Search cancelled.');if(destroyed)throw Error('Solver closed.');if(!worker)return solveStrategic(snapshot.board,snapshot.rack.filter(Boolean),dictionary,snapshot.multipliers,{...options,shouldCancel:()=>destroyed||generation!==epoch});
   try{return await new Promise((resolve,reject)=>{const id=++request;pending={id,resolve,reject,timer:w.setTimeout(()=>stopWorker(Error('Worker response timed out.')),45000)};worker.postMessage({type:'solve',id,board:snapshot.board,rack:snapshot.rack.filter(Boolean),multipliers:snapshot.multipliers,options});});}
   catch(error){if(destroyed||generation!==epoch)throw error;stopWorker(error);return solveStrategic(snapshot.board,snapshot.rack.filter(Boolean),dictionary,snapshot.multipliers,{...options,shouldCancel:()=>destroyed||generation!==epoch});}
  },cancel(){epoch++;stopWorker(Error('Search cancelled.'));ready=null;},destroy(){epoch++;destroyed=true;stopWorker(Error('Solver closed.'));dictionary=null;}};return {...client,solve(...args){const generation=epoch;const next=queue.then(()=>{if(generation!==epoch)throw Error('Search cancelled.');return client.solve(...args).then(result=>{if(result.moves.length>50){result.moves=result.moves.slice(0,50);result.uiMovesLimited=true;}return result;});});queue=next.catch(()=>{});return next;}};
}
