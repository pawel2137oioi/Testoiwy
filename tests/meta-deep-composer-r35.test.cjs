// The r34 user report proves six editor ancestors have no controls and shows a
// visible Lexical composer-input plus its hidden textarea mirror. The row at
// depth10/24 below is a modeled continuation of that report, not captured DOM.
// Known Meta Send/Stop contracts are exercised separately from unknown buttons.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
function fixture({depth=10,hidden=false,known=true,unknown=false,disabled=false,stop=false}={}){
 const dom=new JSDOM('<!doctype html><main><section id="thread"></section></main>',{url:'https://www.meta.ai/',runScripts:'outside-only'}),w=dom.window,d=w.document,stats={sends:[],stops:0,mirrorInputs:0};let clock=10000,model='';
 w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};
 w.HTMLElement.prototype.getBoundingClientRect=function(){const invisible=this.closest('[hidden]');return{width:invisible?0:640,height:invisible?0:70,top:500,bottom:570,left:10,right:650};};
 const ed=d.createElement('div');ed.setAttribute('contenteditable','true');ed.setAttribute('role','textbox');ed.dataset.lexicalEditor='true';ed.dataset.testid='composer-input';
 const setText=value=>{const p=d.createElement('p');if(value)p.textContent=value;else p.append(d.createElement('br'));ed.replaceChildren(p);};setText('');
 const mirror=d.createElement('textarea');mirror.dataset.testid='composer-input';mirror.placeholder='Zapytaj Meta AI…';mirror.hidden=true;
 let branch=ed;const ancestors=[];
 for(let i=1;i<=depth;i++){const n=d.createElement('div');n.append(branch);if(i===2)n.append(d.createElement('span'));if(i===3){const offscreen=d.createElement('div');offscreen.hidden=true;offscreen.append(mirror);n.append(offscreen);}ancestors.push(n);branch=n;}
 const card=branch,send=d.createElement('div');send.setAttribute('role','button');send.tabIndex=0;send.hidden=hidden;
 if(known)send.dataset.testid=stop?'composer-stop-button':'composer-send-button';
 if(!known||stop)send.setAttribute('aria-label',unknown?'PRIVATE_UNKNOWN_ACTION':stop?'Zatrzymaj generowanie':'Wyślij wiadomość');
 send.setAttribute('aria-disabled',String(disabled));send.innerHTML='<svg><path d="PRIVATE_SVG_SOURCE"></path></svg>';const controls=d.createElement('div');controls.append(send);card.append(controls);d.querySelector('main').append(card);
 mirror.oninput=()=>{stats.mirrorInputs++;model=mirror.value;setText(model);if(hidden&&model)send.hidden=false;};
 send.onclick=()=>{if(stop){stats.stops++;return;}stats.sends.push(model);const echo=d.createElement('article');echo.dataset.role='user';echo.textContent=model;d.querySelector('#thread').append(echo);model='';mirror.value='';setText('');if(hidden)send.hidden=true;};
 vm.runInContext(source+'\nwindow.P=RSProvider;',dom.getInternalVMContext());
 return{dom,w,d,P:w.P,ed,mirror,card,send,controls,ancestors,stats};
}
for(const [depth,hidden] of [[10,false],[24,true]])test('Meta native mirror and Send beyond six wrappers: '+depth+' levels, hidden='+hidden,async t=>{
 const f=fixture({depth,hidden});t.after(()=>f.dom.window.close());assert.equal(f.P.getEditor(),f.ed);assert.equal(f.P.composerFrame(),f.card);
 const text='First line\n\n  literal <code> & zażółć 😀\n';assert.equal(await f.P.typeAndSend(text),true);assert.deepEqual(f.stats.sends,[text]);assert.equal(f.stats.mirrorInputs,1);assert.equal(f.P.editorText(),'');
});
test('Meta mirror pair prepares the native model before a semantic Send appears',async t=>{
 const f=fixture({known:false,hidden:true});t.after(()=>f.dom.window.close());assert.equal(f.P.composerFrame(),f.ancestors[2]);
 assert.equal(await f.P.typeAndSend('Prepared through the hidden mirror'),true);assert.deepEqual(f.stats.sends,['Prepared through the hidden mirror']);assert.equal(f.stats.mirrorInputs,1);
});
test('deep native Meta Stop is recognized and clicked once before another draft is written',async t=>{
 const f=fixture({stop:true});t.after(()=>f.dom.window.close());assert.equal(f.P.isHardGenerating(),true);await assert.rejects(()=>f.P.typeAndSend('Another request'),/wait for the current response/);f.P.stopGeneration();assert.equal(f.stats.stops,1);assert.deepEqual(f.stats.sends,[]);assert.equal(f.stats.mirrorInputs,0);
});
test('deep disabled Meta Send remains disabled and is never clicked',async t=>{
 const f=fixture({disabled:true});t.after(()=>f.dom.window.close());await assert.rejects(()=>f.P.typeAndSend('Complete draft'),/send is unavailable/);assert.equal(f.send.getAttribute('aria-disabled'),'true');assert.deepEqual(f.stats.sends,[]);assert.equal(f.P.editorText(),'Complete draft');
});
for(const boundary of ['form','role-form','aside','blockquote','main'])test('Meta does not adopt a Send across '+boundary,async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());let foreign;
 if(boundary==='main')foreign=f.d.querySelector('main');else{foreign=f.d.createElement(boundary==='role-form'?'div':boundary);if(boundary==='role-form')foreign.setAttribute('role','form');f.card.append(foreign);}
 foreign.append(f.send);await assert.rejects(()=>f.P.typeAndSend('A complete draft'),/send is unavailable/);assert.deepEqual(f.stats.sends,[]);
});
test('a form owning the conversation never becomes the Meta composer fallback',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const form=f.d.createElement('form');f.card.replaceWith(form);form.append(f.card);const answer=f.d.createElement('section');answer.className='ur-markdown';answer.textContent='Earlier response';form.append(answer,f.send);
 assert.notEqual(f.P.composerFrame(),form);await assert.rejects(()=>f.P.typeAndSend('A complete draft'),/send is unavailable/);assert.deepEqual(f.stats.sends,[]);
});
test('a competing visible editable in the deep card leaves Meta unrecognized',t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const other=f.d.createElement('textarea');other.placeholder='Unrelated field';f.card.append(other);assert.equal(f.P.getEditor(),null);assert.deepEqual(f.stats.sends,[]);assert.equal(f.stats.mirrorInputs,0);
});
test('an unknown deep button stays unclicked and appears in redacted structural diagnostics',async t=>{
 const f=fixture({known:false,unknown:true});t.after(()=>f.dom.window.close());await assert.rejects(()=>f.P.typeAndSend('PRIVATE_DRAFT'),/send is unavailable/);
 const report=f.P.transportDiagnostics().live.composer,entry=report.editors.find(e=>e.selected);assert.equal(entry.frame_resolution,'mirror_pair');assert.equal(entry.provider_frame_depth,3);assert.equal(entry.frame_has_known_controls,false);assert.equal(entry.frame_depth,10);assert.equal(entry.controls.length,1);assert.equal(entry.controls[0].matches_send,false);assert.equal(entry.controls[0].has_svg_path,true);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_|https:/);assert.deepEqual(f.stats.sends,[]);
});
test('diagnostics reach deep known controls without exporting a draft or exceeding eighty nodes',t=>{
 const f=fixture({depth:24});t.after(()=>f.dom.window.close());f.mirror.value='PRIVATE_DRAFT';for(let i=0;i<20;i++){const b=f.d.createElement('button');b.setAttribute('aria-label','PRIVATE_'+i);f.controls.append(b);}
 const report=f.P.transportDiagnostics().live.composer,entry=report.editors.find(e=>e.selected);assert.equal(entry.frame_resolution,'visible_controls');assert.equal(entry.provider_frame_depth,24);assert.equal(entry.frame_depth,24);assert.ok(entry.controls.some(c=>c.testid==='composer-send-button'));assert.ok(report.counts.reported_nodes<=80);assert.ok(entry.controls.length<=8);assert.doesNotMatch(JSON.stringify(report),/PRIVATE_|https:/);assert.deepEqual(f.stats.sends,[]);assert.equal(f.stats.mirrorInputs,0);
});
test('Meta does not jump to a known control beyond the bounded ancestor scan',async t=>{
 const f=fixture({depth:25});t.after(()=>f.dom.window.close());assert.notEqual(f.P.composerFrame(),f.card);await assert.rejects(()=>f.P.typeAndSend('A complete draft'),/send is unavailable/);assert.deepEqual(f.stats.sends,[]);
});
test('a quoted hidden mirror is not written along with the real Meta composer mirror',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());const quote=f.d.createElement('blockquote'),mirror=f.mirror.cloneNode();mirror.value='PRIVATE_QUOTED_DRAFT';quote.append(mirror);f.card.append(quote);
 assert.equal(await f.P.typeAndSend('Actual native model'),true);assert.deepEqual(f.stats.sends,['Actual native model']);assert.equal(mirror.value,'PRIVATE_QUOTED_DRAFT');assert.equal(f.stats.mirrorInputs,1);
});
