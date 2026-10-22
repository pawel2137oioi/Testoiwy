// Regression based on Motif 3 High DOM observed 2026-10-21. No live bridge.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'providers/webchats.js'),'utf8'),main=fs.readFileSync(path.join(root,'core/main.js'),'utf8');
function fixture({wrapper=true}={}){
 const dom=new JSDOM('<!doctype html><body><div '+(wrapper?'data-testid="document-message-list-wrapper"':'id="unknown-list"')+' style="display:flex;flex-direction:column"><div class="my-10 flex w-full gap-3" style="display:flex;gap:12px"><div data-testid="document-model-answer-content" style="flex:1;min-width:0"><div class="prose"><p>Odpowiedź Motif jest widoczna.</p></div></div></div></div><div class="composer"><textarea id="chat-textarea"></textarea><button data-testid="document-send-button">Send</button></div></body>',{url:'https://chat.motiftech.io/chat',runScripts:'outside-only'});
 const w=dom.window,d=w.document,c=dom.getInternalVMContext();
 w.HTMLElement.prototype.getBoundingClientRect=()=>({width:500,height:100,top:10,bottom:110,left:0,right:500});
 vm.runInContext(source+'\nwindow.P=RSProvider;',c);
 vm.runInContext(fs.readFileSync(path.join(root,'core/activity.js'),'utf8')+'\nwindow.activity=PlazCodeActivity.create();',c);
 w.syncActivityItems=()=>{};
 const start=main.indexOf('  const activityTranscript = PlazCodeActivity.renderer('),end=main.indexOf('\n  function activityKey(',start);
 assert.ok(start>=0&&end>start);vm.runInContext(main.slice(start,end)+'\nwindow.actualRenderer=activityTranscript;',c);
 const P=w.P,item=P.lastAssistant(),row=item.parentElement,list=row.parentElement;
 w.activity.sync(true,P.conversationKey(),10000);w.activity.sync(false,P.conversationKey(),19000,{collapse:true});
 const group=w.activity.list(P.conversationKey())[0];
 return {w,d,P,item,row,list,group,render:()=>w.actualRenderer.sync([group],()=>item)};
}
test('actual activity renderer mounts Worked summary outside the horizontal Motif row',()=>{
 const f=fixture(),original=f.item.innerHTML;f.render();const summary=f.d.querySelector('.rs-chat-activity');
 assert.ok(summary);assert.equal(summary.parentElement,f.list);assert.equal(summary.nextElementSibling,f.row);
 assert.equal(f.row.children.length,1);assert.equal(f.item.innerHTML,original);assert.equal(f.P.itemText(f.item),'Odpowiedź Motif jest widoczna.');
 assert.match(summary.textContent,/Worked for/);
});
test('collapsed and expanded activity cannot alter or fold the Motif answer',()=>{
 const f=fixture(),original=f.item.innerHTML;f.render();
 f.w.activity.toggle(f.group.id);f.render();f.w.activity.toggle(f.group.id);f.render();
 assert.equal(f.item.innerHTML,original);assert.equal(f.item.hasAttribute('data-rs-activity-folded'),false);
 assert.equal(f.row.querySelector('.rs-chat-activity'),null);assert.equal(f.list.querySelectorAll(':scope > .rs-chat-activity').length,1);
});
test('unknown Motif layout leaves the native answer intact without inserting into its flex row',()=>{
 const f=fixture({wrapper:false}),original=f.row.innerHTML;f.render();
 assert.equal(f.row.innerHTML,original);assert.equal(f.d.querySelector('.rs-chat-activity'),null);
});
test('activity placement follows the live native row after Motif reparents it',()=>{
 const f=fixture(),node=f.d.createElement('section');node.className='rs-chat-activity';
 const binding=f.P.mountActivitySummary(f.item,node);assert.ok(binding);
 const row=f.d.createElement('div');row.style.display='flex';f.list.append(row);row.append(f.item);binding.place();
 assert.equal(node.parentElement,f.list);assert.equal(node.nextElementSibling,row);assert.equal(row.children.length,1);
 binding.dispose();assert.equal(node.isConnected,false);assert.equal(f.item.parentElement,row);
});
test('two independent summaries retain native message order and readable replies',()=>{
 const f=fixture(),secondRow=f.row.cloneNode(true);secondRow.querySelector('p').textContent='Druga odpowiedź.';f.list.append(secondRow);
 const nodes=[f.d.createElement('section'),f.d.createElement('section')],second=secondRow.querySelector('[data-testid]');
 const firstBinding=f.P.mountActivitySummary(f.item,nodes[0]),secondBinding=f.P.mountActivitySummary(second,nodes[1]);
 assert.ok(firstBinding&&secondBinding);assert.deepEqual([...f.list.children],[nodes[0],f.row,nodes[1],secondRow]);
 assert.equal(f.P.assistantCount(),2);assert.equal(f.P.itemText(second),'Druga odpowiedź.');
});
