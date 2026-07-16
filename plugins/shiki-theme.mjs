// @ts-check
// コードハイライトのカスタムShikiテーマとpreインラインスタイル除去transformer。
// 配色は docs/ui-design/ui-design-spec.md「コードブロック」の確定4色
// （キーワード #F0684A / ライフタイム・数値系 #D9B25E / 文字列 #D08A72 /
// コメント = 地の文字色 #E4DCD1 の opacity 60% ≒ alpha付きhex #E4DCD199）。
// E案（ライトでもコードだけダーク面）により配色は両テーマ共通のため、
// dual themeではなくsingle themeで運用する（docs/markdown-pipeline/shiki.md）。

/**
 * 確定4色パレットのカスタムテーマ（single theme用）。
 *
 * スコープ設計の注意（Rust文法の実測に基づく。shiki.md参照）:
 * - bare `keyword` は使わない（`->` や `&` 等の演算子が `keyword.operator.*` で
 *   マッチしてキーワード色になってしまうため、`keyword.control` / `keyword.other` に限定する）
 * - Rustのライフタイムは `entity.name.type.lifetime` + `punctuation.definition.lifetime`
 *   （`storage.modifier.lifetime` ではない。後者は他文法向けの保険として残す）
 *
 * @type {import("shiki").ThemeRegistration}
 */
export const progrustCodeTheme = {
  name: "progrust-code",
  type: "dark",
  colors: {
    // 背景・前景は transformerCodeBg + global.css 側で管理するが、
    // Shikiがテーマ検証で参照するため実値を入れておく
    "editor.foreground": "#E4DCD1",
    "editor.background": "#2A241F",
  },
  tokenColors: [
    {
      // キーワード（fn / let / if / return / const / import 等）
      scope: [
        "keyword.control",
        "keyword.other",
        "storage.type",
        "storage.modifier",
      ],
      settings: { foreground: "#F0684A" },
    },
    {
      // ライフタイム・数値・言語定数（true / false / None 等）
      scope: [
        "entity.name.type.lifetime",
        "punctuation.definition.lifetime",
        "storage.modifier.lifetime",
        "constant.numeric",
        "constant.language",
      ],
      settings: { foreground: "#D9B25E" },
    },
    {
      // 文字列（引用符・エスケープ含む）
      scope: ["string"],
      settings: { foreground: "#D08A72" },
    },
    {
      // コメント（地の文字色 + opacity 60%。alpha付きhexはそのままインライン出力される）
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#E4DCD199" },
    },
  ],
};

/**
 * single themeが `<pre>` に焼き込むインラインの背景・前景色を除去するtransformer。
 * インラインstyleのままだと `html.dark .astro-code { background: … }` の
 * テーマ切替CSS（theme R-5）が負けるため、背景・前景とも global.css 側で管理する。
 *
 * @type {import("shiki").ShikiTransformer}
 */
export const transformerCodeBg = {
  name: "progrust:code-bg",
  pre(node) {
    if (typeof node.properties.style !== "string") return;
    const style = node.properties.style
      .split(";")
      .filter((decl) => {
        const prop = decl.split(":")[0]?.trim();
        return prop !== "background-color" && prop !== "color";
      })
      .join(";");
    if (style) {
      node.properties.style = style;
    } else {
      delete node.properties.style;
    }
  },
};
