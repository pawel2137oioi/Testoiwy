// Deterministic DOM fixtures. No ChatGPT account or Roblox connection required.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
class Element {
  constructor(tag, attrs = {}, children = []) {
    this.nodeType = 1; this.tagName = tag.toUpperCase(); this.attrs = { ...attrs };
    this.childNodes = []; this.parentElement = null; this.disabled = false; this.style = {}; this.offsetParent = {}; this.visible = true; this.value = ''; this.listeners = {};
    this.classList = { contains: name => (this.attrs.class || '').split(' ').includes(name) };
    this.replaceChildren(...children);
  }
  replaceChildren(...children) {
    this.childNodes = children.map(child => typeof child === 'string' ?
      { nodeType: 3, nodeValue: child, get textContent() { return this.nodeValue; } } : child);
    this.childNodes.forEach(child => { child.parentElement = this; });
  }
  get textContent() { return this.childNodes.map(child => child.textContent || '').join(''); }
  get innerText() { return this.textContent; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  removeAttribute(name) { delete this.attrs[name]; }
  getBoundingClientRect() { if (!this.visible) return {width:0,height:0}; return { x: 0, y: 100, top: 100, bottom: 180, left: 0, right: 500, width: 500, height: 80 }; }
  hasAttribute(name) { return this.getAttribute(name) !== null; }
  matches(selector) {
    return selector.split(',').some(part => {
      part = part.trim();
      // Split descendant combinators outside attribute values and :not().
      const tokens = part.match(/(?:\[[^\]]*\]|:not\([^)]*\)|[^\s])+/g) || [];
      if (tokens.length > 1) {
        if (!this.matches(tokens.pop())) return false;
        let parent = this.parentElement;
        while (tokens.length) {
          const token = tokens.pop();
          while (parent && !parent.matches(token)) parent = parent.parentElement;
          if (!parent) return false;
          parent = parent.parentElement;
        }
        return true;
      }
      let rejected = false;
      part = part.replace(/:not\(([^)]*)\)/g, (_, sub) => { if (this.matches(sub)) rejected = true; return ''; });
      if (rejected) return false;
      const tag = part.match(/^[a-z]+/i)?.[0];
      if (tag && tag.toUpperCase() !== this.tagName) return false;
      const id = part.match(/#([\w-]+)/)?.[1];
      if (id && this.attrs.id !== id) return false;
      const cls = part.match(/\.([\w-]+)/)?.[1];
      if (cls && !this.classList.contains(cls)) return false;
      for (const match of part.matchAll(/\[([\w-]+)(?:(\*?=|\^=|\$=)["']?([^\]"']*?)["']?( i)?)?\]/g)) {
        let value = this.getAttribute(match[1]), wanted = match[3];
        if (value === null) return false;
        if (!match[2]) continue;
        if (match[4]) { value = value.toLowerCase(); wanted = wanted.toLowerCase(); }
        if (match[2] === '=' && value !== wanted) return false;
        if (match[2] === '*=' && !value.includes(wanted)) return false;
        if (match[2] === '^=' && !value.startsWith(wanted)) return false;
        if (match[2] === '$=' && !value.endsWith(wanted)) return false;
      }
      return true;
    });
  }

  closest(selector) { for (let el = this; el; el = el.parentElement) if (el.matches(selector)) return el; return null; }
  contains(node) { for (let el = node; el; el = el.parentElement) if (el === this) return true; return false; }
  querySelectorAll(selector) {
    const found = [];
    for (const child of this.childNodes) if (child.nodeType === 1) {
      if (child.matches(selector)) found.push(child);
      found.push(...child.querySelectorAll(selector));
    }
    return found;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  compareDocumentPosition() { return 4; }
  dispatchEvent() { return true; }
}

