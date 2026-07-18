// @ts-check
// 段落内の単一改行（ソフトブレーク）を <br> として出力するmdastプラグイン
// （docs/markdown-pipeline/soft-breaks.md、記法: docs/markdown-notation/rule.md「段落と改行」）。
// - ソフトブレークはmdastではtextノードのvalue内の "\n" として現れるため、
//   "\n" で分割し間に break ノードを挟んだノード列へ差し替える。
// - 空行は段落区切りとしてパース済みでtextノードに残らないため、<br> にはならない。
// - text visitorは code / inlineCode の中身には呼ばれない（satteri-plugin-api.md）ため
//   コードブロックは無傷。
// - wikilink・directives・linkCard等はtext内容を前提に動くため、本プラグインは
//   mdastPluginsの末尾に登録する（soft-breaks.md「落とし穴と回避策」）。
import { defineMdastPlugin } from "satteri";

export const softBreaks = defineMdastPlugin({
  name: "soft-breaks",
  text(node, ctx) {
    if (!node.value.includes("\n")) return;
    const parts = node.value.split("\n");
    /** @type {import('satteri').MdastContent[]} */
    const pieces = [];
    parts.forEach((seg, i) => {
      if (i > 0) pieces.push({ type: "break" });
      // 行頭・行末が改行に接すると空セグメントが生じるため、空textノードは作らない
      if (seg) pieces.push({ type: "text", value: seg });
    });
    // replaceNodeは単一ノード限定のため insertBefore + removeNode で分割する
    ctx.insertBefore(node, pieces);
    ctx.removeNode(node);
  },
});
