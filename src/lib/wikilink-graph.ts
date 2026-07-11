import {
  getPublicDict,
  getPublicArticles,
  getPublicChapters,
  getPublicBooks,
  type ContentKind,
} from "./content";

// wikilink グラフ（逆リンク・使用辞書一覧）の構築（architecture §5）。
// 全公開コンテンツの生 md 本文を正規表現で走査し、「ページ → リンク辞書slug」の
// 対応表（forward=使用辞書一覧 R-17）と、その逆引き（backward=逆リンク R-18）を作る。
// レンダリング非依存。コードフェンス内の [[...]] 誤検出は辞書slug解決時に落ちる（§5）。
// 純関数（extractWikilinkSlugs / buildWikilinkGraph）を vitest 対象とし、
// getCollection に触れる buildContentWikilinkGraph は薄いラッパに留める（content.ts と同方針）。

/** グラフのソース種別。逆リンク源の可否（本トップ除外・R-18）と種別バッジの導出に使う */
export type SourceKind = "dict" | "article" | "chapter" | "book";

/** グラフ構築に必要なソースの最小構造（各コレクションエントリから組み立てる） */
export interface GraphSource {
  /** ページを一意に識別するID（forward マップのキー。dict/article=slug, chapter=book/chapter, book=slug） */
  id: string;
  sourceKind: SourceKind;
  title: string;
  /** そのページの URL */
  href: string;
  /** 生 md 本文（[[slug]] 抽出対象） */
  body: string;
  /** 章のみ: 併記する本タイトル（逆リンク表示「本 › 章」用） */
  bookTitle?: string;
}

/** 使用辞書一覧の1項目（forward の値。LinkedDictList 用） */
export interface DictTarget {
  slug: string;
  title: string;
  href: string;
}

/** 逆リンクの1項目（backward の値。Backlinks 用。kind は KindBadge 用の種別） */
export interface WikilinkRef {
  kind: ContentKind;
  title: string;
  href: string;
  /** 章のみ: 併記する本タイトル */
  bookTitle?: string;
}

/** wikilink グラフ。forward=ページID→使用辞書、backward=辞書slug→逆リンク元 */
export interface WikilinkGraph {
  forward: Map<string, DictTarget[]>;
  backward: Map<string, WikilinkRef[]>;
}

/** ソース種別を種別バッジの ContentKind に写す（章・本トップはともに「本」表示） */
function mapKind(sourceKind: SourceKind): ContentKind {
  switch (sourceKind) {
    case "dict":
      return "dict";
    case "article":
      return "article";
    case "chapter":
    case "book":
      return "book";
  }
}

/** 逆リンクの決定的な並び順（kind: dict<article<book → title(ja) → href） */
const KIND_ORDER: Record<ContentKind, number> = {
  dict: 0,
  article: 1,
  book: 2,
};

/**
 * 生 md 本文から wikilink（[[slug]]）の slug を抽出する。前後空白を除き、空を捨て、
 * 初出順で重複を除去する。辞書slugへの解決・公開フィルタは呼び出し側の責務。
 */
export function extractWikilinkSlugs(body: string): string[] {
  // g フラグ正規表現はモジュールで使い回すと lastIndex 共有バグを起こすため都度生成する。
  const pattern = /\[\[([^[\]]+)\]\]/g;
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const match of body.matchAll(pattern)) {
    const slug = match[1].trim();
    if (slug === "" || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }
  return slugs;
}

/**
 * wikilink グラフを構築する（純関数）。ソースの本文から辞書リンクを抽出し、
 * 辞書slugに解決できたものだけを forward（使用辞書一覧）に、その逆引きを
 * backward（逆リンク）に積む。自己リンク（辞書が自分自身をリンク）は両方向から除外。
 * 逆リンク源は R-18 に従い本トップ（sourceKind:"book"）を除く（forward には含む）。
 */
export function buildWikilinkGraph(sources: GraphSource[]): WikilinkGraph {
  const dictBySlug = new Map<string, DictTarget>();
  for (const source of sources) {
    if (source.sourceKind === "dict") {
      dictBySlug.set(source.id, {
        slug: source.id,
        title: source.title,
        href: source.href,
      });
    }
  }

  const forward = new Map<string, DictTarget[]>();
  const backward = new Map<string, WikilinkRef[]>();

  for (const source of sources) {
    const targets: DictTarget[] = [];
    for (const slug of extractWikilinkSlugs(source.body)) {
      const dict = dictBySlug.get(slug);
      // 未解決トークン（コードフェンス由来の誤検出・存在しないslug）は捨てる
      if (!dict) continue;
      // 自己リンク（辞書が自分自身を指す）は除外
      if (source.sourceKind === "dict" && slug === source.id) continue;
      targets.push(dict);

      // 逆リンク源に本トップは含めない（R-18: 辞書・記事・章のみ）
      if (source.sourceKind === "book") continue;
      const refs = backward.get(slug) ?? [];
      refs.push({
        kind: mapKind(source.sourceKind),
        title: source.title,
        href: source.href,
        bookTitle: source.bookTitle,
      });
      backward.set(slug, refs);
    }
    forward.set(source.id, targets);
  }

  for (const refs of backward.values()) {
    refs.sort(
      (a, b) =>
        KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
        a.title.localeCompare(b.title, "ja") ||
        a.href.localeCompare(b.href),
    );
  }

  return { forward, backward };
}

/**
 * 公開コンテンツから wikilink グラフを構築する（ビルド時ラッパ）。公開フィルタは
 * getPublic* が担う（本番は公開のみ・dev は全件。R-19）。各ページの getStaticPaths で
 * 1回呼び、forward/backward のスライスを props で配る想定（module-level メモ化はしない）。
 */
export async function buildContentWikilinkGraph(): Promise<WikilinkGraph> {
  const [dict, articles, chapters, books] = await Promise.all([
    getPublicDict(),
    getPublicArticles(),
    getPublicChapters(),
    getPublicBooks(),
  ]);

  const bookTitleById = new Map(
    books.map((book) => [book.id, book.data.title]),
  );

  const sources: GraphSource[] = [
    ...dict.map((entry): GraphSource => ({
      id: entry.id,
      sourceKind: "dict",
      title: entry.data.title,
      href: `/dict/${entry.id}`,
      body: entry.body ?? "",
    })),
    ...articles.map((entry): GraphSource => ({
      id: entry.id,
      sourceKind: "article",
      title: entry.data.title,
      href: `/articles/${entry.id}`,
      body: entry.body ?? "",
    })),
    ...chapters.map((entry): GraphSource => {
      const [bookSlug, chapterSlug] = entry.id.split("/");
      return {
        id: entry.id,
        sourceKind: "chapter",
        title: entry.data.title,
        href: `/books/${bookSlug}/${chapterSlug}`,
        body: entry.body ?? "",
        bookTitle: bookTitleById.get(bookSlug),
      };
    }),
    ...books.map((entry): GraphSource => ({
      id: entry.id,
      sourceKind: "book",
      title: entry.data.title,
      href: `/books/${entry.id}`,
      body: entry.body ?? "",
    })),
  ];

  return buildWikilinkGraph(sources);
}
