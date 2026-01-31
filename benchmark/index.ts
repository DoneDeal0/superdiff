import {
  runObjectBench10K,
  runObjectBench100K,
  runNestedObjectBench,
} from "./objects";
import { runListBench100K, runListBench10K } from "./lists";
import { runTextBench10KWords, runTextBench10KSentences } from "./texts";

// Method: Warm up runs, then each script is executed 20 times, and we keep the median time.
// To guarantee a fair assessment, all scenarios must be run individually, with a clean heap memory.
// Run the benchmarks script individually rather than all together.

console.log("- SUPERDIFF BENCHMARKS -");

// Objects
runObjectBench10K();
runObjectBench100K();
runNestedObjectBench();

// List
runListBench10K();
runListBench100K();

// Text
runTextBench10KWords();
runTextBench10KSentences();

console.log("\n- BENCHMARK COMPLETE -");
