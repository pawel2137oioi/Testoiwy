// SPDX-License-Identifier: GPL-3.0-or-later
// Composer/reply selectors observed on live pages 2026-10-21, including a
// signed-in Tencent chat. Unknown message roles are never executable.
const RSProvider = (() => {
  'use strict';
  const sites = {
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
  const getEditor = () => firstVisible(site.editor) || (site.editorFallback ? firstVisible(site.editorFallback) : null);
  const editorText = () => read(() => getEditor().value, '');
  function composerFrame() {
    const ed = getEditor();
    if (!ed) return null;
    if (site.id === 'motif') {
      // Motif has no form. Find the nearest wrapper containing its submit button.
      for (let n = ed.parentElement, i = 0; n && i < 9; n = n.parentElement, i++)
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
    return firstVisible(site.stop) ||
      all(document, 'button,[role="button"]').find(el => visible(el) && /^(stop|stop response|stop generating|停止生成|停止回答)$/i.test(buttonLabel(el))) || null;
  }
  function sendButton() {
    const b = firstVisible(site.send);
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
  const TEXT_UI_SKIP = '.rs-chip, .rs-chat-activity, button, [role="button"], .msg-actions, .msg-err, .reasoning, [data-testid*="reasoning"], .hy-think, .code-block-header, .md-code-block-banner-wrap, .markdown-viewer-code-block-header, .hyc-common-markdown__code__hd-container, .linenumber, .line-number, .react-syntax-highlighter-line-number';
  const codeSource = pre => {
    const sources = all(pre,'code').filter(node => !node.closest(TEXT_UI_SKIP));
    return sources.length === 1 ? sources[0] : pre;
  };
  function textWithout(root, exclude = '', preserveEdges = false) {
    let text = '';
    const skip = TEXT_UI_SKIP + (exclude ? ', ' + exclude : '');
    function walk(node) {
      if (node.nodeType === 3) { text += node.nodeValue; return; }
      if (node.nodeType !== 1 || matches(node, skip)) return;
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
    if (!isAssistantItem(item)) return [item];
    const roots=all(item,site.body).filter(node=>!node.closest(TEXT_UI_SKIP));
    const top=roots.filter(node=>!roots.some(parent=>parent!==node && parent.contains(node)));
    return top.length ? top : site.id==='tencent' ? [] : [item];
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
    return site.id==='motif' ? item?.getAttribute('data-mid') || item?.getAttribute('data-message-id') || null : itemKey(item);
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
    if (site.experimental) return '<b>Tencent Hy</b> — experimental adapter; signed-in replies have not been verified.';
    if (!getEditor()) return '<b>' + site.name + '</b> — open a chat and wait for its message box.';
    return '';
  }
  function setInputLock(on) { const ed = getEditor(); if (ed) ed.readOnly = !!on; }
  function setValue(ed, value) {
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
    const text = String(value), limit = 10000;
    if (!site.max || text.length <= limit) return [{text}];
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
        (final ? 'All parts arrived. The list_commands handshake succeeded. Reply exactly "PlazCode is ready." and wait for the user task.' : `More context follows. Reply exactly "${ack}" and nothing else.`),
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
    const prose = item ? classifyText(item,'pre,code') : text;
    if (!text || isPolicyRefusal(prose)) return '';
    const candidate = value => {
      const source=String(value || '').trim();
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
    const blocks = item ? all(item, 'pre').filter(pre => !pre.closest('.rs-chip,.hy-think,.reasoning,blockquote,[data-testid*="reasoning"]')) : [];
    // Tencent nests pre elements. Read one innermost code body per block.
    const leaves = blocks.filter(pre => !blocks.some(other => other !== pre && pre.contains(other)));
    const code = leaves.map(pre => candidate(textWithout(codeSource(pre)))).filter(Boolean);
    if (code.length) return code.join('\n\n');
    if (item && (all(item,'pre').length || query(item,'blockquote,code'))) return '';
    const fenced = text.match(/^```(?:json|text|txt|lua|luau)?\s*\n([\s\S]*?)\n```\s*$/i);
    if (fenced) return candidate(fenced[1]);
    // Plain JSON is accepted only as an entire response, never as an inline
    // quotation embedded in an explanation, refusal, example or code sample.
    return candidate(text);
  }
  function needsToolContinuation(value,item) {
    const text=String(item ? classifyText(item,'pre,code,blockquote') : value || '').trim().replace(/[’‘]/g,"'");
    if(!text || text.length>2000 || isPolicyRefusal(text) || /\?/.test(text))return false;
    if(/\b(?:gotowe|ukończone|zakończone|done|completed|finished)\b|czekam|poczekaj|potrzebuję|potrzebuje|daj znać|proszę (?:podaj|wybierz|potwierdź)|let me know|waiting for|need your/i.test(text))return false;
    return /(?:^|[.!;:\n])\s*(?:teraz\s+)?(?:zacznę|zaczne|sprawdzę|sprawdze|odczytam|wyszukam|poszukam|przejrzę|przejrze|zlokalizuję|zlokalizuje|usunę|usune|poprawię|poprawie|naprawię|naprawie|dodam|zmienię|zmienie)(?=\s|[,.!?;:]|$)/i.test(text) ||
      /(?:^|[.!;:\n])\s*I(?:'ll| will)\s+(?:now\s+)?(?:inspect|check|read|search|find|locate|remove|fix|update|create|add|change|start|begin)\b/i.test(text);
  }
  function canRestoreSession() {
    const rows=allItems();
    return rows.some((item,index)=>isAssistantItem(item) && /^(?:PlazCode is ready|PLAZCODE_READY)[.!]?$/i.test(itemText(item)) &&
      index>0 && isUserItem(rows[index-1]) && /BEGIN CONTEXT PART|^Output of 'list_commands':/.test(itemText(rows[index-1])));
  }
  function startupRequest(engine) {
    return 'I clicked Start Agent in my installed PlazCode browser extension to connect this chat to my own '+
      (engine === 'local' ? 'local AgentScript workspace' : 'Roblox Studio project')+
      '. The extension reads structured command blocks from normal replies and returns their actual results as chat messages. This does not use your native tools or override your safety rules. Please reply with only one fenced json block containing {"command":"list_commands","params":{}}. This lists capabilities only; do not change the project. Wait for the actual result before acknowledging readiness. If you cannot participate, say so plainly.';
  }
  let epoch = 0, chat = null, firstUser = null, lastRoute = null, hadTurns = false;
  function conversationKey() {
    // Tencent first changes / to /chat/HunyuanDefault, then appends its saved
    // conversation id. The intermediate address and modelId query aren't chats.
    const route = site.id === 'tencent'
      ? (/^\/chat\/[^/]+\/?$/.test(location.pathname) ? '/' : location.pathname)
      : location.pathname + location.search + location.hash;
    const users = allItems().filter(isUserItem), first = users[0] || null, any = allItems().length > 0;
    const token = first ? itemKey(first) : null;
    const savedRoute = /\/(chat|c|conversation|thread|session)\/[\w-]+/.test(route);
    const previousSavedRoute = /\/(chat|c|conversation|thread|session)\/[\w-]+/.test(lastRoute || '');
    const changed = chat && ((hadTurns && !any && !!getEditor()) ||
      (firstUser !== null && token !== null && token !== firstUser) ||
      (route !== lastRoute && !(savedRoute && !previousSavedRoute && (firstUser === null || token === firstUser))));
    if (!chat || changed) { chat = site.id + ':' + route + ':' + (++epoch); firstUser = null; hadTurns = false; }
    if (token !== null) firstUser = token;
    hadTurns = hadTurns || any; lastRoute = route;
    return chat;
  }
  async function sendOnce(value, images) {
    failure = ''; ambiguous = false;
    const owner = ++sendEpoch;
    const checkCancelled = () => { if (owner !== sendEpoch) throw Error(site.name + ': send stopped.'); };
    const ed = getEditor();
    if (!ed || loginGatePresent()) throw Error(site.name + ': open a signed-in chat first.');
    if (images?.length) throw Error(site.name + ': image delivery is not verified. Use text inspection tools. Nothing was sent.');
    const text = typeof window.__rsLimitOutgoing === 'function' ? window.__rsLimitOutgoing(String(value)) : String(value);
    const nativeMax = Number(ed.getAttribute('maxlength'));
    const limit = Math.min(nativeMax > 0 ? nativeMax : Infinity, site.max > 0 ? site.max : Infinity);
    if (limit > 0 && text.length > limit) throw Error(site.name + ': message exceeds ' + limit + ' characters. Nothing was omitted or sent.');
    if (editorText().trim()) throw Error(site.name + ': a draft is already in the composer. Save or clear it first.');
    if (stopButton()) throw Error(site.name + ': wait for the current response before sending.');
    const origin = conversationKey();
    const before = new Set(allItems().filter(isUserItem).map(itemKey));
    ed.focus(); setValue(ed, text);
    await sleep(100);
    checkCancelled();
    if (getEditor() !== ed || editorText() !== text || origin !== conversationKey()) throw Error(site.name + ': composer or chat changed before sending.');
    if (!await waitFor(() => owner !== sendEpoch || enabled(sendButton()) || loginGatePresent(), 3000) || loginGatePresent()) {
      failure = site.name + ': send is unavailable. Check the chat and sign in if needed.';
      throw Error(failure);
    }
    checkCancelled();
    if (getEditor() !== ed || editorText() !== text || origin !== conversationKey()) throw Error(site.name + ': draft changed before sending.');
    const b = sendButton();
    if (!enabled(b)) throw Error(site.name + ': send is unavailable.');
    // Commit exactly once. Never fall back to Enter or re-click on a timeout.
    ambiguous = true;
    b.click();
    const accepted = await waitFor(() => owner !== sendEpoch || conversationKey() !== origin || loginGatePresent() || !!scanError() ||
      allItems().some(item => isUserItem(item) && !before.has(itemKey(item)) && itemText(item).replace(/\s+/g,' ').trim() === text.replace(/\s+/g,' ').trim()), 12000);
    checkCancelled();
    if (conversationKey() !== origin) throw Error(site.name + ': chat changed after sending. Check the previous chat before retrying.');
    if (loginGatePresent() || scanError()) {
      failure = scanError() || site.name + ': sign in before sending.';
      diag(site.id + '.send_failed', {reason:failure}); throw Error(failure);
    }
    if (accepted) { ambiguous = false; return true; }
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
    for (const pre of all(item, 'pre')) {
      if (pre.closest('.rs-chip,.hy-think,.reasoning,blockquote,[data-testid*="reasoning"]') || !/"(?:command|tool)"\s*:|###\s*LUA|###mcp_tool###/i.test(pre.textContent || '')) continue;
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
    id:site.id, displayName:site.name, supportsVision:false, timings,
    build:'r14',
    sysMaxChars:site.id === 'chatwave' ? 12000 : 0,
    // maxChars in the shared prompt builder is a compaction hint, not a cap:
    // Ultra, user preferences and policies are appended afterwards. Defer the
    // COMPLETE context to acknowledged parts, never to the first handshake.
    compactStartup:site.max > 0,
    startupReplyAsCode:true, startupRequest:site.max > 0 ? startupRequest : undefined, startupFeedbackMessages,
    requireConfirmedStartup:true,
    requireFreshResponse:site.id==='motif',
    // Legacy marker-only sessions may have been armed by an unsuccessful
    // handshake. Restore only when this chat visibly confirms readiness.
    canRestoreSession,
    commandText,isPolicyRefusal,
    needsToolContinuation:site.id==='motif' ? needsToolContinuation : undefined,
    mountActivitySummary:site.id==='motif' ? mountMotifActivity : undefined,
    toolFeedbackMaxChars:site.max > 0 ? site.max - 1000 : 0,
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
