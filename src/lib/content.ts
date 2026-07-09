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
