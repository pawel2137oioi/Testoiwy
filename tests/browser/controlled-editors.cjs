// Optional: see ARCEE-COPILOT.md for pinned browser fixture dependencies.
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const deps=process.env.PLAZCODE_BROWSER_DEPS;
const {buildSync}=deps?require(path.join(deps,'node_modules/esbuild')):require('esbuild');
const root=path.resolve(__dirname,'../..');
const fixture=buildSync({entryPoints:[path.join(__dirname,'fixtures/controlled-composers.js')],bundle:true,write:false,format:'iife',nodePaths:deps?[path.join(deps,'node_modules')]:[]}).outputFiles[0].text;
const provider=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});let passed=0;
 try{
  for(const kind of ['lexical','react-remount']){
   const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><main>'+(kind==='lexical'?'<form><div contenteditable="true" aria-label="Message Copilot" style="white-space:pre-wrap;min-height:60px"></div><button type="button" aria-label="Send message">Send</button></form>':'<div id="react-root"></div>')+'<div id="thread"><div data-role="user" data-message-id="u1">aa</div><div data-role="assistant" data-message-id="a1">Cześć! Wysłałeś tylko aa.</div></div></main>'}));
    await page.goto('https://copilot.com/chat');await page.addScriptTag({content:fixture});
    await page.evaluate(kind=>{window.nativeSent=[];if(kind==='lexical'){
      mountLexical();document.querySelector('button').onclick=()=>{const text=modelText();window.nativeSent.push(text);const row=document.createElement('div');row.dataset.role='user';row.textContent=text;document.querySelector('#thread').append(row);modelClear();};
    }else mountReact();},kind);
    await page.addScriptTag({content:provider+'\nwindow.P=RSProvider;'});
    const expected='First handshake {"command":"list_commands"}';
    const sent=await page.evaluate(async expected=>{P.setInputLock(true);try{await P.typeAndSend(expected);}finally{P.setInputLock(false);}return [...window.nativeSent];},expected);
    assert.deepEqual(sent,[expected]);passed++;
    if(kind==='lexical')for(const ending of ['', '\n', '\n\n']){
      const value='local p = Instance.new("Part")\n\nlocal text = "Zażółć 🦊 <script> &lt;"'+ending;
      const actual=await page.evaluate(async value=>{P.setInputLock(true);try{await P.typeAndSend(value);}finally{P.setInputLock(false);}return window.nativeSent.at(-1);},value);
      assert.equal(actual,value);passed++;
    }
    // A lock blocks real user edits, leaves framework attributes untouched,
    // permits the programmatic operation, and releases on completion.
    await page.evaluate(()=>P.setInputLock(true));
    const ed=page.locator('textarea,[contenteditable]').first();await ed.focus();await ed.press('x');
    assert.equal(await page.evaluate(()=>modelText()),'');
    assert.equal(await ed.getAttribute('contenteditable'),kind==='lexical'?'true':null);
    assert.equal(await ed.evaluate(ed=>!!ed.readOnly),false);
    await page.evaluate(()=>P.setInputLock(false));await ed.press('x');
    await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>modelText()),'x');passed++;
    const cleared=await page.evaluate(async()=>{const result=await P.writeDraft('','x');await new Promise(resolve=>setTimeout(resolve,80));return{ok:result.ok,model:modelText(),text:P.editorText()};});
    assert.deepEqual(cleared,{ok:true,model:'',text:''});passed++;
    assert.deepEqual(errors,[]);console.log(kind+': native model, exact source, single send and user lock passed');
   }finally{await page.close();}
  }
  const page=await browser.newPage();
  try{
    await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><div data-role="assistant" class="chat-message"><div class="chat-response-content"><div class="markdown-content"><div>js</div><div id="code-root" style="height:120px;overflow:auto"></div></div></div></div>'}));
    await page.goto('https://platform.arcee.ai/playground/test');await page.addScriptTag({content:fixture});
    await page.evaluate(()=>mountCodeMirror('on\n{\n"command":"list_commands",\n"params":{}\n}'));
    await page.addScriptTag({content:fs.readFileSync(path.join(root,'providers/chatgpt-cm.js'),'utf8')});
    await page.addScriptTag({content:provider+'\nwindow.P=RSProvider;'});
    await page.addScriptTag({content:fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.parser=RSParse;'});
    const call=await page.evaluate(()=>{const reply=P.readAssistant();return parser.parseToolCalls(P.commandText(reply.reply,reply.item));});
    assert.equal(call.length,1);assert.equal(call[0].tool,'list_commands');passed++;
    const code='local p = Instance.new("Part")\n\n'+('local text = "Zażółć 🦊"\n'.repeat(3000))+'return p';
    const full=JSON.stringify({command:'execute_luau',params:{code}});
    const actual=await page.evaluate(full=>{codeView.dispatch({changes:{from:0,to:codeView.state.doc.length,insert:full}});const reply=P.readAssistant();return parser.parseToolCalls(P.commandText(reply.reply,reply.item))[0]?.arguments.code;},full);
    assert.equal(actual,code);passed++;
    console.log('CodeMirror: actual document, js/on artifact and complete virtualized Luau passed');
  }finally{await page.close();}
  console.log(passed+' controlled-editor checks passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
