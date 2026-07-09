// @ts-check
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @typedef {object} NoSequenceViolation 連番プレフィックス欠落
 * @property {"no-sequence"} kind
 * @property {string} book 本ディレクトリ名
 * @property {string} file 章ファイル名
 *
 * @typedef {object} DuplicateSlugViolation 連番除去後の重複
 * @property {"duplicate-slug"} kind
 * @property {string} book 本ディレクトリ名
 * @property {string} slug 連番除去後のファイル名（拡張子なし）
 * @property {string[]} files 衝突した章ファイル名の一覧
 *
 * @typedef {NoSequenceViolation | DuplicateSlugViolation} ChapterViolation
 */

/**
 * 連番プレフィックス（ゼロ埋め2桁+ハイフン）。
 * @type {RegExp}
 */
const SEQUENCE_PREFIX = /^\d{2}-/;

/**
 * 章ファイル名の連番形式・重複違反を検出する（content-model R-9 / AC-5）。純関数。
 *
 * - 先頭にゼロ埋め2桁連番+ハイフンが無い章 → `no-sequence`
 * - 連番を除去したファイル名が同じ本の別の章と重複 → `duplicate-slug`
 *
 * `index.md`（本メタ）は連番チェックの対象外なので、呼び出し側で除外して渡すこと。
 *
 * @param {Map<string, string[]>} chaptersByBook 本ディレクトリ名 → 章ファイル名の一覧
 * @returns {ChapterViolation[]}
 */
export function findChapterOrderViolations(chaptersByBook) {
  /** @type {ChapterViolation[]} */
  const violations = [];

  for (const [book, files] of chaptersByBook) {
    /** @type {Map<string, string[]>} */
    const filesBySlug = new Map();

    for (const file of files) {
      if (!SEQUENCE_PREFIX.test(file)) {
        violations.push({ kind: "no-sequence", book, file });
      }
      const slug = file.replace(SEQUENCE_PREFIX, "").replace(/\.md$/, "");
      const group = filesBySlug.get(slug) ?? [];
      group.push(file);
      filesBySlug.set(slug, group);
    }

    for (const [slug, group] of filesBySlug) {
      if (group.length > 1) {
        violations.push({ kind: "duplicate-slug", book, slug, files: group });
      }
    }
  }

  return violations;
}

/**
 * content/books/ 配下の章ファイルを走査し、連番形式・重複を検証する（R-9 / AC-5）。
 * 違反があれば該当ファイルパスを含めて throw する（config評価時に呼ぶので exit 1）。
 *
 * @param {URL} booksDirURL content/books/ ディレクトリのURL
 * @returns {void}
 */
export function validateChapters(booksDirURL) {
  const dir = fileURLToPath(booksDirURL);

  /** @type {Map<string, string[]>} */
  const chaptersByBook = new Map();
  for (const bookEntry of readdirSync(dir, { withFileTypes: true })) {
    if (!bookEntry.isDirectory()) continue;
    const book = bookEntry.name;
    const chapters = readdirSync(join(dir, book), { withFileTypes: true })
      .filter(
        (e) => e.isFile() && e.name.endsWith(".md") && e.name !== "index.md",
      )
      .map((e) => e.name);
    chaptersByBook.set(book, chapters);
  }

  const violations = findChapterOrderViolations(chaptersByBook);
  if (violations.length === 0) return;

  const detail = violations
    .map((v) => {
      if (v.kind === "no-sequence") {
        return `連番なし: ${join(dir, v.book, v.file)}`;
      }
      const paths = v.files.map((f) => join(dir, v.book, f)).join(" と ");
      return `連番除去後に重複(${v.slug}): ${paths}`;
    })
    .join("\n");
  throw new Error(
    `章ファイルの連番が不正です（content-model R-9）:\n${detail}`,
  );
}
