//@flow

import React from "react";
import { EditorState, ContentState, convertFromRaw } from "../draft";
import Editor from "./Editor";

export default class Commenter extends React.Component<{
  submit: ContentState => void,
  cancel: ContentState => void,
  text: string
}> {
  editor: ?Editor = null;

  respond = (func: string) => {
    if (this.editor) {
      return this.props[func](
        this.editor.state.editorState.getCurrentContent()
      );
    }
  };

  render() {
    return (
      <Editor
        ref={editor => {
          this.editor = editor;
        }}
      >
        <div className="editor-bottom">
          <span className="bottom-text">{this.props.text}</span>
          <div className="button-container">
            <button
              className="button-light"
              onClick={() => this.respond("submit")}
            >
              Submit
            </button>
            <button
              className="button-light"
              onClick={() => this.respond("cancel")}
            >
              Cancel
            </button>
          </div>
        </div>
      </Editor>
    );
  }
}
