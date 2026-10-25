EXTENSION UPDATE 1.24.43 / r35 (2026-10-25): Meta AI composer resolution now reaches deeply nested local Send/Stop controls. The supplied r34 report showed a recognized Lexical editor and hidden textarea mirror, but no controls in the six ancestors the old resolver inspected; this failure happened before the model replied. The update keeps one confirmed send, rejects ambiguous controls and extends redacted composer diagnostics. See [START-TUTAJ-PL.md](START-TUTAJ-PL.md), [LONGCAT-META.md](LONGCAT-META.md) and [TESTY-TRZY-SERWISY.md](TESTY-TRZY-SERWISY.md) for installation and evidence. The report does not include the actual Send attributes, and controlled tests do not establish signed-in live-account compatibility. Explicit model refusals still stop startup. This is an extension-only update; native release statements below do not validate this patch.

PlazCode 1.22.1 — Model Builder, Notion and add-on fixes

Model Builder and UI Builder Generate works again, Notion AI turns no longer stop with Message was not confirmed after an accepted message, Studio add-ons such as robloxstudio-mcp stay connected during long playtests, and Git, Ollama and Roblox requests no longer fail or wait forever.

- Add-on tools get the time they ask for: a tool's own timeoutMs or timeout_seconds is honored (plus 30 seconds, up to 10.5 minutes), and Studio add-ons such as robloxstudio-mcp get 5.5 minutes by default.
- Ollama chat waits up to 10 minutes for an answer, so large local models on a CPU still have time to reply. Past that, the Ollama page shows OLLAMA TIMED OUT. Listing models gives up after 5 seconds.
- Each Roblox request (developer products, universe lookup) ends after 20 seconds with a message naming the address that did not answer.
- Generate in the desktop Model Builder and UI Builder no longer fails with Invalid desktop agent action.
- creation_preview no longer fails with action_id must be a string when the AI leaves out the blueprint action_id; a preview ID is filled in.
- When the AI wraps a tool such as creation_preview in a Studio MCP skill call, PlazCode runs that tool directly instead of returning Unknown skill.
- Notion AI: the composer is found again when Notion renders it as a page-style block next to its own send button, so accepted messages are confirmed instead of stopping the turn with Message was not confirmed.
- A slow add-on tool call no longer kills the add-on server. PlazCode cancels the call and keeps the server, so robloxstudio-mcp keeps its Studio plugin connection; the server restarts only after two timeouts in a row.
- The Git add-on finds Git installed after PlazCode started (current user and system PATH), and Git from GitHub Desktop or Chocolatey.
- The Ollama page no longer stays on the thinking indicator forever when Ollama accepts the connection but never replies.

PlazCode 1.22.0 — Copy debug report

Settings in the desktop app now has a Copy debug report button at the bottom. It copies a report of recent PlazCode and AI-site errors, warnings and info, with the file and function involved and the likely cause, ready to paste into an AI chat for debugging.

- Copy debug report at the bottom of Settings in the desktop app, with Show report to read it first. The report lists PlazCode errors and warnings, errors from the AI site itself, recent info, failed bridge requests, agent events and the desktop log.
- Each problem in the report names where it happened, such as core/main.js > sendPrompt, and the report starts with the most likely causes.
- Keys, tokens, cookies, user names, e-mail addresses and chat text are removed from the report, and the report stays on this computer until it is copied.

PlazCode 1.21.1 — No more hang on Starting Up

The agent no longer hangs on Starting Up when the PlazCode bridge stops answering, the extension always answers its own startup checks, and the Notion AI chat box is also found when its placeholder reads How can I help.

- Every request to the PlazCode bridge now gives up after a time limit, and background checks for memory, status and updates never run twice at the same time.
- Starting an agent could hang on Starting Up when the bridge accepted a connection but never replied, because waiting background requests filled the browser's connection limit.
- An unexpected error while handling an extension message could leave the bar waiting forever. An error reply is now always sent.
- The Notion AI chat box was not found when its placeholder read How can I help instead of the known wording.

PlazCode 1.21.0 — Working Model Builder and UI Builder, Studio vision, asset upload and DeepSeek rate-limit handling

The Model Builder and UI Builder now generate with the AI selected in PlazCode and insert into Roblox Studio 1:1 in front of the camera, PlazCode reviews Studio screenshots after visual changes and fixes problems on its own, assets can be uploaded to Studio from the toolkit or by asking the AI, and DeepSeek rate limits are waited out instead of stopping a run.

- Model Builder and UI Builder have a simplified layout: prompt, detail and style options, reference image, presets, a live preview, recolour and size controls, revise-by-request and saved creations.
- The UI Builder preview switches between phone, tablet and PC sizes.
- Upload to Studio in the toolkit lists every uploadable asset (models, animations, sounds, images and more) with search. The AI can also upload an asset when asked.
- Automatic Studio vision: after a visual change, a Studio screenshot is reviewed and problems such as misplaced parts, VFX or weapon grips are fixed without being asked.
- Seconds between commands setting (0 = no pause, the previous behaviour) to stay under provider rate limits.
- Saved memories now have a title describing what each memory is about.
- Builders use the AI currently selected in PlazCode instead of a separate model.
- Insert into Studio builds one Model in front of the camera, snapped to the ground, as a single undo step (Ctrl+Z).
- DeepSeek busy or rate-limit replies are waited out automatically with growing pauses (5 s to 120 s) and the last message is resent, with no retry limit. Stop still works during the wait.
- Repeated failed commands no longer pause a run; the AI is told to change approach instead.
- The memory settings page is simplified and the separate Engram section is removed.
- Image-to-model keeps refining until the result matches the reference instead of stopping after two rounds.
- When the PlazCode bridge is running in Roblox mode, other bridges or AI tools holding the Studio MCP connection are closed so the agent can start.
- Model Builder and UI Builder did not produce or insert anything.
- The clarify tool failed with Recommend one option and explain why, which could trigger the repeated tool failures pause.
- Test windows no longer pop up on screen while tests run.

PlazCode 1.20.0 — Notion in Edge, fewer stalled runs, accurate Studio status and a sturdier updater

Notion AI now loads in Microsoft Edge, cut-off commands no longer pause a run after three tries, a tool result is no longer sent to the AI more than once, the bar no longer reports MCP as off while Roblox Studio is connected, and the desktop updater keeps working when the GitHub API is unreachable.

- When Notion AI is slow to load in Microsoft Edge, the Notion AI isn't ready message now includes an Edge-specific tip.
- Cut-off (incomplete) commands no longer pause a run after three failures. Six attempts are allowed, and from the second one the AI is asked to split the edit into smaller parts.
- The Studio connection check now tolerates a single missed status reading and an empty status line, so a connected Studio MCP stays shown as connected.
- Notion AI could fail to load in Microsoft Edge with Notion did not load its AI editor at /ai after 60 seconds, because Edge can report a window height of 0 while the page loads. The chat box is now found in that case.
- The same tool result (for example the list_commands output) could be sent to the AI several times. A result that was already delivered is not sent again within 45 seconds, and results with images or very long text are never retried automatically.
- The bar could show Studio is open but MCP is off while Roblox Studio showed 1 client connected.
- An update could fail with error sending request for url when api.github.com was unreachable or returned a server error. The updater now retries once and then downloads the fixed official release asset, still verified against the published SHA-256.
- The update window could show Update could not finish next to Update ready. A ready update now clears the earlier error.

PlazCode 1.19.39 — Hidden bar frees the chat box, steadier Notion runs and a continuation setting

Hiding the PlazCode bar now returns the chat box to its normal size, Notion tool results are no longer lost when Notion confirms a message late, the bar says what the agent is doing while it works, and a new setting turns the continue-previous-chat prompt on or off.

- Setting: Offer to continue previous chat (on by default). It is in the PlazCode bar settings and in the desktop app under Settings, and the two stay in sync. When it is off, a new chat never asks whether to continue the previous chat or start a new project. Saved chats and memory are not deleted.
- While the agent works, the bar now says which step is happening: running a tool (with its name), sending the result to the AI, the AI writing, or waiting for the AI to finish. A working agent no longer looks stuck when the site's own Stop button has already turned back into Send.
- The message for a chat without an agent is clearer: Not connected to this chat yet. Click Restart Agent to connect Roblox Studio (or AgentScript when AS is selected). The full status text also shows when you hover over it.
- If PlazCode could not deliver a tool result before anything was sent (for example the chat box was not ready yet), it now waits 2 seconds and tries once more instead of stopping the task. A message that may already have been sent is never sent twice.
- Fixed hiding the PlazCode bar leaving the chat box enlarged. The hidden bar now gives back the space it reserved, so the chat box returns to its normal size and no longer covers chat text. Showing the bar again restores it exactly.
- Fixed Notion runs stopping with Message was not confirmed when Notion accepted a tool result but showed it late. PlazCode now keeps watching for up to 30 more seconds (without clicking Send again), so the AI gets its result and the run continues.
- Fixed duplicate files in the source download. The release tools folder of PlazCode-source-1.19.38.zip contained two copies of five files; the packager now writes each file once and checks every ZIP for duplicate entries.

PlazCode 1.19.38 — Faster Notion start, bar on the chat box and fewer tool errors

Start Notion agents in seconds instead of waiting up to a minute, keep the PlazCode bar on top of the Notion chat box, repair common tool-call formatting mistakes automatically, fix the Git MCP server and find updates sooner.

