/** @type {import('jest').Config} */
const config = {
  transform: {
    "^.+\\.(ts|js)$": [
      "@swc/jest",
      {
        jsc: {
          baseUrl: ".",
          parser: {
            syntax: "typescript",
            tsx: true,
            dynamicImport: true,
          },
          paths: {
            "@core/*": ["./src/core/*"],
            "@lib/*": ["./src/lib/*"],
            "@mocks/*": ["./src/mocks/*"],
            "@models/*": ["./src/models/*"],
          },
          target: "esnext",
        },
      },
    ],
  },
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default config;
