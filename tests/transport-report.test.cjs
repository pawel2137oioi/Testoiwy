// Local diagnostics and catalogue regressions. No account or Studio access.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=process.env.PLAZCODE_REPORT_ROOT||path.resolve(__dirname,'..'),main=fs.readFileSync(path.join(root,'core/main.js'),'utf8');
function section(a,b){const i=main.indexOf(a),j=main.indexOf(b,i);assert.ok(i>=0&&j>i,a);return main.slice(i,j);}
const diagnostics=()=>main.includes('  function transportDiagnostics()')?section('  function transportDiagnostics()','  function asStateTag()'):'';
function catalogue(cached=false,duplicate=false){
 const tools=[{name:'execute_luau',server:'roblox',inputSchema:{type:'object',properties:{code:{type:'string'}}}}];if(duplicate)tools.push({name:'plazcode_status',server:'wrong',inputSchema:{required:['wrong']}});
 const A={toolList:cached?tools:[],toolsAt:10000},snapshots=[],c=vm.createContext({A,P:{setToolList:list=>snapshots.push(list)},Date:{now:()=>10000},TOOLS_TTL_MS:30000,refreshPersonalMemory:async()=>{},activeEngine:()=> 'roblox',window:{},isBlockedTool:()=>false,importedRobloxTools:()=>[],DESKTOP_TOOL_DESCRIPTIONS:{},syncDesktopToolSnapshot(){},diag(){},bg:async()=>({ok:true,tools}),setTimeout});
 const helper=main.includes('  function advertiseLocalStatus(')?section('  function advertiseLocalStatus(','  async function ensureTools('):'';
 vm.runInContext(helper+section('  async function ensureTools(','  function luauLiteral(')+';globalThis.ensure=ensureTools;',c);return {c,A,snapshots};
}
for(const cached of [false,true])for(const duplicate of [false,true])test('local status is an advertised schema: cached='+cached+', duplicate='+duplicate,async()=>{
 const f=catalogue(cached,duplicate),list=await f.c.ensure(),rows=list.filter(t=>t.name==='plazcode_status');
 assert.equal(rows.length,1);assert.equal(rows[0].server,'roblox');assert.equal(rows[0].inputSchema.type,'object');assert.equal((rows[0].inputSchema.required||[]).length,0);assert.deepEqual(Object.keys(rows[0].inputSchema.properties),[]);assert.ok(f.A.toolNames.has('plazcode_status'));
});
test('repeated cached catalogue reads do not duplicate the local helper',async()=>{
 const f=catalogue();await f.c.ensure();await f.c.ensure();await f.c.ensure();assert.equal(f.A.toolList.filter(t=>t.name==='plazcode_status').length,1);
});
test('compact command list contains the exact status command and zero arguments',async()=>{
 const f=catalogue(),list=await f.c.ensure();vm.runInContext(fs.readFileSync(path.join(root,'core/config.js'),'utf8')+';globalThis.R=RS;',f.c);
 assert.match(f.c.R.compactTools(list),/plazcode_status\(\)/);
});
test('show-approach instructions preserve both accepted execute_luau formats',()=>{
 const c=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'core/config.js'),'utf8')+';globalThis.R=RS;',c);
 const text=c.R.approachSummaryPolicy(true);assert.doesNotMatch(text,/markers instead of JSON/i);assert.match(text,/literal.*markers.*JSON|JSON.*literal.*markers/i);assert.match(text,/preserve.*format/i);
});
function uiFixture(denied=false){
 const dom=new JSDOM('<!doctype html><body><div id="item"></div><div id="menu"><span data-plazcode-transport></span><button id="rs-copy-transport">Copy transport report</button><pre id="rs-transport-report" hidden></pre></div>',{url:'https://chat.deepseek.com/a/chat/test',runScripts:'outside-only'}),w=dom.window,c=dom.getInternalVMContext(),copies=[];
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{if(denied)throw Error('denied');copies.push(text);}}});
 Object.assign(w,{A:{bridge:{connected:true},toolList:[{name:'execute_luau'}],lastParseFailure:{reason:'malformed',format:'raw_luau',chars:144,open:false}},P:{id:'deepseek',build:'r11',findToolBlockSpot:()=>null,chipAtItemLevel:true},RSParse:{build:'r11',hasCommandShape:()=>false},RS:{toolCategory:()=> 'edit'},diag(){},iconFor:()=>'',SVG:()=>''});
 vm.runInContext(diagnostics()+section('  const decorate = {','  const ui = (() => {')+';window.decorator=decorate;',c);
 return {w,c,copies,item:w.document.querySelector('#item'),menu:w.document.querySelector('#menu'),decorate:w.decorator};
}
test('copying an error card copies source exactly without opening it or sending a command',async()=>{
 const f=uiFixture(),source='###LUA###\nlocal label = Instance.new("TextLabel")\n###END_LUA###';f.decorate.toolBox(f.item,'execute_luau','err','unreadable Luau',true,source);
 const chip=f.item.querySelector('.rs-chip'),button=chip.querySelector('.rs-chip-copy');assert.ok(button);assert.equal(chip.classList.contains('open'),false);
 await button.onclick(new f.w.MouseEvent('click'));assert.deepEqual(f.copies,[source]);assert.equal(chip.classList.contains('open'),false);
});
test('a same-length source replacement updates both expanded text and its copy action',async()=>{
 const f=uiFixture(),first='return "A"',second='return "B"';
 f.decorate.toolBox(f.item,'execute_luau','err','unreadable Luau',true,first);f.decorate.toolBox(f.item,'execute_luau','err','unreadable Luau',true,second);
 assert.equal(f.item.querySelector('.rs-chip-body pre').textContent,second);await f.item.querySelector('.rs-chip-copy').onclick(new f.w.MouseEvent('click'));assert.deepEqual(f.copies,[second]);
});
test('raw source with HTML-like text stays literal in the error card',()=>{
 const f=uiFixture(),source='return "<img src=x onerror=alert(1)>"';f.decorate.toolBox(f.item,'execute_luau','err','unreadable Luau',true,source);
 assert.equal(f.item.querySelector('.rs-chip-body pre').textContent,source);assert.equal(f.item.querySelector('img'),null);
});
test('denied clipboard access exposes source for ordinary manual copying',async()=>{
 const f=uiFixture(true),source='return "copy me"';f.decorate.toolBox(f.item,'execute_luau','err','unreadable Luau',true,source);await f.item.querySelector('.rs-chip-copy').onclick(new f.w.MouseEvent('click'));
 assert.equal(f.copies.length,0);assert.equal(f.item.querySelector('.rs-chip').classList.contains('open'),true);assert.equal(f.item.querySelector('.rs-chip-body pre').textContent,source);
});
test('source survives rebuilding an owned error card after a DOM remount',async()=>{
 const f=uiFixture(),source='###LUA###\nreturn "source, not PlayerGui=true Interface=true"\n###END_LUA###';f.decorate.toolBox(f.item,'execute_luau','err','unreadable Luau',true,source);
 f.item.querySelector('.rs-chip').remove();f.decorate.ensureOwnedChip(f.item);await f.item.querySelector('.rs-chip-copy').onclick(new f.w.MouseEvent('click'));assert.deepEqual(f.copies,[source]);
});
for(const denied of [false,true])test('settings transport report works locally with clipboard denied='+denied,async()=>{
 const f=uiFixture(denied);vm.runInContext('globalThis.mount=mountTransportDiagnostics;',f.c);f.c.mount(f.menu);
 assert.match(f.menu.querySelector('[data-plazcode-transport]').textContent,/core:r36.*parser:r11.*provider:r11/);await f.menu.querySelector('button').onclick();
 const pre=f.menu.querySelector('pre');assert.equal(pre.hidden,false);const info=JSON.parse(pre.textContent);assert.equal(info.transport_build.core,'r36');assert.equal(info.transport_build.parser,'r11');assert.equal(info.provider,'deepseek');assert.equal(info.last_parse_failure.chars,144);assert.equal(f.copies.length,denied?0:1);if(!denied)assert.equal(f.copies[0],pre.textContent);
});
test('state tag includes the actually loaded transport versions',()=>{
 const f=uiFixture();Object.assign(f.w,{activeEngine:()=> 'roblox'});vm.runInContext(section('  function asStateTag()','  // Is `name` a tool')+';globalThis.tag=asStateTag;',f.c);
 assert.match(f.c.tag(),/TRANSPORT=core:r36\/parser:r11\/provider:r11/);
 assert.match(f.c.tag(),/plazcode_status \{\}.*does not require Studio support/);
});
test('local status does not depend on the bridge advertising its name or a Studio connection',async()=>{
 let bridgeCalls=0;const c=vm.createContext({setTimeout,clearTimeout,setInterval,clearInterval,document:{hidden:false},A:{bridge:{connected:false},toolList:[{name:'execute_luau'}],toolNames:new Set(['execute_luau']),stop:false},P:{id:'deepseek',build:'r11'},RSParse:{build:'r11'},window:{},activeEngine:()=> 'roblox',permMode:'full',bareToolName:n=>n,isBlockedTool:()=>false,importedRobloxTools:()=>[],bg:async()=>{bridgeCalls++;throw Error('Status must stay local');},diag(){}});
 vm.runInContext(fs.readFileSync(path.join(root,'core/tool-guard.js'),'utf8'),c);
 vm.runInContext(diagnostics()+section('  async function runTool(call) {','  function argSummary(call) {')+';globalThis.run=runTool;',c);
 const info=JSON.parse((await c.run({tool:'plazcode_status',arguments:{}})).split('\n').slice(1).join('\n'));assert.equal(info.bridge_connected,false);assert.equal(info.transport_build.parser,'r11');assert.equal(bridgeCalls,0);
});
test('parse-error handling keeps the actual rejected text and paints the final failed attempt',async()=>{
 const source='###LUA###\nlocal label = Instance.new(',paint=[],sent=[],banners=[],item={},c=vm.createContext({A:{},P:{id:'deepseek',build:'r11'},RSParse:{build:'r11',transportInfo:()=>({format:'raw_luau',chars:source.length,open:true}),toolNameFromText:()=> 'execute_luau',hasOpenToolBlock:()=>true},RS:{toolCategory:()=> 'edit',FEEDBACK:{parseError:()=> 'retry'}},diag(){},decorate:{toolBox:(...args)=>paint.push(args)},ui:{banner:(...args)=>banners.push(args)},submitAndGetBase:async text=>{sent.push(text);return 0;},res:{kind:'parse_error',reason:'malformed',raw:source,item},MAX_INVALID_TOOL_ATTEMPTS:6,SPLIT_HINT_AFTER:2,SPLIT_HINT:'split'});
 vm.runInContext(diagnostics()+'globalThis.check=async function(attempt){let invalidToolAttempts=attempt,base;for(let once=0;once<1;once++){\n'+section('        if (res.kind === "parse_error") {','        if (res.kind === "text") {')+'\n}};',c);
 await c.check(0);await c.check(5);assert.equal(paint.length,2);assert.ok(paint.every(args=>args[5]===source));assert.ok(paint.every(args=>args[3]==='incomplete Luau'));assert.equal(sent.length,1);assert.equal(banners.length,1);assert.doesNotMatch(JSON.stringify(c.A.lastParseFailure),/Instance\.new/);
});
