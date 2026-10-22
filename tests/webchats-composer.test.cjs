// SPDX-License-Identifier: GPL-3.0-or-later
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'providers/webchats.js'),'utf8');
const arcee=fs.readFileSync(path.join(__dirname,'fixtures/arcee-composer.html'),'utf8');
function fixture(host,html){
  const dom=new JSDOM('<!doctype html><body>'+html+'</body>',{url:'https://'+host+'/',runScripts:'outside-only'}),w=dom.window,d=w.document;
  let clock=10000;w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};
  w.HTMLElement.prototype.getBoundingClientRect=function(){return {width:this.closest('[hidden]')?0:640,height:this.closest('[hidden]')?0:48,top:500,bottom:548,left:100,right:740};};
  vm.runInContext(source+'\nwindow.P=RSProvider;',dom.getInternalVMContext());return {dom,w,d,P:w.P};
}
test('Arcee public bundle composer: id, form-free row, initially disabled Send and unchanged attributes',async()=>{
  const f=fixture('platform.arcee.ai',arcee),ed=f.d.querySelector('#chat-input-textarea'),send=f.d.querySelector('[aria-label="Send"]');
  const row=ed.parentElement.parentElement,style=row.getAttribute('style');
  assert.equal(f.P.getEditor(),ed);assert.equal(f.P.composerFrame(),row);assert.equal(f.P.barOutside,true);assert.equal(f.P.modeWarning(),'');
  let clicks=0;ed.oninput=()=>{send.disabled=!ed.value.trim();};
  send.onclick=()=>{clicks++;const item=f.d.createElement('div');item.className='chat-user-message chat-message';item.innerHTML='<div class="label-xs">12:32</div><div class="select-text"></div><button>Edit</button>';
    item.querySelector('.select-text').textContent=ed.value;f.d.querySelector('.chat-messages').append(item);ed.value='';};
  const text='local p = Instance.new("Part")\n\nreturn Color3.fromRGB(10, 20, 30)';
  assert.equal(await f.P.typeAndSend(text),true);assert.equal(clicks,1);assert.equal(f.P.itemText(f.P.allItems()[0]),text);assert.equal(row.getAttribute('style'),style);
});
test('Arcee public bundle transcript: final markdown only, not model label, timestamp or reasoning',()=>{
  const f=fixture('platform.arcee.ai',arcee);f.d.querySelector('.chat-messages').innerHTML='<div class="chat-message" data-role="assistant"><div>AFM 12:32</div><div class="chat-response-content"><section data-variant="Thoughts"><pre>{"command":"write_file"}</pre></section><div class="markdown-content"><pre><code>{"command":"list_commands","params":{}}</code></pre></div></div><div data-chat-response-actions><button>Copy</button></div></div>';
  assert.equal(f.P.readAssistant().reply,'{"command":"list_commands","params":{}}');
  f.d.querySelector('.markdown-content').remove();assert.equal(f.P.readAssistant().reply,'');
});
test('Arcee frontend 50000-character limit is enforced before editing',async()=>{
  const f=fixture('platform.arcee.ai',arcee),ed=f.P.getEditor();
  await assert.rejects(()=>f.P.typeAndSend('x'.repeat(50001)),/50000 characters/);assert.equal(ed.value,'');
});
for(const label of ['Wyślij wiadomość do funkcji Copilot','Message Copilot']) {
  test('Copilot finds an empty labeled editor before Send is mounted: '+label,async()=>{
    const f=fixture('copilot.com','<main><section><div><textarea placeholder="'+label+'"></textarea></div><div id="actions"></div></section><div id="thread"></div></main>');
    const ed=f.d.querySelector('textarea');assert.equal(f.d.querySelector('button'),null);assert.equal(f.P.getEditor(),ed);assert.equal(f.P.modeWarning(),'');
    let clicks=0;
    ed.oninput=()=>{
      const send=f.d.createElement('button');send.type='button';send.setAttribute('aria-label','Wyślij wiadomość');send.textContent='↑';
      send.onclick=()=>{clicks++;const row=f.d.createElement('div');row.dataset.role='user';row.textContent=ed.value;f.d.querySelector('#thread').append(row);ed.value='';send.remove();};
      f.d.querySelector('#actions').replaceChildren(send);
    };
    assert.equal(await f.P.typeAndSend('Start without a manually typed character'),true);assert.equal(clicks,1);assert.equal(ed.value,'');
    assert.equal(f.d.querySelector('button'),null);assert.equal(f.P.getEditor(),ed);assert.equal(f.P.modeWarning(),'');
  });
}
test('Copilot /chat main editor without a label is discoverable while Send is hidden',()=>{
  const f=fixture('copilot.com','<main><section><div contenteditable="true"></div></section></main>');
  f.w.history.pushState({},'', '/chat?fromcode=example&prompt=login&hasLW=false');assert.equal(f.P.getEditor(),f.d.querySelector('[contenteditable]'));assert.equal(f.P.modeWarning(),'');
});
test('Copilot missing Send after typing fails without clicking another control',async()=>{
  const f=fixture('copilot.com','<main><section><textarea placeholder="Message Copilot"></textarea><button type="button" aria-label="Upload file">+</button></section></main>');
  let clicks=0;f.d.querySelector('button').onclick=()=>clicks++;
  await assert.rejects(()=>f.P.typeAndSend('Full pending message'),/send is unavailable/);assert.equal(clicks,0);assert.equal(f.P.sendFailureAmbiguous(),false);assert.equal(f.P.editorText(),'Full pending message');
});
test('Copilot empty editors remain ambiguous and a transcript cannot become the composer',()=>{
  const f=fixture('copilot.com','<main><section><textarea placeholder="Message Copilot"></textarea><textarea placeholder="Message Copilot"></textarea></section><div data-role="assistant"><textarea placeholder="Message Copilot"></textarea></div></main>');
  assert.equal(f.P.getEditor(),null);
});
test('Copilot Polish Stop remains generation and Stop clicks the local control once',()=>{
  const f=fixture('copilot.com','<main><section><textarea placeholder="Wyślij wiadomość do funkcji Copilot"></textarea><button type="button" aria-label="Zatrzymaj generowanie">■</button></section></main>');
  let clicks=0;f.d.querySelector('button').onclick=()=>clicks++;
  assert.equal(f.P.isHardGenerating(),true);f.P.stopGeneration();assert.equal(clicks,1);
});
for(const host of ['platform.arcee.ai','copilot.com']) {
  for(const editor of ['<textarea placeholder="Ask anything"></textarea>','<div contenteditable="true"></div>','<div contenteditable="plaintext-only" data-lexical-editor="true"></div>']) {
    test(host+': local composer without form/test IDs/textbox role: '+editor,()=>{
      const f=fixture(host,'<main><div class="composer"><div>'+editor+'</div><div><button aria-label="Send message" disabled>↑</button></div></div></main>');
      const ed=f.d.querySelector('textarea,[contenteditable]');assert.equal(f.P.getEditor(),ed);assert.equal(f.P.composerFrame(),f.d.querySelector('.composer'));
      assert.equal(f.P.modeWarning(),'');f.P.setInputLock(true);assert.equal(f.P.getEditor(),ed);assert.equal(f.P.composerFrame(),f.d.querySelector('.composer'));f.P.setInputLock(false);
      if(ed.tagName==='TEXTAREA')assert.equal(ed.readOnly,false);else assert.equal(ed.getAttribute('contenteditable'),editor.includes('plaintext-only')?'plaintext-only':'true');
    });
  }
  test(host+': editor can appear after loading and be replaced during SPA navigation',()=>{
    const f=fixture(host,'<main></main>');assert.equal(f.P.getEditor(),null);assert.equal(f.P.missingComposerDock,'top');
    f.d.querySelector('main').innerHTML='<div><textarea></textarea><button aria-label="Send">Send</button></div>';
    const first=f.P.getEditor();assert.ok(first);f.d.querySelector('textarea').replaceWith(f.d.createElement('textarea'));assert.notEqual(f.P.getEditor(),first);
  });
  test(host+': unrelated submit forms, transcript editors and PlazCode UI cannot select a composer',()=>{
    const f=fixture(host,'<main><section><textarea placeholder="Ask"></textarea></section><form><input><button type="submit">Save</button></form><div data-role="assistant"><textarea></textarea><button aria-label="Send">Send</button></div><div id="rs-root"><textarea></textarea><button aria-label="Send">Send</button></div></main>');
    assert.equal(f.P.getEditor(),null);assert.equal(f.P.composerFrame(),null);
  });
  test(host+': ambiguous local editors remain blocked and an idle native draft remains editable',()=>{
    const f=fixture(host,'<main><div><textarea>Native draft</textarea><textarea></textarea><button aria-label="Send">Send</button></div></main>');
    assert.equal(f.P.getEditor(),null);for(const ed of f.d.querySelectorAll('textarea'))assert.equal(ed.readOnly,false);assert.equal(f.d.querySelector('textarea').value,'Native draft');
  });
}
