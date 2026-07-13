import { describe, it, expect } from "vitest";

import { buildFeedItems, type FeedSource } from "../../src/lib/feed";

// 純関数テスト（feeds-meta AC-1）。fixture は FeedSource の最小構造を手組みで用意する
// （getCollection 非依存）。非公開除外は上流 getPublic* の責務のため純関数側では検証しない
// （content.test.ts が担保する）。
const source = (
  id: string,
  type: FeedSource["type"],
  data: Partial<FeedSource["data"]> = {},
): FeedSource => ({
  id,
  type,
  data: {
    title: "",
    description: "",
    created_at: new Date("2026-01-01"),
    ...data,
  },
});

describe("buildFeedItems（RSSフィードのアイテム変換・feeds-meta R-1〜R-3 / AC-1）", () => {
  it("[AC-1] 辞書・記事・本・章の4種混在が正しい link になる（章は 本slug/章slug）", () => {
    const sources = [
      source("ownership", "dict"),
      source("perf-tuning", "article"),
      source("rust-web", "book"),
      source("rust-web/intro", "chapter"),
    ];

    const items = buildFeedItems(sources);

    expect(items.map((i) => i.link)).toEqual([
      "/dict/ownership",
      "/articles/perf-tuning",
      "/books/rust-web",
      "/books/rust-web/intro",
    ]);
  });

  it("[AC-1] created_at 降順に並ぶ（同日は title 昇順でタイブレーク）", () => {
    const sources = [
      source("old", "dict", { created_at: new Date("2026-01-01"), title: "z" }),
      source("newest", "article", {
        created_at: new Date("2026-03-01"),
        title: "a",
      }),
      // 同日は title 昇順（bar < foo）
      source("mid-b", "dict", {
        created_at: new Date("2026-02-01"),
        title: "foo",
      }),
      source("mid-a", "dict", {
        created_at: new Date("2026-02-01"),
        title: "bar",
      }),
    ];

    const items = buildFeedItems(sources);

    expect(items.map((i) => i.link)).toEqual([
      "/articles/newest",
      "/dict/mid-a",
      "/dict/mid-b",
      "/dict/old",
    ]);
  });

  it("[AC-1] 21件以上でも最大20件に制限される（直近20件）", () => {
    const sources = Array.from({ length: 25 }, (_, i) =>
      // 連番を月日に反映して降順を決定的にする（i=24 が最新）
      source(`d${i}`, "dict", {
        created_at: new Date(2026, 0, i + 1),
        title: `t${i}`,
      }),
    );

    const items = buildFeedItems(sources);

    expect(items).toHaveLength(20);
    // 最新（i=24）が先頭・21番目に新しい（i=5）が末尾で、古い5件は落ちる
    expect(items[0].link).toBe("/dict/d24");
    expect(items[19].link).toBe("/dict/d5");
  });

  it("[AC-1] 章がフィードに含まれる（全タイプ混在）", () => {
    const items = buildFeedItems([source("rust-web/intro", "chapter")]);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ link: "/books/rust-web/intro" });
  });

  it("title / description / pubDate を data から素通しし、本文は含めない", () => {
    const items = buildFeedItems([
      source("ownership", "dict", {
        title: "所有権",
        description: "Rustのメモリ管理の中核概念。",
        created_at: new Date("2026-05-04"),
      }),
    ]);

    expect(items[0]).toEqual({
      title: "所有権",
      description: "Rustのメモリ管理の中核概念。",
      link: "/dict/ownership",
      pubDate: new Date("2026-05-04"),
    });
    // 本文（content 等）のフィールドを持たない（feeds-meta R-3）
    expect(items[0]).not.toHaveProperty("content");
  });
});
