// Full extension checks for documented Meta native hooks: localized semantic
// role buttons, a Meta AI textarea, .ur-markdown and legacy user wrappers.
// The page, model and Studio bridge are controlled; no live account is used.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const scripts=manifest.content_scripts.find(group=>group.js.includes('providers/webchats.js')).js;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});let passed=0;
 try{
  for(const scenario of ['roles','legacy','unavailable','legacy-late']){
   const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/*',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8"><main><section id="thread" class="flex flex-col"></section><section id="native-composer"><textarea placeholder="Zapytaj Meta AI…"></textarea><div role="button" tabindex="0" aria-label="Wyślij wiadomość" aria-disabled="true" hidden>↑</div></section></main>'}));
    await page.goto('https://www.meta.ai/');await page.addStyleTag({content:'body{background:#171717;color:white;margin:0}#native-composer{position:fixed;bottom:20px;left:20%;width:65%;display:flex}textarea{height:70px;flex:1}#native-composer>[role=button]{width:40px;height:40px}#thread{padding:24px;max-height:570px;overflow:auto}.ur-markdown{margin:12px 0}'});
    await page.evaluate(({version,scenario})=>{
      window.sent=[];window.calls=[];window.stops=0;window.copyClicks=0;window.generated=0;
      const ed=document.querySelector('textarea'),send=document.querySelector('#native-composer>[role=button]'),thread=document.querySelector('#thread');let model='';
      const update=()=>{send.hidden=false;send.setAttribute('aria-disabled',model&&scenario!=='unavailable'?'false':'true');};
      ed.oninput=()=>{model=ed.value;update();};
      const add=(role,text,code=false)=>{
        const row=document.createElement('section');row.className=role==='user'?'starting:opacity-0':'ur-markdown';
        if(role==='user'&&scenario==='roles')row.dataset.messageRole='user';
        if(code){const pre=document.createElement('pre'),source=document.createElement('code'),copy=document.createElement('button');copy.textContent='Copy';copy.onclick=()=>window.copyClicks++;source.textContent=text;pre.append(source);row.append(copy,pre);}else row.textContent=text;
        thread.append(row);
        if(scenario==='legacy')for(const kind of ['user','assistant']){const rows=[...thread.children].filter(node=>kind==='user'?node.classList.contains('starting:opacity-0'):node.classList.contains('ur-markdown'));while(rows.length>4)rows.shift().remove();}
      };
      send.onclick=()=>{
        if(send.getAttribute('aria-label')==='Zatrzymaj generowanie'){window.stops++;send.setAttribute('aria-label','Wyślij wiadomość');update();return;}
        if(send.getAttribute('aria-disabled')==='true'||!model.trim())return;
        const text=model;window.sent.push(text);add('user',text);model='';ed.value='';history.replaceState({},'','/prompt/native-meta');send.setAttribute('aria-label','Zatrzymaj generowanie');send.setAttribute('aria-disabled','false');
        setTimeout(()=>{
          const part=text.match(/PlazCode startup context part (\d+)\/(\d+)\./);
          if(part)add('assistant',part[1]===part[2]?'PlazCode is ready.':`PlazCode startup part ${part[1]}/${part[2]} received.`);
          else if(text.includes("Output of 'get_studio_state'"))add('assistant','Studio returned Workspace.Solaris.');
          else if(text.includes('Czy widzisz'))add('assistant','{"command":"get_studio_state","params":{}}',true);
          else add('assistant','{"command":"list_commands","params":{}}',true);
          window.generated++;send.setAttribute('aria-label','Wyślij wiadomość');update();
        },scenario==='legacy-late'&&window.sent.length===1?13200:80);
      };
      const storage={rsSetupSeen:true,rsAutoFix:false},status={ok:true,connected:true,roblox_connected:true,local_connected:false,mcpAlive:true,studio:true,studioApp:true,studioProc:true,robloxProc:true,engine:'roblox',tools:1,servers:[{id:'roblox',alive:true,tools:1}]};
      const reply=message=>{if(['status','live-status'].includes(message.type))return status;if(message.type==='list_tools')return {ok:true,tools:[{name:'get_studio_state',server:'roblox',description:'Read Studio',inputSchema:{type:'object',properties:{}}}]};if(message.type==='rs-get-engine')return {engine:'roblox'};if(message.type==='call_tool'){window.calls.push(message.name);return {ok:true,text:'{"mode":"Edit","path":"Workspace.Solaris"}'};}return {ok:true,memories:[],skills:[],entries:[],items:[],tools:[],text:''};};
      window.chrome={runtime:{id:'meta-r34-native',getManifest:()=>({version}),getURL:name=>location.origin+'/__extension/'+name,onMessage:{addListener(){}},sendMessage:(message,callback)=>{const result=reply(message);if(callback){queueMicrotask(()=>callback(result));return;}return Promise.resolve(result);}},storage:{local:{get:(key,callback)=>{if(callback)callback({...storage});else return Promise.resolve({...storage});},set:(value,callback)=>{Object.assign(storage,value);callback?.();return Promise.resolve();}},onChanged:{addListener(){}}},i18n:{getMessage:()=>''}};
    },{version:manifest.version,scenario});
    for(const script of scripts){await page.addScriptTag({content:fs.readFileSync(script==='providers/webchats.js'&&process.env.PLAZCODE_TEST_PROVIDER||path.join(root,script),'utf8')});if(script==='providers/webchats.js')await page.evaluate(()=>Object.assign(RSProvider.timings,{GEN_IDLE_MS:20,STABLE_MS:40,REASON_IDLE_MS:100}));}
    await page.addStyleTag({content:fs.readFileSync(path.join(root,'overlay.css'),'utf8')});
    assert.equal(await page.evaluate(()=>!!RSProvider.getEditor()),true);assert.equal(await page.locator('#native-composer>[role=button]').isVisible(),false);
    await page.locator('#rs-action[data-kind="start"]:enabled').waitFor({timeout:15000});await page.locator('#rs-action').click();
    if(scenario==='unavailable'){
      await page.locator('.rs-banner-t').filter({hasText:'Startup failed'}).waitFor({timeout:20000});
      const message=await page.locator('.rs-banner-m').textContent();assert.match(message,/send is unavailable/);
      assert.equal(await page.evaluate(()=>window.sent.length),0);assert.deepEqual(await page.evaluate(()=>window.calls),[]);assert.equal(await page.evaluate(()=>RSProvider.canRestoreSession()),false);assert.equal(await page.locator('#native-composer textarea').evaluate(node=>node.readOnly),false);
      await page.locator('.rs-copy-failure-report').click();const report=JSON.parse(await page.locator('.rs-failure-report').textContent());
      const composer=report.provider_diagnostics.last_failure.snapshot.composer;assert.equal(composer.detected,true);assert.equal(composer.counts.reported_editors,1);assert.ok(composer.editors[0].controls.some(control=>control.disabled===true));
      const draft=await page.evaluate(()=>RSProvider.editorText());assert.ok(draft.length>100);assert.equal(JSON.stringify(composer).includes(draft),false);assert.equal(await page.evaluate(()=>window.sent.length),0);
      assert.deepEqual(errors,[]);passed++;console.log('Meta unavailable: truthful startup failure, input unlocked, no retry or project call; redacted composer report available');continue;
    }
    await page.waitForFunction(()=>RSProvider.canRestoreSession()&&document.querySelector('#rs-action')?.dataset.kind==='restart',null,{timeout:45000});
    const startup=await page.evaluate(()=>({sent:window.sent,editor:RSProvider.editorText(),calls:window.calls}));assert.equal(startup.editor,'');assert.deepEqual(startup.calls,[]);assert.ok(startup.sent.length>4);assert.equal(startup.sent.filter(value=>value===startup.sent[0]).length,1);
    const parts=startup.sent.slice(1).map(value=>value.match(/PlazCode startup context part (\d+)\/(\d+)\./));assert.ok(parts.every(Boolean));assert.equal(parts.length,Number(parts[0][2]));assert.deepEqual(parts.map(part=>Number(part[1])),parts.map((_,index)=>index+1));
    await page.locator('#native-composer textarea').fill('Czy widzisz pliki w Studio?');await page.locator('#native-composer>[role=button]').click();
    await page.waitForFunction(()=>window.sent.some(value=>value.includes("Output of 'get_studio_state'")),null,{timeout:20000});await page.waitForFunction(()=>!RSProvider.isGenerating()&&RSProvider.editorText()==='',null,{timeout:15000});
    assert.deepEqual(await page.evaluate(()=>window.calls),['get_studio_state']);assert.equal(await page.evaluate(()=>window.copyClicks),0);assert.equal(await page.evaluate(()=>window.sent.length-new Set(window.sent).size),0);assert.deepEqual(await page.locator('.rs-banner-t').allTextContents(),[]);
    await page.evaluate(()=>document.querySelector('#native-composer>[role=button]').setAttribute('aria-label','Zatrzymaj generowanie'));assert.equal(await page.evaluate(()=>RSProvider.isHardGenerating()),true);await page.evaluate(()=>RSProvider.stopGeneration());assert.equal(await page.evaluate(()=>window.stops),1);assert.equal(await page.evaluate(()=>RSProvider.isHardGenerating()),false);assert.deepEqual(errors,[]);
    passed++;console.log('Meta '+scenario+': empty native field, hidden Send, first saved route, all context parts, one Studio read and localized Stop passed');
   }catch(error){console.error(scenario,await page.evaluate(()=>({bar:document.querySelector('#rs-bar')?.textContent,banners:[...document.querySelectorAll('.rs-banner')].map(node=>node.textContent),sent:window.sent?.map(value=>({chars:value.length,head:value.slice(0,90)})),calls:window.calls,editor:typeof RSProvider!=='undefined'?RSProvider.editorText():null})));throw error;}finally{await page.close();}
  }
  console.log(passed+' native Meta full UI checks passed (including delayed first native legacy reply)');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
