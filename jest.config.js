module.exports = {
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
            "@models/*": ["./src/models/*"],
            "@lib/*": ["./src/lib/*"],
            
          },
          target: "esnext",
        },
      },
    ],
  },
};
