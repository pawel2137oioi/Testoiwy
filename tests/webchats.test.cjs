// SPDX-License-Identifier: GPL-3.0-or-later
// DOM integration fixtures based on live public pages observed 2026-10-21.
// Tencent markup includes the signed-in final and reasoning containers. These
// fixtures do not claim live extension/bridge or native Studio coverage.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'providers/webchats.js'), 'utf8');
const hosts = {motif:'chat.motiftech.io',chatwave:'chat.thewave.cv',tencent:'aistudio.tencent.ai'};
function fixture(id, options={}) {
  const markup = {
    motif:'<div class="composer"><textarea id="chat-textarea"></textarea><button data-testid="document-send-button">Send</button><button aria-label="Stop" hidden>Stop</button></div>',
    chatwave:'<div id="inputIsland"><form id="cbForm"><textarea id="chatInput" maxlength="16000"></textarea><button type="button" id="sendBtn" aria-label="Voice input">Send</button></form></div><div id="chatThread" role="log"></div>',
    tencent:'<div class="hy-chat-input"><textarea class="t-textarea__inner"></textarea><div class="hy-chat-input-send-btn">Send</div><button class="hy-chat-input-stop-btn" hidden>Stop</button></div>',
  };
  const dom = new JSDOM('<!doctype html><body>'+markup[id]+'</body>',{url:'https://'+hosts[id]+'/',runScripts:'outside-only'});
  const w=dom.window, d=w.document; let clock=10000,clicks=0,stops=0;
  w.HTMLElement.prototype.getBoundingClientRect=function(){return {width:this.hidden?0:500,height:this.hidden?0:70,top:100,left:0,bottom:170,right:500};};
  w.Date.now=()=>clock;
  w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};
  vm.runInContext(source+'\nwindow.P=RSProvider;',dom.getInternalVMContext());
  const P=w.P, ed=P.getEditor(), send=d.querySelector(id==='motif'?'[data-testid="document-send-button"]':id==='chatwave'?'#sendBtn':'.hy-chat-input-send-btn');
  function add(role,text,html=false) {
    const row=d.createElement('div');
    if(id==='motif') {
      if(role==='user')row.innerHTML='<div class="group justify-end"><div class="bg-primary-50"><div class="whitespace-pre-wrap"></div></div></div>';
      else row.innerHTML='<div data-testid="document-model-answer-content"><div class="prose"></div><button>Copy</button></div>';
    } else if(id==='chatwave') {
      row.className='msg-row '+(role==='user'?'user':'ai');row.dataset.mid='mid-'+(d.querySelectorAll('[data-mid]').length+1);
      row.innerHTML='<div class="msg-bubble"><div class="msg-body"></div></div><div class="msg-actions"><button>Copy</button></div>';
    } else {row.className='agent-chat__list__item agent-chat__list__item--'+(role==='user'?'human':'ai');row.innerHTML='<div class="agent-chat__bubble__content"><div class="hyc-content-md"></div></div>';}
    const content=row.querySelector('.whitespace-pre-wrap,.prose,.msg-body,.hyc-content-md');
    if(html)content.innerHTML=text;else content.textContent=text;
    (d.querySelector('#chatThread')||d.body).appendChild(row);
    return P.allItems().at(-1);
  }
  ed.addEventListener('input',()=>{
    if(id==='chatwave')send.setAttribute('aria-label',ed.value?'Send message':'Voice input');
    options.onInput?.({w,d,ed,send});
  });
  send.addEventListener('click',()=>{
    clicks++;
    if(options.onSend)return options.onSend({w,d,ed,send,add});
    add('user',ed.value);ed.value='';
    if(id==='chatwave')send.setAttribute('aria-label','Voice input');
  });
  const stop=d.querySelector('[aria-label="Stop"],.hy-chat-input-stop-btn');
  stop?.addEventListener('click',()=>{stops++;stop.hidden=true;});
  return {dom,w,d,P,ed,send,add,stop,clicks:()=>clicks,stops:()=>stops,advance:ms=>clock+=ms};
}
for(const id of Object.keys(hosts)) {
  test(id+': finds composer and sends complete multiline content once',async()=>{
    const f=fixture(id);assert.equal(f.P.id,id);assert.equal(f.P.chatIsEmpty(),true);
    const value='⟦RS-SYS⟧\n```json\n{"command":"list_commands","params":{}}\n```\nZażółć gęślą 🦊';
    assert.equal(await f.P.typeAndSend(value),true);assert.equal(f.clicks(),1);
    assert.equal(f.P.userCount(),1);assert.equal(f.P.assistantCount(),0);
    assert.equal(f.P.itemText(f.P.allItems()[0]),value);assert.equal(f.ed.value,'');
  });
  test(id+': reads assistant code verbatim and excludes user, controls and chips',()=>{
    const f=fixture(id);f.add('user','{"command":"dangerous_user_text"}');
    const row=f.add('assistant','<pre><code>{"command":"list_commands","params":{}}</code></pre><button>Copy</button><span class="rs-chip">Hidden decoration</span>',true);
    assert.equal(f.P.assistantCount(),1);assert.equal(f.P.userCount(),1);
    assert.equal(f.P.readAssistant().reply,'{"command":"list_commands","params":{}}');
    assert.equal(f.P.lastAssistant(),row);assert.equal(f.P.isAssistantItem(f.P.allItems()[0]),false);
    const key=f.P.lastAssistantId();row.classList.add('rs-cmd-mask');assert.equal(f.P.lastAssistantId(),key);
    assert.ok(f.P.findToolBlockSpot(row));assert.equal(f.P.readAssistant().reply,'{"command":"list_commands","params":{}}');
  });
  test(id+': existing draft is preserved',async()=>{
    const f=fixture(id);f.ed.value='My unfinished draft';
    await assert.rejects(()=>f.P.typeAndSend('internal'),/draft/);assert.equal(f.ed.value,'My unfinished draft');assert.equal(f.clicks(),0);
  });
  test(id+': rejects unsupported images before changing composer',async()=>{
    const f=fixture(id);await assert.rejects(()=>f.P.typeAndSend('look',[{data:'AAAA'}]),/image delivery/);assert.equal(f.clicks(),0);assert.equal(f.ed.value,'');
  });
  test(id+': uncertain submission throws and never re-clicks',async()=>{
    const f=fixture(id,{onSend(){}});await assert.rejects(()=>f.P.typeAndSend('test'),/not confirmed/);assert.equal(f.clicks(),1);assert.equal(f.P.sendFailureAmbiguous(),true);assert.equal(f.P.sendRetryable(),false);
  });
  test(id+': clearing the editor alone does not confirm submission',async()=>{
    const f=fixture(id,{onSend({ed}){ed.value='';}});await assert.rejects(()=>f.P.typeAndSend('test'),/not confirmed/);assert.equal(f.clicks(),1);
  });
  test(id+': does not submit a changed draft',async()=>{
    const f=fixture(id,{onInput({ed}){ed.value='user changed it';}});await assert.rejects(()=>f.P.typeAndSend('internal'),/changed/);assert.equal(f.clicks(),0);assert.equal(f.ed.value,'user changed it');
  });
  test(id+': Stop during typing prevents the commit',async()=>{
    const f=fixture(id);const promise=f.P.typeAndSend('internal');f.P.stopGeneration();await assert.rejects(()=>promise,/stopped/);assert.equal(f.clicks(),0);
  });
  test(id+': simultaneous sends cannot commit twice',async()=>{
    const f=fixture(id);const first=f.P.typeAndSend('first');await assert.rejects(()=>f.P.typeAndSend('second'),/pending/);assert.equal(await first,true);assert.equal(f.clicks(),1);
  });
  test(id+': changing chat after the click cannot confirm delivery',async()=>{
    const f=fixture(id,{onSend({w,ed,add}){w.history.pushState({},'', '/different-project');add('user',ed.value);ed.value='';}});
    await assert.rejects(()=>f.P.typeAndSend('test'),/chat changed/);assert.equal(f.clicks(),1);
  });
  test(id+': Co-work draft compare-and-swap and input lock',async()=>{
    const f=fixture(id);assert.equal((await f.P.writeDraft('followup','')).ok,true);assert.equal((await f.P.writeDraft('lost','wrong')).ok,false);assert.equal(f.ed.value,'followup');
    f.P.setInputLock(true);assert.equal(f.ed.readOnly,true);f.P.setInputLock(false);assert.equal(f.ed.readOnly,false);
  });
  test(id+': chat key survives first turn, decoration and saved route',()=>{
    const f=fixture(id);const key=f.P.conversationKey();const row=f.add('user','startup');assert.equal(f.P.conversationKey(),key);
    row.appendChild(f.d.createElement('div')).className='rs-chip';assert.equal(f.P.conversationKey(),key);
    f.w.history.pushState({},'', '/chat/saved-id');assert.equal(f.P.conversationKey(),key);
    for(const item of f.P.allItems())item.remove();assert.notEqual(f.P.conversationKey(),key);
  });
  test(id+': hard generation remains busy across long reasoning pause',()=>{
    const f=fixture(id);f.add('assistant','thinking');
    if(id==='chatwave')f.send.setAttribute('aria-label','Stop response');else f.stop.hidden=false;
    assert.equal(f.P.isGenerating(),true);f.advance(120000);assert.equal(f.P.isGenerating(),true);assert.equal(f.P.isHardGenerating(),true);
  });
  test(id+': login route blocks startup',async()=>{
    const f=fixture(id);f.w.history.pushState({},'', '/login');assert.equal(f.P.loginGatePresent(),true);assert.equal((await f.P.ensureComposerReady()).ready,false);await assert.rejects(()=>f.P.typeAndSend('test'),/signed-in/);assert.equal(f.clicks(),0);
  });
}
test('ChatWave: applies observed 16000-character native limit without truncation',async()=>{
  const f=fixture('chatwave');await assert.rejects(()=>f.P.typeAndSend('a'.repeat(16001)),/16000/);assert.equal(f.ed.value,'');assert.equal(f.clicks(),0);
  assert.equal(await f.P.typeAndSend('a'.repeat(16000)),true);assert.equal(f.P.itemText(f.P.allItems()[0]).length,16000);assert.equal(f.P.sysMaxChars,12000);assert.equal(f.P.toolResultPageChars,10000);
});
test('Motif: reported 50000-character threshold is checked before touching the draft',async()=>{
  const f=fixture('motif');await assert.rejects(()=>f.P.typeAndSend('x'.repeat(50000)),/49999 characters/);
  assert.equal(f.ed.value,'');assert.equal(f.clicks(),0);
  assert.equal(await f.P.typeAndSend('x'.repeat(49999)),true);assert.equal(f.P.itemText(f.P.allItems()[0]).length,49999);
  assert.equal(f.P.toolFeedbackMaxChars,48999);
});
test('native maxlength and the server limit both constrain outgoing messages',async()=>{
  const f=fixture('motif');f.ed.setAttribute('maxlength','8000');
  await assert.rejects(()=>f.P.typeAndSend('x'.repeat(8001)),/8000 characters/);assert.equal(f.clicks(),0);
  f.ed.setAttribute('maxlength','100000');await assert.rejects(()=>f.P.typeAndSend('x'.repeat(50000)),/49999 characters/);assert.equal(f.clicks(),0);
});
test('Motif: a native message-length rejection in a status toast ends an uncertain send once',async()=>{
  const f=fixture('motif',{onSend({d}){d.body.insertAdjacentHTML('beforeend','<div role="status">Your message is too long. Please shorten it to under 50000 characters.</div>');}});
  await assert.rejects(()=>f.P.typeAndSend('test'),/Your message is too long/);assert.equal(f.clicks(),1);assert.equal(f.P.sendRetryable(),false);
});
test('ordinary status text is not mistaken for a native length error',()=>{
  const f=fixture('motif');f.d.body.insertAdjacentHTML('beforeend','<div role="status">Checking context and failed draft history</div>');assert.equal(f.P.scanError(),null);
});
test('ChatWave: a 70000-character startup catalogue is delivered completely within native limits',async()=>{
  const f=fixture('chatwave');
  const catalogue='Output of list_commands:\n'+('command_with_schema {value, optional?} — description 🦊\n'.repeat(1400));
  const stages=f.P.startupFeedbackMessages(catalogue);assert.ok(stages.length>1);
  let reconstructed='';
  for(let i=0;i<stages.length;i++) {
    const stage=stages[i];assert.ok(stage.text.length<16000);
    reconstructed+=stage.text.split('BEGIN CONTEXT PART\n')[1].split('\nEND CONTEXT PART')[0];
    assert.equal(await f.P.typeAndSend(stage.text),true);
    if(i<stages.length-1)assert.match(stage.ack,/received\.$/);else assert.equal(stage.ack,undefined);
  }
  assert.equal(reconstructed,catalogue);assert.equal(f.clicks(),stages.length);assert.equal(f.P.toolFeedbackMaxChars,15000);
});
test('ChatWave: startup chunk boundaries never split a Unicode surrogate pair',()=>{
  const f=fixture('chatwave');const text='a'.repeat(9999)+'🦊'+'b'.repeat(10001);
  const stages=f.P.startupFeedbackMessages(text);const parts=stages.map(s=>s.text.split('BEGIN CONTEXT PART\n')[1].split('\nEND CONTEXT PART')[0]);
  assert.equal(parts.join(''),text);for(const part of parts){assert.ok(!/[\uD800-\uDBFF]$/.test(part));assert.ok(!/^[\uDC00-\uDFFF]/.test(part));}
});
test('ChatWave: authentication error is never a successful response',async()=>{
  const f=fixture('chatwave',{onSend({d,ed,add}){add('user',ed.value);ed.value='';const row=add('assistant','');row.querySelector('.msg-body').innerHTML='<div class="msg-err">Not authenticated — log in with Discord, then retry.</div>';}});
  await assert.rejects(()=>f.P.typeAndSend('test'),/Not authenticated/);assert.equal(f.clicks(),1);assert.equal(f.P.isGenerating(),false);assert.equal(f.P.readAssistant().reply,'');
});
test('ChatWave: an old error does not poison a later successful response',()=>{
  const f=fixture('chatwave');const old=f.add('assistant','');old.querySelector('.msg-body').innerHTML='<div class="msg-err">Error: failed</div>';f.add('assistant','Good response');assert.equal(f.P.scanError(),null);
});
test('Tencent: unknown role is excluded instead of treated as an assistant command',()=>{
  const f=fixture('tencent');f.d.body.insertAdjacentHTML('beforeend','<article class="message">{"command":"write_file"}</article>');assert.equal(f.P.assistantCount(),0);assert.equal(f.P.readAssistant().present,false);
});
test('Tencent: real native SVG Stop remains active until it becomes Send',()=>{
  const f=fixture('tencent');f.send.innerHTML='<svg><g id="Stop generating"><rect></rect></g></svg>';
  assert.equal(f.P.isHardGenerating(),true);f.advance(120000);assert.equal(f.P.isHardGenerating(),true);
  f.send.innerHTML='<svg><g id="Send Default"></g></svg>';assert.equal(f.P.isHardGenerating(),false);
});
test('Tencent: reasoning commands are not read or decorated as executable replies',()=>{
  const f=fixture('tencent');const row=f.add('assistant','');row.innerHTML='<div class="agent-chat__bubble__content"><div class="hy-think"><pre>{"command":"write_file","params":{}}</pre></div></div>';
  assert.equal(f.P.readAssistant().reply,'');assert.equal(f.P.streamLen(),0);assert.equal(f.P.findToolBlockSpot(row),null);
  row.insertAdjacentHTML('beforeend','<div class="hyc-content-md"><div class="hyc-common-markdown"><pre><code>{"command":"list_commands","params":{}}</code></pre></div></div>');
  assert.equal(f.P.readAssistant().reply,'{"command":"list_commands","params":{}}');
});
test('Tencent: new chat address transition and model query keep the same chat key',()=>{
  const f=fixture('tencent');const key=f.P.conversationKey();f.w.history.pushState({},'', '/chat/HunyuanDefault?modelId=hy4-preview-g');assert.equal(f.P.conversationKey(),key);
  f.add('user','startup');assert.equal(f.P.conversationKey(),key);
  f.w.history.pushState({},'', '/chat/HunyuanDefault/saved-chat?modelId=hy4-preview-g');assert.equal(f.P.conversationKey(),key);
  f.w.history.pushState({},'', '/chat/HunyuanDefault/saved-chat?modelId=other');assert.equal(f.P.conversationKey(),key);
  f.w.history.pushState({},'', '/chat/HunyuanDefault/different-chat?modelId=other');assert.notEqual(f.P.conversationKey(),key);
});
test('Tencent: real final JSON DOM excludes code header and visual line numbers',()=>{
  const f=fixture('tencent');const row=f.add('assistant','');row.innerHTML=fs.readFileSync(path.join(__dirname,'fixtures/tencent-final.html'),'utf8');
  assert.equal(f.P.readAssistant().reply,'{"command":"list_commands","params":{}}');
  vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;',f.dom.getInternalVMContext());
  const calls=f.w.parser.parseToolCalls(f.P.readAssistant().reply);assert.equal(calls.length,1);assert.equal(calls[0].tool,'list_commands');
});
test('Tencent: real multiline Luau DOM preserves whitespace and Unicode without line numbers',()=>{
  const f=fixture('tencent');const row=f.add('assistant','');row.innerHTML=fs.readFileSync(path.join(__dirname,'fixtures/tencent-lua.html'),'utf8');
  const expected='###LUA###\nlocal greeting = "Zażółć gęślą 🦊"\nlocal function demo()\n  return greeting\nend\nreturn demo()\n###END_LUA###';
  assert.equal(f.P.readAssistant().reply,expected);
  vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;',f.dom.getInternalVMContext());
  const calls=f.w.parser.parseToolCalls(f.P.readAssistant().reply);assert.equal(calls.length,1);assert.equal(calls[0].tool,'execute_luau');
  assert.match(calls[0].arguments.code,/  return greeting/);assert.match(calls[0].arguments.code,/Zażółć gęślą 🦊/);
});
test('tool parser accepts the Motif observed command format',()=>{
  const f=fixture('motif');vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;',f.dom.getInternalVMContext());
  f.add('assistant','<pre><code>{"command":"list_commands","params":{}}</code></pre>',true);
  const calls=f.w.parser.parseToolCalls(f.P.readAssistant().reply);assert.equal(calls.length,1);assert.equal(calls[0].tool,'list_commands');
});
test('all packaged copies register each host and preserve valid script paths and Firefox events',()=>{
  for(const base of [root,path.join(root,'PlazCode-Extension'),path.join(root,'PlazCode-Extension-Firefox')]) {
    const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8'));
    assert.equal(fs.readFileSync(path.join(base,'providers/webchats.js'),'utf8'),source);
    for(const host of Object.values(hosts)) {
      assert.ok(manifest.host_permissions.includes('https://'+host+'/*'));
      const groups=manifest.content_scripts.filter(g=>g.matches.includes('https://'+host+'/*'));
      assert.equal(groups.filter(g=>g.js.includes('providers/webchats.js')).length,1);
      assert.ok(groups.some(g=>g.world==='MAIN'&&g.js.includes('core/debug-capture-main.js')));
      if(base.endsWith('Firefox'))assert.ok(groups.some(g=>g.world==='MAIN'&&g.js.includes('core/firefox-events-main.js')));
      assert.ok(fs.readFileSync(path.join(base,'background.js'),'utf8').includes('https://'+host+'/*'));
      assert.ok(fs.readFileSync(path.join(base,'popup.js'),'utf8').includes('"'+host+'"'));
    }
    for(const group of manifest.content_scripts)for(const file of [...(group.js||[]),...(group.css||[])])assert.ok(fs.existsSync(path.join(base,file)),file);
  }
});

