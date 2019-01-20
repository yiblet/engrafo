//@flow
import React from "react";
import Editor from "./Editor";
import { graphql, createFragmentContainer } from "react-relay";
import type { Comment_comments as Comments } from "./__generated__/Comment_comments.graphql";
import { toRawRange, fromRawRange } from "../range";
import highlightRange from "../highlight";
import { EditorState, ContentState, convertFromRaw } from "../draft";
import { zip2 } from "../util.js";

import type { Pointer, RawRange } from "../range";

type Comment = {
  +id: string,
  +content: string,
  +startId: string,
  +startOffset: number,
  +endId: string,
  +endOffset: number
};

type Prop = {
  comments: Comments
};

type Rect = {
  left: number,
  top: number,
  right: number,
  bottom: number
};

type BoundingRect = Rect & { width: number, height: number };

function clientRectToBoundingRect(rect: ClientRect): BoundingRect {
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height
  };
}

type Point = {
  x: number,
  y: number
};

//TODO create faster algorithm
function findBoundingRect(rects: Array<Rect>, { x, y }: Point) {
  function isInside({ top, left, bottom, right }: Rect) {
    return top <= y && bottom >= y && left <= x && right >= x;
  }
  return rects.filter.isInside(rects);
}

function commentToRawRange({
  startId,
  startOffset,
  endId,
  endOffset
}: Comment): RawRange {
  function pointer(id: string, textOffset: number): Pointer {
    return { id, textOffset };
  }

  return {
    start: pointer(startId, startOffset),
    end: pointer(endId, endOffset)
  };
}

type Offset = {
  x: number,
  y: number
};

type Undo = {
  undo: () => void
};

type CommentState = {
  range: Range,
  initialState: EditorState,
  boundingRect: BoundingRect,
  reply: boolean,
  undo: () => void
};

type CommentHighlightState = {
  comments: Array<CommentState>,
  visibleComments: Set<number>,
  offset: Offset
};

class CommentHighlight extends React.Component<Prop, CommentHighlightState> {
  state = {
    visibleComments: new Set(),
    offset: { x: 0, y: 0 },
    comments: []
  };

  click = (event: Event, doms: Element[], idx: number) => {
    if (doms[0].className === "commented-clicked") {
      doms.forEach(dom => {
        dom.className = "commented";
      });
      this.state.visibleComments.delete(idx);
    } else {
      doms.forEach(dom => {
        dom.className = "commented-clicked";
      });
      this.state.visibleComments.add(idx);
    }
    this.forceUpdate();
  };

  addRange() {
    this.setState((state, { comments }) => {
      let ranges = comments.map(comment =>
        fromRawRange(commentToRawRange(comment))
      );

      let offset = {
        x: window.pageXOffset,
        y: window.pageYOffset
      };
      let commentStates: Array<CommentState> = ranges.map((range, idx) => {
        let domGroup = [];
        let undo = highlightRange(range, "commented", (dom: Element) => {
          domGroup.push(dom);
          dom.addEventListener("mousedown", (event: Event) =>
            this.click(event, domGroup, idx)
          );
        });
        return {
          initialState: EditorState.createWithContent(
            convertFromRaw(JSON.parse(comments[idx].content))
          ),
          range: range,
          reply: false,
          boundingRect: clientRectToBoundingRect(range.getBoundingClientRect()),
          undo: undo
        };
      });

      return { offset, comments: commentStates };
    }, this.updateDimensions);
  }

  componentDidMount() {
    this.addRange();
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    this.state.comments.map(({ undo }) => undo());
    window.removeEventListener("resize", this.updateDimensions);
  }

  updateDimensions = () => {
    if (
      this.state.comments.length >= 1 &&
      this.state.comments[0].range.getBoundingClientRect().left !==
        this.state.comments[0].boundingRect.left
    ) {
      let comments = this.state.comments.map((comment, idx) => {
        return {
          ...comment,
          boundingRect: clientRectToBoundingRect(
            comment.range.getBoundingClientRect()
          )
        };
      });

      let offset = {
        x: window.pageXOffset,
        y: window.pageYOffset
      };

      this.setState({ comments, offset });
    }
  };

  onHover = () => {};
  reply = (idx: number) => {};

  render() {
    let idxs = [...this.state.visibleComments.values()];
    let editors = idxs.map(i => {
      let {
        range,
        initialState,
        boundingRect: { top, left, width, height },
        reply
      } = this.state.comments[i];

      if (reply) {
        let frag = (
          <React.Fragment>
            <span className="bottom-text"> Written by </span>
            <div className="button-container">
              <button className="button-light" onClick={() => this.reply(i)}>
                Reply
              </button>
            </div>
          </React.Fragment>
        );
      } else {
      }
      return (
        <div
          style={{
            position: "absolute",
            top: top + this.state.offset.y,
            left: left + this.state.offset.x + width + 12,
            minWidth: 300
          }}
          key={this.props.comments[i].id}
        >
          <Editor readOnly={true} initialState={initialState}>
            <div className="editor-bottom" />
          </Editor>
        </div>
      );
    });

    return <React.Fragment>{editors}</React.Fragment>;
  }
}

export default createFragmentContainer(
  CommentHighlight,
  graphql`
    fragment Comment_comments on Comment @relay(plural: true) {
      id
      content
      startId
      startOffset
      endId
      endOffset
    }
  `
);
