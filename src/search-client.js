import {Dawg} from './dawg.js';
import {loadDictionary} from './dictionary-cache.js';
import {solveStrategic} from './strategy.js';
export function createSearchClient({window:w=window,dictionaryUrl}) {
 let ready,dictionary,worker,workerUrl,request=0,pending=null,destroyed=false;
 function stopWorker(error){worker?.terminate();worker=null;if(workerUrl){w.URL.revokeObjectURL(workerUrl);workerUrl=null;}if(pending){pending.reject(error);pending=null;}}
 function prepare(status=()=>{}) {
  if(!ready)ready=(async()=>{
   const buffer=await loadDictionary(status,dictionaryUrl);if(destroyed)throw Error('Solver closed.');dictionary=new Dawg(buffer);
   try{workerUrl=w.URL.createObjectURL(new w.Blob([WORKER_SOURCE],{type:'application/javascript'}));worker=new w.Worker(workerUrl);
    worker.onmessage=({data})=>{if(data.type==='error'){stopWorker(Error(data.message));return;}if(!pending||data.id!==pending.id)return;const current=pending;pending=null;if(data.type==='result')current.resolve(data);else current.reject(Error(data.message));};
    worker.onerror=event=>{event.preventDefault?.();stopWorker(Error(event.message||'Worker unavailable.'));};worker.postMessage({type:'init',buffer});
   }catch{stopWorker(Error('Worker unavailable.'));}
  })().catch(error=>{ready=null;throw error;});return ready;
 }
 let queue=Promise.resolve();const client={prepare,async solve(snapshot,options={}){await prepare();if(destroyed)throw Error('Solver closed.');if(!worker)return solveStrategic(snapshot.board,snapshot.rack.filter(Boolean),dictionary,snapshot.multipliers,options);
   try{return await new Promise((resolve,reject)=>{const id=++request;pending={id,resolve,reject};worker.postMessage({type:'solve',id,board:snapshot.board,rack:snapshot.rack.filter(Boolean),multipliers:snapshot.multipliers,options});});}
   catch(error){if(destroyed)throw error;stopWorker(error);return solveStrategic(snapshot.board,snapshot.rack.filter(Boolean),dictionary,snapshot.multipliers,options);}
  },destroy(){destroyed=true;stopWorker(Error('Solver closed.'));dictionary=null;}};return {...client,solve(...args){const next=queue.then(()=>client.solve(...args));queue=next.catch(()=>{});return next;}};
}
