// @ts-check
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { markdownToHtml } from "satteri";

import { wikilink } from "./wikilink.mjs";

/** @typedef {import('./dict-index.mjs').DictIndexEntry} DictIndexEntry */

/**
 * 全コンテンツmdを wikilink プラグインで単体コンパイルし、リンク切れ（R-13）・
 * 公開非対称違反（R-14）をビルドエラー化する検証パス（content-model AC-9 / AC-10）。
 *
 * コレクション経由のレンダリングでは visitor 内 throw が glob loader に握り潰され
 * exit 0 になる（[markdown-pipeline/wikilink.md] 参照）ため、レンダリングとは別に
 * config評価時に `markdownToHtml` で直接コンパイルする。throw はそのまま伝播して
 * exit 1 になり、Content Layer キャッシュも介在しない。
 *
 * frontmatter付きの全文をそのまま渡す（`markdownToHtml` が自前で frontmatter を
 * 抽出するため剥がす必要はなく、エラーの行番号も実ファイルと一致する。T1-4実測）。
 *
 * @param {DictIndexEntry[]} dictIndex loadDictIndex() が返す辞書索引
 * @param {URL} contentDirURL content/ ディレクトリのURL
 * @returns {void}
 */
export function validateWikilinks(dictIndex, contentDirURL) {
  const dir = fileURLToPath(contentDirURL);
  const plugin = wikilink(dictIndex);

  const files = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => join(entry.parentPath, entry.name));

  for (const path of files) {
    const source = readFileSync(path, "utf8");
    // wikilink の throw（リンク切れ・非対称）がそのまま伝播する。
    markdownToHtml(source, {
      mdastPlugins: [plugin],
      fileURL: pathToFileURL(path),
    });
  }
}
