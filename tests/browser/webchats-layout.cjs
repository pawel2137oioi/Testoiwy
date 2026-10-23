// SPDX-License-Identifier: GPL-3.0-or-later
// Actual content-script bundle + overlay CSS in Chromium, controlled native
// chats and disconnected bridge. No authenticated site/model/Studio claim.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
const scripts=manifest.content_scripts.find(g=>g.js.includes('providers/webchats.js')).js.map(name=>({name,content:fs.readFileSync(path.join(root,name),'utf8')}));
const css=fs.readFileSync(path.join(root,'overlay.css'),'utf8');
const arcee=fs.readFileSync(path.join(root,'tests/fixtures/arcee-composer.html'),'utf8');
async function install(page){
  await page.evaluate(version=>{
    const storage={rsSetupSeen:true};window.chrome={
      runtime:{id:'plazcode-layout-test',getManifest:()=>({version}),getURL:p=>location.origin+'/__extension/'+p,onMessage:{addListener(){}},
        sendMessage:(message,callback)=>{const reply={ok:false,error:'Test bridge disconnected'};if(callback){callback(reply);return;}return Promise.resolve(reply);}},
      storage:{local:{get:(key,callback)=>{if(callback)callback({...storage});else return Promise.resolve({...storage});},set:(value,callback)=>{Object.assign(storage,value);callback?.();return Promise.resolve();}},onChanged:{addListener(){}}},i18n:{getMessage:()=>''}
    };
  },manifest.version);
  for(const script of scripts)await page.addScriptTag({content:script.content});
  await page.addStyleTag({content:css});await page.waitForSelector('#rs-bar');
  // Wait for continuously scheduled placement after content/CSS sizing.
  await page.waitForTimeout(450);
}
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  let passed=0;
  try{
    const cases=process.env.PLAZCODE_NEW_SITES==='1'?['longcat.ai','www.meta.ai'].flatMap(host=>[['bare-rich'],['empty-polish'],['unknown']].map(([kind])=>[host,kind])):[['platform.arcee.ai','bundle'],['copilot.com','bare-rich'],['copilot.com','empty-polish'],['platform.arcee.ai','unknown'],['copilot.com','unknown']];
    for(const [host,kind] of cases){
      for(const viewport of [{width:980,height:596},{width:953,height:240},{width:390,height:596}]){
        const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',error=>errors.push(error.message));
        page.setDefaultTimeout(6000);
        try{
          let native=kind==='bundle'?arcee:kind==='empty-polish'?'<main><section class="composerDock"><div class="fixture-row"><div contenteditable="true" id="native-editor" aria-label="Wyślij wiadomość do funkcji Copilot" style="white-space:pre-wrap"></div><div id="native-actions"></div></div></section><div id="thread"></div></main>':kind==='bare-rich'?'<main><section class="composerDock"><div class="fixture-row"><div contenteditable="true" id="native-editor" style="white-space:pre-wrap"></div><div><button id="native-send" aria-label="Submit prompt" disabled>↑</button></div></div></section></main>':'<main><section class="composerDock"><textarea id="native-editor"></textarea></section></main><button id="native-send" style="position:fixed;bottom:24px;right:12%">Send</button>';
          if(process.env.PLAZCODE_NEW_SITES==='1'){
            native=native.replaceAll('contenteditable="true"','contenteditable="true" role="textbox"').replace('aria-label="Submit prompt"','aria-label="Send"').replace('Wyślij wiadomość do funkcji Copilot',host==='www.meta.ai'?'Message Meta AI':'Message LongCat');
            if(kind==='unknown')native=native.replace('<textarea id="native-editor">','<textarea data-testid="composer-input" placeholder="Message LongCat" id="native-editor">')+'<form style="position:fixed;top:150px;right:5px;width:60px"><textarea data-testid="composer-input" placeholder="Other chat"></textarea><button aria-label="Send">Send</button></form>';
          }
          await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>'+native+'</body></html>'}));
          await page.goto('https://'+host+(kind==='empty-polish'?'/chat?fromcode=example&prompt=login&hasLW=false':'/'));
          await page.addStyleTag({content:'body{margin:0;background:#111;color:white}.composerDock,[data-chat-composer]{position:fixed;bottom:24px;left:12%;width:76%}textarea,#native-editor{box-sizing:border-box;width:100%;height:52px;min-width:0;color:white;background:#333}.fixture-row{display:flex;align-items:end;gap:8px}.fixture-row>div:has(textarea){flex:1;min-width:0}.fixture-row button{width:40px;height:40px}#native-editor[contenteditable]{flex:1}'});
          await page.evaluate(()=>{
            const ed=document.querySelector('textarea,[contenteditable]'),actions=document.querySelector('#native-actions');let send=document.querySelector('#native-send,[aria-label="Send"]');
            if(ed.id==='chat-input-textarea')ed.parentElement.parentElement.classList.add('fixture-row');
            window.nativeSent=[];
            const value=()=>ed.tagName==='TEXTAREA'?ed.value:ed.innerText;
            const submit=()=>{if(!value().trim())return;window.nativeSent.push(value());
              if(actions){const row=document.createElement('div');row.dataset.role='user';row.textContent=value();document.querySelector('#thread').append(row);}
              if(ed.tagName==='TEXTAREA')ed.value='';else ed.textContent='';
              if(actions){send?.remove();send=null;}else send.disabled=true;
            };
            ed.addEventListener('input',()=>{
              if(actions&&!send){send=document.createElement('button');send.id='native-send';send.type='button';send.setAttribute('aria-label','Wyślij wiadomość');send.textContent='↑';send.onclick=submit;actions.append(send);}
              send.disabled=!value().trim();
            });
            ed.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submit();}});
            if(send)send.onclick=submit;
          });
          await install(page);
          const ed=page.locator('textarea,[contenteditable]').filter({visible:true}).first();
          const layout=await page.evaluate(()=>{
            const ed=document.querySelector('textarea,[contenteditable]'),bar=document.querySelector('#rs-bar');
            return {editor:ed.getBoundingClientRect().toJSON(),bar:bar.getBoundingClientRect().toJSON(),detected:!!RSProvider.getEditor(),nativeStyle:ed.parentElement.getAttribute('style'),locked:ed.readOnly||ed.getAttribute('contenteditable')==='false'};
          });
          assert.equal(layout.detected,kind!=='unknown');assert.equal(layout.locked,false);
          assert.ok(layout.bar.bottom<=layout.editor.top-4,JSON.stringify({host,kind,viewport,...layout}));
          assert.ok(layout.bar.left>=0&&layout.bar.right<=viewport.width+1,JSON.stringify(layout.bar));
          if(kind==='empty-polish'){
            assert.equal(await page.locator('#native-send').count(),0,'empty chat has no Send button');
            assert.equal(await page.evaluate(()=>RSProvider.modeWarning()),'');
            const sent=await page.evaluate(async()=>{
              RSProvider.setInputLock(true);try{await RSProvider.typeAndSend('First handshake without a manual character');}finally{RSProvider.setInputLock(false);}
              const result=[...window.nativeSent];window.nativeSent=[];return {result,detected:!!RSProvider.getEditor()};
            });
            assert.deepEqual(sent.result,['First handshake without a manual character']);assert.equal(sent.detected,true);
          }
          await ed.click();await ed.fill('Native click send — Zażółć 🦊');
          await page.locator('#native-send,[aria-label="Send"]').first().click();
          await ed.click();await ed.fill('Native Enter send');await ed.press('Enter');
          assert.deepEqual(await page.evaluate(()=>window.nativeSent),['Native click send — Zażółć 🦊','Native Enter send']);
          assert.deepEqual(errors,[]);
          passed++;console.log(host+' '+kind+' '+viewport.width+'x'+viewport.height+': visible input, native click/Enter passed');
        }finally{await page.close();}
      }
    }
    console.log(passed+' full UI layout checks passed');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
