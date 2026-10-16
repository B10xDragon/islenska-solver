import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {webkit} from '@playwright/test';import {loadClientSource} from './client-source.mjs';
import {installMalstadurClient} from '../test/fixtures/malstadur-client.js';
import {DEFAULT_VALUES} from '../src/scoring.js';import {standardMultipliers} from '../src/board.js';
const source=loadClientSource(),config=JSON.parse(fs.readFileSync('hosting.json','utf8')),origin=new URL(config.assetBaseUrl).origin;
const deployed=process.env.ISLENSKA_TEST_DEPLOYED==='1';
const code=fs.readFileSync('dist/bookmarklet.txt','utf8').slice(11);
const csp="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; worker-src 'self' blob:";
const browser=await webkit.launch(deployed&&process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{});
let activePage;
try {
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true});
 await context.route('https://malstadur.mideind.is/**',route=>route.fulfill({contentType:'text/html',headers:{'content-security-policy':csp},body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body><div id="client-fixture"></div></body>'}));
 if(!deployed)await context.route(origin+'/**',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join('dist',new URL(route.request().url()).pathname.split('/').at(-1)))}));
 const page=await context.newPage(),errors=[],gameRequests=[];activePage=page;
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{const u=new URL(request.url());if(u.protocol==='https:'&&u.origin==='https://malstadur.mideind.is'&&u.pathname!=='/netskrafl')gameRequests.push(request.url());});
 await page.goto('https://malstadur.mideind.is/netskrafl');
 await page.evaluate(({helper,source,values,multipliers})=>{window.client=(0,eval)('('+helper+')')(window,source,{letters:'UUOKÆNV',values,multipliers});},{helper:installMalstadurClient.toString(),source,values:DEFAULT_VALUES,multipliers:standardMultipliers()});
 // Reproduce the report: click() alone never selects this actual rack component.
 await page.evaluate(()=>document.querySelector('#sq_R4 .tileletter').click());
 assert.equal(await page.evaluate(()=>window.client.game.selectedSq),null);
 await page.evaluate(()=>{window.client.events.length=0;});
 await page.evaluate(code);const gui=page.locator('#islenska-solver-host');
 await gui.locator('#word').filter({hasText:'KVON'}).waitFor({timeout:30000});
 const expected=await gui.locator('#preview .mini-square').evaluateAll(elements=>elements.flatMap((e,i)=>e.classList.contains('ghost')?[{row:Math.floor(i/15),col:i%15,letter:e.textContent}]:[]));
 await gui.locator('#auto').check();await gui.locator('#status').filter({hasText:/Review and submit/}).waitFor({timeout:30000});
 assert.deepEqual(await page.evaluate(()=>window.__ISLENSKA_SOLVER__.detectGame().pendingTiles.map(({row,col,letter})=>({row,col,letter}))),expected);
 assert.deepEqual(await page.evaluate(()=>window.client.attempts),[{from:'R4',to:'H8'},{from:'R7',to:'H9'},{from:'R3',to:'H10'},{from:'R6',to:'H11'}]);
 assert.equal(await page.evaluate(()=>window.client.submissions),0);
 let before=await page.evaluate(()=>window.client.attempts.length);await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window.client.attempts.length),before);
 const phases=await page.evaluate(()=>window.__ISLENSKA_SOLVER__.getDiagnostics().roots[0].placement.lastAttempt.steps.map(s=>s.phase));
 assert.equal(phases.filter(p=>p==='rack-press').length,4);assert.equal(phases.filter(p=>p==='rack-release').length,4);assert.equal(phases.filter(p=>p==='verified').length,4);
 // New local position exercises the actual blank component and repeated letters.
 await gui.locator('#auto').uncheck();await page.evaluate(()=>window.client.commit('ÁÁÞIR?A'));
 await gui.locator('#rack-summary').filter({hasText:/Á.*Á.*Þ.*I.*R.*\?.*A/}).waitFor({timeout:10000});
 await gui.locator('#place:enabled').waitFor({timeout:30000});
 await gui.locator('#auto').check();await gui.locator('#status').filter({hasText:/Review and submit/}).waitFor({timeout:30000});
 const blank=await page.evaluate(()=>window.__ISLENSKA_SOLVER__.detectGame().pendingTiles.some(tile=>tile.blank));
 assert(blank,'the best second move uses the actual blank picker');assert.equal(await page.evaluate(()=>window.client.submissions),0);
 // A user-committed turn remains readable and waits for the opponent.
 await page.evaluate(()=>{window.client.commit('KATTAIR');window.client.setOpponent(true);});
 await gui.locator('#game-status').filter({hasText:/Waiting for your turn/}).waitFor({timeout:10000});
 before=await page.evaluate(()=>window.client.attempts.length);await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window.client.attempts.length),before);
 await page.evaluate(code);await page.evaluate(code);assert.equal(await page.locator('#islenska-solver-host').count(),1);
 assert.deepEqual(gameRequests,[]);assert.deepEqual(errors,[]);
 console.log('PASS WebKit exact reported client: native click failure reproduced; full GUI KVON stages R4/R7/R3/R6 → H8/H9/H10/H11; blank/repeats; no loop; opponent wait; no submit or game API requests; duplicate launch prevented.');
 await context.close();
} catch(error){if(activePage)console.error('Client failure diagnostic',JSON.stringify(await activePage.evaluate(()=>({status:document.getElementById('islenska-solver-host')?.shadowRoot.getElementById('status').textContent,lastAttempt:window.__ISLENSKA_SOLVER__?.getDiagnostics().roots[0].placement.lastAttempt,selected:window.client?.game.selectedSq,blank:window.client?.game.askingForBlank,dialog:window.client?.game.showingDialog}))));throw error;} finally {await browser.close();}
