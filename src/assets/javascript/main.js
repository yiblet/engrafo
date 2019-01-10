//@flow
import citations from "./citations";
import footnotes from "./footnotes";
import highlightRange from "./highlight";
import setupReact from "./setup-react";
import debounce from "./debounce";

function wrap(el: Element) {
  let pageContent = el.querySelector(".ltx_page_content");
  if (!pageContent) return;
  let div = document.createElement("div");
  div.id = "wrapper";
  div.className += "ltx_container";
  for (var i = 0, len = pageContent.children.length; i < len; i++) {
    div.appendChild(pageContent.children[i]);
  }

  let div2 = document.createElement("div");
  div2.id = "comments";
  div2.className += "placeholder";
  div.appendChild(div2);

  pageContent.appendChild(div);
}

export default function main(el: ?Element): void {
  if (!el) return;
  wrap(el);
  citations(el);
  footnotes(el);

  setupReact(el);
  console.log(el);
}
