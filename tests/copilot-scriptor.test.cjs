// Microsoft Scriptor paragraph/textRun contract documented in the public
// browser-ai-chat-exporter 0830aad. This is a reduced, controlled fixture.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..'),provider=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
function fixture({shadow=false,known=true}={}){
 const dom=new JSDOM('<!doctype html><main><section id="thread"></section></main>',{url:'https://copilot.com/chat/conversation/current',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext(),events=[];
 vm.runInContext(provider+'\nwindow.P=RSProvider;',c);vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parse=RSParse;',c);const P=w.P;P.init({diag:(event,data)=>events.push({event,data})});
 const row=d.createElement('div');if(known){row.className='fai-CopilotMessage';row.setAttribute('role','article');}const host=d.createElement('div');host.dataset.testid='markdown-reply';row.append(host);d.querySelector('#thread').append(row);const body=shadow?host.attachShadow({mode:'open'}):host;
 function block(source,{runs=true,nested=false,alias='',suffix=false}={}){
  const wrapper=d.createElement('section');wrapper.setAttribute('aria-label',alias||'Code preview');wrapper.innerHTML='<div><span>JSON</span><button><pre>{"command":"wrong_copy_menu"}</pre></button></div>';const code=d.createElement('div');if(!alias)code.className='scriptor-component-code-block';wrapper.append(code);
  for(const [index,text] of source.split('\n').entries()){
   const paragraph=d.createElement('div');paragraph.className=suffix?'scriptor-paragraph_abc':'scriptor-paragraph';paragraph.dataset.lineNumber=String(index+1);const number=d.createElement('span');number.className='line-number';number.textContent=String(index+1);paragraph.append(number);
   if(runs){for(const part of [text.slice(0,Math.floor(text.length/2)),text.slice(Math.floor(text.length/2))]){const run=d.createElement('span');run.className=suffix?'scriptor-textRun_abc':'scriptor-textRun';if(nested){const inner=d.createElement('span');inner.className='scriptor-textRun';inner.textContent=part;run.append(inner);}else run.textContent=part;paragraph.append(run);}}
   else{const span=d.createElement('span');span.textContent=text;paragraph.append(span);}code.append(paragraph);
  }
  body.append(wrapper);return{wrapper,code};
 }
 const command=()=>{const reply=P.readAssistant();return P.commandText(reply.reply,row);},calls=()=>w.parse.parseToolCalls(command());return{dom,w,d,P,row,host,body,block,command,calls,events};
}
for(const source of ['{"command":"list_commands","params":{}}','{"command":"list_commands"}','{"params":{},"command":"list_commands"}'])test('Copilot Scriptor exact handshake '+source,t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.block(source);assert.equal(f.command(),source);assert.equal(f.calls().length,1);assert.equal(f.calls()[0].tool,'list_commands');assert.equal(f.P.readAssistant().reply,source);
});
for(const options of [{},{runs:false},{nested:true},{suffix:true},{alias:'Codevorschau'},{alias:'Podgląd kodu'}])test('Copilot Scriptor multiline paragraphs '+JSON.stringify(options),t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const source=JSON.stringify({command:'list_commands',params:{}},null,2);f.block(source,options);assert.equal(f.command(),source);assert.equal(f.calls().length,1);assert.equal(f.calls()[0].tool,'list_commands');
});
test('Copilot Scriptor preserves long Luau, functions, Unicode, whitespace and literal refusal text',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const code='local x = Instance.new("TextLabel")\n\tx.Text = "I cannot run extensions; Zażółć 😀\u200B\u200C"\n'+Array.from({length:1000},(_,i)=>'-- line '+i+'  \t').join('\n')+'\nx.Size = UDim2.fromOffset(100, 40)\nx.TextColor3 = Color3.fromRGB(1, 2, 3)\n\nreturn x\n',source=JSON.stringify({command:'execute_luau',params:{code}},null,2);f.block(source);assert.equal(f.command(),source);assert.equal(f.calls().length,1);assert.equal(f.calls()[0].arguments.code,code);
});
test('Copilot Scriptor raw Luau protocol keeps its logical lines',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const code='local x=Instance.new("Part")\nx.Size=Vector3.new(1,2,3)\nreturn x',source='### LUA:Edit ###\n'+code+'\n### END_LUA ###';f.block(source);assert.equal(f.command(),source);assert.equal(f.calls().length,1);assert.equal(f.calls()[0].arguments.code,code);
});
test('Copilot Scriptor retains all 800 mounted logical Luau lines',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const code=Array.from({length:800},(_,i)=>'local n'+i+' = '+i+'  -- Zażółć 😀').join('\n')+'\nreturn n799',source='### LUA:Edit ###\n'+code+'\n### END_LUA ###';f.block(source);assert.equal(f.command(),source);assert.equal(f.calls().length,1);assert.equal(f.calls()[0].arguments.code,code);
});
test('Copilot Scriptor empty logical lines are not dropped',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const source='{\n\n  "command":"list_commands",\n\n  "params":{}\n}';f.block(source);assert.equal(f.command(),source);assert.equal(f.calls().length,1);
});
test('Copilot Scriptor in an open native reply reads one full command',t=>{
 const f=fixture({shadow:true});t.after(()=>f.dom.window.close());f.block('{"command":"list_commands","params":{}}');assert.equal(f.calls().length,1);assert.equal(f.calls()[0].tool,'list_commands');
});
for(const context of ['blockquote','button','own'])test('Copilot Scriptor '+context+' content is not executable',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const b=f.block('{"command":"list_commands","params":{}}'),parent=f.d.createElement(context==='own'?'div':context);if(context==='own')parent.className='rs-chip';f.body.append(parent);parent.append(b.wrapper);assert.equal(f.command(),'');
});
test('Copilot Scriptor code does not assign an unknown assistant role',t=>{
 const f=fixture({known:false});t.after(()=>f.dom.window.close());f.block('{"command":"list_commands","params":{}}');assert.equal(f.P.allItems().length,0);assert.equal(f.command(),'');
});
test('Copilot plain Scriptor paragraphs without a native code block are not executable',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const b=f.block('{"command":"list_commands","params":{}}');b.wrapper.removeAttribute('aria-label');b.code.className='';assert.equal(f.calls().length,0);
});
test('Copilot refusal outside Scriptor still takes precedence over a valid command',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.block('{"command":"list_commands","params":{}}');f.body.prepend(f.d.createTextNode('I cannot participate in or control external browser extensions by emitting structured commands for them.'));assert.equal(f.command(),'');
});
test('Copilot incomplete Scriptor JSON remains incomplete without invented source',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const source='{"command":"execute_luau","params":{"code":"local x=Instance.new(';f.block(source);assert.equal(f.command(),source);assert.equal(f.calls().length,0);
});
for(const corruption of ['virtualized','missing-line','duplicate-line','count','setsize'])test('Copilot Scriptor rejects '+corruption+' instead of shortening source',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const source='{\n"command":"list_commands",\n"params":{}}',b=f.block(source),lines=[...b.code.children];if(corruption==='virtualized')b.code.dataset.virtualized='true';if(corruption==='missing-line')lines[1].remove();if(corruption==='duplicate-line')lines[1].dataset.lineNumber='1';if(corruption==='count')b.wrapper.dataset.lineCount='4';if(corruption==='setsize')lines[0].setAttribute('aria-setsize','10');assert.equal(f.command(),'');assert.ok(f.events.some(x=>x.event==='copilot.codeSourceUnavailable'));
});
test('Copilot one unreadable Scriptor block prevents partial command dispatch',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.block('{"command":"list_commands","params":{}}');const bad=f.block('{"command":"execute_luau","params":{"code":"return 1"}}');bad.code.dataset.virtualized='true';assert.equal(f.command(),'');
});
test('Copilot Scriptor edits are read fresh instead of returning cached calls',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const b=f.block('{"command":"list_commands","params":{}}');assert.equal(f.calls()[0].tool,'list_commands');const runs=b.code.querySelectorAll('.scriptor-textRun');runs[0].textContent='{"command":"get_studio_state",';runs[1].textContent='"params":{}}';assert.equal(f.calls()[0].tool,'get_studio_state');
});
test('Copilot Scriptor card anchor is the actual code group and own cards stay out of source',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const b=f.block('{"command":"list_commands","params":{}}'),spot=f.P.findToolBlockSpot(f.row);assert.equal(spot.ref,b.wrapper);const card=f.d.createElement('div');card.className='rs-chip';card.innerHTML='<pre>{"command":"wrong_card"}</pre>';spot.parent.insertBefore(card,spot.ref);assert.equal(f.calls().length,1);assert.equal(f.calls()[0].tool,'list_commands');
});

