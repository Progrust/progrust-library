// @ts-check
// ```lang:filename 記法のファイル名を分離して表示するmdast前処理プラグイン
// （docs/markdown-pipeline/shiki.md）。記法は docs/markdown-notation/rule.md「コードブロック」に従う。
// 情報文字列に空白が無いとSätteriは lang="rust:main.rs" のまま code ノードにするため、
// そのままではShikiが未知言語→plaintextへ黙ってフォールバックする（エラーにならず気づけない）。
// mdast段階でlangを実言語へ補正し、ファイル名ラベル + 補正済みcodeノードにラップして回避する。
// ※ファイル名の加工はhast側では手遅れ（AstroのハイライトプラグインがユーザーhastPluginsより先に走る）。
//   必ずmdast側の code visitor で行う（shiki.md 落とし穴3）。
import { defineMdastPlugin } from "satteri";

export const codeFilename = defineMdastPlugin({
  name: "code-filename",
  code(node, ctx) {
    if (typeof node.lang !== "string" || !node.lang.includes(":")) return;

    const idx = node.lang.indexOf(":");
    const realLang = node.lang.slice(0, idx);
    const filename = node.lang.slice(idx + 1);
    // 言語部分が空（```:main.rs）・ファイル名部分が空（```rust:）はいずれも
    // rule.md の記法（言語必須・ファイル名任意）から外れるためラップせず素通りさせる。
    if (!realLang || !filename) return;

    // 補正済みcodeノード（新規生成）。langを実言語に直す。metaはそのまま引き継ぐ。
    // 新規codeノードでも生成時にlangをリテラルで持たせれば下流のハイライトが正常に効く。
    const newCode = {
      type: "code",
      lang: realLang,
      meta: node.meta ?? null,
      value: node.value,
    };

    // ラベル + code を包むコンテナ（data.hNameで要素名を上書きする）。
    // 任意のブロックノード型 + data.hName でラップ要素を作れる（ここでは paragraph→div/span）。
    const wrapper = {
      type: "paragraph",
      data: { hName: "div", hProperties: { class: "code-block" } },
      children: [
        {
          type: "paragraph",
          data: { hName: "span", hProperties: { class: "code-filename" } },
          children: [{ type: "text", value: filename }],
        },
        newCode,
      ],
    };

    // data.hName で任意要素へ化かす方式・paragraphに code を子として持たせる構造は
    // 実行時には成立する（実ビルド確認済み）が、satteriのノード別Data型は hName や
    // ブロック子を許容しないため、unknown 経由で MdastContent へ橋渡しする。
    const content = /** @type {import('satteri').MdastContent} */ (
      /** @type {unknown} */ (wrapper)
    );
    ctx.replaceNode(node, content);
  },
});
