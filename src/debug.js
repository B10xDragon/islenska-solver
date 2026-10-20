import {mountGui} from './gui.js';
import {createKillSwitch} from './kill-switch.js';
const initial=document.body.innerHTML;let gui;
const gate=createKillSwitch({window,onChange:state=>{if(state.allowed){if(!gui){document.body.innerHTML=initial;gui=mountGui(document);}}else{gui?.destroy();gui=null;document.body.replaceChildren();const message=document.createElement('p');message.textContent=state.reason;document.body.append(message);}}});
addEventListener('pagehide',()=>{gui?.destroy();gate.destroy();},{once:true});
