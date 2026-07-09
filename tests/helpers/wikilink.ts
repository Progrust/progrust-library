import { markdownToHtml } from "satteri";

import { wikilink } from "../../plugins/wikilink.mjs";
import type { DictIndexEntry } from "../../plugins/dict-index.mjs";

/**
 * wikilink プラグインで markdown をコンパイルし、HTML 文字列を返すテスト用ヘルパ。
 *
 * 公開非対称ルール（content-model R-14）の判定は `fileURL` が指すディスク上の
 * frontmatter で決まるため、公開/非公開の出し分けは `tests/fixtures/public-*.md`
 * を fileURL に渡すことで行う（source はインラインの markdown 断片）。
 *
 * wikilink の text visitor は同期のため markdownToHtml は同期で返る。
 */
export function compileWithWikilink(
  source: string,
  dictIndex: DictIndexEntry[],
  fileURL: URL,
): string {
  const result = markdownToHtml(source, {
    mdastPlugins: [wikilink(dictIndex)],
    fileURL,
  });
  return result.html;
}
