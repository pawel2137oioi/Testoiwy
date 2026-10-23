// Real editor/framework fixtures, not a claim about Copilot's private bundle.
import {createEditor,$getRoot,$createParagraphNode} from 'lexical';
import {registerPlainText} from '@lexical/plain-text';
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {EditorView} from '@codemirror/view';
import {EditorState} from '@codemirror/state';
window.mountCodeMirror=value=>{
  window.codeView=new EditorView({parent:document.querySelector('#code-root'),state:EditorState.create({doc:value,extensions:[EditorState.readOnly.of(true),EditorView.editable.of(false)]})});
};
window.mountLexical=()=>{
  const ed=document.querySelector('[contenteditable]');
  const editor=createEditor({namespace:'PlazCodeFixture',onError(error){throw error;}});
  editor.setRootElement(ed);registerPlainText(editor);
  editor.update(()=>{$getRoot().append($createParagraphNode());},{discrete:true});
  window.modelText=()=>editor.getEditorState().read(()=>$getRoot().getTextContent());
  window.modelClear=()=>editor.update(()=>{$getRoot().clear().append($createParagraphNode());},{discrete:true});
};
window.mountReact=()=>{
  function Composer(){
    const [stage,setStage]=useState(0),[text,setText]=useState('');
    window.modelText=()=>text;
    const submit=()=>{window.nativeSent.push(text);const row=document.createElement('div');if(window.retainDraft)row.dataset.testid='user-message';else row.dataset.role='user';row.textContent=text;document.querySelector('#thread').append(row);if(!window.retainDraft)setText('');};
    return React.createElement('form',{onSubmit:event=>event.preventDefault()},
      React.createElement('textarea',{key:stage,value:text,placeholder:'Message Copilot',
        onFocus:()=>{if(stage===0)flushSync(()=>setStage(1));},
        onChange:event=>{const value=event.target.value;flushSync(()=>{setText(value);if(stage===1)setStage(2);});}}),
      React.createElement('button',{type:'button','aria-label':'Send message',disabled:!text,onClick:submit},'Send'));
  }
  flushSync(()=>createRoot(document.querySelector('#react-root')).render(React.createElement(Composer)));
};
// Representative Scriptor viewport with real React owner props. This fixture
// models the virtualized classes/textbox reported by the user; it is not the
// private Microsoft editor implementation.
window.mountScriptorCode=(parent,initial,limit=80)=>{
  function NativeCode({code}){
    return React.createElement('div',{className:'scriptor-component-code-block scriptor-codeblock-virtualized'},
      React.createElement('div',null,React.createElement('div',{'aria-live':'assertive',hidden:true}),React.createElement('div',{'aria-live':'polite',hidden:true})),
      React.createElement('div',{hidden:true}),
      React.createElement('div',null,React.createElement('svg',{'aria-hidden':'true'}),React.createElement('span',null,'JSON'),React.createElement('button',{type:'button','aria-label':'Copy code',onClick:()=>{window.copyClicks++;navigator.clipboard.writeText(code);}},'Copy')),
      React.createElement('div',null,React.createElement('div',{role:'textbox','aria-readonly':'true'},React.createElement('div',{'aria-hidden':'true'}),React.createElement('div',null,code.slice(0,limit)))));
  }
  function Preview(){
    const [code,setCode]=useState(initial);window.setScriptorCode=value=>flushSync(()=>setCode(value));
    return React.createElement('section',{'aria-label':'Code preview'},React.createElement(NativeCode,{code}));
  }
  const mounted=createRoot(parent);flushSync(()=>mounted.render(React.createElement(Preview)));return mounted;
};
