// Native classes, branches, textbox and lengths from the user's r29 report.
// Omitted accessibility attributes and model objects are controlled fixtures.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
function fixture({tap=true,known=true,shadow=false,source='{"command":"list_commands"}'}={}){
 const dom=new JSDOM('<!doctype html><main><section id="thread"></section></main>',{url:'https://copilot.com/chat/conversation/current',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext(),effects=[];
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:()=>{effects.push('clipboard');}}});w.fetch=()=>{effects.push('fetch');};
 const row=d.createElement('div');if(known){row.className='fai-CopilotMessage';row.setAttribute('role','article');}d.querySelector('#thread').append(row);
 const content=d.createElement('div');content.className='fai-CopilotMessage__content';row.append(content);let parent=content;
 if(shadow){const host=d.createElement('div');host.dataset.testid='markdown-reply';parent.append(host);parent=host.attachShadow({mode:'open'});}
 for(let i=0;i<14;i++){const child=d.createElement('div');if(i===9)child.dataset.testid='lastChatMessage';parent.append(child);parent=child;}
 const preview=d.createElement('section');preview.setAttribute('aria-label','Code preview');const block=d.createElement('div');block.className='scriptor-component-code-block scriptor-codeblock-virtualized';preview.append(block);parent.append(preview);
 block.innerHTML='<div><div class="fui-AriaLive__assertive" hidden></div><div class="fui-AriaLive__polite" hidden></div></div><div hidden></div><div><div><div><div><div><svg class="fui-Icon" aria-hidden="true"><path></path></svg><span>JSON</span></div><div class="fui-Overflow"><div><button type="button" aria-label="Copy code"><span><svg aria-hidden="true"><path></path></svg></span></button></div><div><button type="button" aria-label="More"><svg aria-hidden="true"><path></path></svg></button></div></div></div></div></div></div><div><div><div><div aria-hidden="true"></div><div role="textbox" aria-readonly="true"><div aria-hidden="true"></div><div class="native-source"></div></div></div></div></div>';
 const box=block.querySelector('[role="textbox"]'),native=block.querySelector('.native-source');native.textContent=source;for(const button of block.querySelectorAll('button'))button.onclick=()=>effects.push('copy-click');
 if(tap)vm.runInContext(fs.readFileSync(path.join(root,'providers/copilot-code.js'),'utf8'),c);
 vm.runInContext(fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8')+'\nwindow.P=RSProvider;',c);vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;',c);
 const P=w.P,command=()=>{const reply=P.readAssistant();return P.commandText(reply.reply,reply.item);},calls=()=>w.parser.parseToolCalls(command());
 const react=(value,name='code')=>{const props={className:block.className},owner={type:function NativeCode(){},memoizedProps:{[name]:value,onCopy:()=>effects.push('copy-handler')},return:{stateNode:content,type:'div'}};const fiber={type:'div',stateNode:block,memoizedProps:props,return:owner};block.__reactProps$fixture=props;block.__reactFiber$fixture=fiber;return{fiber,owner,props};};
 return{dom,w,d,row,block,box,native,content,P,effects,command,calls,react};
}
for(const tap of [false,true])for(const source of ['{"command":"list_commands"}','{"command":"list_commands","params":{}}'])test('reported virtualized textbox supports only the stateless handshake without a model; tap='+tap+' '+source,t=>{
 const f=fixture({tap,source});t.after(()=>f.dom.window.close());assert.equal(f.command(),source);assert.equal(f.calls().length,1);assert.equal(f.calls()[0].tool,'list_commands');const report=f.P.transportDiagnostics().live;assert.equal(report.counts.scriptor,2);assert.equal(report.candidate.list_commands,true);assert.equal(report.code_sources[0].paragraphs,0);assert.equal(report.code_sources[0].reader,'visible_handshake');assert.equal(report.code_sources[0].model_status,tap?'model_unavailable':'tap_missing');assert.deepEqual(f.effects,[]);
});
for(const source of ['{"command":"execute_luau","params":{"code":"return 1"}}','{"command":"get_studio_state","params":{}}','{"command":"list_commands","params":{"code":"return 1"}}','{"command":"list_commands","other":true}','{"command":"list_commands","params":null}','{"command":"list_commands","params":[]}','{"command":"list_commands"'])test('virtualized DOM alone never supplies project commands or nonempty arguments '+source,t=>{
 const f=fixture({source});t.after(()=>f.dom.window.close());assert.equal(f.command(),'');assert.equal(f.calls().length,0);assert.equal(f.P.sourceReadFailure(f.row),true);assert.deepEqual(f.effects,[]);
});
for(const name of ['code','value','text','codeBlock','children'])test('full committed native React '+name+' is read instead of the virtual viewport',t=>{
 const source=JSON.stringify({command:'execute_luau',params:{code:'local x=Instance.new("Part")\nreturn x'}}),f=fixture({source:source.slice(0,25)});t.after(()=>f.dom.window.close());const value=name==='codeBlock'?{text:source}:source,r=f.react(value,name);if(name==='children')r.owner.memoizedProps.language='json';assert.equal(f.command(),source);assert.equal(f.calls()[0].arguments.code,'local x=Instance.new("Part")\nreturn x');assert.equal(f.P.transportDiagnostics().live.code_sources[0].reader,'full_model');assert.deepEqual(f.effects,[]);
});
test('full EditContext retains long Luau, functions, literal Unicode and invisible characters',t=>{
 const code='local x=Instance.new("TextLabel")\nx.Size=UDim2.fromOffset(100,40)\nx.TextColor3=Color3.fromRGB(1,2,3)\n'+('-- Zażółć 😀\t\u200B\u200C\n'.repeat(4000))+'return x',source=JSON.stringify({command:'execute_luau',params:{code}}),f=fixture({source:source.slice(1200,1700)});t.after(()=>f.dom.window.close());f.box.editContext={text:source};assert.equal(f.command(),source);assert.equal(f.calls()[0].arguments.code,code);assert.ok(f.command().length>f.native.textContent.length*100);assert.equal(f.P.transportDiagnostics().live.code_sources[0].model_kind,'editcontext');assert.deepEqual(f.effects,[]);
});
test('readonly native textarea value is a full document even with no text children',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 1"}}',f=fixture({source});t.after(()=>f.dom.window.close());const textarea=f.d.createElement('textarea');textarea.readOnly=true;textarea.value=source;f.box.replaceWith(textarea);assert.equal(textarea.textContent,'');assert.equal(f.command(),source);assert.equal(f.calls().length,1);assert.equal(f.P.transportDiagnostics().live.code_sources[0].model_kind,'textarea');
});
test('raw Luau protocol comes from the full native model rather than mounted rows',t=>{
 const code='local x=Instance.new("Part")\nreturn x',source='### LUA:Edit ###\n'+code+'\n### END_LUA ###',f=fixture({source:source.slice(0,20)});t.after(()=>f.dom.window.close());f.react(source);assert.equal(f.command(),source);assert.equal(f.calls()[0].arguments.code,code);
});
test('oversized native source is unavailable, never truncated into a command',t=>{
 const source='{"command":"execute_luau","params":{"code":"'+('x'.repeat(2*1024*1024))+'"}}',f=fixture({source:source.slice(0,25)});t.after(()=>f.dom.window.close());f.react(source);assert.equal(f.command(),'');assert.equal(f.block.hasAttribute('data-rs-scriptor-source'),false);
});
test('React model is refreshed after same-length offscreen code edits',t=>{
 const first='{"command":"execute_luau","params":{"code":"return 1"}}',second=first.replace('return 1','return 2'),f=fixture({source:first.slice(0,25)});t.after(()=>f.dom.window.close());const r=f.react(first);assert.equal(f.command(),first);r.owner.memoizedProps={code:second};assert.equal(f.command(),second);assert.equal(f.calls()[0].arguments.code,'return 2');
});
test('full committed React code wins over an exact EditContext surrounding-text window',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 1"}}',visible=source.slice(0,25),f=fixture({source:visible});t.after(()=>f.dom.window.close());f.react(source);f.box.editContext={text:visible};assert.equal(f.command(),source);assert.equal(f.calls()[0].arguments.code,'return 1');assert.equal(f.P.transportDiagnostics().live.code_sources[0].model_kind,'react-code');
});
test('a conflicting native editing context and committed React revision is not guessed',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 1"}}',f=fixture({source:source.slice(0,25)});t.after(()=>f.dom.window.close());f.react(source);f.box.editContext={text:source.replace('return 1','return 2')};assert.equal(f.command(),'');assert.equal(f.P.transportDiagnostics().live.code_sources[0].model_status,'model_ambiguous');
});
test('React committed host props choose the current alternate, not the attached stale fiber',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 2"}}',f=fixture({source:source.slice(0,25)});t.after(()=>f.dom.window.close());const r=f.react(source.replace('return 2','return 1'));r.fiber.memoizedProps={old:true};r.fiber.alternate={memoizedProps:r.props,type:'div',return:{type:function Current(){},memoizedProps:{code:source},return:{stateNode:f.content}}};assert.equal(f.command(),source);
});
test('ambiguous current React branches do not execute stale offscreen source',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 2"}}',f=fixture({source:source.slice(0,25)});t.after(()=>f.dom.window.close());const r=f.react(source);r.fiber.alternate={memoizedProps:r.props,type:'div',return:{type:function Other(){},memoizedProps:{code:source.replace('return 2','return 1')},return:{stateNode:f.content}}};assert.equal(f.command(),'');assert.equal(f.P.transportDiagnostics().live.code_sources[0].model_status,'model_ambiguous');
});
test('stale published source is removed when its native model disappears',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 1"}}',f=fixture({source:source.slice(0,25)});t.after(()=>f.dom.window.close());f.react(source);assert.equal(f.command(),source);delete f.block.__reactFiber$fixture;assert.equal(f.command(),'');assert.equal(f.block.hasAttribute('data-rs-scriptor-source'),false);
});
test('a missing MAIN reader cannot reuse planted or previously published source attributes',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 1"}}',f=fixture({source,tap:false});t.after(()=>f.dom.window.close());f.block.setAttribute('data-rs-scriptor-source',source);f.block.setAttribute('data-rs-scriptor-len',String(source.length));f.block.setAttribute('data-rs-scriptor-kind','react-code');f.block.setAttribute('data-rs-scriptor-status','ok');assert.equal(f.command(),'');assert.equal(f.P.transportDiagnostics().live.code_sources[0].model_status,'tap_missing');
});
test('a full model must contain the actual viewport fragments in order',t=>{
 const source='{"command":"get_studio_state","params":{}}',f=fixture({source});t.after(()=>f.dom.window.close());f.react('{"command":"execute_luau","params":{"code":"return 1"}}');assert.equal(f.command(),'');assert.equal(f.block.hasAttribute('data-rs-scriptor-source'),false);
});
test('code from an unrelated React ancestor beyond the native host boundary is not source',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 1"}}',f=fixture({source:source.slice(0,25)});t.after(()=>f.dom.window.close());const r=f.react(null);r.owner.return.return={type:function Chat(){},memoizedProps:{code:source}};assert.equal(f.command(),'');
});
test('MAIN model getter errors clear prior source and stay local',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 1"}}',f=fixture({source:source.slice(0,25)});t.after(()=>f.dom.window.close());const r=f.react(source);assert.equal(f.command(),source);Object.defineProperty(r.owner.memoizedProps,'code',{get(){throw Error('PRIVATE_ERROR');}});assert.equal(f.command(),'');assert.equal(f.block.hasAttribute('data-rs-scriptor-source'),false);assert.doesNotMatch(JSON.stringify(f.P.transportDiagnostics()),/PRIVATE_ERROR/);
});
for(const context of ['unknown','quote','own','user'])test('virtualized model never establishes a role from '+context+' content',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 1"}}',f=fixture({known:context!=='unknown',source});t.after(()=>f.dom.window.close());f.react(source);if(context==='quote'){const q=f.d.createElement('blockquote');f.content.append(q);q.append(f.block);}if(context==='own')f.content.className='rs-chip';if(context==='user')f.row.className='fai-UserMessage';assert.equal(f.command(),'');assert.equal(f.block.hasAttribute('data-rs-scriptor-source'),false);
});
test('virtualized model works inside an open recognized markdown reply',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 1"}}',f=fixture({source:source.slice(0,25),shadow:true});t.after(()=>f.dom.window.close());f.react(source);assert.equal(f.command(),source);assert.equal(f.calls().length,1);
});
test('virtualized full code does not override an explicit refusal outside the block',t=>{
 const source='{"command":"execute_luau","params":{"code":"return 1"}}',f=fixture({source});t.after(()=>f.dom.window.close());f.react(source);f.content.prepend(f.d.createTextNode('I cannot participate in or control external browser extensions by emitting structured commands for them.'));assert.equal(f.command(),'');assert.equal(f.P.sourceReadFailure(f.row),false);
});
test('virtualized diagnostics disclose model status and length, never full code or props',t=>{
 const source=JSON.stringify({command:'execute_luau',params:{code:'return "PRIVATE_MODEL_SOURCE"'}}),f=fixture({source:source.slice(0,25)});t.after(()=>f.dom.window.close());f.react(source);const report=f.P.transportDiagnostics().live;assert.equal(report.code_sources[0].model_status,'ok');assert.equal(report.code_sources[0].chars,source.length);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_MODEL_SOURCE/);assert.deepEqual(f.effects,[]);
});
