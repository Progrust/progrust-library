// @ts-check
// [[slug]] を辞書詳細ページへの <a> に変換するmdastプラグイン（docs/markdown-pipeline/wikilink.md）。
// リンク切れ（content-model R-13）・公開ページ→非公開辞書（content-model R-14 公開非対称ルール）はthrowでビルドエラー化する。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineMdastPlugin } from "satteri";
// js-yaml v5 はESMでdefault exportを提供しないため named import を使う
import { load as loadYaml } from "js-yaml";

/** @typedef {import('./dict-index.mjs').DictIndexEntry} DictIndexEntry */

/**
 * 処理中ページ自身の公開フラグを判定する。
 * ctxは自身のfrontmatterを公開しない（yaml visitorは呼ばれない）ため、
 * ctx.fileURL からソースファイルを読み直して自前パースする。
 *
 * @param {{ fileURL?: URL | string }} ctx
 * @returns {boolean}
 */
function isSourcePagePublic(ctx) {
  if (!ctx.fileURL) return true; // fileURL不明時は判定できないので公開扱い（フォールバック）
  const raw = readFileSync(fileURLToPath(ctx.fileURL), "utf8");
  // CRLFで保存されたmdでもfrontmatterを取りこぼさないよう改行は \r?\n で許容する
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = m ? /** @type {Record<string, unknown>} */ (loadYaml(m[1])) : {};
  return fm.public !== false;
}

/**
 * wikilinkプラグインのファクトリ。文書ごとの状態（公開判定のメモ化）を持つため
 * ファクトリ形式にする（satteri-plugin-api.md）。
 *
 * @param {DictIndexEntry[]} dictIndex loadDictIndex() が返す辞書索引
 */
export function wikilink(dictIndex) {
  const bySlug = new Map(dictIndex.map((d) => [d.slug, d]));

  return () => {
    // 公開判定はvisitor呼び出しごとにreadFileSyncしない（文書単位でメモ化する）
    /** @type {boolean | undefined} */
    let sourcePublic;

    return defineMdastPlugin({
      name: "wikilink",
      text(node, ctx) {
        // gフラグ正規表現はlastIndex共有バグを避けるためvisitor内で都度生成する
        const re = /\[\[([^[\]]+)\]\]/g;
        if (!re.test(node.value)) return;
        re.lastIndex = 0;

        /** @type {import('satteri').MdastContent[]} */
        const pieces = [];
        let lastIndex = 0;
        let match;
        while ((match = re.exec(node.value))) {
          const [full, slug] = match;
          if (match.index > lastIndex) {
            pieces.push({
              type: "text",
              value: node.value.slice(lastIndex, match.index),
            });
          }

          const entry = bySlug.get(slug);
          sourcePublic ??= isSourcePagePublic(ctx);
          // 非対称ルール: 非公開ページ→非公開辞書のみ許可（content-model R-14）
          const linkBroken = !entry || (entry.public === false && sourcePublic);
          if (linkBroken) {
            const file = ctx.fileURL
              ? fileURLToPath(ctx.fileURL)
              : "(不明なファイル)";
            const pos = node.position
              ? `${node.position.start.line}:${node.position.start.column}`
              : "?:?";
            throw new Error(
              `[[${slug}]]は${entry ? "非公開の" : "存在しない"}辞書エントリです (${file}:${pos})`,
            );
          }

          // 新規生成ノードにsetPropertyは使えない（arena id無し）ため、
          // dataプロパティをリテラルへ直接埋め込む（satteri-plugin-api.md）
          pieces.push({
            type: "link",
            url: `/dict/${entry.slug}`,
            children: [{ type: "text", value: entry.title }],
            data: {
              hProperties: { class: "wikilink", "data-dict-link": entry.slug },
            },
          });

          lastIndex = match.index + full.length;
        }
        if (lastIndex < node.value.length) {
          pieces.push({ type: "text", value: node.value.slice(lastIndex) });
        }

        ctx.insertBefore(node, pieces);
        ctx.removeNode(node);
      },
    });
  };
}
