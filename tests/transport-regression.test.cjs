// Real adapters/parser/core with controlled DOM, timers and bridge responses.
// These tests do not claim live account or Roblox Studio coverage.
const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {randomUUID}=require('node:crypto'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),main=fs.readFileSync(path.join(root,'core/main.js'),'utf8');
function section(start,end){const a=main.indexOf(start),b=main.indexOf(end,a);assert.ok(a>=0&&b>a,start);return main.slice(a,b);}
function parser(){const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+';globalThis.p=RSParse;',c);return c.p;}
const code=['local quoted = "Zażółć 🦊 \\\"quote\\\""',"local apostrophe = 'it is fine'",'local braces = { ["a"] = "{ value }", path = "C:\\\\Temp" }',...Array.from({length:320},(_,i)=>`local v${i} = {${i}, "value ${i}"} -- {} [] apostrophe ' quote "`),'return quoted'].join('\n');
const sites={
 deepseek:{host:'chat.deepseek.com',file:'deepseek',html:'<div data-virtual-list-item-key="2"><div class="ds-message" data-role="assistant"><div class="ds-markdown"></div></div></div><form><textarea></textarea><button class="ds-button--primary" aria-label="Send">Send</button></form>',body:'.ds-markdown'},
 chatgpt:{host:'chatgpt.com',file:'chatgpt',html:'<article data-testid="conversation-turn-2"><div data-message-id="reply-2" data-message-author-role="assistant"><div class="markdown"></div></div></article><form><div id="prompt-textarea" class="ProseMirror" contenteditable="true"></div><button data-testid="send-button">Send</button></form>',body:'.markdown'},
 claude:{host:'claude.ai',file:'claude',html:'<div data-testid="assistant-message" class="font-claude-response"><div class="standard-markdown"></div></div><form><div class="ProseMirror" role="textbox" contenteditable="true"></div><button data-testid="send-button">Send</button></form>',body:'.standard-markdown'},
 motif:{host:'chat.motiftech.io',file:'webchats',html:'<div data-testid="document-model-answer-content"><div class="prose"></div></div><form><textarea id="chat-textarea"></textarea><button data-testid="document-send-button">Send</button></form>',body:'.prose'},
 chatwave:{host:'chat.thewave.cv',file:'webchats',html:'<div id="chatThread"><div class="msg-row ai" data-mid="reply-2"><div class="msg-bubble"><div class="msg-body"></div></div></div></div><div id="inputIsland"><form><textarea id="chatInput"></textarea><button id="sendBtn" aria-label="Voice input">Send</button></form></div>',body:'.msg-body'},
 tencent:{host:'aistudio.tencent.ai',file:'webchats',html:'<div class="agent-chat__list__item--ai"><div class="hyc-content-md"></div></div><div class="hy-chat-input"><textarea></textarea><div class="hy-chat-input-send-btn">Send</div></div>',body:'.hyc-content-md'},
};
function adapter(id){
 const s=sites[id],dom=new JSDOM('<!doctype html><body>'+s.html+'</body>',{url:'https://'+s.host+'/chat/test',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();
 Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;}});
 Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:d.body;}});
 w.HTMLElement.prototype.getBoundingClientRect=()=>({width:500,height:80,top:100,bottom:180,left:0,right:500});
 vm.runInContext(fs.readFileSync(path.join(root,'providers/'+s.file+'.js'),'utf8')+';window.P=RSProvider;',c);
 vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+';window.parser=RSParse;',c);
 return {w,d,c,P:w.P,body:d.querySelector(s.body)};
}
test('long multi_edit parses when command follows twelve edit objects',()=>{
 const p=parser(),params={edits:Array.from({length:12},(_,i)=>({path:'ServerScriptService.Script'+i,old_string:'old',new_string:code}))};
 const calls=p.parseToolCalls(JSON.stringify({params,command:'multi_edit'}));assert.equal(calls.length,1);assert.deepEqual(JSON.parse(JSON.stringify(calls[0].arguments)),params);
});
test('raw Luau containing a JSON example executes the complete Luau block',()=>{
 const source='local sample = [[{"command":"list_commands","params":{}}]]\nreturn sample',calls=parser().parseToolCalls('###LUA###\n'+source+'\n###END_LUA###');
 assert.equal(calls.length,1);assert.equal(calls[0].tool,'execute_luau');assert.equal(calls[0].arguments.code,source);
});
test('markers inside a literal string do not replace ordinary Luau source',()=>{
 const source='local sample = "###LUA### hello ###END_LUA###"\nreturn sample',p=parser();
 assert.equal(p.parseToolCalls(JSON.stringify({command:'execute_luau',params:{code:source}}))[0].arguments.code,source);
 assert.equal(p.hasOpenToolBlock(JSON.stringify({command:'execute_luau',params:{code:'local s = "###LUA###"'}})),false);
});
test('JSON inside MCP envelope is decoded before removing actual code markers',()=>{
 const source='###MCP_TOOL###\n'+JSON.stringify({command:'execute_luau',params:{code:'###LUA###\n'+code+'\n###END_LUA###'}})+'\n###END_MCP_TOOL###';
 assert.equal(parser().parseToolCalls(source)[0].arguments.code,code);
});
test('an ordinary unmatched quotation mark in prose cannot hide a following JSON command',()=>{
 const calls=parser().parseToolCalls('Updating the label "Mode:\n```json\n'+JSON.stringify({command:'execute_luau',params:{code}})+'\n```');assert.equal(calls[0].arguments.code,code);
});
test('wrapped raw Luau preserves a literal end marker and leading source indentation',()=>{
 const source='  local sample = "###END_LUA###"\n  return sample';
 const calls=parser().parseToolCalls(JSON.stringify({command:'execute_luau',params:{code:'###LUA###\n'+source+'\n###END_LUA###'}}));assert.equal(calls[0].arguments.code,source);
});
for(const wrapped of [false,true])test('canonical Luau preserves a first identifier named json: '+(wrapped?'JSON envelope':'raw block'),()=>{
 const source='json = { ["key"] = "value" }\nreturn json',block='###LUA###\n'+source+'\n###END_LUA###';
 const text=wrapped?JSON.stringify({command:'execute_luau',params:{code:block}}):block;
 assert.equal(parser().parseToolCalls(text)[0].arguments.code,source);
});
test('an incomplete JSON envelope cannot fall back to escaped raw Luau',()=>{
 const text='{"command":"execute_luau","params":{"code":"###LUA###\\nreturn \\"x\\"\\n###END_LUA###';
 assert.equal(parser().parseToolCalls(text).length,0);
});
for(const id of Object.keys(sites))for(const format of ['json','raw','params-first'])test(id+': complete long '+format+' command preserves quotes, braces, Unicode and all lines',()=>{
 const f=adapter(id),pre=f.d.createElement('pre'),node=f.d.createElement('code');
 const params={code,datamodel_type:'Server'};
 const text=format==='raw'?'###LUA:Server###\n'+code+'\n###END_LUA###':JSON.stringify(format==='params-first'?{params,command:'execute_luau'}:{command:'execute_luau',params});
 node.textContent=text;pre.append(node);f.body.append(pre);
 const reply=f.P.readAssistant().reply,source=f.P.commandText?f.P.commandText(reply,f.P.lastAssistant()):reply;
 const calls=f.w.parser.parseToolCalls(source);assert.equal(calls.length,1);assert.equal(calls[0].tool,'execute_luau');assert.equal(calls[0].arguments.code,code);assert.equal(calls[0].arguments.datamodel_type,'Server');assert.equal(f.w.parser.hasOpenToolBlock(source),false);
});
function results(id,settings={}){
 const P=id==='chatwave-api'?{id,toolResultPageChars:10000,conversationKey:()=>id}:adapter(id).P;
 const c=vm.createContext({P,activeEngine:()=> 'roblox',window:{},crypto:{randomUUID},chrome:{storage:{local:{get(_k,cb){cb(settings);}},onChanged:{addListener(){}}}}});
 vm.runInContext(section('  const retainedToolResults = new Map();','  async function attachAutoDebug(')+';globalThis.api={compressToolFeedback,readRetainedToolResult,prepareToolFeedback,resultPageSize};',c);return c.api;
}
for(const id of [...Object.keys(sites),'chatwave-api'])for(const settings of [{},{rsInputLimitEnabled:false,rsOutputLimitEnabled:false}])test(id+': entire large result reconstructs with '+(settings.rsOutputLimitEnabled===false?'disabled':'default')+' configured limits',()=>{
 const api=results(id,settings),original='Output of get_console_output:\n'+code.repeat(8)+'\nFINAL 🦊',pages=[];
 const first=api.compressToolFeedback(original,'get_console_output');let text=first;
 if(first!==original){const m=first.match(/id:"([^"]+)",offset:(\d+)/);assert.ok(m);text=first.slice(first.indexOf('\n')+1);let offset=Number(m[2]);pages.push(first);
  while(offset!==null){assert.ok(pages.length<1000);const page=api.readRetainedToolResult({id:m[1],offset}),header=JSON.parse(page.split('\n')[1]);assert.equal(header.offset,text.length);text+=page.split('---RESULT CONTENT---\n')[1];offset=header.next_offset;pages.push(page);}
 }
 assert.equal(text,original);assert.ok(pages.every(p=>p.length<=api.resultPageSize()));
 if(id==='deepseek'){assert.ok(api.resultPageSize()<=32000);assert.match(api.prepareToolFeedback(original),/retained the COMPLETE result/);}
});

