import { merge } from "lodash-es";
import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";

export default defineConfig(({ mode }) => {
  const target = mode;
  return {
    plugins: [
      webExtension({
        manifest: () => merge(require("./manifests/base.json"), require(`./manifests/${target}.json`)),
        additionalInputs: [
          "src/content/auchan.ts",
          "src/content/delivery_club.ts",
          "src/content/kuper.ts",
          "src/content/lavka.ts",
          "src/content/lenta.ts",
          "src/content/magnit.ts",
          "src/content/ozon.ts",
          "src/content/perekrestok.ts",
          "src/content/pyaterochka.ts",
          "src/content/samberi.ts",
          "src/content/samokat.ts",
          "src/content/metro.ts",
        ],
        browser: target,
      }),
    ],
    build: {
      outDir: `dist/${target}`,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };
});
