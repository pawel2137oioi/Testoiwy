// Native API fixtures use mock HTTP/model/bridge responses; no user key/network.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {randomUUID}=require('node:crypto'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),main=fs.readFileSync(path.join(root,'core/main.js'),'utf8'),backend=fs.readFileSync(path.join(root,'background.js'),'utf8');
const key='cw-fake-local-test-value';
const native=(name,args,id='call-1')=>({choices:[{finish_reason:'tool_calls',message:{role:'assistant',content:null,tool_calls:[{id,type:'function',function:{name,arguments:JSON.stringify(args)}}]}}]});
const plain=text=>({choices:[{finish_reason:'stop',message:{role:'assistant',content:text}}]});
function slice(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
function client(replies){const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'core/chatwave-api.js'),'utf8')+'\nglobalThis.make=PlazCodeChatWaveAPI.create;',c);const requests=[];const api=c.make({model:'fixture-model',request:async body=>{requests.push(JSON.parse(JSON.stringify(body)));const next=replies.shift();if(next instanceof Error)throw next;return next;}});api.setTools([{name:'execute_luau'}]);return {api,requests};}
test('native startup and real result preserve the API tool_call_id',async()=>{
 const f=client([native('list_commands',{}),plain('PlazCode is ready.'),native('plazcode_command',{command:'execute_luau',params:{code:'print(1)'}},'call-2'),plain('Done')]);
 assert.equal((await f.api.turn('start')).call.command,'list_commands');
 assert.equal((await f.api.turn('actual catalogue')).text,'PlazCode is ready.');
 const call=await f.api.turn('print one',{userPrompt:true});assert.equal(call.call.params.code,'print(1)');
 await f.api.turn('actual execution result');
 assert.equal(f.requests[0].tool_choice.function.name,'list_commands');assert.equal(f.requests[1].messages.at(-1).role,'tool');
 assert.equal(f.requests[1].messages.at(-1).tool_call_id,'call-1');assert.equal(f.requests[3].messages.at(-1).tool_call_id,'call-2');
 assert.equal(f.requests[3].messages.at(-1).content,'actual execution result');assert.equal(f.requests[0].parallel_tool_calls,false);
 assert.ok(f.requests.every(r=>!JSON.stringify(r).includes(key)));
});
test('ordinary JSON or Luau content is never promoted to an API command',async()=>{
 const f=client([plain('{"command":"execute_luau","params":{"code":"print(1)"}}')]);const result=await f.api.turn('start');assert.equal(result.call,null);assert.match(result.text,/execute_luau/);
});
test('API refusal overrides a tool-shaped payload',async()=>{
 const value=native('list_commands',{});value.choices[0].message.refusal='I cannot participate.';
 const f=client([value]);const result=await f.api.turn('start');assert.equal(result.call,null);assert.equal(result.text,'I cannot participate.');
});
for(const issue of ['multiple','unknown','bad JSON','cut off','wrong first tool','missing id','wrong finish'])test('invalid native response stops without execution: '+issue,async()=>{
 const value=native('list_commands',{}),choice=value.choices[0],call=choice.message.tool_calls[0];
 if(issue==='multiple')choice.message.tool_calls.push({...call,id:'second'});
 if(issue==='unknown')call.function.name='unadvertised';
 if(issue==='bad JSON')call.function.arguments='{"server":';
 if(issue==='cut off')choice.finish_reason='length';
 if(issue==='wrong first tool'){call.function.name='plazcode_command';call.function.arguments='{"command":"execute_luau","params":{}}';}
 if(issue==='missing id')delete call.id;
 if(issue==='wrong finish')choice.finish_reason='stop';
 const f=client([value]);await assert.rejects(()=>f.api.turn('start'));assert.equal(f.requests.length,1);
 await assert.rejects(()=>f.api.turn('retry'),/zatrzymana/);assert.equal(f.requests.length,1);
});
test('a pending tool cannot receive a user message as its execution result',async()=>{
 const f=client([native('list_commands',{}),plain('ready')]);await f.api.turn('start');
 await assert.rejects(()=>f.api.turn('pretend success',{userPrompt:true}),/rzeczywisty wynik/);assert.equal(f.requests.length,1);
 await f.api.turn('actual result');assert.equal(f.requests.length,2);
});
test('reused native call id is rejected',async()=>{
 const f=client([native('list_commands',{}),native('plazcode_command',{command:'execute_luau',params:{}},'call-1')]);await f.api.turn('start');await assert.rejects(()=>f.api.turn('result'),/tożsamość/);
});
test('all result text is retained without truncating the API transcript',async()=>{
 const f=client([native('list_commands',{}),plain('ready')]),value='Zażółć 🦊\n'.repeat(25000);await f.api.turn('start');await f.api.turn(value);
 assert.equal(f.requests[1].messages.at(-1).content,value);
});
function proxy(fetcher){let count=0;const c=vm.createContext({chrome:{runtime:{id:'fixture-extension',getURL:name=>'chrome-extension://fixture-extension/'+name,getPlatformInfo:callback=>callback({})}},fetch:async(...args)=>{count++;return fetcher(...args);},AbortController,TextDecoder,setTimeout,clearTimeout,setInterval,clearInterval});
 vm.runInContext(slice(backend,'const chatWaveRequests = new Map();','chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {')+'\nglobalThis.call=handleChatWaveApi;',c);
 const sender={id:'fixture-extension',url:'chrome-extension://fixture-extension/chatwave-api.html',tab:{id:10}};
 return {call:(message,who=sender)=>c.call({type:'chatwave-api',key,requestId:randomUUID(),...message},who),sender,count:()=>count};
}
test('proxy sends credentials only to fixed ChatWave API with redirects disabled',async()=>{
 let request;const f=proxy(async(url,options)=>{request={url,options};return new Response('{"data":[{"id":"fixture"}]}');});
 assert.equal((await f.call({action:'models'})).ok,true);assert.equal(request.url,'https://chat.thewave.cv/v1/models');
 assert.equal(request.options.headers.Authorization,'Bearer '+key);assert.equal(request.options.credentials,'omit');assert.equal(request.options.redirect,'error');
});
test('website content scripts cannot use the API proxy or its credentials',async()=>{
 const f=proxy(()=>{throw Error('must not fetch');});const result=await f.call({action:'models'},{...f.sender,url:'https://chat.thewave.cv/'});assert.equal(result.ok,false);assert.equal(f.count(),0);
});
for(const status of [400,401,403,429,500])test('HTTP '+status+' stops once without leaking response bodies or keys',async()=>{
 const f=proxy(async()=>new Response('secret='+key,{status}));const value=await f.call({action:'models'});assert.equal(value.ok,false);assert.match(value.error,new RegExp(String(status)));assert.ok(!JSON.stringify(value).includes(key));assert.equal(f.count(),1);
});
test('network uncertainty never retries and does not leak exception details',async()=>{
 const f=proxy(async()=>{throw Error('token '+key);});const result=await f.call({action:'models'});assert.equal(result.ok,false);assert.ok(!JSON.stringify(result).includes(key));assert.equal(f.count(),1);
});
test('completion proxy preserves the native function schema',async()=>{
 let body;const f=proxy(async(_url,options)=>{body=JSON.parse(options.body);return new Response(JSON.stringify(plain('hello')));});
 const input={model:'fixture',messages:[{role:'user',content:'hi'}],tools:[{type:'function',function:{name:'list_commands'}}],tool_choice:'auto'};
 const result=await f.call({action:'completion',body:input});assert.equal(result.ok,true);assert.deepEqual(body.tools,input.tools);assert.equal(body.stream,true);assert.equal(body.parallel_tool_calls,false);assert.ok(!JSON.stringify(body).includes(key));
});
test('cancel is bound to the originating extension tab and does not send another HTTP request',async()=>{
 let signal;const f=proxy(async(_url,options)=>{signal=options.signal;return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted'))));});
 const id=randomUUID(),pending=f.call({action:'models',requestId:id});await Promise.resolve();
 await f.call({action:'cancel',requestId:id},{...f.sender,tab:{id:11}});assert.equal(signal.aborted,false);
 await f.call({action:'cancel',requestId:id});assert.equal(signal.aborted,true);assert.equal((await pending).ok,false);assert.equal(f.count(),1);
});
function stream(events,split=5){const bytes=new TextEncoder().encode(events);return new Response(new ReadableStream({start(controller){for(let i=0;i<bytes.length;i+=split)controller.enqueue(bytes.slice(i,i+split));controller.close();}}),{headers:{'Content-Type':'text/event-stream'}});}
const frame=value=>'data: '+JSON.stringify(value)+'\n\n';
test('SSE assembles fragmented native arguments and Unicode without executing a partial call',async()=>{
 const args=JSON.stringify({command:'execute_luau',params:{code:'print("Zażółć 🦊")'}});
 const events=frame({choices:[{index:0,delta:{tool_calls:[{index:0,id:'call-stream',type:'function',function:{name:'plazcode_',arguments:args.slice(0,17)}}]}}]})+
  frame({choices:[{index:0,delta:{tool_calls:[{index:0,function:{name:'command',arguments:args.slice(17)}}]},finish_reason:'tool_calls'}]})+'data: [DONE]\n\n';
 const f=proxy(async()=>stream(events,3)),result=await f.call({action:'models'});
 assert.equal(result.ok,true);const call=result.data.choices[0].message.tool_calls[0];assert.equal(call.id,'call-stream');assert.equal(call.function.name,'plazcode_command');assert.equal(call.function.arguments,args);
});
test('SSE preserves final text while excluding reasoning fields',async()=>{
 const events=frame({choices:[{delta:{reasoning_content:'private reasoning',content:'Zażółć '}}]})+frame({choices:[{delta:{content:'🦊'},finish_reason:'stop'}]})+'data: [DONE]\n\n';
 const f=proxy(async()=>stream(events,2)),result=await f.call({action:'models'});assert.equal(result.ok,true);assert.equal(result.data.choices[0].message.content,'Zażółć 🦊');assert.ok(!JSON.stringify(result).includes('private reasoning'));
});
for(const issue of ['missing DONE','missing finish','invalid JSON','error frame'])test('incomplete or invalid SSE fails closed: '+issue,async()=>{
 let events=frame({choices:[{delta:{content:'hello'},finish_reason:issue==='missing finish'?null:'stop'}]});
 if(issue==='invalid JSON')events='data: {bad\n\n';
 if(issue==='error frame')events=frame({error:{message:key}});
 if(issue!=='missing DONE')events+='data: [DONE]\n\n';
 const f=proxy(async()=>stream(events)),result=await f.call({action:'models'});assert.equal(result.ok,false);assert.ok(!JSON.stringify(result).includes(key));assert.equal(f.count(),1);
});
test('SSE cannot return a completed-looking command before the stream finishes',async()=>{
 let controller;const body=new ReadableStream({start(value){controller=value;}}),encoder=new TextEncoder();
 const f=proxy(async()=>new Response(body,{headers:{'Content-Type':'text/event-stream'}}));let resolved=false;
 const pending=f.call({action:'models'}).then(value=>{resolved=true;return value;});
 controller.enqueue(encoder.encode(frame({choices:[{delta:{tool_calls:[{index:0,id:'call-1',type:'function',function:{name:'list_commands',arguments:'{}'}}]}}]})));
 await Promise.resolve();await Promise.resolve();assert.equal(resolved,false);
 controller.enqueue(encoder.encode(frame({choices:[{delta:{},finish_reason:'tool_calls'}]})+'data: [DONE]\n\n'));
 assert.equal((await pending).ok,true);assert.equal(f.count(),1);
});
async function page({response,bridgeError=false}={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'chatwave-api.html'),'utf8'),{url:'https://extension-fixture.invalid/chatwave-api.html',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();let clock=10000;
 const requests=[],messages=[],commands=[],banners=[],covers=[];
 Object.defineProperty(d,'hidden',{value:false});w.HTMLElement.prototype.getBoundingClientRect=function(){return {width:this.hidden?0:500,height:this.hidden?0:70,top:100,left:0,bottom:170,right:500};};
 w.Date.now=()=>clock;w.setTimeout=(fn,ms=0)=>{queueMicrotask(()=>{clock+=Math.max(1,ms);fn();});return 1;};
 w.chrome={runtime:{sendMessage(message,callback){messages.push(message);queueMicrotask(()=>{
  if(message.action==='models')callback({ok:true,data:{data:[{id:'fixture-model'}]}});
  else if(message.action==='cancel')callback({ok:true});
  else {requests.push(message.body);Promise.resolve(response?response(message,requests.length):{ok:true,data:requests.length===1?native('list_commands',{}):plain('PlazCode is ready.')}).then(callback);}
 });}}};
 for(const name of ['luau-knowledge','ultracode-deepseek','ultracode','chat-creators','config','clarification','parser','chatwave-api'])vm.runInContext(fs.readFileSync(path.join(root,'core',name+'.js'),'utf8'),c);
 vm.runInContext(fs.readFileSync(path.join(root,'providers/chatwave-api.js'),'utf8')+'\nwindow.P=RSProvider;',c);
 const P=w.P,A={startGen:0,sessionGen:1,started:false,toolList:[{name:'execute_luau',inputSchema:{type:'object',properties:{code:{type:'string'}},required:['code']}}]};
 const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
 d.querySelector('#apiKey').value=key;d.querySelector('#checkKey').click();await flush();assert.equal(d.querySelector('#apiKey').value,'');d.querySelector('#connect').click();await flush();
 w.__rsThinkingLevel=()=> 'default';w.__rsShowApproach=()=>false;w.__rsEngine=()=> 'roblox';
 Object.assign(w,{A,T:P.timings,bgMode:true,sleep:ms=>new Promise(r=>w.setTimeout(r,ms)),diag(){},log(){},RUN_CMD:'PlazCode',activeEngine:()=> 'roblox',personalMemoryContext:()=>'',
  ui:{getCustomPrompt:()=>'',setStarting(){},updateStartGate(){},inputCover:on=>covers.push(on),banner:(...args)=>banners.push(args),setStarted(){},toast(){},trackCard(){}},
  ensureTools:async()=>P.setToolList(A.toolList),submitAndGetBase:async text=>{const base=P.assistantCount();await P.typeAndSend(text);return base;},
  startupTurnIdentity:item=>P.itemKey(item),rememberStartupOutcome(){},rememberExecuted(){},decorate:{sweep(){},toolBox(){}},rememberSession(){},connectedAddonsNote:()=>'',feedbackIsError:value=>/^ERROR/.test(value),
  runTool:async call=>{commands.push(call.tool);return bridgeError?'ERROR: bridge offline':"Output of 'list_commands': execute_luau {code}";},
  SendAbortedError:class SendAbortedError extends Error{},
 });
 vm.runInContext(slice(main,'  function parseProviderToolCalls(','\n  // 1.24.10 helpers')+'\n'+slice(main,'    function systemPrompt() {','\n  // ── Periodic system-prompt')+'\n'+slice(main,'  function verifyResponseOwner(res) {','\n  const isContextInvalidated')+'\n'+slice(main,'  async function startSession(opts = {}) {','\n  const SVG =')+'\nwindow.startActual=startSession;',c);
 return {w,d,c,P,A,requests,messages,commands,banners,covers,flush,run:()=>w.startActual()};
}
test('actual startup links native function call, mocked bridge result and acknowledgement',async()=>{
 const f=await page();const ready=await f.run();assert.equal(ready.ready,true);assert.equal(f.A.started,true);assert.deepEqual(f.commands,['list_commands']);assert.equal(f.requests.length,2);
 assert.equal(f.requests[1].messages.at(-1).role,'tool');assert.equal(f.requests[1].messages.at(-1).tool_call_id,'call-1');assert.equal(f.P.commandText('',f.P.lastAssistant()),'');
 assert.equal(f.d.querySelector('#chat-input').readOnly,false);assert.equal(f.covers.at(-1),false);
});
test('plain-text JSON from the API cannot arm startup or run a quoted command',async()=>{
 const f=await page({response:()=>({ok:true,data:plain('{"command":"list_commands"}')})});assert.equal(await f.run(),undefined);assert.equal(f.A.started,false);assert.deepEqual(f.commands,[]);assert.equal(f.requests.length,1);assert.equal(f.d.querySelector('#chat-input').readOnly,false);
});
test('API rejection leaves startup stopped without a text-protocol fallback',async()=>{
 const f=await page({response:()=>({ok:false,error:'ChatWave API HTTP 400. Tools unsupported.'})});assert.equal(await f.run(),undefined);assert.equal(f.A.started,false);assert.deepEqual(f.commands,[]);assert.equal(f.requests.length,1);assert.equal(f.d.querySelector('#chat-input').readOnly,false);
});
test('failed real catalogue read cannot produce a false API connection',async()=>{
 const f=await page({bridgeError:true});assert.equal(await f.run(),undefined);assert.equal(f.A.started,false);assert.deepEqual(f.commands,['list_commands']);assert.equal(f.requests.length,1);assert.equal(f.d.querySelector('#chat-input').readOnly,false);
});
test('API key never appears in chat rows, model messages or local bridge inputs',async()=>{
 const f=await page();await f.run();assert.ok(!f.d.body.textContent.includes(key));assert.ok(f.requests.every(value=>!JSON.stringify(value).includes(key)));assert.ok(f.messages.every(value=>value.type==='chatwave-api'));assert.deepEqual(f.commands,['list_commands']);
});
test('page renders untrusted model HTML as text',async()=>{
 const f=await page({response:()=>({ok:true,data:plain('<img src=x onerror=alert(1)>')})});await f.run();assert.equal(f.d.querySelector('#chat img'),null);assert.match(f.P.itemText(f.P.lastAssistant()),/<img/);
});
test('native API page includes all script resources and existing command guards',()=>{
 const doc=new JSDOM(fs.readFileSync(path.join(root,'chatwave-api.html'),'utf8')).window.document;
 for(const element of doc.querySelectorAll('script[src],link[href]'))assert.ok(fs.existsSync(path.join(root,element.getAttribute('src')||element.getAttribute('href'))));
 const scripts=[...doc.scripts].map(el=>el.getAttribute('src'));assert.ok(scripts.indexOf('core/tool-guard.js')<scripts.indexOf('core/main.js'));assert.ok(scripts.includes('core/reliability.js'));assert.ok(scripts.includes('core/clarification.js'));
});
for(const valid of [true,false])test(valid?'actual task loop dispatches one native command and feeds its result to the matching API call':'actual task loop rejects invalid arguments before native command dispatch',async()=>{
 const f=await page({response:(_message,n)=>({ok:true,data:n===1?native('list_commands',{}):n===2?plain('PlazCode is ready.'):n===3?native('plazcode_command',{command:'execute_luau',params:valid?{code:'print(1)'}:{}},'call-task'):plain('Task complete.')})});
 assert.equal((await f.run()).ready,true);
 const w=f.w;
 vm.runInContext(fs.readFileSync(path.join(root,'core/tool-guard.js'),'utf8'),f.c);
 f.A.imageTools=new Set();f.A.toolNames=new Set(['execute_luau']);
 Object.assign(w,{
  reliabilitySettings:{},PlazCodeReliability:{createBudget:()=>({check:()=>null,consume(){},status:()=>({used:1})})},
  activity:{active:()=>({}),sync(){},step(){}},syncActivityItems(){},beginTaskCheckpoint:async()=>{},finishTaskCheckpoint:async()=>{},playSfx(){},markActivity(){},enhanceCreationBeforeTools:async()=>null,
  bareToolName:name=>name,argSummary:()=>'',callBody:call=>call.arguments?.code||'',asStateTag:()=>'',attachAutoDebug:async(_name,feedback)=>feedback,automaticVisualCheck:async(_call,feedback)=>feedback,
  compressToolFeedback:value=>value,stripOutputPrefix:value=>value,outSummary:value=>value,withSysResend:value=>value,prepareToolFeedback:value=>value,
  isCapabilityRefuse:()=>false,looksLikePasteScript:()=>false,planWantsImplementation:()=>false,
  cowork:{take:async()=>null,snapshot:()=>({pending:[]}),pause(){}},
  runTool:async call=>{f.commands.push(call.tool);assert.equal(call.tool,'execute_luau');return "Output of 'execute_luau':\n1";},
 });
 w.ui.showStop=()=>{};
 vm.runInContext(slice(main,'  class SendAbortedError extends Error {}','  // ── Anti-bot mitigation')+'\n'+slice(main,'  async function agentLoop(','\n  async function recoverCapabilitySession(')+'\nwindow.runActualLoop=agentLoop;',f.c);
 const base=f.P.assistantCount();f.A.sendToken=f.P.lastAssistantId();
 await f.P.typeAndSend('Print one in Studio',null,{userPrompt:true});
 await w.runActualLoop(base);
 assert.deepEqual(f.commands,valid?['list_commands','execute_luau']:['list_commands'],JSON.stringify(f.banners));
 assert.equal(f.requests.length,4);assert.equal(f.requests[3].messages.at(-1).role,'tool');assert.equal(f.requests[3].messages.at(-1).tool_call_id,'call-task');
 assert.match(f.requests[3].messages.at(-1).content,valid?/Output of 'execute_luau'/:/no command was executed/);assert.equal(f.P.itemText(f.P.lastAssistant()),'Task complete.');
 assert.equal(f.A.running,false);assert.equal(f.d.querySelector('#chat-input').readOnly,false);assert.deepEqual(f.banners,[]);
});
test('Stop ignores a native tool call that arrives late from the API',async()=>{
 let finish;const f=await page({response:()=>new Promise(resolve=>{finish=resolve;})});
 f.P.setToolList(f.A.toolList);await f.P.typeAndSend('start');await f.flush();assert.equal(f.P.isGenerating(),true);
 f.P.stopGeneration();finish({ok:true,data:native('list_commands',{})});await f.flush();
 assert.equal(f.P.assistantCount(),0);assert.equal(f.P.isGenerating(),false);assert.deepEqual(f.commands,[]);
});
