import { describe, it, expect } from "vitest";

import {
  extractWikilinkSlugs,
  buildWikilinkGraph,
  forwardKey,
  type GraphSource,
} from "../../src/lib/wikilink-graph";

// 純関数テスト。fixture は GraphSource の最小構造を手組みで用意する（getCollection 非依存）。
// 対象spec: wikilink-ui の R-17（使用辞書一覧）/ R-18（逆リンク）/ AC-7・AC-8。
// 辞書ソースを dictBySlug の元にするため、解決対象の辞書は必ずソースに含める。
const dict = (id: string, title: string, body = ""): GraphSource => ({
  id,
  sourceKind: "dict",
  title,
  href: `/dict/${id}`,
  body,
});

describe("extractWikilinkSlugs（生本文からの wikilink 抽出）", () => {
  it("複数の [[slug]] を抽出する", () => {
    expect(extractWikilinkSlugs("本文[[ownership]]と[[borrowing]]。")).toEqual([
      "ownership",
      "borrowing",
    ]);
  });

  it("前後の空白を trim する", () => {
    expect(extractWikilinkSlugs("[[ ownership ]]")).toEqual(["ownership"]);
  });

  it("重複を初出順で除去する", () => {
    expect(extractWikilinkSlugs("[[a]] [[b]] [[a]] [[c]] [[b]]")).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("wikilink でないテキスト・空の [[]] を無視する", () => {
    expect(extractWikilinkSlugs("ただの文章。[[]] と [ownership]。")).toEqual(
      [],
    );
  });

  it("コードフェンス内の [[...]] も抽出される（誤検出は解決時に落ちる仕様の明示）", () => {
    // 生本文の正規表現走査のため TOML の [[bench]] も拾う（architecture §5）。
    expect(extractWikilinkSlugs("```toml\n[[bench]]\n```")).toEqual(["bench"]);
  });
});

describe("buildWikilinkGraph（使用辞書一覧 forward・逆リンク backward）", () => {
  it("[AC-8] 本文の [[ownership]] が forward に title/href 付きで載り、未解決トークンは落ちる", () => {
    const sources = [
      dict("ownership", "所有権"),
      {
        id: "rust-intro",
        sourceKind: "article" as const,
        title: "Rust入門",
        href: "/articles/rust-intro",
        // bench は辞書に無い（コードフェンス由来の誤検出想定）→ forward から除外
        body: "[[ownership]] を学ぶ。```toml\n[[bench]]\n```",
      },
    ];

    const { forward } = buildWikilinkGraph(sources);

    expect(forward.get(forwardKey("article", "rust-intro"))).toEqual([
      { slug: "ownership", title: "所有権", href: "/dict/ownership" },
    ]);
  });

  it("[AC-8] forward が本文の wikilink 先と一致し初出順を保つ", () => {
    const sources = [
      dict("ownership", "所有権"),
      dict("borrowing", "借用"),
      {
        id: "rust-intro",
        sourceKind: "article" as const,
        title: "Rust入門",
        href: "/articles/rust-intro",
        body: "[[borrowing]] のあとに [[ownership]]。",
      },
    ];

    const { forward } = buildWikilinkGraph(sources);

    expect(
      forward.get(forwardKey("article", "rust-intro"))?.map((d) => d.slug),
    ).toEqual(["borrowing", "ownership"]);
  });

  it("forward キーは sourceKind 接頭辞付きで、コレクション横断の同名 slug が衝突しない", () => {
    const sources = [
      dict("ownership", "所有権", "[[borrowing]]"),
      dict("borrowing", "借用"),
      {
        id: "ownership",
        sourceKind: "article" as const,
        title: "所有権の記事",
        href: "/articles/ownership",
        body: "[[borrowing]]",
      },
    ];

    const { forward } = buildWikilinkGraph(sources);

    // 同名 slug "ownership" でも dict/article が別キーで共存する（後勝ちの上書きが起きない）
    expect(
      forward.get(forwardKey("dict", "ownership"))?.map((d) => d.slug),
    ).toEqual(["borrowing"]);
    expect(
      forward.get(forwardKey("article", "ownership"))?.map((d) => d.slug),
    ).toEqual(["borrowing"]);
  });

  it("[AC-7] 公開記事・公開章が辞書をリンクすると逆リンクにバッジ付き・章 bookTitle・決定的順で載る", () => {
    const sources = [
      dict("ownership", "所有権"),
      {
        id: "perf",
        sourceKind: "article" as const,
        title: "性能最適化",
        href: "/articles/perf",
        body: "[[ownership]] が重要。",
      },
      {
        id: "rust-web/intro",
        sourceKind: "chapter" as const,
        title: "はじめに",
        href: "/books/rust-web/intro",
        body: "[[ownership]] を前提とする。",
        bookTitle: "Rust Web本",
      },
      dict("borrowing", "借用", "[[ownership]] とセット。"),
    ];

    const { backward } = buildWikilinkGraph(sources);

    // 並び: kind dict<article<book → title(ja)。dict(借用) → article(性能最適化) → book(章)
    expect(backward.get("ownership")).toEqual([
      {
        kind: "dict",
        title: "借用",
        href: "/dict/borrowing",
        bookTitle: undefined,
      },
      {
        kind: "article",
        title: "性能最適化",
        href: "/articles/perf",
        bookTitle: undefined,
      },
      {
        kind: "book",
        title: "はじめに",
        href: "/books/rust-web/intro",
        bookTitle: "Rust Web本",
      },
    ]);
  });

  it("[AC-7] 非公開ソースを入力から除くと逆リンクに現れない（wikilink-ui R-19 は getPublic* が担保）", () => {
    // 公開記事のみを入力に含めると、その分だけが逆リンクに載る＝上流フィルタの効果。
    const sources = [
      dict("ownership", "所有権"),
      {
        id: "public-article",
        sourceKind: "article" as const,
        title: "公開記事",
        href: "/articles/public-article",
        body: "[[ownership]]",
      },
    ];

    const { backward } = buildWikilinkGraph(sources);

    expect(backward.get("ownership")?.map((r) => r.title)).toEqual([
      "公開記事",
    ]);
  });

  it("[wikilink-ui R-18] 本 index（sourceKind:book）は逆リンクに含めない（forward には含む）", () => {
    const sources = [
      dict("ownership", "所有権"),
      {
        id: "rust-web",
        sourceKind: "book" as const,
        title: "Rust Web本",
        href: "/books/rust-web",
        body: "この本は [[ownership]] を扱う。",
      },
    ];

    const { forward, backward } = buildWikilinkGraph(sources);

    expect(
      forward.get(forwardKey("book", "rust-web"))?.map((d) => d.slug),
    ).toEqual(["ownership"]);
    expect(backward.get("ownership")).toBeUndefined();
  });

  it("自己リンク（辞書が自分自身を [[self]]）は forward/backward いずれからも除外される", () => {
    const sources = [dict("ownership", "所有権", "自分[[ownership]]を参照。")];

    const { forward, backward } = buildWikilinkGraph(sources);

    expect(forward.get(forwardKey("dict", "ownership"))).toEqual([]);
    expect(backward.get("ownership")).toBeUndefined();
  });
});
