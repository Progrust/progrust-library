import { describe, it, expect } from "vitest";

import {
  filterPublic,
  filterPublicChapters,
  sortByNewest,
  sortChapters,
  chapterOrderLabel,
  chapterNav,
  chapterLedger,
  mergeRecent,
  tagCounts,
  tocHeadings,
} from "../../src/lib/content";

// 純関数テスト。fixture は各関数が要求する最小構造だけを手組みで用意する。
const pub = (id: string, isPublic: boolean) => ({
  id,
  data: { public: isPublic },
});

describe("filterPublic（公開フィルタ・content-model R-10/R-11）", () => {
  it("[AC-6] 本番（preview=false）では public: false が除外される", () => {
    const entries = [pub("a", true), pub("b", false), pub("c", true)];

    const result = filterPublic(entries, false);

    expect(result.map((e) => e.id)).toEqual(["a", "c"]);
    expect(result.every((e) => e.isPublic)).toBe(true);
  });

  it("[AC-7] dev（preview=true）では非公開も返り isPublic フラグが付く", () => {
    const entries = [pub("a", true), pub("b", false)];

    const result = filterPublic(entries, true);

    expect(result).toHaveLength(2);
    expect(result.find((e) => e.id === "b")).toMatchObject({ isPublic: false });
    expect(result.find((e) => e.id === "a")).toMatchObject({ isPublic: true });
  });
});

describe("filterPublicChapters（本index非公開の伝播・content-model R-12）", () => {
  const chapters = [
    pub("open-book/01-intro", true),
    pub("open-book/02-next", true),
    pub("secret-book/01-intro", true),
  ];
  const books = [pub("open-book", true), pub("secret-book", false)];

  it("[AC-8] 本番では本index非公開の配下章は公開章でも除外される", () => {
    const result = filterPublicChapters(chapters, books, false);

    expect(result.map((c) => c.id)).toEqual([
      "open-book/01-intro",
      "open-book/02-next",
    ]);
  });

  it("[AC-8] dev では全章を返し、非公開本の章は isPublic: false になる", () => {
    const result = filterPublicChapters(chapters, books, true);

    expect(result).toHaveLength(3);
    expect(result.find((c) => c.id === "secret-book/01-intro")).toMatchObject({
      isPublic: false,
    });
  });
});

describe("sortByNewest（新着順・pages R-4）", () => {
  it("created_at 降順、同日はタイトル昇順でタイブレークする", () => {
    const entries = [
      { data: { created_at: new Date("2024-01-01"), title: "B" } },
      { data: { created_at: new Date("2024-05-01"), title: "A" } },
      { data: { created_at: new Date("2024-01-01"), title: "A" } },
    ];

    const result = sortByNewest(entries);

    expect(result.map((e) => e.data.title)).toEqual(["A", "A", "B"]);
    expect(result[0].data.created_at.getFullYear()).toBe(2024);
    expect(result[0].data.created_at.getMonth()).toBe(4); // 5月（0始まり）
  });
});

describe("mergeRecent（トップ新着一覧・pages R-5/AC-2）", () => {
  const dated = (title: string, iso: string) => ({
    data: { created_at: new Date(iso), title },
  });

  it("[AC-2] 辞書・記事・本が created_at 降順で混在し種別ラベルが付く", () => {
    const dict = [dated("D", "2024-04-01")];
    const articles = [dated("A", "2024-06-01")];
    const books = [dated("B", "2024-05-01")];

    const result = mergeRecent(dict, articles, books);

    expect(result.map((e) => e.data.title)).toEqual(["A", "B", "D"]);
    expect(result.map((e) => e.kind)).toEqual(["article", "book", "dict"]);
  });

  it("[AC-2] kind は辞書・記事・本の3種のみで、章は結合対象に含まれない", () => {
    const result = mergeRecent(
      [dated("D", "2024-01-01")],
      [dated("A", "2024-02-01")],
      [dated("B", "2024-03-01")],
    );

    // 章を渡していないため件数は入力3件そのまま、kind も3種のみ（新着に章は混ざらない）
    expect(result).toHaveLength(3);
    expect(new Set(result.map((e) => e.kind))).toEqual(
      new Set(["dict", "article", "book"]),
    );
  });

  it("[AC-2] 同日はタイトル昇順でタイブレークする", () => {
    const result = mergeRecent(
      [dated("Z", "2024-05-01")],
      [dated("A", "2024-05-01")],
      [],
    );

    expect(result.map((e) => e.data.title)).toEqual(["A", "Z"]);
  });

  it("[AC-2] 11件以上でも先頭 limit 件（既定10件）に絞られる", () => {
    const dict = Array.from({ length: 15 }, (_, i) =>
      dated(`d${i}`, `2024-01-${String(i + 1).padStart(2, "0")}`),
    );

    const result = mergeRecent(dict, [], []);

    expect(result).toHaveLength(10);
    // 最新（2024-01-15）が先頭
    expect(result[0].data.title).toBe("d14");
  });
});

describe("sortChapters（章順・content-model R-7）", () => {
  it("[AC-4] 元ファイル名先頭の連番昇順に並べる（章目次の並び）", () => {
    const chapters = [
      { filePath: "content/books/x/03-third.md" },
      { filePath: "content/books/x/01-first.md" },
      { filePath: "content/books/x/02-second.md" },
    ];

    const result = sortChapters(chapters);

    expect(result.map((c) => c.filePath)).toEqual([
      "content/books/x/01-first.md",
      "content/books/x/02-second.md",
      "content/books/x/03-third.md",
    ]);
  });

  it("filePath 欠落時もクラッシュせず 0 として扱う", () => {
    const chapters = [{ filePath: "content/books/x/02-second.md" }, {}];

    const result = sortChapters(chapters);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({}); // 連番0が先頭
  });
});

