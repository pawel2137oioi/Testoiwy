// Real editor transactions, controlled paste policy and submitted messages.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const deps=process.env.PLAZCODE_BROWSER_DEPS||'/tmp/plazcode-ui-r19',pm=process.env.PLAZCODE_PM_DEPS||'/tmp/plazcode-pm-r31';
const {buildSync}=require(path.join(deps,'node_modules/esbuild')),root=path.resolve(__dirname,'../..');
const fixture=buildSync({entryPoints:[path.join(__dirname,'fixtures/prosemirror-composer.js')],bundle:true,write:false,format:'iife',nodePaths:[path.join(pm,'node_modules')]}).outputFiles[0].text;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});let passed=0;
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><main><section id="thread"></section><form><div id="editor-host"></div><button type="button" aria-label="Send">Send</button></form></main>'}));
  await page.goto('https://copilot.com/chat/conversation/fixture');await page.addStyleTag({content:'.ProseMirror{min-height:60px;white-space:pre-wrap}p{margin:0}'});await page.addScriptTag({content:fixture});
  await page.evaluate(()=>{mountParagraphComposer(document.querySelector('#editor-host'));window.sent=[];document.querySelector('button').onclick=()=>{const text=paragraphText();sent.push(text);const row=document.createElement('div');row.dataset.role='user';row.dataset.messageId='u'+sent.length;row.textContent=text;document.querySelector('#thread').append(row);clearParagraphComposer();};});
  await page.addScriptTag({content:fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8')+'\nwindow.P=RSProvider;'});
  const result=await page.evaluate(async()=>{
    const body='line\n'.repeat(48)+'x'.repeat(6979-48*5-1)+'\n';const stages=P.startupFeedbackMessages(body+'x'.repeat(63000));
    const expected=stages[0].text;P.setInputLock(true);try{await P.typeAndSend(expected);}finally{P.setInputLock(false);}
    return{expected,actual:sent[0],parts:stages.length,editor:P.editorText(),model:paragraphText()};
  });
  assert.equal(result.expected.length,7282);assert.equal(result.parts,10);assert.equal(result.expected[173],'B');assert.equal(result.actual,result.expected);assert.equal(result.editor,'');assert.equal(result.model,'');passed++;
  const literal='local x = Instance.new("TextLabel")\n\n\tx.Size = UDim2.fromOffset(10, 20)\nx.Text = "Zażółć 😀\u200B\u200C"\n\nreturn x\n';
  assert.equal(await page.evaluate(async value=>{P.setInputLock(true);try{await P.typeAndSend(value);}finally{P.setInputLock(false);}return sent.at(-1);},literal),literal);passed++;
  const sent=await page.evaluate(async()=>{const stages=P.startupFeedbackMessages('line\n'.repeat(15000));P.setInputLock(true);try{for(const stage of stages)await P.typeAndSend(stage.text);}finally{P.setInputLock(false);}return{expected:stages.map(s=>s.text),actual:sent.slice(2)};});assert.deepEqual(sent.actual,sent.expected);assert.equal(new Set(sent.actual).size,sent.actual.length);passed++;
  await page.evaluate(()=>P.writeDraft('First\n\nSecond',''));await page.locator('.ProseMirror').press('End');await page.keyboard.insertText(' USER');await page.waitForFunction(()=>paragraphText().includes(' USER'));assert.equal(await page.evaluate(()=>P.editorText()),await page.evaluate(()=>paragraphText()));passed++;
  assert.deepEqual(errors,[]);console.log(passed+' real ProseMirror checks passed: 7282-char context, exact blank lines/Unicode, all parts once and trusted user edits');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
