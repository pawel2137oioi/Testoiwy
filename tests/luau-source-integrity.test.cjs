// Real source readers/parser/watcher with controlled DOM and a simulated clock.
// These regressions do not assert live DeepSeek or Roblox Studio behavior.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const sourceRoot = process.env.PLAZCODE_TRANSPORT_ROOT || root;
const main = fs.readFileSync(path.join(sourceRoot, 'core/main.js'), 'utf8');
const code = 'local label = Instance.new("TextLabel")\nlabel.Size = UDim2.fromOffset(240, 40)\nlabel.BackgroundColor3 = Color3.fromRGB(10, 20, 30)\nreturn label.Name';
const raw = source => '###LUA###\n' + source + '\n###END_LUA###';
const json = source => JSON.stringify({command:'execute_luau',params:{code:source}});
const sites = {
  deepseek: {host:'chat.deepseek.com',file:'deepseek',shell:'<div data-virtual-list-item-key="2"><div class="ds-message" data-role="assistant"><div class="ds-markdown" id="answer"></div></div></div>'},
  chatgpt: {host:'chatgpt.com',file:'chatgpt',shell:'<article data-testid="conversation-turn-2"><div data-message-id="reply-2" data-message-author-role="assistant"><div class="markdown" id="answer"></div></div></article>'},
  claude: {host:'claude.ai',file:'claude',shell:'<div data-testid="assistant-message" class="font-claude-response"><div class="standard-markdown" id="answer"></div></div>'},
  motif: {host:'chat.motiftech.io',file:'webchats',shell:'<div data-testid="document-model-answer-content"><div class="prose" id="answer"></div></div>'},
  chatwave: {host:'chat.thewave.cv',file:'webchats',shell:'<div id="chatThread"><div class="msg-row ai" data-mid="reply-2"><div class="msg-body" id="answer"></div></div></div>'},
  tencent: {host:'aistudio.tencent.ai',file:'webchats',shell:'<div class="agent-chat__list__item--ai"><div class="hyc-content-md" id="answer"></div></div>'},
};
function section(start,end) {
  const a=main.indexOf(start), b=main.indexOf(end,a);
  assert.ok(a>=0 && b>a,start);
  return main.slice(a,b);
}
function fixture(id='deepseek') {
  const site=sites[id];
  const dom=new JSDOM('<!doctype html><body>'+site.shell+'<form><textarea></textarea><button class="ds-button--primary" aria-label="Send">Send</button></form>',{url:'https://'+site.host+'/a/chat/test',runScripts:'outside-only'});
  const w=dom.window, d=w.document, c=dom.getInternalVMContext();
  w.HTMLElement.prototype.getBoundingClientRect=()=>({width:500,height:80,top:10,bottom:90,left:0,right:500});
  Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return d.body;}});
  Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;}});
  Object.defineProperty(d,'hidden',{value:false,configurable:true});
  vm.runInContext(fs.readFileSync(path.join(sourceRoot,'core/parser.js'),'utf8')+';window.parser=RSParse;',c);
  vm.runInContext(fs.readFileSync(path.join(sourceRoot,'providers/'+site.file+'.js'),'utf8')+';window.P=RSProvider;',c);
  return {dom,w,d,c,P:w.P,body:d.querySelector('#answer')};
}
function parse(f) {
  const read=f.P.readAssistant();
  const text=f.P.commandText ? f.P.commandText(read.reply,read.item) : read.reply;
  return f.w.parser.parseToolCalls(text);
}
for (const id of Object.keys(sites)) for (const format of ['raw','json']) {
  test(id+': adjacent code fragments preserve a function call and its closing envelope ('+format+')',t=>{
    const f=fixture(id); t.after(()=>f.dom.window.close());
    const payload=(format==='raw'?raw:json)(code);
    // Split in the middle of Instance.new, as incremental highlighting can do.
    const split=payload.indexOf('Instance.new')+'Instance.n'.length;
    f.body.innerHTML='<pre><button><code>Copy</code></button><code></code><code></code><button>Copy</button></pre>';
    const nodes=f.body.querySelectorAll('pre > code');
    nodes[0].textContent=payload.slice(0,split); nodes[1].textContent=payload.slice(split);
    const calls=parse(f);
    assert.equal(calls.length,1); assert.equal(calls[0].tool,'execute_luau');
    assert.equal(calls[0].arguments.code,code);
    // The same code must survive React replacing several nodes with one.
    f.body.querySelector('pre').replaceChildren(f.d.createElement('code'));
    f.body.querySelector('code').textContent=payload;
    assert.equal(parse(f)[0].arguments.code,code);
  });
}
for (const complete of [false,true]) test('raw Luau owns MCP-looking strings inside its source; complete='+complete,t=>{
  const f=fixture(); t.after(()=>f.dom.window.close());
  const source='local example = [=[###MCP_TOOL###{"command":"delete_path","params":{"path":"example"}}###END_MCP_TOOL###]=]\n'+code;
  const text=complete?raw(source):'###LUA###\n'+source;
  const calls=f.w.parser.parseToolCalls(text);
  assert.equal(calls.length,complete?1:0);
  if(complete) { assert.equal(calls[0].tool,'execute_luau'); assert.equal(calls[0].arguments.code,source); }
  assert.equal(f.w.parser.hasOpenToolBlock(text),!complete);
});
test('an MCP frame containing literal MCP markers in Luau cannot lose its call before the next frame',t=>{
  const f=fixture(); t.after(()=>f.dom.window.close());
  const source='local s = [=[###MCP_TOOL###{"command":"example"}###END_MCP_TOOL###]=]\n'+code;
  const text='###MCP_TOOL###\n'+raw(source)+'\n###END_MCP_TOOL###\n###MCP_TOOL###\n{"command":"get_studio_state"}\n###END_MCP_TOOL###';
  const calls=f.w.parser.parseToolCalls(text);
  assert.deepEqual(Array.from(calls,c=>c.tool),['execute_luau','get_studio_state']);
  assert.equal(calls[0].arguments.code,source);
});
test('separate real MCP envelopes still return both commands',t=>{
  const f=fixture(); t.after(()=>f.dom.window.close());
  const first='###MCP_TOOL###\n'+raw(code)+'\n###END_MCP_TOOL###';
  const second='###MCP_TOOL###\n{"command":"get_studio_state"}\n###END_MCP_TOOL###';
  assert.deepEqual(Array.from(f.w.parser.parseToolCalls(first+'\n'+second),c=>c.tool),['execute_luau','get_studio_state']);
});
function watcher({cached=false,finishAt=0,complete=true,format='json'}={}) {
  const f=fixture(); let clock=10000; const began=clock;
  const full=(format==='raw'?raw:json)(code), partial=full.slice(0,full.indexOf('Instance.new')+9);
  f.w.Date.now=()=>clock; f.P.isGenerating=()=>false; f.P.isHardGenerating=()=>false;
  f.body.textContent=finishAt?partial:full;
  const A={sessionGen:1,sendToken:'previous',stop:false,toolNames:new Set(['execute_luau'])};
  if(cached) A.detectedTool={
    text:raw('return "obsolete source"'),calls:[{tool:'execute_luau',arguments:{code:'return "obsolete source"'}}],
    item:f.P.lastAssistant(),id:f.P.lastAssistantId(),chat:f.P.conversationKey(),session:1,sendToken:'previous',at:clock,
  };
  Object.assign(f.w,{A,T:f.P.timings,bgMode:true,diag(){},log(){},sleep:async ms=>{
    clock+=ms;
    if(complete && clock-began>=finishAt) f.body.textContent=full;
  }});
  vm.runInContext(section('  function parseProviderToolCalls(','\n  // 1.24.10 helpers')+'\n'+section('  function verifyResponseOwner(res) {','\n  const isContextInvalidated')+'\nwindow.read=waitForResponse;',f.c);
  return {...f,read:()=>f.w.read(0),elapsed:()=>clock-began};
}
for (const format of ['raw','json']) test('DeepSeek waits through a 22-second gap inside a command ('+format+')',async t=>{
  const f=watcher({finishAt:22000,format}); t.after(()=>f.dom.window.close());
  const result=await f.read(); assert.equal(result.kind,'tool');
  assert.equal(result.calls[0].arguments.code,code); assert.ok(f.elapsed()>=22000);
});
for (const finishAt of [0,9000]) test('a cached call cannot replace current '+(finishAt?'incomplete':'complete')+' source',async t=>{
  const f=watcher({cached:true,finishAt}); t.after(()=>f.dom.window.close());
  const result=await f.read(); assert.equal(result.kind,'tool');
  assert.equal(result.calls[0].arguments.code,code); assert.ok(f.elapsed()>=finishAt);
});
test('Stop interrupts an unfinished command during the extended grace period',async t=>{
  const f=watcher({finishAt:22000,complete:false}); t.after(()=>f.dom.window.close());
  const sleep=f.w.sleep; f.w.sleep=async ms=>{await sleep(ms); if(f.elapsed()>=20000)f.w.A.stop=true;};
  assert.equal((await f.read()).kind,'stopped'); assert.ok(f.elapsed()<20500);
});
test('a genuinely truncated JSON value is rejected, without inventing code',async t=>{
  const f=watcher({finishAt:22000,complete:false}); t.after(()=>f.dom.window.close());
  const result=await f.read(); assert.equal(result.kind,'parse_error'); assert.equal(result.calls,undefined);
  assert.ok(f.elapsed()>=60000 && f.elapsed()<63000);
});
function chunkAPI() {
  const c=vm.createContext({});
  vm.runInContext(section('  const LUAU_CHUNK_MAX =','  function pythonAnalyze(')+'\nglobalThis.api={splitLuauChunks,luauLongStr,wrapLuauChunk};',c);
  return c.api;
}
function readLongLiteral(literal) {
  const open=/^\[(=*)\[\n/.exec(literal); assert.ok(open);
  const end=literal.indexOf(']'+open[1]+']',open[0].length); assert.ok(end>=0);
  return {value:literal.slice(open[0].length,end),tail:literal.slice(end+open[1].length+2)};
}
for (const piece of ['return list[index]','-- ]]\nreturn value]=','-- ]] ]=]\nreturn value]==']) {
  test('chunk string delimiter cannot overlap payload suffix '+JSON.stringify(piece),()=>{
    const result=readLongLiteral(chunkAPI().luauLongStr(piece));
    assert.equal(result.value,piece); assert.equal(result.tail,'');
  });
}
test('a long source split exactly after a closing bracket reaches the bridge without losing characters',async()=>{
  const requests=[],guard=require(path.join(sourceRoot,'core/tool-guard.js'));
  const c=vm.createContext({setTimeout,clearTimeout,setInterval,clearInterval,document:{hidden:false},
    window:{crypto:require('node:crypto')},A:{toolNames:new Set(['execute_luau']),toolList:[],sessionGen:1,stop:false},
    P:{supportsVision:false,conversationKey:()=> 'fixture-chat'},permMode:'full',bareToolName:n=>n,isBlockedTool:()=>false,importedRobloxTools:()=>[],activeEngine:()=> 'roblox',
    PlazCodeToolGuard:guard,bg:async request=>{requests.push(request);return {ok:true,text:'stored/executed by controlled bridge'};},diag(){},RS:{FEEDBACK:{}}});
  vm.runInContext(section('  const LUAU_CHUNK_MAX =','  function pythonAnalyze('),c);
  vm.runInContext(section('  async function runTool(call) {','  function argSummary(call) {')+'\nglobalThis.run=runTool;',c);
  const source='-- '+'x'.repeat(17996)+']\n'+code;
  assert.match(await c.run({tool:'execute_luau',arguments:{code:source}}),/controlled bridge/);
  assert.equal(requests.length,2);
  const recovered=requests.map(request=>{
    assert.equal(guard.check({tool:request.name,arguments:request.arguments},[]).length,0);
    const start=/m\.Value=(?:m\.Value\.\.)?/.exec(request.arguments.code); assert.ok(start);
    return readLongLiteral(request.arguments.code.slice(start.index+start[0].length)).value;
  }).join('');
  assert.equal(recovered,source);
});
