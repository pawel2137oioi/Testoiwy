// Actual Tiptap/ProseMirror defaults. No custom paste parser or transforms.
import {schema} from 'prosemirror-schema-basic';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {Editor} from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import HardBreak from '@tiptap/extension-hard-break';
window.mountNativeLongcatEditor=(parent,kind)=>{
  if(kind==='tiptap'){
    const editor=new Editor({element:parent,extensions:[Document,Paragraph,Text,HardBreak],content:'<p></p>'});
    window.nativeEditor=editor;
    window.modelText=()=>editor.getText();
    window.modelJSON=()=>editor.getJSON();
    window.clearModel=()=>editor.commands.clearContent();
  }else{
    const view=new EditorView(parent,{state:EditorState.create({schema})});
    window.nativeEditor=view;
    // Native model serializer representing the text of hard breaks and block
    // boundaries, independent of the provider's editable DOM reader.
    window.modelText=()=>view.state.doc.textBetween(0,view.state.doc.content.size,'\n\n',()=> '\n');
    window.modelJSON=()=>view.state.doc.toJSON();
    window.clearModel=()=>view.dispatch(view.state.tr.delete(0,view.state.doc.content.size));
  }
  const empty=document.querySelector('.ProseMirror p');
  empty.setAttribute('data-placeholder','Tell me what you need.');
  empty.classList.add('is-empty','is-editor-empty');
};
