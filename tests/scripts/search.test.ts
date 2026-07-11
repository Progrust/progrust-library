import { describe, it, expect } from "vitest";

import { parseQuery, filterEntries } from "../../src/scripts/search";
import type { SearchEntry } from "../../src/lib/search-index";

// 検索クエリのパース + フィルタ純関数（search.md AC-3〜AC-5・R-3〜R-6）を検証する。
// UI/DOM（ドロップダウン表示・遅延ロード）は architecture §10 によりビルド + 目視確認。

// 各条件を切り分けられる最小フィクスチャ。所有権エントリはタイトル一致用、
// concept-desc は概要一致用、rust-tag はタグ名部分一致用に分けている。
const entries: SearchEntry[] = [
  {
    title: "所有権",
    description: "Rustのメモリ管理の中核概念。",
    tags: ["Rust基礎", "所有権"],
    type: "dict",
    url: "/dict/ownership",
  },
  {
    title: "借用",
    description: "所有権を移動せずに値を参照する仕組み。",
    tags: ["Rust基礎"],
    type: "dict",
    url: "/dict/borrowing",
  },
  {
    title: "Rustのエラー処理",
    description: "Result型による回復可能なエラー。",
    tags: ["Rust"],
    type: "article",
    url: "/articles/error-handling",
  },
];

describe("parseQuery", () => {
  it("`#`始まりをタグ・その他をキーワードに分解する", () => {
    expect(parseQuery("#Rust基礎 所有権")).toEqual({
      tags: ["Rust基礎"],
      keywords: ["所有権"],
    });
  });

  it("空文字・連続空白・全角空白では空トークンを生じない", () => {
    expect(parseQuery("  所有権　　借用 ")).toEqual({
      tags: [],
      keywords: ["所有権", "借用"],
    });
  });

  it("`#`のみのトークンは空タグとして捨てる", () => {
    expect(parseQuery("#")).toEqual({ tags: [], keywords: [] });
  });

  it("複数キーワード・複数タグを併記できる", () => {
    expect(parseQuery("#Rust基礎 #所有権 借用 参照")).toEqual({
      tags: ["Rust基礎", "所有権"],
      keywords: ["借用", "参照"],
    });
  });
});

describe("filterEntries", () => {
  it("[AC-3] キーワードがタイトル・概要・タグ名のいずれかに部分一致する全エントリがヒットする", () => {
    const result = filterEntries(entries, parseQuery("所有権"));
    // タイトル一致（所有権）・概要一致（借用の概要）・タグ名一致（所有権タグ）を網羅。
    expect(result.map((e) => e.url)).toEqual([
      "/dict/ownership",
      "/dict/borrowing",
    ]);
  });

  it("[AC-3] キーワードの大文字小文字は区別しない", () => {
    const result = filterEntries(entries, parseQuery("rust"));
    // タイトル "Rustのエラー処理" と タグ "Rust"/"Rust基礎" に小文字 rust で一致。
    expect(result.map((e) => e.url)).toEqual([
      "/dict/ownership",
      "/dict/borrowing",
      "/articles/error-handling",
    ]);
  });

  it("[AC-4] タグは完全一致のみヒットし部分一致（Rust）ではヒットしない", () => {
    const result = filterEntries(entries, parseQuery("#Rust基礎"));
    // タグ "Rust" のみを持つエラー処理記事は Rust基礎 の部分一致では拾わない。
    expect(result.map((e) => e.url)).toEqual([
      "/dict/ownership",
      "/dict/borrowing",
    ]);
  });

  it("[AC-5] タグ完全一致かつキーワード部分一致の AND になる", () => {
    const result = filterEntries(entries, parseQuery("#Rust基礎 所有権"));
    // Rust基礎タグを持ち、かつ 所有権 に部分一致するのは ownership（タイトル一致）と
    // borrowing（概要一致）。Rustタグのみのエラー処理記事は Rust基礎 を持たず除外。
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.url)).toEqual([
      "/dict/ownership",
      "/dict/borrowing",
    ]);
  });

  it("[AC-5] 片方の条件のみ満たすエントリは除外される", () => {
    // "Rust" タグのエラー処理記事は 所有権 に一致せず、Rust基礎タグも持たない。
    const onlyKeyword = filterEntries(
      entries,
      parseQuery("#存在しないタグ 所有権"),
    );
    expect(onlyKeyword).toHaveLength(0);
  });

  it("空クエリでは全件を入力順で返す", () => {
    const result = filterEntries(entries, parseQuery("   "));
    expect(result).toHaveLength(3);
  });
});