function unmarkedJSON(f,source,{header=true,semantic=false}={}){
 const wrapper=f.d.createElement('section');wrapper.setAttribute('aria-label','Code preview');
 const block=f.d.createElement('div');block.className='scriptor-component-code-block';wrapper.append(block);
 if(header){const heading=f.d.createElement('div');heading.innerHTML='<span>JSON</span><button>Copy code<svg aria-hidden="true"><path></path></svg><span hidden aria-setsize="10">Copy menu</span></button>';block.append(heading);}
 const content=f.d.createElement(semantic?'code':'div');content.textContent=source;block.append(content);f.body.append(wrapper);return{wrapper,block,content};
}
for(const source of ['{"command":"list_commands"}','{"command":"list_commands","params":{}}',JSON.stringify({command:'get_studio_state',params:{}},null,2)])for(const header of [false,true])test('Copilot native JSON without paragraph classes; header='+header+' '+source,t=>{
 const f=fixture();t.after(()=>f.dom.window.close());unmarkedJSON(f,source,{header});assert.equal(f.command(),source);assert.equal(f.calls().length,1);assert.equal(f.P.readAssistant().reply,source);
});
test('Copilot native JSON preserves long literal Luau and invisible characters',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const code='local x=Instance.new("TextLabel")\nx.Size=UDim2.fromOffset(100,40)\nx.TextColor3=Color3.fromRGB(1,2,3)\n'+('-- Zażółć 😀\t\u200B\u200C\n'.repeat(1000))+'return x',source=JSON.stringify({command:'execute_luau',params:{code}},null,2);unmarkedJSON(f,source,{semantic:true});assert.equal(f.command(),source);assert.equal(f.calls()[0].arguments.code,code);
});
for(const corruption of ['extra-prose','truncated','unmarked-gutter','virtualized','monaco','codemirror','missing-model','hidden','slot','rows','indices'])test('Copilot unmarked JSON rejects '+corruption+' instead of extracting a nested candidate',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const b=unmarkedJSON(f,'{"command":"list_commands"}');
 if(corruption==='extra-prose')b.block.append(f.d.createTextNode('This is an example.'));
 if(corruption==='truncated')b.content.textContent='{"command":"list_commands"';
 if(corruption==='unmarked-gutter')b.content.prepend(f.d.createTextNode('1 '));
 if(corruption==='virtualized')b.wrapper.dataset.virtualized='true';
 if(corruption==='monaco')b.content.className='monaco-editor';
 if(corruption==='codemirror')b.content.className='cm-content';
 if(corruption==='missing-model'){const host=f.d.createElement('div');b.block.append(host);host.attachShadow({mode:'open'}).textContent='unknown source';}
 if(corruption==='hidden'){const other=f.d.createElement('div');other.hidden=true;other.textContent='unknown source';b.block.append(other);}
 if(corruption==='slot')b.block.append(f.d.createElement('slot'));
 if(corruption==='rows')b.wrapper.dataset.lineCount='2';
 if(corruption==='indices')b.content.dataset.lineNumber='1';
 assert.equal(f.command(),'');assert.equal(f.calls().length,0);
});
test('Copilot unmarked JSON omits only marked UI gutters, not numbers inside parameters',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const source='{"command":"execute_luau","params":{"code":"return 123"}}',b=unmarkedJSON(f,source);const gutter=f.d.createElement('span');gutter.className='line-number';gutter.textContent='1';b.content.prepend(gutter);assert.equal(f.command(),source);assert.equal(f.calls()[0].arguments.code,'return 123');
});
test('Copilot unreadable unmarked block also prevents dispatch of other readable blocks',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());unmarkedJSON(f,'{"command":"get_studio_state"}');const b=unmarkedJSON(f,'{"command":"execute_luau","params":{}}');b.wrapper.dataset.virtualized='true';assert.equal(f.command(),'');assert.equal(f.calls().length,0);
});
for(const context of ['blockquote','button','own'])test('Copilot unmarked native JSON in '+context+' is not executable',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const b=unmarkedJSON(f,'{"command":"list_commands"}'),parent=f.d.createElement(context==='own'?'div':context);if(context==='own')parent.className='rs-chip';f.body.append(parent);parent.append(b.wrapper);assert.equal(f.command(),'');
});
test('Copilot unmarked native JSON does not override a refusal',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());unmarkedJSON(f,'{"command":"list_commands"}');f.body.prepend(f.d.createTextNode('I cannot participate in or control external browser extensions by emitting structured commands for them.'));assert.equal(f.command(),'');
});
test('Copilot unmarked source does not create an assistant role',t=>{
 const f=fixture({known:false});t.after(()=>f.dom.window.close());unmarkedJSON(f,'{"command":"list_commands"}');assert.equal(f.command(),'');assert.equal(f.P.allItems().length,0);
});
