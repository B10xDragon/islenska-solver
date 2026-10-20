import {fetchControl} from './kill-switch.js';
const p=new URLSearchParams(location.hash.slice(1)),origin=p.get('origin'),token=p.get('token'),status=document.getElementById('status');
if(opener&&/^https:\/\/[^/]+$/.test(origin||'')&&/^[a-f0-9]{32}$/.test(token||'')){
 const send=data=>opener.postMessage({...data,token},origin);
 addEventListener('message',async e=>{if(e.source!==opener||e.origin!==origin||e.data?.token!==token||e.data.type!=='v6-check')return;let enabled;try{enabled=await fetchControl();status.textContent=enabled?'V6 is enabled. Keep this tab open and return to the game.':'V6 is disabled in the repository.';}catch{status.textContent='Cannot verify the configuration. V6 is paused.';}send({type:'v6-result',id:e.data.id,enabled});});
 send({type:'v6-ready'});
}else status.textContent='Open this tab using the V6 VERIFY button.';
