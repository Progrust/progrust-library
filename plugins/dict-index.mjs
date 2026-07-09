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
 * 辞書slugの一意性を検証する（content-model R-6 / AC-2）。
 * wikilinkはファイル名（slug）だけでリンク先を特定するため、別フォルダに同名
 * ファイルがあると解決先が曖昧になる。重複があれば衝突した全ファイルの絶対パスを
 * 含めて throw する（config評価時に呼ぶので exit 1 になる）。
 *
 * @param {{ slug: string, path: string }[]} entries slugと絶対パスの一覧
 * @returns {void}
 */
export function assertUniqueDictSlugs(entries) {
  /** @type {Map<string, string[]>} */
  const pathsBySlug = new Map();
  for (const { slug, path } of entries) {
    const paths = pathsBySlug.get(slug) ?? [];
    paths.push(path);
    pathsBySlug.set(slug, paths);
  }
  const duplicated = [...pathsBySlug.entries()].filter(
    ([, paths]) => paths.length > 1,
  );
  if (duplicated.length > 0) {
    const detail = duplicated
      .map(([slug, paths]) => `[[${slug}]]: ${paths.join(" と ")}`)
      .join("\n");
    throw new Error(
      `辞書ファイル名が一意ではありません（content-model R-6）:\n${detail}`,
    );
  }
}

/**
 * content/dict/ 配下を再帰的に走査し、wikilink解決用の辞書索引を構築する。
 * astro.config.mjs 評価時に呼ぶ（コレクションAPIはconfig時点で使えないため直読みする）。
 * 索引構築時にファイル名一意性（content-model R-6）を検証し、重複があれば throw する。
 *
 * @param {URL} dictDirURL content/dict/ ディレクトリのURL
 * @returns {DictIndexEntry[]}
 */
export function loadDictIndex(dictDirURL) {
  const dir = fileURLToPath(dictDirURL);
  const loaded = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => {
      const path = join(entry.parentPath, entry.name);
      const raw = readFileSync(path, "utf8");
      // CRLFで保存されたmdでもfrontmatterを取りこぼさないよう改行は \r?\n で許容する
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      const fm = m
        ? /** @type {Record<string, unknown>} */ (loadYaml(m[1]))
        : {};
      const slug = entry.name.replace(/\.md$/, "");
      return {
        slug,
        path,
        title: typeof fm.title === "string" ? fm.title : slug,
        public: fm.public !== false,
      };
    });

  assertUniqueDictSlugs(loaded);

  return loaded.map(({ slug, title, public: isPublic }) => ({
    slug,
    title,
    public: isPublic,
  }));
}
