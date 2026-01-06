function now() {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function bench(name: string, runs: number, fn: () => void) {
  // warmup
  for (let i = 0; i < 5; i++) fn();

  const times: number[] = [];

  for (let i = 0; i < runs; i++) {
    const start = now();
    fn();
    times.push(now() - start);
  }

  const result = median(times);
  console.log(`${name}: ${result.toFixed(2)} ms`);
  return result;
}

export async function benchAsync(
  name: string,
  runs: number,
  fn: () => Promise<void>,
) {
  // warmup
  await fn();

  const start = performance.now();
  for (let i = 0; i < runs; i++) {
    await fn();
  }
  const end = performance.now();

  const avg = (end - start) / runs;
  console.log(`${name}: ${avg.toFixed(2)} ms`);
  return avg;
}
