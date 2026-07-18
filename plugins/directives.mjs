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
 * containerDirective を、同じ children を持つ blockquote ノード（data.hName で実際の
 * HTML要素へ相殺）に置き換える。setProperty で hName を付けるだけだとノード型が
 * containerDirective のまま残り、Sätteriネイティブ変換器の脚注参照収集パスが
 * containerDirective の中を走査しないため、内部の `[^n]` が脚注化されず原文のまま
 * 出力される（directives.md「落とし穴と回避策」6）。走査対象の汎用フローコンテナである
 * blockquote へ型を替えることで、内部の脚注が通常どおり収集・変換される。
 * children にはハンドルをそのまま渡してよい（子への setProperty は置換後も適用される。実測済み）。
 *
 * @param {import('satteri').MdastNode & { children: readonly import('satteri').MdastNode[] }} node
 * @param {MdastVisitorContext} ctx
 * @param {Record<string, unknown>} data hName / hProperties
 * @param {unknown[]} [children] 省略時は node.children をそのまま使う
 */
function replaceWithBlock(node, ctx, data, children = [...node.children]) {
  ctx.replaceNode(
    node,
    /** @type {import('satteri').MdastContent} */ (
      /** @type {unknown} */ ({ type: "blockquote", data, children })
    ),
  );
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
      /** @type {unknown[]} */
      let children = [...node.children];
      if (label) {
        // labelの段落をタイトル要素にする（dataは丸ごと置換されるため directiveLabel を含め直す）
        ctx.setProperty(label, "data", {
          directiveLabel: true,
          hName: "p",
          hProperties: { class: "message-title" },
        });
      } else if (type) {
        // タイトル省略時、種別付きは種別名をデフォルトタイトルにする（rule.md「タイトルを指定する」）
        const title = {
          type: "paragraph",
          data: { hName: "p", hProperties: { class: "message-title" } },
          children: [{ type: "text", value: type }],
        };
        children = [title, ...children];
      }
      // 種別なし・タイトルなしはタイトル行を生成しない
      replaceWithBlock(
        node,
        ctx,
        {
          hName: "aside",
          hProperties: { class: type ? `message message-${type}` : "message" },
        },
        children,
      );
      return;
    }

    if (node.name === "details") {
      const label = labelChild(node);
      if (!label) {
        throw new Error(
          `:::details にタイトルがありません（:::details[タイトル] と書く） (${posOf(node, ctx)})`,
        );
      }
      ctx.setProperty(label, "data", {
        directiveLabel: true,
        hName: "summary",
      });
      replaceWithBlock(node, ctx, { hName: "details" });
      return;
    }

    if (node.name === "figure") {
      // キャプションは省略可（rule.md「画像サイズやキャプションは省略可能」）。
      // labelがあればfigcaption化し、無ければfigcaptionなしのfigureにする。
      const label = labelChild(node);
      /** @type {unknown[]} */
      let children = [...node.children];
      if (label && node.children.length > 1) {
        // キャプションは画像の下に表示するため、labelを末尾へ移動しつつfigcaption化する。
        // 移動した元ハンドルへのsetPropertyはdropされるため、cloneにdataを直付けする
        // （directives.md「落とし穴と回避策」5）
        const copy = {
          ...structuredClone(label),
          data: { directiveLabel: true, hName: "figcaption" },
        };
        children = [...children.slice(1), copy];
      } else if (label) {
        // labelしかない縮退ケースは移動不要、relabelのみ
        ctx.setProperty(label, "data", {
          directiveLabel: true,
          hName: "figcaption",
        });
      }
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
      replaceWithBlock(node, ctx, { hName: "figure" }, children);
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
