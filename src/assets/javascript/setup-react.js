//@flow
import Popover from "./components/popover";
import Editor from "./components/editor";
import React from "react";
import ReactDOM from "react-dom";

export default function setupReact(el: Element) {
  let div = document.createElement("div");
  div.id = "popover";
  el.appendChild(div);

  ReactDOM.render(<Popover />, div);
}
