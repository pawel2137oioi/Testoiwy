// Regressions for the supplied Meta refusal screenshot and public native hooks.
// Native hooks: chang-pro/meta-ai-mcp @ 1576376f32e6f0772eb9052020e30be4c5e72e14,
// meta_chat.py 97-113 (.ur-markdown) and semantic button labels. This is a
// controlled DOM fixture, not a signed-in Meta session.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
const refusal="I can't participate in that external agent workflow where a browser extension reads structured commands from my replies.\n\nThat pattern would let an outside tool execute actions based on my output, which I can't do. I'm happy to help directly with your Roblox Studio project here in chat — for example, writing or reviewing Lua, explaining APIs, or debugging — if you paste the code or describe what you'd want to build.";
function fixture({label='Send',field='known',onSend}={}){
 const attrs=field==='known'?'data-testid="composer-input"':field==='placeholder'?'placeholder="Zapytaj Meta AI…"':'aria-label="Ask Meta AI"';
 const dom=new JSDOM('<!doctype html><main><section id="thread"></section><div id="composer"><textarea '+attrs+'></textarea><div role="button" tabindex="0" aria-label="'+label+'">↑</div></div></main>',{url:'https://www.meta.ai/prompt/current',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();let clock=10000,serial=0;
 w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};
 w.HTMLElement.prototype.getBoundingClientRect=function(){return {width:this.hidden?0:640,height:this.hidden?0:70,top:500,bottom:570,left:10,right:650};};
 vm.runInContext(source+'\nwindow.P=RSProvider;',c);vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;',c);
 const ed=d.querySelector('textarea'),send=d.querySelector('[role="button"]'),stats={clicks:0};
 const user=(text,attrs={})=>{const row=d.createElement('article');row.dataset.role='user';row.dataset.messageId='u'+(++serial);row.textContent=text;for(const [key,value] of Object.entries(attrs))row.setAttribute(key,value);d.querySelector('#thread').append(row);return row;};
 const assistant=(text,{native=true,id}={})=>{const row=d.createElement('section');if(native)row.className='ur-markdown';else row.dataset.role='assistant';if(id)row.dataset.messageId=id;row.textContent=text;d.querySelector('#thread').append(row);return row;};
 send.onclick=()=>{stats.clicks++;if(onSend)return onSend({w,d,P:w.P,ed,send,user,assistant});user(ed.value);ed.value='';};
 return{dom,w,d,P:w.P,parser:w.parser,ed,send,stats,user,assistant};
}
for(const label of ['Send message','Wyślij wiadomość','Envoyer un message','Отправить'])test('Meta semantic role button is recognized: '+label,async t=>{
 const f=fixture({label});t.after(()=>f.dom.window.close());assert.equal(f.P.getEditor(),f.ed);assert.equal(f.P.composerFrame(),f.d.querySelector('#composer'));
 assert.equal(await f.P.typeAndSend('A complete known native message'),true);assert.equal(f.stats.clicks,1);assert.equal(f.ed.value,'');
});
for(const field of ['placeholder','aria'])test('Meta visible textarea with native '+field+' is recognized without a test ID',async t=>{
 const f=fixture({field});t.after(()=>f.dom.window.close());assert.equal(f.P.getEditor(),f.ed);assert.equal(await f.P.typeAndSend('A complete native message'),true);assert.equal(f.stats.clicks,1);
});
for(const label of ['Zatrzymaj generowanie','Przerwij odpowiedź','Arrêter la réponse','Остановить генерацию'])test('Meta localized role Stop remains a hard generation signal: '+label,async t=>{
 const f=fixture({label});t.after(()=>f.dom.window.close());assert.equal(f.P.isHardGenerating(),true);assert.equal(f.P.isBusyNow(),true);
 await assert.rejects(()=>f.P.typeAndSend('A new request'),/wait for the current response/);assert.equal(f.stats.clicks,0);assert.equal(f.ed.value,'');
});
test('the exact supplied refusal is read from the native .ur-markdown response',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const row=f.assistant(refusal);assert.equal(f.P.isPolicyRefusal(refusal),true);assert.equal(f.P.assistantCount(),1);assert.equal(f.P.lastAssistant(),row);assert.equal(f.P.readAssistant().reply,refusal);assert.equal(f.P.commandText(refusal,row),'');
});
for(const marker of ['data-message-role','data-author'])test('Meta explicit '+marker+' roles are recognized without guessing class substrings',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.d.querySelector('#thread').innerHTML='<article '+marker+'="user">Question</article><article '+marker+'="assistant">Answer</article><div class="some-assistant-label">Not a turn</div>';
 assert.equal(f.P.userCount(),1);assert.equal(f.P.assistantCount(),1);assert.equal(f.P.readAssistant().reply,'Answer');
});
test('legacy native user turn is recognized alongside current .ur-markdown assistant source',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const thread=f.d.querySelector('#thread');thread.className='flex flex-col';thread.innerHTML='<div class="starting:opacity-0">Question</div><div class="starting:opacity-0"><div class="ur-markdown">Answer</div></div>';
 assert.equal(f.P.userCount(),1);assert.equal(f.P.assistantCount(),1);assert.equal(f.P.itemText(f.P.allItems()[0]),'Question');assert.equal(f.P.readAssistant().reply,'Answer');
});
test('a new native refusal ends uncertain delivery as refusal instead of generic send failure',async t=>{
 const f=fixture({onSend({ed,assistant}){ed.value='';assistant(refusal);}});t.after(()=>f.dom.window.close());
 await assert.rejects(()=>f.P.typeAndSend('A confirmed user connection request'),error=>error.plazcodePolicyRefusal===true&&/Meta AI declined the connection request/.test(error.message));
 assert.equal(f.stats.clicks,1);assert.equal(f.P.sendRetryable(),false);assert.equal(f.P.canRestoreSession(),false);assert.equal(f.ed.value,'');
});
test('an old refusal does not block a separate later request whose own echo is confirmed',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.assistant(refusal);assert.equal(await f.P.typeAndSend('A later explicit connection request'),true);assert.equal(f.stats.clicks,1);
});
test('remounting an old anonymous refusal is not a new rejection or a delivery receipt',async t=>{
 let old;const f=fixture({onSend({ed}){ed.value='';old.replaceWith(old.cloneNode(true));}});t.after(()=>f.dom.window.close());old=f.assistant(refusal);
 await assert.rejects(()=>f.P.typeAndSend('A later connection request'),error=>!error.plazcodePolicyRefusal&&/not confirmed/.test(error.message));assert.equal(f.stats.clicks,1);
});
test('quoted native response styling, reasoning and user-contained .ur-markdown never become assistant turns',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.d.querySelector('#thread').innerHTML='<blockquote><div class="ur-markdown">Quote</div></blockquote><div data-testid="thinking-status"><div class="ur-markdown">Reasoning</div></div><article data-role="user"><div class="ur-markdown">User text</div></article>';
 assert.equal(f.P.assistantCount(),0);
});
test('Meta disabled role Send is never force enabled or re-clicked',async t=>{
 const f=fixture({label:'Wyślij wiadomość'});t.after(()=>f.dom.window.close());f.send.setAttribute('aria-disabled','true');
 await assert.rejects(()=>f.P.typeAndSend('A complete draft'),/send is unavailable/);assert.equal(f.send.getAttribute('aria-disabled'),'true');assert.equal(f.stats.clicks,0);assert.equal(f.ed.value,'A complete draft');
});
test('two equally plausible Meta role Send controls remain ambiguous',async t=>{
 const f=fixture({label:'Wyślij wiadomość'});t.after(()=>f.dom.window.close());f.send.after(f.send.cloneNode(true));
 await assert.rejects(()=>f.P.typeAndSend('A complete draft'),/send is unavailable/);assert.equal(f.stats.clicks,0);
});
test('full command source is preserved inside the documented Meta reply root',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const row=f.assistant('');const pre=f.d.createElement('pre'),code=f.d.createElement('code');const source='local p=Instance.new("Part")\n\np.Color=Color3.fromRGB(1,2,3)\nreturn "Zażółć 😀"';code.textContent=JSON.stringify({command:'execute_luau',params:{code:source}});pre.append(code);row.append(pre);
 const calls=f.parser.parseToolCalls(f.P.commandText(f.P.itemText(row),row));assert.equal(calls.length,1);assert.equal(calls[0].arguments.code,source);
});
function delayedNativeReceipt({echo=true,answer='The native response finished.',stop=true,cancel=false}={}){
 let sentAt=0,replyMounted=false,nativeStops=0;
 const f=fixture({onSend({w,d,ed,send,user}){
   if(send.getAttribute('aria-label')==='Zatrzymaj generowanie'){nativeStops++;send.setAttribute('aria-label','Wyślij wiadomość');return;}
   sentAt=w.Date.now();if(echo){const row=user(ed.value);delete row.dataset.role;delete row.dataset.messageId;row.className='starting:opacity-0';}
   ed.value='';if(stop)send.setAttribute('aria-label','Zatrzymaj generowanie');
 }});
 f.d.querySelector('#thread').className='flex flex-col';
 const schedule=f.w.setTimeout;
 f.w.setTimeout=fn=>schedule(()=>{
   if(sentAt&&!replyMounted&&f.w.Date.now()-sentAt>=13200){
     replyMounted=true;
     if(cancel)f.P.stopGeneration();
     else{f.assistant(answer);f.send.setAttribute('aria-label','Wyślij wiadomość');}
   }
   fn();
 });
 return Object.assign(f,{elapsed:()=>f.w.Date.now()-sentAt,nativeStops:()=>nativeStops});
}
test('Meta waits once for a late legacy echo while native Stop is active, without another Send',async t=>{
 const f=delayedNativeReceipt();t.after(()=>f.dom.window.close());
 assert.equal(await f.P.typeAndSend('A full native connection request'),true);assert.equal(f.stats.clicks,1);assert.equal(f.P.userCount(),1);assert.equal(f.P.assistantCount(),1);assert.ok(f.elapsed()>=13200&&f.elapsed()<42000);
});
test('Meta native Stop extends the receipt wait but never substitutes for an exact user echo',async t=>{
 const f=delayedNativeReceipt({echo:false});t.after(()=>f.dom.window.close());
 await assert.rejects(()=>f.P.typeAndSend('A full native connection request'),/message was not confirmed/);assert.equal(f.stats.clicks,1);assert.equal(f.P.sendRetryable(),false);assert.ok(f.elapsed()>=42000&&f.elapsed()<42500);
});
test('Meta without native Stop keeps the original bounded receipt deadline',async t=>{
 const f=delayedNativeReceipt({echo:false,stop:false});t.after(()=>f.dom.window.close());
 await assert.rejects(()=>f.P.typeAndSend('A full native connection request'),/message was not confirmed/);assert.equal(f.stats.clicks,1);assert.ok(f.elapsed()>=12000&&f.elapsed()<13200);assert.equal(f.P.assistantCount(),0);
});
test('a late native refusal stops Meta during the extra receipt wait without retrying',async t=>{
 const f=delayedNativeReceipt({echo:false,answer:refusal});t.after(()=>f.dom.window.close());
 await assert.rejects(()=>f.P.typeAndSend('A full native connection request'),error=>error.plazcodePolicyRefusal===true);assert.equal(f.stats.clicks,1);assert.ok(f.elapsed()>=13200&&f.elapsed()<42000);
});
test('native Stop cancels the extended Meta receipt wait and never sends the request again',async t=>{
 const f=delayedNativeReceipt({cancel:true});t.after(()=>f.dom.window.close());
 await assert.rejects(()=>f.P.typeAndSend('A full native connection request'),/send stopped/);assert.equal(f.stats.clicks,2);assert.equal(f.nativeStops(),1);assert.equal(f.P.assistantCount(),0);assert.ok(f.elapsed()>=13200&&f.elapsed()<42000);
});
