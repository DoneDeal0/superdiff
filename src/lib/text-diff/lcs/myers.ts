import { TextStatus, TextToken } from "@models/text";

type MyersEdit =
  | { status: TextStatus.EQUAL; prev: number; curr: number }
  | { status: TextStatus.ADDED; curr: number }
  | { status: TextStatus.DELETED; prev: number };

type Trace = Int32Array[];

function readDiagonal(trace: Int32Array, k: number, d: number): number {
  const index = k + (d + 1);
  if (index < 0 || index >= trace.length) return 0;
  return trace[index];
}

function backtrack(trace: Trace, a: TextToken[], b: TextToken[]): MyersEdit[] {
  let x = a.length;
  let y = b.length;
  const edits: MyersEdit[] = [];

  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d];
    const k = x - y;

    let prevK: number;
    if (
      k === -d ||
      (k !== d && readDiagonal(v, k - 1, d) < readDiagonal(v, k + 1, d))
    ) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = readDiagonal(v, prevK, d);
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      edits.push({
        status: TextStatus.EQUAL,
        prev: x - 1,
        curr: y - 1,
      });
      x--;
      y--;
    }

    if (d === 0) break;

    if (x === prevX) {
      edits.push({
        status: TextStatus.ADDED,
        curr: y - 1,
      });
      y--;
    } else {
      edits.push({
        status: TextStatus.DELETED,
        prev: x - 1,
      });
      x--;
    }
  }

  return edits.reverse();
}

export function myersDiff(a: TextToken[], b: TextToken[]): MyersEdit[] {
  const N = a.length;
  const M = b.length;
  const max = N + M;

  const trace: Trace = [];
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);

  for (let d = 0; d <= max; d++) {
    trace.push(v.slice(offset - d - 1, offset + d + 2));

    for (let k = -d; k <= d; k += 2) {
      let x: number;

      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
        x = v[offset + k + 1];
      } else {
        x = v[offset + k - 1] + 1;
      }

      let y = x - k;

      while (x < N && y < M && a[x].normalizedValue === b[y].normalizedValue) {
        x++;
        y++;
      }

      v[offset + k] = x;

      if (x >= N && y >= M) {
        return backtrack(trace, a, b);
      }
    }
  }

  return [];
}
