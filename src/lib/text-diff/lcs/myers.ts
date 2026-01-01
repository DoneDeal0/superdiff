import { TextStatus, TextToken } from "@models/text";

type MyersEdit =
  | { status: TextStatus.EQUAL; prev: number; curr: number }
  | { status: TextStatus.ADDED; curr: number }
  | { status: TextStatus.DELETED; prev: number };

function backtrack(
  trace: Map<number, number>[],
  a: TextToken[],
  b: TextToken[],
): MyersEdit[] {
  let x = a.length;
  let y = b.length;
  const edits: MyersEdit[] = [];

  for (let d = trace.length - 1; d >= 0; d--) {
    const v = trace[d];
    const k = x - y;

    let prevK: number;
    if (k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0))) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = v.get(prevK) ?? 0;
    const prevY = prevX - prevK;

    // Snake (equal)
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

    // Edit step
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

  const trace: Map<number, number>[] = [];
  const v = new Map<number, number>();
  v.set(1, 0);

  for (let d = 0; d <= max; d++) {
    const vSnapshot = new Map(v);

    for (let k = -d; k <= d; k += 2) {
      let x: number;

      if (k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0))) {
        // Down (insert)
        x = v.get(k + 1) ?? 0;
      } else {
        // Right (delete)
        x = (v.get(k - 1) ?? 0) + 1;
      }

      let y = x - k;

      // Snake (match)
      while (x < N && y < M && a[x].normalizedValue === b[y].normalizedValue) {
        x++;
        y++;
      }

      v.set(k, x);

      if (x >= N && y >= M) {
        trace.push(vSnapshot);
        return backtrack(trace, a, b);
      }
    }

    trace.push(vSnapshot);
  }

  return [];
}
