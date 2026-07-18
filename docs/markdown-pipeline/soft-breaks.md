# 本文中の改行の `<br>` 反映（soft-breaks）

執筆者向けの記法説明は [`../markdown-notation/rule.md`](../markdown-notation/rule.md)「段落と改行」を参照。

## 記法

```md
1行目
2行目

次の段落
```

段落内の単一改行（ソフトブレーク）を `<br>` として出力する（Zenn等と同じ挙動）。
空行はパーサーが段落区切り（`<p>`の分割）として先に処理するため本プラグインの対象外で、従来どおり段落間の余白になる。

## 実装方式

- CommonMarkのソフトブレークは、mdastでは**textノードの`value`内の改行文字`\n`**として現れる（独立ノードにならない。行末2スペース／バックスラッシュのハードブレークは元から`break`ノードで`<br>`になる）
- SätteriおよびAstroの`satteri()`に`breaks: true`相当のネイティブオプションは**存在しない**（`satteri/index.d.ts`の`JsFeatures`に該当トグルなし。2026-07-18時点 satteri 0.9.x）ため、mdastプラグインで変換する
- `text` visitorで`value`を`\n`で分割し、間に`{ type: "break" }`を挟んだノード列に差し替える
- `replaceNode`は単一ノード限定のため、`insertBefore(node, pieces)` + `removeNode(node)`で分割する（[satteri-plugin-api.md](satteri-plugin-api.md)「ノード操作API」）

## 雛形コード

実装本体: [`plugins/soft-breaks.mjs`](../../plugins/soft-breaks.mjs)

```js
import { defineMdastPlugin } from "satteri";

export const softBreaks = defineMdastPlugin({
  name: "soft-breaks",
  text(node, ctx) {
    if (!node.value.includes("\n")) return;
    const parts = node.value.split("\n");
    const pieces = [];
    parts.forEach((seg, i) => {
      if (i > 0) pieces.push({ type: "break" });
      if (seg) pieces.push({ type: "text", value: seg });
    });
    ctx.insertBefore(node, pieces);
    ctx.removeNode(node);
  },
});
```

## 落とし穴と回避策

- **コードブロック・インラインコードは無傷**: `text` visitorは`code`/`inlineCode`の中身には呼ばれない（satteri-plugin-api.md「その他の実測済み挙動」）ため、購読モデルだけで誤変換が防げる
- **無限ループしない**: 自プラグインが生成したノードは自分では再訪問されない
- **登録順は末尾**: wikilink・directives・linkCardはtextノードの内容・段落構造を前提に動くため、text分割で干渉しないよう`mdastPlugins`の最後（externalLinksの後）に置く
- 行頭・行末が`\n`に接するケース（例: 強調直後の改行で`"\nbar"`のようなtextノード）は、`split`の空セグメントをスキップすることで空textノードを生成しない

## 制約・残課題

- テーブルセル内はmdast上そもそも改行を含められないため対象外（セル内改行は従来どおり`<br>`手書き。ui-design-spec「テーブル」参照）
- mermaid記法・数式等、textノードを経由しないコンテンツには影響しない
