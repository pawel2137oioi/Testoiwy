// SPDX-License-Identifier: GPL-3.0-or-later
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');const root=path.resolve(__dirname,'..');
const provider=fs.readFileSync(path.join(root,'providers/webchats.js'),'utf8');
function fixture(host,html){
 const dom=new JSDOM('<!doctype html><main>'+html+'</main>',{url:'https://'+host+'/chat/test',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();
 let clock=10000;w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};w.setInterval=()=>1;
 w.HTMLElement.prototype.getBoundingClientRect=function(){return{width:this.hidden?0:640,height:this.hidden?0:60,top:500,bottom:560,left:100,right:740};};
 vm.runInContext(provider+'\nwindow.P=RSProvider;',c);return{dom,w,d,c,P:w.P};
}
function copilot(){
 const f=fixture('copilot.com','<section><form><textarea placeholder="Message Copilot"></textarea><button type="button" aria-label="Send">Send</button></form></section><div id="thread"><div data-role="user" data-message-id="u1">aa</div><div data-role="assistant" data-message-id="a1">Cześć!</div></div>');let clicks=0;
 f.d.querySelector('button').onclick=()=>{clicks++;const ed=f.P.getEditor(),row=f.d.createElement('div');row.dataset.role='user';row.textContent=ed.value;f.d.querySelector('#thread').append(row);ed.value='';};
 return{...f,clicks:()=>clicks};
}
for(const when of ['focus','input'])test('Copilot adopts an exact replacement in the same composer after '+when,async()=>{
 const f=copilot(),old=f.P.getEditor();f.P.setInputLock(true);
 old.addEventListener(when,()=>{const replacement=old.cloneNode();replacement.value=old.value;old.replaceWith(replacement);},{once:true});
 assert.equal(await f.P.typeAndSend('First full message'),true);assert.equal(f.clicks(),1);assert.notEqual(f.P.getEditor(),old);f.P.setInputLock(false);assert.equal(f.P.getEditor().readOnly,false);
});
test('Copilot preserves a user draft in a replacement instead of overwriting it',async()=>{
 const f=copilot(),old=f.P.getEditor();old.onfocus=()=>{const replacement=old.cloneNode();replacement.value='User replacement draft';old.replaceWith(replacement);};
 await assert.rejects(()=>f.P.typeAndSend('internal'),/prepared text changed after focusing/);assert.equal(f.clicks(),0);assert.equal(f.P.editorText(),'User replacement draft');
});
test('Copilot rejects a different composer outside the captured local boundary',async()=>{
 const f=copilot(),old=f.P.getEditor();old.oninput=()=>{const newSection=f.d.createElement('section');newSection.innerHTML='<form><textarea placeholder="Message Copilot"></textarea><button aria-label="Send">Send</button></form>';newSection.querySelector('textarea').value=old.value;f.d.querySelector('section').replaceWith(newSection);};
 await assert.rejects(()=>f.P.typeAndSend('internal'),/composer changed/);assert.equal(f.clicks(),0);
});
test('Copilot still aborts a real conversation switch before commit',async()=>{
 const f=copilot();f.P.getEditor().oninput=()=>f.w.history.pushState({},'','/chat/different');
 await assert.rejects(()=>f.P.typeAndSend('internal'),/chat changed/);assert.equal(f.clicks(),0);
});
test('Copilot never clicks a Send which changed the complete source while becoming enabled',async()=>{
 const f=copilot();f.P.getEditor().oninput=event=>event.target.value='Different text';
 await assert.rejects(()=>f.P.typeAndSend('Full exact source'),/prepared text changed/);assert.equal(f.clicks(),0);assert.equal(f.P.editorText(),'Different text');
});
test('Stop during Copilot remount aborts without resubmitting',async()=>{
 const f=copilot();f.P.getEditor().oninput=()=>f.P.stopGeneration();
 await assert.rejects(()=>f.P.typeAndSend('internal'),/stopped/);assert.equal(f.clicks(),0);
});
function arcee(value,{tap=true,domText='partial viewport'}={}){
 const f=fixture('platform.arcee.ai','<div data-role="assistant" class="chat-message"><div>Trinity Large Thinking</div><div class="chat-response-content"><div class="markdown-content"><div class="code-input-header">js<button>Copy</button></div><div class="cm-editor"><div class="cm-gutters">1 2 3</div><div class="cm-content"><div class="cm-line"></div></div></div></div></div></div>');
 const content=f.d.querySelector('.cm-content');content.querySelector('.cm-line').textContent=domText;
 const publish=text=>{content.cmView={rootView:{view:{state:{doc:{length:text.length,toString:()=>text}}}}};};publish(value);
 if(tap)vm.runInContext(fs.readFileSync(path.join(root,'providers/chatgpt-cm.js'),'utf8'),f.c);
 vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;',f.c);
 const parse=()=>{const reply=f.P.readAssistant();return f.w.parser.parseToolCalls(f.P.commandText(reply.reply,reply.item));};
 return{...f,content,publish,parse};
}
test('Arcee screenshot: CodeMirror js/on artifact yields the actual list_commands request',()=>{
 const f=arcee('on\n{\n  "command": "list_commands",\n  "params": {}\n}');
 const calls=f.parse();assert.equal(calls.length,1);assert.equal(calls[0].tool,'list_commands');assert.equal(f.content.getAttribute('data-rs-cm-len'),String(f.content.getAttribute('data-rs-cm').length));assert.ok(f.P.findToolBlockSpot(f.P.lastAssistant()));
});
test('Arcee CodeMirror full document preserves long Luau, blank lines and Unicode despite virtualization',()=>{
 const source='local p = Instance.new("Part")\n\nlocal color = Color3.fromRGB(1, 2, 3)\n'+('-- Zażółć 🦊\n'.repeat(2000))+'return p';
 const f=arcee('###LUA###\n'+source+'\n###END_LUA###');assert.equal(f.parse()[0].arguments.code,source);
});
test('Arcee full JSON source is unwrapped without altering on/newlines inside parameter strings',()=>{
 const source='local text = "on"\n\nreturn text',f=arcee('on\n'+JSON.stringify({command:'execute_luau',params:{code:source}}));assert.equal(f.parse()[0].arguments.code,source);
});
test('Arcee immutable CodeMirror document updates of equal length are refreshed',()=>{
 const f=arcee('{"command":"first"}');assert.equal(f.parse()[0].tool,'first');f.publish('{"command":"other"}');assert.equal(f.parse()[0].tool,'other');
});
test('Arcee never executes a partial viewport if the full-document tap is unavailable',()=>{
 const f=arcee('{"command":"list_commands"}',{tap:false,domText:'{"command":"wrong_viewport"}'});assert.equal(f.parse().length,0);
});
for(const source of ['on\n{"command":','on\nconst sample = {"command":"write_file"};','on\n{"command":"a"}\n{"command":"b"}'])test('Arcee does not repair arbitrary or incomplete code: '+source,()=>{assert.equal(arcee(source).parse().length,0);});
test('Arcee reasoning/quoted commands cannot become executable CodeMirror replies',()=>{
 const f=arcee('{"command":"list_commands"}');const item=f.P.lastAssistant(),cm=f.d.querySelector('.cm-editor');const quote=f.d.createElement('blockquote');cm.replaceWith(quote);quote.append(cm);assert.equal(f.parse().length,0);
 quote.replaceWith(cm);const thought=f.d.createElement('section');thought.dataset.variant='Thoughts';cm.replaceWith(thought);thought.append(cm);assert.equal(f.parse().length,0);assert.equal(f.P.findToolBlockSpot(item),null);
});
test('Arcee requests plain JSON for the initial handshake and its one correction',()=>{
 const f=arcee('');assert.match(f.P.startupRequest('roblox'),/plain JSON/);assert.match(f.P.startupCorrection,/plain JSON/);
});
test('every packaged Arcee registration loads the full-document tap in MAIN',()=>{
 for(const base of [root,path.join(root,'PlazCode-Extension'),path.join(root,'PlazCode-Extension-Firefox')]){
  const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
  const groups=manifest.content_scripts.filter(group=>group.matches.includes('https://platform.arcee.ai/*') && group.js.includes('providers/chatgpt-cm.js'));
  assert.equal(groups.length,1);assert.equal(groups[0].world,'MAIN');assert.equal(fs.readFileSync(path.join(base,'providers/chatgpt-cm.js'),'utf8'),fs.readFileSync(path.join(root,'providers/chatgpt-cm.js'),'utf8'));
 }
});
