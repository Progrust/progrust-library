import { describe, it, expect } from "vitest";

import {
  SEARCH_TYPE_LABEL,
  buildDropdownItems,
} from "../../src/scripts/search-box";
import type { SearchEntry } from "../../src/lib/search-index";

// ドロップダウン表示用の純ロジック（search.md AC-6・R-7/R-8）を検証する。
// 遅延ロード・DOM 配線・遷移そのものは architecture §10 によりビルド + 目視確認。

// 4種別を1件ずつ持つ最小フィクスチャ。章エントリの url は T5-1 導出の章詳細 URL。
const entries: SearchEntry[] = [
  {
    title: "所有権",
    description: "Rustのメモリ管理の中核概念。",
    tags: ["Rust基礎"],
    type: "dict",
    url: "/dict/ownership",
  },
  {
    title: "Rustのエラー処理",
    description: "Result型による回復可能なエラー。",
    tags: ["Rust"],
    type: "article",
    url: "/articles/error-handling",
  },
  {
    title: "Rust入門",
    description: "本のトップ。",
    tags: ["Rust"],
    type: "book",
    url: "/books/rust-intro",
  },
  {
    title: "所有権と借用",
    description: "章の概要。",
    tags: ["Rust基礎"],
    type: "chapter",
    url: "/books/rust-intro/ownership",
  },
];

describe("SEARCH_TYPE_LABEL", () => {
  it("[AC-6] 全4種別が種別バッジの表示名に対応する", () => {
    expect(SEARCH_TYPE_LABEL).toMatchObject({
      dict: "辞書",
      article: "記事",
      book: "本",
      chapter: "章",
    });
  });
});

describe("buildDropdownItems", () => {
  it("[AC-6] 章エントリは url が章詳細ページ・label が「章」の表示データになる", () => {
    const items = buildDropdownItems(entries);
    const chapter = items.find((item) => item.type === "chapter");
    expect(chapter).toMatchObject({
      title: "所有権と借用",
      url: "/books/rust-intro/ownership",
      type: "chapter",
      label: "章",
    });
  });

  it("[AC-6] 各件が title/url/type/label を備え、url は SearchEntry.url を素通しする", () => {
    const items = buildDropdownItems(entries);
    expect(items).toHaveLength(entries.length);
    expect(items[0]).toMatchObject({
      title: "所有権",
      url: "/dict/ownership",
      type: "dict",
      label: "辞書",
    });
  });

  it("limit を超えた分は切り捨て、入力順の先頭から返す", () => {
    const items = buildDropdownItems(entries, 2);
    expect(items).toHaveLength(2);
    expect(items.map((item) => item.type)).toEqual(["dict", "article"]);
  });
});
