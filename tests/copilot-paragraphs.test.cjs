// Regression for the reported 7282 -> 7339, difference 173 (B / newline).
// Controlled native paste/model; the actual user's message is not included.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
function fixture({mode='line',suffix='\u200B\u200C',lexical=false}={}){
 const dom=new JSDOM('<!doctype html><main><section id="thread"></section><form><div contenteditable="true" aria-label="Message Copilot"></div><button type="button" aria-label="Send">Send</button></form></main>',{url:'https://copilot.com/chat/conversation/current',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();let clock=10000,model='',serial=0;
 w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};w.HTMLElement.prototype.getBoundingClientRect=()=>({width:640,height:70,top:500,bottom:570,left:10,right:650});
 const ed=d.querySelector('[contenteditable]'),button=d.querySelector('button'),sent=[];if(lexical)ed.dataset.lexicalEditor='true';
 const render=(text,style=mode)=>{ed.replaceChildren();const lines=text.split(style==='line'?'\n':'\n\n');for(const [index,line] of lines.entries()){const p=d.createElement('p');for(const [n,part] of line.split('\n').entries()){if(n)p.append(d.createElement('br'));if(part)p.append(d.createTextNode(part));}if(index===lines.length-1&&suffix)p.append(d.createTextNode(suffix));if(!line){const br=d.createElement('br');br.className='ProseMirror-trailingBreak';p.append(br);}ed.append(p);}};
 d.execCommand=(command,_ui,html)=>{if(command==='insertHTML'){const temp=d.createElement('div');temp.innerHTML=html;model=temp.textContent;render(model);}else if(command==='delete'){model='';ed.replaceChildren();}else return false;return true;};
 vm.runInContext(fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8')+'\nwindow.P=RSProvider;',c);const P=w.P;
 button.onclick=()=>{sent.push(model);const row=d.createElement('div');row.className='fai-UserMessage';row.setAttribute('role','article');row.dataset.messageId='u'+(++serial);const body=d.createElement('div');body.className='fai-UserMessage__message';body.textContent=model+suffix;row.append(body);d.querySelector('#thread').append(row);model='';ed.replaceChildren();};
 const body=('line\n'.repeat(48))+'x'.repeat(6979-48*5-1)+'\n';const stages=P.startupFeedbackMessages(body+'x'.repeat(63000));
 return{dom,w,d,ed,button,P,sent,render,stages,model:()=>model};
}
test('exact report dimensions: 7282 chars, B at 173, 55 newlines, 10 context parts',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const stage=f.stages[0];assert.equal(f.stages.length,10);assert.equal(stage.text.length,7282);assert.equal(stage.text[173],'B');assert.equal((stage.text.match(/\n/g)||[]).length,55);
 await f.P.typeAndSend(stage.text);assert.deepEqual(f.sent,[stage.text]);assert.equal(f.P.editorText(),'');
});
for(const lexical of [false,true])for(const mode of ['line','paragraph'])test('owned '+mode+' paragraph layout is read exactly, lexical marker='+lexical,async t=>{
 const f=fixture({mode,lexical});t.after(()=>f.dom.window.close());const text='First\n\nBEGIN CONTEXT PART\nlocal x=Instance.new("TextLabel")\n\n\tx.Size=UDim2.fromOffset(1,2)\nEND CONTEXT PART\n\n';assert.equal((await f.P.writeDraft(text,'')).ok,true);assert.equal(f.P.editorText(),text);assert.equal(f.model(),text);await f.P.clearEditor();assert.equal(f.P.editorText(),'');
});
test('all ten context parts are delivered once with original literal source',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());for(const stage of f.stages)assert.equal(await f.P.typeAndSend(stage.text),true);assert.deepEqual(f.sent,Array.from(f.stages,stage=>stage.text));assert.equal(new Set(f.sent).size,10);
});
for(const change of ['remove-newline','add-newline','space','code','unicode'])test('learned native line layout rejects changed '+change+' rather than switching conventions',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const text='First\n\nBEGIN CONTEXT PART\nlocal x=Instance.new("Part")\n\nZażółć 😀';assert.equal((await f.P.writeDraft(text,'')).ok,true);
 const changed=change==='remove-newline'?text.replace('\n\n','\n'):change==='add-newline'?text.replace('\n\n','\n\n\n'):change==='space'?text.replace('local x','local  x'):change==='code'?text.replace('Part','TextLabel'):text.replace('😀','🦊');f.render(changed);assert.notEqual(f.P.editorText(),text);assert.equal(f.sent.length,0);
});
test('unknown multiline draft keeps its native read and blocks injection',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.render('My\n\nPRIVATE_DRAFT');const before=f.P.editorText();await assert.rejects(()=>f.P.typeAndSend('internal'),/draft/);assert.equal(f.P.editorText(),before);assert.equal(f.sent.length,0);
});
test('newly mounted editor can infer its own paragraph convention from the owned write',async t=>{
 const f=fixture({mode:'paragraph'});t.after(()=>f.dom.window.close());const text='A\n\nB\nC';assert.equal((await f.P.writeDraft(text,'')).ok,true);const next=f.ed.cloneNode(false);f.ed.replaceWith(next);const set=f.d.execCommand;f.d.execCommand=(command,_ui,html)=>{if(command!=='insertHTML')return set(command,_ui,html);const temp=f.d.createElement('div');temp.innerHTML=html;next.replaceChildren(...temp.textContent.split('\n').map(line=>{const p=f.d.createElement('p');p.textContent=line;return p;}));return true;};assert.equal((await f.P.writeDraft(text)).ok,true);assert.equal(f.P.editorText(),text);
});
test('mismatch diagnostics contain counts and phase without draft or character contents',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const exec=f.d.execCommand;f.d.execCommand=(...args)=>{const result=exec(...args);if(args[0]==='insertHTML')f.render('PRIVATE_CHANGED_SOURCE');return result;};await assert.rejects(()=>f.P.typeAndSend('Expected\n\nPRIVATE_EXPECTED_SOURCE'),/prepared text changed/);const report=f.P.transportDiagnostics();assert.equal(report.last_draft_failure.reason,'prepared_text_changed');assert.equal(report.last_draft_failure.phase,'before_send');assert.equal(report.last_draft_failure.expected_chars,33);assert.equal(typeof report.last_draft_failure.first_difference,'number');assert.doesNotMatch(JSON.stringify(report),/PRIVATE_/);assert.equal(f.sent.length,0);
});
