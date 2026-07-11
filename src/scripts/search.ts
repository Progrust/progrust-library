import type { SearchEntry } from "../lib/search-index";

// 検索クエリのパース + フィルタ（search.md R-3〜R-6）。UI/DOM は含まず純関数のみを
// 切り出し vitest 対象とする（architecture §8・§10）。検索ボックス（T5-3）と一覧絞込
// （T5-4）はともに `filterEntries(entries, parseQuery(input))` の形でこれを共有する。

/** パース済みクエリ（キーワード群とタグ群に分解した結果） */
export interface ParsedQuery {
  keywords: string[];
  tags: string[];
}

/**
 * クエリ文字列をキーワードとタグ（`#`始まり）に分解する（search.md R-3）。
 * 半角/全角空白で分割し、`#`除去後に空になるトークンは捨てる。
 */
export function parseQuery(query: string): ParsedQuery {
  const keywords: string[] = [];
  const tags: string[] = [];
  // 空白の連続を1区切りとして分割（`\s` は全角空白 U+3000 も含む。先頭末尾由来の空要素は除去）。
  for (const token of query.split(/\s+/)) {
    if (token === "") continue;
    if (token.startsWith("#")) {
      const tag = token.slice(1);
      if (tag !== "") tags.push(tag);
    } else {
      keywords.push(token);
    }
  }
  return { keywords, tags };
}

/** キーワードがタイトル・概要・タグ名のいずれかに部分一致するか（R-4: 大文字小文字非区別） */
function matchesKeyword(entry: SearchEntry, keyword: string): boolean {
  const needle = keyword.toLowerCase();
  if (entry.title.toLowerCase().includes(needle)) return true;
  if (entry.description.toLowerCase().includes(needle)) return true;
  return entry.tags.some((tag) => tag.toLowerCase().includes(needle));
}

/**
 * パース済みクエリで検索エントリを絞り込む（search.md R-4〜R-6）。
 * 全キーワード（部分一致）かつ全タグ（完全一致）を満たすエントリのみ返す AND 検索。
 * キーワード・タグが空の条件は自動的に真（空クエリは全件を返す）。入力順を保持する。
 */
export function filterEntries(
  entries: SearchEntry[],
  parsed: ParsedQuery,
): SearchEntry[] {
  return entries.filter(
    (entry) =>
      parsed.keywords.every((keyword) => matchesKeyword(entry, keyword)) &&
      // タグはタグ名の完全一致（R-5: 部分一致ではヒットさせない）。
      parsed.tags.every((tag) => entry.tags.includes(tag)),
  );
}