describe("chapterOrderLabel（連番ラベル・content-model R-7）", () => {
  it("元ファイル名先頭の連番をゼロ埋め2桁文字列で返す", () => {
    expect(chapterOrderLabel({ filePath: "content/books/x/01-intro.md" })).toBe(
      "01",
    );
    expect(chapterOrderLabel({ filePath: "content/books/x/12-final.md" })).toBe(
      "12",
    );
  });

  it("連番が無い（filePath 欠落）場合は 00 を返す", () => {
    expect(chapterOrderLabel({})).toBe("00");
  });
});

describe("chapterNav（前後章ナビ・pages R-16/AC-4）", () => {
  // 連番昇順に整列済みの章リストを前提にした最小構造
  const ch = (id: string, isPublic: boolean) => ({ id, isPublic });

  it("[AC-4] 中間章では直前・直後の章を返す", () => {
    const chapters = [ch("x/a", true), ch("x/b", true), ch("x/c", true)];

    const { prev, next } = chapterNav(chapters, "x/b");

    expect(prev?.id).toBe("x/a");
    expect(next?.id).toBe("x/c");
  });

  it("[AC-4] 間に非公開章がある場合はスキップして次の公開章へつなぐ（prev 方向）", () => {
    const chapters = [ch("x/a", true), ch("x/hidden", false), ch("x/c", true)];

    const { prev, next } = chapterNav(chapters, "x/c");

    // 直前の x/hidden は非公開なのでスキップし x/a を prev とする
    expect(prev?.id).toBe("x/a");
    expect(next).toBeNull();
  });

  it("[AC-4] 間に非公開章がある場合はスキップして次の公開章へつなぐ（next 方向）", () => {
    const chapters = [ch("x/a", true), ch("x/hidden", false), ch("x/c", true)];

    const { prev, next } = chapterNav(chapters, "x/a");

    // 直後の x/hidden は非公開なのでスキップし x/c を next とする
    expect(prev).toBeNull();
    expect(next?.id).toBe("x/c");
  });

  it("[AC-4] 先頭章の prev・最終章の next は null", () => {
    const chapters = [ch("x/a", true), ch("x/b", true)];

    expect(chapterNav(chapters, "x/a").prev).toBeNull();
    expect(chapterNav(chapters, "x/b").next).toBeNull();
  });

  it("現在章が見つからない場合は両方 null", () => {
    const chapters = [ch("x/a", true), ch("x/b", true)];

    expect(chapterNav(chapters, "x/zzz")).toEqual({ prev: null, next: null });
  });
});

describe("chapterLedger（章目次の台帳データ・pages R-17）", () => {
  const chapter = (
    seq: string,
    slug: string,
    title: string,
    isPublic = true,
  ) => ({
    id: `rust-book/${slug}`,
    isPublic,
    filePath: `content/books/rust-book/${seq}-${slug}.md`,
    data: { title },
  });

  it("slug・連番ラベル・URL・公開状態を台帳項目に組み立てる", () => {
    const chapters = [
      chapter("01", "intro", "イントロ"),
      chapter("02", "setup", "環境構築", false),
    ];

    const result = chapterLedger(chapters, "rust-book");

    expect(result).toEqual([
      {
        slug: "intro",
        title: "イントロ",
        order: "01",
        isPublic: true,
        href: "/books/rust-book/intro",
      },
      {
        slug: "setup",
        title: "環境構築",
        order: "02",
        isPublic: false,
        href: "/books/rust-book/setup",
      },
    ]);
  });
});

describe("tagCounts（タグ出現件数の集計・一覧の絞込チップ）", () => {
  const tagged = (...tags: string[]) => ({ data: { tags } });

  it("タグごとの出現件数を数え、件数降順で返す", () => {
    const entries = [
      tagged("Rust基礎", "所有権"),
      tagged("Rust基礎", "並行性"),
      tagged("Rust基礎"),
    ];

    const result = tagCounts(entries);

    expect(result[0]).toMatchObject({ tag: "Rust基礎", count: 3 });
    expect(result.map((t) => t.tag)).toContain("所有権");
    expect(result.map((t) => t.tag)).toContain("並行性");
  });

  it("同数のタグはタグ名の昇順でタイブレークする", () => {
    const entries = [tagged("beta"), tagged("alpha")];

    const result = tagCounts(entries);

    expect(result.map((t) => t.tag)).toEqual(["alpha", "beta"]);
  });

  it("空配列では空を返す", () => {
    expect(tagCounts([])).toEqual([]);
  });
});

describe("tocHeadings（目次対象の絞り込み・pages R-13/AC-7）", () => {
  const h = (depth: number, slug: string) => ({ depth, slug, text: slug });

  it("[AC-7] h2〜h4 のみを対象にし、h1・h5・h6 を除外する", () => {
    const headings = [
      h(1, "title"),
      h(2, "a"),
      h(3, "b"),
      h(4, "c"),
      h(5, "d"),
      h(6, "e"),
    ];

    const result = tocHeadings(headings);

    expect(result.map((x) => x.slug)).toEqual(["a", "b", "c"]);
  });

  it("脚注ラベル（footnote-label）を除外する", () => {
    const headings = [h(2, "a"), h(2, "footnote-label")];

    expect(tocHeadings(headings).map((x) => x.slug)).toEqual(["a"]);
  });

  it("元の順序を保持する", () => {
    const headings = [h(2, "x"), h(4, "y"), h(3, "z")];

    expect(tocHeadings(headings).map((x) => x.slug)).toEqual(["x", "y", "z"]);
  });
});
