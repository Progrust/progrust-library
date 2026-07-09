import { markdownToHtml } from "satteri";

import { directives } from "../../plugins/directives.mjs";

/**
 * directives プラグインで markdown をコンパイルし、HTML 文字列を返すテスト用ヘルパ。
 *
 * `features: { directive: true }` を渡して `:::` 記法のパースを有効化する。
 * この有効化なしでは `:::message` 等がそのまま素通りし、`x:y` 復元テストも
 * 無意味（誤ってgreen）になるため、有効化は必須。
 *
 * containerDirective / textDirective visitor は同期のため markdownToHtml は同期で返る。
 */
export function compileWithDirectives(source: string): string {
  const result = markdownToHtml(source, {
    mdastPlugins: [directives],
    features: { directive: true },
  });
  return result.html;
}
