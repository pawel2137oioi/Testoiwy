// Controlled DOM reproductions; signed-in Copilot markup remains unverified.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const source=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
function fixture({rich=false,html=''}={}){
 const dom=new JSDOM('<!doctype html><form>'+(rich?'<div contenteditable="true" aria-label="Message Copilot">'+html+'</div>':'<textarea placeholder="Message Copilot"></textarea>')+'<button type="button" aria-label="Send">Send</button></form><section id="thread"></section>',{url:'https://copilot.com/chat',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();
 let clock=10000,seq=0,clicks=0,pending=[];
 w.Date.now=()=>clock;w.setTimeout=(fn,ms=0)=>{pending.push({at:clock+ms,fn,id:++seq});return seq;};
 const tick=async()=>{pending.sort((a,b)=>a.at-b.at);const next=pending.shift();if(next){clock=next.at;next.fn();}await Promise.resolve();};
 w.HTMLElement.prototype.getBoundingClientRect=()=>({width:640,height:70,top:500,bottom:570,left:10,right:650});
 vm.runInContext(source+'\nwindow.P=RSProvider;',c);
 const P=w.P,ed=P.getEditor(),button=d.querySelector('button');
 button.onclick=()=>{clicks++;const row=d.createElement('div');row.dataset.role='user';row.textContent=P.editorText();d.querySelector('#thread').append(row);if(rich)ed.textContent='';else ed.value='';};
 async function send(text){let done=false,result,error;P.typeAndSend(text).then(value=>{result=value;done=true;},value=>{error=value;done=true;});for(let i=0;i<1000&&!done;i++)await tick();assert.equal(done,true,'send must settle');if(error)throw error;return result;}
 return {dom,w,d,P,ed,send,clicks:()=>clicks};
}
for(const [label,html,expected] of [
 ['paragraph source','<p><span>Exact  text 🦊</span><br class="ProseMirror-trailingBreak"></p>','Exact  text 🦊'],
 ['noneditable decoration','<p>Message<span contenteditable="false">UI hint</span></p>','Message'],
 ['real final BR','<p>Literal<br></p>','Literal\n'],
 ['literal inline BR','<span>One</span><span><br></span><span>Two</span>','One\nTwo'],
 ['paragraph spacing','<p>First</p><p></p><p>Last</p>','First\n\n\n\nLast'],
 ['Unicode spaces','<p>One&nbsp; two  spaces</p>','One\u00a0 two  spaces'],
 ['empty caret','<p><br></p>',''],
 ])test('Copilot editable source: '+label,()=>{
 const f=fixture({rich:true,html});try{Object.defineProperty(f.ed,'innerText',{get:()=> 'CSS-rendered text differs'});assert.equal(f.P.editorText(),expected);}finally{f.dom.window.close();}
});
test('Copilot waits for a delayed controlled input commit without writing twice',async()=>{
 const f=fixture();try{let writes=0;f.ed.oninput=()=>{writes++;const value=f.ed.value;f.ed.value='';f.w.setTimeout(()=>{f.ed.value=value;},350);};assert.equal(await f.send('Exact handshake'),true);assert.equal(writes,1);assert.equal(f.clicks(),1);}finally{f.dom.window.close();}
});
test('Copilot a stable different draft is preserved and never sent',async()=>{
 const f=fixture();try{f.ed.oninput=()=>{f.ed.value='Other draft';};await assert.rejects(()=>f.send('Exact handshake'),/prepared text changed.*Expected 15 characters, read 11/);assert.equal(f.clicks(),0);assert.equal(f.ed.value,'Other draft');}finally{f.dom.window.close();}
});
test('Copilot does not click when the model changes after the first exact frame',async()=>{
 const f=fixture();try{f.ed.oninput=()=>f.w.setTimeout(()=>{f.ed.value='Other draft';},220);await assert.rejects(()=>f.send('Exact handshake'),/prepared text changed/);assert.equal(f.clicks(),0);}finally{f.dom.window.close();}
});
test('Copilot Stop during delayed preparation cancels without Send',async()=>{
 const f=fixture();try{f.ed.oninput=()=>f.w.setTimeout(()=>f.P.stopGeneration(),150);await assert.rejects(()=>f.send('Exact handshake'),/stopped/);assert.equal(f.clicks(),0);}finally{f.dom.window.close();}
});
test('Copilot conversation change during delayed preparation cancels without Send',async()=>{
 const f=fixture();try{f.ed.oninput=()=>f.w.setTimeout(()=>f.w.history.pushState({},'','/chat/other'),150);await assert.rejects(()=>f.send('Exact handshake'),/chat changed/);assert.equal(f.clicks(),0);}finally{f.dom.window.close();}
});
