import {positionKey,watchGame} from './live-game.js';
export function createAutomation({read,search,stage,submit,doc,onState=()=>{},watch=watchGame}) {
 let state={enabled:false,phase:'off',message:'Auto place and Leika OFF',bestMove:null,stats:null},watcher=null,active=null,destroyed=false,generation=0,plan=null;
 const attempted=new Set();
 function publish(phase,message,extra={}){state={...state,phase,message,...extra};onState({...state});}
 function matching(snapshot){return plan?.key===positionKey(snapshot)&&(snapshot.pendingTiles||[]).every(tile=>plan.move.placedTiles.some(t=>t.row===tile.row&&(t.col??t.column)===tile.col&&t.letter===tile.letter&&!!t.blank===!!tile.blank));}
 function consider(snapshot){
  if(destroyed||!state.enabled)return;
  const key=positionKey(snapshot);
  if(active){if(key!==active.key||(snapshot.pending&&!matching(snapshot)))active.controller.abort();return;}
  if(!snapshot?.detected){publish('waiting','Open a loaded game board.');return;}
  if(snapshot.canStage===false){publish('waiting',snapshot.stageReason||'Waiting for your turn.');return;}
  if(attempted.has(key))return;
  if(snapshot.pending&&!matching(snapshot)){publish('waiting','Finish or recall the unsubmitted move.');return;}
  if(!snapshot.rack.some(Boolean)){publish('waiting','Waiting for rack tiles.');return;}
  const task={key,controller:new AbortController(),generation};active=task;
  const valid=()=>!destroyed&&state.enabled&&task.generation===generation&&!task.controller.signal.aborted;
  function checked(){if(!valid())throw Error('Automation stopped.');const now=read();if(positionKey(now)!==key||now.canStage===false||(now.pending&&!matching(now)))throw Error('The position changed.');return now;}
  (async()=>{
   try{
    publish('loading','Loading Icelandic dictionary…');await search.prepare(message=>{if(valid())publish('loading',message);});checked();
    let move;if(plan?.key===key&&matching(read()))move=plan.move;
    else{publish('solving','Finding the highest-scoring move…');const result=await search.solve(snapshot);checked();move=result.bestMove;state={...state,bestMove:move,stats:result.stats};}
    if(!move){attempted.add(key);publish('waiting','No legal move available.');return;}
    plan={key,move};attempted.add(key);checked();publish('placing',`Placing ${move.word} · ${move.score} points`);
    await stage({move,expected:key,signal:task.controller.signal,onProgress:(done,total)=>{if(valid())publish('placing',`Placing ${move.word}: ${done}/${total}`);}});checked();
    publish('submitting','Waiting for Leika…');await submit({move,expected:key,signal:task.controller.signal,isEnabled:valid});
    if(valid())publish('waiting',`${move.word} submitted. Waiting for the next turn.`);
   }catch(error){if(valid()){attempted.add(key);publish('error',error.message);}}
   finally{if(active===task)active=null;if(!destroyed&&state.enabled)consider(read());}
  })();
 }
 function setEnabled(enabled){
  if(destroyed||state.enabled===!!enabled)return;
  generation++;state={...state,enabled:!!enabled};active?.controller.abort();watcher?.stop();watcher=null;
  if(!state.enabled){publish('off','Auto place and Leika OFF');return;}
  attempted.delete(positionKey(read()));publish('waiting','Auto place and Leika ON');
  watcher=watch({read,doc,onChange:consider});
 }
 publish('off','Auto place and Leika OFF');
 return {setEnabled,toggle(){setEnabled(!state.enabled);},refresh(){if(state.enabled)consider(read());},getState(){return {...state};},destroy(){setEnabled(false);destroyed=true;search.destroy();}};
}
