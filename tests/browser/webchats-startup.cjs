// Actual content-script bundle and UI in Chromium. The page, model and bridge
// are controlled; this is not authenticated Arcee/Copilot or Studio coverage.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const scripts=manifest.content_scripts.find(group=>group.js.includes('providers/webchats.js')).js;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const host of ['copilot.com','platform.arcee.ai']){
   const copilot=host==='copilot.com',page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><main><section id="thread"></section><form id="native-form">'+(copilot?'<div id="native-editor" contenteditable="true" aria-label="Message Copilot"></div>':'<textarea id="native-editor" placeholder="Send a message"></textarea>')+'<button type="button" id="native-send" aria-label="Send" disabled>Send</button></form></main>'}));
    await page.goto('https://'+host+(copilot?'/chat':'/playground'));
    await page.addStyleTag({content:'body{background:#171717;color:white;margin:0}#native-form{position:fixed;bottom:12px;left:10%;width:80%;display:flex}#native-editor{white-space:pre-wrap;min-height:50px;max-height:150px;overflow:auto;flex:1;background:#333;color:white}#thread{max-height:550px;overflow:auto;padding:10px}'});
    await page.evaluate(({copilot,version})=>{
      const ed=document.querySelector('#native-editor'),send=document.querySelector('#native-send'),thread=document.querySelector('#thread');let model='',serial=0;
      window.nativeSent=[];window.bridgeCalls=[];window.backgroundMessages=[];
      function add(role,text,code=false){const row=document.createElement('div');row.dataset.role=role;row.dataset.messageId=role+'-'+(++serial);if(code){const body=document.createElement('div');body.className='markdown';const node=document.createElement(copilot?'pre':'code');node.textContent=text;body.append(node);row.append(body);}else row.textContent=text;thread.append(row);}
      if(copilot)ed.onpaste=event=>{event.preventDefault();model=event.clipboardData.getData('text/plain');ed.textContent=model+'\u200B\u200C';send.disabled=!model;};
      ed.oninput=event=>{if(!copilot || event.isTrusted){model=copilot?ed.textContent:ed.value;send.disabled=!model;}};
      send.onclick=()=>{
        const text=model;window.nativeSent.push(text);add('user',text+(copilot?'\u200B\u200C':''));model='';if(copilot)ed.textContent='';else ed.value='';send.disabled=true;
        if(!copilot && window.nativeSent.length===1)history.replaceState({},'','/playground/first-saved-chat');
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
    },{copilot,version:manifest.version});
    for(const script of scripts){
      await page.addScriptTag({content:fs.readFileSync(script==='providers/webchats.js' && process.env.PLAZCODE_TEST_PROVIDER || path.join(root,script),'utf8')});
      if(script==='providers/webchats.js')await page.evaluate(()=>Object.assign(RSProvider.timings,{GEN_IDLE_MS:20,STABLE_MS:40,REASON_IDLE_MS:100}));
    }
    await page.addStyleTag({content:fs.readFileSync(path.join(root,'overlay.css'),'utf8')});
    await page.locator('#rs-action[data-kind="start"]:enabled').waitFor({timeout:15000});await page.locator('#rs-action').click();
    await page.waitForFunction(()=>document.querySelector('#rs-action')?.dataset.kind==='restart',{timeout:30000});
    assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),true);
    const bootstrap=await page.evaluate(()=>({sent:window.nativeSent,editor:RSProvider.editorText(),calls:window.bridgeCalls}));
    assert.equal(bootstrap.editor,'');assert.deepEqual(bootstrap.calls,[]);assert.equal(bootstrap.sent.filter(text=>text===bootstrap.sent[0]).length,1);
    if(copilot)assert.equal(bootstrap.sent[0].length,552);else assert.ok(bootstrap.sent.some(text=>text.includes('extension fetched this command reference')));
    const ed=page.locator('#native-editor');await ed.fill('Czy widzisz pliki w Studio?');await page.locator('#native-send').click();
    await page.waitForFunction(()=>window.nativeSent.some(text=>text.includes("Output of 'get_studio_state'")),{timeout:15000});
    await page.waitForFunction(()=>document.querySelector('#rs-action')?.dataset.kind==='restart' && RSProvider.editorText()==='',{timeout:15000});
    assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),['get_studio_state']);assert.deepEqual(errors,[]);
    console.log(host+': full UI Start, confirmed context and one native user read passed');
   }catch(error){console.error(await page.evaluate(()=>({bar:document.querySelector('#rs-bar')?.textContent,sent:window.nativeSent?.map(text=>text.slice(0,90)),calls:window.bridgeCalls,messages:window.backgroundMessages,body:document.body.textContent.slice(-1500)})));throw error;}finally{await page.close();}
  }
  console.log('2 full UI startup checks passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
