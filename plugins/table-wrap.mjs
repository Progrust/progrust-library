// @ts-check
// 本文のGFMテーブルを、カード面フレーム兼横スクロールコンテナの
// <div class="table-wrap"> で包むhastプラグイン（docs/markdown-pipeline/table-wrap.md）。
// 見た目は docs/ui-design/ui-design-spec.md「テーブル」、要求は docs/spec/pages.md R-22。
// - GFMテーブルはhastに素の element（tagName: "table"）で届く（rawになるのはShiki出力のみ）。
// - wrapNode は node を parentNode の先頭子にする（hast-visitor.d.ts の仕様）ため、
//   children: [] の新規divを渡すだけで <div class="table-wrap"><table>…</table></div> になる。
// - 新規生成ノードのため properties はリテラル直書き（setProperty不可。satteri-plugin-api.md）。
// - 無状態のため定義オブジェクト直export（codeFilename / directives と同形式）。
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
