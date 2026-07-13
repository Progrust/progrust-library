import {
  compareNewest,
  getPublicDict,
  getPublicArticles,
  getPublicBooks,
  getPublicChapters,
} from "./content";

// RSSフィードのアイテム変換（feeds-meta §2・R-1〜R-3）。
// 全公開コンテンツ（辞書・記事・本・章）を created_at 降順の最大20件に絞り、フィード用の
// アイテム配列に変換する。純関数（buildFeedItems）を vitest 対象とし、getCollection に触れる
// buildContentFeed は getPublic* を集約する薄いラッパに留める（search-index.ts と同方針）。

/** フィード対象のコンテンツ種別（feeds-meta R-2。全タイプ混在＝章も含む） */
export type FeedType = "dict" | "article" | "book" | "chapter";

/** RSSフィード1アイテム（feeds-meta R-3。本文は含めない＝content フィールドを持たない） */
export interface FeedItem {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
}

/**
 * 変換に必要なソースの最小構造（getCollection 非依存で手組みでき vitest 対象にできる）。
 * id は各種別の URL slug（dict/article=slug, book=本slug, chapter=`[本slug]/[章slug]`）。
 */
export interface FeedSource {
  id: string;
  type: FeedType;
  data: { title: string; description: string; created_at: Date };
}

/** フィードの最大件数（feeds-meta R-2。直近20件） */
const FEED_LIMIT = 20;

/** 種別と id から公開 URL を導出する（search-index.ts の urlFor と同一・各ページの URL と一致） */
function urlFor(type: FeedType, id: string): string {
  switch (type) {
    case "dict":
      return `/dict/${id}`;
    case "article":
      return `/articles/${id}`;
    case "book":
      return `/books/${id}`;
    case "chapter":
      // 章 id は `[本slug]/[章slug]`。そのまま /books 配下の章詳細 URL になる
      return `/books/${id}`;
  }
}

/**
 * RSSフィードのアイテム変換（純関数）。ソースを created_at 降順（同日は title 昇順。
 * pages R-4 のタイブレークを compareNewest で共有）に並べ、上位 limit 件を feeds-meta R-3 の
 * FeedItem に写す。本文（content）は含めない。公開フィルタ（非公開除外）は呼び出し側
 * （buildContentFeed の getPublic*）の責務。
 */
export function buildFeedItems(
  sources: FeedSource[],
  limit = FEED_LIMIT,
): FeedItem[] {
  return [...sources]
    .sort((a, b) => compareNewest(a.data, b.data))
    .slice(0, limit)
    .map((source) => ({
      title: source.data.title,
      description: source.data.description,
      link: urlFor(source.type, source.id),
      pubDate: source.data.created_at,
    }));
}

/**
 * 公開コンテンツから RSSフィードのアイテムを構築する（ビルド時ラッパ）。公開フィルタは
 * getPublic* が担う（本番は公開のみ・dev は全件。章は本 index 非公開の伝播込み。
 * content-model R-11/R-12）。全4種別を混在させ、buildFeedItems で降順20件に絞る。
 */
export async function buildContentFeed(): Promise<FeedItem[]> {
  const [dict, articles, books, chapters] = await Promise.all([
    getPublicDict(),
    getPublicArticles(),
    getPublicBooks(),
    getPublicChapters(),
  ]);

  const sources: FeedSource[] = [
    ...dict.map((entry): FeedSource => ({
      id: entry.id,
      type: "dict",
      data: entry.data,
    })),
    ...articles.map((entry): FeedSource => ({
      id: entry.id,
      type: "article",
      data: entry.data,
    })),
    ...books.map((entry): FeedSource => ({
      id: entry.id,
      type: "book",
      data: entry.data,
    })),
    ...chapters.map((entry): FeedSource => ({
      id: entry.id,
      type: "chapter",
      data: entry.data,
    })),
  ];

  return buildFeedItems(sources);
}
