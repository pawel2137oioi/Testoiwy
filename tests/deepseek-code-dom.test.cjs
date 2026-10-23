// Controlled DeepSeek rendering variants. The test browser requires sign-in;
// these are DOM regressions, not a capture of the user's live conversation.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const main=fs.readFileSync(path.join(root,'core/main.js'),'utf8');
function section(start,end){const a=main.indexOf(start),b=main.indexOf(end,a);assert.ok(a>=0&&b>a,start);return main.slice(a,b);}
const short=['local label = Instance.new("TextLabel")','label.Size = UDim2.fromOffset(240, 40)','label.TextXAlignment = Enum.TextXAlignment.Right',"label.Text = 'Mode: A/B'",'return label.Name'].join('\n');
const long=short+'\n'+Array.from({length:400},(_,i)=>`local value${i} = { ["name"] = "Zażółć 🦊", size = UDim2.fromOffset(${i}, 40) }`).join('\n')+'\nreturn "END"';
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const raw=source=>'###LUA###\n'+source+'\n###END_LUA###';
function fixture(html){
 const dom=new JSDOM('<!doctype html><body><div data-virtual-list-item-key="2"><div class="ds-message" data-role="assistant"><div class="ds-markdown">'+html+'</div></div></div><form><textarea></textarea><button class="ds-button--primary" aria-label="Send">Send</button></form></body>',{url:'https://chat.deepseek.com/a/chat/test',runScripts:'outside-only'});
 const w=dom.window,d=w.document,c=dom.getInternalVMContext();
 w.HTMLElement.prototype.getBoundingClientRect=()=>({width:500,height:80,top:10,bottom:90,left:0,right:500});
 Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return d.body;}});
 vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;',c);
 vm.runInContext(fs.readFileSync(path.join(root,'providers/deepseek.js'),'utf8')+'\nwindow.P=RSProvider;',c);
 return {w,d,c,P:w.P,body:d.querySelector('.ds-markdown')};
}
const renderers={
 plain:s=>'<pre><code>'+escape(raw(s))+'</code></pre>',
 header:s=>'<div class="md-code-block"><div class="md-code-block-banner-wrap"><span>lua</span><button>Copy</button></div><pre><code>'+escape(raw(s))+'</code></pre></div>',
 prose:s=>'<p>Dodaję etykietę po prawej stronie.</p><pre><code>'+escape(raw(s))+'</code></pre><p>Gotowe.</p>',
 paragraphs:s=>raw(s).split('\n').map(line=>'<p>'+escape(line)+'</p>').join(''),
 breaks:s=>'<pre><code>'+raw(s).split('\n').map(escape).join('<br>')+'</code></pre>',
 lines:s=>'<pre><code>'+raw(s).split('\n').map((line,i)=>'<span class="code-line"><span class="line-number">'+(i+1)+'</span>'+escape(line)+'</span>').join('')+'</code></pre>',
 links:s=>'<p>###LUA###</p>'+s.split('\n').map(line=>'<p>'+escape(line).replace('Instance.new','<a href="https://instance.new/">Instance.new</a>')+'</p>').join('')+'<p>###END_LUA###</p>',
};
for(const [name,render]of Object.entries(renderers))for(const source of [short,long])test('DeepSeek '+name+' rendering reads complete '+(source===short?'short':'long')+' Luau with property dots and quotes',()=>{
 const f=fixture(render(source)),reply=f.P.readAssistant().reply;
 assert.equal(f.P.itemText(f.P.lastAssistant()).trim(),reply);
 assert.equal(f.P.classifyText(f.P.lastAssistant(),'.rs-chip').trim(),reply);
 const calls=f.w.parser.parseToolCalls(reply);assert.equal(calls.length,1);assert.equal(calls[0].tool,'execute_luau');assert.equal(calls[0].arguments.code,source);
 assert.equal(f.w.parser.hasOpenToolBlock(reply),false);
});
test('highlight rerender, Copy bar and PlazCode decoration cannot change the same call',()=>{
 const f=fixture(renderers.plain(short)),item=f.P.lastAssistant(),key=f.P.itemKey(item);
 const before=f.w.parser.parseToolCalls(f.P.readAssistant().reply);
 f.body.innerHTML=renderers.header(short);const chip=f.d.createElement('section');chip.className='rs-chip';chip.textContent='execute_luau {"command":"wrong_from_ui"}';f.body.prepend(chip);
 const activity=f.d.createElement('section');activity.className='rs-chat-activity';activity.textContent='Worked for 3s';f.body.prepend(activity);
 f.P.findToolBlockSpot(item,chip);
 const after=f.w.parser.parseToolCalls(f.P.readAssistant().reply);assert.equal(f.P.itemKey(item),key);assert.deepEqual(JSON.parse(JSON.stringify(after)),JSON.parse(JSON.stringify(before)));
});
test('code blank lines, indentation, literal backticks and UI-like identifiers stay verbatim',()=>{
 const source='  json = { ["Copy"] = "lua" }\n\n\n  local text = "`literal` \\\"quoted\\\""\n\n  return text',f=fixture(renderers.header(source));
 assert.equal(f.w.parser.parseToolCalls(f.P.readAssistant().reply)[0].arguments.code,source);
});
test('nested markdown surfaces are read once and reasoning/chips are excluded',()=>{
 const f=fixture('<div class="ds-markdown">'+renderers.header(short)+'</div><div class="ds-think-content"><div class="ds-markdown">'+escape(raw('error("reasoning")'))+'</div></div>');
 const text=f.P.readAssistant().reply;assert.equal(text.split('Instance.new').length-1,1);assert.doesNotMatch(text,/reasoning/);assert.equal(f.w.parser.parseToolCalls(text)[0].arguments.code,short);
});
test('code source containing Copy words, numerals and inline spans is never stripped',()=>{
 const source='local Copy = "123 lua json"\nreturn Copy',f=fixture('<div class="md-code-block"><div class="md-code-block-banner-wrap">lua Kopiuj</div><pre><code>'+escape(raw(source)).replace('return Copy','<span class="token keyword">return</span> Copy')+'</code></pre></div>');
 assert.equal(f.w.parser.parseToolCalls(f.P.readAssistant().reply)[0].arguments.code,source);
});
for(const prefix of ['Używam `###LUA###` do wykonania kodu.\n','Poprzedni format to {"command":"execute_luau","params":{}}.\n','Przykład znacznika ###LUA### znajduje się poniżej.\n'])test('actual raw block is found after explanatory marker/JSON prose: '+prefix.trim(),()=>{
 const f=fixture(''),text=prefix+'```lua\n'+raw(short)+'\n```',calls=f.w.parser.parseToolCalls(text);
 assert.equal(calls.length,1);assert.equal(calls[0].tool,'execute_luau');assert.equal(calls[0].arguments.code,short);
});
test('a marker inside an incomplete multiline JSON value is never promoted to raw Luau',()=>{
 const f=fixture(''),text='{"command":"execute_luau","params":{"code":"\n'+raw(short);
 assert.equal(f.w.parser.parseToolCalls(text).length,0);
});
test('short JSON with Instance.new, UDim2 and Enum properties preserves its decoded source',()=>{
 const text=JSON.stringify({command:'execute_luau',params:{code:short,datamodel_type:'Edit'}}),f=fixture('<p>Komenda:</p><div class="md-code-block"><div class="md-code-block-banner-wrap">json<button>Copy</button></div><pre><code>'+escape(text)+'</code></pre></div>');
 const calls=f.w.parser.parseToolCalls(f.P.readAssistant().reply);assert.equal(calls.length,1);assert.equal(calls[0].arguments.code,short);
});
test('an actually incomplete raw block remains incomplete even with a Copy control containing a closing marker',()=>{
 const f=fixture('<pre><button>###END_LUA###</button><code>'+escape('###LUA###\n'+short)+'</code></pre>');
 assert.equal(f.w.parser.parseToolCalls(f.P.readAssistant().reply).length,0);assert.equal(f.w.parser.hasOpenToolBlock(f.P.readAssistant().reply),true);
});
test('a prose-only mention of Lua delimiters is not an attempted command',()=>{
 const f=fixture(''),text='Znaczniki `###LUA###` i `###END_LUA###` opisują format, bez polecenia.';
 assert.equal(f.w.parser.hasToolSignature(text),false);assert.equal(f.w.parser.hasCommandShape(text),false);assert.equal(f.w.parser.hasOpenToolBlock(text),false);
});
test('highlighted source lines that already contain newlines are not doubled',()=>{
 const f=fixture('<pre><code>'+raw(short).split('\n').map(line=>'<span class="code-line">'+escape(line)+'\n</span>').join('')+'</code></pre>');
 assert.equal(f.w.parser.parseToolCalls(f.P.readAssistant().reply)[0].arguments.code,short);
});
test('Copy controls containing their own code element cannot replace the actual source',()=>{
 const f=fixture('<pre><button><code>{"command":"wrong_from_copy"}</code></button><code>'+escape(raw(short))+'</code></pre>');
 const calls=f.w.parser.parseToolCalls(f.P.readAssistant().reply);assert.equal(calls.length,1);assert.equal(calls[0].arguments.code,short);
});
for(const finishAt of [0,9000])test('actual response watcher reads a rendered DeepSeek block '+(finishAt?'after an interrupted stream':'with prose and Copy controls'),async()=>{
 const f=fixture('<p>Używam <code>###LUA###</code> do utworzenia etykiety.</p>'+renderers.header(short));
 let clock=10000;const began=clock;
 if(finishAt)f.body.innerHTML='<p>Dodaję etykietę.</p><div class="md-code-block"><div class="md-code-block-banner-wrap">lua<button>Copy</button></div><pre><code>'+escape(raw(short).slice(0,80))+'</code></pre></div>';
 f.w.Date.now=()=>clock;f.P.isGenerating=()=>false;f.P.isHardGenerating=()=>false;
 Object.assign(f.w,{A:{sessionGen:1,sendToken:'previous',stop:false},T:f.P.timings,bgMode:true,diag(){},log(){},sleep:async ms=>{clock+=ms;if(finishAt&&clock-began>=finishAt)f.body.innerHTML=renderers.header(short);}});
 vm.runInContext(section('  function parseProviderToolCalls(','\n  // 1.24.10 helpers')+'\n'+section('  function verifyResponseOwner(res) {','\n  const isContextInvalidated')+'\nwindow.readActual=waitForResponse;',f.c);
 const result=await f.w.readActual(0);assert.equal(result.kind,'tool');assert.equal(result.calls[0].arguments.code,short);if(finishAt)assert.ok(clock-began>=finishAt);
});
for(const missingParser of [false,true])test('actual status reports loaded transport versions '+(missingParser?'and identifies a stale parser':'for core/parser/DeepSeek'),async()=>{
 const f=fixture(''),c=vm.createContext({P:f.P,RSParse:missingParser?{}:f.w.parser,A:{bridge:{},toolList:[]},window:{},activeEngine:()=> 'roblox'});
 vm.runInContext(section('  function transportDiagnostics()','  function asStateTag()')+'globalThis.status=async function(name,args){\n'+section('    if (name === "plazcode_status") {','    if (name === "list_commands" || name === "list_tools") {')+'\n};',c);
 const info=JSON.parse((await c.status('plazcode_status',{})).split('\n').slice(1).join('\n'));
 assert.equal(info.transport_build.core,'r32');assert.equal(info.transport_build.provider,'r13');assert.equal(info.transport_build.parser,missingParser?'unknown':'r13');assert.equal(info.last_parse_failure,null);
});

