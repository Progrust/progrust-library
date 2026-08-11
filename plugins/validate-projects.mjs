// @ts-check
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { markdownToHtml } from "satteri";

import { codeFilename } from "./code-filename.mjs";
import { project } from "./project.mjs";

/** @typedef {import('./project-gist.mjs').GistMap} GistMap */

/**
 * :::project を含む全コンテンツmdを単体コンパイルし、R-7 (a)〜(e) 違反を
 * ビルドエラー化する検証パス（playground-project AC-6 / AC-7）。
 *
 * コレクション経由のレンダリングでは visitor 内 throw が glob loader に握り潰され
 * exit 0 になるため、validateWikilinks と同じくconfig評価時に `markdownToHtml` で
 * 直接コンパイルする（[markdown-pipeline/satteri-plugin-api.md] 参照）。
 *
 * `:::project` を含まないファイルはコンパイルしない（実行時間の最小化。directives を
 * 登録しないため、未知ディレクティブ等の検証へ範囲を広げない意図もある）。
 * frontmatter付きの全文をそのまま渡してよいのは validateWikilinks と同じ（T1-4実測）。
 *
 * @param {GistMap} gistMap readGistMap() が返すマッピング
 * @param {URL} contentDirURL content/ ディレクトリのURL
 * @returns {void}
 */
export function validateProjects(gistMap, contentDirURL) {
  const dir = fileURLToPath(contentDirURL);
  const plugin = project(gistMap);

  const files = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => join(entry.parentPath, entry.name));

  for (const path of files) {
    const source = readFileSync(path, "utf8");
    if (!source.includes(":::project")) continue;
    // project の throw（R-7 a〜e）がそのまま伝播して exit 1 になる。
    markdownToHtml(source, {
      mdastPlugins: [codeFilename, plugin],
      features: { directive: true },
      fileURL: pathToFileURL(path),
    });
  }
}
