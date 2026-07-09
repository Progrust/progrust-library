import { describe, it, expect } from "vitest";

import { assertUniqueDictSlugs } from "../../plugins/dict-index.mjs";

describe("assertUniqueDictSlugs（辞書ファイル名一意性・content-model R-6）", () => {
  it("slugが全て一意なら何もしない", () => {
    expect(() =>
      assertUniqueDictSlugs([
        { slug: "ownership", path: "/content/dict/basics/ownership.md" },
        { slug: "borrowing", path: "/content/dict/basics/borrowing.md" },
      ]),
    ).not.toThrow();
  });

  it("[AC-2] 別フォルダに同名ファイルがあるとビルドエラーになり両ファイルパスがエラーに含まれる", () => {
    const call = () =>
      assertUniqueDictSlugs([
        { slug: "foo", path: "/content/dict/a/foo.md" },
        { slug: "foo", path: "/content/dict/b/foo.md" },
      ]);
    expect(call).toThrow(/foo/);
    expect(call).toThrow(/content\/dict\/a\/foo\.md/);
    expect(call).toThrow(/content\/dict\/b\/foo\.md/);
  });
});