const internal='UIBlox LUMBERYAK INTERNAL: Too many arguments given for format string';
function debug(entries=[]){const c=vm.createContext({A:{},window:{__rsAutoDebug:()=>true},activeEngine:()=> 'roblox',Date:{now:()=>100000},setTimeout:()=>1,bg:async()=>({ok:true,text:JSON.stringify(entries)})});
 vm.runInContext(section('  function studioLogOrigin(','  async function undoStudioTxn(')+'\nglobalThis.api={origin:studioLogOrigin,blocks:projectErrorBlocks,attach:attachAutoDebug};',c);return {c,...c.api};}
test('exact reported UIBlox warning cannot become an automatic repair',async()=>{
 const f=debug([{t:'Enum.MessageType.MessageWarning',m:internal}]);assert.equal(await f.attach('execute_luau','result'),'result');assert.equal(f.blocks(internal).length,0);
});
test('UIBlox root error is not reclassified by a later project caller frame',async()=>{
 const text=internal+'\nStack Begin\nScript \'CorePackages.Packages.UIBlox\', Line 25\nScript \'Workspace.Panel\', Line 10\nStack End',f=debug([{t:'Enum.MessageType.MessageError',m:text}]);
 assert.equal(f.origin(text),'internal');assert.equal(f.blocks(text).length,0);assert.equal(await f.attach('execute_luau','result'),'result');
});
test('a project string-format error is still reported even when its text mentions UIBlox',async()=>{
 const text='ServerScriptService.Panel:25: '+internal,f=debug([{t:'Enum.MessageType.MessageError',m:text}]);
 assert.equal(f.origin(text),'project');assert.match(await f.attach('execute_luau','result'),/AUTO DEBUG/);
});
test('quoting a project path in an internal package message does not establish its source',()=>{
 const text=internal+'; example: "Workspace.Panel:25: value"',f=debug();assert.equal(f.origin(text),'internal');assert.equal(f.blocks(text).length,0);
});
