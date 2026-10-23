// Real React, real MAIN/isolated worlds, controlled virtual viewport.
// No authenticated Copilot account, native model, bridge or Studio is used.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const deps=process.env.PLAZCODE_BROWSER_DEPS||'/tmp/plazcode-ui-r19';
const {buildSync}=require(path.join(deps,'node_modules/esbuild'));
const root=path.resolve(__dirname,'../..');
const fixture=buildSync({entryPoints:[path.join(__dirname,'fixtures/controlled-composers.js')],bundle:true,write:false,format:'iife',nodePaths:[path.join(deps,'node_modules')]}).outputFiles[0].text;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAZCODE_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});let passed=0;
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><main><div role="article" class="fai-CopilotMessage"><div class="fai-CopilotMessage__content" id="reply"></div></div></main>'}));
  await page.goto('https://copilot.com/chat/conversation/fixture');await page.addScriptTag({content:fixture});
  await page.evaluate(()=>{window.copyClicks=0;window.copies=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copies.push(text)}});mountScriptorCode(document.querySelector('#reply'),'{"command":"list_commands"}');});
  const cdp=await page.context().newCDPSession(page),tree=await cdp.send('Page.getFrameTree');
  const {executionContextId}=await cdp.send('Page.createIsolatedWorld',{frameId:tree.frameTree.frame.id,worldName:'plazcode-code-source-test'});
  async function isolated(expression){const result=await cdp.send('Runtime.evaluate',{contextId:executionContextId,expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text+' '+result.exceptionDetails.exception?.description);return result.result.value;}
  await isolated(fs.readFileSync(process.env.PLAZCODE_TEST_PROVIDER||path.join(root,'providers/webchats.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'core/parser.js'),'utf8')+'\nwindow.P=RSProvider;window.parse=RSParse;');
  const read='(()=>{const reply=P.readAssistant();const source=P.commandText(reply.reply,reply.item);const calls=parse.parseToolCalls(source);return {source,calls,diagnostics:P.transportDiagnostics().live};})()';
  let result=await isolated(read);assert.equal(result.calls[0].tool,'list_commands');assert.equal(result.diagnostics.code_sources[0].reader,'visible_handshake');passed++;
  const code='local x=Instance.new("TextLabel")\nx.Size=UDim2.fromOffset(100,40)\nx.TextColor3=Color3.fromRGB(1,2,3)\n'+('-- Zażółć 😀\t\u200B\u200C\n'.repeat(8000))+'return 10',source=JSON.stringify({command:'execute_luau',params:{code}});
  await page.evaluate(source=>setScriptorCode(source),source);
  assert.equal((await isolated(read)).source,'');passed++;
  // The isolated world cannot see React's expando. Only the MAIN reader can
  // publish the complete source over the synchronous DOM event protocol.
  assert.equal(await isolated('Object.getOwnPropertyNames(document.querySelector(".scriptor-codeblock-virtualized")).some(k=>k.startsWith("__reactFiber$"))'),false);passed++;
  await page.addScriptTag({content:fs.readFileSync(path.join(root,'providers/copilot-code.js'),'utf8')});
  result=await isolated(read);assert.equal(result.source,source);assert.equal(result.calls.length,1);assert.equal(result.calls[0].arguments.code,code);assert.equal(result.diagnostics.code_sources[0].reader,'full_model');assert.equal(result.diagnostics.code_sources[0].model_kind,'react-code');assert.ok(source.length>100000);assert.ok(await page.locator('[role="textbox"]').evaluate(node=>node.textContent.length)<100);passed++;
  for(let i=11;i<=14;i++){
    const nextCode=code.replace('return 10','return '+i),next=JSON.stringify({command:'execute_luau',params:{code:nextCode}});assert.equal(next.length,source.length);await page.evaluate(next=>setScriptorCode(next),next);result=await isolated(read);assert.equal(result.source,next);assert.equal(result.calls[0].arguments.code,nextCode);passed++;
  }
  const incomplete=source.slice(0,-3);await page.evaluate(value=>setScriptorCode(value),incomplete);result=await isolated(read);assert.equal(result.source,incomplete);assert.equal(result.calls.length,0);passed++;
  await page.evaluate(value=>setScriptorCode(value),source);await isolated(read);assert.deepEqual(await page.evaluate(()=>({copies:copies.length,clicks:copyClicks})),{copies:0,clicks:0});passed++;
  await page.getByRole('button',{name:'Copy code',exact:true}).click();assert.deepEqual(await page.evaluate(()=>({copies:copies.length,clicks:copyClicks})),{copies:1,clicks:1});assert.equal(await page.evaluate(()=>copies[0]),source);passed++;
  await page.evaluate(()=>{const node=document.createElement('p');node.textContent='I cannot participate in or control external browser extensions by emitting structured commands for them.';document.querySelector('#reply').prepend(node);});assert.equal((await isolated(read)).source,'');passed++;
  assert.deepEqual(errors,[]);console.log(passed+' MAIN/isolated-world checks passed: real React, full source, offscreen edits, incomplete JSON, untouched clipboard and refusal');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
