export async function verifyDictionaryBytes(buffer,expected,cryptoProvider=globalThis.crypto){
 if(!(buffer instanceof ArrayBuffer)||! /^[a-f0-9]{64}$/.test(expected||''))throw Error('Invalid dictionary data.');
 const digest=await cryptoProvider.subtle.digest('SHA-256',buffer),actual=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 if(actual!==expected)throw Error('Dictionary checksum mismatch. The cached/downloaded dictionary is not trusted.');return buffer;
}