- Automatic tool-call repair. Before a command runs, PlazCode fixes common formatting mistakes from the AI: arguments sent as a JSON string, quoted numbers, true/false and lists, wrong capitalisation of allowed values, Luau code wrapped in code fences and stray spaces in tool names. Real mistakes are still reported to the AI.
- Notion starts the agent as soon as its chat box and send button are visible. PlazCode no longer waits up to 60 seconds for Notion to confirm the editor, so Start and Restart finish in a few seconds.
- Update checks retry once with separate time limits, and the background check allows 15 seconds instead of 8, so a slow response no longer hides a new version.
- An update found while PlazCode is idle installs within 30 minutes. It still never interrupts a running task.
- Fixed the PlazCode bar on Notion floating away from the chat box. It now sits directly on top of the chat box, follows it when it moves and stays centred on the chat column.
- Fixed the Git MCP server failing to start when Git was not on the PATH used by PlazCode. PlazCode now also checks the usual Git install folders and shows a clear message if Git is missing.
- Fixed new versions sometimes not being detected until PlazCode was updated by hand.

PlazCode 1.19.37 — Hide bar, steady bar size and Mac fixes

Add a Hide bar button that keeps PlazCode working, keep the bar a steady size and on top of the chat box, fix Blender MCP on Intel Macs and fix macOS updates that could not find the PlazCode folder.

- Hide bar button (›) on the PlazCode bar. Hiding only makes the bar invisible and click-through so it never covers chat text; runs, Co-Work, tools, desktop Start/Stop and every setting keep working. A small PlazCode tab at the bar's right edge shows it again in the same position with every control as it was. The choice is remembered for that browser tab.
- The bar keeps the same compact height in narrow or zoomed browser windows instead of growing to about twice its normal height below 720 pixels wide.
- On Notion, while the chat box is still loading or not yet confirmed, the bar sits on top of the visible chat box instead of floating over chat text at the centre of the window.
- macOS launch scripts clear the download quarantine flag and remember the PlazCode folder, so macOS runs PlazCode.app from its real folder.
- Fixed Blender MCP (and other uvx servers) failing to start on Intel Macs with "maturin failed" while building cryptography. cryptography 49 and newer have no Intel Mac package, so uv now uses the newest version that does (48.0.1) instead of compiling it; Apple Silicon, Windows and Linux are unchanged.
- Fixed macOS updates failing with "The application was moved outside its PlazCode installation folder" when macOS ran PlazCode.app from a temporary read-only copy (App Translocation) or when only PlazCode.app was moved. PlazCode now finds its recorded folder, and explains the one-time fix if it cannot.

PlazCode 1.19.36 — Faster ChatGPT startup and reliable unattended runs

Start ChatGPT sessions faster, keep long unattended runs going in background or sleeping browser tabs, and make Windows auto-updates recover from a locked PlazCode.exe without restart loops.

- Unattended-run protection. While an agent run is active, PlazCode keeps its tab from being discarded by Edge sleeping tabs or Chrome Memory Saver, keeps the run's timers on schedule in hidden or covered tabs, and tells the desktop app that work is in progress so an automatic update waits until the run finishes.
- Update failure record. A failed Windows update is written to logs/update-failure.json with its version, attempt count and message.
- ChatGPT startup and each tool step finish sooner. PlazCode recognizes ChatGPT's finished-turn controls instead of waiting out fixed idle timers, which removes up to about 4 seconds from the startup handshake.
- Windows updates rename a locked PlazCode.exe or other locked file aside and install the new copy instead of failing, then delete the renamed files on the next start.
- Desktop downloads allow up to 30 minutes and fail only after 60 seconds without progress, so slow connections finish instead of timing out at 3 minutes.
- After a failed automatic update, PlazCode waits 10 minutes before trying again, doubling up to 6 hours. A newer version or a manual update starts immediately.
- Notion waits up to 60 seconds for its AI editor to load, which covers slow Microsoft Edge cold starts.
- Tool-call parsing accepts commands written with params before the command name, trailing commas and no-break spaces between JSON tokens.
- Fixed a restart loop where a failed Windows update relaunched PlazCode, which updated again immediately and closed the app about every minute.
- Fixed a tool command running twice. When the desktop app restarted or updated while a command was running, the browser extension resent it after reconnecting; it now reports the uncertain result and asks the model to check the current state first.
- Fixed tool timeouts asking the model to retry blindly. Timed-out commands may still finish in Studio, so the model is told to check the result before running them again.
- Fixed automatic updates being postponed indefinitely while the browser extension was open, and being able to restart the bridge during a long model reply.
- Fixed leftover download folders from interrupted desktop updates never being removed.
- Fixed a failed download turning off automatic installs until PlazCode was restarted.

PlazCode 1.19.35 — Reliable Notion file uploads and faster Windows updates

Retry stalled Notion protocol file uploads automatically so long tasks keep running, and make Windows updates download faster and wait longer for PlazCode.exe to close.

- Automatic retry for Notion protocol file uploads. When Notion ignores the file or its upload spinner never finishes, PlazCode removes only its own file, pauses and uploads it again, up to four attempts, alternating between Notion's file picker and drag-and-drop.
- Notion tool results and startup messages continue without stopping the task when a single upload stalls. Nothing is submitted until the file finishes uploading, so a retry never sends a message twice.
- The Windows updater downloads the release package without PowerShell's per-chunk progress display, which slowed Update-PlazCode.bat downloads many times over. The updater window still shows its own progress.
- The Windows updater waits up to 60 seconds instead of 20 for PlazCode.exe to be released after closing PlazCode, giving antivirus scans and slow process shutdowns time to finish.
- Notion no longer pauses mid-task and stops with Message was not confirmed after one stalled protocol file upload, during startup or while sending tool results.
- Update-PlazCode.bat no longer takes a very long time on the Downloading update step in Windows PowerShell 5.1.
- Updates no longer fail with PlazCode.exe is still locked when Windows releases the file slowly. If it stays locked, the message names the likely causes: another PlazCode copy started as administrator, an antivirus scan or a pending restart. No files are copied in that case, as before.

PlazCode 1.19.34 — Firefox Notion startup, Co-Work and update-restart fixes

Fix Firefox paste and file delivery for Notion and Co-Work, keep the desktop app open during active work and start ChatGPT commands sooner.

- A Firefox-only page helper that delivers PlazCode paste, file-drop and input events to AI pages with their text and files intact. Chromium packages are unchanged.
- Real-Firefox release checks for the Notion protocol file upload, inline follow-up paste, Co-Work draft clearing and unchanged native page events.
- Automatic desktop updates wait until PlazCode has been idle for 3 minutes. An update found during a task shows Update ready, and Update now still installs immediately.
- After an automatic update, an open desktop window reopens without taking focus instead of restarting minimized.
- ChatGPT commands start 0.5 seconds after the reply stops and its Stop control disappears, instead of after a fixed 1.5-second idle wait. Each command round trip is about 0.8 seconds faster.
- Firefox Notion no longer waits a long time at Start and then fails with Message was not confirmed because the protocol file upload never reached Notion.
- Firefox Co-Work on Notion accepts typed follow-ups while the AI is working, queues them with Enter and clears the composer, matching Chrome.
- The desktop app no longer closes in the middle of a task when an automatic update arrives, and no longer appears to close by restarting minimized after a background update.

PlazCode 1.19.33 — Firefox installation and authenticated bridge support

Add a Firefox extension package and correct Firefox background startup and desktop pairing.

- A dedicated PlazCode-Extension-Firefox folder in both desktop downloads and a standalone PlazCode-Firefox-1.22.1.zip with manifest.json at its root.
- Firefox installation instructions explain selecting manifest.json or the Firefox ZIP in about:debugging, reloading after updates and the unsigned temporary-install limitation.
- Firefox uses the same provider adapters, tools, bar, creators and settings as the Chromium extension, with a Firefox background script and stable addon identity.
- Firefox requests use the installation-specific extension UUID for automatic pairing, while authenticated desktop HTTP and WebSocket routes recognize valid moz-extension origins.
- Startup prompt limits reserve space for clarification instructions and memory on providers with smaller prompt limits.
- The Chrome-only background service-worker manifest no longer prevents the Firefox package from starting its bridge controller.
- Firefox automatic pairing no longer fails because its addon ID differs from Chrome extension IDs. Invalid, mismatched and webpage origins remain rejected.

PlazCode 1.19.32 — Clarify unclear tasks and fix Blender command results

Add an AI clarification panel with scoped options and explicit answers, and correct Blender command result handling.

- A clarification panel displays the active AI name followed by is asking you…, with 2–3 options, the scope of each, a recommended approach and 1–3 clarifying questions.
- Answers support selecting an option, adding details or proposing a different approach. Submitted answers return to the same AI session.
- Supported AI sessions assess the request before acting and use plazcode_clarify when unclear choices would materially change the scope. Clear tasks can proceed without unnecessary questions.
- The agent waits quietly for an explicit response, without reminders, default selections or automatic timeouts. Waiting pauses the task time budget and does not consume a command.
- The panel uses the current PlazCode theme, responsive spacing, keyboard focus controls and reduced-motion support.
- Blender scene checks use an 8-second command limit. Timeout messages distinguish process/tool discovery from actual addon responses and explain checking or updating the addon without automatically replaying edits.
- Stop or a chat/engine change cancels an unanswered clarification without sending an answer or running the pending work.
- Clarification inputs stay isolated from native AI composer searches and render AI text safely.
- Ordinary Blender commands no longer read unrelated mesh files after receiving a result. Named operations parse the current Python output directly and never substitute an older status file.
- Mesh exports read only the mesh file identified by the current response. Concurrent Blender commands return a clear busy message instead of silently waiting in a queue.
- Blender transport failures clear extension readiness, and completed commands clear their fallback timers.

