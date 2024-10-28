import { defineConfig, Options } from "tsup";

const sharedConfig: Options = {
  dts: true,
  splitting: true,
  clean: true,
  treeshake: true,
  shims: true,
  minify: true,
};

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
    ...sharedConfig,
    platform: "neutral",
    name: "MAIN",
  },
  {
    entry: ["src/client.ts"],
    format: ["esm"],
    ...sharedConfig,
    platform: "browser",
    name: "CLIENT",
  },
  {
    entry: ["src/lib/stream-list-diff/client/worker/web-worker.ts"],
    format: ["esm"],
    ...sharedConfig,
    splitting: false,
    platform: "browser",
    name: "WEB WORKER",
  },
  {
    entry: ["src/server.ts"],
    format: ["cjs"],
    ...sharedConfig,
    platform: "node",
    name: "SERVER",
  },
  {
    entry: ["src/lib/stream-list-diff/server/worker/node-worker.ts"],
    format: ["cjs"],
    ...sharedConfig,
    splitting: false,
    shims: false,
    platform: "node",
    name: "NODEJS WORKER",
  },
]);
