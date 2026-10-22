// Controlled DOM/model/bridge fixtures. No live DeepSeek or Studio connection.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'core/main.js'), 'utf8');
const polishLimit = 'Zbyt częste wiadomości. Spróbuj ponownie później.';
function section(start, end) {
  const a = main.indexOf(start), b = main.indexOf(end, a);
  assert.ok(a >= 0 && b > a, 'actual core implementation located: ' + start);
  return main.slice(a, b);
}
function fixture() {
  const dom = new JSDOM('<!doctype html><body><main id="thread"></main><form><textarea></textarea><button type="button" class="ds-button--primary" aria-label="Send">Send</button></form></body>', {url:'https://chat.deepseek.com/a/chat/test',runScripts:'outside-only'});
  const w=dom.window,d=w.document,c=dom.getInternalVMContext();let clock=10000,clicks=0;
  Object.defineProperty(d,'hidden',{value:false,configurable:true});
  const events=[],banners=[],covers=[],commands=[];
  w.HTMLElement.prototype.getBoundingClientRect=function(){const hidden=this.closest('[hidden]');return {width:hidden?0:500,height:hidden?0:70,top:100,left:0,bottom:170,right:500};};
  Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.closest('[hidden]')?null:d.body;}});
  Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;}});
  w.Date.now=()=>clock;
  w.setTimeout=(fn,ms=0)=>{queueMicrotask(()=>{clock+=Math.max(1,ms);fn();});return 1;};
  vm.runInContext(fs.readFileSync(path.join(root,'providers/deepseek.js'),'utf8')+'\nwindow.P=RSProvider;',c);
  vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;',c);
  const P=w.P,ed=P.getEditor(),send=d.querySelector('button');
  send.addEventListener('click',()=>clicks++);
  const A={sessionGen:1,sendToken:'old',stop:false,starting:false,running:false,started:true,imageTools:new Set()};
  Object.assign(w,{A,T:P.timings,bgMode:true,diag:(...args)=>events.push(args),sleep:ms=>new Promise(r=>w.setTimeout(r,ms)),
    ui:{banner:(...args)=>banners.push(args),captureHandoff(){},inputCover:on=>covers.push(on),captureCoworkFocus(){},restoreCoworkFocus(){},renderCowork(){},showStop(){},toast(){},trackCard(){}},
    cowork:{snapshot:()=>({enabled:false,pending:[]}),pause(){}},scheduleSweep(){},
    waitCommandCooldown:async()=>{},jitterBeforeSend:async()=>{},
    waitFor:async(pred,ms)=>{for(let i=0;i<Math.ceil(ms/100);i++){if(pred())return true;await w.sleep(100);}return false;},
    reliabilitySettings:{},PlazCodeReliability:{createBudget:()=>({check:()=>null,consume(){},status:()=>({used:1})})},
    activity:{active:()=>({}),sync(){},step(){}},syncActivityItems(){},beginTaskCheckpoint:async()=>{},finishTaskCheckpoint:async()=>{},playSfx(){},markActivity(){},enhanceCreationBeforeTools:async()=>null,
    decorate:{toolBox(){commands.push('decorate');}},runTool:async()=>{commands.push('execute');return 'result';},
    PlazCodeToolGuard:{repair:call=>call,check:()=>[]},bareToolName:name=>name,RS:{toolCategory:()=> 'edit'},
  });
  vm.runInContext(section('  class SendAbortedError extends Error {}','  // ── Anti-bot mitigation')+'\nwindow.SendAbort=SendAbortedError;window.checkLimit=checkProviderRateLimit;',c);
  vm.runInContext(section('  function verifyResponseOwner(res) {','\n  const isContextInvalidated')+'\nwindow.verifyOwner=verifyResponseOwner;window.readResponse=waitForResponse;',c);
  vm.runInContext(section('  function captureSendToken() {','\n  async function submitAndGetBase')+'\n'+section('  async function performSubmitCore(','\n  // ════════════════════════════════════════════════════════════════════════\n  //  RESPONSE WATCHER')+'\nwindow.sendActual=performSubmitCore;',c);
  vm.runInContext(section('  function parseProviderToolCalls(','\n  // 1.24.10 helpers')+'\nwindow.validateActual=validateProviderResponse;',c);
  vm.runInContext(section('  async function agentLoop(','\n  async function recoverCapabilitySession(')+'\nwindow.runLoop=agentLoop;',c);
  function add(key,html) {
    const row=d.createElement('div');row.setAttribute('data-virtual-list-item-key',key);
    row.innerHTML='<div class="ds-message" data-role="assistant"><div class="ds-markdown"></div></div>';
    row.querySelector('.ds-markdown').innerHTML=html;d.querySelector('#thread').append(row);
    return row.querySelector('.ds-message');
  }
  function notice(text=polishLimit,host=d.body,attrs={}) {
    const el=d.createElement('div');el.textContent=text;
    for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);
    host.append(el);return el;
  }
  function response(item) {
    return {kind:'tool',calls:[{tool:'execute_luau',arguments:{code:'print(1)'}}],item,text:'{"command":"execute_luau","params":{"code":"print(1)"}}',responseOwner:{session:A.sessionGen,sendToken:A.sendToken,token:P.itemKey(item),chat:P.conversationKey(),item}};
  }
  return {w,d,P,A,ed,send,events,banners,covers,commands,add,notice,response,clicks:()=>clicks,advance(ms){clock+=ms;}};
}
for(const text of [polishLimit,'Too frequent messages. Please try again later.','Too many requests. Please try again later.']) {
  test('DeepSeek native rate notice: '+text,()=>{
    const f=fixture();const el=f.notice(text);assert.equal(f.P.scanRateLimit(),text);
    // It is a persistent block, not a toast that is consumed once.
    assert.equal(f.P.scanRateLimit(),text);el.remove();assert.equal(f.P.scanRateLimit(),null);
  });
}
test('rate alert is detected with empty composer and enabled Send',()=>{
  const f=fixture();f.notice(polishLimit,f.d.body,{role:'alert'});
  assert.equal(f.ed.value,'');assert.equal(f.send.disabled,false);assert.equal(f.P.scanRateLimit(),polishLimit);
});
test('latest assistant native error shell is detected outside markdown',()=>{
  const f=fixture();const item=f.add('new','');f.notice(polishLimit,item);assert.equal(f.P.scanRateLimit(),polishLimit);
});
for(const location of ['model','code','reasoning','user','extension','old','hidden']) {
  test('rate-like text in '+location+' does not pause the session',()=>{
    const f=fixture();
    if(location==='model')f.add('new',polishLimit);
    if(location==='code')f.add('new','<pre><code>'+polishLimit+'</code></pre>');
    if(location==='reasoning'){const item=f.add('new','answer');item.insertAdjacentHTML('beforeend','<div class="ds-think-content">'+polishLimit+'</div>');}
    if(location==='user'){const item=f.add('user','');item.setAttribute('data-role','user');f.notice(polishLimit,item);}
    if(location==='extension'){const el=f.d.createElement('div');el.id='rs-root';f.d.body.append(el);f.notice(polishLimit,el,{role:'alert'});}
    if(location==='old'){const item=f.add('old','');f.notice(polishLimit,item);f.add('new','answer');}
    if(location==='hidden')f.notice(polishLimit,f.d.body,{hidden:''});
    assert.equal(f.P.scanRateLimit(),null);
  });
}
test('rate notice before send preserves the user draft and commits nothing',async()=>{
  const f=fixture();f.ed.value='unfinished user draft';f.notice();
  assert.equal(await f.P.typeAndSend('result'),false);assert.equal(f.ed.value,'unfinished user draft');assert.equal(f.clicks(),0);
});
test('ordinary DeepSeek text delivery still clicks once when no limit exists',async()=>{
  const f=fixture();f.send.addEventListener('click',()=>{f.ed.value='';});
  await f.P.typeAndSend('Output of execute_luau: completed');assert.equal(f.clicks(),1);assert.equal(f.ed.value,'');
});
test('core aborts before any composer change while native rate notice is visible',async()=>{
  const f=fixture();f.ed.value='unfinished user draft';f.notice();
  await assert.rejects(()=>f.w.sendActual('Output of execute_luau: completed'),/message limit/);
  assert.equal(f.ed.value,'unfinished user draft');assert.equal(f.clicks(),0);assert.equal(f.A.userStopped,true);
  assert.equal(f.banners.length,1);assert.match(f.banners[0][1],/message limit/);
});
test('rate notice appearing at send stops core after one click without retrying',async()=>{
  const f=fixture();f.add('old','previous');f.send.addEventListener('click',()=>f.notice());
  await assert.rejects(()=>f.w.sendActual('Output of execute_luau: completed'),/message limit/);
  assert.equal(f.clicks(),1);assert.equal(f.ed.value,'Output of execute_luau: completed');
  assert.equal(f.A.userStopped,true);assert.equal(f.A.resumeArmed,false);assert.equal(f.A.detectedTool,null);
});
test('rate notice wins over a cached parsed command in the actual response watcher',async()=>{
  const f=fixture();const item=f.add('new','<pre>{"command":"execute_luau","params":{"code":"print(1)"}}</pre>');
  f.A.detectedTool={text:f.P.itemText(item),calls:f.response(item).calls,item,id:f.P.lastAssistantId(),chat:f.P.conversationKey(),session:1,sendToken:'old',at:f.w.Date.now()};
  f.notice();const res=await f.w.readResponse(0);assert.equal(res.kind,'rate_limit');assert.equal(res.detail,polishLimit);
  assert.deepEqual(f.commands,[]);
});
test('actual agent loop pauses on rate notice and always releases the input lock',async()=>{
  const f=fixture();f.A.resumeArmed=true;f.w.waitForResponse=async()=>({kind:'rate_limit',detail:polishLimit});
  await f.w.runLoop(0);
  assert.deepEqual(f.commands,[]);assert.equal(f.clicks(),0);assert.equal(f.A.running,false);
  assert.equal(f.A.userStopped,true,JSON.stringify(f.banners));assert.equal(f.A.resumeArmed,false);assert.equal(f.ed.hasAttribute('readonly'),false);
  assert.equal(f.covers.at(-1),false);assert.equal(f.banners.length,1);assert.match(f.banners[0][1],/message limit/);
});
test('rate notice appearing after parsing stops before tool decoration or dispatch',async()=>{
  const f=fixture();const item=f.add('new','<pre>{"command":"execute_luau","params":{"code":"print(1)"}}</pre>');
  f.w.waitForResponse=async()=>f.response(item);
  f.w.PlazCodeToolGuard.check=()=>{f.notice();return [];};
  await f.w.runLoop(0);
  assert.deepEqual(f.commands,[]);assert.equal(f.clicks(),0);assert.equal(f.A.running,false);assert.equal(f.A.userStopped,true,JSON.stringify(f.banners));
  assert.equal(f.banners.length,1);assert.match(f.banners[0][1],/message limit/);
});
test('startup handles rate limit without classifying it as missing command handshake',()=>{
  const f=fixture();assert.throws(()=>f.w.validateActual({kind:'rate_limit',detail:polishLimit}),/message limit/);
  assert.equal(f.banners.length,1);assert.match(f.banners[0][1],/message limit/);assert.deepEqual(f.commands,[]);
});
test('nested virtual row preserves identity when a message id arrives after parsing',()=>{
  const f=fixture();const item=f.add('new','command'),res=f.response(item);
  const wrapper=f.d.createElement('div');item.replaceWith(wrapper);wrapper.append(item);
  item.setAttribute('data-message-id','late-message-id');
  assert.equal(f.P.lastAssistantId(),'new');assert.equal(f.w.verifyOwner(res),true);
});
test('ownership failure pauses the actual loop without rearming the idle watchdog',async()=>{
  const f=fixture();const item=f.add('new','<pre>{"command":"execute_luau","params":{"code":"print(1)"}}</pre>');
  const res=f.response(item);item.parentElement.setAttribute('data-virtual-list-item-key','other');
  f.w.waitForResponse=async()=>res;await f.w.runLoop(0);
  assert.deepEqual(f.commands,[]);assert.equal(f.clicks(),0);assert.equal(f.A.running,false);assert.equal(f.A.userStopped,true,JSON.stringify(f.banners));
  assert.equal(f.A.resumeArmed,false);assert.equal(f.A.detectedTool,null);assert.equal(f.ed.hasAttribute('readonly'),false);
  assert.equal(f.banners.length,1);assert.match(f.banners[0][1],/Response changed/);
});
test('remount of the same stable row rebinds to the live assistant item',()=>{
  const f=fixture();const item=f.add('new','command'),res=f.response(item),fresh=item.cloneNode(true);
  item.replaceWith(fresh);f.advance(250);
  assert.equal(f.P.lastAssistantId(),'new');assert.equal(f.w.verifyOwner(res),true);assert.equal(res.item,fresh);
});
for(const change of ['row','chat','send','session']) {
  test('response ownership rejects changed '+change,()=>{
    const f=fixture();const item=f.add('new','command'),res=f.response(item);
    if(change==='row')item.parentElement.setAttribute('data-virtual-list-item-key','other');
    if(change==='chat')f.w.history.pushState({},'','/a/chat/other');
    if(change==='send')f.A.sendToken='another-send';
    if(change==='session')f.A.sessionGen++;
    assert.equal(f.w.verifyOwner(res),false);
  });
}
test('ordinary native busy toasts remain separate from message rate limits',()=>{
  const f=fixture();f.notice('The server is busy. Please try again later.',f.d.body,{role:'alert'});
  assert.equal(f.P.scanRateLimit(),null);assert.match(f.P.scanBusy(),/server is busy/);assert.equal(f.P.scanBusy(),null);
});
test('model quotes and hidden alerts cannot trigger native busy retries',()=>{
  const f=fixture();f.add('new','<div role="alert">The server is busy. Please try again later.</div>');
  f.notice('The server is busy. Please try again later.',f.d.body,{role:'alert',hidden:''});
  assert.equal(f.P.scanBusy(),null);
});