PlazCode 1.19.31 — Faster Studio detection and reliable Notion send confirmation

Push verified Studio connection changes to the bar and recognize Notion messages in virtualized or slow-loading chats.

- A checking connection state distinguishes the initial Studio handshake from a confirmed disconnected editor.
- Verified Studio connection changes reach connected extension instances immediately without waiting for the heartbeat.
- Studio process detection checks once per second using process names; disconnected editors retry once per second while connected checks retain their existing interval.
- Notion waits up to 15 seconds for message confirmation, including foreground chats.
- Notion Co-Work follow-ups use normal plain-text messages instead of appearing as red code; long follow-up files are described as requests rather than startup protocol.
- Notion messages are confirmed when the transcript replaces or reuses user rows without increasing the visible message count.
- Old identical messages, unrelated new rows and an emptied composer alone do not confirm a send; uncertain sends remain single attempts.
- Studio status preserves the difference between a running Studio process and a verified MCP connection.

PlazCode 1.19.30 — Safer release packages and visible Co-Work follow-ups

Add verified production packages, persistent follow-up visibility and clearer browser update instructions.

- GitHub build provenance attestations for release downloads, with a separate editable GPL source archive.
- Co-Work follow-ups remain visible in the conversation with queued, sending, sent and unconfirmed states.
- An independent Co-Work composer accepts follow-ups during internal tool feedback writes and retains drafts separately for each chat and engine.
- Production JavaScript removes comments and whitespace while preserving names, execution order and parsed structure.
- Official automatic updates cross-check package checksums against published GitHub release metadata. If that API is rate-limited, downloads use the fixed official asset URL and retain checksum and version verification.
- Official update feeds select the running operating system, including macOS installations made from the combined ZIP.
- Outdated bar messages explain updating the desktop first and reloading the extension at chrome://extensions, edge://extensions or brave://extensions. Other browsers show Outdated.
- GitHub API rate limits no longer prevent otherwise valid official automatic updates or Windows manual updates.
- Error and result cards reserve consistent internal spacing across AI-site wrappers and wrap long labels without overlap.
- Notion command cards retain completed or failed status after stale page updates and response remounts.
- Localized Notion AI composers, including German Frag Notion-KI, anchor the bar to the composer instead of leaving it detached.
- Browser error diagnostics preserve readable details and exclude unrelated site errors from extension error reporting.
- Co-Work follow-ups remain visible after the queue hands them to the AI, including follow-ups attached to tool results.
- The Follow up composer placeholder appears only while the AI is working and restores each site's original placeholder when the task finishes.
- Execution settings separate limits, visual review, help text and continuation buttons into clearly spaced rows.

PlazCode 1.19.29 — Recognizable AI icons in the supported-AI dropdown

Replace supported-AI letter badges with recognizable logo artwork while preserving existing links, layout and behavior.

- Add supplied icons for Gemini, Kimi, Z.ai / GLM, Qwen, Arena, FreeBuff, OxAlpha, Notion AI and Ollama.
- Reuse the existing ChatGPT, Claude and DeepSeek logos in the full supported-AI list.
- Keep a consistent icon frame with preserved proportions, theme-aware styling and offline artwork.
- Keep Crax and Use.ai letter badges unchanged.
- Remove the baked-in checkerboard behind the supplied Arena logo.
- Trim empty artwork margins visually so logos remain legible without stretching or overlapping labels.

PlazCode 1.19.28 — Reliable Blender checks, tab-local engines and update recovery

Verify actual Blender responses, isolate script modes per AI tab, recover missing update helpers and improve Notion/Claude command presentation.

- Test Blender connection verifies an actual addon scene response and explains addon setup separately from the MCP process.
- Browser connection errors include pairing and extension/local-network permission guidance.
- Blender commands use a bounded native TCP bridge instead of temporary PowerShell/Python request files; scene checks finish or report an error within eight seconds.
- RobloxScript and AgentScript choices persist per tab across service-worker restarts. Popup and desktop switches target only the selected AI tab.
- Notion protocol uploads select text-compatible file inputs and allow more time for slow uploads without duplicate submissions.
- Missing update helpers are recovered from the compiled app in temporary staging; incomplete application-only installations receive a clear full-folder extraction error.
- Failed update screens no longer promise a restart that is not pending.
- Blender no longer appears connected merely because a port or MCP process is running.
- Each browser socket has its own connection ID, preventing one browser disconnect from removing another browser connection.
- Claude command frames support deeper wrappers and Copy-to-clipboard controls while preserving narration and ordinary code.

PlazCode 1.19.27 — Separate builders, Studio Toolkit and readable notifications

Separate Model Builder and UI Builder, add the Toolkit page, and introduce notifications that become read when opened.

- Model Builder and UI Builder each have a dedicated page, relevant controls and a filtered saved-draft library.
- Toolkit includes 12 AI game starters, six AI script jobs, six direct lighting presets, seeded terrain generation, Creator Store search and model insertion, a Luau console, Play controls, a read-only health scan and saved place backups.
- A themed notification bell records Studio connection changes, completed AI tasks, update availability and errors, and Toolkit results. Opening the panel marks messages read; read state persists and notifications can be cleared.
- Both builders retain Describe, Review preview and Insert in Studio steps, reference images, revision requests, exports and saved preview edits. UI Builder hides model-only controls.
- Toolkit explains which actions use the AI chat, which run directly in Studio, and which work with saved files.
- New pages use responsive cards, wrapping action rows, consistent gaps, themed focus states and a scrollable sidebar that fits short windows.
- Builder libraries and blueprint imports cannot silently open a draft of the wrong type.
- Terrain accepts seed 0 and replaces only the selected generation area when replacement is enabled.
- Backups verify checksums before restoring, block restoration while Studio is detected open, and preserve the replaced file as another backup.

PlazCode 1.19.26 — Supported AI shortcuts and reliable Studio connection status

Add a supported-AI dropdown to Home, match Quick Access icons, and fix conflicting Studio connection checks.

- Home includes an All supported AIs dropdown with launch buttons for every registered browser AI provider and an Ollama website entry.
- Ollama includes a clear note that local chat opens from the browser extension; Notion is labeled experimental.
- AI launch buttons use the same external-browser flow as the recommended ChatGPT, DeepSeek and Claude buttons.
- The dropdown uses a responsive grid, consistent button gaps, wrapping labels and themed focus/hover states.
- Quick Access Tools, MCP Servers, Terminal and Settings icons now use the exact SVG artwork from the sidebar.
- The supported-AI list expands in normal page flow, keeping Task checkpoints & workflows and following content from overlapping.
- The browser bar now reads the desktop’s confirmed Studio connection status instead of ignoring it.
- A missed process scan or a disconnected browser tab no longer clears a verified Studio MCP connection. Unknown probe timeouts retain the last confirmed result; explicit connection failures still disable the agent.

PlazCode 1.19.25 — Reliable updater restarts and clear Notion settings

Confirm the updated desktop has loaded, keep background restarts accessible and hide the floating bar over Notion settings.

- Regression checks cover Notion settings, nested model controls, closing panels and hidden settings.
- Automatic updates wait for a versioned desktop-ready confirmation and retry once if the first launch exits.
- Settings visibility is detected even when the underlying Notion AI chat route stays unchanged. Normal AI chat and PlazCode settings remain usable.
- Windows update installation skips identical files; background restarts remain minimized in the taskbar or Dock without taking focus.
- The floating bar no longer covers Notion settings actions or the Restrict models from Notion Agent dialog.
- Update completion is no longer reported merely because a process launched. A desktop startup failure preserves the installed update and reports startup diagnostics.
- Update helpers run from temporary copies so replacing the installed macOS script cannot interrupt its own execution.

PlazCode 1.19.24 — Clear execution settings, guided creators and readable chat activity

Make execution controls and the model/UI creator easier to use, preserve AI explanations and clean up crowded or unstyled controls.

- Beginner-friendly execution help explains engines, command/time limits, visual review, stop modes, permissions, continuation exports and resuming paused tasks.
- An Engram guide explains project notes, searching, fact IDs, topic keys and the difference between memory, saved logs and continuation files.
- Creators now follow Describe → Review preview → Insert in Studio, with labeled inputs, simpler edit buttons, an AI readiness explanation and optional file/feedback controls grouped separately.
- Desktop and extension numeric/select controls use themed backgrounds, clear borders, focus states and consistent spacing. Saved-chat controls and creator edit actions have explicit gaps.
- Changes to execution limits sync into open browser chats; 0 remains unlimited and applies to the next run or resumed allowance.
- Command cards keep readable spacing and left-aligned labels. Collapsing activity no longer hides assistant explanations or original user requests.
- Desktop refresh no longer resets command/time values while a field is focused or its change is being saved. Empty or invalid numeric changes are not saved as limits.
- Ordinary assistant prose followed by a tool result is no longer replaced by a tool-only chip.
- DeepSeek no longer interprets “Stopped” inside generated code or prose as a site stop notice; message IDs take priority over recycled virtual-list keys.
- An unfinished DeepSeek command block no longer masks every following paragraph.

PlazCode 1.19.23 — Correct Chrome extension version labels

Fix Chrome showing extension version 1.19.16 despite newer extension files being installed.

- Release validation checks both extension manifests for contradictory displayed and actual versions.
- Chrome uses the actual manifest version as the extension display version, removing the separately maintained version label.
- Removed the stale version_name value of 1.19.16 from both extension manifests.

