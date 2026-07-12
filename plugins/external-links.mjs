// @ts-check
// 本文中の外部テキストリンク（http(s)://始まり）に target="_blank" rel="noopener noreferrer" を
// 付与するmdastプラグイン（docs/markdown-pipeline/external-links.md、spec: docs/spec/pages.md R-24）。
// - 内部リンク（相対・/始まり）とwikilink（/dict/… の内部パス）はスキーム判定で素通り。
// - リンクカードは linkCard が段落ごと rawHtml に差し替えるため本プラグインの対象外
//   （カード側の <a> は link-card.mjs がHTMLに直書きする）。
// - スキームは大文字（HTTPS://。URLとして有効）も外部リンクなので i フラグで拾う
//   （link-card.mjs の内部リンク除外ガードと同じ判定）。
import { defineMdastPlugin } from "satteri";

export const externalLinks = defineMdastPlugin({
  name: "external-links",
  link(node, ctx) {
    if (!/^https?:\/\//i.test(node.url)) return;
    // ノードは読み取り専用（Rust側参照）のため、直接ミューテーションではなく
    // setProperty で data ごと差し替える（satteri-plugin-api.md「ノード操作API」）。
    ctx.setProperty(node, "data", {
      ...node.data,
      hProperties: {
        ...node.data?.hProperties,
        target: "_blank",
        rel: "noopener noreferrer",
      },
    });
  },
});
