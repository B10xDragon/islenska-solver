// Structural diagnostics for the visible rack only. Never include cookies,
// storage, input values, script query strings, or client application state.
const records = new WeakMap();
export function describeElement(element) {
 if (!element) return null;
 const rect=element.getBoundingClientRect(),style=element.ownerDocument.defaultView?.getComputedStyle(element);
 return {tag:element.tagName,id:element.id,class:element.getAttribute('class'),role:element.getAttribute('role'),
  attributes:Object.fromEntries(['draggable','aria-selected','aria-pressed','data-selected','data-letter','data-tile','data-blank'].filter(name=>element.hasAttribute(name)).map(name=>[name,element.getAttribute(name)])),
  handlers:['onclick','onmousedown','onmouseup','onpointerdown','onpointerup','ontouchstart','ontouchend'].filter(name=>typeof element[name]==='function'),
  frameworkProperties:Object.keys(element).filter(name=>/^(__react|__vue|_m$|events$)/.test(name)).map(name=>name.replace(/\$.*$/,'$…')),
  rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},style:style?{display:style.display,visibility:style.visibility,pointerEvents:style.pointerEvents,backgroundColor:style.backgroundColor}:null};
}
export function recordPlacement(root,step) {
 const doc=root.nodeType===9?root:root.ownerDocument;
 let record=records.get(doc);
 if(step.phase==='start'||!record){record={steps:[]};records.set(doc,record);}
 record.steps.push({...step,at:new Date().toISOString()});if(record.steps.length>40)record.steps.shift();
}
export function placementReport(root,rackCells=[]) {
 const doc=root.nodeType===9?root:root.ownerDocument;
 return {lastAttempt:records.get(doc)||null,rack:rackCells.map((cell,index)=>({slot:index+1,cell:describeElement(cell),children:[...cell.querySelectorAll('*')].slice(0,16).map(describeElement)})),
  scripts:[...new Set([...doc.querySelectorAll('script[src]'),...root.querySelectorAll('script[src]')])].map(script=>{try{const url=new URL(script.src,doc.baseURI);return url.origin+url.pathname;}catch{return null;}}).filter(Boolean).slice(0,30)};
}