PlazCode 1.19.22 — Reliable PlazCode application and background tray icons

Complete the Windows application icon fix and correct the updater notification icon copy.

- Retains the embedded PlazCode application icon introduced in 1.19.21, with nine sizes from 16 to 256 pixels.
- Windows icon checks now inspect the updater tray icon pixels and verify that the installed icon file can be replaced during updates.
- The updater now copies a fully loaded native icon, preventing corrupted tray pixels after its icon input stream closes.

PlazCode 1.19.21 — Branded Windows application and tray icons

Add the missing PlazCode application icon to the Windows executable and background tray.

- Embedded multi-resolution PlazCode icon includes 16–256 pixel sizes for Windows application files and display scaling.
- The application window, taskbar and background tray share the existing orange PlazCode brand mark.
- The updater uses the PlazCode icon for its progress window and background tray notification while retaining the selected theme and background behavior.
- File Explorer and the running application tray no longer fall back to the generic white and blue Windows application icon because the executable lacked an icon resource.

PlazCode 1.19.20 — Clear Settings icon at sidebar size

Correct the distorted Settings wrench and gear while retaining the 1.19.19 navigation and updater improvements.

- Redrawn wrench, handle opening and gear geometry follow the supplied reference with a thinner outline and clear spacing.
- Settings keeps consistent stroke proportions in selected and unselected states, including shared themes and display scaling.
- Removed the mismatched gear transform and crowded strokes that made Settings look distorted at normal sidebar size.

PlazCode 1.19.19 — Updated navigation icons and theme-aware background updates

Refresh Home, Templates and Settings icons and keep automatic updates from interrupting the foreground app.

- Non-activating update progress and a tray notification explain automatic background updates on Windows.
- Background relaunch mode keeps an automatically updated desktop behind the current app.
- Home uses a house icon, Templates an open folder with a document, and Settings a gear with a wrench, based on the supplied references.
- Windows update animation follows the saved PlazCode theme, glow and gradient settings. PlazCode Orange keeps its default update colors.
- Manual updates retain visible progress; automatic updates use foreground progress when PlazCode is active.
- Release descriptions use a title, short summary, New additions, Improvements and Bug fixes.
- An automatic update no longer brings the Windows progress window or relaunched desktop to the foreground when PlazCode is in the background.
- The macOS automatic updater relaunches a background desktop without activating it.
- Official release checks migrate the previous PlazCodeneww feed to the renamed PlazCode repository while preserving custom update feeds.
- Published feeds keep recent descriptions within the updater size limit; the complete release history remains in release-notes.json.

PlazCode 1.19.18 — Engram memory, larger templates and automatic creator enhancement

Persistent project memory and clearer saved chat logs improve continuation across chats. Large templates stream in small chunks, creator requests reuse the prompt enhancer automatically, and saved memory expands to 500,000 characters.

- Bundled Engram 3.0.0 with local project-isolated databases, memory search, observation reads, stable topic updates and session summaries.
- Engram context recall during tasks and new-chat continuation, plus durable completed/interrupted checkpoint references. Current project state is checked before resuming historical work.
- Desktop controls to review/search/read/save/soft-remove project observations and download retained saved chat logs.
- Automatic prompt enhancement before chat-driven model or UI creation, using the existing enhancer rules and preserving the original constraints.
- Saved memory capacity increases from 150,000 to 500,000 characters in total, including adding, editing, importing and restoring notes. Long notes remain available through paged reads; prompt previews stay bounded.
- Template uploads accept .rbxl, .rbxlx, .rbxm and .rbxmx files up to 512 MiB using 2 MiB chunks, progress reporting, cancellation and asynchronous indexing.
- Template search accepts descriptions of systems and matches related script paths and source, with synonym/plural handling, bounded previews and exact paged script reads.
- Template indexing supports up to 10,000 scripts, 64 MiB of source per template and 128 MiB across the catalog. The original uploaded file is preserved exactly.
- The 1.19.17 desktop design, twelve themes and automatic-update fixes remain included. Separate normal and macOS downloads contain rebuilt native apps.
- Oversized saved notes no longer prevent chat-context restoration: full notes are stored while only short reference excerpts are sent.
- Automatic creator enhancement cancels on Stop or chat changes, coalesces concurrent attempts and reuses a manually enhanced prompt without another rewrite.
- Project memory does not cross into unrelated project databases. Disabling automatic memory blocks automatic observations and checkpoint writes while keeping explicit manual saves available.
- Corrupt or unreadable chat archives are preserved and reported instead of overwritten. Log exports expose retention omissions.

PlazCode 1.19.17 — Visible desktop revamp and persistent automatic updates

A more visible upgrade to the existing desktop workspace, paired with automatic installation for updates detected after launch and accurate desktop build detection.

- Larger stacked AI launch cards, a stronger session panel, four separate status cards, and framed Quick Access and Recent Activity panels.
- A clearer navigation rail, larger headings, more readable card text, improved input controls, and consistent spacing throughout the desktop.
- Separate running desktop and extension version reporting, with native build requirements in both platform release feeds.
- Smooth CSS hover, press, and navigation transitions retain existing controls and workflows. Reduced-motion preferences remain respected.
- All twelve themes remain available, including Oceanic, Copper Atelier, Aurora, Orchid Noir, and Solar Dusk.
- Responsive layouts adapt the upgraded workspace to wide, medium, and compact windows.
- Automatic installation stays enabled after an up-to-date launch check, so releases detected while the app remains open can install.
- Verified same-version Windows packages can repair an older executable without bypassing checksum/version verification or permitting package downgrades.
- Extension manifest updates no longer hide an older running desktop executable or make its older interface appear current.
- Background release checks are spaced thirty seconds apart, replacing the two-second network loop. Transient check failures retry; installer failures remain visible and avoid repeated install loops.

PlazCode 1.19.16 — Workspace design upgrade and new themes

A visual refinement built on the existing workspace layout, with smoother interaction tweens, clearer controls and five new shared themes. Startup update detection also receives dedicated macOS feed freshness protection.

- Five shared themes: Oceanic, Copper Atelier, Aurora, Orchid Noir and Solar Dusk. Each colors the complete desktop surface system, browser bar and extension popup.
- Named theme preview tiles with visible selection and keyboard focus states.
- Workspace card spacing, rounded surfaces, session hierarchy, navigation feedback and form styling build on the existing desktop design.
- Short CSS hover, press and page-entry tweens add interaction feedback without new animation libraries, timers or DOM observers.
- Reduced-motion settings disable desktop transitions and animations, including the update spinner. Existing glow and gradient controls still apply.
- Normal app launch and reopening an existing app instance request automatic installation when a newer published version is detected.
- New palettes stay synchronized across desktop preferences, browser overlays and popup appearance.
- The dedicated macOS release feed now uses the same commit-pinned freshness lookup and cache-busting fallback as the normal feed. Platform feed cache entries cannot reuse another platform payload.

## PlazCode 1.19.15: Create models and UI directly in chat

- Asking an active RobloxScript AI chat to make a model or UI uses PlazCode's saved creator workflow. The desktop creator page does not need to be opened.
- The AI saves shape/layout and detail passes with creation_preview, then calls creation_insert with the exact ready draft revision for Studio creation requests.
- Insertion reads the saved blueprint rather than recreating it in Luau. Geometry, hierarchy and supported properties use the same validated compiler.
- Preview-only/draft-only requests stay out of Studio. The desktop Create preview flow remains preview-only. Existing script repairs and AgentScript retain their normal tools.
- Duplicate insertion calls retain their outcome; stale drafts, concurrent insertion, Stop, chat/engine changes and unconfirmed Studio results are handled explicitly. Finished/uncertain passes require inspection before retrying.
- Saved root-parent and absent-name normalization is repaired in the chat insertion path without changing the stored draft.

This extension-only update retains the signed 1.19.14 Windows/macOS native components. Studio rendering can differ from the creator preview; data parity does not promise pixel-identical lighting, materials, fonts or advanced layouts. Live signed-in AI chats and real Studio insertion remain unverified.

- Each GitHub release offers PlazCode-VERSION.zip for Windows and PlazCode-macOS-VERSION.zip for Mac. The normal package retains compatibility with older shared-feed Mac updaters. Mac setup/start launchers select latest-macos.json and preserve custom feed settings.

Reload the extension AND refresh open AI tabs after updating.

## PlazCode 1.19.14: Creators, native macOS and launch updates

### Model and UI creators

- A compact prompt row, Preview/Blueprint tabs, export/insert controls above the preview, and an "Ask for a change…" row below it.
- Models: Realistic, Low poly, Cartoon and Blocky styles; shape/detail passes; part colour/material edits; undo; recolour; resize; ground alignment; optional welded insertion; .rbxmx and preview PNG export.
- UI: Phone/Tablet/PC preview, list/grid layout support, gradients, readability/tap-target checks and optional hover/click/panel animations.
- Saved drafts and explicit likes/improvement notes inform later creation prompts. Revisions target stable node IDs instead of replacing the complete build.
- Use an active RobloxScript chat to Generate, revise or Insert. AgentScript remains available for ordinary project work. Draft previews do not modify Studio until you choose Insert.

### Desktop updates and macOS

- Desktop launch checks quietly and installs the latest complete release directly when outdated. The app shows progress for the actual download/install; extension reload and chat-tab refresh remain manual.
- A native universal macOS app supports Apple Silicon and Intel. macOS launchers, StudioMCP discovery, startup locking and file/browser opening have platform-specific handling.
- Creator drafts join settings, memory, templates and MCP configuration outside the replaceable installation. Corrupt creator libraries are reported rather than overwritten.