function pacing(id,setting=0){
 const P=adapter(id).P;let clock=10000;const sleeps=[];
 const c=vm.createContext({P,Date:{now:()=>clock},reliabilitySettings:{rsCommandCooldown:setting},diag(){},sleep:async ms=>{sleeps.push(ms);clock+=ms;}});
 vm.runInContext(section('  let _lastCommandSendAt = 0;','  function jitterBeforeSend()')+';globalThis.wait=waitCommandCooldown;globalThis.note=()=>{_lastCommandSendAt=Date.now();};',c);
 return {wait:c.wait,note:c.note,now:()=>clock,advance:ms=>{clock+=ms;},sleeps};
}
test('DeepSeek spaces automatic messages by at least 15 seconds with setting zero',async()=>{
 const f=pacing('deepseek');await f.wait(false);const sent=f.now();f.advance(1000);await f.wait(false);assert.equal(f.now()-sent,15000);
});
test('DeepSeek also spaces extension-submitted explicit prompts and feedback after native user intent',async()=>{
 const f=pacing('deepseek');f.note();const sent=f.now();f.advance(700);await f.wait(true);assert.equal(f.now()-sent,15000);
});
test('larger configured spacing is respected on DeepSeek',async()=>{
 const f=pacing('deepseek',45);await f.wait(false);const sent=f.now();await f.wait(false);assert.equal(f.now()-sent,45000);
});
test('Stop interrupts the pacing wait promptly',async()=>{
 const f=pacing('deepseek');f.note();const started=f.now();await f.wait(false,()=>f.now()-started>=500);assert.ok(f.now()-started<=500);
});
for(const id of Object.keys(sites).filter(x=>x!=='deepseek'))test(id+': no DeepSeek-specific delay is introduced',async()=>{
 const f=pacing(id);await f.wait(false);await f.wait(false);assert.equal(f.sleeps.length,0);
});
test('DeepSeek refuses an oversized message without clipping it or changing the draft',async()=>{
 const f=adapter('deepseek'),ed=f.P.getEditor();ed.value='unfinished user draft';let clicks=0;f.d.querySelector('button').onclick=()=>clicks++;
 f.w.__rsLimitOutgoing=x=>x;await assert.rejects(()=>f.P.typeAndSend('x'.repeat(160001)),/Nothing was omitted or sent/);assert.equal(ed.value,'unfinished user draft');assert.equal(clicks,0);
});

