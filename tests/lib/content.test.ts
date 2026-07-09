import { describe, it, expect } from "vitest";

import {
  filterPublic,
  filterPublicChapters,
  sortByNewest,
  sortChapters,
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
