// Regression for the screenshot's unlabelled editable/placeholder exclusions.
// Does not claim capture of the user's native HTML or unknown icon controls.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
function fixture(html){
 const dom=new JSDOM('<!doctype html><div id="app">'+html+'</div>',{url:'https://longcat.ai/chat/t',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.HTMLElement.prototype.getBoundingClientRect=()=>({width:640,height:70,left:0,right:640,top:500,bottom:570});
 w.SVGElement.prototype.getBoundingClientRect=()=>({width:24,height:24,left:600,right:624,top:530,bottom:554});
 vm.runInContext(fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8')+'\nwindow.P=RSProvider;',dom.getInternalVMContext());
 return{dom,w,d,P:w.P};
}
for(const label of ['root','paragraph'])test('LongCat detects unlabelled contenteditable with screenshot placeholder on '+label,t=>{
 const f=fixture('<section><div contenteditable="true" '+(label==='root'?'data-placeholder="Tell me what you need"':'')+'>'+(label==='paragraph'?'<p data-placeholder="Tell me what you need"><br class="ProseMirror-trailingBreak"></p>':'')+'</div></section>');t.after(()=>f.dom.window.close());
 assert.equal(f.P.getEditor(),f.d.querySelector('[contenteditable]'));assert.equal(f.P.editorText(),'');assert.equal(f.P.modeWarning(),'');assert.equal(f.P.composerFrame(),f.d.querySelector('section'));
});
test('LongCat known native composer contains the editor while unlabelled controls are still unknown',t=>{
 const f=fixture('<section class="chat-input-container"><div><div contenteditable="true"><p><br></p></div></div><footer><button type="button"><svg><rect width="8" height="8"></rect></svg></button></footer></section>');t.after(()=>f.dom.window.close());
 assert.equal(f.P.getEditor(),f.d.querySelector('[contenteditable]'));assert.equal(f.P.composerFrame(),f.d.querySelector('.chat-input-container'));assert.equal(f.P.isHardGenerating(),false);
});
test('LongCat multiple native editables remain ambiguous and quoted editors stay excluded',t=>{
 const f=fixture('<section class="chat-input-container"><div contenteditable="true"></div><div contenteditable="true"></div></section><blockquote><div contenteditable="true" data-placeholder="Tell me what you need"></div></blockquote>');t.after(()=>f.dom.window.close());assert.equal(f.P.getEditor(),null);
});
test('LongCat recognizes the user-provided Stop use marker without guessing an icon shape',t=>{
 const f=fixture('<section class="chat-input-container"><div contenteditable="true"><p data-placeholder="Tell me what you need."><br class="ProseMirror-trailingBreak"></p></div><footer><div id="native-stop"><svg><use data-v-641b0c80="" href="#icon-stop" fill="currentColor"></use></svg></div></footer></section>');t.after(()=>f.dom.window.close());let stops=0;f.d.querySelector('#native-stop').onclick=()=>stops++;
 assert.equal(f.P.getEditor(),f.d.querySelector('[contenteditable]'));assert.equal(f.P.isHardGenerating(),true);f.P.stopGeneration();assert.equal(stops,1);
});
test('LongCat ignores quoted editable fields even when no other editor exists',t=>{
 const f=fixture('<blockquote><section class="chat-input-container"><div contenteditable="true"><p data-placeholder="Tell me what you need."><br></p></div><svg><use href="#icon-stop"></use></svg></section></blockquote>');t.after(()=>f.dom.window.close());assert.equal(f.P.getEditor(),null);assert.equal(f.P.isHardGenerating(),false);
});
test('LongCat supplied Send SVG dispatches once through its native div control',async t=>{
 const f=fixture('<section class="chat-input-container"><div contenteditable="true"><p data-placeholder="Tell me what you need."><br class="ProseMirror-trailingBreak"></p></div><div id="native-action"><svg data-v-641b0c80="" data-v-aa909a2a="" class="svg-icon send-icon" aria-hidden="true" width="14px" height="14px"><use data-v-641b0c80="" href="#icon-send" fill="currentColor"></use></svg></div></section><section class="message-list"></section>');t.after(()=>f.dom.window.close());let sends=0;
 f.w.setTimeout=fn=>{queueMicrotask(fn);return 1;};let clock=10000;f.w.Date.now=()=>clock+=100;
 f.d.execCommand=(command,_ui,html)=>{const ed=f.d.querySelector('[contenteditable]');if(command==='delete'){ed.textContent='';return true;}if(command!=='insertHTML')return false;const node=f.d.createElement('div');node.innerHTML=html;ed.textContent=node.textContent;return true;};
 f.d.querySelector('#native-action').onclick=()=>{sends++;const ed=f.d.querySelector('[contenteditable]'),row=f.d.createElement('div');row.className='user-text';row.textContent=ed.textContent;f.d.querySelector('.message-list').append(row);ed.textContent='';};
 assert.equal(await f.P.typeAndSend('First native handshake'),true);assert.equal(sends,1);assert.equal(f.P.editorText(),'');
});
