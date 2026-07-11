import {
  getPublicDict,
  getPublicArticles,
  getPublicBooks,
  getPublicChapters,
} from "./content";

// 検索インデックスのエントリ変換（architecture §7 / search.md §3・R-1）。
// 全公開コンテンツ（辞書・記事・本・章）のメタ情報を検索用 JSON 配列に変換する。
// 純関数（buildSearchEntries）を vitest 対象とし、getCollection に触れる
// buildContentSearchIndex は getPublic* を集約する薄いラッパに留める（content.ts と同方針）。

/** 検索インデックスのコンテンツ種別（search.md §3。章・本トップを別種別として持つ） */
export type SearchType = "dict" | "article" | "book" | "chapter";

/** 検索インデックス1エントリ（search.md §3 のスキーマ） */
export interface SearchEntry {
  title: string;
  description: string;
  tags: string[];
  type: SearchType;
  url: string;
}

/**
 * 変換に必要なソースの最小構造（getCollection 非依存で手組みでき vitest 対象にできる）。
 * id は各種別の URL slug（dict/article=slug, book=本slug, chapter=`[本slug]/[章slug]`）。
 */
export interface SearchSource {
  id: string;
  type: SearchType;
  data: { title: string; description: string; tags: string[] };
}

/** 種別と id から公開 URL を導出する（collection-id.ts の id 規則・各ページの URL と一致） */
function urlFor(type: SearchType, id: string): string {
  switch (type) {
    case "dict":
      return `/dict/${id}`;
    case "article":
      return `/articles/${id}`;
    case "book":
      // 本エントリの URL は本トップページ（search.md §3）
      return `/books/${id}`;
    case "chapter": {
      // 章 id は `[本slug]/[章slug]`。章詳細ページ URL に分解する
      const [bookSlug, chapterSlug] = id.split("/");
      return `/books/${bookSlug}/${chapterSlug}`;
    }
  }
}

/**
 * 検索インデックスのエントリ変換（純関数）。ソースを search.md §3 の SearchEntry に
 * 写す。title/description/tags は素通し、url は種別ごとに導出。入力順を保持する。
 * 公開フィルタ（非公開除外）は呼び出し側（buildContentSearchIndex の getPublic*）の責務。
 */
export function buildSearchEntries(sources: SearchSource[]): SearchEntry[] {
  return sources.map((source) => ({
    title: source.data.title,
    description: source.data.description,
    tags: source.data.tags,
    type: source.type,
    url: urlFor(source.type, source.id),
  }));
}

/**
 * 公開コンテンツから検索インデックスを構築する（ビルド時ラッパ）。公開フィルタは
 * getPublic* が担う（本番は公開のみ・dev は全件。search.md R-1）。章も含める。
 */
export async function buildContentSearchIndex(): Promise<SearchEntry[]> {
  const [dict, articles, books, chapters] = await Promise.all([
    getPublicDict(),
    getPublicArticles(),
    getPublicBooks(),
    getPublicChapters(),
  ]);

  const sources: SearchSource[] = [
    ...dict.map((entry): SearchSource => ({
      id: entry.id,
      type: "dict",
      data: entry.data,
    })),
    ...articles.map((entry): SearchSource => ({
      id: entry.id,
      type: "article",
      data: entry.data,
    })),
    ...books.map((entry): SearchSource => ({
      id: entry.id,
      type: "book",
      data: entry.data,
    })),
    ...chapters.map((entry): SearchSource => ({
      id: entry.id,
      type: "chapter",
      data: entry.data,
    })),
  ];

  return buildSearchEntries(sources);
}