### Scope and validation

Creation uses the current browser AI, with bounded completed build passes rather than token-by-token rendering. Advanced UI layouts, live Studio appearance and reference fidelity still require Studio review. The Mac app is ad-hoc signed, not Developer ID notarized; first-launch approval may be required. Native automated tests do not establish live signed-in AI-site, desktop GUI or Roblox Studio compatibility.

After updating, reload the extension AND refresh open AI tabs.

## PlazCode 1.19.13: Stable mode switching and manual work folding

- Completed Working/Worked sections retain your chosen expanded or folded state. Click their heading to fold or reopen them manually.
- Storage and message notifications for the same script-mode change no longer reset the connection twice. Retired sockets are detached before reconnecting, and stale startup settings cannot reverse a recent manual choice.
- Double-clicking a mode segment no longer cycles back. Transitional disconnected status is held behind the Switching message until the new connection settles.
- Arena has no custom Working/Worked foldout; its replies and tool execution remain available. ChatGPT and Notion exclusions remain unchanged.
- Claude hides single command frames including CodeMirror content and language-label paragraphs, preserving narration, ordinary code, thinking and message actions.

Reload the extension AND refresh open AI tabs after updating. Saved settings, memory, templates and MCP configuration remain preserved.

## PlazCode 1.19.12: Consistent package versions and current release checks

- Sidebar, title, Settings and Updates display the same installed package version. An independently versioned app binary no longer produces a contradictory outdated badge.
- BAT update checks request uncached current release metadata. Both update paths select the latest complete package directly, including across multiple skipped releases.
- Native build and extension are both 1.19.12 in this package. Existing settings, memory, templates and MCP configuration remain preserved.
- BRANDING-NOTICE.txt identifies the official repository/release channel and distinguishes unofficial modified distributions. Existing GPL and third-party licenses remain unchanged. This notice and update SHA256 verification do not prevent copying or modification.

Reload the extension AND refresh open AI tabs after updating.

## PlazCode 1.19.11: Urgent tool-result loop fix

- Fixed `toSend is not defined`, which interrupted normal tool-result delivery after a command executed.
- Outgoing feedback is initialized directly from the completed result. Successful results, formatted errors and screenshots retain their send path and changed-memory context.
- Periodic command-list reminders remain disabled. Existing repeated-failure pause, startup, Stop and recovery behavior remain intact.
- Extension-only hotfix: the native executable remains the unchanged 1.19.10 binary; no Rust/agent rebuild was required.

Reload the extension AND refresh open AI tabs after updating. Settings, memory, templates and MCP configuration remain preserved. Do not assume a command was undone because the old result-delivery error appeared; inspect its result/project state before repeating a mutation.

## PlazCode 1.19.10: Notion startup status and meaningful chat continuation

- Startup command outcomes survive Notion settling under a replacement event anchor. Matching stays scoped to the conversation, original assistant position, preceding user message and command text; later identical commands remain distinct.
- Bootstrap identity is captured before card rendering, and restored completed/error outcomes also prevent re-dispatch.
- Notion result attachments use `plazcode_tool_result_*.txt` and tell the AI to continue the existing handshake or task. The second attachment is the command result, not a second startup.
- New-chat continuation is offered only for chats with real user requests or pending follow-ups. Startup-only records, including legacy exports, are excluded.

Reload the extension AND refresh open AI tabs after updating. Saved settings, memory, templates and enabled MCP servers remain preserved.

## PlazCode 1.19.09: Normal chat flow and targeted command recovery

- Normal replies release the composer before checkpoint bookkeeping. Notion retains its pre-send response identity; stale/duplicate send callbacks cannot start another loop.
- Idle Co-work messages use the site’s normal composer/send path, matching Co-work Off. Active follow-ups keep their existing queue and safe-boundary delivery.
- Removed periodic command-list reminders, full-prompt riders and idle reminder sends. Changed memory context remains supported.
- Explicit command-access refusal triggers a connected-engine check and one same-chat restart handshake, then resumes the unfinished request. Stop, changed chat/engine, disconnected engine and unsent drafts prevent recovery. A repeated refusal stops rather than repeatedly restarting.
- Delayed injection cleanup cannot clear a newer send, and stale cover requests cannot block an idle composer.
- Display versions use 1.19.09, 1.19.10 … 1.19.99, then 1.20.00. Internal Chrome/native versions remain 1.19.9, 1.19.10 … 1.20.0 for valid update comparisons.

Reload the extension AND refresh open AI tabs after updating. Settings, memory, templates and enabled MCP servers retain their preservation rules.

## PlazCode 1.18.109: Stable startup and session reminders

- Automatic context reminders preserve the active task and follow-ups. They no longer reissue the startup handshake, request a readiness reply or wait for a new first request. This applies to both engines and both reminder paths.
- Startup list_commands is recorded before execution and its confirmed result survives message replacements, preventing stale “not run” cards and watchdog replay.
- Notion uses its stable transcript row to identify commands. Pending navigation startup is cleared on composer preparation or an active session; delayed requests check again before starting.
- Duplicate Start on an already-started populated chat is harmless. Explicit Restart and fresh-chat startup remain available.
- Working/Worked progress circles continue to reflect explicit assistant Plan/Checklist steps; unknown totals animate. Custom grouping remains disabled for Notion and ChatGPT.

Reload the extension AND refresh open AI tabs after updating. Saved settings, memory, templates and enabled MCP servers retain their existing preservation rules.

## PlazCode 1.18.108: Work indicators and Notion startup controls

- Removes the empty bordered bar beneath expanded Working/Worked headings. Waiting text clears when a real reply arrives.
- Disables custom browser chat foldouts and bar work indicators on Notion and ChatGPT; other supported sites keep them.
- Working circles fill with explicit assistant Plan/Checklist checkbox progress. Unknown totals stay animated, successful completion fills the ring, and interrupted work keeps its partial state.
- Notion startup locks input before composer preparation, guards typing/paste/drop/Send across remounts, and covers a bounded composer card. Internal writes, copy, navigation and Stop remain available.
- Protocol upload no longer opens Notion’s general plus menu. Existing file-input/direct-drop upload, exact content, single-send confirmation and owned cleanup remain required.

Reload the extension AND refresh open AI tabs after updating.

## PlazCode 1.18.107: Visible paused work and accurate Co-work state

- Interrupted, stopped and budget-paused work stays expanded, so replies remain visible. Completed work still folds and can be reopened; ChatGPT keeps its native presentation.
- Work messages only fold when their expandable heading is successfully mounted. Missing or failed headings leave the original messages visible, and temporary mount failures retry.
- Co-work Off hides the empty queue panel and stale Paused/Resume buttons. Stop does not pause an empty disabled queue; real pending requests remain saved and reviewable.
- The Notion startup provider confirmed working by the user is unchanged. All other provider files are also unchanged.

Reload the extension AND refresh open AI tabs after updating.

## PlazCode 1.18.106: Notion uploaded-file preview recognition

- Fixes the supplied visible-file timeout: Notion protocol cards may be siblings of the smaller editor/send frame or show a shortened filename. Attachment inspection now stays within the bounded composer shell and recognizes those labels.
- Upload readiness waits for busy indicators on detected file cards. Stop cleanup supports the owned card’s Close or small unlabeled icon button.
- Complete protocol text, one acknowledged send, preserved foreign drafts and exact-name delayed cleanup remain required. ChatGPT, Claude and DeepSeek providers are unchanged.

Reload the extension AND refresh open AI tabs. Remove any old failed-upload card before retrying. Live signed-in Notion startup remains unverified.

## PlazCode 1.18.105: Notion upload and Claude command cards

- Fixes the reported startup crash: Notion page drag handlers could not see transfer types/files on generic events dispatched by the extension. Upload fallback now uses native DragEvent fields.
- Ends the drop sequence with dragleave so the site can reset its drag overlay and cursor.
- Claude hides the empty JSON label/border around a tool command, preserving adjacent narration, thinking, normal code and response actions.
- Full protocol files, confirmed uploads, one acknowledged send, Stop cleanup and existing draft preservation remain unchanged.

Reload the extension AND refresh all open AI tabs. Live Notion startup remains unverified; this release fixes the specific supplied drag-event exception.

## PlazCode 1.18.104: Animated installer and Notion protocol files

- A rounded dark installer window with PlazCode orange gradients, an animated shimmer and swirl, stage text and real file-copy progress.
- The installer UI runs on its own STA message loop so download, verification, backup, extraction and process waits cannot freeze its animation. File replacement progress advances from actual completed file counts.
- Notion long protocol messages use one named .txt file containing the complete original text, plus a short native composer instruction. Upload readiness and one confirmed send are required; text is not truncated.
- Notion no longer retries a 33k+ text paste that the site converts into a Pasted text attachment. Existing draft attachments are preserved and receive a specific fresh-chat/remove-draft explanation. Stopped owned uploads are cleaned up.
- Short protocol messages retain the native composer path. Saved settings, MCP configuration, memory, templates, installation process scope, checksums and rollback behavior are preserved.

The refreshed helper window is used after this version is installed; the already-installed old helper can still appear during the update to 1.18.104. Notion remains experimental until live startup is confirmed. Open a fresh Notion AI chat if old Pasted text draft cards remain. Reload the extension AND refresh existing AI tabs after updating.

## PlazCode 1.18.103: Notion controlled paste and Co-work

