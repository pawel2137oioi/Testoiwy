// SPDX-License-Identifier: GPL-3.0-or-later
// core/parser.js - RobloxScript command parsing. PURE string logic, zero DOM:
// the provider extracts a turn's text from the site's DOM; everything here
// operates on that text. The command formats (###LUA### blocks, {"command":…}
// JSON) are defined by OUR system prompt, so they are the same on every AI site
// - only the way a site's markdown may mangle them differs (the regexes below
// are whitespace/dash tolerant for that reason).
// eslint-disable-next-line no-unused-vars
const RSParse = (() => {
  "use strict";

  const START_M = "###MCP_TOOL###";
  const END_M = "###END_MCP_TOOL###";
  // Whitespace-tolerant markers: site markdown can insert spaces around the
  // hashes (e.g. "### LUA ###") or render END_LUA with a dash. These regexes
  // match those variants so a marker mangled by markdown still parses.
  // The optional `:Edit|:Server|:Client` suffix selects the Roblox datamodel
  // execute_luau runs against (the MCP REQUIRES datamodel_type; a bare
  // ###LUA### defaults to "Edit" so the model never has to think about it
  // outside play-testing).
  const LUA_START_RE = /###\s*lua(?:\s*[:\-_ ]\s*(edit|client|server))?\s*(?:###|---)/i;
  const LUA_END_RE = /###\s*end[_\- ]?lua\s*###/i;
  const LUA_DEFAULT_DM = "Edit";
  const dmName = (m) => (m ? m[0].toUpperCase() + m.slice(1).toLowerCase() : LUA_DEFAULT_DM);

  // Find the first LUA start marker at or after `from`. Returns { pos, len, dm }
  // where len is the marker's own length to skip past it and dm the requested
  // datamodel ("Edit" when unspecified).
  function findLuaStart(text, from = 0) {
    const m = LUA_START_RE.exec(text.slice(from));
    return m ? { pos: from + m.index, len: m[0].length, dm: dmName(m[1]) } : { pos: -1, len: 0, dm: LUA_DEFAULT_DM };
  }

  // Find the first LUA end marker at or after `from`. Returns its start index or -1.
  function findLuaEnd(text, from = 0) {
    const m = LUA_END_RE.exec(text.slice(from));
    return m ? from + m.index : -1;
  }

  // Strip a code-block UI label (the "Copy" button caption, or a leftover fence
  // language token like "json") that some sites bleed into the block's text
  // right after the opening marker. Seen live on Kimi: its code-block chrome
  // renders as `###lua### Copy <code>`, so the bare-marker slice below would
  // capture `Copy task.wait(...)` as the Lua code - not valid Lua, so StudioMCP
  // rejects it with "Failed to parse command code". The JSON path already does
  // this at line ~206; mirror it for the raw ###LUA### extraction. Requires
  // trailing whitespace (\s+) so it never eats a legitimate identifier like
  // `Copy(x)` that a script might genuinely start with.
  function stripCodeChrome(code) {
    return String(code || "")
      .replace(/^[\u200B-\u200D\uFEFF]+/, "")
      .replace(/^(?:json|copy|lua|luau|javascript|js|python|py|text)\s+/i, "");
  }

  // A command is `{"command":"name", ...}` (or "tool"). The params/arguments
  // object is OPTIONAL: paramless commands like list_commands are written as
  // `{"command":"list_commands"}`, so requiring "params" too would MISS them
  // (they'd be shown raw and never executed). We key on the `"command":"…"` /
  // `"tool":"…"` shape instead - a string-valued key, which prose almost never
  // contains - so paramless calls are detected without false-positiving on text.
  const CMD_KEY_RE = /"(?:command|tool)"\s*:\s*"/;

  function hasToolSignature(r) {
    return (
      r.includes(START_M) ||
      r.includes("MCP_TOOL") ||
      rawLuaBlock(r) !== null ||
      CMD_KEY_RE.test(r)
    );
  }

  // True if the reply contains a tool block that has STARTED but not yet CLOSED
  // (a ###LUA### / ###MCP_TOOL### opener with no matching end marker). Used by the
  // response watcher to avoid finalizing a command that is still being streamed.
  function hasOpenToolBlock(r) {
    if (!r) return false;
    const raw = rawLuaBlock(r);
    if (raw) return !raw.call;
    // A complete JSON value may contain marker text as ordinary source data.
    if (extractToolAnywhere(r)) return false;
    const sm = r.indexOf(START_M);
    if (sm !== -1) {
      const low = r.toLowerCase();
      if (low.indexOf("###end_mcp_tool###", sm) === -1 && low.indexOf("###end-mcp_tool###", sm) === -1) return true;
    }
    // An inline JSON command ({"command"/"tool": …}) whose object has NOT closed yet
    // is still being streamed (a big multi_edit can take many seconds). Treat it as
    // open so the watcher keeps waiting instead of finalizing - and failing to parse -
    // half a command, which would drop the tool and end the turn as plain text.
    for (const key of ['"command"', '"tool"']) {
      const k = r.indexOf(key);
      if (k === -1) continue;
      for (const open of keyOpeners(r, k)) {
        const end = matchBrace(r, open);
        if (end === -1) return true;  // the command object is still streaming
        if (end > k) break;           // the object holding the key is closed
      }
    }
    return false;
  }

  // Normalise a parsed JSON object into { tool, arguments }, accepting both the
  // new RobloxScript schema ("command"/"params") and the legacy/function-calling
  // schema ("tool"/"arguments"/"name"/"args"). Returns null if not a valid call.
  function normalizeCall(o) {
    if (!o || typeof o !== "object") return null;
    const name = o.command != null ? o.command : (o.tool != null ? o.tool : o.name);
    let args = o.params != null ? o.params : (o.arguments != null ? o.arguments : o.args);
    if (typeof name !== "string" || !name) return null;
    if (args == null) args = {};
    if (typeof args !== "object" || Array.isArray(args)) return null;
    // Catalog selection is sometimes emitted beside command instead of params.
    // Repair only this read-only selector; never infer a mutation's server.
    if ((name === "list_commands" || name === "list_tools") && o.server != null) {
      if (typeof o.server !== "string" || !o.server.trim()) return null;
      if (args.server != null && (typeof args.server !== "string" || args.server.trim() !== o.server.trim())) return null;
      args = { ...args, server: o.server.trim() };
    }
    return { tool: name, arguments: args };
  }

  // String-aware matching-brace finder: index of the "}" that closes the "{" at
  // `start`, SKIPPING braces inside JSON string literals (escaped quotes handled).
  // A naive depth counter miscounts the braces embedded in code passed as a string
  // value (e.g. multi_edit's edits / a Lua snippet), grabs the wrong end, and makes
  // JSON.parse fail - which silently dropped the command, so the tool never ran and
  // the turn was treated as a plain-text answer. Returns -1 if unbalanced.
  function matchBrace(text, start) {
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
      const c = text[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") { if (--depth === 0) return i; }
    }
    return -1;
  }

  // JSON.parse with a fallback for RAW control characters inside string
  // literals (tab/newline/CR). Models sometimes emit a literal TAB instead of
  // \t inside a command's string value (seen live on Gemini in a big
  // multi_edit); strict JSON rejects it, the parse failed silently and the
  // command was never executed. The fallback walks the text string-aware and
  // escapes those characters ONLY inside string literals, then re-parses.
  // Second-stage repairs, also outside string literals only (1.19.36): a
  // trailing comma before } or ] (DeepSeek/Qwen habit) and NO-BREAK SPACE
  // between tokens (code blocks copied from rendered DOM text). Both made strict
  // JSON.parse fail, so a complete command cost a parse-error retry turn.
  function parseLoose(raw) {
    try {
      return JSON.parse(raw);
    } catch (e0) {
      let out = "", inStr = false, esc = false;
      for (const c of raw) {
        if (inStr) {
          if (esc) { esc = false; out += c; continue; }
          if (c === "\\") { esc = true; out += c; continue; }
          if (c === '"') { inStr = false; out += c; continue; }
          if (c === "\t") { out += "\\t"; continue; }
          if (c === "\n") { out += "\\n"; continue; }
          if (c === "\r") { out += "\\r"; continue; }
          out += c;
          continue;
        }
        if (c === '"') inStr = true;
        if (c === "\u00a0") { out += " "; continue; }
        if (c === "}" || c === "]") out = out.replace(/,\s*$/, "");
        out += c;
      }
      return JSON.parse(out); // may still throw - callers catch
    }
  }

  function extractJson(raw) {
    raw = raw.trim().replace(/^(?:json|JSON)\s*/, "");
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const s = raw.indexOf("{");
    if (s === -1) return null;
    const e = matchBrace(raw, s);            // string-aware: not the last "}" in code
    if (e === -1) return null;
    try {
      return parseLoose(raw.slice(s, e + 1));
    } catch {
      return null;
    }
  }

  // Candidate object openers for the command key at `s`, innermost first.
  // Models do not always write the name first: {"params":{…},"command":"x"}
  // put a CLOSED params object between the outer "{" and the key, so taking
  // only the nearest "{" dropped the call (1.19.35). Ignore closed containers
  // and braces inside strings; a long edits array must not hide the outer call.
  function keyOpeners(text, s) {
    // Only still-open containers can own this property. A backwards search
    // counted completed edit objects and braces in code strings, exhausting the
    // six-candidate budget before reaching {params:...,command:...}.
    const stack = [];
    let inStr = false, esc = false;
    for (let i = 0; i < s; i++) {
      const c = text[i];
      if (!stack.length) {
        if (c === "{" && /^\{\s*"/.test(text.slice(i))) stack.push(i);
        continue; // ordinary prose outside an object is not JSON string syntax
      }
      if (inStr) {
        if (esc) esc = false;
        else if (c === "\\") esc = true;
        else if (c === '"') inStr = false;
      } else if (c === '"') inStr = true;
      else if (c === "{") stack.push(i);
      else if (c === "}") stack.pop();
    }
    if (inStr) return []; // a key-shaped substring inside a value is data
    return stack.reverse().filter(start => /^\{\s*"/.test(text.slice(start)));
  }

  // Protocol-looking text inside Luau is still source data. In particular,
  // scripts often embed examples in [=[...]=] strings or long comments. A
  // regex-only closer truncated those scripts at the example's END marker.
  function literalLuaEnd(text, from, multiline) {
    const closer = multiline
      ? /^[ \t]*###\s*end[_\- ]?lua[ \t]*###[ \t]*(?=\r?(?:\n|$))/i
      : /^###\s*end[_\- ]?lua\s*###/i;
    for (let i = from; i < text.length;) {
      if ((!multiline || i === from || text[i - 1] === '\n') && closer.test(text.slice(i))) return i;
      if (text.startsWith('--', i)) {
        const long = /^\[(=*)\[/.exec(text.slice(i + 2));
        if (long) {
          const close = ']' + long[1] + ']', end = text.indexOf(close, i + 2 + long[0].length);
          if (end < 0) return -1;
          i = end + close.length;
        } else {
          const end = text.indexOf('\n', i + 2);
          if (end < 0) return -1;
          i = end + 1;
        }
        continue;
      }
      const long = text[i] === '[' && /^\[(=*)\[/.exec(text.slice(i));
      if (long) {
        const close = ']' + long[1] + ']', end = text.indexOf(close, i + long[0].length);
        if (end < 0) return -1;
        i = end + close.length; continue;
      }
      if (text[i] === '"' || text[i] === "'" || text[i] === '`') {
        const quote = text[i++]; let closed = false;
        while (i < text.length) {
          if (text[i] === '\\') { i += 2; continue; }
          if (text[i++] === quote) { closed = true; break; }
        }
        if (!closed) return -1;
        continue;
      }
      i++;
    }
    return -1;
  }

  function rawLuaBlock(text) {
    // A reply may mention `###LUA###` or a previous JSON format before its
    // actual fenced block. Skip those mentions rather than rejecting the block.
    let s, search = 0;
    while (true) {
      s = findLuaStart(text, search);
      if (s.pos === -1) return null;
      search = s.pos+s.len;
      const prefix = text.slice(0, s.pos);
      if (!/(?:^|\n)[ \t]*$/.test(prefix)) continue;
      // A line-start marker inside a JSON string is still JSON data, even if
      // the model used literal newlines or has not finished the envelope yet.
      let depth = 0, inString = false, escaped = false;
      for (let i = 0; i < prefix.length; i++) {
        const c = prefix[i];
        // A fenced payload is its own document. A partial JSON example in the
        // surrounding prose must not leak its brace depth into that document.
        // Never reset inside a JSON string: embedded fences there remain data.
        if (!inString && (i === 0 || prefix[i - 1] === '\n')) {
          const fence = /^[ \t]{0,3}(?:`{3,}|~{3,})[^\r\n]*/.exec(prefix.slice(i));
          if (fence) { depth = 0; i += fence[0].length - 1; continue; }
        }
        if (!depth) { if (c === '{' && /^\{\s*"/.test(prefix.slice(i))) depth = 1; continue; }
        if (inString) {
          if (escaped) escaped = false;
          else if (c === '\\') escaped = true;
          else if (c === '"') inString = false;
        } else if (c === '"') inString = true;
        else if (c === '{') depth++;
        else if (c === '}') depth--;
      }
      if (!depth) break;
    }
    const from = s.pos + s.len;
    const multiline = /^[ \t]*\r?\n/.test(text.slice(from));
    const end = literalLuaEnd(text, from, multiline);
    if (end === -1) return {call:null};
    const code = text.slice(from, end).replace(/^[ \t]*\r?\n/, "").replace(/\r?\n$/, "");
    // Canonical multiline blocks are literal source, including leading spaces
    // and identifiers such as json/Copy. Chrome-label repair is legacy inline only.
    return {end,call:{tool:"execute_luau",arguments:{code:multiline ? code : stripCodeChrome(code.trim()),datamodel_type:s.dm}}};
  }

  function extractToolAnywhere(text) {
    for (const key of ['"command"', '"tool"']) {
      let pos = 0;
      while (true) {
        const s = text.indexOf(key, pos);
        if (s === -1) break;
        for (const start of keyOpeners(text, s)) {
          const end = matchBrace(text, start); // string-aware brace matching
          if (end === -1 || end < s) continue; // unbalanced, or closes before the key
          try {
            const call = normalizeCall(parseLoose(text.slice(start, end + 1)));
            if (call) return call;
          } catch {}
        }
        pos = s + 1;
      }
    }
    return null;
  }

  function parseToolCalls(r) {
    // Lowercase for case-insensitive end-marker search. Models write
    // ###end_mcp_tool### (underscore) or ###end-mcp_tool### (dash).
    const rLow = r.toLowerCase();
    const findEndM = (from) => {
      const a = rLow.indexOf("###end_mcp_tool###", from);
      const b = rLow.indexOf("###end-mcp_tool###", from);
      if (a === -1 && b === -1) return -1;
      if (a === -1) return b;
      if (b === -1) return a;
      return Math.min(a, b);
    };
    const out = [];
    let from = 0;
    while (true) {
      const sm = r.indexOf(START_M, from);
      if (sm === -1) break;
      const em = findEndM(sm);
      if (em === -1) break;
      const body = r.slice(sm + START_M.length, em);
      const raw = rawLuaBlock(body);
      if (raw) {
        if (raw.call) out.push(raw.call);
        from = em + END_M.length;
        continue;
      }
      for (const sub of body.split(START_M)) {
        const cleaned = sub.trim().replace(/^(?:json|JSON|Copy|copy)\s*/i, "").trim();
        if (!cleaned) continue;
        const p = normalizeCall(extractJson(cleaned));
        if (p) out.push(p);
      }
      from = em + END_M.length;
    }
    // Prefer a JSON command envelope when one is present: a model may wrap
    // execute_luau as {"command":"execute_luau","params":{"code":"###LUA###…"}},
    // and the bare-marker fallback below would slice the still-ESCAPED JSON
    // source (literal \n, \") instead of the decoded code. extractToolAnywhere
    // JSON-decodes it; cleanLuaCall (applied at the end) then strips the markers.
    if (out.length === 0) {
      const raw = rawLuaBlock(r);
      if (raw) return raw.call ? [raw.call] : [];
      const f = extractToolAnywhere(r);
      if (f) out.push(f);
    }
    return out.map(cleanLuaCall);
  }

  // Some models (seen live on GLM) wrap execute_luau in the JSON envelope AND
  // keep the ###LUA### / ###END_LUA### markers INSIDE the code string, e.g.
  //   {"command":"execute_luau","params":{"code":"###LUA###\n<lua>\n###END_LUA###"}}
  // Once JSON-decoded the code still starts with the literal markers, which the
  // MCP rejects ("Failed to parse command code"). Strip a leading start marker
  // and a trailing end marker from execute_luau's code, and adopt the marker's
  // datamodel when none was given. No-op for a clean code string.
  function cleanLuaCall(call) {
    if (!call || call.tool !== "execute_luau") return call;
    const code = call.arguments && call.arguments.code;
    if (typeof code !== "string") return call;
    const s = findLuaStart(code);
    if (s.pos === -1 || code.slice(0, s.pos).trim()) return call;
    const raw = rawLuaBlock(code);
    if (!raw || !raw.call || code.slice(raw.end).replace(LUA_END_RE, "").trim()) return call;
    call.arguments.code = raw.call.arguments.code;
    if (!call.arguments.datamodel_type) call.arguments.datamodel_type = s.dm;
    return call;
  }

  // Last-resort salvage of a CUT-OFF JSON command: the model hit its output
  // limit with the whole payload complete but the trailing closers missing
  // (seen live on Qwen: a big multi_edit missing exactly ONE final "}").
  // Strictly conservative - we only auto-close when it is provably just the
  // closing sequence that was lost, never when actual content was amputated:
  //  - the scan must NOT end inside a string literal (a value cut mid-string
  //    means real content is missing → keep the parse_error);
  //  - the last non-whitespace char must terminate a complete JSON value
  //    (`"`, `}`, `]`, digit, or the tail of true/false/null);
  //  - at most MAX_SALVAGE_CLOSERS closers may be appended. 2 covers the
  //    root-brace and params-brace cases; a deeper deficit usually means the
  //    cut fell between items (e.g. mid-edits-array), where running a partial
  //    command would be dangerous - the retry feedback stays the right call.
  // Callers must only invoke this once generation has ENDED (the watcher's
  // parse_error branch), never on a still-streaming reply.
  const MAX_SALVAGE_CLOSERS = 2;
  function salvageCutOff(text) {
    for (const key of ['"command"', '"tool"']) {
      const k = text.indexOf(key);
      if (k === -1) continue;
      const start = text.lastIndexOf("{", k);
      if (start === -1) continue;
      if (matchBrace(text, start) !== -1) continue; // closed → not our case
      // String-aware bracket stack from the opener to the end of the text.
      const stack = [];
      let inStr = false, esc = false;
      for (let i = start; i < text.length; i++) {
        const c = text[i];
        if (inStr) {
          if (esc) esc = false;
          else if (c === "\\") esc = true;
          else if (c === '"') inStr = false;
        } else if (c === '"') inStr = true;
        else if (c === "{") stack.push("}");
        else if (c === "[") stack.push("]");
        else if (c === "}" || c === "]") {
          if (stack.pop() !== c) return null; // mismatched nesting → hopeless
        }
      }
      if (inStr) return null;                       // cut mid-string value
      if (!stack.length || stack.length > MAX_SALVAGE_CLOSERS) return null;
      const body = text.slice(start).trimEnd();
      if (!/["}\]0-9]$|(?:true|false|null)$/.test(body)) return null; // value incomplete
      try {
        const call = normalizeCall(parseLoose(body + stack.reverse().join("")));
        if (call) return cleanLuaCall(call);
      } catch {}
      return null;
    }
    return null;
  }

  function toolNameFromText(txt) {
    // Match the name even BEFORE its closing quote (`[^"]*`), so the chip shows
    // the real command name AS IT IS TYPED instead of a generic "command"
    // placeholder until the JSON closes. A still-empty value falls through.
    // Trim: while the value is still streaming it can be whitespace-only (e.g.
    // Kimi renders `"tool": "    "` for a beat), which would otherwise show a
    // blank chip label until the loop repaints it. A whitespace value falls
    // through to the placeholder below instead.
    const m = txt.match(/"(?:command|tool)"\s*:\s*"([^"]*)/);
    if (m && m[1].trim()) return m[1].trim();
    if (txt.includes("execute_luau") || LUA_START_RE.test(txt)) return "execute_luau";
    return "command";
  }

  // A turn the EXTENSION injected (always sent as a user turn): a tool result, an
  // ERROR, or a "(System note: …)" control message. Matched ONLY by the fixed
  // shapes we emit - never by command-like keywords, since a parse-error note
  // quotes a {"command": …} example that must NOT be read as a real command.
  function isInjectedFeedback(txt) {
    return /^\s*Output of '/.test(txt) ||
           /^\s*\[PlazCode retained the COMPLETE result\. This is the first page, not truncated source\. Read the rest with plazcode_result_read \{id:"[a-f0-9-]{36}",offset:\d+\}/.test(txt) ||
           /^\s*ERROR\b/.test(txt) ||
           /^\s*\(System note:/.test(txt);
  }

  // The assistant emitted a RobloxScript command (JSON or a ###LUA### block).
  function hasCommandShape(txt) {
    return txt.includes(START_M) ||
           rawLuaBlock(txt) !== null ||
           CMD_KEY_RE.test(txt); // command/tool with PlazCode without params (e.g. list_commands)
  }

  // Metadata only: debug reports must not collect the user's Luau or chat.
  function transportInfo(text) {
    const value = String(text || ''), raw = rawLuaBlock(value);
    return {
      format: raw ? 'raw_luau' : value.includes(START_M) ? 'mcp' : CMD_KEY_RE.test(value) ? 'json' : 'other',
      chars: value.length,
      calls: parseToolCalls(value).length,
      open: hasOpenToolBlock(value),
      lua_start: LUA_START_RE.test(value),
      lua_end: LUA_END_RE.test(value),
    };
  }

  return {
    build: "r11",
    START_M, END_M, LUA_START_RE, LUA_END_RE, CMD_KEY_RE,
    findLuaStart, findLuaEnd, matchBrace, extractJson, normalizeCall,
    hasToolSignature, hasOpenToolBlock, parseToolCalls, salvageCutOff, toolNameFromText,
    isInjectedFeedback, hasCommandShape,
    transportInfo,
  };
})();
