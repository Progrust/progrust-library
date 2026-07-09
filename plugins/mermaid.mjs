// @ts-check
// language-mermaid のコードブロックをビルド時に mermaid-isomorphic（Playwright/Chromium）で
// SVG化し、ライト/ダーク2枚を <figure> に埋め込むhastプラグイン（docs/markdown-pipeline/mermaid.md）。
// 記法は docs/markdown-notation/rule.md「mermaid」に従う（mermaid.js準拠）。
// - クライアントに mermaid.js は配布しない（ビルド時に完全にSVG化する）。
// - mermaid は astro.config.mjs の syntaxHighlight.excludeLangs で Shiki除外され、hastに
//   素の <pre><code data.lang=mermaid> で届く（非除外言語はShiki済みの raw ノードになる）。
// - レンダ失敗（構文エラー・ブラウザ起動失敗）は throw でビルドを止める
//   （link-card がフォールバックするのと方針が逆）。
import { fileURLToPath } from "node:url";
import { defineHastPlugin } from "satteri";
import { createMermaidRenderer } from "mermaid-isomorphic";

// mermaid-isomorphic 本体のレンダラ型をそのまま使う（DIで差し替え可能にするため型名を再export）。
/** @typedef {import('mermaid-isomorphic').MermaidRenderer} MermaidRenderer */

// レンダラはモジュールレベルで1度だけ生成し、ブラウザインスタンスを使い回す。
// createMermaidRenderer() はクロージャを返すだけで、Chromium は初回レンダ呼び出し時に
// 遅延起動する（fakeを注入するテストではブラウザを起動しない）。
/** @type {MermaidRenderer} */
const defaultRenderer = createMermaidRenderer();

// mermaid の prefix は svg ルート id とマーカー/グラデーション id しか名前空間化しない。
// フローチャートのエッジ id（L_A_B_0）やシーケンス図の actor0 / S / U 等の内部 id は
// 無名前空間のままで、同一図の light/dark 2枚で衝突する。→ SVG 文字列内の内部 id と参照
// （url(#..) / href="#.." / aria-*）を一意な ns で前置きして衝突を根絶する。
//
// ★ルート id（<svg id="…">）は書き換え対象から除外する。理由:
//   1. mermaid は <style> の全テーマルールを「#<ルートid>{…}」「#<ルートid> .node{…}」の
//      #id セレクタでスコープする。この #id セレクタは url()/href/aria のいずれでもないため
//      本関数の書き換え対象外で、ルート id だけ書き換えるとセレクタが旧 id を指し全ルールが
//      死にCSS化する（light/dark の配色差が消える）。
//   2. ルート id は mermaid の prefix（mmd{index}l / mmd{index}d）で既に per-SVG 一意
//      （light=mmd0l-0 / dark=mmd0d-0）なので、書き換えずとも light/dark 間で衝突しない。
/**
 * SVG文字列中の内部 id 定義と参照を ns で前置きして一意化する（ルート id は不変）。
 * id属性は `"`、url(#..) は `)`、href は `"` でアンカーされるため部分一致の誤置換は起きない
 * （fill="#333" のような色指定は無傷）。#id セレクタ（style内）はルート id 用のみ想定し、
 * ルート id を不変に保つことで一致を維持する。
 * @param {string} svg
 * @param {string} ns
 * @returns {string}
 */
export function namespaceSvgIds(svg, ns) {
  // ルート id（<svg 開始タグ内の最初の id）を検出して除外する。非貪欲で最初の id を拾う。
  const rootId = svg.match(/<svg\b[^>]*?\bid="([^"]+)"/)?.[1];
  const ids = new Set();
  for (const m of svg.matchAll(/\bid="([^"]+)"/g)) {
    if (m[1] !== rootId) ids.add(m[1]);
  }
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    svg = svg
      .replace(new RegExp(`\\bid="${esc}"`, "g"), `id="${ns}${id}"`)
      .replace(
        new RegExp(`url\\((['"]?)#${esc}\\1\\)`, "g"),
        `url($1#${ns}${id}$1)`,
      )
      .replace(new RegExp(`href="#${esc}"`, "g"), `href="#${ns}${id}"`)
      .replace(
        new RegExp(`(aria-(?:labelledby|describedby)=")${esc}(")`, "g"),
        `$1${ns}${id}$2`,
      );
  }
  return svg;
}

