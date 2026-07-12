import { describe, it, expect } from "vitest";

import { compileWithExternalLinks } from "../helpers/external-links";

describe("external-links（外部テキストリンクの別タブ化・pages R-24 / AC-13・docs/markdown-pipeline/external-links.md）", () => {
  it("[AC-13] 外部リンク [表示名](https://…) に target=_blank と rel が付く", () => {
    const html = compileWithExternalLinks("[表示名](https://example.com/)");
    expect(html).toContain('href="https://example.com/"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain(">表示名</a>");
  });

  it("httpスキームの外部リンクにも付く", () => {
    const html = compileWithExternalLinks("[表示名](http://example.com/)");
    expect(html).toContain('target="_blank"');
  });

  it("大文字スキーム（HTTPS://）の外部リンクにも付く", () => {
    const html = compileWithExternalLinks("[表示名](HTTPS://EXAMPLE.COM/)");
    expect(html).toContain('target="_blank"');
  });

  it("文中のベアURL（GFM autolink-literal）にも付く", () => {
    const html = compileWithExternalLinks(
      "本文中に https://example.com/ を含む段落です。",
    );
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("[AC-13] 内部リンク（/始まりの絶対パス）には付かない", () => {
    const html = compileWithExternalLinks("[about](/about)");
    expect(html).toContain('href="/about"');
    expect(html).not.toContain("target=");
    expect(html).not.toContain("rel=");
  });

  it("[AC-13] 内部リンク（相対パス）には付かない", () => {
    const html = compileWithExternalLinks("[記事](../articles/foo)");
    expect(html).not.toContain("target=");
  });

  it("ページ内アンカー（#始まり）には付かない", () => {
    const html = compileWithExternalLinks("[見出しへ](#section)");
    expect(html).not.toContain("target=");
  });
});
