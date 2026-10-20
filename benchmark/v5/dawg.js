import {ALPHABET,normalize} from './dictionary.js';
// Direct reader for Netskrafl packed byte DAWG; never expands complete words.
export class Dawg {
 constructor(buffer,{cacheLimit=16384}={}){this.childCache=new Map();this.cacheLimit=cacheLimit;this.cacheStats={hits:0,misses:0,clears:0};this.bytes=new Uint8Array(buffer);this.view=new DataView(buffer);this.cache=new Map();this.rootNode=this.wrap({offset:0});this.edges(0);}
 root(){return this.rootNode;}
 edges(offset){if(this.cache.has(offset))return this.cache.get(offset);const b=this.bytes;let p=offset+1;const out=[];for(let i=0;i<(b[offset]&127);i++){const header=b[p++];let codes;if(header&64)codes=[header&63];else{const length=header&63;codes=Array.from(b.subarray(p,p+length));p+=length;}if(!codes.length||codes.some(c=>(c&127)>=ALPHABET.length))throw Error('Invalid DAWG character');let next=0;if(!(b[p-1]&128)){next=this.view.getUint32(p,true);p+=4;if(next>=b.length)throw Error('Invalid DAWG pointer');}out.push({codes,next,id:offset+'-'+i});}if(this.cache.size>8192)this.cache.clear();this.cache.set(offset,out);return out;}
 wrap(cursor){const d=this,key=cursor.edge?cursor.edge.id+':'+cursor.index:'n'+cursor.offset;return {cursor,get end(){return d.isTerminal(this);},get children(){let result=d.childCache.get(key);if(result){d.cacheStats.hits++;return result;}d.cacheStats.misses++;result=new Map(d.transitions(this));if(d.childCache.size>=d.cacheLimit){d.childCache.clear();d.cacheStats.clears++;}if(d.cacheLimit)d.childCache.set(key,result);return result;}};}
 transitions(node){const c=node.cursor;if(c.edge){if(c.index<c.edge.codes.length){const code=c.edge.codes[c.index];return [[ALPHABET[code&127],this.wrap({edge:c.edge,index:c.index+1})]];}if(c.edge.next===0)return [];return this.transitions(this.wrap({offset:c.edge.next}));}return this.edges(c.offset).map(edge=>[ALPHABET[edge.codes[0]&127],this.wrap({edge,index:1})]);}
 follow(node,letter){return node.children.get(normalize(letter))||null;}
 isTerminal(node){const c=node.cursor;if(!c.edge)return !!(this.bytes[c.offset]&128);if(c.edge.codes[c.index-1]&128)return true;return c.index===c.edge.codes.length&&(c.edge.next===0||!!(this.bytes[c.edge.next]&128));}
 has(word){let node=this.root();for(const c of normalize(word)){node=this.follow(node,c);if(!node)return false;}return this.isTerminal(node);}
}
