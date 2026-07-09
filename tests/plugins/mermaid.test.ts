import { describe, it, expect } from "vitest";

import { namespaceSvgIds, mermaid } from "../../plugins/mermaid.mjs";
import {
  compileWithMermaid,
  fakeRenderer,
  rejectingRenderer,
} from "../helpers/mermaid";

/** SVG中の id="..." 定義をすべて集める（順不同・重複排除）。 */
function idsOf(svg: string): Set<string> {
  const ids = new Set<string>();
  for (const m of svg.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  return ids;
}

describe("mermaid（ビルド時SVG化・docs/markdown-pipeline/mermaid.md）", () => {
  describe("namespaceSvgIds（id名前空間化・落とし穴1＝本機能の本丸）", () => {
    // mermaidがlight/darkで同一の内部id（エッジid・participant id等）を吐くのを模した断片。
    // 定義（id=）と各参照形式（url(#..) / href="#.." / aria-labelledby）を1つずつ含める。
    const svg =
      '<svg id="root">' +
      '<path id="L_A_B_0" marker-end="url(#arrow)" fill="#333"></path>' +
      '<marker id="arrow"></marker>' +
      '<use href="#L_A_B_0"></use>' +
      '<g aria-labelledby="root"></g>' +
      "</svg>";

    it("[AC-mermaid] light/darkを別nsで前置きするとid積集合がゼロになる", () => {
      const light = namespaceSvgIds(svg, "mmd0l-");
      const dark = namespaceSvgIds(svg, "mmd0d-");

      const lightIds = idsOf(light);
      const darkIds = idsOf(dark);
      // 元は root/L_A_B_0/arrow の3つを共有していた。名前空間化後は共有ゼロ。
      const shared = [...lightIds].filter((id) => darkIds.has(id));
      expect(shared).toEqual([]);
      // 全idが期待どおり前置きされている。
      expect(lightIds).toEqual(
        new Set(["mmd0l-root", "mmd0l-L_A_B_0", "mmd0l-arrow"]),
      );
    });

    it('id定義・url(#..)・href="#.."・aria-labelledby の参照をすべて追従して書き換える', () => {
      const out = namespaceSvgIds(svg, "ns-");
      expect(out).toContain('id="ns-L_A_B_0"');
      expect(out).toContain('marker-end="url(#ns-arrow)"');
      expect(out).toContain('href="#ns-L_A_B_0"');
      expect(out).toContain('aria-labelledby="ns-root"');
      // id定義とその参照が食い違わない（dangling参照を作らない）。
      expect(out).toContain('id="ns-arrow"');
    });

    it('id値でない色指定（fill="#333"）は書き換えない', () => {
      const out = namespaceSvgIds(svg, "ns-");
      expect(out).toContain('fill="#333"');
      expect(out).not.toContain('fill="#ns-333"');
    });
  });

  describe("検出と埋め込み構造（fakeレンダラ・実ブラウザ非起動）", () => {
    // theme と prefix を反映したSVGを返す（namespaceSvgIds に prefix由来のidを食わせる）。
    const svgFor = (theme: string, prefix: string) =>
      `<svg id="${prefix}"><rect fill="${theme === "dark" ? "#000" : "#fff"}" id="r0"></rect></svg>`;

    it("[AC-mermaid] mermaidブロックが figure + light/dark 2枚のSVG（<div>）に変換される", async () => {
      const html = await compileWithMermaid(
        "```mermaid\nflowchart TD\n  A --> B\n```\n",
        fakeRenderer(svgFor),
      );

      expect(html).toContain('<figure class="mermaid-diagram">');
      expect(html).toContain('<div class="mermaid-light block dark:hidden">');
      expect(html).toContain('<div class="mermaid-dark hidden dark:block">');
      // SVGはエスケープされずそのまま埋まる（raw出力）。
      expect(html).toContain("<svg");
      expect(html).not.toContain("&lt;svg");
      // light/dark 2枚ぶんの <svg> がある。
      expect(html.match(/<svg/g)?.length).toBe(2);
      // クライアントに mermaid.js のコードブロックは残らない（<pre>変換済み）。
      expect(html).not.toContain("language-mermaid");
    });

    it("light/darkのSVG間で id が衝突しない（プラグイン経由でも名前空間化される）", async () => {
      const html = await compileWithMermaid(
        "```mermaid\nflowchart TD\n  A --> B\n```\n",
        fakeRenderer(svgFor),
      );
      // 2枚のSVGを分離してid積集合を確認する。
      const svgs = [...html.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0]);
      expect(svgs).toHaveLength(2);
      const shared = [...idsOf(svgs[0])].filter((id) => idsOf(svgs[1]).has(id));
      expect(shared).toEqual([]);
    });

    it("非mermaidの <pre>（通常コードブロック）は素通りする", async () => {
      // Shiki非経由の markdownToHtml では ```txt は素の <pre><code> で残る。
      const html = await compileWithMermaid(
        "```txt\nhello\n```\n",
        fakeRenderer(svgFor),
      );
      expect(html).not.toContain("mermaid-diagram");
      expect(html).toContain("<pre>");
      expect(html).toContain("hello");
    });
  });

  describe("レンダ失敗時はthrowでビルドを止める（link-cardと方針が逆）", () => {
    it("[AC-mermaid] レンダ拒否（rejected）は figure を出さずに throw する", async () => {
      await expect(
        compileWithMermaid(
          "```mermaid\nbroken\n```\n",
          rejectingRenderer(new Error("構文エラー")),
        ),
      ).rejects.toThrow(/mermaid レンダリング失敗/);
    });
  });

  it("mermaid() はファクトリ形式（呼び出しごとに独立インスタンス）", () => {
    const a = mermaid();
    const b = mermaid();
    expect(a).not.toBe(b);
    expect(a.name).toBe("mermaid");
  });
});
