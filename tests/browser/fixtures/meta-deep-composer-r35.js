// Real Lexical + React model, with the deep split composer shape from the
// user's r34 structural report. Deeper wrapper/control attributes are modeled
// from the adapter's documented contracts, not a captured private Meta bundle.
import React,{useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {createEditor,$getRoot,$createParagraphNode,$createTextNode} from 'lexical';
import {registerPlainText} from '@lexical/plain-text';
window.mountDeepMeta=({depth=10,kind='testid',initialHidden=false,onSend}={})=>{
 function Composer(){
  const ref=useRef(null),editorRef=useRef(null);const [text,setText]=useState(''),[busy,setBusy]=useState(false);
  useLayoutEffect(()=>{
   const editor=createEditor({namespace:'MetaDeepR35',onError(error){throw error;}});editorRef.current=editor;editor.setRootElement(ref.current);registerPlainText(editor);
   editor.update(()=>{$getRoot().clear().append($createParagraphNode());},{discrete:true});
   const modelText=()=>editor.getEditorState().read(()=>$getRoot().getTextContent());
   window.modelText=modelText;window.modelClear=()=>editor.update(()=>{$getRoot().clear().append($createParagraphNode());},{discrete:true});
   window.setNativeModel=value=>editor.update(()=>{$getRoot().clear().append($createParagraphNode().append($createTextNode(value)));},{discrete:true});
   window.setNativeBusy=value=>flushSync(()=>setBusy(value));
   const unregister=editor.registerUpdateListener(()=>setText(modelText()));return ()=>{unregister();editor.setRootElement(null);};
  },[]);
  const submit=()=>{if(busy){window.nativeStops++;setBusy(false);return;}const value=window.modelText();if(!value.trim())return;window.nativeModelMirrors.push({model:value,mirror:document.querySelector('#native-card textarea[data-testid="composer-input"]').value});window.nativeSent.push(value);onSend(value);window.modelClear();};
  const editor=React.createElement('div',{ref,contentEditable:true,role:'textbox','data-testid':'composer-input',suppressContentEditableWarning:true,'data-lexical-editor':'true',className:'native-editor'});
  const first=React.createElement('div',null,editor);
  const second=React.createElement('div',null,first,React.createElement('div',{'aria-hidden':'true'}));
  const mirror=React.createElement('div',{style:{display:'none'}},React.createElement('textarea',{'data-testid':'composer-input',placeholder:'Zapytaj Meta AI…',value:text,onChange:event=>{window.nativeMirrorWrites.push(event.target.value);window.setNativeModel(event.target.value);}}));
  let branch=React.createElement('div',null,second,mirror);
  for(let current=4;current<depth;current++)branch=React.createElement('div',null,branch);
  const controls=React.createElement('div',{className:'native-controls'},React.createElement('button',{type:'button','aria-label':'Dodaj załącznik'},'+'),React.createElement('button',{type:'button','aria-label':'Myślenie'},'Myślenie'),React.createElement('div',{role:'button',tabIndex:0,'data-testid':kind==='testid'?(busy?'composer-stop-button':'composer-send-button'):undefined,'aria-label':busy?'Zatrzymaj generowanie':'Wyślij wiadomość','aria-disabled':!busy&&!text.trim()?'true':'false',hidden:initialHidden&&!busy&&!text.trim(),onClick:submit,className:'native-send'},React.createElement('svg',{width:16,height:16,'aria-hidden':true},React.createElement('path',{d:'M8 15V1M1 8l7-7 7 7',stroke:'currentColor',fill:'none'}))));
  return React.createElement('div',{id:'native-card'},branch,controls);
 }
 flushSync(()=>createRoot(document.querySelector('#native-root')).render(React.createElement(Composer)));
};
