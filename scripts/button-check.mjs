import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {webkit} from '@playwright/test';import {fixture} from '../test/fixtures/netskrafl-board.js';import {installClickGame} from '../test/fixtures/click-game.js';
import {installMalstadurClient} from '../test/fixtures/malstadur-client.js';import {loadClientSource} from './client-source.mjs';
import {DEFAULT_VALUES} from '../src/scoring.js';import {standardMultipliers} from '../src/board.js';
export async function checkButton({actual=false,viewport={width:1024,height:768},fallback=false}={}) {
 const deployed=process.env.ISLENSKA_TEST_DEPLOYED==='1',config=JSON.parse(fs.readFileSync('hosting.json','utf8')),origin=new URL(config.assetBaseUrl).origin,code=fs.readFileSync('dist/bookmarklet.txt','utf8').slice(11);
 const browser=await webkit.launch(deployed&&process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{});let page;
 try{
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true});let downloads=0;const errors=[];
  if(fallback)await context.addInitScript(()=>{window.Worker=class{constructor(){throw Error('Worker disabled for fallback check');}};});
  const csp="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'self' blob:";
  await context.route('https://malstadur.mideind.is/**',route=>route.fulfill({contentType:'text/html',headers:{'content-security-policy':csp},body:'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#171c19;color:white">'+(actual?'<div id="client-fixture"></div>':fixture())+'</body>'}));
  if(!deployed)await context.route(origin+'/**',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join('dist',new URL(route.request().url()).pathname.split('/').at(-1)))}));
  page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().includes('dictionary-data.js'))downloads++;});await page.goto('https://malstadur.mideind.is/netskrafl');
  if(actual)await page.evaluate(({helper,source,values,multipliers})=>{window.client=(0,eval)('('+helper+')')(window,source,{letters:'UUOKÆNV',values,multipliers});},{helper:installMalstadurClient.toString(),source:loadClientSource(),values:DEFAULT_VALUES,multipliers:standardMultipliers()});
  else await page.evaluate(({helper,values})=>{window.DEFAULT_VALUES=values;window.client=(0,eval)('('+helper+')')(document,{letters:'KATTAIR'});},{helper:installClickGame.toString(),values:DEFAULT_VALUES});
  await page.evaluate(code);const host=page.locator('#islenska-solver-host'),button=host.locator('button');await host.waitFor({state:'attached',timeout:30000});await page.evaluate(()=>window.__ISLENSKA_SOLVER__.setStrategy({mode:'max-points'}));
  assert.equal(await host.locator('button').count(),1);assert.equal(await host.locator('section,table,nav').count(),0);assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(downloads,0,'OFF does not load the dictionary');
  const initial=await host.boundingBox();assert(initial.width<=100&&initial.height<=50);assert(initial.x>viewport.width-120&&initial.y<25);
  // Dragging cannot turn automation on, and the button cannot be lost offscreen.
  await page.mouse.move(initial.x+30,initial.y+20);await page.mouse.down();await page.mouse.move(-500,-500);await page.mouse.up();assert.equal(await button.getAttribute('aria-pressed'),'false');const moved=await host.boundingBox();assert(moved.x>=0&&moved.y>=0);
  await button.tap();await page.waitForFunction(()=>window.client.submissions===1,{},{timeout:30000});assert.equal(await button.getAttribute('aria-pressed'),'true');
  await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>window.client.submissions),1);assert.equal(downloads,1);const state=await page.evaluate(()=>window.__ISLENSKA_SOLVER__.getState());assert(state.bestMove?.placedTiles.length>0);
  if(actual)assert.deepEqual(await page.evaluate(()=>window.client.attempts),[{from:'R4',to:'H8'},{from:'R7',to:'H9'},{from:'R3',to:'H10'},{from:'R6',to:'H11'}]);
  await button.tap();assert.equal(await button.getAttribute('aria-pressed'),'false');const attempts=await page.evaluate(()=>window.client.attempts?.length??window.client.clicks.length);
  await page.evaluate(()=>window.client.commit('ÁÁÞIR?A'));await page.waitForTimeout(1100);assert.equal(await page.evaluate(()=>window.client.submissions),1);assert.equal(await page.evaluate(()=>window.client.attempts?.length??window.client.clicks.length),attempts);
  if(actual){
   await page.evaluate(()=>window.client.setSubmitReady(false));await button.tap();await page.waitForFunction(()=>window.__ISLENSKA_SOLVER__.getState().phase==='submitting',{},{timeout:30000});assert.equal(await page.evaluate(()=>window.client.submissions),1);
   await button.tap();await page.evaluate(()=>window.client.setSubmitReady(true));await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.client.submissions),1,'OFF cancels a pending Leika wait');
   await button.tap();await page.waitForFunction(()=>window.client.submissions===2,{},{timeout:30000});assert(await page.evaluate(()=>window.__ISLENSKA_SOLVER__.detectGame().pendingTiles.some(t=>t.blank)));
   await button.tap();
  }
  // A new instance starts OFF, reuses IndexedDB when enabled, and remains one button.
  const before=await page.evaluate(()=>window.client.submissions);await page.evaluate(()=>window.client.commit('KATTAIR'));
  await page.evaluate(()=>window.__ISLENSKA_SOLVER__.destroy());await page.evaluate(code);assert.equal(await button.getAttribute('aria-pressed'),'false');await button.tap();await page.waitForFunction(n=>window.client.submissions===n+1,before,{timeout:30000});assert.equal(downloads,1,'dictionary reused from cache');
  // While the opponent is playing, ON waits without placement or submission.
  await page.evaluate(()=>{window.client.commit('KATTAIR');window.client.setOpponent(true);});await page.waitForFunction(()=>/Waiting for your turn/.test(window.__ISLENSKA_SOLVER__.getState().message));const after=await page.evaluate(()=>window.client.submissions);await page.waitForTimeout(1100);assert.equal(await page.evaluate(()=>window.client.submissions),after);
  await page.evaluate(code);assert.equal(await host.evaluate(e=>e.style.display),'none');assert.equal(await page.evaluate(()=>window.__ISLENSKA_SOLVER__.enabled),false);await page.evaluate(code);assert.equal(await host.count(),1);assert.equal(await host.evaluate(e=>e.style.display),'block');
  await page.setViewportSize({width:viewport.height,height:viewport.width});const rotated=await host.boundingBox();assert(rotated.x>=0&&rotated.y>=0&&rotated.x+rotated.width<=viewport.height&&rotated.y+rotated.height<=viewport.width);
  await page.screenshot({path:`test-results/button-${actual?'client':viewport.width}${fallback?'-fallback':''}.png`});assert.deepEqual(errors,[]);
  console.log('PASS WebKit single button',actual?'actual client':'click fixture',viewport,fallback?'worker fallback':'worker','ON places + Leika, OFF stops, drag does not toggle, cache reuse, opponent wait, rotation, no duplicate UI');await context.close();
 }catch(error){if(page)console.error('Button diagnostic',await page.evaluate(()=>window.__ISLENSKA_SOLVER__?.getDiagnostics()));throw error;}finally{await browser.close();}
}
