import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: true,
  clean: true,
  treeshake: true,
  shims: true,
});
