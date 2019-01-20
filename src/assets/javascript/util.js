//@flow

export function zip2<A, B>(
  arr1: $ReadOnlyArray<A>,
  arr2: $ReadOnlyArray<B>
): Array<[A, B]> {
  let min_length = Number.MAX_SAFE_INTEGER;
  for (let arr of [arr1, arr2]) {
    min_length = arr.length < min_length ? arr.length : min_length;
  }

  let res = [];
  for (let idx = 0; idx < min_length; idx++) {
    res.push([arr1[idx], arr2[idx]]);
  }

  return res;
}

export function zip3<A, B, C>(
  arr1: $ReadOnlyArray<A>,
  arr2: $ReadOnlyArray<B>,
  arr3: $ReadOnlyArray<C>
): Array<[A, B, C]> {
  let min_length = Number.MAX_SAFE_INTEGER;
  for (let arr of [arr1, arr2, arr3]) {
    min_length = arr.length < min_length ? arr.length : min_length;
  }

  let res = [];
  for (let idx = 0; idx < min_length; idx++) {
    res.push([arr1[idx], arr2[idx], arr3[idx]]);
  }

  return res;
}

export function getArxivId(): string {
  if (window && window.arxivId && window.arxivId instanceof String) {
    return window.arxivId;
  } else {
    return "__TEST__";
  }
}
