// SPDX-License-Identifier: GPL-3.0-or-later
// Optional browser check: requires Playwright and Chromium. These pages are
// fully synthetic semantic contracts, NOT live Arcee/copilot.com validation.
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.resolve(__dirname,'../../providers/webchats.js'),'utf8');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
  try {
    for(const host of ['platform.arcee.ai','copilot.com'])for(const mode of ['textarea','pre-wrap','normal']) {
      const rich=mode!=='textarea';
      const page=await browser.newPage();
      try {
        await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><body><form data-testid="composer">'+(rich?'<div contenteditable="true" role="textbox" style="white-space:'+mode+';min-height:80px"></div>':'<textarea placeholder="Message"></textarea>')+'<button type="button" aria-label="Send message">Send</button></form><section id="thread"></section></body>'}));
        await page.goto('https://'+host+'/chat/synthetic-contract');
        await page.addScriptTag({content:source+'\nwindow.P=RSProvider;'});
        const result=await page.evaluate(async()=>{
          const ed=P.getEditor();let clicks=0,received;
          document.querySelector('button').onclick=()=>{
            clicks++;received=P.editorText();
            const row=document.createElement('div');row.dataset.messageAuthorRole='user';row.textContent=received;document.querySelector('#thread').append(row);
            if(ed.tagName==='TEXTAREA')ed.value='';else ed.textContent='';
          };
          const expected='local part = Instance.new("Part")\n\nlocal text = "Zażółć 🦊 <script> &lt;"\nlocal color = Color3.fromRGB(10, 20, 30)\nreturn part\n';
          P.setInputLock(true);const accepted=await P.typeAndSend(expected);P.setInputLock(false);
          const draft=await P.writeDraft('Draft\n\n🦊','');
          return {expected,received,clicks,accepted,draft:draft.ok,draftText:P.editorText(),editable:ed.getAttribute('contenteditable'),readOnly:ed.readOnly};
        });
        assert.equal(result.accepted,true);assert.equal(result.clicks,1);assert.equal(result.received,result.expected);
        assert.equal(result.draft,true);assert.equal(result.draftText,'Draft\n\n🦊');
        if(rich)assert.equal(result.editable,'true');else assert.equal(result.readOnly,false);
        console.log(host+' '+mode+': passed (synthetic page)');
      } finally {await page.close();}
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
