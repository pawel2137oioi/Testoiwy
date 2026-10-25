// Actual content-script bundle and UI in Chromium. The page, model and bridge
// are controlled; this is not authenticated Arcee/Copilot or Studio coverage.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const scripts=manifest.content_scripts.find(group=>group.js.includes('providers/webchats.js')).js;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{let passed=0;
  for(const [host,historyKind] of [['copilot.com','css-disclosure'],['copilot.com','truncated-disclosure'],['copilot.com','named-groups'],['copilot.com','named-groups-truncated'],['copilot.com','named-ai-group'],['copilot.com','microsoft-plain'],['copilot.com','microsoft-line-paragraphs'],['copilot.com','microsoft-windowed'],['copilot.com','microsoft-slow-windowed'],['copilot.com','microsoft-shadow'],['copilot.com','microsoft-scriptor'],['copilot.com','microsoft-scriptor-shadow'],['copilot.com','microsoft-scriptor-multiline'],['copilot.com','microsoft-native-json'],['copilot.com','microsoft-virtualized'],['copilot.com','microsoft-virtualized-no-model'],['copilot.com','microsoft-unrecognized-code'],['copilot.com','microsoft-refusal'],['copilot.com','microsoft-refusal-unknown-user-shadow'],['platform.arcee.ai','plain'],['longcat.ai','longcat-plain'],['longcat.ai','longcat-windowed'],['longcat.ai','longcat-refusal'],['www.meta.ai','meta-plain'],['www.meta.ai','meta-legacy'],['www.meta.ai','meta-tree'],['www.meta.ai','meta-unreadable-tree'],['www.meta.ai','meta-windowed'],['www.meta.ai','meta-refusal']].filter(([host,kind])=>(!process.env.PLAZCODE_TEST_HISTORY||kind===process.env.PLAZCODE_TEST_HISTORY)&&(!process.env.PLAZCODE_NEW_SITES||host==='longcat.ai'||host==='www.meta.ai'))){
   const copilot=host==='copilot.com',meta=host==='www.meta.ai',newSite=meta||host==='longcat.ai',page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><main><section id="thread"></section><form id="native-form">'+(copilot?'<div id="native-editor" contenteditable="true" aria-label="Message Copilot"></div>':'<textarea id="native-editor" placeholder="Send a message"></textarea>')+'<button type="button" id="native-send" aria-label="Send" disabled>Send</button></form></main>'}));
    await page.goto('https://'+host+(meta?'/':copilot||newSite?'/chat/':'/playground'));
    await page.addStyleTag({content:'body{background:#171717;color:white;margin:0}#native-form{position:fixed;bottom:12px;left:10%;width:80%;display:flex}#native-editor{white-space:pre-wrap;min-height:50px;max-height:150px;overflow:auto;flex:1;background:#333;color:white}#thread{max-height:550px;overflow:auto;padding:10px}'});
    await page.evaluate(({copilot,meta,newSite,version,historyKind})=>{
      const ed=document.querySelector('#native-editor'),send=document.querySelector('#native-send'),thread=document.querySelector('#thread');let model='',serial=0;const named=historyKind.startsWith('named-'),microsoft=historyKind.startsWith('microsoft-');thread.dataset.content='conversation';
      window.reportCopies=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.reportCopies.push(text)}});window.nativeSent=[];window.bridgeCalls=[];window.backgroundMessages=[];window.historyExpands=0;window.copyClicks=0;window.nativeSendClicks=0;
      if(meta)ed.dataset.testid='composer-input';if(historyKind==='meta-legacy')thread.className='flex flex-col';window.rawClicks=0;
      window.clockOffset=0;const realNow=Date.now.bind(Date);if(historyKind==='microsoft-slow-windowed')Date.now=()=>realNow()+window.clockOffset;
      function add(role,text,code=false){
        const row=document.createElement('div');row.dataset.messageId=role+'-'+(++serial);
        if(copilot){
          if(microsoft){row.className=role==='user'?'fai-UserMessage':'fai-CopilotMessage';row.setAttribute('role','article');if(role==='user'&&historyKind.includes('unknown-user')){row.className='';row.removeAttribute('role');}}
          else if(named){row.removeAttribute('data-message-id');row.setAttribute('role','article');if(role==='user'){row.className='group/user-message';row.id='turn-'+serial+'-user-message';}else if(historyKind==='named-ai-group')row.className='group/ai-message';else row.dataset.testid='ai-message';}
          else{row.dataset.content=role==='user'?'user-message':'ai-message';row.setAttribute('role','button');}
        }else row.dataset.role=role;
        if(historyKind==='meta-legacy'){delete row.dataset.role;row.className='starting:opacity-0';if(role==='assistant')row.dataset.testid='assistant-message';}
        if(copilot && role==='user'){
          const body=document.createElement('p'),meta=document.createElement('span'),actions=document.createElement('div'),copy=document.createElement('button');if(microsoft)body.dataset.testid='chatOutput';else if(named)body.className='max-w-user-text-message';else body.dataset.testid='user-message-text';
          const truncated=(historyKind==='truncated-disclosure'||historyKind==='named-groups-truncated') && text.length>160;body.textContent=truncated?text.slice(0,110)+'…':text;body.style.cssText='max-height:50px;overflow:hidden';row.setAttribute('aria-expanded','false');
          meta.textContent='You said · 12:00';if(named||microsoft){meta.setAttribute('data-copy','false');actions.dataset.testid='user-message-reactions';}else actions.className='msg-actions';copy.type='button';copy.textContent='Copy';copy.onclick=event=>{event.stopPropagation();window.copyClicks++;};actions.append(copy);row.append(meta,body,actions);
          const expand=()=>{window.historyExpands++;body.textContent=text;row.setAttribute('aria-expanded','true');};
          if(named){row.removeAttribute('aria-expanded');if(truncated){body.id='echo-'+serial;const toggle=document.createElement('button');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',body.id);toggle.textContent='Show more';toggle.onclick=()=>{expand();toggle.setAttribute('aria-expanded','true');};row.append(toggle);}}else row.onclick=expand;
        }else if(microsoft){
          const host=document.createElement('div');host.dataset.testid='markdown-reply';row.append(host);const body=historyKind.includes('shadow')?host.attachShadow({mode:'open'}):host;
          if(code&&historyKind.startsWith('microsoft-virtualized')){
            const group=document.createElement('section'),editor=document.createElement('div'),header=document.createElement('div'),box=document.createElement('div'),source=document.createElement('div');group.setAttribute('aria-label','Code preview');editor.className='scriptor-component-code-block scriptor-codeblock-virtualized';
            header.innerHTML='<svg aria-hidden="true"></svg><span>JSON</span><button type="button" aria-label="Copy code"><svg aria-hidden="true"></svg></button>';header.querySelector('button').onclick=()=>window.copyClicks++;
            const live=document.createElement('div');live.innerHTML='<div class="fui-AriaLive__assertive" hidden></div><div class="fui-AriaLive__polite" hidden></div>';
            const value=JSON.parse(text);if(value.command==='list_commands')delete value.params;text=JSON.stringify(value);box.setAttribute('role','textbox');box.setAttribute('aria-readonly','true');source.textContent=value.command==='list_commands'?text:text.slice(0,20);box.append(source);
            if(!historyKind.endsWith('no-model'))box.editContext=new EditContext({text});editor.append(live,document.createElement('div'),header,box);group.append(editor);body.append(group);
          }else if(code&&historyKind==='microsoft-native-json'){
            // The user's r28 report confirms FAI content, a lastChatMessage
            // below deep wrappers and two detected code containers. The code
            // descendants were omitted; these are representative native DOM.
            host.removeAttribute('data-testid');host.className='fai-CopilotMessage__content';
            let parent=body;for(let i=0;i<14;i++){const child=document.createElement('div');if(i===9)child.dataset.testid='lastChatMessage';parent.append(child);parent=child;}
            const group=document.createElement('section'),editor=document.createElement('div'),header=document.createElement('span'),copy=document.createElement('button'),source=document.createElement('div');group.setAttribute('aria-label','Code preview');editor.className='scriptor-component-code-block';header.textContent='JSON';copy.type='button';copy.textContent='';copy.onclick=()=>window.copyClicks++;
            const value=JSON.parse(text);if(value.command==='list_commands')delete value.params;source.textContent=JSON.stringify(value);editor.append(header,copy,source);group.append(editor);parent.append(group);
          }else if(code&&historyKind==='microsoft-unrecognized-code'){
            const editor=document.createElement('div'),header=document.createElement('span'),line=document.createElement('div');editor.className='monaco-editor';header.textContent='JSON';line.className='view-line';line.textContent='1 '+text;editor.append(header,line);body.append(editor);
          }else if(code&&historyKind.includes('scriptor')){
            if(historyKind.endsWith('multiline')){const value=JSON.parse(text);if(value.command==='list_commands')delete value.params;text=JSON.stringify(value,null,2);}
            const group=document.createElement('section'),editor=document.createElement('div'),header=document.createElement('span'),copy=document.createElement('button');group.setAttribute('aria-label','Code preview');header.textContent='JSON';copy.type='button';copy.textContent='Copy code';copy.onclick=()=>window.copyClicks++;group.append(header,copy,editor);editor.className='scriptor-component-code-block';editor.dataset.lineCount=String(text.split('\n').length);
            for(const [index,line] of text.split('\n').entries()){const paragraph=document.createElement('div'),number=document.createElement('span');paragraph.className='scriptor-paragraph';paragraph.dataset.lineNumber=String(index+1);number.className='line-number';number.textContent=String(index+1);paragraph.append(number);for(const part of [line.slice(0,Math.floor(line.length/2)),line.slice(Math.floor(line.length/2))]){const run=document.createElement('span');run.className='scriptor-textRun';run.textContent=part;paragraph.append(run);}editor.append(paragraph);}body.append(group);
          }else if(code){const pre=document.createElement('pre'),node=document.createElement('code');node.textContent=text;pre.append(node);body.append(pre);}else body.textContent=text;
        }else if(code&&historyKind.includes('tree')){
          const block=document.createElement('div');block.className='ur-code-block';block.textContent=text;
          if(historyKind!=='meta-unreadable-tree'){const raw=document.createElement('button');raw.type='button';raw.textContent='Raw';raw.onclick=()=>{window.rawClicks++;const pre=document.createElement('pre'),code=document.createElement('code');code.textContent=text;pre.append(code);block.replaceChildren(pre);};block.prepend(raw);}
          row.append(block);
        }else if(code){const body=document.createElement('div');body.className=named?'group/ai-message-item':'markdown';const node=document.createElement('pre');node.textContent=text;body.append(node);row.append(body);}else row.textContent=text;
        if(historyKind.endsWith('windowed'))row.removeAttribute('data-message-id');
        thread.append(row);
        if(historyKind.endsWith('windowed'))for(const name of ['fai-UserMessage','fai-CopilotMessage']){
          const rows=[...thread.querySelectorAll('.'+name+','+(name==='fai-UserMessage'?'[data-role="user"]':'[data-role="assistant"]'))];while(rows.length>4)rows.shift().remove();
        }
      }
      if(copilot)ed.onpaste=event=>{event.preventDefault();model=event.clipboardData.getData('text/plain');if(historyKind==='microsoft-line-paragraphs'){ed.replaceChildren(...(model+'\u200B\u200C').split('\n').map(line=>{const p=document.createElement('p');if(line)p.textContent=line;else{const br=document.createElement('br');br.className='ProseMirror-trailingBreak';p.append(br);}return p;}));}else ed.textContent=model+'\u200B\u200C';send.disabled=!model;};
      ed.oninput=event=>{if(!copilot || event.isTrusted){model=copilot?ed.textContent:ed.value;send.disabled=!model;}};
      send.onclick=()=>{
        window.nativeSendClicks++;
        const text=model;window.nativeSent.push(text);add('user',text+(copilot?'\u200B\u200C':''));model='';if(copilot)ed.textContent='';else ed.value='';send.disabled=true;
        if(!copilot && window.nativeSent.length===1)history.replaceState({},'',meta?'/prompt/first-saved-chat':newSite?'/chat/first-saved-chat':'/playground/first-saved-chat');
        if(copilot && (named||microsoft) && window.nativeSent.length===1)history.replaceState({},'','/chat/conversation/first-saved-chat?fromcode=example&prompt=login&hasLW=false');
        if(historyKind.includes('refusal')){add('assistant','I cannot participate in or control external browser extensions by emitting structured commands for them.');return;}
        const part=text.match(/PlazCode startup context part (\d+)\/(\d+)\./);
        if(part){
          const respond=()=>{if(historyKind==='microsoft-slow-windowed')window.clockOffset+=160000;add('assistant',part[1]===part[2]?'PlazCode is ready.':`PlazCode startup part ${part[1]}/${part[2]} received.`);};
          if(historyKind.endsWith('windowed'))setTimeout(respond,250);else respond();
        }
        else if(text.includes("Output of 'get_studio_state'"))add('assistant','Odczyt potwierdził Workspace.Solaris.');
        else if(text.includes('Czy widzisz'))add('assistant','{"command":"get_studio_state","params":{}}',true);
        else if(!copilot&&!newSite)add('assistant','PlazCode is ready.');
        else add('assistant','{"command":"list_commands","params":{}}',true);
      };
      // Isolate protocol dispatch from the unrelated periodic Play/console
      // monitor. Otherwise a 4-second tick can add two calls during an idle
      // gap after readiness, making the no-extra-command assertion race.
      const storage={rsSetupSeen:true,rsAutoFix:false},status={ok:true,connected:true,roblox_connected:true,local_connected:false,mcpAlive:true,studio:true,studioApp:true,studioProc:true,robloxProc:true,engine:'roblox',tools:1,servers:[{id:'roblox',alive:true,tools:1}]};
      if(historyKind.endsWith('windowed'))storage.rsCustomPrompt='Test preference: preserve this reference.\n'+'x'.repeat(14000)+'\nEND_TEST_PREFERENCE';
      const tools=[{name:'get_studio_state',server:'roblox',description:'Read current Studio state',inputSchema:{type:'object',properties:{}}}];
      const reply=message=>{
        window.backgroundMessages.push(message.type);
        if(['status','live-status'].includes(message.type))return status;
        if(message.type==='list_tools')return {ok:true,tools};
        if(message.type==='rs-get-engine')return {engine:'roblox'};
        if(message.type==='call_tool'){window.bridgeCalls.push(message.name);return {ok:true,text:'{"mode":"Edit","path":"Workspace.Solaris"}'};}
        return {ok:true,memories:[],skills:[],text:'',entries:[],items:[],tools:[]};
      };
      window.chrome={runtime:{id:'plazcode-startup-fixture',getManifest:()=>({version}),getURL:p=>location.origin+'/__extension/'+p,onMessage:{addListener(){}},sendMessage:(message,callback)=>{const value=reply(message);if(callback){queueMicrotask(()=>callback(value));return;}return Promise.resolve(value);}},storage:{local:{get:(key,callback)=>{if(callback)callback({...storage});else return Promise.resolve({...storage});},set:(value,callback)=>{Object.assign(storage,value);callback?.();return Promise.resolve();}},onChanged:{addListener(){}}},i18n:{getMessage:()=>''}};
    },{copilot,meta,newSite,version:manifest.version,historyKind});
    if(copilot)await page.addScriptTag({content:fs.readFileSync(path.join(root,'providers/copilot-code.js'),'utf8')});
    for(const script of scripts){
      await page.addScriptTag({content:fs.readFileSync(script==='providers/webchats.js' && process.env.PLAZCODE_TEST_PROVIDER || script==='core/main.js' && process.env.PLAZCODE_TEST_CORE || path.join(root,script),'utf8')});
      if(script==='providers/webchats.js')await page.evaluate(()=>Object.assign(RSProvider.timings,{GEN_IDLE_MS:20,STABLE_MS:40,REASON_IDLE_MS:100}));
    }
    await page.addStyleTag({content:fs.readFileSync(path.join(root,'overlay.css'),'utf8')});
    await page.locator('#rs-action[data-kind="start"]:enabled').waitFor({timeout:15000});await page.locator('#rs-action').click();
    if(process.env.PLAZCODE_EXPECT_WINDOW_FAILURE==='1'){
      assert.ok(process.env.PLAZCODE_TEST_PROVIDER);await page.locator('.rs-banner-t').filter({hasText:'Startup failed'}).waitFor({timeout:30000});
      assert.match((await page.locator('.rs-banner').allTextContents()).join(' '),/chat changed after sending/);assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),false);assert.equal(await page.evaluate(()=>window.nativeSent.length),5);assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),[]);
      passed++;console.log(host+' '+historyKind+': old adapter aborts at context part 4 after pruning the first visible user');continue;
    }
    if(process.env.PLAZCODE_EXPECT_SEND_FAILURE==='1'){
      assert.ok(process.env.PLAZCODE_TEST_PROVIDER);await page.locator('.rs-banner-t').filter({hasText:'Startup failed'}).waitFor({timeout:15000});
      assert.match((await page.locator('.rs-banner').allTextContents()).join(' '),/prepared text changed before sending/);assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),false);assert.equal(await page.evaluate(()=>window.nativeSent.length),1);assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),[]);
      passed++;console.log(host+' '+historyKind+': baseline send failure after list_commands; context was not submitted');continue;
    }

    if(historyKind==='meta-unreadable-tree'){
      await page.locator('.rs-banner-t').filter({hasText:'Full code source unavailable'}).waitFor({timeout:30000});assert.equal(await page.evaluate(()=>window.nativeSent.length),1);assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),[]);assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),false);assert.equal(await page.evaluate(()=>window.rawClicks),0);assert.deepEqual(errors,[]);
      passed++;console.log(host+' '+historyKind+': unavailable source stops startup once, no correction or project call');continue;
    }
    if(historyKind.includes('refusal')){
      await page.locator('.rs-banner-t').filter({hasText:'AI declined the connection request'}).waitFor({timeout:20000});
      await page.waitForFunction(()=>/^(start|restart)$/.test(document.querySelector('#rs-action')?.dataset.kind||'') && !document.querySelector('#rs-action').disabled && /Not connected/.test(document.querySelector('#rs-bar')?.textContent||''));
      assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),false);assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),[]);assert.equal(await page.evaluate(()=>window.nativeSent.length),1);assert.equal(await page.evaluate(()=>window.nativeSendClicks),1);assert.equal(await page.evaluate(()=>RSProvider.editorText()),'');assert.deepEqual(errors,[]);
      const titles=await page.locator('.rs-banner-t').allTextContents();assert.deepEqual(titles,['AI declined the connection request']);
      passed++;console.log(host+' '+historyKind+': exact refusal stops startup, no correction, context or tool call');continue;
    }
    if(historyKind==='microsoft-unrecognized-code'&&process.env.PLAZCODE_EXPECT_HANDSHAKE_FAILURE!=='1'){
      await page.locator('.rs-banner-t').filter({hasText:'Startup handshake failed'}).waitFor({timeout:30000});
      assert.equal(await page.evaluate(()=>window.reportCopies.length),0);const sent=await page.evaluate(()=>window.nativeSent.length);assert.equal(sent,2);
      await page.locator('.rs-copy-failure-report').click();const report=await page.evaluate(()=>JSON.parse(window.reportCopies[0]));
      assert.equal(report.transport_build.core,'r34');assert.equal(report.engine,'roblox');assert.equal(report.provider_diagnostics.last_failure.stage,'startup_handshake_failed');assert.equal(report.provider_diagnostics.last_failure.result.kind,'text');assert.equal(report.provider_diagnostics.last_failure.snapshot.counts.candidate_chars,0);assert.ok(report.provider_diagnostics.last_failure.snapshot.shape.some(node=>node.classes?.includes('monaco-editor')));assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),false);assert.equal(await page.evaluate(()=>window.nativeSent.length),sent);assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),[]);assert.deepEqual(errors,[]);assert.equal(await page.locator('.rs-failure-report').isVisible(),true);
      passed++;console.log(host+' '+historyKind+': bounded redacted report captures actual reader failure; copying sends no message');continue;
    }
    if(process.env.PLAZCODE_EXPECT_HANDSHAKE_FAILURE==='1'){
      assert.ok(process.env.PLAZCODE_TEST_PROVIDER,'Baseline source must be supplied explicitly');
      await page.locator('.rs-banner-t').filter({hasText:'Startup handshake failed'}).waitFor({timeout:30000});
      assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),false);assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),[]);assert.equal(await page.evaluate(()=>window.nativeSent.length),2);
      passed++;console.log(host+' '+historyKind+': expected baseline handshake failure reproduced after one correction');continue;
    }
    await page.waitForFunction(()=>document.querySelector('#rs-action')?.dataset.kind==='restart' && RSProvider.canRestoreSession(),{timeout:30000});
    assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),true);
    const bootstrap=await page.evaluate(()=>({sent:window.nativeSent,editor:RSProvider.editorText(),calls:window.bridgeCalls}));
    assert.equal(bootstrap.editor,'');assert.deepEqual(bootstrap.calls,[]);assert.equal(bootstrap.sent.filter(text=>text===bootstrap.sent[0]).length,1);
    if(copilot)assert.equal(bootstrap.sent[0].length,552);else if(!newSite)assert.ok(bootstrap.sent.some(text=>text.includes('extension fetched this command reference')));
    if(historyKind.startsWith('microsoft-')&&historyKind.endsWith('windowed')){
      const parts=bootstrap.sent.slice(1).map(text=>text.match(/PlazCode startup context part (\d+)\/(\d+)\./));assert.ok(parts.length>=10);assert.equal(parts.length,Number(parts[0][2]));assert.deepEqual(parts.map(part=>Number(part[1])),parts.map((_,index)=>index+1));assert.equal(await page.evaluate(()=>RSProvider.assistantCount()),4);assert.equal(await page.evaluate(()=>RSProvider.lastAssistantId()),null);assert.deepEqual(await page.locator('.rs-banner-t').allTextContents(),[]);
      if(historyKind==='microsoft-slow-windowed')assert.ok(await page.evaluate(()=>window.clockOffset>600000));
    }
    const ed=page.locator('#native-editor');await ed.fill('Czy widzisz pliki w Studio?');await page.locator('#native-send').click();
    if(historyKind==='microsoft-virtualized-no-model'){
      await page.locator('.rs-banner-t').filter({hasText:'Full code source unavailable'}).waitFor({timeout:30000});
      const sent=await page.evaluate(()=>window.nativeSent.length);assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),[]);
      await page.locator('.rs-copy-failure-report').click();const report=await page.evaluate(()=>JSON.parse(window.reportCopies[0]));
      assert.equal(report.provider_diagnostics.last_failure.stage,'command_source_unavailable');assert.equal(report.provider_diagnostics.last_failure.snapshot.code_sources[0].model_status,'model_unavailable');assert.equal(await page.evaluate(()=>window.nativeSent.length),sent);assert.equal(await page.evaluate(()=>window.copyClicks),0);assert.deepEqual(errors,[]);
      passed++;console.log(host+' '+historyKind+': visible source error after handshake; no project call, automatic retry or silent stop');continue;
    }
    await page.waitForFunction(()=>window.nativeSent.some(text=>text.includes("Output of 'get_studio_state'")),{timeout:15000});
    await page.waitForFunction(()=>document.querySelector('#rs-action')?.dataset.kind==='restart' && RSProvider.editorText()==='',{timeout:15000});
    assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),['get_studio_state']);assert.deepEqual(errors,[]);
    const delivery=await page.evaluate(()=>({sendClicks:window.nativeSendClicks,sent:window.nativeSent.length,expands:window.historyExpands,expectedExpands:window.nativeSent.filter(text=>text.length>158).length,copies:window.copyClicks,duplicates:window.nativeSent.length-new Set(window.nativeSent).size}));assert.equal(delivery.sendClicks,delivery.sent);assert.equal(delivery.copies,0);assert.equal(delivery.duplicates,0);if(historyKind==='meta-tree')assert.equal(await page.evaluate(()=>window.rawClicks),2);assert.equal(delivery.expands,historyKind.endsWith('truncated')||historyKind==='truncated-disclosure'?delivery.expectedExpands:0);
    passed++;console.log(host+' '+historyKind+': full UI Start, confirmed context and one native user read passed');
   }catch(error){console.error(await page.evaluate(()=>({bar:document.querySelector('#rs-bar')?.textContent,sent:window.nativeSent?.map(text=>text.slice(0,90)),calls:window.bridgeCalls,messages:window.backgroundMessages,body:document.body.textContent.slice(-1500)})));throw error;}finally{await page.close();}
  }
  assert.ok(passed>0);console.log(passed+' full UI startup checks passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
