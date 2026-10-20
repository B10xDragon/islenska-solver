// V6 only. A fresh response is required for submission; no persistent enabled cache.
export const CONTROL_URL='https://raw.githubusercontent.com/B10xDragon/islenska-solver/main/config/v6.json';
export const CONTROL_TAB='https://b10xdragon.github.io/islenska-solver/v6-control.html';
export const CONTROL_INTERVAL=15000;
export async function fetchControl(fetcher=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{const url=new URL(CONTROL_URL);url.searchParams.set('_',Date.now()+'-'+Math.random().toString(36).slice(2));const response=await fetcher(url.href,{cache:'no-store',credentials:'omit',redirect:'error',signal:controller.signal});if(!response.ok)throw Error('Configuration unavailable.');const text=await response.text();if(text.length>128)throw Error('Invalid configuration.');const value=JSON.parse(text);if(!value||Object.keys(value).length!==1||typeof value.enabled!=='boolean')throw Error('Invalid configuration.');return value.enabled;}finally{clearTimeout(timer);}
}
export function createKillSwitch({window:w,onChange=()=>{},fetcher=w.fetch?.bind(w),interval=CONTROL_INTERVAL}={}){
 let allowed=false,dead=false,lastVerified=0,reason='Verifying V6 configuration…',pending=null,bridge=null,serial=0,timer,expiry,request=null;
 const token=Array.from(w.crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join('');
 const state=()=>({allowed:allowed&&!dead&&Date.now()-lastVerified<interval+6000,reason,lastVerified});
 function update(value,message){allowed=value;reason=message;if(value)lastVerified=Date.now();w.clearTimeout(expiry);if(value)expiry=w.setTimeout(()=>update(false,'Verification expired. V6 paused.'),interval+6000);onChange(state());}
 function bridgeCheck(){return new Promise((resolve,reject)=>{const id=++serial;const timeout=w.setTimeout(()=>{request=null;reject(Error('Verification tab unavailable.'));},5000);request={id,resolve,reject,timeout};bridge.postMessage({type:'v6-check',token,id},new URL(CONTROL_TAB).origin);});}
 async function verify(){if(dead)return false;if(pending)return pending;pending=(async()=>{try{const value=bridge&&!bridge.closed?await bridgeCheck():await fetchControl(fetcher||(()=>Promise.reject(Error('Fetch unavailable'))));if(dead)return false;update(value,value?'V6 verified.':'V6 disabled by repository configuration.');return value;}catch{if(!dead)update(false,'Cannot verify V6. Tap VERIFY to open the verification tab.');return false;}finally{pending=null;}})();return pending;}
 function openVerifier(){if(dead)return;const url=new URL(CONTROL_TAB);url.hash=new URLSearchParams({origin:w.location.origin,token});bridge=w.open(url.href,'islenska-v6-control-'+token);update(false,bridge?'Verification tab opened. Return here after it verifies.':'Popup blocked. Allow the verification tab and retry.');}
 function receive(e){if(dead||e.source!==bridge||e.origin!==new URL(CONTROL_TAB).origin||e.data?.token!==token)return;if(e.data.type==='v6-ready'){void verify();return;}if(e.data.type==='v6-result'&&request&&request.id===e.data.id){const r=request;request=null;w.clearTimeout(r.timeout);if(typeof e.data.enabled==='boolean')r.resolve(e.data.enabled);else r.reject(Error('Verification failed.'));}}
 const resume=()=>{update(false,'Rechecking V6 after returning to the page…');void verify();};
 w.addEventListener('message',receive);w.addEventListener('pageshow',resume);w.document.addEventListener('visibilitychange',resume);
 timer=w.setInterval(()=>void verify(),interval);void verify();
 return {state,verify,openVerifier,destroy(){dead=true;allowed=false;w.clearInterval(timer);w.clearTimeout(expiry);if(request){w.clearTimeout(request.timeout);request.reject(Error('Closed'));request=null;}bridge?.close();w.removeEventListener('message',receive);w.removeEventListener('pageshow',resume);w.document.removeEventListener('visibilitychange',resume);}};
}