// Run the actual shared startup function and its actual prompt builder. The
// bridge and model replies are controlled; DOM delivery uses the real adapter.
function bootstrapFixture(id, {engine='roblox', effort='ultracode', custom='', wrongAck=false, initialReply, contextReply, nativeError}={}) {
  const sent=[],commands=[],banners=[],covers=[]; let f;
  const cap=id==='motif'?49999:16000;
  f=fixture(id,{onSend({d,ed,send,add}) {
    const text=ed.value;sent.push(text);
    if(text.length>cap){d.body.insertAdjacentHTML('beforeend','<div role="alert">Your message is too long. Please shorten it to under '+(id==='motif'?50000:16000)+' characters.</div>');return;}
    add('user',text);ed.value='';if(id==='chatwave')send.setAttribute('aria-label','Voice input');
    if(nativeError){const alert=d.createElement('div');alert.setAttribute('role','alert');alert.textContent=nativeError;d.body.append(alert);return;}
    const part=text.match(/^⟦RS-SYS⟧ PlazCode startup context part (\d+)\/(\d+)\./);
    const response=sent.length===1?(initialReply??'```json\n{"command":"list_commands","params":{}}\n```'):contextReply??(part&&Number(part[1])<Number(part[2])?(wrongAck?'Wrong acknowledgement':`PlazCode startup part ${part[1]}/${part[2]} received.`):'PlazCode is ready.');
    add('assistant',response);
  }});
  const c=f.dom.getInternalVMContext(),w=f.w;
  w.__rsThinkingLevel=()=>effort;w.__rsShowApproach=()=>true;w.__rsEngine=()=>engine;
  for(const name of ['luau-knowledge','ultracode-deepseek','ultracode','chat-creators','config','clarification','parser'])
    vm.runInContext(fs.readFileSync(path.join(root,'core',name+'.js'),'utf8'),c);
  const A={startGen:0,sessionGen:1,started:false,toolList:[]};
  const tools=Array.from({length:400},(_,i)=>({name:'test_command_'+i,server:engine,inputSchema:{properties:{value:{type:'string'},option:{type:'boolean'}},required:['value']},description:'Reference for a test tool. '+('parameter documentation '.repeat(7))}));
  Object.assign(w,{A,diag(){},log(){},RUN_CMD:'PlazCode',activeEngine:()=>engine,
    personalMemoryContext:()=> 'SAVED MEMORY: test memory applies to future project tasks only.\n',
    ui:{getCustomPrompt:()=>custom,setStarting(){},updateStartGate(){},inputCover:on=>covers.push(on),banner:(...args)=>banners.push(args),setStarted(){},toast(){},trackCard(){}},
    ensureTools:async()=>{A.toolList=tools;},
    submitAndGetBase:async text=>{const base=f.P.assistantCount();await f.P.typeAndSend(text);return base;},
    waitForResponse:async()=>{
      const reply=f.P.readAssistant(),calls=w.RSParser.parseToolCalls(reply.reply);
      return calls.length?{kind:'tool',calls,item:reply.item}:{kind:'text',text:reply.reply,item:reply.item};
    },
    startupTurnIdentity:item=>f.P.itemKey(item),rememberStartupOutcome(){},rememberExecuted(){},
    decorate:{sweep(){},toolBox(){}},rememberSession(){},connectedAddonsNote:()=>'',
    runTool:async call=>{commands.push(call.tool);assert.equal(call.tool,'list_commands');return 'Output of list_commands: mock connected command reference';},
    SendAbortedError:class SendAbortedError extends Error{},
  });
  vm.runInContext('window.RSParser=RSParse;',c);
  const main=fs.readFileSync(path.join(root,'core/main.js'),'utf8');
  const promptStart=main.indexOf('    function systemPrompt() {'),promptEnd=main.indexOf('\n  // ── Periodic system-prompt',promptStart);
  const start=main.indexOf('  async function startSession(opts = {}) {'),end=main.indexOf('\n  const SVG =',start);
  const helperStart=main.indexOf('  function parseProviderToolCalls('),helperEnd=main.indexOf('\n  // 1.24.10 helpers',helperStart);
  const restoreStart=main.indexOf('  function domHasRsSignal() {'),restoreEnd=main.indexOf('\n  function syncSessionState()',restoreStart);
  assert.ok(promptStart>=0&&promptEnd>promptStart&&start>=0&&end>start);
  assert.ok(helperStart>=0&&helperEnd>helperStart&&restoreStart>=0&&restoreEnd>restoreStart);
  vm.runInContext(main.slice(helperStart,helperEnd)+'\n'+main.slice(restoreStart,restoreEnd)+'\n'+main.slice(promptStart,promptEnd)+'\n'+main.slice(start,end)+'\nwindow.startBootstrap=startSession;window.fullStartupContext=systemPrompt;window.parseCommands=parseProviderToolCalls;window.hasMarkerSession=domHasRsSignal;',c);
  return {...f,sent,commands,banners,covers,A,cap,run:options=>w.startBootstrap(options)};
}
for(const id of ['motif','chatwave'])for(const engine of ['roblox','local']) {
  test(id+': actual bootstrap with '+engine+' Ultra keeps every startup message within the site limit',async()=>{
    const custom='USER PREFERENCE: preserve this entire reference.\n'+('Do not omit my project preferences. 🦊\n'.repeat(1700))+'\nCUSTOM_PREFERENCE_END';
    const f=bootstrapFixture(id,{engine,custom});
    const completeContext=f.w.fullStartupContext();assert.ok(completeContext.length>50000);
    const result=await f.run();
    assert.equal(result?.ready,true,JSON.stringify(f.banners));assert.equal(f.A.started,true);assert.equal(f.A._confirmedStartup,true);
    assert.ok(f.sent[0].length<2000,'first handshake must not contain the full system prompt');
    assert.ok(f.sent.every(text=>text.length<=f.cap));assert.ok(f.sent.length>3);
    const reference=f.sent.slice(1).map(text=>text.split('BEGIN CONTEXT PART\n')[1]?.split('\nEND CONTEXT PART')[0]??text).join('');
    assert.ok(reference.includes(completeContext),'all settings, Ultra guidance, memory and user preferences must arrive');
    assert.ok(reference.includes('CUSTOM_PREFERENCE_END'));assert.deepEqual(f.commands,['list_commands']);
    assert.equal(f.A.starting,false);assert.equal(f.ed.readOnly,false);assert.equal(f.covers.at(-1),false);assert.deepEqual(f.banners,[]);
  });
}
for(const id of ['motif','chatwave']) {
  test(id+': actual Restart Agent in an existing chat uses bounded startup without deleting the conversation',async()=>{
    const f=bootstrapFixture(id);f.add('user','a');f.add('assistant','Did you mean to type something more?');
    const result=await f.run({restart:true});assert.equal(result?.ready,true,JSON.stringify(f.banners));
    assert.equal(f.P.itemText(f.P.allItems()[0]),'a');assert.equal(f.P.itemText(f.P.allItems()[1]),'Did you mean to type something more?');
    assert.ok(f.sent.every(text=>text.length<=f.cap));assert.ok(f.sent[0].length<2000);assert.equal(f.ed.readOnly,false);
  });
  test(id+': actual default Ultra startup reproduces the reported oversized initial prompt',async()=>{
    const f=bootstrapFixture(id);const completeContext=f.w.fullStartupContext();
    assert.ok(completeContext.length>(id==='motif'?49900:16000));
    const result=await f.run();assert.equal(result?.ready,true,JSON.stringify(f.banners));
    assert.ok(f.sent[0].length<2000);assert.ok(f.sent.every(text=>text.length<=f.cap));
  });
  test(id+': actual bootstrap refuses readiness after an unacknowledged context part and unlocks input',async()=>{
    const f=bootstrapFixture(id,{wrongAck:true});const result=await f.run();
    assert.equal(result,undefined);assert.equal(f.A.started,false);assert.equal(f.A._confirmedStartup,false);
    assert.equal(f.A.starting,false);assert.equal(f.ed.readOnly,false);assert.equal(f.covers.at(-1),false);
    assert.ok(f.banners.some(row=>row[1]==='Startup context was not acknowledged'));assert.equal(f.sent.length,2);
    assert.deepEqual(f.commands,['list_commands']);
  });
  test(id+': startup refusal quoting list_commands never executes the quote or sends a correction',async()=>{
    const refusal='Nie, nie jestem połączony ze Studio. Nie wyślę też {"command":"list_commands"}, bo nie mam dostępu do narzędzi ani do lokalnego bridge’a.';
    const f=bootstrapFixture(id,{initialReply:refusal});assert.equal(await f.run(),undefined);
    assert.deepEqual(f.commands,[]);assert.equal(f.sent.length,1);assert.equal(f.A.started,false);assert.equal(f.ed.readOnly,false);
    assert.ok(f.banners.some(row=>row[1]==='AI declined the connection request'));
    assert.equal(f.w.hasMarkerSession(),false);
  });
  test(id+': refusing a context part cannot arm a marker-only session or request retained pages',async()=>{
    const f=bootstrapFixture(id,{contextReply:"I can't call plazcode_result_read from this chat. Please paste the remaining result here."});
    assert.equal(await f.run(),undefined);assert.deepEqual(f.commands,['list_commands']);assert.equal(f.sent.length,2);
    assert.equal(f.A.started,false);assert.equal(f.A._confirmedStartup,false);assert.equal(f.w.hasMarkerSession(),false);assert.equal(f.ed.readOnly,false);
    assert.ok(f.sent.every(text=>!text.startsWith('[PlazCode retained the COMPLETE result.')));
  });
  test(id+': inline and quoted JSON examples remain readable prose, not executable commands',()=>{
    const f=bootstrapFixture(id);const inline='Przykładowy format to {"command":"list_commands","params":{}}. To przykład dokumentacji.';
    const item=f.add('assistant',inline);assert.equal(f.w.parseCommands(inline,item).length,0);
    const block=f.add('assistant','<blockquote><pre><code>{"command":"write_file","params":{}}</code></pre></blockquote>',true);
    assert.equal(f.w.parseCommands(f.P.itemText(block),block).length,0);
    const actual=f.add('assistant','Kolejny krok.<pre><code>{"command":"plazcode_status","params":{}}</code></pre>',true);
    const calls=f.w.parseCommands(f.P.itemText(actual),actual);assert.equal(calls.length,1);assert.equal(calls[0].tool,'plazcode_status');
  });
  test(id+': confirmed readiness, not merely startup markers, is required to restore a session',()=>{
    const f=bootstrapFixture(id);f.add('user','⟦RS-SYS⟧ PlazCode startup');f.add('assistant','I cannot run commands through this extension.');
    assert.equal(f.P.requireConfirmedStartup,true);assert.equal(f.P.canRestoreSession(),false);assert.equal(f.w.hasMarkerSession(),false);
    f.add('assistant','PlazCode is ready.');assert.equal(f.P.canRestoreSession(),false);
    f.add('user','⟦RS-SYS⟧ BEGIN CONTEXT PART\nReference\nEND CONTEXT PART');f.add('assistant','PlazCode is ready.');assert.equal(f.P.canRestoreSession(),true);
  });
}
test('ChatWave: native Unable to reach error aborts startup once and unlocks the composer',async()=>{
  const f=bootstrapFixture('chatwave',{nativeError:'Unable to reach ChatWave right now.'});assert.equal(await f.run(),undefined);
  assert.equal(f.sent.length,1);assert.deepEqual(f.commands,[]);assert.equal(f.A.started,false);assert.equal(f.ed.readOnly,false);
  assert.ok(f.banners.some(row=>row.join(' ').includes('Unable to reach ChatWave right now.')));
});
function useActualResponseReader(f) {
  const w=f.w,c=f.dom.getInternalVMContext(),main=fs.readFileSync(path.join(root,'core/main.js'),'utf8');
  Object.defineProperty(f.d,'hidden',{value:false,configurable:true});
  Object.assign(w,{T:f.P.timings,bgMode:true,sleep:ms=>new Promise(resolve=>w.setTimeout(resolve,ms))});
  f.A.sendToken=null;f.A.toolNames=new Set(['list_commands','plazcode_status']);
  const start=main.indexOf('  async function waitForResponse(base) {'),end=main.indexOf('\n  const isContextInvalidated',start);
  assert.ok(start>=0&&end>start);vm.runInContext(main.slice(start,end)+'\nwindow.readActualResponse=waitForResponse;',c);
  return ()=>w.readActualResponse(0);
}
test('actual response reader ignores an earlier cached command when final reply is a refusal',async()=>{
  const f=bootstrapFixture('chatwave');const item=f.add('assistant','Nie wyślę też {"command":"list_commands"}. Nie mam żadnego połączenia ze Studio.');
  const read=useActualResponseReader(f);
  f.A.detectedTool={text:'{"command":"list_commands"}',calls:[{tool:'list_commands',arguments:{}}],item,id:f.P.lastAssistantId(),chat:f.P.conversationKey(),session:f.A.sessionGen,sendToken:null,at:f.w.Date.now()};
  const response=await read();assert.equal(response.kind,'text');assert.match(response.text,/Nie wyślę/);assert.deepEqual(f.commands,[]);
});
test('actual response reader recognizes native connection error before waiting for an empty model reply',async()=>{
  const f=bootstrapFixture('chatwave');f.add('assistant','');f.d.body.insertAdjacentHTML('beforeend','<div role="alert">Unable to reach ChatWave right now.</div>');
  const response=await useActualResponseReader(f)();assert.equal(response.kind,'context_limit');assert.equal(response.detail,'Unable to reach ChatWave right now.');
});
test('actual response reader still accepts an explicit executable command block',async()=>{
  const f=bootstrapFixture('motif');f.add('assistant','Sprawdzę stan.<pre><code>{"command":"plazcode_status","params":{}}</code></pre>',true);
  const response=await useActualResponseReader(f)();assert.equal(response.kind,'tool');assert.equal(response.calls.length,1);assert.equal(response.calls[0].tool,'plazcode_status');
});
test('real Tencent JSON and Luau DOM pass through the guarded shared parser',()=>{
  for(const [file,tool] of [['tencent-final.html','list_commands'],['tencent-lua.html','execute_luau']]) {
    const f=bootstrapFixture('tencent');const item=f.add('assistant','');item.innerHTML=fs.readFileSync(path.join(__dirname,'fixtures',file),'utf8');
    const calls=f.w.parseCommands(f.P.itemText(item),item);assert.equal(calls.length,1);assert.equal(calls[0].tool,tool);
  }
});
test('command blocks keep code strings that mention inability to call tools',()=>{
  const f=bootstrapFixture('motif');const value={command:'write_file',params:{content:"I cannot call tools from this chat."}};
  const item=f.add('assistant','<pre><code></code></pre>',true);item.querySelector('code').textContent=JSON.stringify(value);
  const calls=f.w.parseCommands(f.P.itemText(item),item);assert.equal(calls.length,1);assert.equal(calls[0].tool,'write_file');
});
test('a programming code example containing a JSON command string is never executed',()=>{
  const f=bootstrapFixture('motif');const item=f.add('assistant','<pre><code></code></pre>',true);item.querySelector('code').textContent='const sample = \'{"command":"write_file","params":{}}\';';
  assert.equal(f.w.parseCommands(f.P.itemText(item),item).length,0);
});
