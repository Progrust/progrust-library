# playground（Rust Playgroundリンクボタン）

フェンスメタに `playground` を持つRustコードブロックへ「Playgroundで開く」ボタンを付与するmdastプラグイン（要求仕様: `../spec/pages.md` R-23・R-25 / スタイル実体: `src/styles/global.css`）。リンクURLはビルド時に静的生成し、クライアントJSは使わない。

## 記法

` ```rust playground `（`../markdown-notation/rule.md`「Rust Playgroundで開くボタンを表示する」）。ファイル名記法との併用 ` ```rust:main.rs playground ` も可。

## 実装方式

mdast層の `code` visitorで `lang === "rust"` かつ metaの空白区切りトークンに `playground` を含むノードを捕捉し、`ctx.replaceNode` で以下に置換する:

- 新codeノード（metaから `playground` トークンのみ除去。他トークンは温存）。**値は原文のまま**（Shikiのdiff等の記法にマーカーが必要なため）
- `<a class="playground-open" target="_blank" rel="noopener noreferrer">` （hrefは `https://play.rust-lang.org/?version=stable&edition=2024&code=` + `encodeURIComponent(stripCodeNotation(コード全文))`）
- 両者を `data.hName` 方式で `<div class="code-playground">` に包む（`codeFilename` と同パターン）

`stripCodeNotation`（`plugins/code-notation.mjs`。R-25）はコード記法コメントを行単位で処理する。`scripts/check-dict-code.mjs`（rustc検証）も同じ関数を使い、「表示用のコード」と「そのまま動くコード」の変換規則を一本化している:

| 入力行 | 出力 |
| --- | --- |
| `let x = 1; // [!code --]` | （行ごと削除） |
| `let x = 2; // [!code ++]` | `let x = 2;` |
| `..base // 引き継ぐ [!code ++]` | `..base // 引き継ぐ` |
| `// [!code highlight]` | （行ごと削除） |

設計判断:

- **mdast層を採用**: hast層ではShiki実行後でコードブロックが `raw` ノードになり操作できない（[shiki.md](shiki.md)と同じ理由）。またmdast層なら `node.value` からコード全文を直接取れる
- **ボタンを `<pre>` の外側（ラッパ直下）に置く**: `<pre>` は `overflow-x: auto` で横スクロールするため、内側に置くとボタンがコードと一緒に流れる。`position: relative` のラッパ + `position: absolute` で右上固定にする
- **マーカー除去はhref側だけ**: 表示用codeノードから消すとShikiの `transformerNotationDiff` が効かない。「表示は原文 / リンクは実行可能コード」の非対称は意図的
- **行末 `//` の除去は `$` 固定の正規表現**で行う。行内に文字列リテラル `"a // b"` があっても、最後の `//` （＝コメント開始）だけが対象になる
- 無状態のため定義オブジェクト直export（ファクトリ不要）

## 雛形コード（動作確認済み）

### astro.config.mjs

```js
import { playgroundLink } from './plugins/playground-link.mjs';
// …
// 順序: codeFilename（lang補正）→ playgroundLink（meta判定）
mdastPlugins: [codeFilename, playgroundLink, wikilink(dictIndex), directives, linkCard()],
```

### 変換プラグイン（`plugins/playground-link.mjs`）

実体は `plugins/playground-link.mjs` を参照（本文書の記載と同一方式）。骨格:

```js
import { defineMdastPlugin } from "satteri";

import { stripCodeNotation } from "./code-notation.mjs";

const PLAYGROUND_URL = "https://play.rust-lang.org/?version=stable&edition=2024&code=";

export const playgroundLink = defineMdastPlugin({
  name: "playground-link",
  code(node, ctx) {
    if (node.lang !== "rust" || typeof node.meta !== "string") return;
    const tokens = node.meta.split(/\s+/).filter(Boolean);
    if (!tokens.includes("playground")) return;

    const restMeta = tokens.filter((t) => t !== "playground").join(" ");
    const newCode = { type: "code", lang: "rust", meta: restMeta || null, value: node.value };
    const anchor = {
      type: "paragraph",
      data: {
        hName: "a",
        hProperties: {
          class: "playground-open",
          href: PLAYGROUND_URL + encodeURIComponent(stripCodeNotation(node.value)),
          target: "_blank",
          rel: "noopener noreferrer",
        },
      },
      children: [{ type: "text", value: "Playgroundで開く" }],
    };
    const wrapper = {
      type: "paragraph",
      data: { hName: "div", hProperties: { class: "code-playground" } },
      children: [newCode, anchor],
    };
    ctx.replaceNode(node, wrapper);
  },
});
```

## 落とし穴と回避策

- **プラグイン順序は `codeFilename` の後**。` ```rust:main.rs playground ` は素の状態では `lang="rust:main.rs"` のため本プラグインの `lang === "rust"` 判定に落ちる。`codeFilename` が先にlangを補正し（metaは温存して）新codeノードを生成し、「前段が生成したノードを後段は訪問できる」（[satteri-plugin-api.md](satteri-plugin-api.md)）ため後置で両立する
- **`<pre>` の横スクロールとボタン位置**: ボタンはラッパ（`.code-playground`）直下に置く。`<pre>` 内に置くとスクロールに追従してしまう
- **URL長**: コード全文がURLクエリに乗る。ブラウザ実用上は数十KBまで動くが、極端に長いコードでは共有性が下がる（Playground側のGist共有を使う運用でカバー。ビルドでの上限チェックは設けない）
- 「自プラグインが生成したノードは自分では再訪問されない」ため、生成した新codeノードで無限ループはしない（metaからも `playground` を除去しているため二重に安全）

## 制約・残課題

- edition は 2024 固定（`version=stable`）。ブロック別のedition/channel指定（例: ` ```rust playground:nightly `）は必要になったら拡張する
- `stripCodeNotation` は**範囲指定記法（`[!code --:3]` のように後続N行に効く形）に未対応**。マーカーの付いた1行しか落とさないため、削除行は1行ずつ `[!code --]` を書く。範囲記法を使いたくなったら拡張する
- コード中の文字列リテラルに `[!code ...]` という文字列そのものを書いた場合は誤除去される（記法の解説を書くときはPlaygroundボタンを付けない運用でカバー）
- 実行ボタン（ページ内で `evaluate.json` APIを叩き結果をインライン表示）は本プラグインの範囲外。必要になったらクライアントJSとして別途設計する
