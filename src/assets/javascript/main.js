import citations from "./citations";
import footnotes from "./footnotes";
import highlightRange from "./highlight";
import debounce from "./debounce";

export default function main(el) {
  citations(el);
  footnotes(el);

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
        active_ranges.add(highlightRange(range, "highlight"));
      }
    }, 500)
  );
}
