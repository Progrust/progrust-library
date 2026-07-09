import { describe, it, expect } from "vitest";

import type { DictIndexEntry } from "../../plugins/dict-index.mjs";
import { compileWithWikilink } from "../helpers/wikilink";

// 公開/非公開ページの出し分けは fileURL が指すディスク上の frontmatter で決まる
// （content-model R-14 の判定ロジック）。frontmatter のみの固定フィクスチャを使う。
const PUBLIC_PAGE = new URL("../fixtures/public-true.md", import.meta.url);
const PRIVATE_PAGE = new URL("../fixtures/public-false.md", import.meta.url);

const dictIndex: DictIndexEntry[] = [
  { slug: "ownership", title: "所有権", public: true },
  { slug: "secret", title: "秘密の辞書", public: false },
];

describe("wikilink（辞書リンク変換・content-model R-13/R-14）", () => {
  it("公開辞書へのwikilinkをtitle付きの<a>に変換する", () => {
    const html = compileWithWikilink(
      "本文中の[[ownership]]です。",
      dictIndex,
      PUBLIC_PAGE,
    );
    expect(html).toContain('href="/dict/ownership"');
    expect(html).toContain("所有権");
    expect(html).toContain('data-dict-link="ownership"');
  });

  it("[AC-9] 存在しないslugへのwikilinkでビルドが失敗しリンク元ファイルとリンク先slugがエラーに含まれる", () => {
    const call = () =>
      compileWithWikilink("[[does-not-exist]]", dictIndex, PUBLIC_PAGE);
    expect(call).toThrow(/does-not-exist/); // リンク先slug（R-15）
    expect(call).toThrow(/public-true\.md/); // リンク元ファイル（R-15）
    expect(call).toThrow(/存在しない/);
  });

  it("[AC-10] 公開ページから非公開辞書へのwikilinkはビルドエラーになる", () => {
    const call = () =>
      compileWithWikilink("[[secret]]", dictIndex, PUBLIC_PAGE);
    expect(call).toThrow(/secret/);
    expect(call).toThrow(/非公開/);
  });

  it("[AC-10] 非公開ページから非公開辞書へのwikilinkはビルドが成功する（非対称ルール）", () => {
    const html = compileWithWikilink("[[secret]]", dictIndex, PRIVATE_PAGE);
    expect(html).toContain('href="/dict/secret"');
    expect(html).toContain("秘密の辞書");
  });
});
