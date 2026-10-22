// SPDX-License-Identifier: GPL-3.0-or-later
// Deterministic DOM/controlled-editor fixtures; no live Claude or Studio access.
// Run: node --test tests/claude-delivery.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '..');

class Element {
  constructor(tag, attrs = {}, children = []) {
    this.nodeType = 1; this.tagName = tag.toUpperCase(); this.attrs = { ...attrs };
    this.childNodes = []; this.parentElement = null; this.disabled = false;
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
  getBoundingClientRect() { return { x: 0, y: 100, top: 100, bottom: 180, left: 0, right: 500, width: 500, height: 80 }; }
  matches(selector) {
    return selector.split(',').some(part => {
      part = part.trim();
      const tag = part.match(/^[a-z]+/i)?.[0];
      if (tag && tag.toUpperCase() !== this.tagName) return false;
      const id = part.match(/#([\w-]+)/)?.[1];
      if (id && this.attrs.id !== id) return false;
      const cls = part.match(/\.([\w-]+)/)?.[1];
      if (cls && !this.classList.contains(cls)) return false;
      for (const match of part.matchAll(/\[([\w-]+)(?:(\*?=)["']?([^\]"']*?)["']?( i)?)?\]/g)) {
        let value = this.getAttribute(match[1]), wanted = match[3];
        if (value === null) return false;
        if (!match[2]) continue;
        if (match[4]) { value = value.toLowerCase(); wanted = wanted.toLowerCase(); }
        if (match[2] === '=' ? value !== wanted : !value.includes(wanted)) return false;
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

function claudeFixture(options = {}) {
  const state = { text: '', writes: 0, clicks: 0, sent: [], users: [], clock: 1, ticks: 0 };
  const editor = new Element('div', { class: 'ProseMirror', contenteditable: 'true', role: 'textbox' });
  const send = new Element('button', { 'data-testid': 'send-button', 'aria-label': 'Wyślij wiadomość' });
  const form = new Element('form', {}, [editor, send]);
  const body = new Element('body', {}, [form]);
  const selection = { removeAllRanges() {}, addRange() {}, collapseToEnd() { state.append = true; } };
  state.editor = editor; state.send = send; state.body = body;
  state.setText = text => {
    state.text = text;
    editor.replaceChildren(...text.split('\n').map(line => new Element('p', {},
      line ? [line] : [new Element('br', { class: 'ProseMirror-trailingBreak' })])));
  };
  state.setText('');
  editor.focus = () => { state.focused = editor; };
  editor.dispatchEvent = event => {
    if (event.type === 'paste') {
      const preview = new Element('img'); preview.parentElement = form; form.childNodes.push(preview);
      if (options.onPaste) options.onPaste(state);
    }
    return true;
  };
  send.click = () => {
    state.clicks++;
    if (options.onSend) return options.onSend(state);
    state.sent.push(state.text);
    const row = new Element('div', { 'data-testid': 'user-message' }, [state.text]);
    state.users.push(row); body.childNodes.unshift(row); row.parentElement = body;
    state.setText('');
  };
  const document = {
    querySelectorAll: selector => body.querySelectorAll(selector),
    querySelector: selector => body.querySelector(selector),
    addEventListener() {},
    createRange: () => ({ selectNodeContents(ed) { state.target = ed; state.append = false; } }),
    execCommand(command, _ui, value) {
      if (state.target !== editor || editor.getAttribute('contenteditable') !== 'true') return false;
      if (command === 'delete') state.setText('');
      else if (command === 'insertText') state.setText((state.append ? state.text : '') + value);
      else if (command === 'insertLineBreak') state.setText(state.text + '\n');
      else throw Error('Unmodelled editor command: ' + command);
      state.append = true; state.writes++;
      if (options.onWrite) options.onWrite(state, command);
      return true;
    },
  };
  class ClockDate extends Date { static now() { return state.clock; } }
  class Transfer { constructor() { this.items = []; this.items.add = item => this.items.push(item); } }
  const context = vm.createContext({
    document, window: { getSelection: () => selection },
    location: { pathname: '/chat/fixture' }, Date: ClockDate,
    Node: { DOCUMENT_POSITION_FOLLOWING: 4, DOCUMENT_POSITION_PRECEDING: 2 },
    getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
    DataTransfer: Transfer, ClipboardEvent: class { constructor(type, init) { this.type = type; Object.assign(this, init); } },
    PlazCodeMedia: { fileFrom: image => image },
    setTimeout(callback, ms) { queueMicrotask(() => {
      state.clock += Math.max(1, ms); state.ticks++;
      if (options.onTick) options.onTick(state);
      callback();
    }); return 1; },
  });
  const file = process.env.PLAZCODE_PROVIDER_FILE || path.join(root, 'providers/claude.js');
  vm.runInContext(fs.readFileSync(file, 'utf8') + '\nglobalThis.provider = RSProvider;', context);
  state.provider = context.provider;
  return { provider: context.provider, state, context };
}

const markerText = () => '<<<START_TESTU>>>\n' + Array.from({ length: 40 }, (_, i) =>
  `LINIA_${String(i + 1).padStart(3, '0')} | 0123456789 ABCDEFGHIJ 0123456789`).join('\n') +
  '\n<<<KONIEC_TESTU>>>\nlocal Players = game:GetService("Players")\nlocal TICKETS = { ["ulgowy"] = 2.30 }\n<<<KONIEC_FRAGMENTU>>>';

test('40 numbered lines, script header and final marker reach one submitted message', async () => {
  const { provider, state } = claudeFixture();
  provider.setInputLock(true);
  const text = markerText(), result = await provider.typeAndSend(text);
  assert.deepEqual(state.sent, [text]);
  assert.equal(result, true);
  assert.equal(state.clicks, 1);
  assert.equal(state.focused, state.editor);
  assert.equal(state.editor.getAttribute('contenteditable'), 'false');
});

test('lost first batch is recovered before Send; the old 25-line writer submits a missing prefix', async () => {
  let damaged = false;
  const { provider, state } = claudeFixture({ onTick(s) {
    if (!damaged && s.text) { damaged = true; s.setText(s.text.split('\n').slice(25).join('\n')); }
  } });
  provider.setInputLock(true);
  const text = markerText();
  await provider.typeAndSend(text);
  assert.deepEqual(state.sent, [text]);
  assert.equal(state.clicks, 1);
});

for (const damage of ['head', 'middle', 'tail']) test(`persistent ${damage} damage prevents all submissions`, async () => {
  const { provider, state } = claudeFixture({ onWrite(s) {
    if (s.text.length < 80) return;
    const p = damage === 'head' ? 0 : damage === 'tail' ? s.text.length - 20 : Math.floor(s.text.length / 2);
    s.setText(s.text.slice(0, p) + s.text.slice(p + 20));
  } });
  await assert.rejects(provider.typeAndSend(markerText()), /complete message/);
  assert.equal(state.clicks, 0);
});

test('a same-length change is rejected even when the prefix and suffix still match', async () => {
  const { provider, state } = claudeFixture({ onWrite(s) { s.setText(s.text.replace('LINIA_010', 'LINIA_XXX')); } });
  await assert.rejects(provider.typeAndSend(markerText()), /complete message/);
  assert.equal(state.clicks, 0);
});

test('long inline text retains all 700 lines, whitespace and Unicode', async () => {
  const { provider, state } = claudeFixture();
  const text = '\n\n' + Array.from({ length: 700 }, (_, i) => `\t  ${i}: Zażółć gęślą jaźń 🚋 <>&"  \n`).join('') + '\nEND\n';
  await provider.typeAndSend(text);
  assert.deepEqual(state.sent, [text]);
});

test('oversized standalone payload is refused rather than clipped', async () => {
  const { provider, state } = claudeFixture();
  await assert.rejects(provider.typeAndSend('x'.repeat(100001)), /too large/);
  assert.equal(state.writes, 0); assert.equal(state.clicks, 0);
});

test('host remount during typing aborts instead of writing to the replacement', async () => {
  let changed = false;
  const { provider, state } = claudeFixture({ onTick(s) {
    if (!changed) { changed = true; s.editor.attrs.class = 'old-editor'; s.editor.removeAttribute('contenteditable'); s.editor.removeAttribute('role'); }
  } });
  await assert.rejects(provider.typeAndSend(markerText()), /complete message/);
  assert.equal(state.clicks, 0);
});

test('Stop during typing prevents Send and restores the unlocked editor', async () => {
  let stopped = false;
  const { provider, state } = claudeFixture({ onTick(s) {
    if (!stopped) { stopped = true; s.provider.setInputLock(false); }
  } });
  provider.setInputLock(true);
  await assert.rejects(provider.typeAndSend(markerText()), /complete message/);
  assert.equal(state.clicks, 0);
  assert.equal(state.editor.getAttribute('contenteditable'), 'true');
});

test('lock sweeps cannot disable the editor halfway through an injection', async () => {
  const { provider, state } = claudeFixture({ onTick(s) { s.provider.setInputLock(true); } });
  provider.setInputLock(true);
  const text = markerText();
  await provider.typeAndSend(text);
  assert.deepEqual(state.sent, [text]);
});

test('late corruption while Send is disabled is checked before the click', async () => {
  let seen = false;
  const { provider, state } = claudeFixture({ onTick(s) {
    if (s.clock > 1200 && !seen) { seen = true; s.setText(s.text.slice(100)); s.send.disabled = false; }
  } });
  state.send.disabled = true;
  await assert.rejects(provider.typeAndSend('short result'), /shortened/);
  assert.equal(state.clicks, 0);
});

test('disabled Send is reported; no synthetic Enter or speculative submission', async () => {
  const { provider, state } = claudeFixture();
  state.send.disabled = true;
  assert.equal(await provider.typeAndSend(markerText()), false);
  assert.match(provider.sendFailureDetail(), /not enabled Send/);
  assert.equal(provider.sendFailureAmbiguous(), false);
  assert.equal(state.clicks, 0);
});

test('lost tail after the click is not delivery confirmation and never triggers a second click', async () => {
  const { provider, state } = claudeFixture({ onSend(s) { s.setText(s.text.slice(0, -100)); } });
  assert.equal(await provider.typeAndSend(markerText()), false);
  assert.equal(provider.sendFailureAmbiguous(), true);
  assert.equal(state.clicks, 1);
});

test('a late receipt is awaited without resubmission', async () => {
  const { provider, state } = claudeFixture({ onSend(s) { s.clickedAt = s.clock; }, onTick(s) {
    if (s.clicks && s.clock - s.clickedAt > 4000) s.setText('');
  } });
  assert.equal(await provider.typeAndSend(markerText()), true);
  assert.equal(state.clicks, 1);
});

test('image feedback submits the complete caption only once', async () => {
  const { provider, state } = claudeFixture();
  assert.equal(await provider.typeAndSend(markerText(), [{data:'fixture',mimeType:'image/png'}]), true);
  assert.deepEqual(state.sent, [markerText()]);
  assert.equal(state.clicks, 1);
});

test('caption corruption during image upload blocks submission', async () => {
  const { provider, state } = claudeFixture({ onPaste(s) { s.setText(s.text.slice(100)); } });
  await assert.rejects(provider.typeAndSend(markerText(), [{data:'fixture',mimeType:'image/png'}]), /shortened/);
  assert.equal(state.clicks, 0);
});

test('draft read/write preserves line breaks, empty lines and indentation', async () => {
  const { provider, state } = claudeFixture();
  const text = '\n  one\n\n\ttwo\n';
  assert.equal((await provider.writeDraft(text, '')).ok, true);
  assert.equal(provider.editorText(), text);
  assert.equal((await provider.writeDraft('changed', 'wrong draft')).ok, false);
  assert.equal(state.text, text);
  assert.equal((await provider.writeDraft('', text)).ok, true);
  assert.equal(state.text, '');
});

test('composer serializer understands hard breaks and ignores only the editor placeholder', () => {
  const { provider, state } = claudeFixture();
  state.editor.replaceChildren(new Element('p', {}, ['a', new Element('br'), '  b', new Element('br'), new Element('br', {class:'ProseMirror-trailingBreak'})]));
  assert.equal(provider.editorText(), 'a\n  b\n');
});

function resultFixture(settings = {}) {
  const { provider } = claudeFixture();
  let chat = 'chat-1', engine = 'roblox';
  const P = { toolResultPageChars: provider.toolResultPageChars, toolFeedbackMaxChars: provider.toolFeedbackMaxChars, conversationKey: () => chat };
  const context = vm.createContext({ P, activeEngine: () => engine, crypto: { randomUUID }, window: {},
    chrome: { storage: { local: { get(_keys, cb) { cb(settings); } }, onChanged: { addListener() {} } } },
  });
  const file = process.env.PLAZCODE_CORE_FILE || path.join(root, 'core/main.js');
  const source = fs.readFileSync(file, 'utf8');
  const start = source.indexOf('  const retainedToolResults = new Map();');
  const end = source.indexOf('  async function attachAutoDebug(', start);
  assert.ok(start >= 0 && end > start, 'retained result implementation located');
  vm.runInContext(source.slice(start, end) + '\nglobalThis.api={compressToolFeedback,readRetainedToolResult,prepareToolFeedback,resultPageSize};', context);
  return { ...context.api, setChat: value => { chat = value; }, setEngine: value => { engine = value; } };
}

function collectResult(api, original) {
  const first = api.compressToolFeedback(original, 'execute_luau');
  if (first === original) return { text: first, pages: [first] };
  const marker = first.match(/id:"([^"]+)",offset:(\d+)/);
  assert.ok(marker, 'retained result must include its continuation pointer');
  let text = first.slice(first.indexOf('\n') + 1), offset = Number(marker[2]);
  assert.equal(text, original.slice(0, offset));
  const pages = [first];
  while (offset !== null) {
    assert.ok(pages.length < 5000, 'pagination must make progress');
    const result = api.readRetainedToolResult({ id: marker[1], offset });
    const header = JSON.parse(result.split('\n')[1]);
    const content = result.slice(result.indexOf('---RESULT CONTENT---\n') + '---RESULT CONTENT---\n'.length);
    assert.equal(header.offset, text.length);
    assert.equal(header.total_characters, original.length);
    assert.ok(!/^[\uDC00-\uDFFF]/.test(content), 'no split emoji at start');
    assert.ok(!/[\uD800-\uDBFF]$/.test(content), 'no split emoji at end');
    text += content; pages.push(result); offset = header.next_offset;
    if (offset !== null) assert.equal(offset, text.length);
  }
  assert.equal(text, original);
  pages.forEach(page => assert.ok(page.length <= api.resultPageSize(), 'headers fit inside the transport budget'));
  return { text, pages };
}

for (const length of [14000, 32000, 120000, 240000]) test(`${length}-character result is reconstructable without running the command again`, () => {
  const api = resultFixture();
  const original = '<<<START>>>\n' + 'Zażółć 🚋\n'.repeat(Math.ceil(length / 10)) + '<<<END>>>';
  const result = collectResult(api, original);
  assert.ok(result.pages.length > 1);
  assert.ok(result.pages.every(page => page.length <= 10000));
});

test('lower user limits still leave room for pagination headers', () => {
  collectResult(resultFixture({ rsInputCharLimit: 1000, rsOutputCharLimit: 1000 }), markerText().repeat(3));
});

test('disabling configured limits retains the Claude transport page bound', () => {
  const api = resultFixture({ rsInputLimitEnabled: false, rsOutputLimitEnabled: false });
  assert.equal(api.resultPageSize(), 10000);
  collectResult(api, markerText().repeat(40));
});

test('retained results stay scoped to their chat and engine', () => {
  const api = resultFixture();
  const first = api.compressToolFeedback('x'.repeat(15000), 'execute_luau');
  const id = first.match(/id:"([^"]+)"/)[1];
  api.setChat('chat-2'); assert.match(api.readRetainedToolResult({id}), /^ERROR/);
  api.setChat('chat-1'); api.setEngine('blender'); assert.match(api.readRetainedToolResult({id}), /^ERROR/);
});

test('one-character read at an emoji returns an error instead of a zero-progress page', () => {
  const api = resultFixture();
  const first = api.compressToolFeedback('🚋'.repeat(8000), 'execute_luau');
  const id = first.match(/id:"([^"]+)"/)[1];
  assert.match(api.readRetainedToolResult({id, limit:1}), /^ERROR: limit/);
});

test('post-result reference additions also receive retained pagination', () => {
  const api = resultFixture();
  const outgoing = markerText() + '\nREFERENCE\n' + 'reference text '.repeat(1200);
  const prepared = api.prepareToolFeedback(outgoing);
  assert.match(prepared, /retained the COMPLETE result/);
  assert.ok(prepared.length <= api.resultPageSize());
});

test('every retained page passes through the actual Claude provider without loss', async () => {
  const original = markerText() + '\n' + 'local test = "Zażółć 🚋"\n'.repeat(1700) + '<<<END_ALL>>>';
  const { pages } = collectResult(resultFixture(), original);
  const { provider, state } = claudeFixture();
  provider.setInputLock(true);
  for (const page of pages) assert.equal(await provider.typeAndSend(page), true);
  assert.deepEqual(state.sent, pages);
});
