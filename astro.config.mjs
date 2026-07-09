// @ts-check
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import tailwindcss from "@tailwindcss/vite";

import { loadDictIndex } from "./plugins/dict-index.mjs";
import { wikilink } from "./plugins/wikilink.mjs";

// 辞書索引はconfig評価時に直読みで構築する（コレクションAPIはこの時点で使えない）。
const dictIndex = loadDictIndex(new URL("./content/dict/", import.meta.url));

// Sätteriの残りプラグイン（directives / link-card / mermaid / shiki設定）は P2 で追加する。
export default defineConfig({
  site: "https://progrust.com",
  markdown: {
    processor: satteri({
      mdastPlugins: [wikilink(dictIndex)],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
