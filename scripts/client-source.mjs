import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const CLIENT_URL='https://malstadur.mideind.is/_next/static/immutable/chunks/35i8dd_w41w49.js';
export const CLIENT_SHA256='715399880e8f4c7c4875e4199b75aed27bce7d8d9170c88abd836aa88333481c';
export function loadClientSource() {
 const directory='.cache/client',file=directory+'/35i8dd_w41w49.js';
 let bytes=fs.existsSync(file)?fs.readFileSync(file):execFileSync('curl',['-fLs','--retry','2',CLIENT_URL],{maxBuffer:2*1024*1024});
 if(createHash('sha256').update(bytes).digest('hex')!==CLIENT_SHA256)throw Error('The public client chunk does not match the diagnostic report fixture checksum.');
 fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(file,bytes);return bytes.toString('utf8');
}
