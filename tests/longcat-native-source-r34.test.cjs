// Native class contracts documented by public longcat.chat clients. The user's
// .ai composer HTML is separate evidence; its live transcript is not captured.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const provider=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
const escaped=text=>text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function fixture(html=''){
 const dom=new JSDOM('<!doctype html><main>'+html+'</main>',{url:'https://longcat.ai/chat/t',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();
 w.HTMLElement.prototype.getBoundingClientRect=()=>({width:600,height:100,top:20,bottom:120,left:20,right:620});
 vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;',c);
 vm.runInContext(provider+'\nwindow.P=RSProvider;',c);
 return{dom,w,d,P:w.P,parse:()=>{const reply=w.P.readAssistant();return w.parser.parseToolCalls(w.P.commandText(reply.reply,reply.item));}};
}
function thread(content,user='Previous request'){
 return '<div class="message-list"><div class="v-chat-user-message"><div class="user-message"><div class="user-message"><div class="user-text">'+escaped(user)+'</div></div></div></div><div class="md-show-container"><div class="mt-markdown-body">'+content+'</div></div></div>';
}
const code='local p = Instance.new("TextLabel")\n\np.Size = UDim2.fromOffset(240, 40)\np.BackgroundColor3 = Color3.fromRGB(3, 4, 5)\nlocal text = [=[Zażółć 😀 ▶\n\n\n\nLast]=]\np.Text = "literal \\n and \u200B\u200C"\nreturn p\n';
const longCode=code+'\n'+Array.from({length:350},(_,i)=>'local value'+i+' = "row '+i+'"').join('\n')+'\nreturn "END"';
const json=value=>JSON.stringify({command:'execute_luau',params:{code:value,datamodel_type:'Edit'}});
test('LongCat native class contract recognizes one user and one assistant without role attributes',t=>{
 const f=fixture(thread('<p>Answer from the actual result.</p>','My native question'));t.after(()=>f.dom.window.close());
 assert.equal(f.P.userCount(),1);assert.equal(f.P.assistantCount(),1);assert.equal(f.P.allItems().length,2);assert.equal(f.P.itemText(f.P.allItems()[0]),'My native question');assert.equal(f.P.lastAssistant().className,'mt-markdown-body');assert.equal(f.P.readAssistant().reply,'Answer from the actual result.');
});
for(const value of [code,longCode])for(const pre of [false,true])test('LongCat native code body '+(pre?'inside PRE':'without PRE')+' preserves '+(value===code?'short':'long')+' literal JSON code',t=>{
 const source=json(value),body='<code class="code-block-body">'+escaped(source)+'</code>';
 const f=fixture(thread('<section><div class="native-toolbar"><span class="code-block-header__lang">Lua</span><div class="code-block-header__copy">Copy</div></div>'+(pre?'<pre>'+body+'</pre>':body)+'</section>'));t.after(()=>f.dom.window.close());
 const reply=f.P.readAssistant(),candidate=f.P.commandText(reply.reply,reply.item),calls=f.parse();assert.equal(candidate,source);assert.equal(calls.length,1);assert.equal(calls[0].arguments.code,value);assert.equal(calls[0].arguments.datamodel_type,'Edit');assert.equal(f.P.sourceReadFailure(reply.item),false);
});
test('LongCat raw Luau without PRE keeps blank lines and ignores native language and Copy chrome',t=>{
 const source='###LUA###\n'+code.trimEnd()+'\n###END_LUA###';
 const f=fixture(thread('<div><div class="native-toolbar"><span class="code-block-header__lang">Lua</span><div class="code-block-header__copy">Copy</div></div><code class="code-block-body">'+escaped(source)+'</code></div>'));t.after(()=>f.dom.window.close());
 const calls=f.parse();assert.equal(calls.length,1);assert.equal(calls[0].tool,'execute_luau');assert.equal(calls[0].arguments.code,code.trimEnd());
});
test('LongCat native source combines inline syntax tokens without inventing newlines or stripping glyphs',t=>{
 const source=json(code),token=escaped(source).replace('Instance.new','<span class="hljs-title">Instance.new</span>').replace('Color3.fromRGB','<span class="hljs-built_in">Color3.fromRGB</span>');
 const f=fixture(thread('<code class="code-block-body">'+token+'</code>'));t.after(()=>f.dom.window.close());assert.equal(f.parse()[0].arguments.code,code);
});
test('LongCat user and unscoped markdown cannot establish an assistant role',t=>{
 const f=fixture('<div class="mt-markdown-body">'+escaped(json(code))+'</div><div class="md-show-container"><div class="mt-markdown-body">'+escaped(json(code))+'</div></div><div class="message-list"><div class="user-text"><div class="md-show-container"><div class="mt-markdown-body"><code class="code-block-body">'+escaped(json(code))+'</code></div></div></div></div>');t.after(()=>f.dom.window.close());
 assert.equal(f.P.assistantCount(),0);for(const item of f.P.allItems())assert.equal(f.P.commandText(f.P.itemText(item),item),'');
});
test('LongCat quoted native code, reasoning and Copy examples cannot execute',t=>{
 const f=fixture(thread('<blockquote><code class="code-block-body">{"command":"write_file"}</code></blockquote><div class="reasoning"><code class="code-block-body">{"command":"delete_file"}</code></div><div class="code-block-header__copy"><code class="code-block-body">{"command":"run_terminal"}</code></div>'));t.after(()=>f.dom.window.close());assert.equal(f.parse().length,0);
});
test('LongCat reasoning container cannot become a transcript turn through native markdown classes',t=>{
 const f=fixture('<div class="message-list"><div class="reasoning"><div class="md-show-container"><div class="mt-markdown-body"><code class="code-block-body">{"command":"delete_file"}</code></div></div></div></div>');t.after(()=>f.dom.window.close());assert.equal(f.P.assistantCount(),0);assert.equal(f.parse().length,0);
});
test('LongCat native Copy and language classes do not replace a real command without a header wrapper',t=>{
 const f=fixture(thread('<div class="native-toolbar"><div class="code-block-header__copy"><code class="code-block-body">{"command":"wrong_copy"}</code></div><span class="code-block-header__lang">I cannot run commands through this extension.</span></div><code class="code-block-body">'+escaped(json(code))+'</code>'));t.after(()=>f.dom.window.close());const calls=f.parse();assert.equal(calls.length,1);assert.equal(calls[0].tool,'execute_luau');assert.equal(calls[0].arguments.code,code);
});
for(const wrapper of ['<div data-virtualized="true">','<div class="monaco-editor">','<div class="cm-editor">'])test('LongCat explicitly virtualized native source is unavailable: '+wrapper,t=>{
 const f=fixture(thread(wrapper+'<code class="code-block-body">'+escaped(json(code))+'</code></div>'));t.after(()=>f.dom.window.close());const reply=f.P.readAssistant();assert.equal(f.P.commandText(reply.reply,reply.item),'');assert.equal(f.P.sourceReadFailure(reply.item),true);assert.equal(f.parse().length,0);
});
test('LongCat one unreadable native body blocks an otherwise valid sibling command',t=>{
 const f=fixture(thread('<div data-virtualized="true"><code class="code-block-body">'+escaped(json(code))+'</code></div><code class="code-block-body">{"command":"get_studio_state"}</code>'));t.after(()=>f.dom.window.close());const reply=f.P.readAssistant();assert.equal(f.P.commandText(reply.reply,reply.item),'');assert.equal(f.P.sourceReadFailure(reply.item),true);
});
test('LongCat marked assistant rerender updates native source instead of retaining old code',t=>{
 const f=fixture(thread('<code class="code-block-body">'+escaped(json(code))+'</code>'));t.after(()=>f.dom.window.close());assert.equal(f.parse()[0].arguments.code,code);f.P.lastAssistant().querySelector('code').textContent=json('return "changed"');assert.equal(f.parse()[0].arguments.code,'return "changed"');
});
