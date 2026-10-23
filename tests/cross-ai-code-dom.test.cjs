// Cross-provider DOM fidelity, including ChatGPT classic and ChatGPT Work.
// Controlled markup only; no claim of a live extension/Studio session.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const providerRoot=process.env.PLAZCODE_PROVIDERS_ROOT || path.join(root,'providers');
const sites={
 deepseek:{host:'chat.deepseek.com',file:'deepseek',shell:'<div data-virtual-list-item-key="2"><div class="ds-message" data-role="assistant"><div class="ds-markdown" id="answer"></div></div></div>',header:'md-code-block-banner-wrap'},
 chatgpt:{host:'chatgpt.com',file:'chatgpt',shell:'<article data-testid="conversation-turn-2"><div data-message-id="reply-2" data-message-author-role="assistant"><div class="markdown" id="answer"></div></div></article>'},
 'chatgpt-work':{host:'chatgpt.com',file:'chatgpt',shell:'<section data-chatgpt-search-unit-key="turn:assistant" data-chatgpt-search-message-ids="a"><div data-markdown-text-style="assistant-message" id="answer"></div></section>'},
 claude:{host:'claude.ai',file:'claude',shell:'<div data-testid="assistant-message" class="font-claude-response"><div class="standard-markdown" id="answer"></div></div>'},
 motif:{host:'chat.motiftech.io',file:'webchats',shell:'<div data-testid="document-model-answer-content"><div class="prose" id="answer"></div></div>',header:'markdown-viewer-code-block-header'},
 chatwave:{host:'chat.thewave.cv',file:'webchats',shell:'<div id="chatThread"><div class="msg-row ai" data-mid="reply-2"><div class="msg-body" id="answer"></div></div></div>'},
 tencent:{host:'aistudio.tencent.ai',file:'webchats',shell:'<div class="agent-chat__list__item--ai"><div class="hyc-content-md" id="answer"></div></div>',header:'hyc-common-markdown__code__hd-container'},
 longcat:{host:'longcat.ai',file:'webchats',shell:'<article data-message-author-role="assistant"><div class="markdown" id="answer"></div></article>'},
 meta:{host:'www.meta.ai',file:'webchats',shell:'<article data-message-type="assistant"><div class="prose" id="answer"></div></article>'},
};
const source='local label = Instance.new("TextLabel")\nlabel.Size = UDim2.fromOffset(240, 40)\nlabel.TextXAlignment = Enum.TextXAlignment.Right\nlocal text = [=[one\n\n\n\nfive]=]\nreturn {text, label.Name}';
const long=source+'\n'+Array.from({length:350},(_,i)=>`local value${i} = {"Zażółć 🦊", ${i}}`).join('\n')+'\nreturn "END"';
const raw=s=>'###LUA###\n'+s+'\n###END_LUA###',escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function fixture(id,html){const spec=sites[id],dom=new JSDOM('<!doctype html><body>'+spec.shell+'</body>',{url:'https://'+spec.host+'/chat/test',runScripts:'outside-only'}),w=dom.window,d=w.document,c=dom.getInternalVMContext();
 w.HTMLElement.prototype.getBoundingClientRect=()=>({width:500,height:80,top:10,bottom:90,left:0,right:500});
 Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return d.body;}});Object.defineProperty(w.HTMLElement.prototype,'innerText',{get(){return this.textContent;}});
 vm.runInContext(fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;',c);
 vm.runInContext(fs.readFileSync(path.join(providerRoot,spec.file+'.js'),'utf8')+'\nwindow.P=RSProvider;',c);
 const body=d.querySelector('#answer');body.innerHTML=html;return{w,d,c,P:w.P,body};
}
const shapes={
 plain:(s,spec)=>'<pre><code>'+escape(raw(s))+'</code></pre>',
 header:(s,spec)=>'<div class="code-block"><div class="'+(spec.header||'code-block-header')+'">lua<button>Copy</button></div><pre><code>'+escape(raw(s))+'</code></pre></div>',
 footer:(s,spec)=>'<pre><code>'+escape(raw(s))+'</code><button aria-label="Copy code">Copy</button></pre>',
 prose:(s,spec)=>'<p>Tworzę etykietę.</p><pre><code>'+escape(raw(s))+'</code></pre><p>Gotowe.</p>',
 breaks:(s,spec)=>'<pre><code>'+raw(s).split('\n').map(escape).join('<br>')+'</code></pre>',
 paragraphs:(s,spec)=>raw(s).split('\n').map(line=>'<p>'+escape(line).replace('Instance.new','<a href="https://instance.new/">Instance.new</a>')+'</p>').join(''),
};
function parsed(f){const r=f.P.readAssistant();assert.ok(r.present);const text=f.P.commandText?f.P.commandText(r.reply,r.item):r.reply;return f.w.parser.parseToolCalls(text);}
for(const id of Object.keys(sites))for(const [shape,render] of Object.entries(shapes))for(const code of [source,long])test(id+' '+shape+': preserves '+(code===source?'short':'long')+' literal Luau and blank lines',()=>{
 const f=fixture(id,render(code,sites[id])),calls=parsed(f);assert.equal(calls.length,1);assert.equal(calls[0].tool,'execute_luau');assert.equal(calls[0].arguments.code,code);
});
for(const id of Object.keys(sites))test(id+': code/JSON in Copy buttons cannot replace a real JSON call',()=>{
 const text=JSON.stringify({command:'execute_luau',params:{code:source,datamodel_type:'Edit'}});
 const f=fixture(id,'<pre><button><code>{"command":"wrong_from_copy"}</code></button><code>'+escape(text)+'</code></pre>'),calls=parsed(f);
 assert.equal(calls.length,1);assert.equal(calls[0].tool,'execute_luau');assert.equal(calls[0].arguments.code,source);
});
for(const id of ['chatgpt','chatgpt-work','claude'])for(const fullDoc of (id==='claude'?[false]:[false,true]))test(id+': CodeMirror '+(fullDoc?'complete document overrides partial DOM':'lines preserve empty source lines'),()=>{
 const text=raw(long),html=fullDoc?'<div class="cm-content" data-rs-cm="'+escape(text).replaceAll('"','&quot;')+'"><div class="cm-line">partial</div></div>':'<div class="cm-content">'+text.split('\n').map(line=>'<div class="cm-line">'+escape(line)+'</div>').join('')+'</div>';
 const f=fixture(id,'<pre>'+html+'</pre>'),calls=parsed(f);assert.equal(calls.length,1);assert.equal(calls[0].arguments.code,long);
});
for(const id of Object.keys(sites))test(id+': PlazCode decoration cannot supply an executable command',()=>{
 const f=fixture(id,'<section class="rs-chip">{"command":"wrong_from_ui"}</section><div class="rs-chat-activity">Worked for 3s</div><pre><code>'+escape(raw(source))+'</code></pre>');
 const calls=parsed(f);assert.equal(calls.length,1);assert.equal(calls[0].arguments.code,source);
});
for(const id of Object.keys(sites))test(id+': the same call survives heading/footer/decoration rerender without changing source',()=>{
 const f=fixture(id,shapes.plain(source,sites[id])),before=JSON.parse(JSON.stringify(parsed(f)));
 f.body.innerHTML='<section class="rs-chip">{"command":"wrong_from_ui"}</section>'+shapes.header(source,sites[id]);
 assert.deepEqual(JSON.parse(JSON.stringify(parsed(f))),before);
 f.body.innerHTML=shapes.footer(source,sites[id]);f.body.querySelector('pre').classList.add('rs-tool-hide');
 assert.deepEqual(JSON.parse(JSON.stringify(parsed(f))),before);
});
