// @ts-check
// ```rust playground メタ付きコードブロックに「Playgroundで開く」ボタンを付与するmdast前処理プラグイン
// （docs/markdown-pipeline/playground.md、spec: docs/spec/pages.md R-23）。
// 記法は docs/markdown-notation/rule.md「Rust Playgroundで開くボタンを表示する」に従う。
// リンクURLはビルド時に静的生成する（クライアントJSなし）。
// ボタンは <pre> の横スクロールに追従させないため、pre の外側（.code-playground直下）に置き、
// CSS（src/styles/global.css）で右上に絶対配置する。
// ※登録は codeFilename の後に置くこと（```rust:main.rs playground はcodeFilenameのlang補正後で
//   ないと lang === "rust" 判定に落ちる。前段が生成したノードを後段は訪問できる仕様に依存）。
import { defineMdastPlugin } from "satteri";

const PLAYGROUND_URL =
  "https://play.rust-lang.org/?version=stable&edition=2024&code=";

export const playgroundLink = defineMdastPlugin({
  name: "playground-link",
  code(node, ctx) {
    if (node.lang !== "rust" || typeof node.meta !== "string") return;
    const tokens = node.meta.split(/\s+/).filter(Boolean);
    if (!tokens.includes("playground")) return;

    // playgroundトークンのみ除去し、他のメタ（将来の拡張やShiki向け）は温存する。
    const restMeta = tokens.filter((t) => t !== "playground").join(" ");
    const newCode = {
      type: "code",
      lang: "rust",
      meta: restMeta || null,
      value: node.value,
    };

    const anchor = {
      type: "paragraph",
      data: {
        hName: "a",
        hProperties: {
          class: "playground-open",
          href: PLAYGROUND_URL + encodeURIComponent(node.value),
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

    // data.hName 方式の型橋渡しは codeFilename と同様（satteri-plugin-api.md）。
    const content = /** @type {import('satteri').MdastContent} */ (
      /** @type {unknown} */ (wrapper)
    );
    ctx.replaceNode(node, content);
  },
});
