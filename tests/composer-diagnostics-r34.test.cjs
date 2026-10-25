// Structural evidence for an unknown native composer. These are controlled
// markup fixtures, not signed-in provider DOM or source-execution tests.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
function fixture(html,{host='longcat.ai'}={}){
 const dom=new JSDOM('<!doctype html><body>'+html+'</body>',{url:'https://'+host+'/chat/t?token=PRIVATE_URL',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext(),effects=[];
 w.HTMLElement.prototype.getBoundingClientRect=function(){if(this.hasAttribute('data-zero-box'))return{width:0,height:0,top:0,left:0,right:0,bottom:0};const top=this.hasAttribute('data-offscreen')?2000:500;return{width:640,height:70,top,left:10,right:650,bottom:top+70};};
 w.fetch=()=>{effects.push('fetch');throw Error('diagnostic must not fetch');};d.execCommand=()=>{effects.push('write');throw Error('diagnostic must not write');};
 for(const button of d.querySelectorAll('button,[role="button"]'))button.onclick=()=>effects.push('click');
 let source=fs.readFileSync(path.join(root,'providers/webchats.js'),'utf8');const marker='  function transportSnapshot(){';assert.equal(source.split(marker).length,2);source=source.replace(marker,'  window.composerSnapshot=composerTransportSnapshot;\n'+marker);
 vm.runInContext(source+'\nwindow.P=RSProvider;',c);
 return{dom,w,d,P:w.P,effects,snapshot:()=>w.composerSnapshot()};
}
test('unknown unlabelled editable and descendant placeholder remain visible in diagnostics',t=>{
 const f=fixture('<div contenteditable="true"><p data-placeholder="Tell me what you need"></p></div>');t.after(()=>f.dom.window.close());
 const report=f.snapshot();assert.equal(report.detected,false);assert.equal(report.counts.editor_candidates,1);assert.equal(report.editors[0].tag,'div');assert.equal(report.editors[0].editable,'true');assert.deepEqual(Array.from(report.editors[0].child_placeholders),['tell_me_what_you_need']);assert.equal(report.editors[0].ancestors[0].tag,'body');assert.equal(report.editors[0].controls.length,0);assert.deepEqual(f.effects,[]);
});
test('known native controls, local ancestors and icon markers are recorded without source',t=>{
 const f=fixture('<form class="chat-input-container" id="PRIVATE_FRAME"><section><textarea placeholder="Tell me what you need">PRIVATE_DRAFT</textarea><div class="chat-input-footer"><button type="button" aria-label="Send"><svg><use href="#icon-send"></use></svg></button><button type="button" aria-label="Stop"><svg><rect></rect></svg></button></div></section></form>');t.after(()=>f.dom.window.close());
 const report=f.snapshot(),editor=report.editors[0];assert.equal(report.detected,true);assert.equal(editor.selected,true);assert.equal(editor.type,'textarea');assert.equal(editor.frame_depth,1);assert.equal(editor.control_count,2);assert.ok(editor.ancestors.some(node=>node.classes?.includes('chat-input-container')));assert.deepEqual(Array.from(editor.controls[0].labels),['send']);assert.deepEqual(Array.from(editor.controls[0].icons),['send']);assert.equal(editor.controls[1].has_svg_rect,true);assert.equal(editor.controls[1].labels[0],'stop');assert.doesNotMatch(JSON.stringify(report),/PRIVATE_|https:|longcat\.ai/);assert.deepEqual(f.effects,[]);
});
test('invisible, offscreen, disabled and readonly candidates are distinguishable',t=>{
 const f=fixture('<form><textarea style="display:none" readonly>PRIVATE_HIDDEN</textarea><textarea data-offscreen disabled>PRIVATE_OFFSCREEN</textarea><textarea data-zero-box></textarea><button aria-label="Send" disabled>Send</button></form>');t.after(()=>f.dom.window.close());
 const report=f.snapshot(),editors=report.editors;assert.equal(report.counts.editor_candidates,3);assert.equal(editors[0].visible,false);assert.equal(editors[0].readonly,true);assert.equal(editors[1].visible,true);assert.equal(editors[1].in_viewport,false);assert.equal(editors[1].disabled,true);assert.equal(editors[2].visible,false);assert.ok(editors.every(editor=>editor.controls[0].disabled));assert.deepEqual(f.effects,[]);
});
test('arbitrary labels, IDs, classes, attributes, paths, SVG source and draft are redacted',t=>{
 const f=fixture('<form class="composer__PRIVATE_CLASS" id="PRIVATE_ID" data-testid="PRIVATE_TESTID"><div role="PRIVATE_ROLE" title="PRIVATE_TITLE"><textarea placeholder="PRIVATE_PLACEHOLDER" aria-label="PRIVATE_LABEL" title="PRIVATE_TITLE" data-testid="PRIVATE_EDITOR" class="PRIVATE_CLASS">PRIVATE_DRAFT</textarea><button aria-label="Send PRIVATE_SUFFIX" title="PRIVATE_BUTTON" data-icon="PRIVATE_ICON" id="PRIVATE_BUTTON_ID"><svg data-icon="send_PRIVATE_SUFFIX"><use href="https://private.test/PRIVATE_URL"></use><path d="PRIVATE_PATH"></path></svg>PRIVATE_SOURCE</button></div></form>');t.after(()=>f.dom.window.close());
 const text=JSON.stringify(f.snapshot());assert.doesNotMatch(text,/PRIVATE_|private\.test|https:|PLACEHOLDER|SUFFIX/);const report=f.snapshot();assert.equal(report.editors[0].has_testid,true);assert.equal(report.editors[0].testid,undefined);assert.equal(report.editors[0].controls[0].icons,undefined);assert.equal(report.editors[0].controls[0].labels,undefined);assert.ok(report.editors[0].ancestors.some(node=>node.classes?.includes('composer')));assert.deepEqual(f.effects,[]);
});
test('empty contenteditable attributes and plaintext-only fields are included',t=>{
 const f=fixture('<div contenteditable=""></div><div contenteditable="plaintext-only"></div><div contenteditable="false">PRIVATE_DECORATION</div>');t.after(()=>f.dom.window.close());
 const report=f.snapshot();assert.equal(report.counts.editor_candidates,2);assert.deepEqual(Array.from(report.editors,node=>node.editable),['true','plaintext-only']);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_/);
});
test('editor, ancestor, control and total node budgets remain bounded',t=>{
 const html=Array.from({length:20},()=>'<form>'+('<section>'.repeat(8))+'<textarea>PRIVATE_DRAFT</textarea>'+Array.from({length:20},()=>'<button aria-label="Send">PRIVATE_SOURCE</button>').join('')+'</section>'.repeat(8)+'</form>').join('');
 const f=fixture(html);t.after(()=>f.dom.window.close());const report=f.snapshot();assert.equal(report.counts.editor_candidates,20);assert.equal(report.editors.length,8);assert.ok(report.counts.reported_nodes<=80);assert.ok(report.omitted>0);assert.ok(report.editors.every(editor=>editor.ancestors.length<=6&&editor.controls.length<=8));const nodes=report.editors.reduce((count,editor)=>count+1+editor.ancestors.length+editor.controls.length,0);assert.equal(nodes,report.counts.reported_nodes);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_/);assert.deepEqual(f.effects,[]);
});
test('extension-owned inputs are absent while a readonly native editor is still reported',t=>{
 const f=fixture('<div id="rs-root"><textarea>PRIVATE_EXTENSION</textarea><button aria-label="Send">PRIVATE_EXTENSION</button></div><form><textarea readonly data-testid="composer-input">PRIVATE_NATIVE</textarea><button aria-label="Send">Send</button></form>');t.after(()=>f.dom.window.close());
 const report=f.snapshot();assert.equal(report.counts.editor_candidates,1);assert.equal(report.editors[0].readonly,true);assert.equal(report.editors[0].testid,'composer-input');assert.equal(report.editors[0].controls.length,1);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_/);
});
test('composer helper never activates Meta Raw, Send, clipboard, events or editor writes',async t=>{
 const f=fixture('<form><textarea data-testid="composer-input"></textarea><button aria-label="Send">Send</button></form><div data-testid="assistant-message"><div class="ur-code-block"><button>Raw</button>{"command":"list_commands","params":{}}</div></div>',{host:'www.meta.ai'});t.after(()=>f.dom.window.close());let mutations=0;const observer=new f.w.MutationObserver(records=>mutations+=records.length);observer.observe(f.d.body,{subtree:true,attributes:true,childList:true,characterData:true});
 for(let i=0;i<5;i++)f.snapshot();await Promise.resolve();observer.disconnect();assert.equal(mutations,0);assert.deepEqual(f.effects,[]);
});
test('public transport snapshot includes composer evidence even with no assistant reply',t=>{
 const f=fixture('<form><textarea data-testid="composer-input" placeholder="Zapytaj Meta AI…">PRIVATE_DRAFT</textarea><button type="button" data-testid="composer-send-button" aria-label="Wyślij wiadomość">Send</button></form>',{host:'www.meta.ai'});t.after(()=>f.dom.window.close());
 f.P.captureTransportDiagnostics('startup_send_failed');const report=f.P.transportDiagnostics();assert.equal(report.last_failure.snapshot.composer.counts.editor_candidates,1);assert.equal(report.live.composer.editors[0].testid,'composer-input');assert.deepEqual(Array.from(report.live.composer.editors[0].labels),['ask_meta_ai']);assert.equal(report.live.counts.assistants,0);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_|https:/);assert.deepEqual(f.effects,[]);
});
