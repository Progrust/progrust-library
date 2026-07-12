import { describe, it, expect } from "vitest";

import { namespaceSvgIds, mermaid } from "../../plugins/mermaid.mjs";
import {
  compileWithMermaid,
  fakeRenderer,
  rejectingRenderer,
  type RenderCall,
} from "../helpers/mermaid";

/** SVG中の id="..." 定義をすべて集める（順不同・重複排除）。 */
function idsOf(svg: string): Set<string> {
  const ids = new Set<string>();
  for (const m of svg.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  return ids;
}

/**
 * `<style>` 内の `#<id>` セレクタで参照されているが、対応する `id="<id>"` 定義が
 * 存在しない「孤立セレクタ（死にCSS）」の集合を返す。R-1の真の不変条件はこれが空であること。
 *
 * `#...` は id セレクタと宣言値（`fill:#333` / `border:1px solid #aaaa33` / `url(#x)`）の
 * 両方に現れる。宣言値は必ずルール本体（`{ … }` の内側）にあるので、各ルールの **`{` の手前
 * ＝セレクタリスト部分**に現れる `#id` だけを対象にする（`:` 直前判定ではショートハンド値を
 * 除外できない。T2-4再レビューN-2）。
 */
function orphanStyleSelectors(svg: string): string[] {
  const defined = idsOf(svg);
  const orphans: string[] = [];
  for (const style of svg.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    // mermaidの<style>はフラットなルール列。各 `セレクタリスト { 宣言 }` のセレクタ部分のみ走査。
    for (const rule of style[1].matchAll(/([^{}]*)\{[^{}]*\}/g)) {
      for (const sel of rule[1].matchAll(/#([\w-]+)/g)) {
        if (!defined.has(sel[1])) orphans.push(sel[1]);
      }
    }
  }
  return orphans;
}

describe("mermaid（ビルド時SVG化・docs/markdown-pipeline/mermaid.md）", () => {
  describe("namespaceSvgIds（id名前空間化・落とし穴1＝本機能の本丸）", () => {
    // mermaid出力を模した断片。<style> は全ルールをルートid（<svg id>）でスコープし、
    // 内部id（エッジid/participant id等）を定義（id=）・各参照形式で1つずつ含む。
    // ★ルートidは呼び出し側の prefix で既に一意（light=mmd0l-0 / dark=mmd0d-0）。
    // 同一 id="root" を両テーマに食わせるとルート除外で衝突しテストが嘘になるため、
    // 本番同型に light/dark で別ルートidを与える。
    const svgWithStyle = (root: string) =>
      `<svg id="${root}">` +
      `<style>#${root}{font-family:sans-serif;fill:#333;}#${root} .node{fill:#552222;}</style>` +
      `<path id="L_A_B_0" marker-end="url(#arrow)" fill="#333"></path>` +
      `<marker id="arrow"></marker>` +
      `<use href="#L_A_B_0"></use>` +
      `<g aria-labelledby="${root}"></g>` +
      "</svg>";

    it("light/darkで内部idの積集合がゼロになる（ルートはprefixで別idのため衝突しない）", () => {
      const light = namespaceSvgIds(svgWithStyle("mmd0l-0"), "mmd0l-");
      const dark = namespaceSvgIds(svgWithStyle("mmd0d-0"), "mmd0d-");

      const shared = [...idsOf(light)].filter((id) => idsOf(dark).has(id));
      expect(shared).toEqual([]);
      // 内部idは ns 前置き、ルートidは不変。
      expect(idsOf(light)).toEqual(
        new Set(["mmd0l-0", "mmd0l-L_A_B_0", "mmd0l-arrow"]),
      );
    });

    it("style内の #id セレクタが孤立しない（R-1回帰＝死にCSSを作らない）", () => {
      const out = namespaceSvgIds(svgWithStyle("mmd0l-0"), "mmd0l-");
      // ルートidを書き換えないため #mmd0l-0 セレクタは id="mmd0l-0" と一致し続ける。
      expect(orphanStyleSelectors(out)).toEqual([]);
      expect(out).toContain('id="mmd0l-0"');
      expect(out).toContain("#mmd0l-0{");
      expect(out).toContain("#mmd0l-0 .node{");
      // 二重前置き（旧バグの症状）が発生していない。
      expect(out).not.toContain("mmd0l-mmd0l-0");
    });

    it('内部idの id定義・url(#..)・href="#.."・aria-labelledby 参照をすべて追従して書き換える', () => {
      const out = namespaceSvgIds(svgWithStyle("mmd0l-0"), "ns-");
      expect(out).toContain('id="ns-L_A_B_0"');
      expect(out).toContain('marker-end="url(#ns-arrow)"');
      expect(out).toContain('href="#ns-L_A_B_0"');
      expect(out).toContain('id="ns-arrow"');
      // ルートidを指す aria-labelledby はルート不変につき書き換えない。
      expect(out).toContain('aria-labelledby="mmd0l-0"');
    });

    it("孤立判定は宣言値中の色（border:1px solid #aaaa33 等）を誤検知しない（N-2）", () => {
      // 実mermaid flowchart CSS に現れるショートハンド色値。ルール本体内なのでセレクタ扱いしない。
      const svg =
        '<svg id="mmd0l-0">' +
        "<style>#mmd0l-0 .node{border:1px solid #aaaa33;fill:#fff;}</style>" +
        '<rect id="r0"></rect></svg>';
      const out = namespaceSvgIds(svg, "mmd0l-");
      expect(orphanStyleSelectors(out)).toEqual([]);
    });

    it('id値でない色指定（fill="#333"）は書き換えない', () => {
      const out = namespaceSvgIds(svgWithStyle("mmd0l-0"), "ns-");
      expect(out).toContain('fill="#333"');
      expect(out).not.toContain('fill="#ns-333"');
    });
  });

  describe("検出と埋め込み構造（fakeレンダラ・実ブラウザ非起動）", () => {
    // theme と prefix を反映したSVGを返す。ルートid（=prefix由来）を <style> でスコープし、
    // 内部id r0 も持たせて namespaceSvgIds を実際に働かせる。
    const svgFor = (theme: string, prefix: string) =>
      `<svg id="${prefix}">` +
      `<style>#${prefix} rect{fill:${theme === "dark" ? "#000" : "#fff"};}</style>` +
      `<rect fill="${theme === "dark" ? "#000" : "#fff"}" id="r0"></rect>` +
      "</svg>";

    it("mermaidブロックが figure + light/dark 2枚のSVG（<div>）に変換される", async () => {
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

    it("light/darkのSVG間で id が衝突せず、かつ style に孤立セレクタが無い", async () => {
      const html = await compileWithMermaid(
        "```mermaid\nflowchart TD\n  A --> B\n```\n",
        fakeRenderer(svgFor),
      );
      // 2枚のSVGを分離してid積集合と孤立セレクタを確認する。
      const svgs = [...html.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0]);
      expect(svgs).toHaveLength(2);
      const shared = [...idsOf(svgs[0])].filter((id) => idsOf(svgs[1]).has(id));
      expect(shared).toEqual([]);
      // 各SVGの <style> セレクタが自SVGの id と一致し続ける（R-1回帰）。
      expect(orphanStyleSelectors(svgs[0])).toEqual([]);
      expect(orphanStyleSelectors(svgs[1])).toEqual([]);
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

  describe("テーマ設定（サイトトークン反映・ui-design-spec「mermaid図」）", () => {
    const svgFor = (_theme: string, prefix: string) =>
      `<svg id="${prefix}"><rect id="r0"></rect></svg>`;

    /** 1図ぶんレンダしてレンダラ呼び出し（light/darkの2回）を記録して返す。 */
    async function renderCalls(): Promise<{
      light: RenderCall;
      dark: RenderCall;
    }> {
      const calls: RenderCall[] = [];
      await compileWithMermaid(
        "```mermaid\nflowchart TD\n  A --> B\n```\n",
        fakeRenderer(svgFor, calls),
      );
      expect(calls).toHaveLength(2);
      const light = calls.find((c) => c.options?.prefix?.endsWith("l"));
      const dark = calls.find((c) => c.options?.prefix?.endsWith("d"));
      if (!light || !dark) throw new Error("light/dark 両方の呼び出しが必要");
      return { light, dark };
    }

    it('light/dark とも theme: "base" + 本文フォント（Zen Maru Gothic / 15px）で呼ぶ', async () => {
      const { light, dark } = await renderCalls();
      for (const call of [light, dark]) {
        const config = call.options?.mermaidConfig;
        expect(config?.theme).toBe("base");
        // トップレベルは数値(px)、themeVariables 側は文字列の二重指定（mermaidの型都合）。
        expect(config?.fontFamily).toContain("Zen Maru Gothic");
        expect(config?.fontSize).toBe(15);
        expect(config?.themeVariables?.fontFamily).toContain("Zen Maru Gothic");
        expect(config?.themeVariables?.fontSize).toBe("15px");
      }
    });

    it("light/dark それぞれのサイトトークン（hex）を themeVariables に焼き込む", async () => {
      const { light, dark } = await renderCalls();
      const lightVars = light.options?.mermaidConfig?.themeVariables;
      expect(lightVars?.darkMode).toBe(false);
      expect(lightVars?.background).toBe("#f2f0ec"); // paper（枠なし＝紙背景）
      expect(lightVars?.primaryColor).toBe("#fbf9f6"); // card
      expect(lightVars?.edgeLabelBackground).toBe("#f2f0ec"); // 抜き色=実背景

      const darkVars = dark.options?.mermaidConfig?.themeVariables;
      expect(darkVars?.darkMode).toBe(true);
      expect(darkVars?.background).toBe("#1e1b18"); // paper
      expect(darkVars?.primaryColor).toBe("#26221e"); // card
      expect(darkVars?.edgeLabelBackground).toBe("#1e1b18");
    });

    it("css オプションで Zen Maru Gothic のフォントCSS URLをレンダページに注入する", async () => {
      const { light, dark } = await renderCalls();
      for (const call of [light, dark]) {
        expect(String(call.options?.css)).toContain(
          "fonts.googleapis.com/css2?family=Zen+Maru+Gothic",
        );
      }
    });
  });

  describe("レンダ失敗時はthrowでビルドを止める（link-cardと方針が逆）", () => {
    it("レンダ拒否（rejected）は figure を出さずに throw する", async () => {
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
