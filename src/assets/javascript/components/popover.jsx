//@flow strict-local
import React from "react";
import { textNodesInRange } from "./../highlight";
import debounce from "./../debounce";
import Editor from "./editor";
import highlightRange from "../highlight";

type State = {
  boundingRect: ?DOMRect,
  hover: boolean,
  offsets: { x: number, y: number },
  selected: boolean,
  selected_listener: () => void,
  active_ranges: Set<() => void>,
  timeout?: number
};

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
  static TIME_TO_MOUSE_OUT = 1000;

  clear_ranges = () => {
    this.state.active_ranges.forEach(
      undo => undo instanceof Function && undo()
    );
    this.state.active_ranges.clear();
  };

  selected_listener = () => {
    let currentSelection = window.getSelection();
    if (currentSelection.rangeCount !== 0) {
      let currentRange = currentSelection.getRangeAt(0);
      this.setState(state => {
        let { active_ranges } = state;
        let boundingRect = currentRange.getBoundingClientRect();
        if (boundingRect.width !== 0 && boundingRect.height !== 0) {
          this.clear_ranges();
          for (let i = 0; i < currentSelection.rangeCount; ++i) {
            let range = currentSelection.getRangeAt(i);
            if (!range) continue;
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
          <Editor />
        </div>
      );
    } else {
      this.clear_ranges();
      return <div />;
    }
  }
}
