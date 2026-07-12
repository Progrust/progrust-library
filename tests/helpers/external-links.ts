import { markdownToHtml } from "satteri";

import { externalLinks } from "../../plugins/external-links.mjs";

/**
 * external-links プラグイン単体で markdown をコンパイルし、HTML 文字列を返すテスト用ヘルパ。
 * 対象は link ノードへの hProperties 付与のみのため、単体登録で十分検証できる。
 * wikilink・linkCard との相互作用は tests/plugins/pipeline.test.ts で検証する。
 */
export function compileWithExternalLinks(source: string): string {
  const result = markdownToHtml(source, {
    mdastPlugins: [externalLinks],
  });
  return result.html;
}
