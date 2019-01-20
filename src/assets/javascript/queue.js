//@flow
// [0, 1, 2] enq
//  f     l
// [0, 1, 2, 3]
//  f        l
//
// [0, 1, 2] enq
//     f  l
// [3, 1, 2, 3]
//  l  f
//
// [3, 1, 2, 4]
//     b

type Dim = "X" | "Y";
type Point = { x: number, y: number };

type Rect = {
  left: number,
  top: number,
  right: number,
  bottom: number
};

function middle({ left, top, right, bottom }: Rect) {
  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2
  };
}
