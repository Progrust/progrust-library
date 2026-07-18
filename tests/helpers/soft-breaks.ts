import { markdownToHtml } from "satteri";

import { softBreaks } from "../../plugins/soft-breaks.mjs";

/**
 * soft-breaks プラグイン単体で markdown をコンパイルし、HTML 文字列を返すテスト用ヘルパ。
 * 対象は text ノードの分割のみのため、単体登録で十分検証できる。
 * 他プラグインとの相互作用は tests/plugins/pipeline.test.ts で検証する。
 */
export function compileWithSoftBreaks(source: string): string {
  const result = markdownToHtml(source, {
    mdastPlugins: [softBreaks],
  });
  return result.html;
}
