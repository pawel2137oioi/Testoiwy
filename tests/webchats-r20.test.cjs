// SPDX-License-Identifier: GPL-3.0-or-later
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const provider=fs.readFileSync(path.join(root,'providers/webchats.js'),'utf8');
function fixture(host='copilot.com',url='/chat'){
 const dom=new JSDOM('<!doctype html><main><form><textarea placeholder="Message Copilot"></textarea><button type="button" aria-label="Send">Send</button></form><div id="thread"></div></main>',{url:'https://'+host+url,runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();
 let clock=10000,clicks=0;w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};
 w.HTMLElement.prototype.getBoundingClientRect=function(){return {width:this.hidden?0:640,height:this.hidden?0:60,top:500,bottom:560,left:100,right:740};};
 vm.runInContext(provider+'\nwindow.P=RSProvider;',c);
 const P=w.P,ed=d.querySelector('textarea'),send=d.querySelector('button');send.onclick=()=>clicks++;
 function add(role,text,{marker='data-role',id}={}){const item=d.createElement('div');item.setAttribute(marker,marker==='data-testid'?role+'-message':role);if(id)item.dataset.messageId=id;item.textContent=text;d.querySelector('#thread').append(item);return item;}
 return {dom,w,d,c,P,ed,send,add,clicks:()=>clicks};
}
for(const initial of ['/','/playground'])test('Arcee first-save '+initial+' -> /playground/id keeps delivery in the same chat',async()=>{
 const f=fixture('platform.arcee.ai',initial),key=f.P.conversationKey();f.send.addEventListener('click',()=>{f.add('user',f.ed.value);f.ed.value='';f.w.history.pushState({},'','/playground/new-id');});
 assert.equal(await f.P.typeAndSend('First handshake'),true);assert.equal(f.P.conversationKey(),key);assert.equal(f.clicks(),1);
 f.w.history.pushState({},'','/playground/other-id');assert.notEqual(f.P.conversationKey(),key);
});
for(const host of ['platform.arcee.ai','copilot.com'])test(host+': first user remount and server ID assignment are not another conversation',()=>{
 const f=fixture(host),first=f.add('user','First exact message'),key=f.P.conversationKey();const clone=first.cloneNode(true);first.replaceWith(clone);assert.equal(f.P.conversationKey(),key);
 clone.dataset.messageId='server-id';assert.equal(f.P.conversationKey(),key);clone.dataset.messageId='different-server-id';assert.notEqual(f.P.conversationKey(),key);
});
for(const host of ['platform.arcee.ai','copilot.com'])test(host+': the first user bubble can finish rendering after the click',async()=>{
 const f=fixture(host);f.send.addEventListener('click',()=>{const row=f.add('user','First');f.P.conversationKey();queueMicrotask(()=>{row.textContent=f.ed.value;f.ed.value='';});});
 assert.equal(await f.P.typeAndSend('First full handshake message'),true);assert.equal(f.clicks(),1);
});
test('Copilot referral/sign-in query cleanup is not a new conversation',()=>{
 const f=fixture('copilot.com','/chat?fromcode=example&prompt=login&hasLW=false');f.add('user','Hello');const key=f.P.conversationKey();
 f.w.history.replaceState({},'','/chat');assert.equal(f.P.conversationKey(),key);
 f.w.history.replaceState({},'','/chat?conversationId=first');assert.equal(f.P.conversationKey(),key);
 f.w.history.pushState({},'','/chat?conversationId=other');assert.notEqual(f.P.conversationKey(),key);
});
test('Copilot an unrelated prompt query remains a real route change',()=>{
 const f=fixture('copilot.com','/chat?prompt=first-task');const key=f.P.conversationKey();f.w.history.replaceState({},'','/chat?prompt=different-task');assert.notEqual(f.P.conversationKey(),key);
});
test('Copilot explicit test IDs identify the submitted user and assistant command',async()=>{
 const f=fixture();f.send.addEventListener('click',()=>{f.add('user',f.ed.value,{marker:'data-testid'});f.add('assistant','{"command":"list_commands","params":{}}',{marker:'data-testid'});f.ed.value='';});
 assert.equal(await f.P.typeAndSend('Handshake'),true);assert.equal(f.P.userCount(),1);assert.equal(f.P.assistantCount(),1);
 const reply=f.P.readAssistant();assert.equal(f.P.commandText(reply.reply,reply.item),'{"command":"list_commands","params":{}}');
});
test('Copilot reuses an empty row mounted before Send to confirm exactly one delivery',async()=>{
 const f=fixture(),pending=f.add('user','');f.send.addEventListener('click',()=>{pending.textContent=f.ed.value;f.ed.value='';});
 assert.equal(await f.P.typeAndSend('First handshake'),true);assert.equal(f.clicks(),1);
});
test('Copilot does not confirm a stale identical user prompt merely because it remounted',async()=>{
 const f=fixture(),old=f.add('user','Handshake');f.send.addEventListener('click',()=>{old.replaceWith(old.cloneNode(true));f.ed.value='';});
 await assert.rejects(()=>f.P.typeAndSend('Handshake'),/not confirmed/);assert.equal(f.clicks(),1);assert.equal(f.P.sendRetryable(),false);
});
test('Copilot a late ID assigned to an old identical row is not a new send',async()=>{
 const f=fixture(),old=f.add('user','Handshake');f.send.addEventListener('click',()=>{old.dataset.messageId='late-id';f.ed.value='';});
 await assert.rejects(()=>f.P.typeAndSend('Handshake'),/not confirmed/);assert.equal(f.clicks(),1);
});
test('Copilot a new native message ID confirms delivery when virtualization keeps counts flat',async()=>{
 const f=fixture();f.add('user','First anchor',{id:'anchor'});const old=f.add('user','New message',{id:'old-id'});f.send.addEventListener('click',()=>{old.remove();f.add('user',f.ed.value,{id:'new-id'});f.ed.value='';});
 assert.equal(await f.P.typeAndSend('New message'),true);assert.equal(f.clicks(),1);
});
test('Copilot clears only its own retained draft after the user echo confirms Send',async()=>{
 const f=fixture();f.send.addEventListener('click',()=>f.add('user',f.ed.value));
 assert.equal(await f.P.typeAndSend('First handshake'),true);assert.equal(f.ed.value,'');assert.equal(f.clicks(),1);
});
test('Copilot preserves a different follow-up draft after confirmed delivery',async()=>{
 const f=fixture();f.send.addEventListener('click',()=>{f.add('user',f.ed.value);f.ed.value='User follow-up';});
 assert.equal(await f.P.typeAndSend('First handshake'),true);assert.equal(f.ed.value,'User follow-up');assert.equal(f.clicks(),1);
});
test('Copilot an assistant JSON alone does not prove the outgoing message was delivered',async()=>{
 const f=fixture();f.send.addEventListener('click',()=>{f.add('assistant','{"command":"list_commands"}');f.ed.value='';});
 await assert.rejects(()=>f.P.typeAndSend('Handshake'),/not confirmed/);assert.equal(f.clicks(),1);
});
test('Copilot unknown roles remain non-executable',()=>{
 const f=fixture();f.d.querySelector('#thread').innerHTML='<article class="message"><pre>{"command":"write_file"}</pre></article>';assert.equal(f.P.allItems().length,0);
});
