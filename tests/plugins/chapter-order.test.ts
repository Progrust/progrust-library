import { describe, it, expect } from "vitest";

import { findChapterOrderViolations } from "../../plugins/chapter-order.mjs";

describe("findChapterOrderViolations（章の連番形式・重複・content-model R-9）", () => {
  it("連番が揃っていて重複がなければ違反なし", () => {
    const violations = findChapterOrderViolations(
      new Map([["rust-book", ["01-intro.md", "02-environment.md"]]]),
    );
    expect(violations).toEqual([]);
  });

  it("[AC-5] 連番プレフィックスがない章ファイルを検出する", () => {
    const violations = findChapterOrderViolations(
      new Map([["rust-book", ["01-intro.md", "environment.md"]]]),
    );
    expect(violations).toContainEqual({
      kind: "no-sequence",
      book: "rust-book",
      file: "environment.md",
    });
  });

  it("[AC-5] 連番除去後に重複する章ファイルを検出する", () => {
    const violations = findChapterOrderViolations(
      new Map([["rust-book", ["01-setup.md", "02-setup.md"]]]),
    );
    expect(violations).toContainEqual({
      kind: "duplicate-slug",
      book: "rust-book",
      slug: "setup",
      files: ["01-setup.md", "02-setup.md"],
    });
  });

  it("違反は本ごとに独立して判定する（別の本の同名slugは重複ではない）", () => {
    const violations = findChapterOrderViolations(
      new Map([
        ["book-a", ["01-intro.md"]],
        ["book-b", ["01-intro.md"]],
      ]),
    );
    expect(violations).toEqual([]);
  });
});
