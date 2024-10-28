/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
import { execSync } from "child_process";
import { existsSync } from "fs"

// The src/lib/stream-list-diff/server/node-worker.ts file needs to be transpiled to a .cjs file to be used in the tests.
const workerFile = "src/lib/stream-list-diff/server/worker/node-worker"

try {
  if(!existsSync(`${workerFile}.cjs`)){
    execSync(`npx esbuild ${workerFile}.ts --bundle --platform=node --format=cjs --outfile=${workerFile}.cjs`, {
      stdio: "inherit",
    });
  }
} catch (_) {
  process.exit(1);
}