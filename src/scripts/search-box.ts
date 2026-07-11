// ヘッダー検索ボックスのクライアント JS（search.md R-2/R-7/R-8 / AC-2・AC-6）。
// 初回フォーカスで検索インデックス（/search-index.json）を遅延ロードし、入力に応じて
// 結果を種別バッジ付きドロップダウンに表示、クリックで対象ページへ通常遷移する。
// パース/フィルタは search.ts の純関数を再利用し、遷移先 URL は SearchEntry.url を使う
// （章→章詳細・本→本トップは T5-1 で導出済み）。
// クライアント JS はコンポーネントに書かない規約（§4）に従い本モジュールへ分離する。

import type { SearchEntry, SearchType } from "../lib/search-index";
import { parseQuery, filterEntries } from "./search";

// --- 表示用の純ロジック（DOM 非依存・vitest 対象。AC-6） ----------------------

/** ドロップダウンの種別バッジ表示名（search.md R-7）。章は KindBadge にない4種目。 */
export const SEARCH_TYPE_LABEL: Record<SearchType, string> = {
  dict: "辞書",
  article: "記事",
  book: "本",
  chapter: "章",
};

/** ドロップダウン1件の表示用データ。 */
export interface DropdownItem {
  title: string;
  url: string;
  type: SearchType;
  label: string;
}

/** ドロップダウンの最大表示件数（search.md §5 は未確定 → 妥当な既定値）。 */
export const MAX_RESULTS = 8;

/**
 * フィルタ済みエントリを先頭 `limit` 件に絞り、種別バッジ付きの表示用データに写す
 * 純関数（search.md R-7）。url は SearchEntry.url を素通し（章クリックの遷移先＝AC-6）。
 */
export function buildDropdownItems(
  entries: SearchEntry[],
  limit: number = MAX_RESULTS,
): DropdownItem[] {
  return entries.slice(0, limit).map((entry) => ({
    title: entry.title,
    url: entry.url,
    type: entry.type,
    label: SEARCH_TYPE_LABEL[entry.type],
  }));
}

// --- DOM 配線（目視確認・architecture §10） ----------------------------------

// 種別バッジのクラス（KindBadge.astro と揃える。chapter は本系の生カラーを流用）。
const BADGE_CLASS: Record<SearchType, string> = {
  dict: "border-[#A87B1C] text-[#8F6812] dark:border-[#D9B25E] dark:text-[#D9B25E]",
  article: "border-accent text-accent",
  book: "border-[#7A3B2E] text-[#7A3B2E] dark:border-[#D08A72] dark:text-[#D08A72]",
  chapter:
    "border-[#7A3B2E] text-[#7A3B2E] dark:border-[#D08A72] dark:text-[#D08A72]",
};

// 遅延ロードした検索インデックス（初回フォーカスで1回だけ発火。二度目以降は再利用）。
// fetch 失敗時は null を解決し、呼び出し側はドロップダウンを出さない（AC-2/R-2）。
let indexPromise: Promise<SearchEntry[] | null> | null = null;

function loadIndex(): Promise<SearchEntry[] | null> {
  if (indexPromise) return indexPromise;
  indexPromise = fetch("/search-index.json")
    .then((res) => (res.ok ? (res.json() as Promise<SearchEntry[]>) : null))
    .catch(() => null);
  return indexPromise;
}

/** 現在の入力値でドロップダウンを再描画する。空クエリ・インデックス未取得時は隠す。 */
function renderResults(
  input: HTMLInputElement,
  results: HTMLElement,
  entries: SearchEntry[],
): void {
  const query = input.value.trim();
  if (query === "") {
    hideResults(results);
    return;
  }

  const items = buildDropdownItems(filterEntries(entries, parseQuery(query)));
  results.replaceChildren(...items.map(createResultLink));
  results.classList.remove("hidden");
}

/** 1件分の結果リンク（種別バッジ + タイトル）を生成する。 */
function createResultLink(item: DropdownItem): HTMLAnchorElement {
  const link = document.createElement("a");
  link.href = item.url;
  link.className =
    "flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-paper";

  const badge = document.createElement("span");
  badge.className =
    "shrink-0 rounded border px-1.5 py-0.5 font-display text-[10px] font-bold " +
    BADGE_CLASS[item.type];
  badge.textContent = item.label;

  const title = document.createElement("span");
  title.className = "truncate";
  title.textContent = item.title;

  link.append(badge, title);
  return link;
}

/** ドロップダウンを隠して中身を空にする。 */
function hideResults(results: HTMLElement): void {
  results.classList.add("hidden");
  results.replaceChildren();
}

/** ヘッダー検索ボックスを初期化する（要素が無ければ何もしない）。 */
export function initSearchBox(): void {
  const input = document.querySelector<HTMLInputElement>("[data-search-input]");
  const results = document.querySelector<HTMLElement>("[data-search-results]");
  if (!input || !results) return;

  // JS 有効時のみ入力を有効化する（JS 無効なら disabled 表示のまま＝PE。architecture §8）。
  input.disabled = false;

  // 初回フォーカスでインデックスを遅延ロードする（AC-2/R-2）。
  input.addEventListener("focus", () => void loadIndex());

  input.addEventListener("input", () => {
    void loadIndex().then((entries) => {
      // 解決までに入力がクリアされた場合や取得失敗時は何も出さない。
      if (!entries) return;
      renderResults(input, results, entries);
    });
  });

  // Escape・ボックス外クリックで閉じる（矢印キー選択は初期実装では入れない。search.md §5）。
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideResults(results);
  });
  document.addEventListener("click", (event) => {
    if (
      event.target instanceof Node &&
      !input.closest("label")?.contains(event.target)
    ) {
      hideResults(results);
    }
  });
}
