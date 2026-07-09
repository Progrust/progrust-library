import { markdownToHtml } from "satteri";

import { codeFilename } from "../../plugins/code-filename.mjs";

/**
 * code-filename プラグインで markdown をコンパイルし、HTML 文字列を返すテスト用ヘルパ。
 *
 * ※Shiki（shikiConfig）は satteri() の外・Astroの createRenderer 経由でのみ走るため、
 * この直接呼び出しではハイライトされない。ここで検証できるのは mdast前処理（ファイル名の
 * 分離・langの補正ラップ）まで。plaintextフォールバック回避（data-language="rust"）や
 * diff・dual theme は実 astro build の dist で確認する（shiki.md / plan の検証手順参照）。
 */
export function compileWithCodeFilename(source: string): string {
  const result = markdownToHtml(source, {
    mdastPlugins: [codeFilename],
  });
  return result.html;
}
