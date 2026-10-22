// Transport regressions use the real parser, watcher, guard and dispatcher.
// The bridge below is controlled; this does not exercise a live Roblox place.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const sourceRoot=process.env.PLAZCODE_TRANSPORT_ROOT || root;
const main=fs.readFileSync(path.join(sourceRoot,'core/main.js'),'utf8');
function section(start,end){const a=main.indexOf(start),b=main.indexOf(end,a);assert.ok(a>=0&&b>a,start);return main.slice(a,b);}
function parser(){const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(sourceRoot,'core/parser.js'),'utf8')+';globalThis.p=RSParse;',c);return c.p;}
const code='local label = Instance.new("TextLabel")\nlabel.Size = UDim2.fromOffset(240, 40)\nlabel.BackgroundColor3 = Color3.fromRGB(10, 20, 30)\nreturn label.Name';
const raw=s=>'###LUA###\n'+s+'\n###END_LUA###';
const sites={
 deepseek:{host:'chat.deepseek.com',file:'deepseek',html:'<div data-virtual-list-item-key="2"><div class="ds-message" data-role="assistant"><div class="ds-markdown" id="answer"></div></div></div>'},
 chatgpt:{host:'chatgpt.com',file:'chatgpt',html:'<article data-testid="conversation-turn-2"><div data-message-id="reply-2" data-message-author-role="assistant"><div class="markdown" id="answer"></div></div></article>'},
 'chatgpt-work':{host:'chatgpt.com',file:'chatgpt',html:'<section data-chatgpt-search-unit-key="turn:assistant" data-chatgpt-search-message-ids="a"><div data-markdown-text-style="assistant-message" id="answer"></div></section>'},
 claude:{host:'claude.ai',file:'claude',html:'<div data-testid="assistant-message" class="font-claude-response"><div class="standard-markdown" id="answer"></div></div>'},
 motif:{host:'chat.motiftech.io',file:'webchats',html:'<div data-testid="document-model-answer-content"><div class="prose" id="answer"></div></div>'},
 chatwave:{host:'chat.thewave.cv',file:'webchats',html:'<div id="chatThread"><div class="msg-row ai" data-mid="reply-2"><div class="msg-body" id="answer"></div></div></div>'},
 tencent:{host:'aistudio.tencent.ai',file:'webchats',html:'<div class="agent-chat__list__item--ai"><div class="hyc-content-md" id="answer"></div></div>'},
};
for(const fence of ['```lua','~~~luau'])test('an unclosed JSON object in prose cannot poison the following '+fence+' payload',()=>{
 const text='Previous incomplete format: {"command":"execute_luau","params":\n'+fence+'\n'+raw(code)+'\n'+fence.slice(0,3),p=parser(),calls=p.parseToolCalls(text);
 assert.equal(calls.length,1);assert.equal(calls[0].arguments.code,code);assert.equal(p.hasOpenToolBlock(text),false);
});
for(const brackets of ['[[', '[=[', '[==['])for(const comment of [false,true])test('a literal closing marker in a '+(comment?'long comment ':'long string ')+brackets+' does not truncate Luau',()=>{
 const close=brackets.replaceAll('[',']'),source=(comment?'--':'local example = ')+brackets+'\n###END_LUA###\n'+close+'\n'+code;
 const p=parser(),calls=p.parseToolCalls(raw(source));assert.equal(calls.length,1);assert.equal(calls[0].arguments.code,source);assert.equal(p.hasOpenToolBlock(raw(source)),false);
});
test('a closing marker inside an unfinished literal never authorizes partial code',()=>{
 const text='###LUA###\nlocal example = [=[\n###END_LUA###',p=parser();
 assert.equal(p.parseToolCalls(text).length,0);assert.equal(p.hasOpenToolBlock(text),true);
});
test('a fenced marker inside an incomplete JSON string remains data, not a new command',()=>{
 const text='{"command":"execute_luau","params":{"code":"\n```lua\n'+raw(code)+'\n```',p=parser();
 assert.equal(p.parseToolCalls(text).length,0);assert.equal(p.hasOpenToolBlock(text),true);
});
test('ordinary mentions and a closing marker in quoted Luau remain unchanged',()=>{
 const source='local note = "###END_LUA###"\n-- ###END_LUA###\n'+code;
 assert.equal(parser().parseToolCalls(raw(source))[0].arguments.code,source);
});
function watcher(format,confirmed=false,finish=true,id='deepseek',marker='###LUA###'){
 const site=sites[id],dom=new JSDOM('<!doctype html><body>'+site.html+'<form><textarea></textarea><button class="ds-button--primary" aria-label="Send">Send</button></form>',{url:'https://'+site.host+'/a/chat/test',runScripts:'outside-only'}),w=dom.window,c=dom.getInternalVMContext();
 w.document.querySelector('#answer').innerHTML='<pre><code></code></pre>';
 let clock=10000;const began=clock,events=[],node=w.document.querySelector('code');
 w.HTMLElement.prototype.getBoundingClientRect=()=>({width:500,height:80,top:10,bottom:90,left:0,right:500});
 Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return w.document.body;}});
 Object.defineProperty(w.document,'hidden',{value:false,configurable:true});
 w.Date.now=()=>clock;
 vm.runInContext(fs.readFileSync(path.join(sourceRoot,'core/parser.js'),'utf8'),c);
 vm.runInContext(fs.readFileSync(path.join(sourceRoot,'providers/'+site.file+'.js'),'utf8')+';window.P=RSProvider;',c);
 const P=w.P;P.isGenerating=()=>false;P.isHardGenerating=()=>false;P.scanError=()=>null;if(confirmed)P.turnComplete=()=>true;
 const prefix=format==='raw'?marker+'\nlocal text = [=[\n':'{"command":"execute_luau","params":{"code":"local text = [=[\\n';
 let expected;
 function render(){const elapsed=clock-began,n=Math.min(44,Math.floor(elapsed/500));const literal=' '.repeat(n);expected='local text = [=[\n'+literal+'\n]=]\n'+code;
  node.textContent=elapsed>=22000&&finish?(format==='raw'?marker+'\n'+expected+'\n###END_LUA###':JSON.stringify({command:'execute_luau',params:{code:expected}})):prefix+literal;}
 render();Object.assign(w,{A:{sessionGen:1,sendToken:'previous',stop:false,toolNames:new Set(['execute_luau'])},T:P.timings,bgMode:true,diag:(...a)=>events.push(a),log(){},sleep:async ms=>{clock+=ms;render();}});
 vm.runInContext(section('  function parseProviderToolCalls(','\n  // 1.24.10 helpers')+'\n'+section('  function verifyResponseOwner(res) {','\n  const isContextInvalidated')+'\nwindow.read=waitForResponse;',c);
 return {w,events,elapsed:()=>clock-began,expected:()=>expected};
}
for(const id of Object.keys(sites))for(const format of ['raw','json'])for(const complete of [false,true])test(id+' watcher waits while literal whitespace streams: '+format+', completion controls='+complete,async()=>{
 const f=watcher(format,complete,true,id),result=await f.w.read(0);assert.equal(result.kind,'tool');assert.equal(result.calls[0].arguments.code,f.expected());assert.ok(f.elapsed()>=22000);
});
test('a genuinely unfinished command still stops after the exact source becomes idle',async()=>{
 const f=watcher('json',false,false),result=await f.w.read(0);assert.equal(result.kind,'parse_error');assert.ok(f.elapsed()>=22000+15000&&f.elapsed()<41000);
});
for(const id of ['motif','chatwave','tencent']){
 for(const marker of ['###LUA:Edit###','### LUA : Server ###'])test(id+' accepts the parser-supported raw marker '+marker,async()=>{
  const f=watcher('raw',false,true,id,marker),result=await f.w.read(0);assert.equal(result.kind,'tool');assert.equal(result.calls[0].arguments.code,f.expected());assert.equal(result.calls[0].arguments.datamodel_type,marker.includes('Server')?'Server':'Edit');
 });
 test(id+' reports an unfinished raw command instead of silently ending as text',async()=>{
  const f=watcher('raw',false,false,id),result=await f.w.read(0);assert.equal(result.kind,'parse_error');assert.ok(f.elapsed()>=37000);
 });
}
function dispatcher(){const requests=[],c=vm.createContext({setTimeout,clearTimeout,setInterval,clearInterval,document:{hidden:false},window:{},A:{toolNames:new Set(['execute_luau','multi_edit','get_studio_state']),toolList:[],stop:false},P:{supportsVision:false},permMode:'full',bareToolName:n=>n,isBlockedTool:()=>false,importedRobloxTools:()=>[],activeEngine:()=> 'roblox',bg:async r=>{requests.push(r);return {ok:true,text:'controlled bridge response'};},diag(){},RS:{FEEDBACK:{}}});
 vm.runInContext(fs.readFileSync(path.join(root,'core/tool-guard.js'),'utf8')+';globalThis.guard=PlazCodeToolGuard;',c);
 vm.runInContext(section('  const LUAU_CHUNK_MAX =','  function pythonAnalyze('),c);
 vm.runInContext(section('  async function runTool(call) {','  function argSummary(call) {')+';globalThis.run=runTool;',c);
 return {run:c.run,guard:c.guard,requests};
}
for(const wrapped of [false,true])for(const size of ['short','long'])test('parser, actual guard and runTool preserve function calls: '+(wrapped?'JSON':'raw')+' '+size,async()=>{
 const source=code+(size==='long'?'\n'+Array.from({length:130},(_,i)=>`local v${i} = {color = Color3.fromRGB(1, 2, 3), size = UDim2.fromOffset(240, 40)}`).join('\n'):''),p=parser(),d=dispatcher();
 const text=wrapped?JSON.stringify({command:'execute_luau',params:{code:source}}):raw(source),calls=p.parseToolCalls(text);
 assert.equal(calls.length,1);assert.equal(d.guard.check(calls[0],[]).length,0);assert.match(await d.run(calls[0]),/controlled bridge response/);
 assert.equal(d.requests.length,1);assert.equal(d.requests[0].arguments.code,source);assert.equal(d.requests[0].arguments.datamodel_type,'Edit');
});
for(const tool of ['get_studio_state','multi_edit'])test('working control command still reaches the same bridge: '+tool,async()=>{
 const d=dispatcher(),args=tool==='multi_edit'?{edits:[{old_string:'old',new_string:code}],datamodel_type:'Edit'}:{},call=parser().parseToolCalls(JSON.stringify({command:tool,params:args}))[0];
 assert.match(await d.run(call),/controlled bridge response/);assert.equal(d.requests.length,1);assert.deepEqual(JSON.parse(JSON.stringify(d.requests[0].arguments)),args);
});
test('failure metadata distinguishes open source without retaining project text',()=>{
 const text='###LUA###\nlocal secret = "super_private_value"\nlocal x = Instance.new(',info=parser().transportInfo(text);
 assert.equal(info.format,'raw_luau');assert.equal(info.open,true);assert.equal(info.calls,0);assert.equal(info.chars,text.length);
 assert.doesNotMatch(JSON.stringify(info),/super_private_value|Instance\.new/);
});
test('Luau retry guidance consistently accepts both supported formats',()=>{
 const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(sourceRoot,'core/config.js'),'utf8')+';globalThis.R=RS;',c);
 for(const reason of ['malformed','unclosed']){const text=c.R.FEEDBACK.parseError(reason,'execute_luau');assert.match(text,/valid execute_luau JSON envelope is also accepted/);assert.match(text,/without JSON escaping/);assert.doesNotMatch(text,/Do not wrap the code in JSON/);}
});
