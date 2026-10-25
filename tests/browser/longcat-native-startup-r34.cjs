// Actual default editor models plus the user-supplied .ai placeholder and SVG
// markers. Transcript markup is from public LongCat .chat clients, not a dump
// of the user's conversation. Model and Studio bridge are controlled.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const scripts=manifest.content_scripts.find(group=>group.js.includes('providers/webchats.js')).js;
const deps=process.env.PLAZCODE_BROWSER_DEPS||'/tmp/plazcode-ui-r19',pm=process.env.PLAZCODE_PM_DEPS||'/tmp/plazcode-pm-r31',tiptap=process.env.PLAZCODE_TIPTAP_DEPS||'/tmp/plazcode-tiptap-r34';
const {buildSync}=require(path.join(deps,'node_modules/esbuild'));
const fixture=buildSync({entryPoints:[path.join(__dirname,'fixtures/longcat-native-editor.js')],bundle:true,write:false,format:'iife',nodePaths:[path.join(tiptap,'node_modules'),path.join(pm,'node_modules')]}).outputFiles[0].text;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});let passed=0;
 try{
  for(const kind of ['tiptap','prosemirror']){
   const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/*',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta charset="utf-8"><div id="app"><section class="message-list"></section><section class="chat-input-container"><div id="editor-host"></div><div class="chat-input-footer"><div id="native-action"><svg data-v-641b0c80="" data-v-aa909a2a="" class="svg-icon send-icon" aria-hidden="true" width="14px" height="14px"><use data-v-641b0c80="" href="#icon-send" fill="currentColor"></use></svg></div></div></section></div>'}));
    await page.goto('https://longcat.ai/chat/t');await page.addStyleTag({content:'body{margin:0;background:#fafafa}.message-list{padding:20px;height:570px;overflow:auto}.chat-input-container{position:fixed;bottom:20px;left:20%;width:65%;padding:12px;border:1px solid #aaa;background:white;border-radius:12px}.ProseMirror{white-space:pre-wrap;min-height:55px;max-height:120px;overflow:auto}.ProseMirror p{margin:0}.chat-input-footer{display:flex;justify-content:end;height:32px}#native-action{width:32px;height:32px;display:grid;place-items:center;cursor:pointer}svg{width:14px;height:14px}.md-show-container{margin:12px 0}'});
    await page.addScriptTag({content:fixture});
    await page.evaluate(({kind,version})=>{
      mountNativeLongcatEditor(document.querySelector('#editor-host'),kind);window.sent=[];window.calls=[];window.stops=0;window.copyClicks=0;
      const list=document.querySelector('.message-list'),icon=document.querySelector('#native-action use');
      const add=(role,text,code=false)=>{
        const row=document.createElement('section');row.className=role==='user'?'v-chat-user-message':'md-show-container';
        const body=document.createElement('div');body.className=role==='user'?'user-text':'mt-markdown-body';
        if(code){const wrap=document.createElement('div'),header=document.createElement('div'),copy=document.createElement('div'),lang=document.createElement('div'),source=document.createElement('code');header.className='code-block-header';copy.className='code-block-header__copy';copy.textContent='Copy';copy.onclick=()=>window.copyClicks++;lang.className='code-block-header__lang';lang.textContent='json';source.className='code-block-body';source.textContent=text;header.append(lang,copy);wrap.append(header,source);body.append(wrap);}else body.textContent=text;
        row.append(body);list.append(row);
        for(const name of ['v-chat-user-message','md-show-container']){const rows=[...list.querySelectorAll(':scope > .'+name)];while(rows.length>4)rows.shift().remove();}
      };
      document.querySelector('#native-action').onclick=()=>{
        if(icon.getAttribute('href')==='#icon-stop'){window.stops++;icon.setAttribute('href','#icon-send');return;}
        const text=modelText();if(!text.trim())return;window.sent.push(text);add('user',text);clearModel();icon.setAttribute('href','#icon-stop');
        setTimeout(()=>{
          const part=text.match(/PlazCode startup context part (\d+)\/(\d+)\./);
          if(part)add('assistant',part[1]===part[2]?'PlazCode is ready.':`PlazCode startup part ${part[1]}/${part[2]} received.`);
          else if(text.includes("Output of 'get_studio_state'"))add('assistant','Studio returned Workspace.Solaris.');
          else if(text.includes('Czy widzisz'))add('assistant','{"command":"get_studio_state","params":{}}',true);
          else add('assistant','{"command":"list_commands","params":{}}',true);
          icon.setAttribute('href','#icon-send');
        },80);
      };
      const storage={rsSetupSeen:true,rsAutoFix:false},status={ok:true,connected:true,roblox_connected:true,local_connected:false,mcpAlive:true,studio:true,studioApp:true,studioProc:true,robloxProc:true,engine:'roblox',tools:1,servers:[{id:'roblox',alive:true,tools:1}]};
      const reply=message=>{if(['status','live-status'].includes(message.type))return status;if(message.type==='list_tools')return {ok:true,tools:[{name:'get_studio_state',server:'roblox',description:'Read Studio',inputSchema:{type:'object',properties:{}}}]};if(message.type==='rs-get-engine')return {engine:'roblox'};if(message.type==='call_tool'){window.calls.push(message.name);return {ok:true,text:'{"mode":"Edit","path":"Workspace.Solaris"}'};}return {ok:true,memories:[],skills:[],items:[],entries:[],tools:[],text:''};};
      window.chrome={runtime:{id:'longcat-r34-native',getManifest:()=>({version}),getURL:name=>location.origin+'/__extension/'+name,onMessage:{addListener(){}},sendMessage:(message,callback)=>{const result=reply(message);if(callback){queueMicrotask(()=>callback(result));return;}return Promise.resolve(result);}},storage:{local:{get:(key,callback)=>{if(callback)callback({...storage});else return Promise.resolve({...storage});},set:(value,callback)=>{Object.assign(storage,value);callback?.();return Promise.resolve();}},onChanged:{addListener(){}}},i18n:{getMessage:()=>''}};
    },{kind,version:manifest.version});
    for(const script of scripts){await page.addScriptTag({content:fs.readFileSync(script==='providers/webchats.js'&&process.env.PLAZCODE_TEST_PROVIDER||path.join(root,script),'utf8')});if(script==='providers/webchats.js')await page.evaluate(()=>Object.assign(RSProvider.timings,{GEN_IDLE_MS:20,STABLE_MS:40,REASON_IDLE_MS:100}));}
    await page.addStyleTag({content:fs.readFileSync(path.join(root,'overlay.css'),'utf8')});await page.waitForSelector('#rs-bar');
    if(process.env.PLAZCODE_EXPECT_EDITOR_MISSING==='1'){
      assert.ok(process.env.PLAZCODE_TEST_PROVIDER);assert.equal(await page.evaluate(()=>!!RSProvider.getEditor()),false);assert.equal(await page.locator('#rs-action').isDisabled(),true);assert.equal(await page.evaluate(()=>window.sent.length),0);passed++;console.log(kind+': r33 reproduces unrecognized native LongCat editor');continue;
    }
    assert.equal(await page.evaluate(()=>!!RSProvider.getEditor()),true);assert.equal(await page.evaluate(()=>RSProvider.modeWarning()),'');
    await page.locator('#rs-action[data-kind="start"]:enabled').waitFor({timeout:15000});await page.locator('#rs-action').click();
    await page.waitForFunction(()=>RSProvider.canRestoreSession()&&document.querySelector('#rs-action')?.dataset.kind==='restart',{timeout:45000});
    const startup=await page.evaluate(()=>({sent:window.sent,model:modelText(),editor:RSProvider.editorText(),calls:window.calls}));assert.equal(startup.editor,'');assert.equal(startup.model,'');assert.deepEqual(startup.calls,[]);assert.equal(startup.sent.filter(value=>value===startup.sent[0]).length,1);assert.ok(startup.sent.length>4);
    const parts=startup.sent.slice(1).map(value=>value.match(/PlazCode startup context part (\d+)\/(\d+)\./));assert.ok(parts.every(Boolean));assert.equal(parts.length,Number(parts[0][2]));assert.deepEqual(parts.map(part=>Number(part[1])),parts.map((_,index)=>index+1));
    await page.locator('.ProseMirror').fill('Czy widzisz pliki w Studio?');await page.waitForFunction(()=>modelText()==='Czy widzisz pliki w Studio?');await page.locator('#native-action svg').click();
    await page.waitForFunction(()=>window.sent.some(value=>value.includes("Output of 'get_studio_state'")),{timeout:20000});await page.waitForFunction(()=>!RSProvider.isGenerating()&&RSProvider.editorText()==='',{timeout:15000});
    assert.deepEqual(await page.evaluate(()=>window.calls),['get_studio_state']);assert.equal(await page.evaluate(()=>window.copyClicks),0);assert.equal(await page.evaluate(()=>window.sent.length-new Set(window.sent).size),0);assert.deepEqual(await page.locator('.rs-banner-t').allTextContents(),[]);
    await page.evaluate(()=>document.querySelector('#native-action use').setAttribute('href','#icon-stop'));assert.equal(await page.evaluate(()=>RSProvider.isHardGenerating()),true);await page.evaluate(()=>RSProvider.stopGeneration());assert.equal(await page.evaluate(()=>window.stops),1);assert.equal(await page.evaluate(()=>RSProvider.isHardGenerating()),false);assert.deepEqual(errors,[]);
    passed++;console.log(kind+': native SVG controls, full startup, all context parts, four-turn window, one Studio read and Stop passed');
   }catch(error){console.error(kind,await page.evaluate(()=>({bar:document.querySelector('#rs-bar')?.textContent,banners:[...document.querySelectorAll('.rs-banner')].map(node=>node.textContent),sent:window.sent?.map(value=>({chars:value.length,head:value.slice(0,90)})),calls:window.calls,editor:typeof RSProvider!=='undefined'?RSProvider.editorText():null,model:typeof modelText==='function'?modelText():null})));throw error;}finally{await page.close();}
  }
  console.log(passed+' native LongCat full UI checks passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
