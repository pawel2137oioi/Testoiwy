// Actual content-script bundle and UI in Chromium. The page, model and bridge
// are controlled; this is not authenticated Arcee/Copilot or Studio coverage.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const scripts=manifest.content_scripts.find(group=>group.js.includes('providers/webchats.js')).js;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{let passed=0;
  for(const [host,historyKind] of [['copilot.com','css-disclosure'],['copilot.com','truncated-disclosure'],['copilot.com','named-groups'],['copilot.com','named-groups-truncated'],['copilot.com','named-ai-group'],['copilot.com','microsoft-plain'],['copilot.com','microsoft-shadow'],['copilot.com','microsoft-scriptor'],['copilot.com','microsoft-scriptor-shadow'],['copilot.com','microsoft-scriptor-multiline'],['copilot.com','microsoft-refusal'],['copilot.com','microsoft-refusal-unknown-user-shadow'],['platform.arcee.ai','plain']].filter(([,kind])=>!process.env.PLAZCODE_TEST_HISTORY||kind===process.env.PLAZCODE_TEST_HISTORY)){
   const copilot=host==='copilot.com',page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><main><section id="thread"></section><form id="native-form">'+(copilot?'<div id="native-editor" contenteditable="true" aria-label="Message Copilot"></div>':'<textarea id="native-editor" placeholder="Send a message"></textarea>')+'<button type="button" id="native-send" aria-label="Send" disabled>Send</button></form></main>'}));
    await page.goto('https://'+host+(copilot?'/chat':'/playground'));
    await page.addStyleTag({content:'body{background:#171717;color:white;margin:0}#native-form{position:fixed;bottom:12px;left:10%;width:80%;display:flex}#native-editor{white-space:pre-wrap;min-height:50px;max-height:150px;overflow:auto;flex:1;background:#333;color:white}#thread{max-height:550px;overflow:auto;padding:10px}'});
    await page.evaluate(({copilot,version,historyKind})=>{
      const ed=document.querySelector('#native-editor'),send=document.querySelector('#native-send'),thread=document.querySelector('#thread');let model='',serial=0;const named=historyKind.startsWith('named-'),microsoft=historyKind.startsWith('microsoft-');thread.dataset.content='conversation';
      window.nativeSent=[];window.bridgeCalls=[];window.backgroundMessages=[];window.historyExpands=0;window.copyClicks=0;window.nativeSendClicks=0;
      function add(role,text,code=false){
        const row=document.createElement('div');row.dataset.messageId=role+'-'+(++serial);
        if(copilot){
          if(microsoft){row.className=role==='user'?'fai-UserMessage':'fai-CopilotMessage';row.setAttribute('role','article');if(role==='user'&&historyKind.includes('unknown-user')){row.className='';row.removeAttribute('role');}}
          else if(named){row.removeAttribute('data-message-id');row.setAttribute('role','article');if(role==='user'){row.className='group/user-message';row.id='turn-'+serial+'-user-message';}else if(historyKind==='named-ai-group')row.className='group/ai-message';else row.dataset.testid='ai-message';}
          else{row.dataset.content=role==='user'?'user-message':'ai-message';row.setAttribute('role','button');}
        }else row.dataset.role=role;
        if(copilot && role==='user'){
          const body=document.createElement('p'),meta=document.createElement('span'),actions=document.createElement('div'),copy=document.createElement('button');if(microsoft)body.dataset.testid='chatOutput';else if(named)body.className='max-w-user-text-message';else body.dataset.testid='user-message-text';
          const truncated=(historyKind==='truncated-disclosure'||historyKind==='named-groups-truncated') && text.length>160;body.textContent=truncated?text.slice(0,110)+'…':text;body.style.cssText='max-height:50px;overflow:hidden';row.setAttribute('aria-expanded','false');
          meta.textContent='You said · 12:00';if(named||microsoft){meta.setAttribute('data-copy','false');actions.dataset.testid='user-message-reactions';}else actions.className='msg-actions';copy.type='button';copy.textContent='Copy';copy.onclick=event=>{event.stopPropagation();window.copyClicks++;};actions.append(copy);row.append(meta,body,actions);
          const expand=()=>{window.historyExpands++;body.textContent=text;row.setAttribute('aria-expanded','true');};
          if(named){row.removeAttribute('aria-expanded');if(truncated){body.id='echo-'+serial;const toggle=document.createElement('button');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',body.id);toggle.textContent='Show more';toggle.onclick=()=>{expand();toggle.setAttribute('aria-expanded','true');};row.append(toggle);}}else row.onclick=expand;
        }else if(microsoft){
          const host=document.createElement('div');host.dataset.testid='markdown-reply';row.append(host);const body=historyKind.includes('shadow')?host.attachShadow({mode:'open'}):host;
          if(code&&historyKind.includes('scriptor')){
            if(historyKind.endsWith('multiline')){const value=JSON.parse(text);if(value.command==='list_commands')delete value.params;text=JSON.stringify(value,null,2);}
            const group=document.createElement('section'),editor=document.createElement('div'),header=document.createElement('span'),copy=document.createElement('button');group.setAttribute('aria-label','Code preview');header.textContent='JSON';copy.type='button';copy.textContent='Copy code';copy.onclick=()=>window.copyClicks++;group.append(header,copy,editor);editor.className='scriptor-component-code-block';editor.dataset.lineCount=String(text.split('\n').length);
            for(const [index,line] of text.split('\n').entries()){const paragraph=document.createElement('div'),number=document.createElement('span');paragraph.className='scriptor-paragraph';paragraph.dataset.lineNumber=String(index+1);number.className='line-number';number.textContent=String(index+1);paragraph.append(number);for(const part of [line.slice(0,Math.floor(line.length/2)),line.slice(Math.floor(line.length/2))]){const run=document.createElement('span');run.className='scriptor-textRun';run.textContent=part;paragraph.append(run);}editor.append(paragraph);}body.append(group);
          }else if(code){const pre=document.createElement('pre'),node=document.createElement('code');node.textContent=text;pre.append(node);body.append(pre);}else body.textContent=text;
        }else if(code){const body=document.createElement('div');body.className=named?'group/ai-message-item':'markdown';const node=document.createElement(copilot?'pre':'code');node.textContent=text;body.append(node);row.append(body);}else row.textContent=text;
        thread.append(row);
      }
      if(copilot)ed.onpaste=event=>{event.preventDefault();model=event.clipboardData.getData('text/plain');ed.textContent=model+'\u200B\u200C';send.disabled=!model;};
      ed.oninput=event=>{if(!copilot || event.isTrusted){model=copilot?ed.textContent:ed.value;send.disabled=!model;}};
      send.onclick=()=>{
        window.nativeSendClicks++;
        const text=model;window.nativeSent.push(text);add('user',text+(copilot?'\u200B\u200C':''));model='';if(copilot)ed.textContent='';else ed.value='';send.disabled=true;
        if(!copilot && window.nativeSent.length===1)history.replaceState({},'','/playground/first-saved-chat');
        if(copilot && (named||microsoft) && window.nativeSent.length===1)history.replaceState({},'','/chat/conversation/first-saved-chat?fromcode=example&prompt=login&hasLW=false');
        if(historyKind.includes('refusal')){add('assistant','I cannot participate in or control external browser extensions by emitting structured commands for them.');return;}
        const part=text.match(/PlazCode startup context part (\d+)\/(\d+)\./);
        if(part)add('assistant',part[1]===part[2]?'PlazCode is ready.':`PlazCode startup part ${part[1]}/${part[2]} received.`);
        else if(text.includes("Output of 'get_studio_state'"))add('assistant','Odczyt potwierdził Workspace.Solaris.');
        else if(text.includes('Czy widzisz'))add('assistant','{"command":"get_studio_state","params":{}}',true);
        else if(!copilot)add('assistant','PlazCode is ready.');
        else add('assistant','{"command":"list_commands","params":{}}',true);
      };
      const storage={rsSetupSeen:true},status={ok:true,connected:true,roblox_connected:true,local_connected:false,mcpAlive:true,studio:true,studioApp:true,studioProc:true,robloxProc:true,engine:'roblox',tools:1,servers:[{id:'roblox',alive:true,tools:1}]};
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
    },{copilot,version:manifest.version,historyKind});
    for(const script of scripts){
      await page.addScriptTag({content:fs.readFileSync(script==='providers/webchats.js' && process.env.PLAZCODE_TEST_PROVIDER || path.join(root,script),'utf8')});
      if(script==='providers/webchats.js')await page.evaluate(()=>Object.assign(RSProvider.timings,{GEN_IDLE_MS:20,STABLE_MS:40,REASON_IDLE_MS:100}));
    }
    await page.addStyleTag({content:fs.readFileSync(path.join(root,'overlay.css'),'utf8')});
    await page.locator('#rs-action[data-kind="start"]:enabled').waitFor({timeout:15000});await page.locator('#rs-action').click();
    if(historyKind.includes('refusal')){
      await page.locator('.rs-banner-t').filter({hasText:'AI declined the connection request'}).waitFor({timeout:20000});
      await page.waitForFunction(()=>/^(start|restart)$/.test(document.querySelector('#rs-action')?.dataset.kind||'') && !document.querySelector('#rs-action').disabled && /Not connected/.test(document.querySelector('#rs-bar')?.textContent||''));
      assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),false);assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),[]);assert.equal(await page.evaluate(()=>window.nativeSent.length),1);assert.equal(await page.evaluate(()=>window.nativeSendClicks),1);assert.equal(await page.evaluate(()=>RSProvider.editorText()),'');assert.deepEqual(errors,[]);
      const titles=await page.locator('.rs-banner-t').allTextContents();assert.deepEqual(titles,['AI declined the connection request']);
      passed++;console.log(host+' '+historyKind+': exact refusal stops startup, no correction, context or tool call');continue;
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
    if(copilot)assert.equal(bootstrap.sent[0].length,552);else assert.ok(bootstrap.sent.some(text=>text.includes('extension fetched this command reference')));
    const ed=page.locator('#native-editor');await ed.fill('Czy widzisz pliki w Studio?');await page.locator('#native-send').click();
    await page.waitForFunction(()=>window.nativeSent.some(text=>text.includes("Output of 'get_studio_state'")),{timeout:15000});
    await page.waitForFunction(()=>document.querySelector('#rs-action')?.dataset.kind==='restart' && RSProvider.editorText()==='',{timeout:15000});
    assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),['get_studio_state']);assert.deepEqual(errors,[]);
    const delivery=await page.evaluate(()=>({sendClicks:window.nativeSendClicks,sent:window.nativeSent.length,expands:window.historyExpands,expectedExpands:window.nativeSent.filter(text=>text.length>158).length,copies:window.copyClicks,duplicates:window.nativeSent.length-new Set(window.nativeSent).size}));assert.equal(delivery.sendClicks,delivery.sent);assert.equal(delivery.copies,0);assert.equal(delivery.duplicates,0);assert.equal(delivery.expands,historyKind.endsWith('truncated')||historyKind==='truncated-disclosure'?delivery.expectedExpands:0);
    passed++;console.log(host+' '+historyKind+': full UI Start, confirmed context and one native user read passed');
   }catch(error){console.error(await page.evaluate(()=>({bar:document.querySelector('#rs-bar')?.textContent,sent:window.nativeSent?.map(text=>text.slice(0,90)),calls:window.bridgeCalls,messages:window.backgroundMessages,body:document.body.textContent.slice(-1500)})));throw error;}finally{await page.close();}
  }
  assert.ok(passed>0);console.log(passed+' full UI startup checks passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
