// @ts-check
// :::message / :::details / :::figure を HTML要素（aside / details / figure）へ変換するmdastプラグイン
// （docs/markdown-pipeline/directives.md）。記法は docs/markdown-notation/rule.md に従う。
// features.directive を有効化すると本文中の「コロン直後に文字が続く」テキスト（12:30・x:y・キー:値等）が
// textDirective として黙って消費され消えるため、原文へ復元するvisitorを同梱する（同梱必須）。
import { fileURLToPath } from "node:url";
import { defineMdastPlugin } from "satteri";

/** @typedef {import('satteri').MdastVisitorContext} MdastVisitorContext */

// message種別（rule.mdのメッセージ種別）。属性名として現れたものをクラスへ反映する。
const MESSAGE_TYPES = [
  "info",
  "tip",
  "question",
  "success",
  "warning",
  "danger",
];

/**
 * エラーメッセージ用に「ファイル:行:列」を組み立てる。
 *
 * @param {{ position?: import('satteri').MdastNode['position'] }} node
 * @param {MdastVisitorContext} ctx
 * @returns {string}
 */
function posOf(node, ctx) {
  const file = ctx.fileURL ? fileURLToPath(ctx.fileURL) : "(不明なファイル)";
  const pos = node.position
    ? `${node.position.start.line}:${node.position.start.column}`
    : "?:?";
  return `${file}:${pos}`;
}

/**
 * 先頭childがdirectiveのlabel（`[...]`部分）のparagraphなら返す。
 * labelは「先頭childが data.directiveLabel === true のparagraph」で判定する。
 *
 * @param {{ children?: readonly import('satteri').MdastNode[] }} node
 * @returns {import('satteri').MdastNode | undefined}
 */
function labelChild(node) {
  const first = node.children?.[0];
  return first && first.type === "paragraph" && first.data?.directiveLabel
    ? first
    : undefined;
}

/**
 * textDirective / leafDirective ノードを、ソース原文の該当範囲へ復元する。
 * ※node.positionのoffsetはUTF-8のバイトオフセット（JSの文字indexではない）のため
 * Buffer でバイト単位にスライスする。position/source欠如時は `:name` でフォールバックする。
 *
 * @param {{ name: string, position?: import('satteri').MdastNode['position'] }} node
 * @param {MdastVisitorContext} ctx
 * @returns {{ type: 'text', value: string }}
 */
function restoreText(node, ctx) {
  let value;
  if (node.position && typeof ctx.source === "string") {
    value = Buffer.from(ctx.source, "utf8")
      .subarray(node.position.start.offset, node.position.end.offset)
      .toString("utf8");
  } else {
    value = `:${node.name}`;
  }
  return { type: "text", value };
}

export const directives = defineMdastPlugin({
  name: "directives",

  containerDirective(node, ctx) {
    const attrs = node.attributes ?? {};

    if (node.name === "message") {
      const type = MESSAGE_TYPES.find((t) => t in attrs);
      const label = labelChild(node);
      if (label) {
        // labelの段落をタイトル要素にする（dataは丸ごと置換されるため directiveLabel を含め直す）
        ctx.setProperty(label, "data", {
          directiveLabel: true,
          hName: "p",
          hProperties: { class: "message-title" },
        });
      }
      ctx.setProperty(node, "data", {
        hName: "aside",
        hProperties: { class: type ? `message message-${type}` : "message" },
      });
      return;
    }

    if (node.name === "details") {
      const label = labelChild(node);
      if (!label) {
        throw new Error(
          `:::details にタイトルがありません（:::details[タイトル] と書く） (${posOf(node, ctx)})`,
        );
      }
      ctx.setProperty(node, "data", { hName: "details" });
      ctx.setProperty(label, "data", {
        directiveLabel: true,
        hName: "summary",
      });
      return;
    }

    if (node.name === "figure") {
      const label = labelChild(node);
      if (!label) {
        throw new Error(
          `:::figure にキャプションがありません（:::figure[キャプション] と書く） (${posOf(node, ctx)})`,
        );
      }
      ctx.setProperty(node, "data", { hName: "figure" });
      ctx.setProperty(label, "data", {
        directiveLabel: true,
        hName: "figcaption",
      });
      // width属性を中のimgへ反映する
      if (attrs.width) {
        for (const child of node.children) {
          if (child.type !== "paragraph") continue;
          for (const grandchild of child.children ?? []) {
            if (grandchild.type === "image") {
              ctx.setProperty(grandchild, "data", {
                hProperties: { width: attrs.width },
              });
            }
          }
        }
      }
      return;
    }

    throw new Error(
      `未知のディレクティブ :::${node.name} (${posOf(node, ctx)})`,
    );
  },

  // 復元プラグイン: 本文中の「x:y」等が誤ってtextDirective化して消えるため原文へ復元する
  // （本アプリはtext/leaf directiveを機能として使わない）。
  textDirective(node, ctx) {
    ctx.replaceNode(node, restoreText(node, ctx));
  },
  leafDirective(node, ctx) {
    ctx.replaceNode(node, {
      type: "paragraph",
      children: [restoreText(node, ctx)],
    });
  },
});
