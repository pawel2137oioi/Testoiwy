// SPDX-License-Identifier: GPL-3.0-or-later
// Read-only MAIN-world access to the complete source of native Copilot code
// previews. A virtualized textbox is a viewport, not a document. Never click
// Copy, touch the clipboard, edit the native component or join missing rows.
(() => {
  'use strict';
  if(location.hostname!=='copilot.com'||window.__rsCopilotCode)return;
  window.__rsCopilotCode=true;
  const BLOCK='.scriptor-component-code-block.scriptor-codeblock-virtualized';
  const OWN='#rs-root,#rs-input-cover,.rs-chip';
  const AI='[role="article"].fai-CopilotMessage,[data-message-author-role="assistant"],[data-message-role="assistant"],[data-role="assistant"],[data-testid="copilot-message"],[data-testid="ai-message"],[class~="group/ai-message"]';
  const SKIP='button,[role="button"],blockquote,slot,[hidden],[aria-hidden="true"],.line-number,.linenumber,'+OWN;
  const SOURCE='data-rs-scriptor-source',LEN='data-rs-scriptor-len',KIND='data-rs-scriptor-kind',STATUS='data-rs-scriptor-status';
  const MAX_SOURCE=2*1024*1024;
  function inReply(block){
    for(let node=block;node?.nodeType===1;node=node.parentElement||node.getRootNode()?.host){
      if(node.matches(OWN+',button,[role="button"],blockquote,[data-message-author-role="user"],[data-message-role="user"],[data-role="user"],[role="article"].fai-UserMessage'))return false;
      if(node.matches(AI))return true;
    }
    return false;
  }
  function visibleFragments(textbox){
    if(textbox.tagName==='TEXTAREA')return textbox.value?[textbox.value]:[];
    const out=[];
    const walker=document.createTreeWalker(textbox,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;
      if(!node.nodeValue.trim()||node.parentElement.closest(SKIP))continue;
      out.push(node.nodeValue);
      if(out.length>8192)return null;
    }
    return out;
  }
  function compatible(source,fragments){
    if(typeof source!=='string'||!source.length||source.length>MAX_SOURCE||!fragments?.length)return false;
    let offset=0;
    for(const fragment of fragments){const at=source.indexOf(fragment,offset);if(at<0)return false;offset=at+fragment.length;}
    return true;
  }
  function reactSources(block,add){
    const keys=Object.getOwnPropertyNames(block);
    const fiberKey=keys.find(key=>/^__reactFiber\$|^__reactInternalInstance\$/.test(key));
    const propsKey=keys.find(key=>/^__reactProps\$/.test(key));
    if(!fiberKey||!propsKey)return;
    const attached=block[fiberKey],currentProps=block[propsKey];
    // DOM host props identify the committed branch. If both alternates share
    // them, inspect both and require agreement; never choose the longer value
    // or trust a stale/in-progress alternate after an offscreen source edit.
    const starts=[attached,attached?.alternate].filter(node=>node&&node.memoizedProps===currentProps);
    for(const start of starts){
      const seen=new Set();let fiber=start;
      for(let depth=0;fiber&&depth<16&&!seen.has(fiber);depth++,fiber=fiber.return){
        seen.add(fiber);
        if(fiber!==start&&fiber.stateNode?.nodeType===1)break;
        if(fiber===start||typeof fiber.type==='string')continue;
        const props=fiber.memoizedProps;
        if(!props||typeof props!=='object')continue;
        for(const name of ['code','value','text'])if(typeof props[name]==='string')add(props[name],'react-'+name);
        for(const name of ['code','codeBlock']){
          const value=props[name];
          if(value&&typeof value==='object')for(const key of ['code','text','value','content'])if(typeof value[key]==='string')add(value[key],'react-code');
        }
        if(typeof props.children==='string'&&typeof (props.language||props.lang)==='string')add(props.children,'react-children');
      }
    }
  }
  function sourceOf(block){
    const boxes=Array.from(block.querySelectorAll('[role="textbox"],textarea')).filter(node=>!node.closest(SKIP));
    if(boxes.length!==1)return {status:'textbox_ambiguous'};
    const textbox=boxes[0],fragments=visibleFragments(textbox),candidates=new Map(),react=new Map();
    const add=(text,kind)=>{if(compatible(text,fragments)&&!candidates.has(text))candidates.set(text,kind);};
    // Read native text buffers independently of the DOM viewport. A committed
    // React code prop can contain source beyond an EditContext text window.
    if(textbox.editContext&&typeof textbox.editContext.text==='string')add(textbox.editContext.text,'editcontext');
    if(textbox.tagName==='TEXTAREA'&&(textbox.readOnly||textbox.getAttribute('aria-readonly')==='true'))add(textbox.value,'textarea');
    reactSources(block,(text,kind)=>{if(compatible(text,fragments)&&!react.has(text))react.set(text,kind);});
    if(react.size>1)return {status:'model_ambiguous'};
    if(react.size===1){
      const [source,kind]=react.entries().next().value;
      // EditContext may be a surrounding-text window for an input method,
      // while the committed code prop holds the whole document. It must be
      // an exact substring, not a conflicting revision. Never resolve two
      // different React branches by length or a common prefix.
      if([...candidates.keys()].some(text=>!source.includes(text)))return {status:'model_ambiguous'};
      return {status:'ok',source,kind};
    }
    if(candidates.size!==1)return {status:candidates.size?'model_ambiguous':'model_unavailable'};
    const [source,kind]=candidates.entries().next().value;
    return {status:'ok',source,kind};
  }
  function publish(block,result){
    if(result.status==='ok'){
      for(const [name,value] of [[SOURCE,result.source],[LEN,String(result.source.length)],[KIND,result.kind]])if(block.getAttribute(name)!==value)block.setAttribute(name,value);
    }else for(const name of [SOURCE,LEN,KIND])if(block.hasAttribute(name))block.removeAttribute(name);
    if(block.getAttribute(STATUS)!==result.status)block.setAttribute(STATUS,result.status);
    block.dispatchEvent(new Event('rs-scriptor-ready'));
  }
  document.addEventListener('rs-scriptor-sync',event=>{
    const block=event.composedPath()[0];
    if(block?.nodeType!==1||!block.matches(BLOCK)||!inReply(block))return;
    try{publish(block,sourceOf(block));}catch{publish(block,{status:'model_error'});}
  },true);
})();
