import { describe, it, expect } from "vitest";

import { stripCodeNotation } from "../../plugins/code-notation.mjs";

describe("code-notation（Shikiのコード記法コメント除去・pages R-25）", () => {
  it("行末の [!code ++] を除去する（インデントは保つ）", () => {
    expect(stripCodeNotation("    let x = 1; // [!code ++]")).toBe(
      "    let x = 1;",
    );
  });

  it("[!code --] が付いた行は行ごと除去する", () => {
    expect(
      stripCodeNotation(
        'let x = 1; // [!code --]\nlet x = 2; // [!code ++]\nprintln!("{x}");',
      ),
    ).toBe('let x = 2;\nprintln!("{x}");');
  });

  it("既存コメントの末尾に付いたマーカーはマーカー部分だけ除去する", () => {
    expect(stripCodeNotation("    ..base // 引き継ぐ [!code ++]")).toBe(
      "    ..base // 引き継ぐ",
    );
  });

  it("マーカー除去でコメントが空になる場合は行末の // ごと落とす", () => {
    expect(stripCodeNotation("#[derive(Debug)] //  [!code ++]")).toBe(
      "#[derive(Debug)]",
    );
  });

  it("マーカーだけのコメント行は行ごと除去する", () => {
    expect(stripCodeNotation("fn main() {}\n// [!code highlight]")).toBe(
      "fn main() {}",
    );
  });

  it("文字列リテラル中の // は消さない", () => {
    expect(stripCodeNotation('let s = "a // b"; // [!code ++]')).toBe(
      'let s = "a // b";',
    );
  });

  it("[!code word:foo] のように値に : を含む記法も除去する", () => {
    expect(stripCodeNotation("let x = 1; // [!code word:foo]")).toBe(
      "let x = 1;",
    );
  });

  it("マーカーを含まないコードは改行・空行ごとそのまま返す", () => {
    const code = "fn main() {\n\n    let x = 1;\n}";
    expect(stripCodeNotation(code)).toBe(code);
  });
});
