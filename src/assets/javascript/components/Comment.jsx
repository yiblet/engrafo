//@flow
import React from "react";
import Editor from "./Editor";
import { graphql, createFragmentContainer } from "react-relay";
import type { Comment_comments as Comments } from "./__generated__/Comment_comments.graphql";
import { toRawRange, fromRawRange } from "../range";
import highlightRange from "../highlight";
import { EditorState, convertFromRaw } from "../draft";
import { zip3 } from "../util.js";

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

type CommentHighlightState = {
  boundingRects: Array<BoundingRect & Undo>,
  initialStates: Array<EditorState>,
  ranges: Array<Range>,
  offset: Offset
};

class CommentHighlight extends React.Component<Prop, CommentHighlightState> {
  state = {
    initialStates: [],
    ranges: [],
    boundingRects: [],
    offset: { x: 0, y: 0 }
  };

  click = () => {};

  addRange() {
    this.setState((state, { comments }) => {
      let ranges = comments.map(comment =>
        fromRawRange(commentToRawRange(comment))
      );

      let offset = {
        x: window.pageXOffset,
        y: window.pageYOffset
      };
      let boundingRects = ranges.map((range, idx) => {
        let undo = highlightRange(range, "commented", (dom: Node) => {
          dom.addEventListener("onclick", this.click);
        });
        return {
          ...clientRectToBoundingRect(range.getBoundingClientRect()),
          undo
        };
      });

      let initialStates = comments.map(comment =>
        EditorState.createWithContent(
          convertFromRaw(JSON.parse(comment.content))
        )
      );
      return { ranges, offset, initialStates, boundingRects };
    }, this.updateDimensions);
  }

  componentDidMount() {
    this.addRange();
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    this.state.boundingRects.map(rect => rect.undo());
    window.removeEventListener("resize", this.updateDimensions);
  }

  updateDimensions = () => {
    if (
      this.state.ranges.length >= 1 &&
      this.state.ranges[0].getBoundingClientRect().left !==
        this.state.boundingRects[0].left
    ) {
      let boundingRects = this.state.ranges.map((range, idx) => {
        return {
          ...this.state.boundingRects[idx],
          ...clientRectToBoundingRect(range.getBoundingClientRect())
        };
      });

      let offset = {
        x: window.pageXOffset,
        y: window.pageYOffset
      };

      console.log(boundingRects);

      this.setState({ boundingRects, offset });
    }
  };

  onHover = () => {};

  render() {
    let editors: Array<Editor> = this.state.initialStates.map(state => (
      <Editor readOnly={true} initialState={state} />
    ));

    let rects = this.state.boundingRects.map(({ top, left, width, height }) => {
      return (
        <div
          style={{
            position: "absolute",
            top: top + this.state.offset.y,
            left: left + this.state.offset.x,
            width: width,
            height: height,
            zIndex: -1
          }}
        />
      );
    });

    return (
      <React.Fragment>
        {zip3(editors, rects, this.props.comments).map(
          ([editor, rect, comment]) => (
            <div
              style={{
                marginBottom: "12px"
              }}
              key={comment.id}
            >
              {editor}
              {rect}
            </div>
          )
        )}
      </React.Fragment>
    );
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
