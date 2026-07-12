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

/** 新着順の比較（created_at 降順、同日は title 昇順）。pages R-4 のタイブレーク定義を
 * 一箇所に集約し、sortByNewest（data 付き）と tagLedger（フラット）双方で使う。 */
export function compareNewest(
  a: { created_at: Date; title: string },
  b: { created_at: Date; title: string },
): number {
  const diff = b.created_at.getTime() - a.created_at.getTime();
  if (diff !== 0) return diff;
  return a.title.localeCompare(b.title);
}

/** 新着順（created_at 降順、同日はタイトル昇順でタイブレーク。pages R-4） */
export function sortByNewest<T extends Datable>(entries: T[]): T[] {
  return [...entries].sort((a, b) => compareNewest(a.data, b.data));
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

/** タグ詳細の台帳1行分（辞書・記事・本・章を種別横断でまとめた表示データ。pages R-19） */
export interface TagLedgerItem {
  kind: ContentKind;
  /** 表示タイトル。章は章タイトルのみを持ち、本タイトルは bookTitle に分ける */
  title: string;
  /** 章のみ: 併記する本タイトル（「本タイトル › 章タイトル」表示用） */
  bookTitle?: string;
  /** そのページへの URL */
  href: string;
  created_at: Date;
  /** そのページの全タグ（右端の「他タグ」表示に使う。当該タグの除外は呼び出し側で行う） */
  tags: string[];
}

/**
 * タグ詳細の一覧（pages R-19 / AC-6）。種別混在の台帳から指定タグを持つ項目だけを抜き出し、
 * created_at 降順・同日は title 昇順（pages R-4）で並べる。章（kind:"book"）も対象に含める。
 */
export function tagLedger(
  items: TagLedgerItem[],
  tag: string,
): TagLedgerItem[] {
  return items.filter((item) => item.tags.includes(tag)).sort(compareNewest);
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

/** 章の連番ラベル（ゼロ埋め2桁文字列。ヘッダー補助行・ナビ・台帳の表示用。content-model R-7） */
export function chapterOrderLabel(entry: FilePathed): string {
  return String(chapterOrder(entry)).padStart(2, "0");
}

/** 前後章ナビの最小構造（id で現在章を特定し、公開章のみを辿る） */
interface Navigable {
  id: string;
  isPublic: boolean;
}

/**
 * 前後章ナビ（pages R-16 / AC-4）。連番昇順の章リストから現在章の前後に位置する
 * 最も近い公開章を返す。間に非公開章があってもスキップし次の公開章へつなぐ。
 * 先頭章の prev・最終章の next は null。現在章が見つからない場合も両方 null。
 * 本番ビルドでは getPublicChapters が既に公開章のみだが、dev（全章）でも pages R-16 通り
 * 非公開をスキップするため isPublic を見る。
 */
export function chapterNav<T extends Navigable>(
  sortedChapters: T[],
  currentId: string,
): { prev: T | null; next: T | null } {
  const index = sortedChapters.findIndex((c) => c.id === currentId);
  if (index < 0) return { prev: null, next: null };

  let prev: T | null = null;
  for (let i = index - 1; i >= 0; i--) {
    if (sortedChapters[i].isPublic) {
      prev = sortedChapters[i];
      break;
    }
  }
  let next: T | null = null;
  for (let i = index + 1; i < sortedChapters.length; i++) {
    if (sortedChapters[i].isPublic) {
      next = sortedChapters[i];
      break;
    }
  }
  return { prev, next };
}

/** 台帳表示用の章メタ（本トップ・章詳細の章目次で共用） */
export interface ChapterLedgerItem {
  /** 連番除去後の章 slug（URL 末尾） */
  slug: string;
  title: string;
  /** ゼロ埋め2桁の連番ラベル（表示用） */
  order: string;
  isPublic: boolean;
  /** 章詳細への URL（/books/[本slug]/[章slug]） */
  href: string;
}

/** 台帳表示に必要な最小構造（章エントリ） */
interface Chapterish extends FilePathed {
  id: string;
  isPublic: boolean;
  data: { title: string };
}

/**
 * 章目次の台帳データを組み立てる（pages R-17・章詳細サイドバー）。章 ID は
 * `[本slug]/[章slug]`。URL 規則（content-model R-8）と連番ラベルを一箇所に集約する。
 * 連番昇順に整列済みのリストを渡す前提（sortChapters 済み）。
 */
export function chapterLedger<T extends Chapterish>(
  sortedChapters: T[],
  bookSlug: string,
): ChapterLedgerItem[] {
  return sortedChapters.map((chapter) => {
    const slug = chapter.id.split("/")[1] ?? "";
    return {
      slug,
      title: chapter.data.title,
      order: chapterOrderLabel(chapter),
      isPublic: chapter.isPublic,
      href: `/books/${bookSlug}/${slug}`,
    };
  });
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
