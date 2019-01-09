//@flow strict-local
import React from "react";
import { textNodesInRange } from "./../highlight";
import debounce from "./../debounce";
import Editor from "./editor";

type State = {
  boundingRect: ?DOMRect,
  hover: boolean,
  offsets: { x: number, y: number },
  selected: boolean,
  selected_listener: () => void,
  timeout?: number
};

export default class Popover extends React.Component<{}, State> {
  state = {
    selected: false,
    hover: false,
    boundingRect: null,
    offsets: { x: 0, y: 0 },
    selected_listener: () => {}
  };

  static EVENT = "mouseup";
  static DEBOUNCE_WAIT = 500;
  static TIME_TO_MOUSE_OUT = 1000;

  selected_listener = () => {
    console.log(`New ${Popover.EVENT}`);
    let currentSelection = window.getSelection();
    if (currentSelection.rangeCount === 0) currentSelection = null;
    if (currentSelection) {
      let currentRange = currentSelection.getRangeAt(0);
      this.setState((state, props) => {
        let boundingRect = currentRange.getBoundingClientRect();
        if (boundingRect.width !== 0 && boundingRect.height !== 0) {
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
      this.setState({ selected: false });
    }
  };

  hoverOn = () => {
    this.setState((state, props) => {
      if (state.timeout) window.clearTimeout(state.timeout);
      return { hover: true, timeout: undefined };
    });
  };
  hoverOff = () => {
    this.setState((state, props) => {
      if (state.timeout) window.clearTimeout(state.timeout);
      return {
        timeout: window.setTimeout(
          () => this.setState({ hover: false }),
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
      console.log(this.state.boundingRect);
      return (
        <div
          onMouseEnter={this.hoverOn}
          onMouseLeave={this.hoverOff}
          className="popover"
          style={{
            position: "absolute",
            backgroundColor: "white",
            top: top + this.state.offsets.y + height,
            left: left + this.state.offsets.x
          }}
        >
          <Editor />
        </div>
      );
    } else {
      return <div />;
    }
  }
}
