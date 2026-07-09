import { describe, it, expect } from "vitest";

import { compileWithCodeFilename } from "../helpers/code-filename";

describe("code-filename（```lang:file のファイル名分離・docs/markdown-pipeline/shiki.md）", () => {
  it("```rust:main.rs をcode-blockラッパー + code-filenameラベルに変換しコード本文を保持する", () => {
    const html = compileWithCodeFilename("```rust:main.rs\nfn main() {}\n```");
    expect(html).toContain('<div class="code-block">');
    expect(html).toContain('<span class="code-filename">main.rs</span>');
    expect(html).toContain("fn main() {}");
  });

  it("パス区切りを含むファイル名（src/main.rs）でも最初のコロンだけで分割する", () => {
    const html = compileWithCodeFilename(
      "```rust:src/main.rs\nfn main() {}\n```",
    );
    expect(html).toContain('<span class="code-filename">src/main.rs</span>');
  });

  it("コロンを含まないコードブロックはラップせず素通りさせる", () => {
    const html = compileWithCodeFilename("```rust\nfn main() {}\n```");
    expect(html).not.toContain("code-block");
    expect(html).not.toContain("code-filename");
  });

  it("ファイル名部分が空（```rust:）のときはラップしない", () => {
    const html = compileWithCodeFilename("```rust:\nfn main() {}\n```");
    expect(html).not.toContain("code-filename");
  });

  it("言語部分が空（```:main.rs）のときはラップしない", () => {
    const html = compileWithCodeFilename("```:main.rs\nfn main() {}\n```");
    expect(html).not.toContain("code-block");
    expect(html).not.toContain("code-filename");
  });
});
