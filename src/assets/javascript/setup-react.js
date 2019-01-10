//@flow
import Popover from "./components/popover";
import Comments from "./components/comments";
import Editor from "./components/editor";
import React from "react";
import ReactDOM from "react-dom";

export default function setupReact(el: Element) {
  let div = document.createElement("div");
  div.id = "popover";
  el.appendChild(div);

  let comments = el.querySelector("#comments");
  if (comments) ReactDOM.render(<Comments />, comments);

  ReactDOM.render(<Popover />, div);
}
