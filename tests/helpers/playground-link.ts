import { markdownToHtml } from "satteri";

import { codeFilename } from "../../plugins/code-filename.mjs";
import { playgroundLink } from "../../plugins/playground-link.mjs";

/**
 * playground-link プラグインで markdown をコンパイルし、HTML 文字列を返すテスト用ヘルパ。
 * 実運用と同じく codeFilename → playgroundLink の順で通す（```rust:main.rs playground の
 * 併用は codeFilename のlang補正後でないと判定できないため。docs/markdown-pipeline/playground.md）。
 *
 * ※Shiki は Astro の createRenderer 経由でのみ走るため、ここで検証できるのは mdast前処理
 * （ラッパー構造・アンカー生成）まで。ハイライト込みの出力は実 astro build の dist で確認する。
 */
export function compileWithPlaygroundLink(source: string): string {
  const result = markdownToHtml(source, {
    mdastPlugins: [codeFilename, playgroundLink],
  });
  return result.html;
}
