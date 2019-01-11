//@flow
import citations from "./citations";
import footnotes from "./footnotes";
import highlightRange from "./highlight";
import setupReact from "./setup-react";
import debounce from "./debounce";
import { fetchQuery, graphql } from "relay-runtime";
import environment from "./environment";

function wrap(el: Element) {
  let pageContent = el.querySelector(".ltx_page_content");
  if (!pageContent) return;
  let article = document.createElement("div");
  article.id = "article";
  for (var i = 0, len = pageContent.children.length; i < len; i++) {
    article.appendChild(pageContent.children[i]);
  }

  var nodeIterator = document.createNodeIterator(
    article,
    window.NodeFilter.SHOW_TEXT,
    node => {
      return node.parentElement && !node.parentElement.id
        ? window.NodeFilter.FILTER_ACCEPT
        : window.NodeFilter.FILTER_REJECT;
    }
  );

  let currentNode;
  let id_count = 0;
  while ((currentNode = nodeIterator.nextNode())) {
    if (currentNode.parentElement)
      currentNode.parentElement.id = "text" + id_count++;
  }

  let div = document.createElement("div");
  div.id = "wrapper";
  div.className += "ltx_container";
  div.appendChild(article);

  let div2 = document.createElement("div");
  div2.id = "comments";
  div2.className += "placeholder";
  div.appendChild(div2);

  pageContent.appendChild(div);
}

export default async function main(el: ?Element) {
  if (!el) return;
  wrap(el);
  citations(el);
  footnotes(el);

  setupReact(el);

  const query = graphql`
    query mainQuery {
      papers {
        id
        arxivId
      }
    }
  `;

  let res = fetchQuery(environment, query, {})
    .catch(err => console.log(err))
    .then(res => console.log(res));
}
