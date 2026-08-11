// 対象spec: docs/spec/playground-project.md（R-1〜R-7 / AC-1〜AC-7・AC-10）
import { pathToFileURL } from "node:url";

import { describe, it, expect } from "vitest";

import { projectHash } from "../../plugins/project-gist.mjs";
import type { GistMap, ProjectFile } from "../../plugins/project-gist.mjs";
import { compileWithProject } from "../helpers/project";

/** 与えたファイル群のハッシュをキーにしたテスト用マッピングを作る。 */
function gistMapFor(files: ProjectFile[], id = "abc123"): GistMap {
  return {
    [projectHash(files)]: {
      id,
      url: `https://gist.github.com/rust-play/${id}`,
    },
  };
}

const TWO_FILES_SOURCE = [
  ":::project",
  "```rust:src/main.rs",
  "mod util;",
  "",
  "fn main() {}",
  "```",
  "",
  "```rust:src/util.rs",
  "pub fn helper() {}",
  "```",
  ":::",
].join("\n");

const TWO_FILES_MAP = gistMapFor([
  { name: "src/main.rs", code: "mod util;\n\nfn main() {}" },
  { name: "src/util.rs", code: "pub fn helper() {}" },
]);

describe("project（:::project のPlaygroundプロジェクト変換・playground-project spec）", () => {
  describe("ラッパとボタン", () => {
    it("[AC-1] .code-projectラッパ内にgist URLのplayground-openアンカーが1つだけ出力される", () => {
      const html = compileWithProject(TWO_FILES_SOURCE, {
        gistMap: TWO_FILES_MAP,
      });
      expect(html).toContain('<div class="code-project">');
      expect(html).toContain('<div class="code-project-header">');
      expect(html).toContain('<div class="code-project-body">');
      expect(html.match(/playground-open/g)).toHaveLength(1);
      expect(html).toContain(
        'href="https://play.rust-lang.org/?version=stable&amp;edition=2024&amp;gist=abc123"',
      );
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it("[AC-1] Gist IDはマッピングからプロジェクトのハッシュで解決される", () => {
      const html = compileWithProject(TWO_FILES_SOURCE, {
        gistMap: gistMapFor(
          [
            { name: "src/main.rs", code: "mod util;\n\nfn main() {}" },
            { name: "src/util.rs", code: "pub fn helper() {}" },
          ],
          "deadbeef",
        ),
      });
      expect(html).toContain("gist=deadbeef");
    });

    it("ヘッダーにeyebrowとファイル数が出力される", () => {
      const html = compileWithProject(TWO_FILES_SOURCE, {
        gistMap: TWO_FILES_MAP,
      });
      expect(html).toContain('<p class="code-project-eyebrow">// project</p>');
      expect(html).toContain('<p class="code-project-count">2 files</p>');
    });

    it("ボタン内に新規タブを示す矢印svgが出力される", () => {
      const html = compileWithProject(TWO_FILES_SOURCE, {
        gistMap: TWO_FILES_MAP,
      });
      expect(html).toContain('viewBox="0 0 24 24"');
      expect(html).toContain('d="M7 7h10v10"');
    });
  });

  describe("コードブロックのidとファイルツリー", () => {
    it("[AC-2] 各コードブロックのラッパにidが付き、ツリーのhrefが対応する", () => {
      const html = compileWithProject(TWO_FILES_SOURCE, {
        gistMap: TWO_FILES_MAP,
      });
      expect(html).toContain('id="project-1-src-main-rs"');
      expect(html).toContain('href="#project-1-src-main-rs"');
      expect(html).toContain('id="project-1-src-util-rs"');
      expect(html).toContain('href="#project-1-src-util-rs"');
    });

    it("[AC-2] ツリーは階層表示でディレクトリ優先+名前昇順、ディレクトリは非リンクで/接尾", () => {
      const source = [
        ":::project",
        "```txt:data.txt",
        "input",
        "```",
        "",
        "```rust:src/util.rs",
        "pub fn helper() {}",
        "```",
        "",
        "```rust:src/main.rs",
        "fn main() {}",
        "```",
        ":::",
      ].join("\n");
      const html = compileWithProject(source, {
        gistMap: gistMapFor([
          { name: "data.txt", code: "input" },
          { name: "src/util.rs", code: "pub fn helper() {}" },
          { name: "src/main.rs", code: "fn main() {}" },
        ]),
      });
      expect(html).toContain('<div class="code-project-tree">');
      // ディレクトリは非リンク・`/` 接尾
      expect(html).toContain('<span class="tree-dir">src/</span>');
      expect(html).not.toContain(">src/</a>");
      // 枝記号（ネスト階層は │ の縦罫線を引き継ぐ）
      expect(html).toContain("├── ");
      expect(html).toContain("│   └── ");
      // 並び順: ディレクトリ（src/）が先、ファイルは名前昇順（main.rs → util.rs）、data.txtは最後
      const posSrc = html.indexOf('<span class="tree-dir">src/</span>');
      const posMain = html.indexOf(">main.rs</a>");
      const posUtil = html.indexOf(">util.rs</a>");
      const posData = html.indexOf(">data.txt</a>");
      expect(posSrc).toBeGreaterThan(-1);
      expect(posMain).toBeGreaterThan(posSrc);
      expect(posUtil).toBeGreaterThan(posMain);
      expect(posData).toBeGreaterThan(posUtil);
    });

    it("[AC-2] 同一ページに2つの:::projectがあってもidはページ内で一意になる", () => {
      const source = `${TWO_FILES_SOURCE}\n\n${TWO_FILES_SOURCE}`;
      const html = compileWithProject(source, { gistMap: TWO_FILES_MAP });
      expect(html).toContain('id="project-1-src-main-rs"');
      expect(html).toContain('id="project-2-src-main-rs"');
      expect(html).toContain('href="#project-2-src-main-rs"');
    });
  });

  describe("タイトル", () => {
    it("[AC-3] [タイトル]がcode-project-titleとして出力される", () => {
      const source = TWO_FILES_SOURCE.replace(
        ":::project",
        ":::project[モジュール分割の検証]",
      );
      const html = compileWithProject(source, { gistMap: TWO_FILES_MAP });
      expect(html).toContain(
        '<p class="code-project-title">モジュール分割の検証</p>',
      );
    });

    it("[AC-3] タイトル省略時はタイトル要素を出力しない", () => {
      const html = compileWithProject(TWO_FILES_SOURCE, {
        gistMap: TWO_FILES_MAP,
      });
      expect(html).not.toContain("code-project-title");
    });
  });

  describe("コード以外の子要素", () => {
    const proseSource = [
      "::::project",
      "```rust:src/main.rs",
      "fn main() {}",
      "```",
      "",
      "解説文です。",
      "",
      ":::figure[図1]",
      "![alt](/img.png)",
      ":::",
      "",
      "```rust:src/util.rs",
      "pub fn helper() {}",
      "```",
      "::::",
    ].join("\n");
    const proseMap = gistMapFor([
      { name: "src/main.rs", code: "fn main() {}" },
      { name: "src/util.rs", code: "pub fn helper() {}" },
    ]);

    it("[AC-4] コードブロック間の解説文と:::figureが通常どおり表示される", () => {
      const html = compileWithProject(proseSource, { gistMap: proseMap });
      expect(html).toContain("解説文です。");
      expect(html).toContain("<figure>");
      expect(html).toContain("<figcaption>図1</figcaption>");
    });

    it("[AC-4] 解説文と:::figureはファイルツリーに含まれない（リンク数=ファイル数）", () => {
      const html = compileWithProject(proseSource, { gistMap: proseMap });
      expect(html.match(/href="#project-1-/g)).toHaveLength(2);
    });

    it("本文中の脚注参照が脚注化される（containerDirective型のままだと収集されない）", () => {
      const source = [
        "::::project",
        "```rust:src/main.rs",
        "fn main() {}",
        "```",
        "",
        "脚注の例[^1]です。",
        "::::",
        "",
        "[^1]: 脚注の内容",
      ].join("\n");
      const html = compileWithProject(source, {
        gistMap: gistMapFor([{ name: "src/main.rs", code: "fn main() {}" }]),
      });
      expect(html).toContain("data-footnote-ref");
      expect(html).toContain("脚注の内容");
      expect(html).not.toContain("[^1]");
    });
  });

  describe("表示とGist内容の非対称（diffマーカー）", () => {
    it("[AC-5] 表示側のコードにはマーカーが残り、マッピングは除去後コードのハッシュで解決される", () => {
      const source = [
        ":::project",
        "```rust:src/main.rs",
        "fn main() {",
        "    let x = 1; // [!code ++]",
        "}",
        "```",
        ":::",
      ].join("\n");
      // マッピングのキーはマーカー除去後コードのハッシュ（projectHashが内部で除去する仕様と
      // 一致することを、除去済みコードから作ったキーで解決できることをもって検証する）
      const html = compileWithProject(source, {
        gistMap: gistMapFor([
          { name: "src/main.rs", code: "fn main() {\n    let x = 1;\n}" },
        ]),
      });
      expect(html).toContain("[!code ++]");
      expect(html).toContain("gist=abc123");
    });
  });

  describe("ビルドエラー（R-7）", () => {
    const fileURL = pathToFileURL("/tmp/sample.md");

    it("[AC-6] ファイル名記法のないコードブロックはエラーになり、パスと位置を含む", () => {
      const source = [
        ":::project",
        "```rust",
        "fn main() {}",
        "```",
        ":::",
      ].join("\n");
      const call = () => compileWithProject(source, { fileURL });
      expect(call).toThrow(/ファイル名がありません/);
      expect(call).toThrow(/sample\.md:2:1/);
    });

    it("[AC-6] src/main.rsもsrc/lib.rsもないとエラーになる", () => {
      const source = [
        ":::project",
        "```rust:src/util.rs",
        "pub fn helper() {}",
        "```",
        ":::",
      ].join("\n");
      const call = () => compileWithProject(source, { fileURL });
      expect(call).toThrow(/src\/main\.rs も src\/lib\.rs もありません/);
      expect(call).toThrow(/sample\.md:1:1/);
    });

    it("[AC-6] ファイル名の重複はエラーになる", () => {
      const source = [
        ":::project",
        "```rust:src/main.rs",
        "fn main() {}",
        "```",
        "",
        "```rust:src/main.rs",
        "fn main() { unreachable!(); }",
        "```",
        ":::",
      ].join("\n");
      const call = () => compileWithProject(source, { fileURL });
      expect(call).toThrow(/ファイル名 src\/main\.rs が重複しています/);
      expect(call).toThrow(/sample\.md:6:1/);
    });

    it("[AC-6] playgroundメタの併用はエラーになる", () => {
      const source = [
        ":::project",
        "```rust:src/main.rs playground",
        "fn main() {}",
        "```",
        ":::",
      ].join("\n");
      const call = () => compileWithProject(source, { fileURL });
      expect(call).toThrow(/playground メタは付けられません/);
      expect(call).toThrow(/sample\.md:2:1/);
    });

    it("[AC-7] マッピング未登録はエラーになり、同期スクリプトの実行案内を含む", () => {
      const call = () =>
        compileWithProject(TWO_FILES_SOURCE, { gistMap: {}, fileURL });
      expect(call).toThrow(/Gistマッピングに未登録です/);
      expect(call).toThrow(/npm run sync:playground/);
    });
  });

  describe("プロジェクト境界（R-1 / R-6）", () => {
    it("ネストしたディレクティブ内のコードブロックはファイル扱いされない（エラーにもならない）", () => {
      const source = [
        "::::project",
        "```rust:src/main.rs",
        "fn main() {}",
        "```",
        "",
        ":::details[補足]",
        "```rust",
        "fn helper() {}",
        "```",
        ":::",
        "::::",
      ].join("\n");
      const html = compileWithProject(source, {
        gistMap: gistMapFor([{ name: "src/main.rs", code: "fn main() {}" }]),
      });
      expect(html).toContain("<details>");
      // ツリーのリンクは直下ファイルの1件だけ・ファイル数も1
      expect(html.match(/href="#project-1-/g)).toHaveLength(1);
      expect(html).toContain('<p class="code-project-count">1 file</p>');
    });

    it("他のディレクティブ内に置いた:::projectも通常どおりプロジェクトになる（spec R-1）", () => {
      const source = [
        "::::details[外]",
        ":::project",
        "```rust:src/main.rs",
        "fn main() {}",
        "```",
        ":::",
        "::::",
      ].join("\n");
      const html = compileWithProject(source, {
        gistMap: gistMapFor([{ name: "src/main.rs", code: "fn main() {}" }]),
      });
      expect(html).toContain("<details>");
      expect(html).toContain('<div class="code-project">');
      expect(html).toContain("gist=abc123");
    });

    it("[AC-10] :::projectの外の```rust playground単独ブロックの出力は従来のまま", () => {
      const source = [
        ":::project",
        "```rust:src/main.rs",
        "fn main() {}",
        "```",
        ":::",
        "",
        "```rust playground",
        "fn main() { println!(); }",
        "```",
      ].join("\n");
      const html = compileWithProject(source, {
        gistMap: gistMapFor([{ name: "src/main.rs", code: "fn main() {}" }]),
      });
      // 単独ブロック版の構造（pages AC-11）: .code-playground ラッパ + code= のURL
      expect(html).toContain('<div class="code-playground">');
      expect(html).toContain("&amp;code=");
      expect(html).toContain(">Playgroundで開く</a>");
      // ボタンはプロジェクトに1つ + 単独ブロックに1つ
      expect(html.match(/playground-open/g)).toHaveLength(2);
    });
  });
});