function fixture(children = []) {
  const ed = new Element('textarea', {'data-mobile-composer-prompt':'', 'aria-label':'Pracuj z ChatGPT'});
  const button = new Element('button', {'data-composer-submit':'',type:'submit','aria-label':'Wyślij wiadomość','data-send-label':'Wyślij wiadomość','data-stop-label':'Zatrzymano generowanie'});
  const form = new Element('form', {'data-chatgpt-composer':''}, [new Element('div',{'data-composer-editor-host':''},[ed]),button]);
  const body = new Element('body',{},[...children,form]);
  const listeners = {}; let clock = 10000; let clicks = 0;
  const document = {body, documentElement:new Element('html'),querySelectorAll:s=>body.querySelectorAll(s),querySelector:s=>body.querySelector(s),addEventListener:(n,f)=>{listeners[n]=f;},dispatchEvent:()=>true};
  document.documentElement.classList.add = ()=>{}; document.documentElement.classList.remove = ()=>{};
  class Textarea { set value(v) { this._value=v; } get value(){return this._value || '';} }
  button.click = ()=>{clicks++;ed.value='';}; ed.focus=()=>{};
  const context = vm.createContext({document,window:{},location:{pathname:'/c/test'},getComputedStyle:e=>({visibility:e.visible?'visible':'hidden',display:e.visible?'block':'none'}),HTMLTextAreaElement:Textarea,HTMLInputElement:Textarea,Event:class{constructor(type){this.type=type;}},CustomEvent:class{},Date:class extends Date{static now(){return clock;}},setTimeout(f,ms){clock+=Math.max(ms,1);queueMicrotask(f);}});
  vm.runInContext(fs.readFileSync(process.env.PLAZCODE_PROVIDER_FILE || path.join(root,'providers/chatgpt.js'),'utf8')+'\nglobalThis.P = RSProvider;',context);
  return {P:context.P,ed,button,body,listeners,advance(ms){clock+=ms;},clicks:()=>clicks};
}
const unit = (key,children,ids='a') => new Element('section',{'data-chatgpt-search-unit-key':key,'data-chatgpt-search-message-ids':ids},children);
const reply = children=>new Element('div',{'data-markdown-text-style':'assistant-message'},children);

test('Polish Work textarea is detected and hidden copies are ignored',()=>{
 const f=fixture();assert.equal(f.P.getEditor(),f.ed);f.ed.visible=false;assert.equal(f.P.getEditor(),null);
});
test('transcript editors and dialogs cannot become the composer',()=>{
 const code=new Element('textarea',{'data-mobile-composer-prompt':''});
 const dialog=new Element('div',{role:'dialog'},[new Element('div',{contenteditable:'true','data-lexical-editor':'true'})]);
 const f=fixture([unit('t:assistant',[code]),dialog]);assert.equal(f.P.getEditor(),f.ed);
});
test('Work units render once and nested final markdown is read once',()=>{
 const u=unit('t:user',[new Element('p',{},['question'])]);
 const a=unit('t:assistant',[reply([reply(['answer'])])]);const f=fixture([u,a]);
 assert.equal(f.P.userCount(),1);assert.equal(f.P.assistantCount(),1);assert.equal(f.P.readAssistant().reply,'answer');
});
test('reasoning tool-shaped text is excluded from final Work reply',()=>{
 const a=unit('t:assistant',[reply(['final',new Element('div',{'data-markdown-text-style':'thinking'},['{"tool":"do_not_run"}'])])]);
 const f=fixture([a]);assert.equal(f.P.readAssistant().reply,'final');assert.match(f.P.readAssistant().thinking,/do_not_run/);
});
test('unit without search message ids is still recognized',()=>{
 const a=unit('t:assistant',[reply(['answer'])]);a.removeAttribute('data-chatgpt-search-message-ids');const f=fixture([a]);assert.equal(f.P.assistantCount(),1);
});
test('growing Work message ids do not change turn identity',()=>{
 const a=unit('t:assistant',[reply(['answer'])]);const f=fixture([a]);const id=f.P.lastAssistantId();a.setAttribute('data-chatgpt-search-message-ids','a b c');assert.equal(f.P.lastAssistantId(),id);
});
test('Polish stop remains a hard generation signal throughout silent reasoning',()=>{
 const f=fixture();f.button.setAttribute('aria-label','Zatrzymano generowanie');assert.equal(f.P.isHardGenerating(),true);f.advance(60000);assert.equal(f.P.isGenerating(),true);
 f.button.setAttribute('aria-label','Wyślij wiadomość');assert.equal(f.P.isHardGenerating(),false);
});
test('native send and stop clicks call the correct handlers',()=>{
 const f=fixture();let sends=0,stops=0;f.P.installSendHooks({isBlocked:()=>false,isStarted:()=>true,onUserMessage:()=>sends++,onNativeStop:()=>stops++});
 f.listeners.click({target:f.button});assert.equal(sends,1);assert.equal(stops,0);
 f.button.setAttribute('aria-label','Zatrzymano generowanie');f.listeners.click({target:f.button});assert.equal(stops,1);assert.equal(sends,1);
});
test('aria-disabled Work send is never clicked',async()=>{
 const f=fixture();f.button.setAttribute('aria-disabled','true');await f.P.typeAndSend('tool result');assert.equal(f.clicks(),0);
});
test('ordinary Chat messages remain readable',()=>{
 const a=new Element('div',{'data-message-author-role':'assistant','data-message-id':'old-layout'},[new Element('div',{class:'markdown'},['answer'])]);const f=fixture([a]);assert.equal(f.P.readAssistant().reply,'answer');assert.equal(f.P.lastAssistantId(),'old-layout');
});
