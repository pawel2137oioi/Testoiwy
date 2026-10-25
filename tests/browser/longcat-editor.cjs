// The reported LongCat placeholder uses ProseMirror. This checks real default
// PM/Tiptap paste and source serialization, not a private authenticated app.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),deps=process.env.PLAZCODE_BROWSER_DEPS||'/tmp/plazcode-ui-r19',pm=process.env.PLAZCODE_PM_DEPS||'/tmp/plazcode-pm-r31',tiptap=process.env.PLAZCODE_TIPTAP_DEPS||'/tmp/plazcode-tiptap-r34';
const {buildSync}=require(path.join(deps,'node_modules/esbuild'));
const fixture=buildSync({entryPoints:[path.join(__dirname,'fixtures/longcat-native-editor.js')],bundle:true,write:false,format:'iife',nodePaths:[path.join(tiptap,'node_modules'),path.join(pm,'node_modules')]}).outputFiles[0].text;
const provider=fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});let passed=0;
 try{
  for(const kind of ['prosemirror','tiptap']){
   const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   try{
    await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><main><section class="message-list"></section><form class="chat-input-container"><div id="editor-host"></div><svg id="native-send" class="svg-icon send-icon" aria-hidden="true" width="14px" height="14px"><use href="#icon-send" fill="currentColor"></use></svg></form></main>'}));
    await page.goto('https://longcat.ai/chat/t');await page.addStyleTag({content:'.ProseMirror{min-height:60px;white-space:pre-wrap}p{margin:0}'});await page.addScriptTag({content:fixture});
    await page.evaluate(kind=>{
      mountNativeLongcatEditor(document.querySelector('#editor-host'),kind);window.sent=[];window.modelAtSend=[];
      document.querySelector('#native-send').onclick=()=>{const value=modelText();sent.push(value);modelAtSend.push(modelJSON());const row=document.createElement('div');row.dataset.role='user';row.dataset.messageId='u'+sent.length;row.textContent=value;document.querySelector('.message-list').append(row);clearModel();};
    },kind);
    await page.addScriptTag({content:provider+'\nwindow.P=RSProvider;'});
    const value='First  line\n\n\tlocal x = Instance.new("Part")\n\n\nlocal s = "Zażółć 😀 <script> &lt; ▶\u200B\u200C"\nreturn x\n';
    if(process.env.PLAZCODE_EXPECT_BASELINE_FAILURE==='1'){
      await assert.rejects(()=>page.evaluate(async value=>P.typeAndSend(value),value),/prepared text changed/);
      assert.deepEqual(await page.evaluate(()=>sent),[]);passed++;console.log(kind+': previous plain-text transport loses blank lines; no Send');continue;
    }
    for(const expected of [value,'\nLeading line\n\n','One\n\n\n\nLast','  spaced\ttext  \n','local s="\u200B\u200C"\n\nreturn s\u200B\u200C']){
      const result=await page.evaluate(async expected=>{P.setInputLock(true);try{await P.typeAndSend(expected);}finally{P.setInputLock(false);}return{actual:sent.at(-1),model:modelAtSend.at(-1),editor:P.editorText(),text:modelText()};},expected);
      assert.equal(result.actual,expected,kind);assert.equal(result.editor,'');assert.equal(result.text,'');assert.equal(result.model.content.length,1,'one paragraph keeps getText block separators out of source');passed++;
    }
    for(const expected of ['\n','First\n\nSecond\n']){
      const result=await page.evaluate(async expected=>{const wrote=await P.writeDraft(expected,'');const result={ok:wrote.ok,source:P.editorText(),model:modelText(),warning:P.modeWarning()};const clear=await P.writeDraft('',expected);result.cleared=clear.ok&&modelText()===''&&P.editorText()==='';return result;},expected);
      assert.deepEqual(result,{ok:true,source:expected,model:expected,warning:'',cleared:true});passed++;
    }
    const result=await page.evaluate(async()=>{const stages=P.startupFeedbackMessages('Reference\n\n\tvalue  value\n'.repeat(1500));for(const stage of stages)await P.typeAndSend(stage.text);return{expected:stages.map(stage=>stage.text),actual:sent.slice(5)};});assert.deepEqual(result.actual,result.expected);assert.equal(new Set(result.actual).size,result.actual.length);passed++;
    await page.evaluate(()=>P.writeDraft('Owned\n\nsource',''));await page.locator('.ProseMirror').press('End');await page.keyboard.insertText(' USER');assert.equal(await page.evaluate(()=>P.editorText()),await page.evaluate(()=>modelText()));passed++;
    const clear=await page.evaluate(async()=>{const current=P.editorText();const result=await P.writeDraft('',current);return{ok:result.ok,source:P.editorText(),model:modelText()};});assert.deepEqual(clear,{ok:true,source:'',model:''});passed++;
    assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>sent.length),5+result.expected.length);
    console.log(kind+': default parser, model text, exact source, staged context, trusted user edit and clear passed');
   }catch(error){console.error(kind,await page.evaluate(()=>({model:modelText(),json:modelJSON(),html:document.querySelector('.ProseMirror').innerHTML,read:P.editorText()})));throw error;}finally{await page.close();}
  }
  console.log(passed+' native LongCat editor checks passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
