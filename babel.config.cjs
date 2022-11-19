module.exports = (api) => ({
  plugins: [
    [
      "./src/index.js",
      {
        polyfill: api.cache.using(() => Boolean(process.env.IMPORT_ESTOKEN))
          ? "import"
          : "inline",
      },
    ],
  ],
});
