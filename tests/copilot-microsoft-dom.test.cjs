// Reduced Microsoft Copilot structures documented in browser-ai-chat-exporter
// 0830aad platforms/copilot/content.js. Model/DOM are controlled, not live.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const provider=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
const refusal='I cannot participate in or control external browser extensions by emitting structured commands for them.';
const request='Read the current connected Studio project and return its actual state. '.repeat(8);
function fixture(){
 const dom=new JSDOM('<!doctype html><main><section id="thread"></section><form><textarea aria-label="Message Copilot"></textarea><button type="button" aria-label="Send">Send</button><button type="button" aria-label="Stop" hidden>Stop</button></form></main>',{url:'https://copilot.com/chat/conversation/current',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();let clock=10000,serial=0,onTick=()=>{};
 w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;onTick(clock);queueMicrotask(fn);return 1;};w.HTMLElement.prototype.getBoundingClientRect=()=>({width:640,height:70,top:500,bottom:570,left:10,right:650});
 vm.runInContext(provider+'\nwindow.P=RSProvider;',c);vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parse=RSParse;',c);
 const P=w.P,ed=d.querySelector('textarea'),send=d.querySelector('[aria-label="Send"]'),stop=d.querySelector('[aria-label="Stop"]'),thread=d.querySelector('#thread'),stats={sends:0},events=[];send.onclick=()=>stats.sends++;P.init({diag:(event,data)=>events.push({event,data})});
 function user(text,{kind='testid',known=true}={}){const row=d.createElement('div');if(known){row.className='fai-UserMessage f1-custom';row.setAttribute('role','article');}row.dataset.messageId='user-'+(++serial);row.innerHTML='<span class="sr-only">You said</span><div></div><button>Copy message</button>';const body=row.querySelector('div');if(kind==='testid')body.dataset.testid='chatOutput';else body.className='fai-UserMessage__message';body.textContent=text;thread.append(row);return row;}
 function assistant(text,{kind='class',shadow=false,code=false}={}){const row=d.createElement('div');if(kind==='class'){row.className='fai-CopilotMessage f1-custom';row.setAttribute('role','article');}else if(kind==='testid')row.dataset.testid='copilot-message';row.dataset.messageId='assistant-'+(++serial);const host=d.createElement('div');host.dataset.testid='markdown-reply';row.append(host);const body=shadow?host.attachShadow({mode:'open'}):host;if(code){const pre=d.createElement('pre'),source=d.createElement('code');source.textContent=text;pre.append(source);body.append(pre);}else body.textContent=text;thread.append(row);return{row,host,body};}
 return{dom,w,d,P,ed,send,stop,thread,stats,events,user,assistant,tick:fn=>onTick=fn};
}
for(const kind of ['testid','class'])test('Copilot Microsoft user content '+kind+' and native AI article are recognized',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.user(f.ed.value,{kind});f.ed.value='';f.assistant('{"command":"list_commands","params":{}}',{code:true});});assert.equal(await f.P.typeAndSend(request),true);assert.equal(f.P.userCount(),1);assert.equal(f.P.assistantCount(),1);assert.equal(f.stats.sends,1);assert.equal(f.P.itemText(f.P.allItems()[0]),request.trim());assert.equal(f.w.parse.parseToolCalls(f.P.commandText(f.P.readAssistant().reply,f.P.lastAssistant()))[0].tool,'list_commands');
});
test('Copilot Microsoft copilot-message testid is a native AI root',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.assistant(refusal,{kind:'testid'});assert.equal(f.P.assistantCount(),1);assert.equal(f.P.isPolicyRefusal(f.P.readAssistant().reply),true);assert.equal(f.P.commandText(f.P.readAssistant().reply,f.P.lastAssistant()),'');
});
test('Copilot Microsoft article classes require exact tokens and article role',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.thread.innerHTML='<div class="fai-UserMessage">x</div><div role="article" class="other-fai-CopilotMessage">x</div><div class="fai-CopilotMessage__content">x</div><div data-testid="markdown-reply"><pre>{"command":"list_commands"}</pre></div>';assert.equal(f.P.allItems().length,0);
});
test('Copilot Microsoft nested legacy markers count each article only once',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const u=f.user(request),a=f.assistant(refusal);u.dataset.testid='user-message';a.row.dataset.testid='copilot-message';assert.equal(f.P.allItems().length,2);
});
test('Copilot open markdown-reply source preserves full Luau inside recognized AI',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const code='local label = Instance.new("TextLabel")\nlabel.Text = "Zażółć  😀"\nreturn label\n',json=JSON.stringify({command:'execute_luau',params:{code}}),a=f.assistant(json,{shadow:true,code:true}),reply=f.P.readAssistant();assert.equal(reply.reply,json);const calls=f.w.parse.parseToolCalls(f.P.commandText(reply.reply,a.row));assert.equal(calls.length,1);assert.equal(calls[0].arguments.code,code);
});
test('Copilot shadow reply excludes Copy headers, quoted commands and UI ancestor hosts',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const a=f.assistant('{"command":"list_commands","params":{}}',{shadow:true,code:true});const header=f.d.createElement('button');header.innerHTML='<pre>{"command":"wrong_copy"}</pre>';a.body.prepend(header);const quote=f.d.createElement('blockquote');quote.innerHTML='<pre>{"command":"wrong_quote"}</pre>';a.body.append(quote);const reply=f.P.readAssistant();const calls=f.w.parse.parseToolCalls(f.P.commandText(reply.reply,a.row));assert.equal(calls.length,1);assert.equal(calls[0].tool,'list_commands');const actions=f.d.createElement('div');actions.className='msg-actions';a.row.append(actions);actions.append(a.host);assert.equal(f.P.commandText(f.P.readAssistant().reply,a.row),'');
});
test('Copilot nested open reply hosts read one complete source',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const a=f.assistant('',{shadow:true}),inner=f.d.createElement('div');inner.dataset.testid='markdown-reply';a.body.append(inner);const shadow=inner.attachShadow({mode:'open'});shadow.innerHTML='<pre>{"command":"list_commands","params":{}}</pre>';const reply=f.P.readAssistant();assert.equal(f.w.parse.parseToolCalls(f.P.commandText(reply.reply,a.row)).length,1);
});
test('Copilot shadow refusal takes precedence over an apparent command',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const a=f.assistant('{"command":"list_commands","params":{}}',{shadow:true,code:true});a.body.prepend(f.d.createTextNode(refusal));assert.equal(f.P.commandText(f.P.readAssistant().reply,a.row),'');
});
test('Copilot unknown shadow hosts do not establish source or assistant roles',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const a=f.assistant('',{kind:'unknown',shadow:true,code:true});a.body.innerHTML='<pre>{"command":"list_commands"}</pre>';assert.equal(f.P.assistantCount(),0);assert.equal(f.P.readAssistant().present,false);
});
test('Copilot inactive slot fallback is never executable',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const a=f.assistant('',{shadow:true});a.body.innerHTML='<slot><pre>{"command":"execute_luau","params":{"code":"return 1"}}</pre></slot>';assert.equal(f.P.commandText(f.P.readAssistant().reply,a.row),'');
});
test('Copilot inactive light DOM never joins the active shadow command',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const a=f.assistant('{"command":"list_commands","params":{}}',{shadow:true,code:true});a.host.innerHTML='<pre>{"command":"execute_luau","params":{"code":"return 1"}}</pre>';const calls=f.w.parse.parseToolCalls(f.P.commandText(f.P.readAssistant().reply,a.row));assert.equal(calls.length,1);assert.equal(calls[0].tool,'list_commands');
});
test('Copilot unknown shadow body does not execute an inactive light DOM fallback',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const a=f.assistant(''),unknown=f.d.createElement('div');a.host.append(unknown);unknown.innerHTML='<pre>{"command":"execute_luau","params":{"code":"return 1"}}</pre>';unknown.attachShadow({mode:'open'}).textContent='Other component';assert.equal(f.P.commandText(f.P.readAssistant().reply,a.row),'');
});
test('Copilot inactive nested reply host cannot supply a second command',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const a=f.assistant('{"command":"list_commands","params":{}}',{shadow:true,code:true}),hidden=f.d.createElement('div');hidden.dataset.testid='markdown-reply';hidden.attachShadow({mode:'open'}).innerHTML='<pre>{"command":"execute_luau","params":{"code":"return 1"}}</pre>';a.host.append(hidden);const calls=f.w.parse.parseToolCalls(f.P.commandText(f.P.readAssistant().reply,a.row));assert.equal(calls.length,1);assert.equal(calls[0].tool,'list_commands');
});
test('Copilot exact screenshot refusal is detected without confirming an unrecognized user echo',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.user(f.ed.value,{known:false});f.ed.value='';f.assistant(refusal);});await assert.rejects(()=>f.P.typeAndSend(request),error=>error.plazcodePolicyRefusal===true&&/Copilot declined/.test(error.message));assert.equal(f.stats.sends,1);assert.equal(f.P.userCount(),0);assert.equal(f.P.sendFailureAmbiguous(),true);assert.equal(f.P.sendRetryable(),false);
});
test('Copilot fresh shadow refusal without a user echo also stops delivery',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.ed.value='';f.assistant(refusal,{shadow:true});});await assert.rejects(()=>f.P.typeAndSend(request),error=>error.plazcodePolicyRefusal===true);assert.equal(f.stats.sends,1);
});
for(const remount of [false,true])test('Copilot old refusal is not attributed to the current send'+(remount?' after remount':''),async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const a=f.assistant(refusal);f.send.addEventListener('click',()=>{if(remount)a.row.replaceWith(a.row.cloneNode(true));f.ed.value='';});await assert.rejects(()=>f.P.typeAndSend(request),error=>!error.plazcodePolicyRefusal&&/not confirmed/.test(error.message));assert.equal(f.stats.sends,1);
});
test('Copilot duplicate old assistant ID does not become a fresh refusal',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const a=f.assistant(refusal);f.send.addEventListener('click',()=>{f.thread.append(a.row.cloneNode(true));f.ed.value='';});await assert.rejects(()=>f.P.typeAndSend(request),error=>!error.plazcodePolicyRefusal&&/not confirmed/.test(error.message));assert.equal(f.stats.sends,1);
});
test('Copilot quoted refusal in a fresh answer does not become a send refusal',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.ed.value='';const a=f.assistant('This is a quotation:');const q=f.d.createElement('blockquote');q.textContent=refusal;a.body.append(q);});await assert.rejects(()=>f.P.typeAndSend(request),error=>!error.plazcodePolicyRefusal&&/not confirmed/.test(error.message));
});
test('Copilot streaming refusal text is not a settled decision',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());let a,ticks=0;f.send.addEventListener('click',()=>{f.ed.value='';a=f.assistant(refusal);f.stop.hidden=false;});f.tick(()=>{if(a&&++ticks===6){a.body.textContent='I incorrectly said I cannot access Studio. Here is the requested JSON.';f.stop.hidden=true;}});await assert.rejects(()=>f.P.typeAndSend(request),error=>!error.plazcodePolicyRefusal&&/not confirmed/.test(error.message));assert.equal(f.stats.sends,1);
});
for(const action of ['stop','chat'])test('Copilot '+action+' during refusal wait retains ownership',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());let sent=false;f.send.addEventListener('click',()=>{f.ed.value='';f.assistant(refusal);sent=true;});f.tick(()=>{if(sent){sent=false;if(action==='stop')f.P.stopGeneration();else f.w.history.pushState({},'','/chat/conversation/other');}});await assert.rejects(()=>f.P.typeAndSend(request),action==='stop'?/stopped/:/chat changed/);assert.equal(f.stats.sends,1);
});
test('Copilot unconfirmed transcript diagnostics contain counts rather than source',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.user(f.ed.value,{known:false});f.ed.value='';});await assert.rejects(()=>f.P.typeAndSend(request),/not confirmed/);const entry=f.events.find(x=>x.event==='copilot.unconfirmedDelivery');assert.equal(entry.data.transcriptShape.microsoftUsers,0);assert.equal(typeof entry.data.transcriptShape.articles,'number');assert.equal(JSON.stringify(entry.data).includes(request.slice(0,40)),false);assert.equal(f.stats.sends,1);
});
