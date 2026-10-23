// Named Copilot turn markers documented by two public exporters; fixture is
// reduced and authored here, not a capture of the user's authenticated page.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
const request='Read the current connected Studio project and return its actual state. '.repeat(8);
function fixture(){
 const dom=new JSDOM('<!doctype html><main><section data-content="conversation"></section><form><textarea aria-label="Message Copilot"></textarea><button type="button" aria-label="Send">Send</button></form></main>',{url:'https://copilot.com/chat',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();let clock=10000,seq=0;
 w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};w.HTMLElement.prototype.getBoundingClientRect=()=>({width:600,height:50,top:500,bottom:550,left:10,right:610});
 vm.runInContext(source+'\nwindow.P=RSProvider;',c);vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parse=RSParse;',c);
 const P=w.P,thread=d.querySelector('section'),ed=d.querySelector('textarea'),send=d.querySelector('form button'),stats={sends:0,expands:0};send.onclick=()=>stats.sends++;
 function user(text,{id='turn-'+(++seq)+'-user-message',truncated=false}={}){
  const row=d.createElement('div');row.className='group/user-message space-y-1';row.id=id;row.setAttribute('role','article');
  row.innerHTML='<h2 data-copy="false" class="sr-only">You said</h2><div class="max-w-user-text-message"></div><div data-testid="user-message-reactions"><button>Copy message</button></div>';
  const body=row.querySelector('.max-w-user-text-message');body.id='source-'+seq;body.textContent=truncated?text.slice(0,110)+'…':text;
  if(truncated){const toggle=d.createElement('button');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',body.id);toggle.textContent='Show more';toggle.onclick=()=>{stats.expands++;body.textContent=text;toggle.setAttribute('aria-expanded','true');};row.append(toggle);}
  thread.append(row);return row;
 }
 function assistant({kind='testid',text='{"command":"list_commands","params":{}}',code=true}={}){
  const row=d.createElement('div');if(kind==='testid')row.dataset.testid='ai-message';else row.className='group/ai-message';row.setAttribute('role','article');
  row.innerHTML='<h2 class="sr-only" data-copy="false">Copilot said</h2><div class="group/ai-message-item space-y-3"></div><div data-testid="message-item-reactions"><button>Copy message</button><span>Feedback</span></div>';
  const body=row.querySelector('[class~="group/ai-message-item"]');if(code){const pre=d.createElement('pre'),node=d.createElement('code');node.textContent=text;pre.append(node);body.append(pre);}else body.textContent=text;thread.append(row);return row;
 }
 return{dom,w,d,P,thread,ed,send,stats,user,assistant};
}
for(const kind of ['testid','class'])test('Copilot named user group and '+kind+' AI root without legacy attributes',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const u=f.user(request),a=f.assistant({kind});assert.equal(f.P.allItems().length,2);assert.equal(f.P.userCount(),1);assert.equal(f.P.assistantCount(),1);assert.equal(f.P.isUserItem(u),true);assert.equal(f.P.isAssistantItem(a),true);assert.equal(f.P.itemText(u),request.trim());
 const reply=f.P.readAssistant();assert.equal(reply.present,true);assert.equal(reply.reply,'{"command":"list_commands","params":{}}');assert.equal(f.w.parse.parseToolCalls(f.P.commandText(reply.reply,a))[0].tool,'list_commands');
});
test('Copilot nested legacy and named markers count one turn and exclude reaction metadata',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const u=f.user('Literal user source'),a=f.assistant();u.querySelector('.max-w-user-text-message').dataset.content='user-message';a.dataset.content='ai-message';a.querySelector('[class~="group/ai-message-item"]').dataset.testid='assistant-message-content';assert.equal(f.P.allItems().length,2);assert.equal(f.P.itemText(u),'Literal user source');assert.equal(f.P.itemText(a),'{"command":"list_commands","params":{}}');
});
test('Copilot group-hover, substring classes, AI item body alone and visual alignment do not assign roles',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.thread.innerHTML='<div class="group-hover/user-message:opacity-100">x</div><div class="other-group/user-message">x</div><div class="group/ai-message-item"><pre>{"command":"execute_luau"}</pre></div><div class="justify-end markdown prose">{"command":"list_commands"}</div>';assert.equal(f.P.allItems().length,0);
});
for(const context of ['nav','aside','pre','code','blockquote','dialog','editor'])test('Copilot named marker in '+context+' is not a transcript turn',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const parent=f.d.createElement(['dialog','editor'].includes(context)?'div':context);if(context==='dialog')parent.setAttribute('role','dialog');if(context==='editor')parent.contentEditable='true';if(context==='editor')parent.setAttribute('contenteditable','true');f.thread.append(parent);const u=f.user('Quoted example'),a=f.assistant();parent.append(u,a);assert.equal(f.P.allItems().length,0);
});
for(const truncated of [false,true])test('Copilot named markers confirm one send'+(truncated?' after one scoped expansion':''),async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.user(f.ed.value,{truncated});f.ed.value='';f.assistant();f.w.history.replaceState({},'','/chat/conversation/saved');});assert.equal(await f.P.typeAndSend(request),true);assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,truncated?1:0);assert.equal(f.P.userCount(),1);
});
test('Copilot native user-message ID survives a remount and changed disclosure text',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const u=f.user(request,{id:'stable-user-message',truncated:true});assert.equal(f.P.userCount(),1);const key=f.P.conversationKey(),replacement=f.user(request,{id:'stable-user-message'});u.replaceWith(replacement);assert.equal(f.P.conversationKey(),key);
});
test('Copilot native user-message article ID identifies a turn without named classes',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{const u=f.user(f.ed.value);u.className='space-y-1';f.ed.value='';f.assistant();});assert.equal(await f.P.typeAndSend(request),true);assert.equal(f.P.userCount(),1);assert.equal(f.stats.sends,1);
});
test('Copilot arbitrary ID suffix without article role is not a user marker',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.thread.innerHTML='<div id="unrelated-user-message">Example</div>';assert.equal(f.P.userCount(),0);
});
test('Copilot old named user group remount is not a new delivery',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const old=f.user(request,{id:'old-user-message'});f.send.addEventListener('click',()=>{old.replaceWith(old.cloneNode(true));f.ed.value='';f.assistant();});await assert.rejects(()=>f.P.typeAndSend(request),/not confirmed/);assert.equal(f.stats.sends,1);assert.equal(f.stats.expands,0);
});
test('Copilot named AI JSON without user receipt cannot confirm delivery',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.ed.value='';f.assistant();});await assert.rejects(()=>f.P.typeAndSend(request),/not confirmed/);assert.equal(f.stats.sends,1);
});
test('Copilot named group retained draft is cleared only after confirmed delivery',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.send.addEventListener('click',()=>{f.user(f.ed.value);f.assistant();});assert.equal(await f.P.typeAndSend(request),true);assert.equal(f.P.editorText(),'');assert.equal(f.stats.sends,1);
});
test('Copilot named AI text and preceding context restore only acknowledged startup',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.user('Output of \'list_commands\':\nBEGIN CONTEXT PART');f.assistant({text:'PlazCode is ready.',code:false});assert.equal(f.P.canRestoreSession(),true);assert.equal(f.P.readAssistant().reply,'PlazCode is ready.');
});
