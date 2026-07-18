// @ts-check
// コードハイライトのカスタムShikiテーマとpreインラインスタイル除去transformer。
// 配色は docs/ui-design/ui-design-spec.md「コードブロック」の確定パレット（6色）
// （キーワード #D4715A / 関数 #A9B665 / 型 #7FB5A3 / ライフタイム・数値系 #D9B25E /
// 文字列 #D08A72 / コメント = 地の文字色 #E4DCD1 の opacity 60% ≒ alpha付きhex #E4DCD199）。
// E案（ライトでもコードだけダーク面）により配色は両テーマ共通のため、
// dual themeではなくsingle themeで運用する（docs/markdown-pipeline/shiki.md）。

/**
 * 確定パレット（6色）のカスタムテーマ（single theme用）。
 *
 * スコープ設計の注意（Rust文法の実測に基づく。shiki.md参照）:
 * - bare `keyword` は使わない（`->` や `&` 等の演算子が `keyword.operator.*` で
 *   マッチしてキーワード色になってしまうため、`keyword.control` / `keyword.other` に限定する）
 * - Rustのライフタイムは `entity.name.type.lifetime` + `punctuation.definition.lifetime`
 *   （`storage.modifier.lifetime` ではない。後者は他文法向けの保険として残す）
 * - `entity.name.type.lifetime`（金）と `entity.name.type`（ティール）はセレクタの
 *   具体度で前者が勝つため、ライフタイムが型色に食われることはない
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
      // キーワード（fn / let / if / return / const / import 等）+ HTMLタグ名
      scope: [
        "keyword.control",
        "keyword.other",
        "storage.type",
        "storage.modifier",
        "entity.name.tag",
      ],
      settings: { foreground: "#D4715A" },
    },
    {
      // 関数・メソッド・マクロ（println! 等）・シェルコマンド・TOMLキー
      scope: [
        "entity.name.function",
        "support.function",
        "entity.name.command",
        "variable.other.key",
      ],
      settings: { foreground: "#A9B665" },
    },
    {
      // 型・名前空間・enumバリアント（Some / Ok 等）・環境変数・
      // プロパティキー（CSSプロパティ / JSONキー）
      scope: [
        "entity.name.type",
        "entity.name.namespace",
        "support.type",
        "support.class",
        "variable.other.assignment",
      ],
      settings: { foreground: "#7FB5A3" },
    },
    {
      // ライフタイム・数値・言語定数（true / false / None 等）に加え、
      // self / this・エスケープ・文字列補間の括弧・シェルフラグ・属性名・TOMLセクション
      scope: [
        "entity.name.type.lifetime",
        "punctuation.definition.lifetime",
        "storage.modifier.lifetime",
        "constant.numeric",
        "constant.language",
        "variable.language",
        "constant.character.escape",
        "punctuation.definition.interpolation",
        "punctuation.definition.template-expression",
        "constant.other.option",
        "entity.other.attribute-name",
        "entity.name.section",
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
