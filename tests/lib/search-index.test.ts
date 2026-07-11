import { describe, it, expect } from "vitest";

import {
  buildSearchEntries,
  type SearchSource,
} from "../../src/lib/search-index";

// 純関数テスト。fixture は SearchSource の最小構造を手組みで用意する（getCollection 非依存）。
// 非公開除外は上流 getPublic* の責務のため純関数側では検証しない（content.test.ts が担保）。
const source = (
  id: string,
  type: SearchSource["type"],
  data: Partial<SearchSource["data"]> = {},
): SearchSource => ({
  id,
  type,
  data: { title: "", description: "", tags: [], ...data },
});

describe("buildSearchEntries（検索インデックスのエントリ変換）", () => {
  it("[AC-1] 全4種別が対応する type と URL のエントリになる（章は本slug/章slugに分解）", () => {
    const sources = [
      source("ownership", "dict"),
      source("perf-tuning", "article"),
      source("rust-web", "book"),
      source("rust-web/intro", "chapter"),
    ];

    const entries = buildSearchEntries(sources);

    expect(entries.map((e) => ({ type: e.type, url: e.url }))).toEqual([
      { type: "dict", url: "/dict/ownership" },
      { type: "article", url: "/articles/perf-tuning" },
      { type: "book", url: "/books/rust-web" },
      { type: "chapter", url: "/books/rust-web/intro" },
    ]);
  });

  it("[AC-1] 章エントリがインデックスに含まれる（章含む）", () => {
    const entries = buildSearchEntries([source("rust-web/intro", "chapter")]);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      type: "chapter",
      url: "/books/rust-web/intro",
    });
  });

  it("title/description/tags を data から素通しする", () => {
    const entries = buildSearchEntries([
      source("ownership", "dict", {
        title: "所有権",
        description: "Rustのメモリ管理の中核概念。",
        tags: ["Rust基礎", "所有権"],
      }),
    ]);

    expect(entries[0]).toEqual({
      title: "所有権",
      description: "Rustのメモリ管理の中核概念。",
      tags: ["Rust基礎", "所有権"],
      type: "dict",
      url: "/dict/ownership",
    });
  });

  it("入力順を保持する（決定的）", () => {
    const sources = [
      source("b", "dict"),
      source("a", "dict"),
      source("c", "article"),
    ];

    expect(buildSearchEntries(sources).map((e) => e.url)).toEqual([
      "/dict/b",
      "/dict/a",
      "/articles/c",
    ]);
  });
});
