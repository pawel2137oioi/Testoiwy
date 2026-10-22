// SPDX-License-Identifier: GPL-3.0-or-later
// Extension-owned ChatWave API view. Only authenticated native tool_calls are executable.
const RSProvider = (() => {
  'use strict';
  const $=id=>document.getElementById(id),chat=$('chat'),ed=$('chat-input'),form=$('chatForm'),send=$('sendBtn'),status=$('status');
  let key='',model='',session=null,tools=[],busy=false,locked=false,checking=false,error='',epoch=0,chatId=crypto.randomUUID(),requestId='',hooks=null;
  const nativeCalls=new WeakMap();
  const allItems=()=>Array.from(chat.querySelectorAll('.message'));
  const isUserItem=item=>item?.dataset.role==='user',isAssistantItem=item=>item?.dataset.role==='assistant';
  const assistants=()=>allItems().filter(isAssistantItem),lastAssistant=()=>assistants().at(-1)||null;
  const itemKey=item=>item?.dataset.messageId||null;
  const itemText=item=>item?.querySelector('.markdown')?.textContent||'';
  const setStatus=(text,failed=false)=>{status.textContent=text;status.dataset.error=String(failed);};
  function controls(){send.textContent=busy?'Zatrzymaj':'Wyślij';send.setAttribute('aria-label',busy?'Stop':'Send');$('newChat').disabled=busy||locked||checking;$('connect').disabled=busy||locked||checking;$('checkKey').disabled=busy||locked||checking;ed.readOnly=locked;}
  function rpc(message){return new Promise((resolve,reject)=>{chrome.runtime.sendMessage(message,value=>{if(chrome.runtime.lastError)reject(Error('Rozszerzenie nie odpowiedziało. Sprawdź ostatnią komendę przed ponownym połączeniem.'));else if(!value?.ok)reject(Error(value?.error||'Błąd połączenia ChatWave API.'));else resolve(value);});});}
  function row(role,text){const item=document.createElement('section');item.className='message';item.dataset.role=role;item.dataset.messageId=crypto.randomUUID();const body=document.createElement('div');body.className='markdown';body.textContent=text;item.append(body);chat.append(item);item.scrollIntoView?.({block:'end'});return item;}
  function cancel(){epoch++;if(requestId)void rpc({type:'chatwave-api',action:'cancel',requestId}).catch(()=>{});requestId='';busy=false;controls();}
  function reset(){cancel();chat.replaceChildren();chatId=crypto.randomUUID();error='';session=null;}
  function createSession(){
    session=PlazCodeChatWaveAPI.create({model,request:async body=>{
      requestId=crypto.randomUUID();const id=requestId;
      try{const value=await rpc({type:'chatwave-api',action:'completion',requestId:id,key,body});return value.data;}
      finally{if(requestId===id)requestId='';}
    }});session.setTools(tools);
  }
  function submit(text,options={}){
    if(!session||!key)throw Error('Wpisz lokalnie klucz ChatWave API i sprawdź połączenie.');
    if(busy)throw Error('Poprzednia odpowiedź jeszcze trwa.');
    if(error)throw Error(error);
    const ticket=epoch;row('user',String(text));ed.value='';busy=true;controls();
    void session.turn(String(text),options).then(result=>{
      if(ticket!==epoch)return;
      const item=row('assistant',result.call?JSON.stringify(result.call):result.text);
      if(result.call)nativeCalls.set(item,JSON.stringify(result.call));
      setStatus('Odpowiedź API odebrana.');
    }).catch(failure=>{
      if(ticket!==epoch)return;
      error=failure.message||String(failure);setStatus(error,true);
    }).finally(()=>{if(ticket===epoch){busy=false;controls();}});
    return true;
  }
  $('checkKey').addEventListener('click',async()=>{
    if(busy||locked||checking)return;
    const entered=$('apiKey').value.trim();if(entered)key=entered;$('apiKey').value='';
    if(!key){setStatus('Wpisz swój klucz z ChatWave → Settings → API keys.',true);return;}
    checking=true;controls();setStatus('Sprawdzam listę modeli…');
    try{const value=await rpc({type:'chatwave-api',action:'models',requestId:crypto.randomUUID(),key});
      const list=Array.isArray(value.data?.data)?value.data.data:[];const select=$('model');select.replaceChildren();
      for(const entry of list){if(typeof entry.id!=='string')continue;const option=document.createElement('option');option.value=entry.id;option.textContent=entry.id;select.append(option);}
      if(!select.options.length)throw Error('API nie zwróciło dostępnych modeli.');
      const preferred=[...select.options].find(o=>o.value==='claude-sonnet-5-5');if(preferred)select.value=preferred.value;
      $('connect').hidden=false;setStatus('Lista modeli pobrana. Wybierz model i otwórz rozmowę. To jeszcze nie potwierdza narzędzi ani połączenia ze Studio.');
    }catch(failure){key='';$('connect').hidden=true;setStatus(failure.message,true);}finally{checking=false;controls();}
  });
  $('connect').addEventListener('click',()=>{
    if(busy||locked||checking||!key||!$('model').value)return;
    reset();model=$('model').value;createSession();$('configuration').hidden=true;$('composer').hidden=false;
    setStatus('ChatWave API skonfigurowane. Uruchom Start Agent na pasku PlazCode, aby sprawdzić narzędzia i Studio.');
  });
  $('newChat').addEventListener('click',()=>{if(busy||locked)return;reset();if(key&&model)createSession();setStatus('Nowa rozmowa. Uruchom Start Agent.');});
  form.addEventListener('submit',event=>{
    event.preventDefault();if(busy){hooks?.onNativeStop?.();cancel();return;}
    if(hooks?.onCoworkSend?.(event)||hooks?.isBlocked?.())return;
    const text=ed.value.trim();if(!text)return;
    if(!hooks?.isStarted?.()){hooks?.onBlockedAttempt?.();return;}
    hooks.onUserMessage(assistants().length);try{submit(text,{userPrompt:true});}catch(failure){error=failure.message;setStatus(error,true);}
  });
  ed.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
  controls();
  return {
    id:'chatwave-api',displayName:'ChatWave API',supportsVision:false,barOutside:true,authoritativeSendResult:true,
    compactStartup:true,requireConfirmedStartup:true,requireLiveStartup:true,startupReplySettled:()=>false,
    startupRequest:()=> 'Start my PlazCode connection using the attached native list_commands function. Do not modify the project during startup.',
    promptExtra:'Use the attached native function tools for actions. Normal JSON and Luau code are reference text and are not executable in this client.',
    timings:{GEN_IDLE_MS:100,REASON_IDLE_MS:100,WARMUP_MS:45000,REASON_NOREPLY_MS:90000,STABLE_MS:9000,RESPONSE_TIMEOUT_MS:240000},
    setToolList(value){tools=value;session?.setTools(value);},
    allItems,isUserItem,isAssistantItem,itemText,classifyText:itemText,assistantCount:()=>assistants().length,userCount:()=>allItems().filter(isUserItem).length,
    lastAssistant,itemKey,lastAssistantId:()=>itemKey(lastAssistant()),
    readAssistant(){const item=lastAssistant();return {present:!!item,reply:itemText(item),thinking:'',item};},
    commandText:(text,item)=>nativeCalls.get(item)||'',streamLen:(item=lastAssistant())=>itemText(item).length,snapshot:()=>({rp:itemText(lastAssistant()).length,th:0}),
    conversationKey:()=>chatId,chatIsEmpty:()=>allItems().length===0,isFreshChat:()=>allItems().length===0,
    getEditor:()=>ed,editorText:()=>ed.value,composerFrame:()=>form,barAnchor:()=>form,
    setInputLock(on){locked=!!on;controls();},clearEditor(){ed.value='';},
    async writeDraft(value,expected){if(ed.value!==expected)return {ok:false};ed.value=String(value);return {ok:true};},
    async typeAndSend(text,images,options){if(images?.length)throw Error('ChatWave API: obrazy nie są jeszcze obsługiwane.');return submit(text,options);},
    stopGeneration:cancel,isGenerating:()=>busy,isBusyNow:()=>busy,isHardGenerating:()=>busy,turnComplete:()=>!busy,
    enforceComposer:()=>({ready:!!session&&!error}),
    async ensureComposerReady(reason){
      if(!key||!model)return {ready:false,detail:'Najpierw wpisz klucz ChatWave API i wybierz model w formularzu powyżej.'};
      if(reason==='startup'){cancel();error='';createSession();}
      return {ready:!!session&&!error};
    },
    scanError:()=>error||null,isTooLongMsg:()=>false,isBusyMsg:()=>false,turnHalted:()=>false,
    findContinueBtn:()=>null,clickContinueBtn:()=>false,canRestoreSession:()=>false,
    sendRetryable:()=>false,sendFailureAmbiguous:()=>true,sendFailureDetail:()=>error,
    findToolBlockSpot:item=>({anchor:item.querySelector('.markdown'),hide:[item.querySelector('.markdown')]}),
    installSendHooks(value){hooks=value;},init(){},toolResultPageChars:10000,
  };
})();