- Notion sends complete startup and tool-result text through one literal controlled paste transaction, verifies retention through two renders, and commits at most once. No prompt truncation or repeated tiny inserts.
- Co-work uses Follow up in the native composer while enabled, including idle time and after Stop. Internal startup/tool injection retains its temporary input mask. Turning Co-work off restores the original placeholder.
- Notion no longer uses bulk execCommand or direct React-owned DOM replacement as the large-send fallback. Short native edits rely on Chromium input events instead of duplicate synthetic model events.
- Notion input cover targets only the editable, preventing a growing ancestor from becoming the click-blocking mask. Start on a populated AI landing first opens a fresh chat.

Notion remains experimental: simulated model/DOM tests cannot confirm live Notion behavior. After updating, reload the extension AND refresh all open AI tabs.

## PlazCode 1.18.102: Updates, Stop, Notion and Co-work

- The default GitHub updater checks the current repository revision every two seconds and fetches metadata by immutable commit. Unchanged metadata is reused; quiet automatic checks and the eight-second request budget remain. Custom feeds retain their configured path. Network delays and browser suspension still apply; this is not guaranteed instant push.
- Notion large startup drafts use one complete native beforeinput/insertText/input write instead of chunked clipboard pastes. Editable/readonly attributes are temporarily restored during the write, focus is acquired after unlocking, and the complete draft must survive two renders before Send.
- Co-work tracks placeholder nodes introduced by composer remounts, and ChatGPT Work literal placeholder labels display Follow up without changing user text or replacing the native input.
- Stop releases the composer immediately and prevents late work from restoring the Agent is working cover until a new user action resumes work. Tool cancellation and Safe/Immediate semantics remain unchanged.
- PlazCode Working/Worked transcript summaries and bar disclosure are disabled on ChatGPT. Activity records remain available to desktop; other providers retain their collapsible groups.
- Default update checks avoid the cached mutable branch feed when current revision discovery succeeds. Older cached metadata cannot replace a newer known release.

Notion remains experimental. Native draft checks and placeholder/group tests use simulated DOMs; live Notion startup still needs confirmation.

After updating, reload the extension AND refresh every existing AI tab.

## PlazCode 1.18.101: Notion startup and engine switching

- All Notion literal pastes, including startup chunks, use escaped code HTML to avoid rich-text Markdown conversion. Complete normalized text must be retained before Send; sampled near-match acceptance is removed.
- The browser bar shows Switching while AgentScript/RobloxScript reconnects, disables Start, ignores old-engine status and restores actual health on completion or after an eight-second bound.
- A rejected retained large paste no longer falls into repeated tiny inserts and full rewrites. One initial empty hydration rejection may retry; partial failures stop without sending.
- Intentional engine reconnection does not flash a bridge-down banner. A genuine failure remains visible after the transition timeout.

Notion remains experimental. Tests use simulated rich-text imports and provider DOMs; live Notion startup still needs confirmation.

After updating, reload the extension AND refresh every existing AI tab.

## PlazCode 1.18.100: Browser bar startup and placement fix

- Fixed the 1.18.99 shared UI initialization order. When a composer already existed, placeholder state was read before initialization and startup aborted, leaving the bar missing or unpositioned. This affects multiple providers and Chromium browsers.
- ChatGPT anchors to the actual bounded composer card, rather than a full-page form or its inner text scroller. Existing DeepSeek/Claude/Notion placement rules are preserved.
- Desktop browser status now reports bar visible, bar hidden or refresh AI tab separately from bridge connectivity. A worker connection alone does not establish that the page UI loaded.
- Full content-script startup tests cover preloaded ChatGPT, DeepSeek, Claude and Notion composers. Native Co-work and Stop behavior are preserved. Live tester layouts still require confirmation.

After updating, reload the extension in chrome://extensions or edge://extensions AND refresh existing AI tabs.

## PlazCode 1.18.99: Native Co-work, continuation and reliability

- Co-work uses the existing ChatGPT, Claude, DeepSeek and Notion composer. While work is active, its placeholder becomes **Follow up**. Requests are accepted immediately and delivered at the next safe AI message boundary. Native Stop keeps its role. Unsent drafts are protected during tool feedback.
- Notion long startup/results use bounded, verified paste chunks rather than repeatedly pasting a large prompt as a text-file attachment. Startup still requires the list/ready acknowledgement; failed delivery stays stopped.
- New chats can offer **Yes, continue.** or **No, I wanna start a new project.** Context is loaded only after successful startup. Captured history is bounded to 2,000 messages / 800,000 text bytes per chat, 20 chats / 8 MB total; continuation is a shorter excerpt and can omit unloaded messages. Inspect current state before resuming uncertain actions.
- Shared command/time budgets pause before the next command; zero disables a limit. Export continuation or explicitly resume a paused task. Automatic Studio visual checks are bounded, optional and do not prove runtime correctness.
- Restore an individual captured local file or Studio script in Tasks. Restoration checks current contents first and refuses conflicting later edits. Studio script snapshots cover direct multi_edit/script_set_source edits in Edit mode and the same bridge session; arbitrary Luau mutations are not selectively restored.
- The extension toolbar popup now follows the desktop/bar palette, glow and gradient settings.
- Each update now creates a GitHub Release with both ZIPs and change notes.

Update in the desktop Updates tab or run Update-PlazCode.bat, then reload the extension and refresh AI tabs. Automated checks and the Windows build are verified; live Windows/Studio and live provider behavior still need target-machine confirmation.

## PlazCode 1.18.98: Cancellation settling guard

Includes all 1.18.97 features below. Keeps Immediate Stop latched while an interrupted tool is settling and blocks further tool dispatch during that interval. Safe Stop waits for the current tool step. Reload the extension and refresh AI tabs.

## PlazCode 1.18.97: Tray access, stop modes and cleaner work sessions

- Reopen the desktop app using its Windows tray icon. Right-click for Open or Quit. If tray registration fails, the app remains in the taskbar.
- **Immediate Stop is the default.** It stops generation and new actions, abandons tool waits, signals the active checkpoint, and cleans up command/helper processes owned by that operation. Partial changes can remain; external tools may not honor interruption. Inspect state before retrying.
- **Safe Stop** stops generation and new actions, then waits for the current tool step. The mode syncs between desktop and browser settings. Neither mode is an undo guarantee.
- Send images and video with a caption from desktop or the browser bar. Use native video when the selected site accepts it, or up to eight sampled frames. Frames do not include audio or continuous motion. Transfer limits are eight files / 12 MB; local conversion inputs are limited to 64 MB. Browser decoding is used first; an installed FFmpeg/FFprobe can handle additional codecs. Not every format or site is supported.
- Co-work preserves all unfinished goals and can interleave independent tasks at safe message boundaries. It does not create simultaneous AI reply streams.
- Work remains expanded while active and folds after finishing. ChatGPT action controls fold with their messages. Empty no-tools-used filler is removed, and live engine checks guard correction of false offline claims.

Update from the Updates tab or Update-PlazCode.bat, reload the extension, and refresh open AI tabs. Existing settings, memory and enabled MCP servers retain their data locations. Windows builds and automated checks are verified; live Windows tray behavior and live provider uploads still require testing on the target machine.

## PlazCode 1.18.96: Faster automatic release checks

Automatic update checks reuse HTTP connections instead of reopening them for
every check. A stalled automatic request times out after eight seconds and retries
in the background. Manual checks keep their 30-second timeout; download handling
and quiet background UI are preserved. GitHub propagation and network delays
still apply: this remains polling, not guaranteed instant push notifications.

Update with the desktop Updates tab or Update-PlazCode.bat. Reload the extension
and refresh open AI tabs afterwards. The corrected PlazCode/PlazCode-Extension
folder layout and desktop-only Tasks from 1.18.95 are retained.

## PlazCode 1.18.95: Separate app and browser extension folders

The main folder is PlazCode. Run PlazCode.exe there. In Chrome Load unpacked,
select PlazCode/PlazCode-Extension, which contains only the browser files.
The launcher, updater and desktop app stay in the main PlazCode folder.
Tasks is now desktop-only; its expandable header uses a clickable hand cursor.

Existing installations keep their current outer folder path. The automatic
update includes legacy extension copies for compatibility, so your currently
loaded extension keeps working. You can keep loading that existing folder;
new installations should select the nested PlazCode-Extension folder. Changing
Chrome's loaded folder creates a separate extension installation and may require
restoring browser-only preferences. Native settings, memory and enabled MCP
servers stay in their existing data locations. Reload the extension and refresh
open AI tabs after updating. No installation folders are renamed automatically.

## PlazCode 1.18.94: Studio MCP compatibility and clearer extension folder

PlazCode discovers Studio IDs for the updated Roblox MCP tools, while keeping local bridge startup independent of Studio readiness. Fresh-install ZIPs use PlazCode-Extension.

- Automatically supply studio_id for targeted Studio tools when one instance is connected. Cache discovery briefly, preserve explicit caller IDs, and require a deliberate selection when multiple instances are open. Older schemas are forwarded unchanged.
- Fresh installations extract into PlazCode-Extension. Update packages preserve the layout older updaters accept, and the updated installer accepts either single-root layout without changing the installed folder.
- The internal get_studio_state connection probe now receives studio_id when required. Missing IDs no longer prevent automatic Studio connection after the new MCP update.
- Studio auto-connect attempts have an eight-second bound and retry in the background; local bridge endpoints are bound before the desktop opens. Timed-out discovery never dispatches the requested Studio command.

