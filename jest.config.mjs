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
            "@mocks/*": ["./src/mocks/*"],
            "@models/*": ["./src/models/*"],
            "@lib/*": ["./src/lib/*"],
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
