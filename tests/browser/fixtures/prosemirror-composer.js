// Real ProseMirror with a controlled plaintext parser preserving each newline.
// This represents the reported paragraph-per-line rendering, not Copilot code.
import {Fragment,Slice} from 'prosemirror-model';
import {schema} from 'prosemirror-schema-basic';
import {EditorState} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
window.mountParagraphComposer=(parent,preserveLines=true)=>{
  window.paragraphView=new EditorView(parent,{
    state:EditorState.create({schema}),
    attributes:{'aria-label':'Message Copilot'},
    ...(preserveLines?{clipboardTextParser(text){
      const nodes=text.split('\n').map(line=>schema.nodes.paragraph.create(null,line?schema.text(line):null));
      return Slice.maxOpen(Fragment.fromArray(nodes));
    }}:{}),
  });
  window.paragraphText=()=>paragraphView.state.doc.textBetween(0,paragraphView.state.doc.content.size,'\n');
  window.clearParagraphComposer=()=>paragraphView.dispatch(paragraphView.state.tr.delete(0,paragraphView.state.doc.content.size));
};
