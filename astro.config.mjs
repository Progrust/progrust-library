// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import { transformerNotationDiff } from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";

import { loadDictIndex } from "./plugins/dict-index.mjs";
import { wikilink } from "./plugins/wikilink.mjs";
import { directives } from "./plugins/directives.mjs";
import { codeFilename } from "./plugins/code-filename.mjs";
import { playgroundLink } from "./plugins/playground-link.mjs";
import { linkCard } from "./plugins/link-card.mjs";
import { externalLinks } from "./plugins/external-links.mjs";
import { validateChapters } from "./plugins/chapter-order.mjs";
import { validateWikilinks } from "./plugins/validate-wikilinks.mjs";
import { mermaid } from "./plugins/mermaid.mjs";
import { tableWrap } from "./plugins/table-wrap.mjs";
import {
  progrustCodeTheme,
  transformerCodeBg,
} from "./plugins/shiki-theme.mjs";

// ビルド時検証3種はconfig評価時に実行する（content-model AC-2/AC-5/AC-9/AC-10）。
// コレクション経由のvisitor throwはglob loaderに握り潰されexit 0になるため、
// レンダリングとは別にconfig評価時のthrowで確実にビルドを失敗させる
// （[markdown-pipeline/wikilink.md] の検証結果を参照）。
// 辞書索引はconfig評価時に直読みで構築する（コレクションAPIはこの時点で使えない）。
// loadDictIndex は索引構築時に辞書ファイル名の一意性（content-model R-6）も検証する。
const dictIndex = loadDictIndex(new URL("./content/dict/", import.meta.url));
// 章の連番形式・重複（content-model R-9）を検証する。
validateChapters(new URL("./content/books/", import.meta.url));
// wikilinkのリンク切れ・公開非対称（content-model R-13/R-14）を全コンテンツで検証する。
validateWikilinks(dictIndex, new URL("./content/", import.meta.url));

// directive: true は本文中の「x:y」等をtextDirective化して消す副作用があるため、
// directivesプラグインに同梱した復元visitorとセットで有効化する（directives.md）。
export default defineConfig({
  site: "https://progrust.com",
  // sitemap.xml を自動生成する（feeds-meta R-4 / AC-2）。非公開コンテンツは本番ビルドで
  // ページ生成されないため sitemap にも自然に含まれない（content-model R-11）。
  integrations: [sitemap()],
  // フォントはFonts APIでセルフホストする（ui-design-spec「タイポグラフィ」）。ビルド時に
  // Googleから取得し自オリジン配信にする（Firefoxのフォントスワップ時全画面再レイアウトによる
  // 点滅の緩和）。日本語スライス（unicode-range分割）はGoogle css2応答でコメントなしの
  // @font-face のため unifont の subsets フィルタを素通りして常に含まれる（subsets には
  // 名前付きサブセットのみ列挙すればよい）。weights / styles はデフォルトが [400] /
  // ["normal","italic"] のため明示指定が必須。
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Zen Kaku Gothic New",
      cssVariable: "--font-zen-kaku",
      weights: [500, 700, 900],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Zen Maru Gothic",
      cssVariable: "--font-zen-maru",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains",
      weights: [400, 600],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      // 日本語monoのフォールバック連鎖（ui-design-spec）を維持する
      fallbacks: ["Zen Kaku Gothic New", "monospace"],
    },
  ],
  markdown: {
    // mermaid は Shiki除外する（★satteri()引数ではなく markdown 直下）。除外しないと
    // mermaid が Shiki でハイライトされ raw ノード化し、mermaidプラグインの element visitor に
    // 届かない（未知langで data-language=plaintext フォールバックする）。詳細は mermaid.md。
    syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid"] },
    // Shiki設定は satteri() の引数ではなく markdown 直下に置く（satteri()は shikiConfig を
    // 黙って無視し、Astroが createRenderer 経由で別途Sätteriへ渡すため）。詳細は shiki.md。
    shikiConfig: {
      // カスタムsingle theme（確定4色パレット。plugins/shiki-theme.mjs）。
      // E案によりシンタックス配色は両テーマ共通のためdual themeは使わない（theme.md R-5）。
      // preに焼き込まれるインラインの背景・前景は transformerCodeBg で除去し、
      // 背景・枠線のテーマ切替は global.css の .astro-code 側で行う。
      theme: progrustCodeTheme,
      // diff表示: // [!code ++] / [!code --] を除去し diff add/remove クラスを付与する。
      transformers: [transformerNotationDiff(), transformerCodeBg],
    },
    processor: satteri({
      features: { directive: true },
      // codeFilename は ```lang:file のlang補正のため他プラグインより前に置く（shiki.md）。
      // playgroundLink はlang補正後のmetaを読むため codeFilename の直後（playground.md）。
      // externalLinks は末尾（linkCardが段落ごとrawHtml化した後の残りのテキストリンクだけが対象。
      // 順序: codeFilename → playgroundLink → wikilink → directives → linkCard → externalLinks。architecture.md §4）。
      mdastPlugins: [
        codeFilename,
        playgroundLink,
        wikilink(dictIndex),
        directives,
        linkCard(),
        externalLinks,
      ],
      // mermaid はビルド時SVG化のhastプラグイン（ファクトリ形式・文書ごとの図カウンタを持つ）。
      // Shiki実行後のhast段階で素の <pre><code data.lang=mermaid> を捕捉する（mermaid.md）。
      // tableWrap はGFMテーブルを .table-wrap で包む（pre/tableで捕捉対象が異なり相互作用なし。table-wrap.md）。
      hastPlugins: [mermaid(), tableWrap],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
