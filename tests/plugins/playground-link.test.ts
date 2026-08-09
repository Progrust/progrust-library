import { describe, it, expect } from "vitest";

import { compileWithPlaygroundLink } from "../helpers/playground-link";

const PLAYGROUND_URL =
  "https://play.rust-lang.org/?version=stable&edition=2024&code=";

describe("playground-link（```rust playground のボタン付与・pages R-23 / AC-11・docs/markdown-pipeline/playground.md）", () => {
  it("[AC-11] ```rust playground をcode-playgroundラッパー + playground-openアンカーに変換する", () => {
    const html = compileWithPlaygroundLink(
      "```rust playground\nfn main() {}\n```",
    );
    expect(html).toContain('<div class="code-playground">');
    expect(html).toContain('class="playground-open"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain(">Playgroundで開く</a>");
    expect(html).toContain("fn main() {}");
  });

  it("[AC-11] hrefがstable/edition 2024のPlayground URL + URLエンコード済みコード全文になる", () => {
    const code = 'fn main() {\n    println!("hello & <world>");\n}';
    const html = compileWithPlaygroundLink(
      "```rust playground\n" + code + "\n```",
    );
    // hrefはHTML属性としてシリアライズされるため & は &#x26; 等にエスケープされ得る。
    // エンコード済みコード部分（&を含まない）で検証する。
    expect(html).toContain(encodeURIComponent(code));
    expect(html).toContain("version=stable");
    expect(html).toContain("edition=2024");
    expect(html).toContain("play.rust-lang.org");
  });

  it("[AC-11] メタなしの ```rust にはボタンが付かない", () => {
    const html = compileWithPlaygroundLink("```rust\nfn main() {}\n```");
    expect(html).not.toContain("code-playground");
    expect(html).not.toContain("playground-open");
  });

  it("[AC-11] rust以外の言語（```python playground）にはボタンが付かない", () => {
    const html = compileWithPlaygroundLink(
      "```python playground\nprint(1)\n```",
    );
    expect(html).not.toContain("code-playground");
    expect(html).not.toContain("playground-open");
  });

  it("```rust:main.rs playground でファイル名タブとボタンが共存する", () => {
    const html = compileWithPlaygroundLink(
      "```rust:main.rs playground\nfn main() {}\n```",
    );
    expect(html).toContain('<div class="code-block">');
    expect(html).toContain('<span class="code-filename">main.rs</span>');
    expect(html).toContain('<div class="code-playground">');
    expect(html).toContain('class="playground-open"');
  });

  it("metaの他トークンは温存しplaygroundだけを除去する（無限ループ防止も兼ねる）", () => {
    const html = compileWithPlaygroundLink(
      "```rust playground foo\nfn main() {}\n```",
    );
    // ボタンは付く
    expect(html).toContain('class="playground-open"');
    // ボタンは1つだけ（自己再訪問やmeta残存による二重付与がない）
    expect(html.match(/playground-open/g)).toHaveLength(1);
  });
});

describe("playground-link コード記法の除去（pages R-25 / AC-15）", () => {
  it("[AC-15] 表示側にはマーカーを残し、hrefからは [!code ++] を除去する", () => {
    const html = compileWithPlaygroundLink(
      "```rust playground\nlet x = 2; // [!code ++]\n```",
    );
    // 表示コードはShikiのハイライトに必要なのでマーカーごと残す
    expect(html).toContain("let x = 2; // [!code ++]");
    // hrefはマーカーを外した実行可能コード
    expect(html).toContain(encodeURIComponent("let x = 2;"));
    expect(html).not.toContain(encodeURIComponent("[!code"));
  });

  it("[AC-15] [!code --] が付いた行はhrefから行ごと除去する", () => {
    const html = compileWithPlaygroundLink(
      "```rust playground\nlet x = 1; // [!code --]\nlet x = 2; // [!code ++]\n```",
    );
    expect(html).toContain(encodeURIComponent("let x = 2;"));
    expect(html).not.toContain(encodeURIComponent("let x = 1;"));
  });

  it("[AC-15] 既存コメント末尾のマーカーはマーカー部分だけ除去する", () => {
    const html = compileWithPlaygroundLink(
      "```rust playground\nlet x = 2; // 値を変えた [!code ++]\n```",
    );
    expect(html).toContain(encodeURIComponent("let x = 2; // 値を変えた"));
  });

  it("[AC-15] マーカーだけのコメント行はhrefから行ごと除去する", () => {
    const html = compileWithPlaygroundLink(
      "```rust playground\nfn main() {}\n// [!code highlight]\n```",
    );
    expect(html).toContain(encodeURIComponent("fn main() {}"));
    expect(html).not.toContain(encodeURIComponent("//"));
  });

  it("マーカーを含まないコードはそのまま（改行・インデントを保つ）", () => {
    const code = "fn main() {\n    let x = 1;\n}";
    const html = compileWithPlaygroundLink(
      "```rust playground\n" + code + "\n```",
    );
    expect(html).toContain(encodeURIComponent(code));
  });
});

describe("playground-link URL生成", () => {
  it("コードがそのままURLエンコードされてhrefに乗る", () => {
    const html = compileWithPlaygroundLink(
      "```rust playground\nlet x = 1;\n```",
    );
    // hrefの & は &amp; にエスケープされてシリアライズされる
    expect(html).toContain(
      PLAYGROUND_URL.replace(/&/g, "&amp;") + "let%20x%20%3D%201%3B",
    );
  });
});
