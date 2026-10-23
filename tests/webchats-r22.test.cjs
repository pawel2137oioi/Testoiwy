// Reproduce the screenshot's expected 552 / actual 554, U+200B U+200C boundary.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
function fixture(host='copilot.com'){
 const dom=new JSDOM('<!doctype html><form><div contenteditable="true" aria-label="Message Copilot"></div><button type="button" aria-label="Send">Send</button></form><section id="thread"></section>',{url:'https://'+host+'/chat/current',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();
 let clock=10000,clicks=0,model='',suffix='\u200B\u200C';const sent=[];
 w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};
 w.HTMLElement.prototype.getBoundingClientRect=()=>({width:640,height:70,top:500,bottom:570,left:10,right:650});
 vm.runInContext(source+'\nwindow.P=RSProvider;',c);
 const P=w.P;
 d.execCommand=(command,_ui,html)=>{
   const ed=P.getEditor();
   if(command==='delete')model='';
   else {const box=d.createElement('div');box.innerHTML=html;model=box.textContent;}
   ed.textContent=model+suffix;return true;
 };
 d.querySelector('button').onclick=()=>{
   clicks++;sent.push(model);const row=d.createElement('div');row.dataset.role='user';row.textContent=model+suffix;d.querySelector('#thread').append(row);model='';P.getEditor().textContent='';
 };
 return{dom,w,d,c,P,sent,clicks:()=>clicks,suffix:value=>{suffix=value;},add:(html)=>{const row=d.createElement('div');row.dataset.role='assistant';row.innerHTML=html;d.querySelector('#thread').append(row);return row;}};
}
for(const suffix of ['\u200B','\u200B\u200C','\u200B\u200B','\u200B\n','\u200B\uFEFF','\u200B ','\u200B\t','\u200B\u00A0','\u200B\r\n'])test('Copilot known write accepts only boundary padding '+JSON.stringify(suffix),async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.suffix(suffix);const text=f.P.startupRequest('roblox');assert.equal(text.length,552);
 assert.equal(await f.P.typeAndSend(text),true);assert.deepEqual(f.sent,[text]);assert.equal(f.clicks(),1);
});
for(const suffix of ['\u200BX','\u200B\u2060'])test('Copilot unrecognized suffix still rejects the changed source '+JSON.stringify(suffix),async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.suffix(suffix);await assert.rejects(()=>f.P.typeAndSend('Exact message'),/prepared text changed/);assert.equal(f.clicks(),0);assert.deepEqual(f.sent,[]);
});
for(const sourceText of ['local s="a\u200Cb"\nreturn s','Literal final \u200B\u200C','local s="a\u200Bb"\nreturn s','local x="\u200B\uFEFF"\n\nreturn x\n','Literal final \u200B\u200B','Literal final \uFEFF'])test('Copilot retains literal invisible characters of the supplied source '+JSON.stringify(sourceText),async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());assert.equal(await f.P.typeAndSend(sourceText),true);assert.deepEqual(f.sent,[sourceText]);
});
test('Copilot an arbitrary existing draft retains its literal invisible suffix',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const raw='User draft\u200B\u200C';f.P.getEditor().textContent=raw;assert.equal(f.P.editorText(),raw);
});
for(const changed of ['Different draft\u200B\u200B','Exact messageX\u200B\u200B','Exact\u200B message','Exact\u200C message'])test('Copilot padding never hides a different draft '+JSON.stringify(changed),async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.P.getEditor().oninput=()=>{f.P.getEditor().textContent=changed;};await assert.rejects(()=>f.P.typeAndSend('Exact message'),/prepared text changed/);assert.equal(f.clicks(),0);assert.equal(f.P.editorText(),changed);
});
test('Copilot remount in the same composer retains ownership of the known write',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const old=f.P.getEditor();old.oninput=()=>{old.replaceWith(old.cloneNode(true));};assert.equal(await f.P.typeAndSend('Exact message'),true);assert.equal(f.clicks(),1);assert.deepEqual(f.sent,['Exact message']);
});
test('Copilot own retained draft is cleared without removing another literal suffix',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.d.querySelector('button').onclick=()=>{const row=f.d.createElement('div');row.dataset.role='user';row.textContent='Exact message\u200B\u200C';f.d.querySelector('#thread').append(row);};
 assert.equal(await f.P.typeAndSend('Exact message'),true);assert.equal(f.P.editorText(),'');assert.equal(f.P.getEditor().textContent,'\u200B\u200C');
});
for(const html of ['<p><code>{"command":"list_commands","params":{}}</code></p>','<p><code>{"command":"execute_luau","params":{"code":"local s=\\"a​b\\"\\nreturn s"}}</code></p>'])test('Arcee standalone inline JSON is an actual whole reply '+html.slice(0,45),t=>{
 const f=fixture('platform.arcee.ai');t.after(()=>f.dom.window.close());const row=f.add(html);vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parse=RSParse;',f.c);const source=f.P.commandText(f.P.itemText(row),row);assert.equal(f.w.parse.parseToolCalls(source).length,1);assert.equal(source,row.querySelector('code').textContent);
});
for(const html of ['<p>Example: <code>{"command":"list_commands"}</code></p>','<blockquote><code>{"command":"list_commands"}</code></blockquote>','<p>Nie wykonam tego polecenia. <code>{"command":"list_commands"}</code></p>','<p><code>{"command":"a"}</code><code>{"command":"b"}</code></p>'])test('Arcee inline examples, quotes and refusals remain non-executable '+html.slice(0,45),t=>{
 const f=fixture('platform.arcee.ai');t.after(()=>f.dom.window.close());const row=f.add(html);assert.equal(f.P.commandText(f.P.itemText(row),row),'');
});