Fresh installation: extract PlazCode-1.18.94.zip and select PlazCode-Extension with Chrome Load unpacked. Existing installations: use the Updates tab or Update-PlazCode.bat, then reload the extension and refresh AI tabs. Existing settings and folder paths remain intact.

## PlazCode 1.18.93: Shared themes, larger memory and quieter updates

- Desktop palette, glow and gradient settings sync through shared preferences to the browser bar, menus, controls and activity panels. Selections persist across restarts and updates; legacy browser themes map back to desktop palettes. Existing unsynced appearance is migrated without forcing a reset.

- Saved memory supports 150,000 characters total, with a capacity display, larger note fields and transactional storage limits. Long notes have previews and paged AI reads instead of being omitted or flooding startup prompts. Memory-only backups can load saved notes without sending an old conversation to the AI.

- Notion tool results paste as literal HTML code instead of Markdown-like rich text. Failed writes have wall-clock retry limits, preventing hundreds of timer-throttled chunk attempts. A failed draft is cleared only when it still matches the locked composer content captured by that send attempt.

DeepSeek’s desktop AI picker description now reads: Recommended for free users. Fast and reliable.

- Release checks run every two seconds, and desktop/browser status reads every second. The default GitHub cache key uses two-second buckets; network and publication delays still apply. This is polling, not guaranteed instant push.
- Automatic checks do not show Checking for updates… or disable the manual check/install buttons. Manual requests wait for an ongoing background read instead of racing it.

## PlazCode 1.18.92: Tasks close button and live Co-work follow-ups

Close Tasks reliably and send follow-ups during agent work without waiting for the entire task to finish.

- Co-work delivers new requests alongside the next tool result or continuation, preserving the current task and the order of follow-ups. Streaming responses and running commands are not interrupted.
- Follow-up status confirms receipt and explains delivery at the next safe message boundary. Unconfirmed sends remain paused for review rather than being blindly retried.
- Tasks has a dedicated sticky header and accessible close button, separated from content, with explicit button type and click handling.

# PlazCode — Roblox Studio + AgentScript AI agent

Turn any major AI chat (**DeepSeek, ChatGPT, Google Gemini, Kimi, GLM, Qwen, Arena, Crax GPT, or Ollama running locally**) into an autonomous development agent. Three switchable engines:

| Engine | Toggle | Target | Port |
|---|---|---|---|
| **Roblox** (RS) | — | Roblox Studio via its built-in MCP server | ws://127.0.0.1:17613 |
| **AgentScript** (AS) | — | A local project folder — files + terminal | ws://127.0.0.1:17615 |
| **Animation** (AN) | — | Roblox Studio scoped to the motion workflow | ws://127.0.0.1:17613 |

Describe what you want in plain English and the AI builds instances, writes Luau/code files, sculpts terrain, tunes lighting, generates UI, runs builds and tests, and audits your project — inside Studio or directly on disk.

No API keys, no monthly fees. Chromium browsers (Chrome, Brave, Edge, Thorium). The extension and desktop app use the same dark navy + warm gold PlazCode theme.

---

## Engines

- The bar above every supported chat composer carries a segmented **RS / AS / AN** toggle. Switching engines wipes tool caches so commands cannot cross engines.
- **RS** drives Roblox Studio through StudioMCP (stdio JSON-RPC spawned by `plazcode-agent`).
- **AS** gives the AI full control of ONE local folder ("the workspace") through native Rust tools — sandboxed paths, exact-match diff editing, glob/content search, and terminal execution with hard timeouts.
- **AN** rides the same Roblox bridge as RS but steers the system prompt into the animation_* workflow.

Large `execute_luau` scripts are auto-chunked around 24 KB so Studio's parser never hits the ~64 KB wall. Each chunk is still one NDJSON/JSON-RPC line.

---

## Setup

1. Open `chrome://extensions` → Developer mode → **Load unpacked** → this folder (`manifest.json`).
2. Double-click **`PlazCode.exe`**. `PlazCode.exe --headless` runs without the desktop window. It starts:
   - HTTP API on `http://127.0.0.1:3000`
   - WS bridges on `17613` (RS/AN) and `17615` (AS)
   - Workspace folder for AgentScript (`PLAZCODE_WORKSPACE_ROOT` / `--workspace` / `%USERPROFILE%\PlazCodeWorkspace`)
3. **RS/AN:** Roblox Studio → Assistant AI → ⋯ → Manage MCP Servers → Enable Studio as MCP Server.
4. Open a supported chat and click **Start agent**.

---

## Agent

- Native crate: `agent/` (`plazcode-agent` 1.18.86). Desktop control center, MCP helper spawn, outbound WS channel so ping/status keep flowing during a 20 s `execute_luau`.
- Service worker skips stale-socket reconnect and MCP heal while a `call_tool` is in flight (the 25 s stale window used to kill long tools).
- 30 Studio skills, a 24-command animation suite, AgentScript file/terminal tools.
- Personas (Builder / Scripter / Animator / Fixer), Extra Thinking, Forge GUI, Image → Model, auto-fix playtest errors.

---

## Testing

```bash
node test-skills.js
node test-parser.js
node test-chatgpt.js
node test-animlib.js
node test-v111.js
node test-v112.js
node --check core/main.js && node --check core/config.js && node --check background.js
cd agent && cargo test
```

`test-bridges.js` is a live smoke test: start `PlazCode.exe` first. It checks HTTP `:3000` and WS `17613` / `17615` (no Unreal port).

## Privacy

Everything runs locally. The extension talks only to `127.0.0.1`. No telemetry. AgentScript stays inside the workspace root unless you flip FULL ACCESS.

Optional MCP runtimes are downloaded on first use if no installed runtime is found. They are cached under %LOCALAPPDATA%\PlazCode\runtimes and reused across app updates. The release ZIP contains no Node.js/npm/uv bundle. First use requires internet access.

## Release history

### PlazCode 1.18.91: Desktop work details and responsive status

Expanded desktop work details now show AI replies and commands, with cleaner Home spacing, accurate icons and faster automatic update detection.

- Templates now use Choose a Roblox file and Add template, with short numbered directions. Advanced script search is optional and collapsed.
- Desktop template imports support Roblox files up to 128 MB using direct binary uploads, avoiding base64 copies. Browser imports remain limited to 32 MB; script-index bounds still apply.
- Memory transfer separates Save to a file from Load into another chat, explains saved notes versus messages, and uses clear create/download/load buttons.

- **Added:** Desktop Working/Worked details show AI replies, command text and results from the selected browser chat, loaded only while the panel is open.
- **Improved:** Automatic release checks run every five seconds, with desktop/browser status propagation every two seconds. The default GitHub feed uses a five-second cache key; network/cache delays can still apply. Checks do not overlap.
- **Improved:** DeepSeek and Claude shortcuts use vector logos from the supplied references. Tools uses the supplied icon, and Settings has a symmetric centered gear.
- **Fixed:** Task checkpoints & workflows has a clear gap below the Home cards; the Working panel also has consistent spacing.
- **Fixed:** Expanded work details preserve unchanged content and scrolling across refreshes, collapse once on completion and remain reopenable. Retention is bounded; oversized/older omitted details receive an explicit notice.
- **Fixed:** The updater swirl rotates normally and uses a slower continuous rotation when reduced motion is enabled, instead of freezing.

### PlazCode 1.18.90: Grouped replies and extension status

Task replies and commands collapse together, with extension status under the bar name and a corrected ChatGPT shortcut logo.

- **Added:** The browser bar shows its installed extension version below PlazCode, with green (Up to date), red (Outdated - New update available), or a neutral unavailable/unchecked status.
- **Improved:** The desktop ChatGPT shortcut uses a vector logo traced from the supplied reference instead of a circle character. Its existing browser-opening action is preserved.
- **Fixed:** Working/Worked now includes task prose, final responses, command cards and injected results. Completed groups collapse together and reopen on click. Startup, list_commands/list_tools and PlazCode is ready. remain outside; user requests remain visible.
- **Fixed:** Activity identity survives streaming text changes and transcript remounts, and remains scoped to the chat.

- **Added:** ChatGPT: Highly intelligent in all aspects. DeepSeek: Recommended for free users. Claude: Expert at scripting and game development. Each description appears below its name and above Open in browser.

- The updater explicitly preserves native settings, MCP configuration/enabled servers, memory, pairing, templates, update source and WebView user data, even if a package contains saved-data files.
- The Tools page includes both engine skill libraries, imported Studio helpers, asset_bridge_import and developer-product tools with descriptions.
- Working/Worked uses a centered vector chevron that points right when collapsed and rotates down when expanded.

### PlazCode 1.18.89: Home engine switch

Switch between RobloxScript and AgentScript directly above Start Agent on the desktop Home page.

#### Added

- A themed, keyboard-accessible RobloxScript / AgentScript button group under the active AI status and above Start Agent. The selected engine is highlighted.

#### Improved

- The Home buttons use the existing saved engine preference and browser synchronization, and stay synchronized with the Settings engine selector. Repeated clicks are disabled while saving.

#### Fixed

- Start Agent is temporarily disabled while the engine change is saving or the selected browser chat still reports a different engine, preventing a start on the previous engine.

### PlazCode 1.18.88: Automatic template references

Import Roblox place/model files and let PlazCode find relevant reference systems automatically before a task’s first tool call.

#### Added

