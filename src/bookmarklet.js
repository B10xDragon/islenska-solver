import {gameReader,stageMove} from './live-game.js';
import {createSubmitter} from './submission.js';
import {createSearchClient} from './search-client.js';
import {createAutomation} from './automation.js';
import {detectionReport} from './game-detection.js';
export function install(w=window,d=document){
 if(w.__ISLENSKA_SOLVER__){w.__ISLENSKA_SOLVER__.toggle();return w.__ISLENSKA_SOLVER__;}
 d.getElementById('islenska-load-error')?.remove();
 const base=new URL('.',d.currentScript?.src||ASSET_URL),host=d.createElement('div');host.id='islenska-solver-host';
 host.style.cssText='position:fixed;top:calc(12px + env(safe-area-inset-top));right:calc(12px + env(safe-area-inset-right));z-index:2147483647;width:96px;height:48px;color-scheme:light;';
 const root=host.attachShadow({mode:'open'}),style=d.createElement('style');
 style.textContent=':host{font:600 13px system-ui,-apple-system,sans-serif}button{box-sizing:border-box;width:96px;height:48px;display:flex;gap:8px;align-items:center;justify-content:center;border:1px solid #bbcbbf;border-radius:24px;background:#f5f8f2;color:#234537;box-shadow:0 3px 16px #0005;font:inherit;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:pointer}button[aria-pressed=true]{background:#16654b;border-color:#67d4a4;color:white}.dot{width:8px;height:8px;border-radius:50%;background:#8c9e92}button[aria-pressed=true] .dot{background:#89f0b5}button[data-busy=true] .dot{animation:pulse .8s infinite alternate}button[data-phase=error] .dot{background:#ffb34f}small{display:block;font:700 8px system-ui;letter-spacing:1.1px}strong{font-size:13px}button:focus-visible{outline:3px solid #68d7ab;outline-offset:2px}@keyframes pulse{to{opacity:.3}}@media(prefers-reduced-motion:reduce){button[data-busy=true] .dot{animation:none}}';
 const button=d.createElement('button');button.type='button';button.id='automation-toggle';button.innerHTML='<span class="dot" aria-hidden="true"></span><span><small>AUTO</small><strong>OFF</strong></span>';button.setAttribute('aria-pressed','false');button.setAttribute('aria-live','polite');root.append(style,button);d.documentElement.append(host);
 for(const type of ['click','dblclick','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend','keydown','keyup'])host.addEventListener(type,event=>event.stopPropagation());
 let destroyed=false,drag=null,ignoreClick=false;
 function clamp(){const viewport=w.visualViewport,left=viewport?.offsetLeft||0,top=viewport?.offsetTop||0,width=viewport?.width||w.innerWidth,height=viewport?.height||w.innerHeight,rect=host.getBoundingClientRect();host.style.left=Math.max(left+6,Math.min(rect.left,left+Math.max(6,width-rect.width-6)))+'px';host.style.top=Math.max(top+6,Math.min(rect.top,top+Math.max(6,height-rect.height-6)))+'px';host.style.right='auto';}
 const read=gameReader(d,()=>w.location.href),search=createSearchClient({window:w,dictionaryUrl:new URL('dictionary-data.js',base).href});
 const engine=createAutomation({read,doc:d,search,stage:options=>stageMove({read,...options}),submit:createSubmitter({read}),onState:state=>{
  button.setAttribute('aria-pressed',String(state.enabled));button.querySelector('strong').textContent=state.enabled?'ON':'OFF';button.dataset.phase=state.phase;button.dataset.busy=String(['loading','solving','placing','submitting'].includes(state.phase));button.title=`Íslenska Solver ${VERSION} · ${state.message}`;button.setAttribute('aria-label',`Auto place and Leika ${state.enabled?'ON':'OFF'}. ${state.message}`);
 }});
 button.onclick=()=>{if(ignoreClick){ignoreClick=false;return;}engine.toggle();};
 button.onpointerdown=event=>{if(event.button!==0||event.isPrimary===false)return;ignoreClick=false;const rect=host.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top,moved:false};button.setPointerCapture?.(event.pointerId);};
 button.onpointermove=event=>{if(!drag||drag.id!==event.pointerId)return;if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>6)drag.moved=true;if(!drag.moved)return;host.style.left=drag.left+event.clientX-drag.x+'px';host.style.top=drag.top+event.clientY-drag.y+'px';host.style.right='auto';clamp();};
 button.onpointerup=event=>{if(!drag||drag.id!==event.pointerId)return;ignoreClick=drag.moved;drag=null;};button.onpointercancel=()=>{drag=null;ignoreClick=false;};
 const api={version:VERSION,get enabled(){return engine.getState().enabled;},setEnabled:value=>engine.setEnabled(value),getState:()=>engine.getState(),open(){if(destroyed)return;host.style.display='block';clamp();},close(){engine.setEnabled(false);host.style.display='none';},toggle(){host.style.display==='none'?this.open():this.close();},solve:()=>engine.refresh(),importGame:()=>engine.refresh(),detectGame(){const {live,...snapshot}=read();return snapshot;},getDiagnostics(){return {...detectionReport(d,w.location.href),automation:engine.getState()};},destroy(){if(destroyed)return;engine.destroy();destroyed=true;host.remove();w.removeEventListener('resize',clamp);w.visualViewport?.removeEventListener('resize',clamp);w.visualViewport?.removeEventListener('scroll',clamp);delete w.__ISLENSKA_SOLVER__;}};
 w.addEventListener('resize',clamp);w.visualViewport?.addEventListener('resize',clamp);w.visualViewport?.addEventListener('scroll',clamp);w.__ISLENSKA_SOLVER__=api;api.open();return api;
}
if(typeof window!=='undefined'&&!window.__ISLENSKA_TEST__)install();
