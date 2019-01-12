//@flow
import Editor from "./Editor";
import React from "react";
import debounce from "./../debounce";
import environment from "../environment";
import highlightRange, {
  setRangeToTextNodes,
  getFirstTextNode
} from "../highlight";
import type { Pointer, RawRange } from "../range";
import { graphql, commitMutation } from "react-relay";
import { textNodesInRange } from "./../highlight";
import { toRawRange, fromRawRange } from "../range";
import type {
  CommentCreateInput,
  PopoverCreateCommentMutationResponse
} from "./__generated__/PopoverCreateCommentMutation.graphql";

import { convertToRaw } from "../draft";

type State = {
  boundingRect: ?DOMRect,
  hover: boolean,
  offsets: { x: number, y: number },
  selected: boolean,
  selected_listener: () => void,
  active_ranges: ?() => void,
  timeout?: TimeoutID,
  rawRange?: RawRange
};

function createCommentInput(
  content: string,
  rawRange: RawRange
): CommentCreateInput {
  return {
    content: content,
    startOffset: rawRange.start.textOffset,
    startId: rawRange.start.id,
    endOffset: rawRange.end.textOffset,
    endId: rawRange.end.id
  };
}

const createComment = graphql`
  mutation PopoverCreateCommentMutation($input: CommentCreateInput!) {
    createComment(data: $input) {
      id
    }
  }
`;

export default class Popover extends React.Component<{}, State> {
  editor: ?Editor = null;

  state = {
    selected: false,
    hover: false,
    boundingRect: null,
    offsets: { x: 0, y: 0 },
    active_ranges: null,
    selected_listener: () => {}
  };

  static EVENT = "mouseup";
  static DEBOUNCE_WAIT = 500;
  static TIME_TO_MOUSE_OUT = 400;

  clear_ranges = () => {
    this.state.active_ranges && this.state.active_ranges();
    return { active_ranges: null, rawRange: undefined };
  };

  clear_selection = () => {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        // Firefox
        window.getSelection().removeAllRanges();
      }
    }
  };

  cancel = () => {
    this.clear_selection();
    this.setState(state => {
      let ranges = this.clear_ranges();
      state.timeout && clearTimeout(state.timeout);
      return {
        ...ranges,
        timeout: undefined,
        hover: false,
        selected: false
      };
    });
  };

  selected_listener = () => {
    let currentSelection = window.getSelection();
    if (currentSelection.rangeCount !== 0) {
      let currentRange = currentSelection.getRangeAt(0);
      if (!currentRange) {
        return {};
      }
      currentRange = currentRange.cloneRange();
      let startNode = currentRange.startContainer;
      let valid = false;
      while (startNode) {
        if (startNode.id && startNode.id === "article") {
          valid = true;
          break;
        }
        startNode = startNode.parentNode;
      }

      if (valid)
        this.setState(state => {
          let { active_ranges } = state;
          active_ranges && active_ranges();
          let boundingRect = currentRange.getBoundingClientRect();
          if (boundingRect.width !== 0 && boundingRect.height !== 0) {
            let range = currentSelection.getRangeAt(0);
            if (!range) throw "range is not; not possible";
            let rawRange = toRawRange(range);
            range = fromRawRange(rawRange);
            let undo = highlightRange(range, "highlight");
            return {
              selected: true,
              boundingRect: boundingRect,
              offsets: {
                x: window.pageXOffset,
                y: window.pageYOffset
              },
              active_ranges: undo,
              rawRange
            };
          } else if (this.state.hover) {
            return {
              selected: false
            };
          } else {
            return {
              ...this.clear_ranges(),
              selected: false
            };
          }
        });
    } else if (!this.state.hover) {
      this.setState(state => {
        return {
          ...this.clear_ranges(),
          selected: false
        };
      });
    }
  };

  hoverOn = () => {
    this.setState(state => {
      if (state.timeout) window.clearTimeout(state.timeout);
      return { hover: true, timeout: undefined };
    });
  };

  hoverOff = () => {
    if (this.state.timeout) window.clearTimeout(this.state.timeout);
    let timeout = window.setTimeout(
      () =>
        this.setState(state => {
          return {
            ...this.clear_ranges(),
            selected: false,
            hover: false
          };
        }),
      Popover.TIME_TO_MOUSE_OUT
    );

    this.setState({ timeout });
  };

  componentDidMount = () => {
    let selected_listener = debounce(
      this.selected_listener,
      Popover.DEBOUNCE_WAIT
    );
    this.setState({ selected_listener });
    window.addEventListener(Popover.EVENT, selected_listener);
  };

  componentWillUnmount = () => {
    window.removeEventListener(Popover.EVENT, this.state.selected_listener);
  };

  submit = () => {
    if (this.editor) {
      let content = JSON.stringify(
        convertToRaw(this.editor.state.editorState.getCurrentContent())
      );
      if (!this.state.rawRange) return;
      let input = createCommentInput(content, this.state.rawRange);
      commitMutation(environment, {
        mutation: createComment,
        variables: { input }
      });
      this.cancel();
    }
  };

  render() {
    if ((this.state.selected || this.state.hover) && this.state.boundingRect) {
      let { top, left, width, height } = this.state.boundingRect;
      return (
        <div
          onMouseEnter={this.hoverOn}
          onMouseLeave={this.hoverOff}
          className="popover"
          style={{
            position: "absolute",
            backgroundColor: "white",
            top: top + this.state.offsets.y + height,
            left: left + this.state.offsets.x,
            minWidth: width
          }}
        >
          <Editor
            ref={editor => {
              this.editor = editor;
            }}
          >
            <div className="editor-bottom">
              <span className="bottom-text"> Add a Comment...</span>
              <div className="btn-container">
                <button className="btn-light" onClick={this.submit}>
                  Submit
                </button>
                <button className="btn-light" onClick={this.cancel}>
                  Cancel
                </button>
              </div>
            </div>
          </Editor>
        </div>
      );
    } else {
      return <React.Fragment />;
    }
  }
}
