# table-wrap（テーブルの横スクロールラッパ）

本文のGFMテーブルを `<div class="table-wrap">` で包むhastプラグイン。ラッパはカード面フレーム兼横スクロールコンテナになる（要求仕様: `../spec/pages.md` R-22 / 見た目: `../ui-design/ui-design-spec.md`「テーブル」/ スタイル実体: `src/styles/global.css`）。

## 記法

GFMパイプテーブル（`../markdown-notation/rule.md`「テーブル」）。執筆記法の変更はなし — このプラグインは出力構造だけを変える。

## 実装方式

hast層で `element: { filter: ["table"] }` により `<table>` を捕捉し、`ctx.wrapNode` で新規divに包む。

- **hast層 `wrapNode` を採用した理由**: 既存のtableサブツリー（wikilink・インラインコード等の変換済みセル内容）を一切触らず包むだけで済む。`wrapNode(node, parentNode)` は「`node` を `parentNode` の先頭子にする」仕様（satteriの `hast-visitor.d.ts`）のため、`children: []` の新規divを渡すだけで `<div class="table-wrap"><table>…</table></div>` が得られる
- **raw置換（mermaid方式）は不採用**: table配下全体のHTML再構築が必要で壊れやすい。mermaidがrawを使うのは外部ツールがSVG文字列を返すためで、状況が異なる
- **mdast層は不採用**: mdastに「div」に対応する自然なノード型がなく、後段mdastプラグインとの順序考慮も増える。hast層は全mdast変換後なので相互作用が最小
- 無状態のため定義オブジェクト直export（`codeFilename` / `directives` と同形式。ファクトリ不要）

## 雛形コード（動作確認済み）

### astro.config.mjs

```js
import { tableWrap } from './plugins/table-wrap.mjs';
// …
hastPlugins: [mermaid(), tableWrap],
```

順序: mermaidは `pre` フィルタ・tableWrapは `table` フィルタで捕捉対象が重ならず相互作用なし。「自プラグインが生成したノードは自分では再訪問されない」（[satteri-plugin-api.md](satteri-plugin-api.md)）ため無限ラップも起きない。

### 変換プラグイン（`plugins/table-wrap.mjs`）

```js
// @ts-check
import { defineHastPlugin } from "satteri";

export const tableWrap = defineHastPlugin({
  name: "table-wrap",
  element: {
    filter: ["table"],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        type: "element",
        tagName: "div",
        properties: { className: ["table-wrap"] },
        children: [],
      });
    },
  },
});
```

## 落とし穴と回避策

- **GFMテーブルはhastで素の `element` として届く**。hastで `raw` ノードになるのはShiki処理済みコードブロックだけなので、`element` visitorで確実に捕捉できる
- **新規生成ノードに `setProperty` は使えない**（[satteri-plugin-api.md](satteri-plugin-api.md)）。`properties` をリテラル直書きする。クラスはhast慣例どおり `className: ["table-wrap"]`（配列はspace-joinでシリアライズされる）
- **プラグイン変更はContent Layerキャッシュを破棄しない**。挙動確認時は `.astro/`・`node_modules/.astro/` を削除してからビルドする

## 制約・残課題

- markdown中に直接書かれた生HTMLの `<table>` は（hastで `raw` ノードになるため）ラップ対象外。GFMパイプ記法のテーブルのみラップする
