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
import { softBreaks } from "./plugins/soft-breaks.mjs";
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
  site: "https://blog.progrust.com",
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
      // 注意: fallbacks に他の fonts エントリ名を書いても解決されない（生成CSSの
      // ファミリ名はハッシュ付きのため素の名前ではマッチしない）。日本語グリフとの
      // 連鎖は global.css の --font-mono で変数合成する（ui-design-spec「タイポグラフィ」）。
      fallbacks: ["monospace"],
    },
    // コード用日本語等幅（T6-3確定: UDEV Gothic Regular の日本語グリフのみサブセット・
    // RFN回避のため "Progrust Code JP" にリネーム済み。半角:全角=3:5でJetBrains Monoと併用）。
    // unicodeRange により、mono指定箇所に日本語を含むページでのみダウンロードされる。
    {
      provider: fontProviders.local(),
      name: "Progrust Code JP",
      cssVariable: "--font-code-jp",
      // 単独では使わない差し込み用フォントのため最適化フォールバックは不要
      fallbacks: [],
      options: {
        variants: [
          {
            weight: 400,
            style: "normal",
            src: ["./src/assets/fonts/progrust-code-jp-400.woff2"],
            unicodeRange: [
              "U+3000-303F",
              "U+3041-309F",
              "U+30A0-30FF",
              "U+4E00-9FFF",
              "U+FF01-FF60",
              "U+FFE0-FFE6",
            ],
          },
        ],
      },
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
      // カスタムsingle theme（確定パレット6色。plugins/shiki-theme.mjs）。
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
      // externalLinks は後方（linkCardが段落ごとrawHtml化した後の残りのテキストリンクだけが対象）。
      // softBreaks は末尾（wikilink等のtext内容前提の処理が済んだ後にtextノードを分割する。soft-breaks.md）。
      // 順序: codeFilename → playgroundLink → wikilink → directives → linkCard → externalLinks → softBreaks。architecture.md §4）。
      mdastPlugins: [
        codeFilename,
        playgroundLink,
        wikilink(dictIndex),
        directives,
        linkCard(),
        externalLinks,
        softBreaks,
      ],
      // mermaid はビルド時SVG化のhastプラグイン（ファクトリ形式・文書ごとの図カウンタを持つ）。
      // Shiki実行後のhast段階で素の <pre><code data.lang=mermaid> を捕捉する（mermaid.md）。
      // tableWrap はGFMテーブルを .table-wrap で包む（pre/tableで捕捉対象が異なり相互作用なし。table-wrap.md）。
      hastPlugins: [mermaid(), tableWrap],
    }),
  },
  vite: {
    plugins: [
      tailwindcss(),
      // devサーバーの全応答をブラウザにキャッシュさせない（VS Code Simple Browser等が
      // 古いHTMLを表示し続ける事故の防止）。vite.server.headers はAstroがレンダリングする
      // HTMLに付与されないため、connectミドルウェアで全応答に付ける。configureServer は
      // devでしか呼ばれないので本番ビルド・Cloudflare Pages配信には影響しない。
      {
        name: "dev-no-cache",
        configureServer(server) {
          server.middlewares.use((_req, res, next) => {
            res.setHeader("Cache-Control", "no-store");
            next();
          });
        },
      },
    ],
  },
});
