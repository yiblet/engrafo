//@flow
import citations from "./citations";
import footnotes from "./footnotes";
import highlightRange from "./highlight";
import setupReact from "./setup-react";
import debounce from "./debounce";

export default function main(el: ?Element): void {
  if (!el) return;
  citations(el);
  footnotes(el);
  setupReact(el);

  let active_ranges = new Set();
  document.addEventListener(
    "selectionchange",
    debounce(() => {
      let selection = window.getSelection();
      active_ranges.forEach(
        unhighlight => unhighlight instanceof Function && unhighlight()
      );
      active_ranges.clear();
      for (let i = 0; i < selection.rangeCount; ++i) {
        let range = selection.getRangeAt(i);
        let undo = highlightRange(range, "highlight");
        active_ranges.add(undo);
      }
    }, 500)
  );
}
