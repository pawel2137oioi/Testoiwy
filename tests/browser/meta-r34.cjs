// Full extension startup with publicly documented Meta native controls and the
// user's exact refusal. Controlled page/model/bridge; no live Meta account.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const scripts=manifest.content_scripts.find(group=>group.js.includes('providers/webchats.js')).js;
const refusal="I can't participate in that external agent workflow where a browser extension reads structured commands from my replies.\n\nThat pattern would let an outside tool execute actions based on my output, which I can't do. I'm happy to help directly with your Roblox Studio project here in chat — for example, writing or reviewing Lua, explaining APIs, or debugging — if you paste the code or describe what you'd want to build.";
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});let passed=0;
 try{
  for(const fullEcho of [true,false]){
   const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/*',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8"><main><section id="thread"></section><section id="native-composer"><textarea placeholder="Zapytaj Meta AI…"></textarea><div role="button" tabindex="0" aria-label="Wyślij wiadomość" aria-disabled="true">↑</div></section></main>'}));
    await page.goto('https://www.meta.ai/prompt/native-meta');
    await page.addStyleTag({content:'body{background:#171717;color:white;margin:0}#native-composer{position:fixed;bottom:20px;left:20%;width:65%;display:flex}textarea{height:70px;flex:1}#native-composer>[role=button]{width:40px;height:40px}#thread{padding:24px;max-height:600px;overflow:auto}'});
    await page.evaluate(({version,refusal,fullEcho})=>{
      window.sent=[];window.bridgeCalls=[];const ed=document.querySelector('textarea'),send=document.querySelector('#native-composer>[role=button]');let model='';
      ed.oninput=()=>{model=ed.value;send.setAttribute('aria-disabled',model?'false':'true');};
      send.onclick=()=>{window.sent.push(model);const user=document.createElement('article');user.dataset.messageRole='user';user.textContent=fullEcho?model:model.slice(0,110)+'…';document.querySelector('#thread').append(user);model='';ed.value='';send.setAttribute('aria-disabled','true');const answer=document.createElement('section');answer.className='ur-markdown';answer.textContent=refusal;document.querySelector('#thread').append(answer);};
      const storage={rsSetupSeen:true,rsAutoFix:false},status={ok:true,connected:true,roblox_connected:true,local_connected:false,mcpAlive:true,studio:true,studioApp:true,studioProc:true,robloxProc:true,engine:'roblox',tools:1,servers:[{id:'roblox',alive:true,tools:1}]};
      const reply=message=>{
        if(['status','live-status'].includes(message.type))return status;
        if(message.type==='list_tools')return {ok:true,tools:[{name:'get_studio_state',server:'roblox',description:'Read Studio',inputSchema:{type:'object',properties:{}}}]};
        if(message.type==='rs-get-engine')return {engine:'roblox'};
        if(message.type==='call_tool'){window.bridgeCalls.push(message.name);return {ok:true,text:'{}'};}
        return {ok:true,memories:[],skills:[],entries:[],items:[],tools:[],text:''};
      };
      window.chrome={runtime:{id:'meta-r34-fixture',getManifest:()=>({version}),getURL:name=>location.origin+'/__extension/'+name,onMessage:{addListener(){}},sendMessage:(message,callback)=>{const result=reply(message);if(callback){queueMicrotask(()=>callback(result));return;}return Promise.resolve(result);}},storage:{local:{get:(key,callback)=>{if(callback)callback({...storage});else return Promise.resolve({...storage});},set:(value,callback)=>{Object.assign(storage,value);callback?.();return Promise.resolve();}},onChanged:{addListener(){}}},i18n:{getMessage:()=>''}};
    },{version:manifest.version,refusal,fullEcho});
    for(const script of scripts){
      await page.addScriptTag({content:fs.readFileSync(script==='providers/webchats.js'&&process.env.PLAZCODE_TEST_PROVIDER||path.join(root,script),'utf8')});
      if(script==='providers/webchats.js')await page.evaluate(()=>Object.assign(RSProvider.timings,{GEN_IDLE_MS:20,STABLE_MS:40,REASON_IDLE_MS:100}));
    }
    await page.addStyleTag({content:fs.readFileSync(path.join(root,'overlay.css'),'utf8')});
    await page.locator('#rs-action[data-kind="start"]:enabled').waitFor({timeout:15000});await page.locator('#rs-action').click();
    await page.locator('.rs-banner-t').filter({hasText:'AI declined the connection request'}).waitFor({timeout:20000});
    await page.waitForFunction(()=>/^(start|restart)$/.test(document.querySelector('#rs-action')?.dataset.kind||'')&&!document.querySelector('#rs-action').disabled);
    assert.deepEqual(await page.locator('.rs-banner-t').allTextContents(),['AI declined the connection request']);assert.match(await page.locator('.rs-banner').innerText(),/Meta AI declined the PlazCode connection request/);assert.equal(await page.evaluate(()=>window.sent.length),1);assert.deepEqual(await page.evaluate(()=>window.bridgeCalls),[]);assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),false);assert.equal(await page.evaluate(()=>RSProvider.editorText()),'');assert.equal(await page.locator('#native-composer textarea').evaluate(node=>node.readOnly),false);assert.deepEqual(errors,[]);
    passed++;console.log('Meta native .ur-markdown + localized role Send, '+(fullEcho?'full echo':'truncated echo')+': exact refusal shown once; no retry or project command');
   }catch(error){console.error(await page.evaluate(()=>({bar:document.querySelector('#rs-bar')?.textContent,banners:[...document.querySelectorAll('.rs-banner')].map(node=>node.textContent),sent:window.sent,users:RSProvider.userCount(),assistants:RSProvider.assistantCount(),reply:RSProvider.readAssistant().reply,editor:RSProvider.editorText(),busy:RSProvider.isGenerating(),body:document.body.textContent.slice(-1800)})));throw error;}finally{await page.close();}
  }
  console.log(passed+' Meta full UI refusal checks passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
