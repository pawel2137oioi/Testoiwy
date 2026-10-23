// Screenshot-derived prose and controlled Motif/Arcee/Copilot DOM/model/bridge responses.
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
const waiting='Czekam na wynik odczytu BuildSolarisHud, żeby potwierdzić, czy trzeba wyłączyć coś jeszcze poza skryptem HUD-u autobusu.';
const scriptRead={command:'script_read',params:{path:'Workspace.Solaris.BuildSolarisHud'}};
function section(start,end){const a=main.indexOf(start),b=main.indexOf(end,a);assert.ok(a>=0&&b>a,start);return main.slice(a,b);}
function fixture({initial={command:search},replies=[{text:done}],requestKind='task',ambiguous=false,replyDelay=0,remountPrevious=false,nativeIds=true,lateId=false,toolResults={},host='chat.motiftech.io',requestText='Usuń HUD z pojazdu Solaris w moim projekcie.',liveStatus={ok:true,roblox_connected:true},onProbe}={}){
  const dom=new JSDOM('<!doctype html><body><main id="thread" data-testid="document-message-list-wrapper"></main><div class="composer"><textarea id="chat-textarea"></textarea><button data-testid="document-send-button">Send</button></div>',{url:'https://'+host+'/chat/test',runScripts:'outside-only'});
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
  function user(text){const row=d.createElement('div');row.className='group justify-end';const bubble=d.createElement('div');bubble.className='bg-primary-50';if(host!=='chat.motiftech.io')bubble.dataset.role='user';bubble.dataset.messageId='user-'+(++seq);bubble.textContent=text;row.append(bubble);d.querySelector('#thread').append(row);return bubble;}
  function assistant(spec){
    const item=d.createElement('div');item.dataset.testid='document-model-answer-content';if(host!=='chat.motiftech.io')item.dataset.role='assistant';if(nativeIds)item.dataset.messageId='assistant-'+(++seq);
    function body(){const b=d.createElement('div');b.className='prose';item.append(b);return b;}
    const first=body();if(spec.text){const p=d.createElement('p');p.textContent=spec.text;first.append(p);}
    if(spec.command){const pre=d.createElement('pre'),code=d.createElement('code');code.textContent=JSON.stringify(spec.command);pre.append(code);(spec.sections?body():first).append(pre);}
    if(spec.after){const p=d.createElement('p');p.textContent=spec.after;(spec.sections?body():first).append(p);}
    d.querySelector('#thread').append(item);return item;
  }
  user(requestText);assistant(initial);d.querySelector('button').setAttribute('aria-label','Send');
  const A={sessionGen:1,sendToken:'previous',stop:false,starting:false,running:false,started:true,imageTools:new Set(),toolList:[],toolNames:new Set(['search_game_tree','get_studio_state','script_read','inspect_instance']),taskRequest:requestText,requestKind};
  const noop=()=>{};
  Object.assign(w,{A,T:P.timings,bgMode:true,diag:(...args)=>events.push(args),log:noop,sleep:async ms=>{advance(ms);},
    bg:async()=>{if(onProbe)onProbe({w,P,A});return liveStatus;},
    ui:{banner:(...args)=>banners.push(args),showStop:noop,inputCover:noop,trackCard:noop,captureHandoff:noop,toast:noop,setStatus:noop},
    cowork:{snapshot:()=>({enabled:false,pending:[],paused:false,sending:false}),take:async()=>null,pause:noop},
    activity:{active:()=>({}),step:noop,sync:noop},syncActivityItems:noop,markActivity:noop,rememberExecuted:noop,
    PlazCodeReliability:{createBudget:()=>({check:()=>toolBudget>=8?'Test fixture command limit':null,consume:()=>toolBudget++,status:()=>({used:toolBudget})})},reliabilitySettings:{},
    beginTaskCheckpoint:async()=>{},finishTaskCheckpoint:async complete=>{checkpoints.push(complete);},playSfx:noop,
    enhanceCreationBeforeTools:async()=>null,checkProviderRateLimit:noop,bareToolName:n=>n,activeEngine:()=> 'roblox',
    decorate:{toolBox:noop},asStateTag:()=>'',attachAutoDebug:async(_name,text)=>text,automaticVisualCheck:async(_call,text)=>text,
    compressToolFeedback:text=>text,prepareToolFeedback:text=>text,withSysResend:text=>text,
    runTool:async call=>{commands.push(JSON.parse(JSON.stringify(call)));return toolResults[call.tool]??("Output of '"+call.tool+"':\n"+JSON.stringify({fullPath:'Workspace.Solaris',result:'actual fixture result'}));},
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
for(const text of [waiting,"I'm waiting for the tool result before continuing.",'Waiting for the result of reading BuildSolarisHud before making another change.']){
  test('waiting for an already returned result resumes with the actual feedback: '+text.slice(0,45),async t=>{
    const result="Output of 'script_read':\nlocal HUD_NAME = 'BuildSolarisHud'\nreturn HUD_NAME";
    const f=fixture({initial:{command:scriptRead},toolResults:{script_read:result},replies:[{text},{command:next},{text:done}]});t.after(()=>f.dom.window.close());
    await f.run();clean(f);assert.deepEqual(f.commands.map(c=>c.tool),['script_read','get_studio_state']);assert.equal(f.clicks(),3);
    assert.ok(f.sent[1].includes(result),'resend the real result, not a fabricated success');
    assert.match(f.sent[1],/no new tool command|no command.*pending/i);assert.equal(f.checkpoints.at(-1),true);
  });
}
test('screenshot sequence can recover an earlier read result after inspect_instance and get_studio_state',async t=>{
  const result="Output of 'script_read':\n-- BuildSolarisHud: source returned before the state check\nreturn 'verified source'";
  const inspect={command:'inspect_instance',params:{path:'Workspace.Solaris'}};
  const f=fixture({initial:{command:scriptRead},toolResults:{script_read:result},replies:[{command:inspect},{command:next},{text:waiting},{command:search},{text:done}]});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.deepEqual(f.commands.map(c=>c.tool),['script_read','inspect_instance','get_studio_state','search_game_tree']);
  assert.equal(f.clicks(),5);assert.ok(f.sent[3].includes(result));assert.match(f.sent[3],/Output of 'inspect_instance'/);assert.match(f.sent[3],/Output of 'get_studio_state'/);
});
test('the waiting-recovery budget resets after real tool progress',async t=>{
  const f=fixture({replies:[{text:waiting},{command:scriptRead},{text:waiting},{command:next},{text:waiting},{command:search},{text:done}]});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.equal(f.commands.length,4);assert.equal(f.clicks(),7);assert.equal(f.checkpoints.at(-1),true);assert.deepEqual(f.banners,[]);
});
test('repeated waiting without a new command pauses after two attempts without replay',async t=>{
  const f=fixture({replies:[{text:waiting},{text:waiting},{text:waiting}]});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.equal(f.commands.length,1);assert.equal(f.clicks(),3);assert.equal(f.checkpoints.at(-1),false);
  assert.ok(f.banners.some(row=>row[1]==='AI stopped before the next command'));
});
for(const text of ['Czekam na wynik odczytu, który musisz mi przesłać.','Czekam na wynik odczytu od Ciebie.','Waiting for your tool result before continuing.','I am waiting for the read result from you.','Zadanie ukończone. Czekam na wynik kolejnego testu.']){
  test('waiting for user input or an explicit final answer is not tool-result recovery: '+text.slice(0,55),async t=>{
    const f=fixture({replies:[{text}]});t.after(()=>f.dom.window.close());await f.run();clean(f);assert.equal(f.commands.length,1);assert.equal(f.clicks(),1);
  });
}
test('waiting before any tool result does not invent a returned result',async t=>{
  const f=fixture({initial:{text:waiting}});t.after(()=>f.dom.window.close());await f.run();clean(f);assert.equal(f.commands.length,0);assert.equal(f.clicks(),0);
});
test('an uncertain tool failure is not automatically recovered as a successful result',async t=>{
  const f=fixture({toolResults:{search_game_tree:"ERROR: command timed out; it may already have run."},replies:[{text:waiting}]});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.equal(f.commands.length,1);assert.equal(f.clicks(),1);
});
test('Stop prevents waiting-for-result recovery',async t=>{
  const f=fixture({replies:[{text:waiting}]});t.after(()=>f.dom.window.close());
  const read=f.w.waitForResponse;f.w.waitForResponse=async base=>{const result=await read(base);if(result.kind==='text')f.A.stop=true;return result;};
  await f.run();clean(f);assert.equal(f.commands.length,1);assert.equal(f.clicks(),1);
});
test('waiting-recovery includes only the last three confirmed tool results',async t=>{
  const inspect={command:'inspect_instance',params:{path:'Workspace.Solaris'}};
  const f=fixture({toolResults:{search_game_tree:"Output of 'search_game_tree':\nOLD_RESULT_OUTSIDE_RECOVERY_WINDOW"},replies:[{command:scriptRead},{command:inspect},{command:next},{text:waiting},{command:scriptRead},{text:done}]});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.equal(f.commands.length,5);assert.equal(f.clicks(),6);
  assert.doesNotMatch(f.sent[4],/OLD_RESULT_OUTSIDE_RECOVERY_WINDOW/);assert.match(f.sent[4],/Output of 'script_read'/);assert.match(f.sent[4],/Output of 'inspect_instance'/);assert.match(f.sent[4],/Output of 'get_studio_state'/);
});
test('a queued new task cannot receive recovery results or tool progress from the completed task',async t=>{
  const f=fixture();t.after(()=>f.dom.window.close());let queued=false;
  f.w.cowork.take=async()=>{if(queued)return null;queued=true;f.A.taskRequest='Sprawdź inny pojazd.';const base=f.P.assistantCount();f.assistant({text:waiting});return {base};};
  await f.run();clean(f);assert.equal(f.commands.length,1);assert.equal(f.clicks(),1);
});
test('an inline code tool name survives waiting-result classification',t=>{
  const f=fixture();t.after(()=>f.dom.window.close());const item=f.assistant({text:'Czekam na wynik '});
  const p=item.querySelector('p'),code=f.d.createElement('code');code.textContent='script_read';p.append(code,'.');
  assert.equal(f.P.needsToolContinuation(f.P.itemText(item),item),true);
});

// Actual normal-reply loop for the two strict adapters, using screenshot prose.
const arceeDeferred='Jeszcze nie widzę struktury studia ani plików, ponieważ nie wykonałem żadnych poleceń inspekcji. Aby zacząć przeglądać zawartość, musisz mi dać konkretne polecenie — na przykład list_commands lub inspect_instance. Daj znać, co chciałbyś zrobić.';
for(const host of ['platform.arcee.ai','copilot.com'])test(host+': an explicit Studio read question gets one read reminder and an actual result',async t=>{
  const f=fixture({host,requestText:'Czy na studio widzisz Solaris II GOTOWY 111 TEST?',initial:{text:arceeDeferred},replies:[{command:search},{text:'Znalazłem Workspace.Solaris w zwróconym wyniku.'}]});t.after(()=>f.dom.window.close());
  await f.run();clean(f);assert.deepEqual(f.commands.map(c=>c.tool),['search_game_tree']);assert.equal(f.sent.length,2);assert.match(f.sent[0],/read-only inspection/);assert.match(f.sent[1],/actual fixture result/);assert.equal(f.checkpoints.at(-1),true);assert.equal(f.events.filter(e=>e[0]==='loop.projectReadReminder').length,1);
});
test('Arcee: repeated deferral pauses after one reminder and never marks the read complete',async t=>{
  const f=fixture({host:'platform.arcee.ai',requestText:'Widzisz na studio coś?',initial:{text:arceeDeferred},replies:[{text:arceeDeferred}]});t.after(()=>f.dom.window.close());await f.run();clean(f);assert.equal(f.sent.length,1);assert.equal(f.commands.length,0);assert.equal(f.checkpoints.at(-1),false);assert.ok(f.banners.some(row=>row[1]==='AI did not inspect the project'));
});
for(const requestText of ['Cześć','Explain how Studio files work','Teoretycznie czy widzisz pliki na studio?','Czy widzisz pliki w Studio? Nie używaj narzędzi.','Usuń model z projektu Studio'])test('Arcee: unrelated, hypothetical, forbidden or editing request gets no read reminder: '+requestText,async t=>{
 const f=fixture({host:'platform.arcee.ai',requestText,initial:{text:arceeDeferred}});t.after(()=>f.dom.window.close());await f.run();clean(f);assert.equal(f.sent.length,0);assert.equal(f.commands.length,0);
});
for(const liveStatus of [{ok:true,roblox_connected:false},{ok:false}])test('Arcee: disconnected bridge does not get a claim of live inspection '+JSON.stringify(liveStatus),async t=>{
 const f=fixture({host:'platform.arcee.ai',requestText:'Widzisz pliki na studio?',initial:{text:arceeDeferred},liveStatus});t.after(()=>f.dom.window.close());await f.run();clean(f);assert.equal(f.sent.length,0);assert.equal(f.commands.length,0);
});
for(const action of ['stop','chat','generation'])test('Arcee: '+action+' during the live check prevents the read reminder',async t=>{
 const f=fixture({host:'platform.arcee.ai',requestText:'Widzisz pliki na studio?',initial:{text:arceeDeferred},onProbe:({w,A})=>{if(action==='stop')A.stop=true;else if(action==='generation')A.sessionGen++;else w.history.pushState({},'','/chat/other');}});t.after(()=>f.dom.window.close());await f.run();clean(f);assert.equal(f.sent.length,0);assert.equal(f.commands.length,0);
});
test('Arcee: an explicit refusal still stops without a read reminder',async t=>{
 const f=fixture({host:'platform.arcee.ai',requestText:'Widzisz pliki w Studio?',initial:{text:'Nie wykonam tego polecenia. Mogę sprawdzić dokumentację.'}});t.after(()=>f.dom.window.close());await f.run();clean(f);assert.equal(f.sent.length,0);assert.equal(f.commands.length,0);
});
test('Arcee: a completed read answer does not cause another inspection',async t=>{
 const f=fixture({host:'platform.arcee.ai',requestText:'Widzisz pliki w Studio?',initial:{text:'Wynik wcześniejszej inspekcji zawiera Workspace.Solaris.'}});t.after(()=>f.dom.window.close());await f.run();clean(f);assert.equal(f.sent.length,0);assert.equal(f.commands.length,0);
});
test('Arcee: a question for an ambiguous target waits for the user',async t=>{
 const f=fixture({host:'platform.arcee.ai',requestText:'Sprawdź plik w Studio.',initial:{text:'Który plik mam odczytać? Mogę sprawdzić wskazany skrypt.'}});t.after(()=>f.dom.window.close());await f.run();clean(f);assert.equal(f.sent.length,0);assert.equal(f.commands.length,0);
});
test('Arcee: a write after the read reminder is blocked before dispatch',async t=>{
 const f=fixture({host:'platform.arcee.ai',requestText:'Widzisz pliki w Studio?',initial:{text:arceeDeferred},replies:[{command:{command:'execute_luau',params:{code:'workspace:ClearAllChildren()'}}}]});t.after(()=>f.dom.window.close());f.A.toolNames.add('execute_luau');await f.run();clean(f);assert.equal(f.sent.length,1);assert.equal(f.commands.length,0);assert.equal(f.checkpoints.at(-1),false);assert.ok(f.banners.some(row=>row[1]==='Inspection stopped before a change'));
});
test('Arcee: the read reminder can fetch real schemas before inspecting the target',async t=>{
 const f=fixture({host:'platform.arcee.ai',requestText:'Czy na studio widzisz Solaris?',initial:{text:arceeDeferred},replies:[{command:{command:'list_commands',params:{}}},{command:{command:'inspect_instance',params:{path:'Workspace.Solaris'}}},{text:'Tak, odczytany obiekt ma ścieżkę Workspace.Solaris.'}]});t.after(()=>f.dom.window.close());f.A.toolNames.add('list_commands');await f.run();clean(f);assert.deepEqual(f.commands.map(c=>c.tool),['list_commands','inspect_instance']);assert.equal(f.sent.length,3);assert.match(f.sent[1],/Output of 'list_commands'/);assert.match(f.sent[2],/Output of 'inspect_instance'/);assert.equal(f.events.filter(e=>e[0]==='loop.projectReadReminder').length,1);
});
