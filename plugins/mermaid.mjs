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

// 図中テキストを本文と同じ Zen Maru Gothic / 15px にする（ui-design-spec.md「mermaid図」）。
// フォントCSSはレンダページ（ビルド用Chromium）に注入され、mermaid-isomorphic がレンダ前に
// document.fonts を全ロードして待つため、テキスト幅の計測も実フォントで行われる。
// weight は 400（ラベル）/ 700（タイトル・actor名の太字）のみに絞り和文woff2取得を軽減。
const FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;700&display=swap";
const FONT_FAMILY = '"Zen Maru Gothic", sans-serif';

// theme: "base" + themeVariables でサイトのカラートークンを焼き込む（変数→トークンの対応は
// ui-design-spec.md「mermaid図」の表が正）。base テーマは未指定変数を primaryColor からの
// 色相回転等で導出し近無彩色では不自然な色になるため、flowchart/sequence が使う変数は明示指定する。
// 図は枠なしで紙背景（--color-paper）に直置きするため、background / edgeLabelBackground は paper。
// ★fontSize はここ（themeVariables）では文字列、config トップレベルでは数値の二重指定が必要。
const THEME_VARIABLES = {
  light: {
    darkMode: false,
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    background: "#f2f0ec", // paper
    primaryColor: "#fbf9f6", // card
    mainBkg: "#fbf9f6",
    actorBkg: "#fbf9f6",
    primaryTextColor: "#3a342d", // ink
    textColor: "#3a342d",
    actorTextColor: "#3a342d",
    nodeTextColor: "#3a342d",
    signalTextColor: "#3a342d",
    labelTextColor: "#3a342d",
    loopTextColor: "#3a342d",
    primaryBorderColor: "#d9d3ca", // line
    nodeBorder: "#d9d3ca",
    actorBorder: "#d9d3ca",
    clusterBorder: "#d9d3ca",
    lineColor: "#847a6e", // sub
    signalColor: "#847a6e",
    actorLineColor: "#847a6e",
    labelBoxBorderColor: "#847a6e",
    activationBorderColor: "#847a6e",
    secondaryColor: "#ebe7df", // head
    labelBoxBkgColor: "#ebe7df",
    activationBkgColor: "#ebe7df",
    tertiaryColor: "#ebe7df",
    clusterBkg: "#ebe7df",
    titleColor: "#29241f", // strong
    edgeLabelBackground: "#f2f0ec", // paper（枠なし＝図の実背景と一致させる）
    noteBkgColor: "#ebe7df",
    noteTextColor: "#3a342d",
    noteBorderColor: "#d9d3ca",
  },
  dark: {
    darkMode: true,
    fontFamily: FONT_FAMILY,
    fontSize: "15px",
    background: "#1e1b18", // paper
    primaryColor: "#26221e", // card
    mainBkg: "#26221e",
    actorBkg: "#26221e",
    primaryTextColor: "#e4dcd1", // ink
    textColor: "#e4dcd1",
    actorTextColor: "#e4dcd1",
    nodeTextColor: "#e4dcd1",
    signalTextColor: "#e4dcd1",
    labelTextColor: "#e4dcd1",
    loopTextColor: "#e4dcd1",
    primaryBorderColor: "#3e3831", // line
    nodeBorder: "#3e3831",
    actorBorder: "#3e3831",
    clusterBorder: "#3e3831",
    lineColor: "#9c9186", // sub
    signalColor: "#9c9186",
    actorLineColor: "#9c9186",
    labelBoxBorderColor: "#9c9186",
    activationBorderColor: "#9c9186",
    secondaryColor: "#26221e", // card
    labelBoxBkgColor: "#26221e",
    activationBkgColor: "#26221e",
    tertiaryColor: "#26221e",
    clusterBkg: "#26221e",
    titleColor: "#f1eae1", // strong
    edgeLabelBackground: "#1e1b18", // paper
    noteBkgColor: "#26221e",
    noteTextColor: "#e4dcd1",
    noteBorderColor: "#3e3831",
  },
};

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
 * @param {'light' | 'dark'} variant
 * @param {string} ns
 * @returns {Promise<string>}
 */
async function renderTheme(renderer, source, variant, ns) {
  const [result] = await renderer([source], {
    prefix: ns,
    css: FONT_CSS_URL,
    mermaidConfig: {
      theme: "base",
      fontFamily: FONT_FAMILY, // sequence図等は themeVariables でなくトップレベルを読む
      fontSize: 15, // トップレベルは数値(px)。themeVariables 側は文字列（上記★）
      themeVariables: THEME_VARIABLES[variant],
    },
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
            renderTheme(renderer, source, "light", `mmd${index}l`),
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
        // light を既定表示、dark を dark: で表示する。figure まわりのCSSは
        // global.css の .mermaid-diagram ブロック（枠なし・横スクロール）。
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
