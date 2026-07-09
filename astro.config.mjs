// @ts-check
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import tailwindcss from "@tailwindcss/vite";

import { loadDictIndex } from "./plugins/dict-index.mjs";
import { wikilink } from "./plugins/wikilink.mjs";
import { validateChapters } from "./plugins/chapter-order.mjs";
import { validateWikilinks } from "./plugins/validate-wikilinks.mjs";

// ビルド時検証3種はconfig評価時に実行する（content-model AC-2/AC-5/AC-9/AC-10）。
// コレクション経由のvisitor throwはglob loaderに握り潰されexit 0になるため、
// レンダリングとは別にconfig評価時のthrowで確実にビルドを失敗させる
// （[markdown-pipeline/wikilink.md] の検証結果を参照）。
// 辞書索引はconfig評価時に直読みで構築する（コレクションAPIはこの時点で使えない）。
// loadDictIndex は索引構築時に辞書ファイル名の一意性（R-6）も検証する。
const dictIndex = loadDictIndex(new URL("./content/dict/", import.meta.url));
// 章の連番形式・重複（R-9）を検証する。
validateChapters(new URL("./content/books/", import.meta.url));
// wikilinkのリンク切れ・公開非対称（R-13/R-14）を全コンテンツで検証する。
validateWikilinks(dictIndex, new URL("./content/", import.meta.url));

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
