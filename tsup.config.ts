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
  },
  {
    entry: ["src/server.ts"],
    format: ["cjs", "esm"],
    ...sharedConfig,
    platform: "node",
  },
  {
    entry: ["src/client.ts"],
    format: ["cjs", "esm"],
    ...sharedConfig,
    platform: "browser",
  },
]);
