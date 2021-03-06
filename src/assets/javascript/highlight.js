// Wrap each text node in a given DOM Range with a <span class=[highLightClass]>.
// Breaks start and/or end node if needed.
// Returns a function that cleans up the created highlight (not a perfect undo: split text nodes are not merged again).
//
// Parameters:
// - rangeObject: a Range whose start and end containers are text nodes.
// - highlightClass: the CSS class the text pieces in the range should get, defaults to 'highlighted-range'.
export default function highlightRange(
  rangeObject,
  highlightClass,
  modify = null
) {
  // Ignore range if empty.
  if (rangeObject.collapsed) {
    return;
  }

  if (typeof highlightClass == "undefined") {
    highlightClass = "highlighted-range";
  }

  // First put all nodes in an array (splits start and end nodes)
  var nodes = textNodesInRange(rangeObject, NodeFilter.SHOW_TEXT);

  // Remember range details to restore it later.
  var startContainer = rangeObject.startContainer;
  var startOffset = rangeObject.startOffset;
  var endContainer = rangeObject.endContainer;
  var endOffset = rangeObject.endOffset;

  // Highlight each node
  var highlights = [];
  for (var nodeIdx in nodes) {
    highlights.push(highlightNode(nodes[nodeIdx], highlightClass, modify));
  }

  // The rangeObject gets messed up by our DOM changes. Be kind and restore.
  rangeObject.setStart(startContainer, startOffset);
  rangeObject.setEnd(endContainer, endOffset);

  let cleaned = { cleaned: false };
  // Return a function that cleans up the highlights.
  function cleanupHighlights(newClass = null) {
    if (cleaned.cleaned) return;
    // Remember range details to restore it later.
    var startContainer = rangeObject.startContainer;
    var startOffset = rangeObject.startOffset;
    var endContainer = rangeObject.endContainer;
    var endOffset = rangeObject.endOffset;

    // Remove each of the created highlights.
    for (var highlightIdx in highlights) {
      if (!newClass) removeHighlight(highlights[highlightIdx]);
      else highlights[highlightIdx].className = newClass;
    }

    // Be kind and restore the rangeObject again.
    rangeObject.setStart(startContainer, startOffset);
    rangeObject.setEnd(endContainer, endOffset);
    cleaned.cleaned = true;
  }
  return cleanupHighlights;
}

// Return an array of the text nodes in the range. Split the start and end nodes if required.
export function textNodesInRange(rangeObject, filter = NodeFilter.SHOW_ALL) {
  // Modify Range to make sure that the start and end nodes are text nodes.
  setRangeToTextNodes(rangeObject);

  var nodes = [];

  // Ignore range if empty.
  if (rangeObject.collapsed) {
    return nodes;
  }

  // Include (part of) the start node if needed.
  if (rangeObject.startOffset != rangeObject.startContainer.length) {
    // If only part of the start node is in the range, split it.
    if (rangeObject.startOffset != 0) {
      // Split startContainer to turn the part after the startOffset into a new node.
      var createdNode = rangeObject.startContainer.splitText(
        rangeObject.startOffset
      );

      // If the end was in the same container, it will now be in the newly created node.
      if (rangeObject.endContainer === rangeObject.startContainer) {
        rangeObject.setEnd(
          createdNode,
          rangeObject.endOffset - rangeObject.startOffset
        );
      }

      // Update the start node, which no longer has an offset.
      rangeObject.setStart(createdNode, 0);
    }
  }

  // Create an iterator to iterate through the nodes.
  var root =
    typeof rangeObject.commonAncestorContainer != "undefined"
      ? rangeObject.commonAncestorContainer
      : document.body; // fall back to whole document for browser compatibility
  var iter = document.createNodeIterator(root, filter);

  // Find the start node (could we somehow skip this seemingly needless search?)
  while (
    iter.referenceNode !== rangeObject.startContainer &&
    iter.referenceNode !== null
  ) {
    iter.nextNode();
  }

  // Add each node up to (but excluding) the end node.
  while (
    iter.referenceNode !== rangeObject.endContainer &&
    iter.referenceNode !== null
  ) {
    nodes.push(iter.referenceNode);
    iter.nextNode();
  }

  // Include (part of) the end node if needed.
  if (rangeObject.endOffset != 0) {
    // If it is only partly included, we need to split it up.
    if (rangeObject.endOffset != rangeObject.endContainer.length) {
      // Split the node, breaking off the part outside the range.
      rangeObject.endContainer.splitText(rangeObject.endOffset);
      // Note that the range object need not be updated.

      //assert(rangeObject.endOffset == rangeObject.endContainer.length);
    }

    // Add the end node.
    nodes.push(rangeObject.endContainer);
  }

  return nodes;
}

export function getFirstTextNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return node;
  var document = node.ownerDocument;
  var walker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  return walker.firstChild();
}

// Normalise the range to start and end in a text node.
// Copyright (c) 2015 Randall Leeds
export function setRangeToTextNodes(rangeObject) {
  var startNode = rangeObject.startContainer;
  var startOffset = rangeObject.startOffset;

  // Drill down to a text node if the range starts at the container boundary.
  if (startNode.nodeType !== Node.TEXT_NODE) {
    if (startOffset === startNode.childNodes.length) {
      startNode = startNode.childNodes[startOffset - 1];
      startNode = getFirstTextNode(startNode);
      startOffset = startNode.textContent.length;
    } else {
      startNode = startNode.childNodes[startOffset];
      startNode = getFirstTextNode(startNode);
      startOffset = 0;
    }
    rangeObject.setStart(startNode, startOffset);
  }

  var endNode = rangeObject.endContainer;
  var endOffset = rangeObject.endOffset;

  // Drill down to a text node if the range ends at the container boundary.
  if (endNode.nodeType !== Node.TEXT_NODE) {
    if (endOffset === endNode.childNodes.length) {
      endNode = endNode.childNodes[endOffset - 1];
      endNode = getFirstTextNode(endNode);
      endOffset = endNode.textContent.length;
    } else {
      endNode = endNode.childNodes[endOffset];
      endNode = getFirstTextNode(endNode);
      endOffset = 0;
    }
    rangeObject.setEnd(endNode, endOffset);
  }
}

// Replace [node] with <span class=[highlightClass]>[node]</span>
function highlightNode(node, highlightClass, modify) {
  // Create a highlight
  var highlight = document.createElement("span");
  if (modify) modify(highlight);
  highlight.classList.add(highlightClass);

  // Wrap it around the text node
  node.parentNode.replaceChild(highlight, node);
  highlight.appendChild(node);

  return highlight;
}

// Remove a highlight <span> created with highlightNode.
function removeHighlight(highlight) {
  // Move its children (normally just one text node) into its parent.
  while (highlight.firstChild) {
    highlight.parentNode.insertBefore(highlight.firstChild, highlight);
  }
  // Remove the now empty node
  highlight.remove();
}
