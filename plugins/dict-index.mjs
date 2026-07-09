// @ts-check
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
// js-yaml v5 はESMでdefault exportを提供しないため named import を使う
import { load as loadYaml } from "js-yaml";

/**
 * @typedef {object} DictIndexEntry
 * @property {string} slug ファイル名（拡張子なし）= 辞書URLのslug
 * @property {string} title frontmatterのtitle（wikilinkの表示テキスト）
 * @property {boolean} public 公開フラグ（公開非対称ルールの判定に使う）
 */

/**
 * content/dict/ 配下を再帰的に走査し、wikilink解決用の辞書索引を構築する。
 * astro.config.mjs 評価時に呼ぶ（コレクションAPIはconfig時点で使えないため直読みする）。
 * ※ファイル名一意性の検証（content-model R-6）はT1-4で本関数に追加する。
 *
 * @param {URL} dictDirURL content/dict/ ディレクトリのURL
 * @returns {DictIndexEntry[]}
 */
export function loadDictIndex(dictDirURL) {
  const dir = fileURLToPath(dictDirURL);
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => {
      const raw = readFileSync(join(entry.parentPath, entry.name), "utf8");
      // CRLFで保存されたmdでもfrontmatterを取りこぼさないよう改行は \r?\n で許容する
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      const fm = m
        ? /** @type {Record<string, unknown>} */ (loadYaml(m[1]))
        : {};
      const slug = entry.name.replace(/\.md$/, "");
      return {
        slug,
        title: typeof fm.title === "string" ? fm.title : slug,
        public: fm.public !== false,
      };
    });
}
