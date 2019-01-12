//@flow
import { setRangeToTextNodes, getFirstTextNode } from "./highlight";

export type Pointer = {
  id: string,
  textOffset: number
};

export type RawRange = {
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

export function toRawRange(range: Range): RawRange {
  setRangeToTextNodes(range);
  let arr = [
    { container: range.startContainer, offset: range.startOffset },
    { container: range.endContainer, offset: range.endOffset }
  ].map(({ container, offset }) => {
    let parent_element = container.parentElement;
    while (parent_element && !parent_element.id) {
      parent_element = parent_element.parentElement;
    }
    if (!parent_element) throw "all text have parent elements";
    let id = parent_element.id;

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

export function fromRawRange(rawRange: RawRange): Range {
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
