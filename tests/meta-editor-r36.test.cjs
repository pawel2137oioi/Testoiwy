// Regression for the r35 report: hidden mirror input is accepted while the
// visible native Lexical document remains empty. This is a controlled model;
// the browser regression separately uses the real Lexical library.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
const literal='local p=Instance.new("Part")\n\n\tp.Color=Color3.fromRGB(1,2,3)\np.Name="Zażółć 😀 < > &"\n';
function fixture({retain=false,delay=false,distort=false,reject=false}={}){
 const dom=new JSDOM('<!doctype html><main><section id="thread"></section><section id="composer"><div contenteditable="true" role="textbox" data-testid="composer-input" data-lexical-editor="true"><p><br></p></div><textarea data-testid="composer-input" style="display:none"></textarea><button data-testid="composer-send-button" type="button" aria-label="Send">Send</button></section></main>',{url:'https://www.meta.ai/',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext(),ed=d.querySelector('[contenteditable]'),mirror=d.querySelector('textarea');let clock=10000,model='',mirrorInput='',serial=0;
 const stats={pastes:0,deletes:0,mirrorWrites:0,sends:[],exec:0};
 w.Date.now=()=>clock;w.setTimeout=fn=>{clock+=100;queueMicrotask(fn);return 1;};w.HTMLElement.prototype.getBoundingClientRect=function(){return {width:this===mirror?0:640,height:this===mirror?0:70,top:500,bottom:570,left:10,right:650};};
 class Transfer{constructor(){this.values={};}setData(kind,value){this.values[kind]=String(value);}getData(kind){return this.values[kind]||'';}}
 w.DataTransfer=Transfer;w.ClipboardEvent=class extends w.Event{constructor(type,options){super(type,options);this.clipboardData=options.clipboardData;}};
 const render=value=>{model=value;const p=d.createElement('p');if(value)p.textContent=value;else p.append(d.createElement('br'));ed.replaceChildren(p);};
 mirror.oninput=()=>{stats.mirrorWrites++;mirrorInput=mirror.value;};
 ed.addEventListener('paste',event=>{stats.pastes++;if(reject)return;event.preventDefault();const value=event.clipboardData.getData('text/plain'),apply=()=>render(distort?value.slice(0,-1):value);if(delay)queueMicrotask(()=>queueMicrotask(apply));else apply();});
 ed.addEventListener('beforeinput',event=>{if(event.inputType==='deleteContentBackward'){event.preventDefault();stats.deletes++;render('');}});
 d.execCommand=()=>{stats.exec++;return false;};
 d.querySelector('button').onclick=()=>{stats.sends.push(model);const row=d.createElement('article');row.dataset.messageRole='user';row.dataset.messageId='u'+(++serial);row.textContent=model;d.querySelector('#thread').append(row);if(!retain)render('');};
 vm.runInContext(source+'\nwindow.P=RSProvider;',c);
 return {dom,w,d,P:w.P,ed,mirror,stats,render,model:()=>model,mirrorInput:()=>mirrorInput};
}
test('Meta Lexical updates its actual visible model when mirror input does not synchronize it',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());assert.equal(await f.P.typeAndSend(literal),true);assert.deepEqual(f.stats.sends,[literal]);assert.equal(f.stats.pastes,1);assert.equal(f.stats.mirrorWrites,0);assert.equal(f.stats.exec,0);assert.equal(f.P.editorText(),'');
});
test('Meta delayed native Lexical paste settles before exactly one Send',async t=>{
 const f=fixture({delay:true});t.after(()=>f.dom.window.close());assert.equal(await f.P.typeAndSend(literal),true);assert.deepEqual(f.stats.sends,[literal]);assert.equal(f.stats.pastes,1);assert.equal(f.stats.mirrorWrites,0);
});
test('Meta clears a retained confirmed draft through native Lexical delete, without mirror writes',async t=>{
 const f=fixture({retain:true});t.after(()=>f.dom.window.close());assert.equal(await f.P.typeAndSend(literal),true);assert.deepEqual(f.stats.sends,[literal]);assert.equal(f.stats.deletes,1);assert.equal(f.model(),'');assert.equal(f.stats.mirrorWrites,0);
});
test('Meta rejects a changed native Lexical document before Send instead of trusting the mirror',async t=>{
 const f=fixture({distort:true});t.after(()=>f.dom.window.close());await assert.rejects(()=>f.P.typeAndSend(literal),/prepared text changed/);assert.deepEqual(f.stats.sends,[]);assert.equal(f.stats.pastes,1);assert.equal(f.stats.mirrorWrites,0);assert.equal(f.model(),literal.slice(0,-1));
});
test('Meta never substitutes a hidden mirror write when the actual native Lexical editor rejects editing',async t=>{
 const f=fixture({reject:true});t.after(()=>f.dom.window.close());await assert.rejects(()=>f.P.typeAndSend(literal),/editor did not accept/);assert.deepEqual(f.stats.sends,[]);assert.equal(f.stats.pastes,1);assert.equal(f.stats.mirrorWrites,0);assert.equal(f.model(),'');
});
test('Meta preserves a pre-existing native Lexical user draft without paste, delete or mirror input',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.render('MY DRAFT');await assert.rejects(()=>f.P.typeAndSend(literal),/draft is already/);assert.equal(f.model(),'MY DRAFT');assert.equal(f.stats.pastes,0);assert.equal(f.stats.deletes,0);assert.equal(f.stats.mirrorWrites,0);assert.deepEqual(f.stats.sends,[]);
});
test('Meta guarded draft replacement requires the exact current visible Lexical source',async t=>{
 const f=fixture();t.after(()=>f.dom.window.close());f.render('MY DRAFT');assert.equal((await f.P.writeDraft('other','wrong')).ok,false);assert.equal(f.model(),'MY DRAFT');assert.equal(f.stats.pastes,0);assert.equal((await f.P.writeDraft(literal,'MY DRAFT')).ok,true);assert.equal(f.model(),literal);assert.equal(f.stats.mirrorWrites,0);assert.deepEqual(f.stats.sends,[]);
});
