// Screenshot-derived prose and controlled Motif DOM/model/bridge responses.
// Executes the real adapter, parser, response watcher and agent loop.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),sourceRoot=process.env.PLAZCODE_MOTIF_ROOT||root;
const main=fs.readFileSync(path.join(sourceRoot,'core/main.js'),'utf8');
const correction='Nie musisz nic naprawiać — wcześniej PlazCode zwrócił listę poleceń i zgłosił połączenie ze Studio. To ja błędnie stwierdziłem, że nie mam dostępu. Wysłałem polecenie, żeby odnaleźć pojazd w projekcie; po wyniku zlokalizuję jego HUD.';
const promise='Zacznę od odnalezienia pojazdu w drzewie projektu; zanim usunę HUD, sprawdzę dokładnie, który element do niego należy.';
const search={command:'search_game_tree',params:{datamodel_type:'Edit',keywords:'Solaris II GOTOWY 111111',max_depth:6}};
const next={command:'get_studio_state',params:{}};
const done='Gotowe. Sprawdziłem stan projektu i zakończyłem zadanie.';
function section(start,end){const a=main.indexOf(start),b=main.indexOf(end,a);assert.ok(a>=0&&b>a,start);return main.slice(a,b);}
function fixture({initial={command:search},replies=[{text:done}],requestKind='task',ambiguous=false,replyDelay=0,remountPrevious=false,nativeIds=true,lateId=false}={}){
  const dom=new JSDOM('<!doctype html><body><main id="thread" data-testid="document-message-list-wrapper"></main><div class="composer"><textarea id="chat-textarea"></textarea><button data-testid="document-send-button">Send</button></div>',{url:'https://chat.motiftech.io/chat/test',runScripts:'outside-only'});
  const w=dom.window,d=w.document,c=dom.getInternalVMContext();let clock=10000,seq=0,replyIndex=0,clicks=0,toolBudget=0;
  const sent=[],commands=[],banners=[],events=[],checkpoints=[],scheduled=[];
  function advance(ms){clock+=ms;while(scheduled.length && scheduled[0].at<=clock)assistant(scheduled.shift().reply);}
  w.Date.now=()=>clock;
  w.HTMLElement.prototype.getBoundingClientRect=()=>({width:500,height:80,top:10,bottom:90,left:0,right:500});
  Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return d.body;}});
  Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;}});
  Object.defineProperty(d,'hidden',{value:false,configurable:true});
  w.setTimeout=(fn,ms=0)=>{queueMicrotask(()=>{advance(Math.max(ms,1));fn();});return ++seq;};
  vm.runInContext(fs.readFileSync(path.join(sourceRoot,'core/parser.js'),'utf8')+';window.parser=RSParse;',c);
  vm.runInContext(fs.readFileSync(path.join(sourceRoot,'providers/webchats.js'),'utf8')+';window.P=RSProvider;',c);
  vm.runInContext(fs.readFileSync(path.join(root,'core/config.js'),'utf8'),c);
  vm.runInContext(fs.readFileSync(path.join(sourceRoot,'core/tool-guard.js'),'utf8'),c);
  const P=w.P;
  function user(text){const row=d.createElement('div');row.className='group justify-end';const bubble=d.createElement('div');bubble.className='bg-primary-50';bubble.dataset.messageId='user-'+(++seq);bubble.textContent=text;row.append(bubble);d.querySelector('#thread').append(row);return bubble;}
  function assistant(spec){
    const item=d.createElement('div');item.dataset.testid='document-model-answer-content';if(nativeIds)item.dataset.messageId='assistant-'+(++seq);
    function body(){const b=d.createElement('div');b.className='prose';item.append(b);return b;}
    const first=body();if(spec.text){const p=d.createElement('p');p.textContent=spec.text;first.append(p);}
    if(spec.command){const pre=d.createElement('pre'),code=d.createElement('code');code.textContent=JSON.stringify(spec.command);pre.append(code);(spec.sections?body():first).append(pre);}
    if(spec.after){const p=d.createElement('p');p.textContent=spec.after;(spec.sections?body():first).append(p);}
    d.querySelector('#thread').append(item);return item;
  }
  user('Usuń HUD z pojazdu Solaris w moim projekcie.');assistant(initial);
  const A={sessionGen:1,sendToken:'previous',stop:false,starting:false,running:false,started:true,imageTools:new Set(),toolList:[],toolNames:new Set(['search_game_tree','get_studio_state']),taskRequest:'Usuń HUD z pojazdu Solaris w moim projekcie.',requestKind};
  const noop=()=>{};
  Object.assign(w,{A,T:P.timings,bgMode:true,diag:(...args)=>events.push(args),log:noop,sleep:async ms=>{advance(ms);},
    ui:{banner:(...args)=>banners.push(args),showStop:noop,inputCover:noop,trackCard:noop,captureHandoff:noop,toast:noop,setStatus:noop},
    cowork:{snapshot:()=>({enabled:false,pending:[],paused:false,sending:false}),take:async()=>null,pause:noop},
    activity:{active:()=>({}),step:noop,sync:noop},syncActivityItems:noop,markActivity:noop,rememberExecuted:noop,
    PlazCodeReliability:{createBudget:()=>({check:()=>toolBudget>=8?'Test fixture command limit':null,consume:()=>toolBudget++,status:()=>({used:toolBudget})})},reliabilitySettings:{},
    beginTaskCheckpoint:async()=>{},finishTaskCheckpoint:async complete=>{checkpoints.push(complete);},playSfx:noop,
    enhanceCreationBeforeTools:async()=>null,checkProviderRateLimit:noop,bareToolName:n=>n,activeEngine:()=> 'roblox',
    decorate:{toolBox:noop},asStateTag:()=>'',attachAutoDebug:async(_name,text)=>text,automaticVisualCheck:async(_call,text)=>text,
    compressToolFeedback:text=>text,prepareToolFeedback:text=>text,withSysResend:text=>text,
    runTool:async call=>{commands.push(JSON.parse(JSON.stringify(call)));return "Output of '"+call.tool+"':\n"+JSON.stringify({fullPath:'Workspace.Solaris',result:'actual fixture result'});},
    SendAbortedError:class SendAbortedError extends Error{},
    submitAndGetBase:async text=>{
      const base=P.assistantCount();A.sendToken=P.lastAssistantId();A.detectedTool=null;
      await P.typeAndSend(text);return base;
    },
  });
  d.querySelector('button').addEventListener('click',()=>{
    clicks++;const text=P.editorText();sent.push(text);
    if(ambiguous)return;
    if(remountPrevious){const previous=P.lastAssistant(),replacement=previous.cloneNode(true);if(lateId)replacement.dataset.messageId='late-previous-id';previous.replaceWith(replacement);}
    user(text);P.getEditor().value='';
    const reply=replies[replyIndex++];if(reply){if(replyDelay)scheduled.push({at:clock+replyDelay,reply});else assistant(reply);}
  });
  vm.runInContext(section('  function argSummary(call) {','  function parseProviderToolCalls(')+section('  function parseProviderToolCalls(','\n  // 1.24.10 helpers')+'\n'+section('  const STUDIO_ACCESS_REMINDER =','  const activity =')+'\n'+section('  function verifyResponseOwner(res) {','\n  const isContextInvalidated')+'\n'+section('  async function agentLoop(','\n  async function recoverCapabilitySession(')+'\nwindow.loop=agentLoop;window.read=waitForResponse;',c);
  return{dom,w,d,P,A,sent,commands,banners,events,checkpoints,assistant,clicks:()=>clicks,run:()=>w.loop(0)};
}
function clean(f){assert.ok(!f.banners.some(row=>row[1]==='Internal loop error'),JSON.stringify(f.banners));assert.equal(f.A.running,false);assert.equal(f.P.getEditor().readOnly,false);}
for(const text of [correction,'I incorrectly said I cannot access Studio. I will inspect the project using the bridge now.','I was wrong when I said I cannot run commands in Studio. I will inspect the project now.']){
  test('a retracted access claim does not block the actual command: '+text.slice(0,50),async t=>{
    const f=fixture({initial:{text,command:search}});t.after(()=>f.dom.window.close());
    assert.equal(f.P.isPolicyRefusal(text),false);
    await f.run();clean(f);assert.deepEqual(f.commands.map(c=>c.tool),['search_game_tree']);
    assert.equal(f.sent.length,1);assert.match(f.sent[0],/actual fixture result/);
  });
}
for(const text of ['Nie mam dostępu do Studio i nie wykonam poleceń.','I cannot run commands through the PlazCode bridge.','Błędnie stwierdziłem, że nie mam dostępu do Studio. Jednak nie wykonam tego polecenia.','I incorrectly said I cannot access Studio, but I will not run this command.']){
  test('a current refusal still stops without command execution: '+text.slice(0,65),async t=>{
    const f=fixture({initial:{text,command:search}});t.after(()=>f.dom.window.close());
    assert.equal(f.P.isPolicyRefusal(text),true);await f.run();clean(f);
    assert.equal(f.commands.length,0);assert.equal(f.sent.length,0);
  });
}
test('all sibling Motif prose sections reach the response watcher and the tool executes once',async t=>{
  const f=fixture({initial:{text:'Sprawdzę drzewo projektu.',command:search,after:'Po wyniku odczytam stan.',sections:true}});t.after(()=>f.dom.window.close());
  const read=f.P.readAssistant();assert.match(read.reply,/search_game_tree/);assert.match(read.reply,/Po wyniku/);
  await f.run();clean(f);assert.deepEqual(f.commands.map(c=>c.tool),['search_game_tree']);assert.equal(f.clicks(),1);
});
test('a later prose section containing a current refusal cannot be bypassed by an earlier command',async t=>{
  const f=fixture({initial:{text:'Znam format.',command:search,after:'Nie wykonam tego polecenia.',sections:true}});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.equal(f.commands.length,0);assert.equal(f.sent.length,0);
});
for(const text of [promise,'I will now inspect the vehicle and read its HUD properties.']){
  test('result delivery → promise-only reply → one continuation → next command: '+text.slice(0,35),async t=>{
    const f=fixture({replies:[{text},{command:next},{text:done}]});t.after(()=>f.dom.window.close());
    await f.run();clean(f);assert.deepEqual(f.commands.map(c=>c.tool),['search_game_tree','get_studio_state']);
    assert.equal(f.clicks(),3);assert.match(f.sent[0],/Output of 'search_game_tree'/);assert.match(f.sent[2],/Output of 'get_studio_state'/);
    assert.equal(f.events.filter(e=>e[0]==='loop.toolContinue').length,1);assert.equal(f.checkpoints.at(-1),true);
  });
}
for(const text of [done,'Który HUD mam usunąć? Potrzebuję nazwy elementu.','Czekam na Twoje potwierdzenie, zanim usunę HUD.','I cannot run commands through the bridge.','Nie usunąłem HUD. Potrzebuję Twojej odpowiedzi, który wybrać.']){
  test('a final answer, question or refusal after a result does not trigger a continuation: '+text.slice(0,40),async t=>{
    const f=fixture({replies:[{text}]});t.after(()=>f.dom.window.close());await f.run();clean(f);
    assert.deepEqual(f.commands.map(c=>c.tool),['search_game_tree']);assert.equal(f.clicks(),1);
  });
}
test('repeated promises stop after two continuations and leave the task incomplete',async t=>{
  const f=fixture({replies:[{text:promise},{text:promise},{text:promise}]});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.equal(f.commands.length,1);assert.equal(f.clicks(),3);
  assert.equal(f.checkpoints.at(-1),false);assert.ok(f.banners.some(row=>row[1]==='AI stopped before the next command'));
});
test('a quick request does not acquire automatic project continuation',async t=>{
  const f=fixture({requestKind:'quick',replies:[{text:promise}]});t.after(()=>f.dom.window.close());await f.run();clean(f);
  assert.equal(f.commands.length,1);assert.equal(f.clicks(),1);
});
test('a promise before any tool ran does not cause an automatic send',async t=>{
  const f=fixture({initial:{text:promise}});t.after(()=>f.dom.window.close());await f.run();clean(f);
  assert.equal(f.commands.length,0);assert.equal(f.clicks(),0);
});
test('uncertain result delivery never retries the tool or clicks Send twice',async t=>{
  const f=fixture({ambiguous:true});t.after(()=>f.dom.window.close());await f.run();
  assert.equal(f.A.running,false);assert.equal(f.P.getEditor().readOnly,false);
  assert.equal(f.commands.length,1);assert.equal(f.clicks(),1);
});
test('Stop after a tool result prevents a promise-only continuation',async t=>{
  const f=fixture({replies:[{text:promise}]});t.after(()=>f.dom.window.close());
  const read=f.w.waitForResponse;f.w.waitForResponse=async base=>{const result=await read(base);if(result.kind==='text')f.A.stop=true;return result;};
  await f.run();clean(f);assert.equal(f.commands.length,1);assert.equal(f.clicks(),1);
});
for(const nativeIds of [false,true])test('old reply remount while the next answer loads cannot replay or pause the command; native IDs='+nativeIds,async t=>{
  const f=fixture({replyDelay:5000,remountPrevious:true,nativeIds});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.deepEqual(f.commands.map(c=>c.tool),['search_game_tree']);assert.equal(f.clicks(),1);
  assert.deepEqual(f.banners,[]);assert.equal(f.checkpoints.at(-1),true);
});
test('a late native ID on the old answer does not prove a fresh response',async t=>{
  const f=fixture({replyDelay:5000,remountPrevious:true,nativeIds:false,lateId:true});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.equal(f.commands.length,1);assert.equal(f.clicks(),1);assert.equal(f.checkpoints.at(-1),true);
});
test('a dropped next answer is retried once as text, never by replaying the completed tool',async t=>{
  const f=fixture({replies:[],remountPrevious:true,nativeIds:false});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.equal(f.commands.length,1);assert.equal(f.clicks(),2);assert.equal(f.checkpoints.at(-1),false);
  assert.ok(f.banners.some(row=>row[1]==='Could not read Motif’s reply'));
});
