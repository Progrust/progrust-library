# Markdownパイプライン 実装リファレンス（索引）

本ディレクトリは、Sätteri（Astro v7のMarkdownパイプライン）上でのカスタムプラグイン実装に関する**実装者向けリファレンス**。
記載内容はすべて技術検証（2026-07-07〜08、クローズ済み。経緯は `../archive/satteri-verification/` 参照）で**動作確認済み**の方式・コード・落とし穴である。

執筆者向けの記法一覧は `../markdown-notation/rule.md` を参照。

## 機能 → 文書の対応表

| 実装したい機能 | 文書 | 一言サマリ |
| --- | --- | --- |
| Sätteriプラグイン共通の書き方・落とし穴 | [satteri-plugin-api.md](satteri-plugin-api.md) | visitor購読モデル、ノード操作、**ビルドエラー化はthrow方式**、ファクトリ形式、新規ノードは`data`リテラル直埋め |
| 辞書リンク `[[slug]]` | [wikilink.md](wikilink.md) | text分割置換、辞書一覧のconfig時直読み、公開非対称ルール、リンク切れのビルドエラー化 |
| `:::message` / `:::details` / `:::figure` | [directives.md](directives.md) | `data.hName`方式のHTML変換、**textDirective復元プラグイン（必須）** |
| ベアURLのリンクカード | [link-card.md](link-card.md) | 単独ベアURL判定、async OGP fetch、ビルド跨ぎキャッシュ、**カードHTMLはblock要素開始必須** |
| mermaidのビルド時SVG化 | [mermaid.md](mermaid.md) | mermaid-isomorphic、**SVG全idの自前名前空間化が必須**、ライト/ダーク2枚埋め込み |
| コードハイライト（diff・ファイル名・dual theme） | [shiki.md](shiki.md) | **Shiki設定は`markdown.shikiConfig`直下**、transformerNotationDiff、ファイル名のmdast前処理 |
| テーブルの横スクロールラッパ | [table-wrap.md](table-wrap.md) | hast層`wrapNode`で`<table>`を`.table-wrap`divに包むだけ、生HTMLテーブルは対象外 |
| Rust Playgroundリンクボタン | [playground.md](playground.md) | ` ```rust playground `メタ判定のmdast前処理、URLはビルド時静的生成、**codeFilenameの後置必須** |

各文書は統一構成: **記法 → 実装方式 → 雛形コード → 落とし穴と回避策 → 制約・残課題**

## 検証済みバージョン

以下のバージョンで動作確認済み（2026-07-07〜08）。メジャーアップデート時は挙動の再確認を推奨。

- astro: 7.0.6 / @astrojs/markdown-satteri: 0.3.3 / satteri: 0.9.4
  - wikilinkの実ビルド（T1-3）は astro 7.0.7 / satteri 0.9.5 / js-yaml 5.2.1 で再検証済み
- @shikijs/transformers: 4.3.1
- mermaid-isomorphic: 3.1.0 / mermaid: 11.16.0 / playwright: 1.61.1（Chromium: chromium-headless-shell v1228）

## astro.config.mjs の全体像

全機能を統合した場合の設定の骨格（各プラグインの実装は各文書の雛形コードを参照）:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { transformerNotationDiff } from '@shikijs/transformers';
import { loadDictIndex } from './plugins/dict-index.mjs';
import { wikilink } from './plugins/wikilink.mjs';
import { directives } from './plugins/directives.mjs';
import { linkCard } from './plugins/link-card.mjs';
import { codeFilename } from './plugins/code-filename.mjs';
import { playgroundLink } from './plugins/playground-link.mjs';
import { mermaid } from './plugins/mermaid.mjs';
import { tableWrap } from './plugins/table-wrap.mjs';

const dictIndex = loadDictIndex(new URL('./content/dict/', import.meta.url));

export default defineConfig({
  markdown: {
    // ★ Shiki設定は satteri() の引数ではなく markdown 直下に置く（satteri()に渡しても無視される）
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      transformers: [transformerNotationDiff()],
    },
    processor: satteri({
      features: { directive: true }, // ← 有効化したら textDirective 復元プラグイン（directives.md）が必須
      mdastPlugins: [codeFilename, playgroundLink, wikilink(dictIndex), directives, linkCard()],
      hastPlugins: [mermaid(), tableWrap],
    }),
  },
});
```

## プラグインの実行順序に関する注意

- プラグインは**登録順の直列パイプライン**。前段が生成したノードを後段は訪問できる
- **ファイル名前処理（codeFilename）はmdastの早い位置**に置く（hast段階ではShiki実行後で手遅れ。詳細: [shiki.md](shiki.md)）
- **wikilink → linkCard の順**を推奨。wikilinkが生成する`link`（`/dict/…`、テキスト=title）は「テキスト===URL」条件を満たさないためカード化されない。同一パイプラインでの同時動作はT2-5で検証済み（統合テスト `tests/plugins/pipeline.test.ts` + 実ビルドdist。wikilinkはカード化されず、`/dict/…`へのfetchも発生しない）。内部リンク（`/`始まり）をfetch対象から除外するガードも入れること（詳細: [link-card.md](link-card.md)）
- Astro側のShikiハイライトはユーザーhastPluginsより**前**に実行される。ハイライト済みコードブロックはhastでは`element`ではなく`raw`ノードになる

## 全機能共通の前提

- **ビルドエラー化はvisitor内`throw`のみ有効**（`ctx.report`はAstroが読まない）。**ただしコレクション経由ではthrowもビルドを失敗させない**ため、確実なエラー化は`markdownToHtml`直呼びの検証パスで行う。詳細: [satteri-plugin-api.md](satteri-plugin-api.md)
- **文書ごとの状態を持つプラグインは必ずファクトリ形式**にする。同上
- コンテンツコレクション（Content Layer API）経由の実ビルドはwikilinkで検証済み（T1-3）: **`ctx.fileURL`は実ファイルを指す（OK）**。プラグイン変更時はContent Layerキャッシュ（`.astro/`・`node_modules/.astro/`）の削除が必要。詳細: [satteri-plugin-api.md](satteri-plugin-api.md) / [wikilink.md](wikilink.md)。directives / link-card / mermaidのコレクション経由動作はT2-1/T2-3/T2-4で各々確認済み。全プラグイン同時のコレクション経由実ビルドは、rule.md全記法を網羅した恒常テスト記事 `content/articles/markdown-notation-test.md`（debug-render経由で既定ビルドに含まれる）でT2-5で確認済み
