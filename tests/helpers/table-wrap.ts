import { markdownToHtml } from "satteri";

import { tableWrap } from "../../plugins/table-wrap.mjs";

/**
 * table-wrap プラグイン単体で markdown をコンパイルし、HTML 文字列を返すテスト用ヘルパ。
 *
 * GFM（パイプテーブル）は satteri のデフォルトで有効なため追加設定は不要。
 * element visitor は同期のため markdownToHtml は同期で返る。
 */
export function compileWithTableWrap(source: string): string {
  const result = markdownToHtml(source, {
    hastPlugins: [tableWrap],
  });
  return result.html;
}
