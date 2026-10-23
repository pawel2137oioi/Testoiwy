// SPDX-License-Identifier: GPL-3.0-or-later
// Tencent, Motif and ChatWave hooks observed 2026-10-21. Arcee hooks recovered
// from its public app bundle 2026-10-23; copilot.com remains a semantic contract.
// Unknown message roles are never executable.
const RSProvider = (() => {
  'use strict';
  const sites = {
    // Contract-based adapters: these semantic hooks must be confirmed on a
    // signed-in page. Never infer assistant roles from arbitrary page text.
    'platform.arcee.ai': {
      id:'arcee',name:'Arcee',experimental:true,strictComposer:true,compact:true,
      editor:'textarea#chat-input-textarea, textarea[data-testid="chat-input"], textarea, [contenteditable="true"], [contenteditable="plaintext-only"]',
      frame:'[data-chat-composer], [data-testid="chat-composer"], [data-testid="composer"], form',
      send:'button[data-testid="send-button"], button[aria-label*="send" i], button[aria-label*="submit" i], button[type="submit"]',
      stop:'button[data-testid="stop-button"], button[aria-label*="stop" i]',
      user:'.chat-user-message, [data-message-author-role="user"], [data-message-role="user"], [data-role="user"]',
      assistant:'[data-message-author-role="assistant"], [data-message-role="assistant"], [data-role="assistant"]',
      body:'.chat-response-content .markdown-content, .markdown, .prose, [data-testid="message-content"]',
      userBody:'.select-text',
      max:50000,page:8000,startupPage:7000,feedbackBudget:9000,
    },
    'copilot.com': {
      id:'copilot',name:'Copilot',experimental:true,strictComposer:true,compact:true,
      editor:'textarea, [contenteditable="true"], [contenteditable="plaintext-only"]',
      frame:'[data-testid="composer"], [data-testid="composer-content"], [data-testid="chat-composer"], form',
      send:'button[data-testid="send-button"], button[data-testid="submit-button"], button[aria-label*="send" i], button[aria-label*="submit" i], button[aria-label*="wyślij" i], button[aria-label*="prześlij" i], button[title*="wyślij" i], button[type="submit"]',
      stop:'button[data-testid="stop-button"], button[aria-label*="stop" i], button[aria-label*="zatrzymaj" i], button[aria-label*="przerwij" i]',
      user:'[data-message-author-role="user"], [data-message-role="user"], [data-role="user"], [data-content="user-message"], [data-message-author="user"], [data-testid="user-message"]',
      assistant:'[data-message-author-role="assistant"], [data-message-role="assistant"], [data-role="assistant"], [data-content="ai-message"], [data-content="response"], [data-message-author="assistant"], [data-message-author="bot"], [data-testid="assistant-message"], [data-testid="bot-message"], [data-testid="answer"]',
      body:'.markdown, .prose, .markdown-body, .response-text, .text-response, message-content, [data-testid="message-content"]',
      max:0,page:8000,startupPage:7000,feedbackBudget:9000,
    },
    'aistudio.tencent.ai': {
      id: 'tencent', name: 'Tencent Hy', editor: '.hy-chat-input textarea',
      editorFallback: '.t-textarea__inner', frame: '.hy-chat-input',
      send: '.hy-chat-input-send-btn',
      stop: '.hy-chat-input-stop-btn, .hy-chat-input-send-btn--stop',
      user: '.agent-chat__list__item--human',
      assistant: '.agent-chat__list__item--ai',
      body: '.hyc-content-md',
      max: 0, page: 10000,
    },
    'chat.motiftech.io': {
      id: 'motif', name: 'Motif', editor: '#chat-textarea', frame: 'form',
      send: '[data-testid="document-send-button"]', stop: 'button[aria-label="Stop"]',
      user: '.group.justify-end .bg-primary-50',
      assistant: '[data-testid="document-model-answer-content"]',
      // The site's rejection says messages must be under 50,000 characters.
      body: '.prose', max: 49999, page: 10000,
    },
    'chat.thewave.cv': {
      id: 'chatwave', name: 'ChatWave', editor: '#chatInput', frame: '#inputIsland',
      send: '#sendBtn', stop: '#sendBtn[aria-label="Stop response"]',
      user: '#chatThread .msg-row.user', assistant: '#chatThread .msg-row.ai',
      body: '.msg-body', max: 16000, page: 10000,
    },
  };
  const site = sites[location.hostname];
  if (!site) throw Error('Unsupported PlazCode web chat host');
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let diag = () => {}, failure = '', ambiguous = false, sendEpoch = 0, sending = false;
  const timings = {GEN_IDLE_MS: 1800, REASON_IDLE_MS: 12000, WARMUP_MS: 45000,
    REASON_NOREPLY_MS: 90000, STABLE_MS: 9000, RESPONSE_TIMEOUT_MS: 600000};
  const OWN = '#rs-root, #rs-input-cover, .rs-chip';
  const read = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };
  const query = (root, sel) => read(() => root.querySelector(sel));
  const all = (root, sel) => read(() => Array.from(root.querySelectorAll(sel)), []);
  const visible = el => !!el && !el.closest(OWN) && read(() => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return !el.hidden && s.display !== 'none' && s.visibility !== 'hidden' &&
      s.opacity !== '0' && r.width > 0 && r.height > 0;
  }, false);
  const firstVisible = selector => all(document, selector).find(visible) || null;
  let lockedEditor=null;
  let copilotInputLocked=false, writingEditor=false;
  const editorLocks=new WeakMap();
  const copilotWritten=new WeakMap();
  function presentedValue(actual,expected,echo=false){
    // Copilot may append an invisible caret suffix (the report identified
    // U+200B U+200C). Project ONLY our known write:
    // preserve every character of expected, including its own invisible tail.
    // Never strip format characters from arbitrary drafts or command source.
    if(site.id!=='copilot' || !actual.startsWith(expected))return actual;
    const suffix=actual.slice(expected.length),padding=echo?suffix.replace(/^ /,''):suffix;
    return /^\u200B(?:[ \t\u00A0\u200B\u200C\uFEFF]|\r?\n)?$/.test(padding)?expected:actual;
  }
  const richEditor=ed=>!!ed && !/^(?:TEXTAREA|INPUT)$/.test(ed.tagName);
  const transcriptSelector='pre,code,[role="dialog"],'+site.user+','+site.assistant;
  function emptyCopilotFrame(ed) {
    if(site.id!=='copilot')return null;
    const labels=['placeholder','aria-label','data-placeholder'].map(name=>ed.getAttribute(name)||'').join(' ');
    // Copilot hides Send until input arrives. A labeled chat editor, or the
    // sole editor in /chat's main pane, must be found before that button exists.
    // The actual send still waits for an enabled local button after typing.
    const chatLabel=/copilot|send (?:a )?message|wyślij wiadomość|prześlij wiadomość/i.test(labels);
    const chatPane=/^\/chat(?:\/|$)/i.test(location.pathname) && ed.closest('main,[role="main"]');
    if(!chatLabel && !chatPane)return null;
    const parent=ed.parentElement;
    if(!parent || parent===document.body || parent===document.documentElement || parent.matches('main,[role="main"],'+transcriptSelector))return null;
    return parent;
  }
  function strictFrame(ed) {
    // Many React composers have neither a form nor a textbox role. Resolve
    // their nearest local send/stop row instead of requiring invented test IDs.
    // Never search across the page, another form or a transcript/settings pane.
    const boundary=ed.closest(site.frame);
    const controls=site.send+','+site.stop;
    for(let n=ed.parentElement,depth=0;n && depth<6;n=n.parentElement,depth++){
      if(n===document.body || n===document.documentElement || n.matches('main,[role="main"],'+transcriptSelector))break;
      const buttons=all(n,controls).filter(b=>visible(b) && !b.closest(OWN+','+transcriptSelector) && (!b.closest('form') || b.closest('form')===ed.closest('form')));
      const editors=all(n,site.editor).filter(e=>visible(e) && !e.closest(OWN+','+transcriptSelector));
      if(ed===lockedEditor && n.contains(ed) && !editors.includes(ed))editors.push(ed);
      if(buttons.length && editors.length===1 && editors[0]===ed)return n;
      if(n===boundary)break;
    }
    return boundary && boundary!==ed && !boundary.matches('main,[role="main"]') ? boundary : emptyCopilotFrame(ed);
  }
  const getEditor = () => {
    if(lockedEditor?.isConnected && visible(lockedEditor))return lockedEditor;
    if(!site.strictComposer)return firstVisible(site.editor) || (site.editorFallback && firstVisible(site.editorFallback));
    const editors=all(document,site.editor+(site.editorFallback?', '+site.editorFallback:''));
    const candidates=editors.filter(ed=>visible(ed) && !ed.disabled && !ed.closest(OWN+','+transcriptSelector) && strictFrame(ed));
    return candidates.length===1 ? candidates[0] : null;
  };
  function richEditorText(ed){
    // Lexical adds a DOM-only trailing BR to empty paragraphs and paragraphs
    // ending in a line break. It is not part of the editor's text document.
    if(ed.matches('[data-lexical-editor="true"]') && [...ed.children].every(node=>node.tagName==='P')){
      const inline=node=>node.nodeType===3?node.nodeValue:node.nodeType!==1?'':node.tagName==='BR'?(node===node.parentNode.lastChild?'':'\n'):[...node.childNodes].map(inline).join('');
      return [...ed.children].map(inline).join('\n\n');
    }
    if(site.id==='copilot'){
      // innerText includes CSS text transforms and browser layout. Read the
      // editable document instead; noneditable controls and a marked
      // ProseMirror caret BR are not message source. Real BRs stay literal.
      const ignored=node=>node.nodeType===1 && node.matches('[contenteditable="false"],br.ProseMirror-trailingBreak');
      function content(node){
        if(node.nodeType===3)return node.nodeValue;
        if(node.nodeType!==1 || ignored(node))return '';
        if(node.tagName==='BR')return '\n';
        const children=[...node.childNodes].filter(child=>!ignored(child));
        if((node===ed || /^(P|DIV)$/.test(node.nodeName)) && children.length===1 && children[0].nodeName==='BR')return '';
        let value='',previous=null;
        for(const child of children){
          const block=child.nodeType===1 && /^(P|DIV|LI|PRE|H[1-6])$/.test(child.tagName);
          if(previous && (previous.block || block))value+=previous.paragraph || child.nodeName==='P'?'\n\n':'\n';
          value+=content(child);previous={block,paragraph:child.nodeName==='P'};
        }
        return value;
      }
      return content(ed);
    }
    return ed.innerText ?? ed.textContent ?? '';
  }
  const editorText = () => read(() => {
    const ed=getEditor();if(!richEditor(ed))return ed.value;
    const text=richEditorText(ed);
    return copilotWritten.has(ed)?presentedValue(text,copilotWritten.get(ed)):text;
  }, '');
  document.addEventListener('input',event=>{
    if(site.id==='copilot' && event.isTrusted && !writingEditor){const ed=getEditor();if(ed?.contains(event.target))copilotWritten.delete(ed);}
  },true);
  // Keep Copilot's framework-owned editable/readOnly attributes intact. Native
  // edits from the user are blocked during injection, while our synchronous
  // editing command is allowed to update the site's actual editor model.
  for(const eventName of ['beforeinput','paste','cut','drop','keydown'])document.addEventListener(eventName,event=>{
    if(site.id!=='copilot' || !copilotInputLocked || writingEditor || !event.isTrusted)return;
    const ed=getEditor();if(!ed || !ed.contains(event.target))return;
    if(eventName==='keydown' && (event.key.length!==1 && !['Backspace','Delete','Enter'].includes(event.key)))return;
    if(eventName==='keydown' && (event.ctrlKey||event.metaKey) && /^c$/i.test(event.key))return;
    event.preventDefault();event.stopImmediatePropagation();
  },true);
  function composerFrame() {
    const ed = getEditor();
    if (!ed) return null;
    if(site.strictComposer)return strictFrame(ed);
    if (site.id === 'motif') {
      // Motif has no form. Find the nearest wrapper containing its submit button.
      for (let n = ed.parentElement, i = 0; n && n!==document.body && i < 9; n = n.parentElement, i++)
        if (query(n, site.send)) return n;
    }
    return ed.closest(site.frame) || ed.parentElement;
  }
  function buttonLabel(el) { return String(el?.getAttribute('aria-label') || el?.title || el?.textContent || '').trim(); }
  function stopButton() {
    if (site.id === 'tencent') {
      const b = firstVisible(site.send);
      if (b && query(b, 'g[id="Stop generating"]')) return b;
    }
    const scope=site.strictComposer ? composerFrame() : document;
    return all(scope,site.stop).find(visible) ||
      all(scope, 'button,[role="button"]').find(el => visible(el) && /^(stop|stop response|stop generating|停止生成|停止回答)$/i.test(buttonLabel(el))) || null;
  }
  function sendButton() {
    const b = site.strictComposer ? all(composerFrame(),site.send).find(visible) : firstVisible(site.send);
    if (!b || b === stopButton()) return null;
    if (site.id === 'chatwave' && !/^Send message$/i.test(buttonLabel(b))) return null;
    return b;
  }
  const enabled = el => !!el && !el.disabled && el.getAttribute('aria-disabled') !== 'true' &&
    !/--disabled\b/.test(String(el.className));
  const matches = (el, selector) => read(() => el.matches(selector), false);
  const isUserItem = el => matches(el, site.user);
  const isAssistantItem = el => matches(el, site.assistant) && !isUserItem(el);
  function allItems() {
    const nodes = all(document, site.user + ', ' + site.assistant).filter(el => !el.closest(OWN));
    // Keep a single turn when the same role is marked on nested elements.
    return nodes.filter(el => !nodes.some(parent => parent !== el && parent.contains(el) &&
      isUserItem(parent) === isUserItem(el)));
  }
  const TEXT_UI_SKIP = '.rs-chip, .rs-chat-activity, button, [role="button"], .msg-actions, .msg-err, .reasoning, [data-testid*="reasoning"], [data-variant="Thoughts"], .hy-think, .code-block-header, .md-code-block-banner-wrap, .markdown-viewer-code-block-header, .hyc-common-markdown__code__hd-container, .linenumber, .line-number, .react-syntax-highlighter-line-number';
  const codeSource = pre => {
    const sources = all(pre,'code').filter(node => !node.closest(TEXT_UI_SKIP));
    return sources.length === 1 ? sources[0] : pre;
  };
  function codeMirrorSource(content){
    // Virtualized code cannot be reconstructed safely from the visible lines.
    // The MAIN-world tap publishes CodeMirror's full immutable document.
    document.dispatchEvent(new CustomEvent('rs-cm-sync'));
    const value=content.getAttribute('data-rs-cm'),length=content.getAttribute('data-rs-cm-len');
    return value!==null && length!==null && Number(length)===value.length ? value : null;
  }
  function textWithout(root, exclude = '', preserveEdges = false) {
    let text = '';
    const skip = TEXT_UI_SKIP + (exclude ? ', ' + exclude : '');
    function walk(node) {
      if (node.nodeType === 3) { text += node.nodeValue; return; }
      if (node.nodeType !== 1 || matches(node, skip)) return;
      if(site.id==='arcee' && node.matches('.cm-content')){
        const source=codeMirrorSource(node);
        if(source!==null){if(text && !text.endsWith('\n'))text+='\n';text+=source;}
        return;
      }
      if (node.tagName === 'BR') { text += '\n'; return; }
      if (node.tagName === 'PRE') {
        const source = codeSource(node);
        if (source !== node) {
          if (text && !text.endsWith('\n')) text += '\n';walk(source);
          if (!text.endsWith('\n')) text += '\n';return;
        }
      }
      const block = /^(P|DIV|PRE|LI|UL|OL|BLOCKQUOTE|H[1-6]|ARTICLE|SECTION)$/.test(node.tagName);
      if (block && text && !text.endsWith('\n')) text += '\n';
      const before = text.length;
      for (const child of node.childNodes) walk(child);
      if (block && text.length === before && node.tagName === 'P') text += '\n';
      else if (block && !text.endsWith('\n')) text += '\n';
    }
    if (root) walk(root);
    return preserveEdges ? text : text.trim();
  }
  function replyRoots(item) {
    if (!item) return [];
    if (!isAssistantItem(item)) return site.userBody && item.matches('.chat-user-message') ? all(item,site.userBody).slice(0,1) : [item];
    const roots=all(item,site.body).filter(node=>!node.closest(TEXT_UI_SKIP));
    const top=roots.filter(node=>!roots.some(parent=>parent!==node && parent.contains(node)));
    return top.length ? top : site.id==='tencent' || (site.id==='arcee' && item.matches('.chat-message')) ? [] : [item];
  }
  function classifyText(item, exclude, preserveEdges = false) {
    // Tencent renders command-shaped text inside its visible reasoning panel.
    // Until the final-answer container exists, there is no executable reply.
    // Motif may use separate prose roots for narration, code and final text.
    // Reading only the first makes a complete command disappear from the watcher.
    return replyRoots(item).map(body=>textWithout(body,exclude,preserveEdges)).join('\n');
  }
  const itemText = item => classifyText(item);
  const assistants = () => allItems().filter(isAssistantItem);
  const assistantCount = () => assistants().length;
  const userCount = () => allItems().filter(isUserItem).length;
  const lastAssistant = () => assistants().at(-1) || null;
  const ids = new WeakMap(); let seq = 0;
  function itemKey(item) {
    if (!item) return null;
    if (!ids.has(item)) ids.set(item, ++seq);
    return item.getAttribute('data-mid') || item.getAttribute('data-message-id') || ids.get(item);
  }
  function lastAssistantId() {
    const item=lastAssistant();
    return site.id==='motif' || site.strictComposer ? item?.getAttribute('data-mid') || item?.getAttribute('data-message-id') || null : itemKey(item);
  }
  const streamLen = (item = lastAssistant()) => classifyText(item).length;
  const chatIsEmpty = () => allItems().length === 0;
  const isFreshChat = () => chatIsEmpty() && !!getEditor();
  let stream = '', streamItem = null, grewAt = 0;
  function isGenerating() {
    if (loginGatePresent() || scanError()) return false;
    const item = lastAssistant(), text = classifyText(item);
    if (item !== streamItem || text !== stream) { streamItem = item; stream = text; grewAt = Date.now(); }
    // A long reasoning pause is still generation while native Stop is present.
    return !!stopButton() || (!!text && Date.now() - grewAt < timings.GEN_IDLE_MS);
  }
  function loginGatePresent() {
    if (/^\/(login|signin|auth)(\/|$)/i.test(location.pathname)) return true;
    return all(document, '#authModal,[role="dialog"],.t-dialog').some(el => visible(el) && /sign in|log in|登录/i.test(el.textContent || '')) ||
      !!firstVisible('#authTitle');
  }
  function scanError() {
    const currentError = query(lastAssistant(), '.msg-err');
    const surfaces = all(document, '[role="alert"], [role="status"], [data-sonner-toast], .t-message, .t-notification');
    if (currentError) surfaces.unshift(currentError);
    for (const el of surfaces) {
      if (!visible(el)) continue;
      const text = (el.innerText || el.textContent || '').trim();
      const lengthError = /your message is too long|please shorten it|message exceeds \d+ characters/i.test(text);
      // Status regions can contain ordinary chat progress; only recognize an
      // explicit native message-length rejection there.
      if (el.getAttribute('role') === 'status' && !lengthError) continue;
      if (text && (lengthError || /error|failed|not authenticated|log in|sign in|rate limit|too many|context|unavailable|unable to reach|network error|connection (?:lost|failed)|错误|失败/i.test(text))) return text.slice(0,500);
    }
    if (loginGatePresent()) return site.name + ': sign in before starting PlazCode.';
    return null;
  }
  function modeWarning() {
    if (loginGatePresent()) return '<b>' + site.name + '</b> — sign in, then open a chat.';
    // modeWarning disables Start in the shared UI. Experimental status belongs
    // in the provider label; only a missing/ambiguous composer blocks Start.
    if (!getEditor()) return '<b>' + site.name + '</b> — '+(site.experimental?'experimental adapter; ':'')+'open a chat and wait for one recognized message box.';
    return '';
  }
  function setInputLock(on) {
    if(site.id==='copilot'){
      copilotInputLocked=!!on;lockedEditor=on?getEditor():null;return;
    }
    const ed=getEditor();if(!ed)return;
    if(on){
      if(!editorLocks.has(ed))editorLocks.set(ed,richEditor(ed)?ed.getAttribute('contenteditable'):ed.readOnly);
      lockedEditor=ed;
      if(richEditor(ed))ed.setAttribute('contenteditable','false');else ed.readOnly=true;
    }else{
      const prior=editorLocks.get(ed);
      if(richEditor(ed)){if(prior===null)ed.removeAttribute('contenteditable');else if(prior!==undefined)ed.setAttribute('contenteditable',prior);}
      else ed.readOnly=prior===undefined?false:prior;
      editorLocks.delete(ed);lockedEditor=null;
    }
  }
  function setValue(ed,value){
    if(site.id==='copilot' && richEditor(ed))copilotWritten.set(ed,String(value));
    writingEditor=true;try{return writeValue(ed,value);}finally{writingEditor=false;}
  }
  function writeValue(ed, value) {
    if(richEditor(ed)){
      const editable=ed.getAttribute('contenteditable');
      try{
        if(editable==='false')ed.setAttribute('contenteditable','true');
        ed.focus();
        const range=document.createRange();range.selectNodeContents(ed);
        if(ed.matches('[data-lexical-editor="true"]') && ed.firstElementChild?.tagName==='P' && [...ed.children].every(node=>node.tagName==='P')){
          // Keep the range inside Lexical's paragraphs. Selecting the root
          // block boundaries can paste an extra empty paragraph into its model.
          const first=ed.firstElementChild,last=ed.lastElementChild;
          range.setStart(first,0);range.setEnd(last,last.childNodes.length-(last.lastChild?.nodeName==='BR'?1:0));
        }
        const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
        if(site.id==='copilot')document.dispatchEvent(new Event('selectionchange'));
        if(site.id==='copilot' && !value && typeof InputEvent==='function'){
          const event=new InputEvent('beforeinput',{inputType:'deleteContentBackward',bubbles:true,cancelable:true,composed:true});
          ed.dispatchEvent(event);if(event.defaultPrevented)return;
        }
        if(site.id==='copilot' && value && typeof DataTransfer==='function' && typeof ClipboardEvent==='function'){
          // Controlled editors (e.g. Lexical) discard bare DOM insertHTML.
          // Offer plain text to their paste handler so their model owns the
          // update. This does not read or alter the OS clipboard.
          const data=new DataTransfer();data.setData('text/plain',value);
          const event=new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true,composed:true});
          ed.dispatchEvent(event);if(event.defaultPrevented)return;
        }
        // insertText turns blank lines into DIV+BR in Chromium, which can
        // change innerText in pre-wrap editors. Insert escaped plain text in
        // a pre-wrap span through the native editing command instead. No
        // outgoing markup is interpreted; sendOnce verifies the exact text.
        const escaped=String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        if(typeof document.execCommand!=='function' || !document.execCommand(value?'insertHTML':'delete',false,value?'<span style="white-space: pre-wrap">'+escaped+'</span>':''))throw Error(site.name+': the chat editor did not accept the text. Nothing was sent.');
        ed.dispatchEvent(new Event('input',{bubbles:true}));
      }finally{if(editable===null)ed.removeAttribute('contenteditable');else ed.setAttribute('contenteditable',editable);}
      return;
    }
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ed, value);
    ed.dispatchEvent(new Event('input', {bubbles:true}));
  }
  async function writeDraft(value, expected) {
    const ed = getEditor();
    if (!ed || (expected !== undefined && editorText() !== expected)) return {ok:false};
    setValue(ed, String(value));
    await sleep(60);
    return {ok:getEditor() === ed && editorText() === String(value)};
  }
  function clearEditor() { const ed = getEditor(); if (ed) setValue(ed, ''); }
  async function waitFor(fn, ms) {
    const start = Date.now();
    for (let i=0; i<Math.ceil(ms/100); i++) {
      if (fn()) return true;
      if (Date.now()-start >= ms) break;
      await sleep(100);
    }
    return !!fn();
  }
  function startupFeedbackMessages(value) {
    const text = String(value), limit = site.startupPage || 10000;
    if ((!site.max && !site.compact) || text.length <= limit) return [{text}];
    const chunks = []; let offset = 0;
    while (offset < text.length) {
      let end = Math.min(offset + limit, text.length);
      if (end < text.length) {
        const line = text.lastIndexOf('\n', end);
        if (line > offset + limit / 2) end = line + 1;
        if (/[\uD800-\uDBFF]/.test(text[end - 1])) end--;
      }
      chunks.push(text.slice(offset, end)); offset = end;
    }
    return chunks.map((chunk, index) => {
      const final = index === chunks.length - 1;
      const ack = `PlazCode startup part ${index + 1}/${chunks.length} received.`;
      return {text:`⟦RS-SYS⟧ PlazCode startup context part ${index + 1}/${chunks.length}. Preserve all parts in order. This is a command reference, not a project task. Do not run commands while receiving these parts.\n\nBEGIN CONTEXT PART\n${chunk}\nEND CONTEXT PART\n\n` +
        (final ? 'All parts arrived. The extension returned the command reference. Reply exactly "PlazCode is ready." and wait for the user task.' : `More context follows. Reply exactly "${ack}" and nothing else.`),
        ...(final ? {} : {ack})};
    });
  }
  function isPolicyRefusal(value) {
    // A retracted claim ("I incorrectly said I cannot access Studio") is not a
    // current refusal. Remove only that reported clause; a following "but ..."
    // or a separate refusal remains authoritative. Never infer acceptance from
    // the mere presence of a command block.
    const text = String(value || '').replace(/[’‘]/g,"'")
      .replace(/\b(?:błędnie|blednie|niesłusznie|nieslusznie|omyłkowo|omylkowo)\s+(?:stwierdziłem|stwierdzilem|napisałem|napisalem|powiedziałem|powiedzialem|uznałem|uznalem)\s*,?\s*(?:że|ze)\s+[^.!?;\n]{0,400}?(?=[.!?;\n]|,?\s+(?:ale|jednak|but|however)\b|$)/gi,' ')
      .replace(/\bI\s+(?:(?:incorrectly|wrongly|mistakenly)\s+(?:said|stated|claimed|wrote)|was\s+wrong\s+(?:when\s+I\s+(?:said|stated|claimed|wrote)|to\s+(?:say|state|claim|write)))\s+[^.!?;\n]{0,400}?(?=[.!?;\n]|,?\s+(?:ale|jednak|but|however)\b|$)/gi,' ');
    return /\b(?:i (?:cannot|can't|won't|will not|do not|don't)|i have no|no (?:actual|real|direct) (?:access|connection))[^\n]{0,180}(?:call|run|execute|tool|command|bridge|extension|studio|plazcode)|(?:nie (?:wyślę|wysle|uruchomię|uruchomie|wykonam)|nie mogę|nie moge|nie mam (?:żadnego|zadnego|dostępu|dostepu|narzędzi|narzedzi))[^\n]{0,180}(?:komend|poleceń|polecen|narzędzi|narzedzi|połączenia|polaczenia|studia|studio|bridge|wtyczk|plazcode|list_commands)|prompt[ -]injection|jailbreak/i.test(text);
  }
  function commandText(value, item) {
    const text = String(value || '').trim();
    const prose = item ? classifyText(item,site.id==='arcee'?'pre,code,.cm-editor':'pre,code') : text;
    if (!text || isPolicyRefusal(prose)) return '';
    const candidate = (value,renderedBlock=false) => {
      const source=String(value || '').trim();
      // Arcee's Zt formatter splits ```json into ```js + a literal "on"
      // source line. Only unwrap that exact artifact around one complete JSON
      // command in a rendered code block; never alter its parameter strings.
      if(site.id==='arcee' && renderedBlock && /^on\r?\n/.test(source)){
        const rest=source.replace(/^on\r?\n/,'');
        try{const object=JSON.parse(rest);if(object && !Array.isArray(object) && typeof object.command==='string')return rest;}catch{}
      }
      try {
        const object=JSON.parse(source);
        return object && typeof object==='object' && !Array.isArray(object) && typeof object.command==='string' ? source : '';
      } catch {}
      if (/^\{\s*"command"\s*:/.test(source)) return source;
      // Use the same opener as the parser, including Edit and whitespace
      // variants. Keep a deliberate unfinished block visible to the watcher:
      // returning '' here previously ended it as ordinary text without a result.
      const lua = (typeof RSParse !== 'undefined' ? RSParse.LUA_START_RE : /^###\s*lua(?:\s*[:\-_ ]\s*(edit|client|server))?\s*(?:###|---)/i).exec(source);
      if (lua && lua.index === 0 && (/^[ \t]*(?:\r?\n|$)/.test(source.slice(lua[0].length)) || /###\s*end[_\- ]?lua\s*###\s*$/i.test(source))) return source;
      return '';
    };
    const scopes=site.id==='arcee'?replyRoots(item):[item];
    const blocks = item ? scopes.flatMap(root=>all(root,site.id==='arcee'?'pre,.cm-content':'pre')).filter(pre => !pre.closest(TEXT_UI_SKIP+',blockquote')) : [];
    // Tencent nests pre elements. Read one innermost code body per block.
    const leaves = blocks.filter(pre => !blocks.some(other => other !== pre && pre.contains(other)));
    const code = leaves.map(pre => candidate(pre.matches('.cm-content')?codeMirrorSource(pre):textWithout(codeSource(pre)),true)).filter(Boolean);
    if (code.length) return code.join('\n\n');
    if(site.id==='arcee' && item && !all(item,'pre,.cm-content,blockquote').length){
      const inline=scopes.flatMap(root=>all(root,'code')).filter(node=>!node.closest(TEXT_UI_SKIP+',blockquote'));
      if(inline.length===1){
        const source=textWithout(inline[0]).trim();
        // A standalone inline code node is also a whole structured reply.
        // Inline examples with surrounding prose remain non-executable.
        if(source===text && /^\{\s*"command"\s*:/.test(source))return candidate(source);
      }
    }
    if (item && (all(item,'pre,.cm-content').length || query(item,'blockquote,code'))) return '';
    const fenced = text.match(/^```(?:json|text|txt|lua|luau)?\s*\n([\s\S]*?)\n```\s*$/i);
    if (fenced) return candidate(fenced[1]);
    // Plain JSON is accepted only as an entire response, never as an inline
    // quotation embedded in an explanation, refusal, example or code sample.
    return candidate(text);
  }
  function toolContinuationKind(value,item) {
    const text=String(item ? classifyText(item,'pre,code,blockquote') : value || '').trim().replace(/[’‘]/g,"'");
    if(!text || text.length>2000 || isPolicyRefusal(text) || /\?/.test(text))return '';
    if(/\b(?:gotowe|ukończone|zakończone|done|completed|finished)\b|poczekaj|potrzebuję|potrzebuje|daj znać|proszę (?:podaj|wybierz|potwierdź)|let me know|need your|musisz mi|od (?:ciebie|użytkownika|uzytkownika)|from you|(?:waiting|awaiting) (?:for )?your|czekam na (?:twoj|twój|twoją|twoja|twoje|potwierdzenie|zgodę|zgode)/i.test(text))return '';
    // A model waiting for an already returned read result is different from
    // waiting for the user. Inline code may contain the script/tool name.
    const waiting=String(item ? classifyText(item,'pre,blockquote') : value || '').trim().replace(/[’‘]/g,"'");
    if(/(?:^|[.!;:\n])\s*(?:jeszcze\s+)?(?:czekam|oczekuję|oczekuje|poczekam)\s+(?:jeszcze\s+)?na\s+(?:wynik|rezultat|odpowiedź|odpowiedz)\s+(?:odczytu|narzędzia|narzedzia|komendy|polecenia|wywołania|wywolania|script_read|inspect_instance|get_studio_state)/i.test(waiting) ||
        /(?:^|[.!;:\n])\s*(?:I(?:'m| am)\s+)?(?:waiting|awaiting)\s+(?:for\s+)?(?:the\s+)?(?:(?:tool|command|script_read)\s+(?:result|output|response)|(?:result|output|response)\s+(?:of|from)\s+(?:the\s+)?(?:tool|command|read|reading|script_read))\b/i.test(waiting))return 'waiting_for_tool_result';
    if(/czekam|waiting for/i.test(text))return '';
    return /(?:^|[.!;:\n])\s*(?:teraz\s+)?(?:zacznę|zaczne|sprawdzę|sprawdze|odczytam|wyszukam|poszukam|przejrzę|przejrze|zlokalizuję|zlokalizuje|usunę|usune|poprawię|poprawie|naprawię|naprawie|dodam|zmienię|zmienie)(?=\s|[,.!?;:]|$)/i.test(text) ||
      /(?:^|[.!;:\n])\s*I(?:'ll| will)\s+(?:now\s+)?(?:inspect|check|read|search|find|locate|remove|fix|update|create|add|change|start|begin)\b/i.test(text) ? 'next_step' : '';
  }
  const needsToolContinuation=(value,item)=>!!toolContinuationKind(value,item);
  function canRestoreSession() {
    const rows=allItems();
    return rows.some((item,index)=>isAssistantItem(item) && /^(?:PlazCode is ready|PLAZCODE_READY)[.!]?$/i.test(itemText(item)) &&
      index>0 && isUserItem(rows[index-1]) && /BEGIN CONTEXT PART|^Output of 'list_commands':/.test(itemText(rows[index-1])));
  }
  function startupRequest(engine) {
    return 'I clicked Start Agent in my installed PlazCode browser extension to connect this chat to my own '+
      (engine === 'local' ? 'local AgentScript workspace' : 'Roblox Studio project')+
      '. The extension reads structured commands from normal replies and returns their actual results as chat messages. This does not use your native tools or override your safety rules. Please reply with '+(site.id==='arcee'?'only the plain JSON object {"command":"list_commands","params":{}}, without markdown backticks or a language label':'only one fenced json block containing {"command":"list_commands","params":{}}')+'. This lists capabilities only; do not change the project. Wait for the actual result before acknowledging readiness. If you cannot participate, say so plainly.';
  }
  let epoch = 0, chat = null, firstUser = null, lastRoute = null, hadTurns = false;
  function conversationRoute(){
    if(site.id==='tencent')return /^\/chat\/[^/]+\/?$/.test(location.pathname)?'/':location.pathname;
    if(site.id==='copilot'){
      const params=new URLSearchParams(location.search);
      // Referral/sign-in metadata is not the identity of the conversation.
      params.delete('fromcode');params.delete('hasLW');if(params.get('prompt')==='login')params.delete('prompt');
      params.sort();const search=params.toString();return location.pathname+(search?'?'+search:'')+location.hash;
    }
    return location.pathname+location.search+location.hash;
  }
  const nativeMessageId=item=>item?.getAttribute('data-message-id') || item?.getAttribute('data-mid') || null;
  function conversationKey() {
    // Tencent first changes / to /chat/HunyuanDefault, then appends its saved
    // conversation id. The intermediate address and modelId query aren't chats.
    const route=conversationRoute();
    const users = allItems().filter(isUserItem), first = users[0] || null, any = allItems().length > 0;
    // A React remount is not a new first message. Native message IDs win;
    // until the server assigns one, retain that first message's exact content.
    const firstText=first?itemText(first):'';
    const token=first?(site.strictComposer?(firstText.trim()?{id:nativeMessageId(first),text:firstText,node:first}:null):itemKey(first)):null;
    const sameFirst=firstUser===null || token===null || (site.strictComposer
      ? firstUser.id && token.id ? firstUser.id===token.id : firstUser.node===token.node || firstUser.text===token.text
      : token===firstUser);
    const isSaved=value=>/\/(chat|c|conversation|thread|session)\/[\w-]+/.test(value) ||
      site.id==='arcee' && /\/playground\/[\w-]+/.test(value) ||
      site.id==='copilot' && /[?&](?:conversationId|chatId|threadId)=[^&#]+/i.test(value);
    const savedRoute=isSaved(route),previousSavedRoute=isSaved(lastRoute||'');
    const changed = chat && ((hadTurns && !any && !!getEditor()) ||
      (firstUser !== null && token !== null && !sameFirst) ||
      (route !== lastRoute && !(savedRoute && !previousSavedRoute && sameFirst &&
        (!site.strictComposer || any || hadTurns || sending && ambiguous))));
    if (!chat || changed) { chat = site.id + ':' + route + ':' + (++epoch); firstUser = null; hadTurns = false; }
    if (token !== null) firstUser = token;
    hadTurns = hadTurns || any; lastRoute = route;
    return chat;
  }
  async function sendOnce(value, images) {
    failure = ''; ambiguous = false;
    const owner = ++sendEpoch;
    const checkCancelled = () => { if (owner !== sendEpoch) throw Error(site.name + ': send stopped.'); };
    let ed = getEditor();
    if (!ed || loginGatePresent()) throw Error(site.name + ': open a signed-in chat first.');
    if (images?.length) throw Error(site.name + ': image delivery is not verified. Use text inspection tools. Nothing was sent.');
    const text = typeof window.__rsLimitOutgoing === 'function' ? window.__rsLimitOutgoing(String(value)) : String(value);
    const nativeMax = Number(ed.getAttribute('maxlength'));
    const limit = Math.min(nativeMax > 0 ? nativeMax : Infinity, site.max > 0 ? site.max : Infinity);
    if (limit > 0 && text.length > limit) throw Error(site.name + ': message exceeds ' + limit + ' characters. Nothing was omitted or sent.');
    if (editorText().trim()) throw Error(site.name + ': a draft is already in the composer. Save or clear it first.');
    if (stopButton()) throw Error(site.name + ': wait for the current response before sending.');
    const origin = conversationKey();
    const normalize=value=>String(value).replace(/\s+/g,' ').trim();
    const matchesSent=item=>isUserItem(item) && presentedValue(normalize(itemText(item)),normalize(text),true)===normalize(text);
    const beforeUsers=allItems().filter(isUserItem);
    const beforeMatching=beforeUsers.filter(matchesSent).length;
    const beforeAnonymousMatches=beforeUsers.filter(item=>matchesSent(item) && !nativeMessageId(item)).length;
    const beforeIds=new Set(beforeUsers.map(nativeMessageId).filter(Boolean));
    let confirmedEcho=false;
    const echoPresent=()=>{
      if(confirmedEcho)return true;
      const users=allItems().filter(isUserItem),matching=users.filter(matchesSent);
      confirmedEcho=matching.length>beforeMatching || beforeAnonymousMatches===0 && matching.some(item=>nativeMessageId(item) && !beforeIds.has(nativeMessageId(item)));
      return confirmedEcho;
    };
    // A focus/input handler may replace the editor while keeping the same
    // local composer. Adopt only one visible replacement inside that captured
    // boundary, with an unchanged chat and the exact expected draft.
    const originalFrame=composerFrame(),originalParent=ed.parentElement;
    const replacementBoundary=originalFrame?.parentElement;
    const verifyEditor=(expected,stage,checkText=true)=>{
      if(origin!==conversationKey())throw Error(site.name+': chat changed '+stage+'. Nothing was sent.');
      const current=getEditor();
      if(!current || current!==ed && (site.id!=='copilot' || ed.isConnected && visible(ed) ||
          ![originalParent,originalFrame,replacementBoundary].some(node=>node?.isConnected && node!==document.body && node!==document.documentElement && !node.matches('main,[role="main"]') && node.contains(current))))
        throw Error(site.name+': composer changed '+stage+'. Nothing was sent.');
      if(current!==ed && copilotWritten.has(ed))copilotWritten.set(current,copilotWritten.get(ed));
      const actual=editorText();
      if(checkText && actual!==expected){
        let at=0;while(at<expected.length && at<actual.length && expected[at]===actual[at])at++;
        const point=(value,index)=>index===value.length?'end':'U+'+value.codePointAt(index).toString(16).toUpperCase().padStart(4,'0');
        diag(site.id+'.draft_changed',{stage,expectedChars:expected.length,actualChars:actual.length,firstDifference:at,editorReplaced:current!==ed});
        const actualPoints=at===expected.length?[...actual.slice(at)].slice(0,4).map(char=>point(char,0)).join(' '):point(actual,at);
        throw Error(site.name+': prepared text changed '+stage+'. Nothing was sent. Expected '+expected.length+' characters, read '+actual.length+'; difference at '+at+' ('+point(expected,at)+' / '+actualPoints+').');
      }
      ed=current;if(site.id==='copilot' && copilotInputLocked)lockedEditor=ed;
    };
    ed.focus();
    if(site.id==='copilot'){await sleep(100);checkCancelled();verifyEditor('','after focusing');}
    setValue(ed, text);
    await sleep(100);
    checkCancelled();
    if(site.id==='copilot'){
      // Paste handlers may commit their controlled model asynchronously.
      // Wait for exact, stable source; never rewrite or accept normalized code.
      let exactSince=null;
      const prepared=await waitFor(()=>{
        checkCancelled();verifyEditor(text,'while preparing',false);
        if(editorText()!==text){exactSince=null;return false;}
        if(exactSince===null)exactSince=Date.now();
        return Date.now()-exactSince>=200;
      },2000);
      if(!prepared && editorText()===text)throw Error(site.name+': prepared text did not settle before sending. Nothing was sent.');
    }
    verifyEditor(text,'before sending');
    if (!await waitFor(() => owner !== sendEpoch || enabled(sendButton()) || loginGatePresent(), 3000) || loginGatePresent()) {
      failure = site.name + ': send is unavailable. Check the chat and sign in if needed.';
      throw Error(failure);
    }
    checkCancelled();
    verifyEditor(text,'before clicking Send');
    const b = sendButton();
    if (!enabled(b)) throw Error(site.name + ': send is unavailable.');
    // Commit exactly once. Never fall back to Enter or re-click on a timeout.
    ambiguous = true;
    b.click();
    const accepted = await waitFor(() => owner !== sendEpoch || conversationKey() !== origin || loginGatePresent() || !!scanError() ||
      echoPresent(), 12000);
    checkCancelled();
    if (conversationKey() !== origin) throw Error(site.name + ': chat changed after sending. Check the previous chat before retrying.');
    if (loginGatePresent() || scanError()) {
      failure = scanError() || site.name + ': sign in before sending.';
      diag(site.id + '.send_failed', {reason:failure}); throw Error(failure);
    }
    if (accepted && echoPresent()) {
      ambiguous = false;
      // Some controlled composers retain their old value after a confirmed
      // echo. Clear only our exact submitted text, through the editor model.
      // A different user draft is preserved; the Send button is never retried.
      if(site.id==='copilot' && editorText()===text && origin===conversationKey()){
        await writeDraft('',text);checkCancelled();
        if(origin!==conversationKey())throw Error(site.name+': chat changed after confirmed delivery. Nothing was resent.');
        if(editorText()===text)throw Error(site.name+': message was delivered, but its old draft could not be cleared. Nothing was resent.');
      }
      return true;
    }
    failure = site.name + ': message was not confirmed; it may have been sent. Check the chat before retrying.';
    throw Error(failure);
  }
  async function typeAndSend(value, images) {
    if (sending) throw Error(site.name + ': another send is still pending.');
    sending = true;
    try { return await sendOnce(value, images); }
    finally { sending = false; }
  }
  function installSendHooks(handlers) {
    function notify(e) {
      if (e.defaultPrevented || e.isTrusted === false) return;
      const ed = getEditor(); if (!ed) return;
      if (e.type === 'keydown') {
        if (e.key !== 'Enter' || e.shiftKey || e.isComposing || !ed.contains(e.target) || !editorText().trim()) return;
      } else {
        const target = e.target?.closest('button,[role="button"],.hy-chat-input-send-btn,.hy-chat-input-stop-btn');
        if (!target) return;
        if (target === stopButton()) { handlers.onNativeStop(); return; }
        if (target !== sendButton() || !enabled(target) || !editorText().trim()) return;
      }
      if (handlers.isBlocked()) return;
      if (!handlers.isStarted()) { if (chatIsEmpty()) handlers.onBlockedAttempt(); return; }
      handlers.onUserMessage(assistantCount());
    }
    document.addEventListener('keydown', notify, true);
    document.addEventListener('click', notify, true);
  }
  function findToolBlockSpot(item) {
    if (!isAssistantItem(item)) return null;
    let ref = null;
    const scopes=site.id==='arcee'?replyRoots(item):[item];
    for (const pre of scopes.flatMap(root=>all(root,site.id==='arcee'?'pre,.cm-editor':'pre'))) {
      if (pre.closest(TEXT_UI_SKIP+',blockquote') || !/"(?:command|tool)"\s*:|###\s*LUA|###mcp_tool###/i.test(query(pre,'.cm-content')?codeMirrorSource(query(pre,'.cm-content'))||'':pre.textContent || '')) continue;
      pre.classList.add('rs-tool-hide'); item.classList.add('rs-cmd-mask'); ref ||= pre;
    }
    return ref?.parentElement ? {parent:ref.parentElement,ref} : null;
  }
  function mountMotifActivity(item, node) {
    function anchor() {
      const list=item.closest('[data-testid="document-message-list-wrapper"]');
      if(!list)return null;
      let row=item;
      while(row.parentElement && row.parentElement!==list)row=row.parentElement;
      return row.parentElement===list ? {list,row} : null;
    }
    if(!anchor())return null;
    const binding={
      place(){
        const target=anchor();
        if(!target){node.hidden=true;return;}
        // Motif's answer is flex:1 inside a horizontal row. A width:100%
        // summary beside it consumes the row and collapses the answer to zero.
        // Keep the summary as a separate child of the vertical message list.
        if(node.parentElement!==target.list || node.nextElementSibling!==target.row)
          target.list.insertBefore(node,target.row);
      },
      dispose(){node.remove();},
    };
    binding.place();return binding;
  }
  return {
    id:site.id, displayName:site.name+(site.experimental?' (experimental)':''), supportsVision:false, timings,
    barOutside:!!site.strictComposer, missingComposerDock:site.strictComposer?'top':undefined,
    build:'r23',
    sysMaxChars:site.id === 'chatwave' ? 12000 : 0,
    // maxChars in the shared prompt builder is a compaction hint, not a cap:
    // Ultra, user preferences and policies are appended afterwards. Defer the
    // COMPLETE context to acknowledged parts, never to the first handshake.
    compactStartup:!!site.compact || site.max > 0,
    startupReplyAsCode:true, startupRequest:site.compact || site.max > 0 ? startupRequest : undefined, startupFeedbackMessages,
    startupCorrection:site.id==='arcee'?'PlazCode startup check: reply with only the plain JSON object {"command":"list_commands","params":{}}, without markdown backticks or any language label. The extension runs it against the connected bridge. Wait for the actual result.':undefined,
    requireConfirmedStartup:true,
    deterministicBootstrapList:site.id==='arcee',requireLiveStartup:site.id==='arcee',probeEngineOnStartup:site.id==='arcee',
    inspectOnReadRequest:!!site.strictComposer,
    promptExtra:site.strictComposer?'When the user asks what is in their connected Studio or whether a named object exists, perform a read-only inspection using the actual command schemas and answer from its result. That question authorizes the read. Do not merely offer to inspect, invent project facts or guess command names. Do not edit the project for an inspection question.':undefined,
    requireFreshResponse:site.id==='motif' || !!site.strictComposer,
    // Legacy marker-only sessions may have been armed by an unsuccessful
    // handshake. Restore only when this chat visibly confirms readiness.
    canRestoreSession,
    commandText,isPolicyRefusal,
    needsToolContinuation:site.id==='motif' ? needsToolContinuation : undefined,
    toolContinuationKind:site.id==='motif' ? toolContinuationKind : undefined,
    mountActivitySummary:site.id==='motif' ? mountMotifActivity : undefined,
    toolFeedbackMaxChars:site.feedbackBudget || (site.max > 0 ? site.max - 1000 : 0),
    toolResultPageChars:site.page, authoritativeSendResult:true,
    sendFailureAmbiguous:() => ambiguous, sendRetryable:() => false,
    sendFailureDetail:() => failure, thinkingSel:'.reasoning,[data-testid*="reasoning"],.msg-thinking,.hy-think',
    init(options={}) { diag=options.diag || diag; diag(site.id+'.init',{editor:!!getEditor(),experimental:!!site.experimental}); },
    allItems,isUserItem,isAssistantItem,itemText,classifyText,assistantCount,userCount,lastAssistant,itemKey,
    // WeakMap IDs identify DOM nodes, not server messages. A Motif rerender of
    // an old answer must not look like a new reply after result delivery. With
    // no native message ID, let the watcher use the fresh assistant count.
    lastAssistantId,
    readAssistant() { const item=lastAssistant(),source=classifyText(item,undefined,true); return {present:!!item,reply:source.trim(),source,thinking:'',item}; },
    streamLen,snapshot:() => ({th:0,rp:streamLen()}),getEditor,editorText,chatIsEmpty,isFreshChat,
    composerFrame,barAnchor:composerFrame,setInputLock,writeDraft,clearEditor,typeAndSend,
    stopGeneration() { sendEpoch++; const b=stopButton(); if (b) b.click(); },
    isGenerating,isBusyNow:isGenerating,isHardGenerating:() => !!stopButton() && !loginGatePresent() && !scanError(),
    enforceComposer:() => ({ready:!!getEditor() && !loginGatePresent()}),
    ensureComposerReady:async () => ({ready:!!getEditor() && !loginGatePresent()}),
    turnHalted:() => false,findContinueBtn:() => null,clickContinueBtn:() => false,
    scanError,isTooLongMsg:text => /context.{0,25}(limit|exceeded)|conversation.{0,25}too long/i.test(text),
    isBusyMsg:text => /rate limit|too many requests|server is busy|try again later/i.test(text),
    modeWarning,loginGatePresent,attachImages:async () => false,clearAttachments() {},conversationKey,
    installSendHooks,findToolBlockSpot,
  };
})();