- Templates tab in the desktop app and a Template library inside browser Tasks. Import .rbxl, .rbxlx, .rbxm and .rbxmx files up to 32 MB, add a systems description, browse/read scripts and remove saved references.
- Automatic matching uses cached script paths, identifiers and template descriptions. Up to three bounded excerpts are supplied before the first agent tool executes; no explicit “reference this template” request is required.
- Read-only plazcode_templates tools support explicit matching, script lists and paged source reading. Duplicate script paths have separate IDs.
- Open in Studio explicitly opens the retained original through the Windows Roblox file association; select the desired Studio session in PlazCode afterwards.

#### Improved

- Template code is reference data, not executable instructions. Existing project conventions take priority. Matching is a relevance hint rather than guaranteed semantic understanding.
- Template files/indexes persist in your private app data, survive updates and are excluded from distribution ZIPs. Source indexes and excerpts have explicit size limits to avoid flooding long chats.

#### Fixed

- Malformed, unsupported and source-free files report clear import errors. Missing scripts in copied/decompiled games are not fabricated or recovered. Binary and XML imports preserve the original file bytes.

### PlazCode 1.18.87: Task checkpoints, project memory & reliable tools

Review and recover agent tasks, keep project facts separate, and reduce repeated tool errors and long-chat overhead.

#### Added

- Tasks panel in the desktop Home page and browser bar: bounded task history, file before/after previews, conflict-checked Revert and resume in the original chat.
- AgentScript file checkpoints persist across app restarts. Studio Revert is offered only when exact undo records are confirmed in the current bridge/Studio session. Unsupported operations disable whole-task automatic restore.
- Protected paths with explicit task approval; project memory scopes shared by named projects; reusable built-in and custom workflows.

#### Improved

- Long-chat activity retains at most 60 groups, builds collapsed details only when expanded, ignores its own UI mutations and caches unchanged export text. Retention overflow produces an explicit export error.
- Automatic release checks run on launch and every minute; returning to an AI tab or desktop window triggers a throttled check. Update labels refresh without pressing Check now. Network/cache delays can still apply.

#### Fixed

- Tool preflight checks JSON argument shapes against available schemas, detects incomplete Luau strings/delimiters and preserves datamodel defaults. Three consecutive malformed replies or execution failures pause the agent.
- Studio mutation commands are not blindly replayed after a dropped helper connection; uncertain results require inspecting Studio before retrying.
- Unchanged memory and release snapshots no longer generate repeated storage broadcasts. Workflow delivery acknowledgements are deduplicated.

### PlazCode 1.18.86: Reliable bridge port startup

Agent launch reserves every bridge endpoint before reporting ready and serializes overlapping launches.

#### Improvements

- Windows startup is serialized across PlazCode launches; an existing instance of the same version is focused, and older versions are replaced.
- All three required bridge listeners are bound before background services start. Port release is checked with bounded retries instead of fixed delays.

#### Bug fixes

- Removed broad process-name cleanup that could kill another launching PlazCode instance. Recovery only targets a PlazCode process holding a required port.
- Port ownership uses exact endpoint matching, avoiding matches such as port 30000 when checking 3000.
- Startup errors now identify the actual blocked port and, when available, its owning process instead of the generic bridge-bind dialog. Legacy listener failures are logged.

### PlazCode 1.18.85: Wait for app shutdown before updating

The updater waits for PlazCode to exit and release its executable before installing.

#### Improvements

- The updater checks both app executable paths, waits for stopped processes to exit, and briefly retries file-lock checks. Only processes from the selected installation are stopped; Roblox Studio is left running.

#### Bug fixes

- Update installation no longer starts copying immediately after Stop-Process. If the executable remains locked, it aborts before copying any update files and retains recovery files.

### PlazCode 1.18.84: Clickable palettes & friendly readiness

Select desktop themes directly from their color swatches, and keep Notion startup acknowledgements readable.

#### New additions

- Desktop startup instructions accept up to 25,000 characters, with an input counter and explicit save validation.

#### Improvements

- All six desktop color swatches are clickable, keyboard accessible, show the selected theme and use the same saved appearance settings as the dropdown. Glow and gradient preferences are preserved.
- Chat export retains messages captured while scrolling during the current page session. Idle Notion exports briefly load older history and restore the previous scroll position. Exports report their captured message count and remaining scope limitations.
- Download export is styled as a theme-colored button in desktop and browser memory settings.

#### Bug fixes

- All startup instruction variants explicitly request “PlazCode is ready.” instead of a generic readiness sentence.
- If Notion still returns the legacy PLAZCODE_READY token from earlier chat context, its visible acknowledgement is normalized to “PlazCode is ready.” without resending startup or modifying Notion-owned DOM.
- DeepSeek rich-text composers remain discoverable while input-locked, and agent writes temporarily enable editing then restore the lock. Explicit Send labels take precedence over stop-icon guesses.

### PlazCode 1.18.83: Clearer update indicators

Outdated version badges now explicitly say that a new update is available.

#### Improvements

- Desktop, browser bar and popup version badges show “(Outdated - New update available)” when a newer published version is detected. Red highlighting and existing current/unavailable states are preserved.

### PlazCode 1.18.82: Desktop overhaul & smoother Notion sessions

A redesigned desktop workspace, complete color themes and a polished animated updater, with focused Notion and Co-Work improvements.

#### New additions

- A distinct desktop layout: compact navigation, a dedicated agent-session card, AI launch cards, a slim connection strip, and redesigned Tools, MCP, Settings, Terminal and Updates surfaces.
- Animated SVG update swirl with layered rotating arcs, a pulsing center and a redesigned progress dialog. Reduced-motion preferences are respected.
- Expandable Working/Worked summaries in the chat show elapsed time and tool activity; completed details collapse automatically and reopen on click.

#### Improvements

- Themes now color panels, navigation, borders, inputs, buttons, connection surfaces, terminal and update dialogs as well as accents.
- Startup asks the AI to say “PlazCode is ready.”; older readiness acknowledgements remain accepted.
- Co-Work follow-up text uses the website composer’s text color, font, size and alignment. Only the placeholder is grey. Existing queue behavior is preserved.
- Copilot and Meta AI removed from supported-site choices, routing and extension injection.

#### Bug fixes

- Notion can settle a stable readiness acknowledgement without waiting through its nine-second generation tail; live Stop or workflow progress still blocks completion.
- Notion pastes an escaped literal HTML representation alongside plain text so rich-text Markdown conversion does not consume command/result markers. Complete-draft retention and send-confirmation checks remain in place.
- Notion reserves space inside the composer for the PlazCode bar, keeping response text and the native editor clear without modifying React-owned attributes.

### PlazCode 1.18.81: Themes, release notes & desktop refresh

See what each PlazCode update adds, improves and fixes before installing it.

#### New additions

- Release descriptions on the desktop Updates page, including expandable notes for earlier releases.
- The GitHub README now lists release titles, summaries, additions, improvements and fixes.
- An updated maintenance prompt documents architecture, current features, debugging, tests, builds and release publishing.
- Appearance settings with Orange, Amethyst, Polar Cyan, Rose, Emerald and Graphite palettes, glow strength, gradient controls and a default-theme reset. Selections apply immediately and are remembered on this device.
- Version indicators in the desktop, browser bar/menu and extension popup show green “Up to date”, red “Outdated”, or a neutral unavailable/not-checked status. Release checks run at startup and every five minutes.

#### Improvements

- Published update metadata carries the same release notes used in the README.
- Installed release notes remain available before checking online.
- Home places agent controls beside the AI shortcuts on wide windows, reducing unused space; smaller windows stack them neatly.
- The installed-to-latest version arrow is larger, vertically aligned with the version values and spaced more closely.
- Visual-only desktop polish: smoother navigation, card depth, hover and press feedback, keyboard focus, toggles and modal backgrounds. Existing actions and workflows stay the same.
- Quick Actions no longer stretches to match a tall Recent Activity panel; activity stays scrollable.
- A denser desktop layout reduces empty space in status cards and quick actions, with refreshed typography, surfaces and subtle orange highlights.

### PlazCode 1.18.80: Updates, memory transfer & AI shortcuts

Update PlazCode from the desktop app and carry chat context between supported AI sites.

#### New additions

- Desktop Updates tab with installed/latest versions, Check now, Update now, download progress and relaunch.
- ChatGPT, DeepSeek and Claude shortcuts below Home’s connection displays.
- Current-chat memory export and a memory-only export option.

#### Improvements

- Transparent Enhance and Co-Work controls; labels now read Co-Work: Off and Co-Work: On.
- Styled desktop memory import file picker.
- Saved AI memories retain conversation origins after edits, including facts learned in more than one chat.

#### Bug fixes

- Memory-only imports now include saved facts in the destination AI’s context.
- Oversized combined history and memory are rejected before saving or sending.
- View on GitHub opens in the default browser instead of navigating the embedded app.

### PlazCode 1.18.78: Automatic update setup

A stable repository feed lets the update BAT fetch published packages.

#### New additions

- Configured HTTPS update feed hosted in stoveez/PlazCodeneww.

#### Improvements

- Version and SHA256 checks, staged installation, backups and local settings preservation.

#### Bug fixes

- Blank feed settings from 1.18.77 now fall back to the configured repository.

### PlazCode 1.18.77: Shared memory & activity

PlazCode can remember lasting preferences across chats and transfer loaded conversation context.

#### New additions

- Shared personal memory with automatic saving controls and an editable summary.
- Chat history and memory import/export.
- Working/Worked indicators with expandable activity.
- Studio status below the desktop bridge indicator.
- Update-PlazCode.bat with a local ZIP fallback.

#### Improvements

- Saved memory is available across supported provider chats.
- Completed tool activity collapses while final replies remain visible.

