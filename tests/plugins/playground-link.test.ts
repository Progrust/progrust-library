import { describe, it, expect } from "vitest";

import { compileWithPlaygroundLink } from "../helpers/playground-link";

const PLAYGROUND_URL =
  "https://play.rust-lang.org/?version=stable&edition=2024&code=";

describe("playground-link（```rust playground のボタン付与・docs/markdown-pipeline/playground.md）", () => {
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
