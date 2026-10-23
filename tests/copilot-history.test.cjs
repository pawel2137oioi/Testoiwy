// Collapsible history variants; authenticated Copilot DOM remains unverified.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const provider=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
const outbound='Read the connected Studio project and return its actual current state. '.repeat(8);
function fixture(){
 const dom=new JSDOM('<!doctype html><main><section id="thread"></section><form><textarea aria-label="Message Copilot"></textarea><button type="button" aria-label="Send">Send</button></form></main>',{url:'https://copilot.com/chat/conversation/current',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();let clock=10000,seq=0;
 w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};
 w.HTMLElement.prototype.getBoundingClientRect=()=>({width:640,height:70,top:500,bottom:570,left:10,right:650});
 vm.runInContext(provider+'\nwindow.P=RSProvider;',c);vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parse=RSParse;',c);
 const P=w.P,ed=d.querySelector('textarea'),send=d.querySelector('form button'),stats={sends:0,expands:0};send.onclick=()=>stats.sends++;
 function user(text,{kind='disclosure',collapsed=false,id='u'+(++seq),onExpand,staysCollapsed=false}={}){
   const row=d.createElement(kind==='button'?'button':'div');row.dataset.messageId=id;
   if(kind==='content-marker')row.dataset.testid='user-message-content';else if(kind==='wrapper-marker')row.dataset.testid='user-message-container';else row.dataset.content='user-message';
   const source=d.createElement('p');source.textContent=collapsed?text.slice(0,110)+'…':text;
   if(kind==='plain'||kind==='child-controls')source.dataset.testid='user-message-text';
   let disclosure=row;
   if(kind==='nested'){disclosure=d.createElement('div');disclosure.setAttribute('role','button');disclosure.setAttribute('aria-expanded','true');row.append(disclosure);}
   if(['disclosure','button'].includes(kind)){row.setAttribute('role','button');row.setAttribute('aria-expanded',collapsed?'false':'true');}
   (kind==='nested'?disclosure:row).append(source);
   if(kind==='child-controls'){
     source.id='source-'+seq;disclosure=d.createElement('button');disclosure.type='button';disclosure.setAttribute('aria-expanded',collapsed?'false':'true');disclosure.setAttribute('aria-controls',source.id);disclosure.textContent='Show more';row.append(disclosure);
   }
   const actions=d.createElement('div');actions.className='msg-actions';actions.innerHTML='<button aria-expanded="false">Copy text</button>';row.append(actions);
   if(kind==='plain'){const meta=d.createElement('span');meta.textContent='You said · 12:00';row.prepend(meta);}
   disclosure.onclick=()=>{stats.expands++;if(!staysCollapsed){source.textContent=text;disclosure.setAttribute('aria-expanded','true');}onExpand?.(row);};
   d.querySelector('#thread').append(row);return row;
 }
 function assistant({button=false}={}){const row=d.createElement('div');row.dataset.content='ai-message';row.dataset.messageId='a'+(++seq);if(button)row.setAttribute('role','button');row.innerHTML='<div class="markdown"><pre><code>{"command":"list_commands","params":{}}</code></pre></div><div class="msg-actions"><button aria-expanded="true"><pre>{"command":"wrong_copy_menu"}</pre></button></div>';d.querySelector('#thread').append(row);return row;}
 return{dom,w,d,c,P,ed,send,stats,user,assistant};
}
for(const kind of ['disclosure','button','nested','plain','content-marker','wrapper-marker'])test('Copilot readable user history: '+kind,async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.user(f.ed.value,{kind});f.ed.value='';f.assistant();});
 assert.equal(await f.P.typeAndSend(outbound),true);assert.equal(f.P.userCount(),1);assert.equal(f.P.itemText(f.P.allItems().find(f.P.isUserItem)),outbound.trim());assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,0);
});
for(const kind of ['disclosure','child-controls'])test('Copilot expands only the new submitted prefix once: '+kind,async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.user('Previous request',{id:'old'});f.send.addEventListener('click',()=>{f.user(f.ed.value,{kind,collapsed:true});f.ed.value='';f.assistant();});
 assert.equal(await f.P.typeAndSend(outbound),true);assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,1);
});
test('Copilot CSS-collapsed full source confirms without any expansion click',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{const row=f.user(f.ed.value);row.style.cssText='max-height:40px;overflow:hidden';row.setAttribute('aria-expanded','false');f.ed.value='';});
 assert.equal(await f.P.typeAndSend(outbound),true);assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,0);
});
test('Copilot a truncated history item is not accepted as a complete echo',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.user(f.ed.value,{collapsed:true,staysCollapsed:true});f.ed.value='';f.assistant();});
 await assert.rejects(()=>f.P.typeAndSend(outbound),/not confirmed.*closest text/);assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,1);assert.equal(f.P.sendRetryable(),false);
});
test('Copilot an old matching collapsed message is never expanded as a new send',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.user(outbound,{collapsed:true,id:'old'});f.send.addEventListener('click',()=>{f.ed.value='';f.assistant();});
 await assert.rejects(()=>f.P.typeAndSend(outbound),/not confirmed/);assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,0);
});
test('Copilot remounting an old anonymous collapsed message and assigning its ID cannot prove Send',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const old=f.user(outbound,{collapsed:true});old.removeAttribute('data-message-id');f.send.addEventListener('click',()=>{const clone=old.cloneNode(true);clone.dataset.messageId='late-id';old.replaceWith(clone);f.ed.value='';f.assistant();});
 await assert.rejects(()=>f.P.typeAndSend(outbound),/not confirmed/);assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,0);
});
test('Copilot a different prefix is never clicked or acknowledged',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.user('Different text '.repeat(40),{collapsed:true});f.ed.value='';});
 await assert.rejects(()=>f.P.typeAndSend(outbound),/not confirmed/);assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,0);
});
test('Copilot a short overlapping preview is not enough to expand a message',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{const row=f.user(f.ed.value,{collapsed:true});row.querySelector('p').textContent=outbound.slice(0,20)+'…';f.ed.value='';});await assert.rejects(()=>f.P.typeAndSend(outbound),/not confirmed/);assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,0);
});
test('Copilot a disclosure controlling a different history item is never clicked',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const foreign=f.d.createElement('p');foreign.id='foreign-full';foreign.textContent=outbound;f.d.querySelector('#thread').append(foreign);f.send.addEventListener('click',()=>{const row=f.user(f.ed.value,{kind:'child-controls',collapsed:true});row.querySelector('[aria-controls]').setAttribute('aria-controls','foreign-full');f.ed.value='';});await assert.rejects(()=>f.P.typeAndSend(outbound),/not confirmed/);assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,0);
});
for(const action of ['stop','chat','remount'])test('Copilot '+action+' during history disclosure respects delivery ownership',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.user(f.ed.value,{collapsed:true,onExpand:row=>{if(action==='stop')f.P.stopGeneration();else if(action==='chat')f.w.history.pushState({},'','/chat/conversation/other');else row.replaceWith(row.cloneNode(true));}});f.ed.value='';});
 if(action==='remount')assert.equal(await f.P.typeAndSend(outbound),true);else await assert.rejects(()=>f.P.typeAndSend(outbound),action==='stop'?/stopped/:/chat changed/);
 assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,1);
});
test('Copilot recognized assistant disclosure keeps code and excludes Copy/menu examples',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const row=f.assistant({button:true}),reply=f.P.readAssistant();const calls=f.w.parse.parseToolCalls(f.P.commandText(reply.reply,row));assert.equal(calls.length,1);assert.equal(calls[0].tool,'list_commands');
});
test('Copilot an assistant JSON alone is not a user delivery receipt',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.ed.value='';f.assistant({button:true});});await assert.rejects(()=>f.P.typeAndSend(outbound),/not confirmed.*Read user messages: 0/);assert.equal(f.stats.sends,1);
});
test('Copilot an unmarked disclosure never becomes an executable assistant role',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.d.querySelector('#thread').innerHTML='<div role="button" aria-expanded="false"><pre>{"command":"execute_luau","params":{"code":"return 1"}}</pre></div>';assert.equal(f.P.allItems().length,0);
});