function responseFixture(finishAt){
 const f=adapter('deepseek');let clock=10000;const began=clock;
 const full=JSON.stringify({command:'execute_luau',params:{code,datamodel_type:'Edit'}}),partial=full.slice(0,100);
 f.body.textContent=partial;f.w.Date.now=()=>clock;f.P.isGenerating=()=>false;f.P.isHardGenerating=()=>false;
 Object.assign(f.w,{A:{sessionGen:1,sendToken:'previous',stop:false},T:f.P.timings,bgMode:true,diag(){},log(){},
  sleep:async ms=>{clock+=ms;if(finishAt!==null&&clock-began>=finishAt)f.body.textContent=full;}});
 vm.runInContext(section('  function parseProviderToolCalls(','\n  // 1.24.10 helpers')+'\n'+section('  function verifyResponseOwner(res) {','\n  const isContextInvalidated')+'\nwindow.read=waitForResponse;',f.c);
 return {...f,elapsed:()=>clock-began};
}
test('actual response watcher waits through a nine-second mid-command generation-signal gap',async()=>{
 const f=responseFixture(9000),result=await f.w.read(0);assert.equal(result.kind,'tool');assert.equal(result.calls[0].arguments.code,code);assert.ok(f.elapsed()>=9000);
});
test('a genuinely incomplete command eventually returns an error and never a partial call',async()=>{
 const f=responseFixture(null),result=await f.w.read(0);assert.equal(result.kind,'parse_error');assert.ok(!result.calls);assert.ok(f.elapsed()>=15000&&f.elapsed()<20000);
});

