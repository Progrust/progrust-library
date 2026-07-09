import type { MermaidRenderer } from "mermaid-isomorphic";
import { markdownToHtml } from "satteri";

import { mermaid } from "../../plugins/mermaid.mjs";

/**
 * mermaid-isomorphic の MermaidRenderer 互換の最小 fake レンダラ型。
 * theme（default/dark）ごとに固定のSVG文字列を返し、実ブラウザ（Chromium）を起動しない。
 */
type FakeRenderer = (
  diagrams: string[],
  options?: { prefix?: string; mermaidConfig?: { theme?: string } },
) => Promise<
  (
    | { status: "fulfilled"; value: { svg: string } }
    | { status: "rejected"; reason: unknown }
  )[]
>;

/**
 * theme に応じたSVG文字列を返す fake レンダラを生成する。
 *
 * `svgFor(theme, prefix)` は各テーマ・各図の prefix を受けてSVG本文を組み立てる。
 * prefix（mermaidが svgルートid等に使う）を埋め込むことで、プラグイン側の
 * namespaceSvgIds が light/dark 間の id 衝突を消すことを検証できる。
 */
export function fakeRenderer(
  svgFor: (theme: string, prefix: string) => string,
): FakeRenderer {
  return async (diagrams, options) => {
    const theme = options?.mermaidConfig?.theme ?? "default";
    const prefix = options?.prefix ?? "mmd";
    return diagrams.map(() => ({
      status: "fulfilled" as const,
      value: { svg: svgFor(theme, prefix) },
    }));
  };
}

/** 常にレンダ拒否（rejected）を返す fake レンダラ。throwでビルドを止める挙動の検証用。 */
export function rejectingRenderer(reason: unknown): FakeRenderer {
  return async (diagrams) =>
    diagrams.map(() => ({ status: "rejected" as const, reason }));
}

/**
 * mermaid プラグインで markdown をコンパイルし HTML 文字列を返すテスト用ヘルパ。
 *
 * visit は async（レンダ）のため markdownToHtml は Promise を返す。await して解決する。
 * renderer に fake を注入し実ブラウザ起動・実SVG生成を避ける（implementation-rules §5）。
 */
export async function compileWithMermaid(
  source: string,
  renderer: FakeRenderer,
): Promise<string> {
  const result = await markdownToHtml(source, {
    // FakeRenderer は本物の MermaidRenderer の使う部分集合のみ実装するため unknown 経由で橋渡し。
    hastPlugins: [
      mermaid({ renderer: renderer as unknown as MermaidRenderer }),
    ],
  });
  return result.html;
}