/**
 * 1テーマ分をレンダして id を名前空間化したSVG文字列を返す。
 * @param {MermaidRenderer} renderer
 * @param {string} source
 * @param {'default' | 'dark'} theme
 * @param {string} ns
 * @returns {Promise<string>}
 */
async function renderTheme(renderer, source, theme, ns) {
  const [result] = await renderer([source], {
    prefix: ns,
    mermaidConfig: { theme },
  });
  if (result.status !== "fulfilled") {
    const reason = result.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    throw new Error(message);
  }
  return namespaceSvgIds(result.value.svg, `${ns}-`);
}

/**
 * mermaid ビルド時SVG化プラグイン（ファクトリ形式）。
 * 文書ごとに図の連番カウンタを持つためファクトリにする（satteri-plugin-api.md）。
 * renderer はDI可能（既定はモジュールレベルの mermaid-isomorphic レンダラ）。
 * テストは fake レンダラを注入しブラウザ起動と実SVG生成を避ける。
 * @param {{ renderer?: MermaidRenderer }} [options]
 */
export function mermaid({ renderer = defaultRenderer } = {}) {
  let counter = 0;

  return defineHastPlugin({
    name: "mermaid",
    element: {
      filter: ["pre"],
      async visit(node, ctx) {
        const children = "children" in node ? node.children : undefined;
        const code = children?.find(
          (c) => c.type === "element" && c.tagName === "code",
        );
        // Shiki除外された mermaid ブロックのみ対象（それ以外の <pre> は素通り）。
        if (!code || code.type !== "element" || getLang(code) !== "mermaid") {
          return;
        }

        const source = ctx.textContent(code).replace(/\n$/, "");
        const index = counter++;

        let lightSvg;
        let darkSvg;
        try {
          [lightSvg, darkSvg] = await Promise.all([
            renderTheme(renderer, source, "default", `mmd${index}l`),
            renderTheme(renderer, source, "dark", `mmd${index}d`),
          ]);
        } catch (err) {
          const file = ctx.fileURL
            ? fileURLToPath(ctx.fileURL)
            : "(不明なファイル)";
          const pos = node.position
            ? `${node.position.start.line}:${node.position.start.column}`
            : "?:?";
          const detail = err instanceof Error ? err.message : String(err);
          // 構文エラー・ブラウザ起動失敗（依存不足）等をまとめて捕捉する。
          throw new Error(
            `mermaid レンダリング失敗: ${detail} (${file}:${pos})`,
            {
              cause: err,
            },
          );
        }

        // Tailwind ダークモード（html.dark クラス切替）で出し分け。
        // light を既定表示、dark を dark: で表示する。切替CSSはP6で入れる。
        const wrapper =
          `<figure class="mermaid-diagram">` +
          `<div class="mermaid-light block dark:hidden">${lightSvg}</div>` +
          `<div class="mermaid-dark hidden dark:block">${darkSvg}</div>` +
          `</figure>`;

        ctx.replaceNode(node, { type: "raw", value: wrapper });
      },
    },
  });
}

// satteri は Shiki除外言語の言語名を code 要素の data.lang に載せる（実測）。
// hast の Element.data 標準型に lang は無いため、型注釈だけJSDocで橋渡しする（any不使用）。
/**
 * @param {{ data?: { lang?: unknown } }} code
 * @returns {string | undefined}
 */
function getLang(code) {
  const lang = code.data?.lang;
  return typeof lang === "string" ? lang : undefined;
}
