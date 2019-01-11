//@flow strict-local
import React from "react";
import { textNodesInRange } from "./../highlight";
import debounce from "./../debounce";
import Editor from "./editor";
import highlightRange, {
  setRangeToTextNodes,
  getFirstTextNode
} from "../highlight";

type State = {
  boundingRect: ?DOMRect,
  hover: boolean,
  offsets: { x: number, y: number },
  selected: boolean,
  selected_listener: () => void,
  active_ranges: Set<() => void>,
  timeout?: TimeoutID
};

type Pointer = {
  id: string,
  textOffset: number
};

type RawRange = {
  start: Pointer,
  end: Pointer
};

function nodeTextLength(node: Node): number {
  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      //$FlowFixMe
      return node.innerText.length;
    case Node.TEXT_NODE:
      //$FlowFixMe
      return node.length;
    default:
      return 0;
  }
}

function toRawRange(range: Range): RawRange {
  setRangeToTextNodes(range);
  let arr = [
    { container: range.startContainer, offset: range.startOffset },
    { container: range.endContainer, offset: range.endOffset }
  ].map(({ container, offset }) => {
    if (!container.parentElement) throw "all text have parent elements";
    let id = container.parentElement.id;
    if (!container.parentElement.id) throw "all parent elements must have ids";

    let textOffset = offset;
    for (let i = container.previousSibling; i; i = i.previousSibling) {
      textOffset += nodeTextLength(i);
    }
    return { container, id, textOffset };
  });

  let res = {
    start: arr[0],
    end: arr[1]
  };
  return res;
}

function fromRawRange(rawRange: RawRange): Range {
  let ranges = [rawRange.start, rawRange.end]
    .map(({ id, textOffset }) => {
      let element = document.getElementById(id);
      if (!element) throw "nonexistent element";
      let child = element.firstChild;
      let seen = 0;
      let lastText = null;
      while (child != null && seen < textOffset) {
        let len = nodeTextLength(child);
        if (len === 0) {
          child = child.nextSibling;
          continue;
        }
        lastText = child;
        let newSeen = seen + len;
        if (newSeen >= textOffset) {
          let res = {
            offset: textOffset - seen,
            node: getFirstTextNode(child)
          };
          return res;
        }
        seen = newSeen;
        child = child.nextSibling;
      }

      let res = {
        offset:
          textOffset +
          (lastText === null ? 0 : nodeTextLength(lastText)) -
          seen,
        node: getFirstTextNode(lastText !== null ? lastText : element)
      };
      return res;
    })
    .map(({ node, offset }) => {
      if (nodeTextLength(node) < offset) return { node, offset: 0 };
      else return { node, offset };
    });

  let range = document.createRange();
  let start = ranges[0],
    end = ranges[1];

  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  return range;
}

export default class Popover extends React.Component<{}, State> {
  state = {
    selected: false,
    hover: false,
    boundingRect: null,
    offsets: { x: 0, y: 0 },
    active_ranges: new Set(),
    selected_listener: () => {}
  };

  static EVENT = "mouseup";
  static DEBOUNCE_WAIT = 500;
  static TIME_TO_MOUSE_OUT = 400;

  clear_ranges = () => {
    this.state.active_ranges.forEach(
      undo => undo instanceof Function && undo()
    );
    this.state.active_ranges.clear();
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
    this.clear_ranges();
    this.setState(state => {
      state.timeout && clearTimeout(state.timeout);
      return {
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
          let boundingRect = currentRange.getBoundingClientRect();
          if (boundingRect.width !== 0 && boundingRect.height !== 0) {
            for (let i = 0; i < currentSelection.rangeCount; ++i) {
              let range = currentSelection.getRangeAt(i);
              if (!range) continue;
              range = fromRawRange(toRawRange(range));
              let undo = highlightRange(range, "highlight");
              active_ranges.add(undo);
            }
            return {
              selected: true,
              boundingRect: boundingRect,
              offsets: {
                x: window.pageXOffset,
                y: window.pageYOffset
              }
            };
          } else {
            return {
              selected: false
            };
          }
        });
    } else {
      this.setState(state => {
        this.clear_ranges();
        return {
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
    this.setState(state => {
      if (state.timeout) window.clearTimeout(state.timeout);
      return {
        timeout: window.setTimeout(
          () =>
            this.setState(state => {
              this.clear_ranges();
              return {
                selected: false,
                hover: false
              };
            }),
          Popover.TIME_TO_MOUSE_OUT
        )
      };
    });
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
          <Editor>
            <div className="editor-bottom">
              <span className="bottom-text"> Add a Comment...</span>
              <div className="btn-container">
                <button className="btn-light">Submit</button>
                <button className="btn-light" onClick={this.cancel}>
                  Cancel
                </button>
              </div>
            </div>
          </Editor>
        </div>
      );
    } else {
      this.clear_ranges();
      return <div />;
    }
  }
}
