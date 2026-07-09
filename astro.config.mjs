// @ts-check
import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import { transformerNotationDiff } from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";

import { loadDictIndex } from "./plugins/dict-index.mjs";
import { wikilink } from "./plugins/wikilink.mjs";
import { directives } from "./plugins/directives.mjs";
import { codeFilename } from "./plugins/code-filename.mjs";
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

// Sätteriの残りプラグイン（link-card / mermaid）は P2 の後続タスクで追加する。
// directive: true は本文中の「x:y」等をtextDirective化して消す副作用があるため、
// directivesプラグインに同梱した復元visitorとセットで有効化する（directives.md）。
export default defineConfig({
  site: "https://progrust.com",
  markdown: {
    // Shiki設定は satteri() の引数ではなく markdown 直下に置く（satteri()は shikiConfig を
    // 黙って無視し、Astroが createRenderer 経由で別途Sätteriへ渡すため）。詳細は shiki.md。
    shikiConfig: {
      // dual theme。defaultColor:false でトークンは実colorを持たず
      // --shiki-light / --shiki-dark のCSS変数のみ出力する（html.dark切替CSSはP6で入れる）。
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      // diff表示: // [!code ++] / [!code --] を除去し diff add/remove クラスを付与する。
      transformers: [transformerNotationDiff()],
    },
    processor: satteri({
      features: { directive: true },
      // codeFilename は ```lang:file のlang補正のため他プラグインより前に置く（shiki.md）。
      mdastPlugins: [codeFilename, wikilink(dictIndex), directives],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
