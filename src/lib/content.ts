import { getCollection } from "astro:content";

// 公開制御（content-model R-10〜R-12）とページ用の並び順を一元化するモジュール。
// 純関数（公開フィルタ・並び順）と getCollection ラッパを分け、前者を vitest 対象にする。

/** 公開判定に必要な最小構造。zod スキーマ（content.config.ts）の public を持つ */
interface PublicFlagged {
  data: { public: boolean };
}

/** 並び替えに必要な最小構造（新着順） */
interface Datable {
  data: { created_at: Date; title: string };
}

/** 章順に必要な最小構造。元ファイルパス先頭の連番で並べる */
interface FilePathed {
  filePath?: string;
}

/** 開発サーバ（astro dev）かどうか。dev では非公開も表示する（content-model R-10） */
export function isPreview(): boolean {
  return import.meta.env.DEV;
}

/**
 * 公開フィルタ。preview（dev）では全件を isPublic フラグ付きで返し、
 * 本番では public: true のみを返す（content-model R-10/R-11）。
 */
export function filterPublic<T extends PublicFlagged>(
  entries: T[],
  preview: boolean,
): Array<T & { isPublic: boolean }> {
  return entries
    .filter((entry) => preview || entry.data.public)
    .map((entry) => ({ ...entry, isPublic: entry.data.public }));
}

/**
 * 章の公開フィルタ。本 index.md が非公開なら配下の章は章側の public に関わらず
 * 除外する（content-model R-12）。preview では全件を isPublic フラグ付きで返す。
 */
export function filterPublicChapters<
  C extends PublicFlagged & { id: string },
  B extends PublicFlagged & { id: string },
>(
  chapters: C[],
  books: B[],
  preview: boolean,
): Array<C & { isPublic: boolean }> {
  const bookPublicById = new Map(
    books.map((book) => [book.id, book.data.public]),
  );
  return chapters
    .map((chapter) => {
      // 章 ID は `[本slug]/[章slug]`。前半で親本を引く（collection-id.chapterId と対応）
      const bookSlug = chapter.id.split("/")[0];
      const bookPublic = bookPublicById.get(bookSlug) ?? false;
      return { ...chapter, isPublic: chapter.data.public && bookPublic };
    })
    .filter((chapter) => preview || chapter.isPublic);
}

/** 新着順（created_at 降順、同日はタイトル昇順でタイブレーク。pages R-4） */
export function sortByNewest<T extends Datable>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const diff = b.data.created_at.getTime() - a.data.created_at.getTime();
    if (diff !== 0) return diff;
    return a.data.title.localeCompare(b.data.title);
  });
}

/** 新着一覧・種別バッジの種別ラベル（辞書・記事・本。章は新着に含めない。pages R-5） */
export type ContentKind = "dict" | "article" | "book";

/** エントリ配列に種別ラベルを付与する（新着一覧のマージ用） */
export function withKind<T>(
  entries: T[],
  kind: ContentKind,
): Array<T & { kind: ContentKind }> {
  return entries.map((entry) => ({ ...entry, kind }));
}

/**
 * トップの新着一覧。辞書・記事・本を種別ラベル付きで結合し、新着順（sortByNewest）で
 * 上位 limit 件を返す。章は引数に取らない設計で除外を保証する（pages R-5/AC-2）。
 */
export function mergeRecent<
  D extends Datable,
  A extends Datable,
  B extends Datable,
>(
  dict: D[],
  articles: A[],
  books: B[],
  limit = 10,
): Array<
  | (D & { kind: ContentKind })
  | (A & { kind: ContentKind })
  | (B & { kind: ContentKind })
> {
  const merged = [
    ...withKind(dict, "dict"),
    ...withKind(articles, "article"),
    ...withKind(books, "book"),
  ];
  return sortByNewest(merged).slice(0, limit);
}

/** タグ集計に必要な最小構造 */
interface Tagged {
  data: { tags: string[] };
}

/**
 * タグ出現件数の集計。エントリ配列からタグごとの件数を数え、件数降順・
 * 同数はタグ名昇順で返す（一覧の絞込チップ表示用。search R-9〜R-11）。
 */
export function tagCounts<T extends Tagged>(
  entries: T[],
): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 目次に載せる見出しの最小構造（render() の headings = MarkdownHeading と構造互換） */
interface Headingish {
  depth: number;
  slug: string;
}

/**
 * 目次に載せる見出しを絞り込む（pages R-13 / AC-7）。h2〜h4 を対象とし、本文先頭の h1
 * （ページタイトルと重複）と脚注ラベル（`footnote-label`。パイプラインが sr-only で出力する
 * 「Footnotes」見出し）を除外する。Toc / MobileNav で共用し、対象範囲の定義を一箇所に集約する。
 */
export function tocHeadings<T extends Headingish>(headings: T[]): T[] {
  return headings.filter(
    (h) => h.depth >= 2 && h.depth <= 4 && h.slug !== "footnote-label",
  );
}

/** 元ファイル名先頭のゼロ埋め2桁連番を取り出す（欠落時は 0） */
function chapterOrder(entry: FilePathed): number {
  const fileName = entry.filePath?.split("/").pop() ?? "";
  const match = fileName.match(/^(\d{2})-/);
  return match ? Number(match[1]) : 0;
}

/** 章順（元ファイル名の連番昇順。content-model R-7・章目次の並び） */
export function sortChapters<T extends FilePathed>(chapters: T[]): T[] {
  return [...chapters].sort((a, b) => chapterOrder(a) - chapterOrder(b));
}

/** 公開辞書（dev では全件・isPublic 付き、本番では公開のみ） */
export async function getPublicDict() {
  return filterPublic(await getCollection("dict"), isPreview());
}

/** 公開記事（新着順） */
export async function getPublicArticles() {
  return sortByNewest(
    filterPublic(await getCollection("articles"), isPreview()),
  );
}

/** 公開本（新着順） */
export async function getPublicBooks() {
  return sortByNewest(filterPublic(await getCollection("books"), isPreview()));
}

/** 公開章（本 index 非公開の伝播を適用。章順は本単位で sortChapters を使う） */
export async function getPublicChapters() {
  const [chapters, books] = await Promise.all([
    getCollection("chapters"),
    getCollection("books"),
  ]);
  return filterPublicChapters(chapters, books, isPreview());
}
