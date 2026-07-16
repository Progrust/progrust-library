import { describe, it, expect } from "vitest";

import { highlight } from "../helpers/shiki-theme";

// 対象spec: docs/spec/theme.md（AC番号は同文書）。
// 配色の期待値は docs/ui-design/ui-design-spec.md「コードブロック」の確定パレット（6色）。
const RUST = `// 所有権を移動する
fn take<'a>(s: &'a mut String) -> usize {
    let n: usize = 42;
    let msg = "hello";
    if true { s.len() + n } else { 0 }
}`;

describe("shiki-theme（カスタムsingle theme・確定パレット6色）", () => {
  it("キーワード（fn / let / mut）が #F0684A になる", async () => {
    const html = await highlight(RUST, "rust");
    // 同色の隣接トークンは1スパンに結合され、先行空白を含むことがある
    expect(html).toContain('<span style="color:#F0684A">fn</span>');
    expect(html).toMatch(/<span style="color:#F0684A">\s*let<\/span>/);
    expect(html).toMatch(/<span style="color:#F0684A">\s*mut<\/span>/);
  });

  it("ライフタイム・数値・言語定数が #D9B25E になる", async () => {
    const html = await highlight(RUST, "rust");
    expect(html).toContain('<span style="color:#D9B25E">\'a</span>');
    expect(html).toContain('<span style="color:#D9B25E">42</span>');
    expect(html).toMatch(/<span style="color:#D9B25E">\s*true<\/span>/);
  });

  it("文字列が #D08A72 になる", async () => {
    const html = await highlight(RUST, "rust");
    expect(html).toMatch(/<span style="color:#D08A72">[^<]*hello[^<]*<\/span>/);
  });

  it("コメントが地の文字色の60%（#E4DCD199）になる", async () => {
    const html = await highlight(RUST, "rust");
    expect(html).toMatch(
      /<span style="color:#E4DCD199">[^<]*所有権を移動する<\/span>/,
    );
  });

  it("関数名・メソッド呼び出し・マクロが #A9B665 になる", async () => {
    const html = await highlight(
      `fn take(s: &String) -> usize { println!("{}", s); s.len() }`,
      "rust",
    );
    expect(html).toMatch(/<span style="color:#A9B665">\s*take<\/span>/);
    expect(html).toContain('<span style="color:#A9B665">len</span>');
    expect(html).toMatch(/<span style="color:#A9B665">\s*println!<\/span>/);
  });

  it("型名・enumバリアント（Some / Ok）が #7FB5A3 になる", async () => {
    const html = await highlight(
      `fn get() -> Option<Vec<u8>> { Some(Vec::new()) }`,
      "rust",
    );
    expect(html).toMatch(/<span style="color:#7FB5A3">\s*Option<\/span>/);
    expect(html).toContain('<span style="color:#7FB5A3">Vec</span>');
    expect(html).toMatch(/<span style="color:#7FB5A3">\s*Some<\/span>/);
  });

  it("self / Self は型色ではなく #D9B25E になる", async () => {
    const html = await highlight(
      `impl P { fn id(&self) -> Self { Self }}`,
      "rust",
    );
    expect(html).toMatch(/<span style="color:#D9B25E">\s*self<\/span>/);
    expect(html).toMatch(/<span style="color:#D9B25E">\s*Self<\/span>/);
  });

  it("ライフタイムは型色（#7FB5A3）に食われず #D9B25E のまま", async () => {
    const html = await highlight(RUST, "rust");
    expect(html).not.toContain('<span style="color:#7FB5A3">\'a</span>');
    expect(html).toContain('<span style="color:#D9B25E">\'a</span>');
  });

  it("演算子（->）はキーワード色にならない", async () => {
    const html = await highlight(RUST, "rust");
    // bare `keyword` スコープを使うと keyword.operator.* がマッチして -> が赤くなる（回帰防止）
    expect(html).not.toMatch(
      /<span style="color:#F0684A">[^<]*-&gt;[^<]*<\/span>/,
    );
  });

  it("[AC-4] preにインラインの背景色・前景色が残らない（html.darkの切替CSSを負かさない）", async () => {
    const html = await highlight(RUST, "rust");
    const preTag = html.match(/<pre[^>]*>/)?.[0] ?? "";
    expect(preTag).not.toContain("background-color");
    expect(preTag).not.toMatch(/[^-]color:/);
  });

  it("Rust以外の言語（TypeScript）でもキーワード・文字列の配色が適用される", async () => {
    const html = await highlight(
      `const x: number = 1;\n// note\nexport function f() { return "s"; }`,
      "ts",
    );
    expect(html).toContain('<span style="color:#F0684A">const</span>');
    expect(html).toMatch(/<span style="color:#D08A72">[^<]*s[^<]*<\/span>/);
    expect(html).toMatch(/<span style="color:#E4DCD199">\/\/ note<\/span>/);
  });
});
