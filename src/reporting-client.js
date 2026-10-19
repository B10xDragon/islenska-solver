import {matchedPlayers,committedMove,sameReportingGame} from './reporting-data.js';
import {REPORT_WEBHOOK} from './reporting-config.js';
export function createReporter({window:w,read,version,reportUrl,onChange=()=>{}}){
 let enabled=false,bridge=null,ready=false,dead=false,status='Reporting OFF. No player information is transmitted.',generation=0;
 const token=Array.from(w.crypto.getRandomValues(new Uint32Array(4)),x=>x.toString(16).padStart(8,'0')).join(''),origin=new URL(reportUrl).origin,seen=new Set(),waiters=new Map(),timers=new Set();
 const state=()=>({enabled,ready:ready&&!!bridge&&!bridge.closed,status});const publish=message=>{status=message;onChange(state());};
 function post(message){if(bridge&&!bridge.closed)bridge.postMessage({...message,token},origin);}
 function connect(){if(!enabled||dead)return;ready=false;const url=new URL(reportUrl);url.hash=new URLSearchParams({origin:w.location.origin,token}).toString();bridge=w.open(url.href,'islenska-report-'+token);publish(bridge?'Reporting tab opened. Keep it open and return to the game.':'Safari blocked the reporting tab. Tap Open reporting tab.');}
 function setEnabled(value){enabled=!!value&&!dead;generation++;if(enabled){connect();}else{post({type:'consent',enabled:false});ready=false;for(const timer of timers)w.clearTimeout(timer);timers.clear();publish('Reporting OFF. No new notifications will be sent.');}}
 function receive(e){if(e.source!==bridge||e.origin!==origin||e.data?.token!==token)return;const data=e.data;if(data.type==='ready'){if(enabled){ready=true;post({type:'consent',enabled:true,webhook:REPORT_WEBHOOK});publish('Reporting ON. Only matching, confirmed moves are shared.');}else post({type:'consent',enabled:false});}
 if(data.type==='result'){const pending=waiters.get(data.id);if(pending){w.clearTimeout(pending.timer);waiters.delete(data.id);publish(data.message);pending.resolve(data);}}
 if(data.type==='revoked'){enabled=false;generation++;ready=false;publish('Reporting was turned OFF in the reporting tab.');}}
 w.addEventListener('message',receive);
 async function send(fields,id){if(!enabled||dead||!matchedPlayers(fields).length)return {skipped:true};if(!ready||!bridge||bridge.closed){publish('Reporting tab unavailable. Open it before the next move; no notification sent.');return {skipped:true};}
 if(seen.has(id))return {duplicate:true};seen.add(id);publish('Sending Discord notification…');
 return new Promise(resolve=>{const timer=w.setTimeout(()=>{waiters.delete(id);publish('No delivery confirmation. This event will not be retried to avoid duplicates.');resolve({unknown:true});},20000);waiters.set(id,{resolve,timer});post({type:'report',id,fields:{...fields,version,timestamp:new Date().toISOString()}});});}
 async function observeSubmission({snapshot,move,key}){
  if(!enabled||dead)return;
  if(snapshot.botUser&&snapshot.opponent&&!matchedPlayers(snapshot).length){publish('No notification: neither displayed username matches jonsolvi12.');return;}
  const epoch=generation,start=Date.now();
  publish(snapshot.botUser&&snapshot.opponent?'Move submitted. Waiting for committed tiles before reporting…':'Move submitted. Waiting for both displayed usernames and committed tiles…');
  const check=async()=>{
   if(dead||!enabled||epoch!==generation)return;
   const after=read();
   if(after.detected&&!sameReportingGame(snapshot,after)){publish('The displayed game changed. No notification sent.');return;}
   const players={botUser:snapshot.botUser||after.botUser,opponent:snapshot.opponent||after.opponent};
   if(players.botUser&&players.opponent&&!matchedPlayers(players).length){publish('No notification: neither displayed username matches jonsolvi12.');return;}
   if(players.botUser&&players.opponent&&committedMove(snapshot,after,move)){
    const identity=snapshot.gameId||JSON.stringify([snapshot.live.pageUrl,players.botUser,players.opponent]);
    const bytes=new TextEncoder().encode(identity+'|'+key+'|'+JSON.stringify(move.placedTiles));
    const digest=await w.crypto.subtle.digest('SHA-256',bytes);
    if(epoch!==generation||!enabled)return;
    const id=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    return send({...players,word:move.word,points:move.score},id);
   }
   if(Date.now()-start>=60000){publish(!players.botUser||!players.opponent?'No notification: one or both displayed usernames could not be read.':'No confirmed committed move observed within 60 seconds. No notification sent.');return;}
   const timer=w.setTimeout(()=>{timers.delete(timer);void check().catch(()=>publish('Could not confirm move for reporting.'));},250);timers.add(timer);
  };return check();
 }

 return {getState:state,setEnabled,connect,observeSubmission,test({botUser,opponent}){if(!enabled){publish('Enable reporting before sending a test.');return Promise.resolve({skipped:true});}if(!matchedPlayers({botUser,opponent}).length){publish('Neither mock username matches jonsolvi12. Nothing sent.');return Promise.resolve({skipped:true});}const id='test-'+Array.from(w.crypto.getRandomValues(new Uint32Array(4)),x=>x.toString(16)).join('-');return send({botUser,opponent,word:'PRÓF',points:0,test:true},id);},destroy(){setEnabled(false);dead=true;w.removeEventListener('message',receive);for(const p of waiters.values()){w.clearTimeout(p.timer);p.resolve({cancelled:true});}waiters.clear();}};
}