function debugFixture(entries=[]){
 const calls=[],c=vm.createContext({A:{},window:{__rsAutoDebug:()=>true},activeEngine:()=> 'roblox',Date:{now:()=>100000},setTimeout:()=>1,
  bg:async request=>{calls.push(request);return {ok:true,text:JSON.stringify(entries)};}});
 vm.runInContext(section('  function studioLogOrigin(','  async function undoStudioTxn(')+';globalThis.api={origin:studioLogOrigin,blocks:projectErrorBlocks,attach:attachAutoDebug};',c);
 return {...c.api,calls,c};
}
const internal="Error: UIBlox LUMBERYAK INTERNAL\nStack Begin\nScript 'CorePackages.Packages._Index.UIBlox.UIBlox', Line 25\nStack End";
const project="ServerScriptService.Panel:42: attempt to index nil\nStack Begin\nScript 'ServerScriptService.Panel', Line 42\nStack End";
test('known internal UIBlox/CorePackages error is not a project auto-fix target',()=>{
 const f=debugFixture();assert.equal(f.origin(internal),'internal');assert.equal(f.blocks(internal).length,0);
});
test('a project script mentioning UIBlox is still a project error',()=>{
 const f=debugFixture();assert.equal(f.origin(project.replace('attempt to index nil','UIBlox LUMBERYAK INTERNAL')),'project');assert.equal(f.blocks(project).length,1);
});
test('internal logs after a project error do not hide the real project error',()=>{
 const f=debugFixture(),blocks=f.blocks(project+'\n'+internal);assert.equal(blocks.length,1);assert.match(blocks[0],/ServerScriptService.Panel/);assert.doesNotMatch(blocks[0],/LUMBERYAK/);
});
for(const prefix of ['Warning: ','[Warning] ','21:50:36.123 - Warning: '])test('warning with project location and error-like wording is not auto-fixed: '+prefix,()=>{
 const f=debugFixture();assert.equal(f.blocks(prefix+'Workspace.Panel:5: Error loading optional icon').length,0);
});
test('unknown-origin error is kept for manual inspection rather than an automatic repair',()=>{
 const f=debugFixture();assert.equal(f.origin('Error: something failed'),'unknown');assert.equal(f.blocks('Error: something failed').length,0);
});
test('actual auto-debug ignores warnings and internal package errors',async()=>{
 const f=debugFixture([{t:'Enum.MessageType.MessageWarning',m:project},{t:'Enum.MessageType.MessageError',m:internal}]);assert.equal(await f.attach('execute_luau','actual result'),'actual result');
});
test('actual auto-debug retains a project error and its separately logged stack without clipping',async()=>{
 const message='Error: '+('details '.repeat(50));
 const f=debugFixture([{t:'Enum.MessageType.MessageError',m:message},{t:'Enum.MessageType.MessageOutput',m:"Script 'Workspace.Panel', Line 42"},{t:'Enum.MessageType.MessageOutput',m:'Stack End'}]);
 const text=await f.attach('execute_luau','actual result');assert.ok(text.includes(message));assert.match(text,/Workspace.Panel/);assert.doesNotMatch(f.calls[0].arguments.code,/:sub\(1,240\)/);
});
for(const scenario of ['internal','warning','project'])test('actual playtest watcher '+(scenario==='project'?'reports a project error':'does not stop Play or send a repair request for '+scenario),async()=>{
 const f=debugFixture(),c=f.c,sends=[],calls=[];let clock=100000,consoleText='Play started\n';
 Object.assign(c,{autoFixEnabled:true,autoFixStopPlay:true,bgMode:true,document:{hidden:false},A:{started:true,bridge:{connected:true}},Date:{now:()=>clock},diag(){},toast(){},submitAndGetBase:async text=>{sends.push(text);return 0;},
  bg:async request=>{calls.push(request);return request.name==='get_console_output'?{ok:true,text:consoleText}:{ok:true,text:'true'};}});
 vm.runInContext(section('    let _autofixBusy = false;','    // Poll every 4s when enabled.')+'\nglobalThis.checkPlay=checkPlaytestErrors;',c);
 await c.checkPlay();consoleText+=scenario==='internal'?internal:scenario==='warning'?'21:50:36 - Warning: Workspace.Panel:5: Error loading optional icon':project;clock+=1000;await c.checkPlay();
 assert.equal(sends.length,scenario==='project'?1:0);assert.equal(calls.filter(x=>x.name==='start_stop_play').length,scenario==='project'?1:0);
 if(scenario==='project')assert.match(sends[0],/ServerScriptService.Panel/);
});
test('explicit debug command retains log messages beyond the old 240/4000-character cuts',async()=>{
 const raw=JSON.stringify({count:1,lines:[{t:'MessageError',m:code}]});const c=vm.createContext({bg:async()=>({ok:true,text:raw})});
 vm.runInContext('globalThis.run=async function(name,args){\n'+section('    if (name === "plazcode_debug") {','    if (name === "plazcode_agent") {')+'\n};',c);
 const result=await c.run('plazcode_debug',{});assert.ok(result.includes(raw));assert.match(result,/last 60 log entries/);
});
test('execute_luau parse feedback prefers literal Lua while accepting correctly escaped JSON',()=>{
 const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'core/config.js'),'utf8')+';globalThis.R=RS;',c);
 for(const reason of ['malformed','unclosed'])assert.match(c.R.FEEDBACK.parseError(reason,'execute_luau'),/valid execute_luau JSON envelope is also accepted/);
 assert.doesNotMatch(c.R.FEEDBACK.parseError('unclosed','multi_edit'),/###LUA###/);
});
test('ChatWave native API preserves a long Luau argument through real JSON encoding',async()=>{
 const requests=[],responses=[{choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'catalogue',type:'function',function:{name:'list_commands',arguments:'{}'}}]}}]},
  {choices:[{finish_reason:'stop',message:{content:'ready'}}]},
  {choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'long-luau',type:'function',function:{name:'plazcode_command',arguments:JSON.stringify({command:'execute_luau',params:{code,datamodel_type:'Edit'}})}}]}}]}];
 const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'core/chatwave-api.js'),'utf8')+';globalThis.make=PlazCodeChatWaveAPI.create;',c);
 const api=c.make({model:'fixture-model',request:async body=>{requests.push(body);return responses.shift();}});api.setTools([{name:'execute_luau'}]);
 await api.turn('start');await api.turn('real catalogue');const result=await api.turn('user task',{userPrompt:true});assert.equal(result.call.params.code,code);assert.equal(requests.length,3);
});
