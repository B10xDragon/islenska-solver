export const ALPHABET = 'AÁBDÐEÉFGHIÍJKLMNOÓPRSTUÚVXYÝÞÆÖ';
export const normalize = s => s.normalize('NFC').trim().toLocaleUpperCase('is');
export class Dictionary {
  constructor(input) {
    if (typeof input === 'string') { const s=input.trim(); input=s.startsWith('[')||s.startsWith('{') ? JSON.parse(s) : s.split(/\r?\n/); }
    if (!(input instanceof Set) && !Array.isArray(input)) input=input?.words;
    if (!(input instanceof Set) && !Array.isArray(input)) throw Error('Use text lines, a JSON array / {words: [...]}, or a Set.');
    this.root={children:new Map(),end:false}; this.words=new Set();
    for(const raw of input) { if(typeof raw!=='string') continue; const w=normalize(raw); if(w.length<2 || w.length>15 || [...w].some(c=>!ALPHABET.includes(c))) continue;
      if(this.words.has(w)) continue; this.words.add(w); let n=this.root; for(const c of w){if(!n.children.has(c))n.children.set(c,{children:new Map(),end:false}); n=n.children.get(c);} n.end=true;
    }
    if(!this.words.size) throw Error('No usable Icelandic words found.');
  }
  has(w){return this.words.has(normalize(w));}
}
