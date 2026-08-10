import { defineConfig, type Options } from "tsdown";

const sharedConfig: Options = {
  dts: true,
  treeshake: true,
  shims: true,
  minify: true,
  clean: false,
  tsconfig: "tsconfig.build.json",
};

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    ...sharedConfig,
    clean: true,
    platform: "neutral",
  },
  {
    entry: ["src/client.ts"],
    format: ["esm"],
    ...sharedConfig,
    platform: "browser",
  },
  {
    entry: ["src/lib/stream-list-diff/client/worker/web-worker.ts"],
    format: ["esm"],
    ...sharedConfig,
    platform: "browser",
  },
  {
    entry: ["src/server.ts"],
    format: ["cjs"],
    ...sharedConfig,
    platform: "node",
  },
  {
    entry: ["src/lib/stream-list-diff/server/worker/node-worker.ts"],
    format: ["cjs"],
    ...sharedConfig,
    shims: false,
    platform: "node",
  },
]);
