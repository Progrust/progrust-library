import { markdownToHtml } from "satteri";

import { codeFilename } from "../../plugins/code-filename.mjs";
import { project } from "../../plugins/project.mjs";
import { playgroundLink } from "../../plugins/playground-link.mjs";
import { directives } from "../../plugins/directives.mjs";
import type { GistMap } from "../../plugins/project-gist.mjs";

/**
 * project プラグインで markdown をコンパイルし、HTML 文字列を返すテスト用ヘルパ。
 * 実運用と同じく codeFilename → project → playgroundLink → directives の順で通す
 * （project は .code-block ラッパ形状の走査・playground メタ検出・未知名throw回避の
 * 3つの理由でこの位置が必須。docs/markdown-pipeline/project.md）。
 *
 * - gistMap 省略時は空マッピング（未登録エラー系のテスト向け）
 * - fileURL はエラーメッセージの「ファイル:行:列」検証に使う（省略可）
 *
 * ※Shiki は Astro の createRenderer 経由でのみ走るため、ここで検証できるのは mdast前処理
 * （ラッパー構造・ツリー・アンカー生成）まで。ハイライト込みの出力は実 astro build で確認する。
 */
export function compileWithProject(
  source: string,
  options: { gistMap?: GistMap; fileURL?: URL } = {},
): string {
  const result = markdownToHtml(source, {
    mdastPlugins: [
      codeFilename,
      project(options.gistMap ?? {}),
      playgroundLink,
      directives,
    ],
    // directive 有効化なしでは :::project が素通りしテストが無意味（誤ってgreen）になる。
    features: { directive: true },
    fileURL: options.fileURL,
  });
  return result.html;
}
