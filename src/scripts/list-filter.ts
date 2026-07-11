// 一覧ページのクライアント側絞込（search.md R-9〜R-11 / AC-7）。タグチップ選択（AND）と
// キーワード入力でカードを表示/非表示に切り替え、件数（N / 総数）と0件メッセージを更新する。
// マッチ判定は search.ts の純関数（parseQuery / entryMatches）を再利用し、ヘッダー検索ボックス
// と同一セマンティクスに保つ（重複実装なし）。純ロジック（vitest 対象）と DOM 配線（architecture
// §10 によりビルド + 目視）を search-box.ts と同型に分離する。

import type { ParsedQuery, Matchable } from "./search";
import { parseQuery, entryMatches } from "./search";

// --- 表示用の純ロジック（DOM 非依存・vitest 対象。AC-7） ----------------------

/** 絞込判定に必要なカードの部分情報（マッチ判定が参照する title/description/tags）。 */
export type CardModel = Matchable;

/**
 * 選択タグ（AND・完全一致）とキーワード入力から各カードの可視状態を返す純関数
 * （search.md R-9。keyword は R-4 と同じ部分一致で title/description/tag 名を対象）。
 * キーワード欄内の `#タグ` も parseQuery でタグ条件として扱い、選択タグと和集合にする。
 * 空条件は全件可視。入力順を保持する。
 */
export function computeCardVisibility(
  cards: CardModel[],
  selectedTags: string[],
  keyword: string,
): boolean[] {
  const parsed = parseQuery(keyword);
  const merged: ParsedQuery = {
    keywords: parsed.keywords,
    tags: [...selectedTags, ...parsed.tags],
  };
  return cards.map((card) => entryMatches(card, merged));
}

// --- DOM 配線（目視確認・architecture §10） ----------------------------------

/** カード DOM から絞込に必要な情報を読み出す（data-tags は `|` 区切り・空は空配列）。 */
function readCard(el: HTMLElement): CardModel {
  const rawTags = el.dataset.tags ?? "";
  return {
    title: el.dataset.title ?? "",
    description: el.dataset.description ?? "",
    tags: rawTags === "" ? [] : rawTags.split("|"),
  };
}

/** 一覧ページの絞込を初期化する（絞込 UI が無いページでは何もしない）。 */
export function initListFilter(): void {
  const filter = document.querySelector<HTMLElement>("[data-list-filter]");
  const grid = document.querySelector<HTMLElement>("[data-list-grid]");
  if (!filter || !grid) return;

  const keywordInput = filter.querySelector<HTMLInputElement>(
    "[data-filter-keyword]",
  );
  const hitsLabel = filter.querySelector<HTMLElement>("[data-filter-hits]");
  const emptyMessage = filter.querySelector<HTMLElement>("[data-filter-empty]");
  const tagButtons = Array.from(
    filter.querySelectorAll<HTMLButtonElement>("[data-filter-tag]"),
  );
  const moreButton =
    filter.querySelector<HTMLButtonElement>("[data-filter-more]");

  const cardEls = Array.from(
    grid.querySelectorAll<HTMLElement>("[data-title]"),
  );
  const cards = cardEls.map(readCard);

  // JS 有効時のみ操作を有効化する（JS 無効なら disabled 表示のまま＝PE。architecture §8）。
  if (keywordInput) keywordInput.disabled = false;
  tagButtons.forEach((button) => (button.disabled = false));
  if (moreButton) moreButton.disabled = false;

  const selectedTags = new Set<string>();

  function apply(): void {
    const visible = computeCardVisibility(
      cards,
      [...selectedTags],
      keywordInput?.value ?? "",
    );
    let hits = 0;
    visible.forEach((isVisible, i) => {
      cardEls[i].classList.toggle("hidden", !isVisible);
      if (isVisible) hits += 1;
    });
    if (hitsLabel) hitsLabel.textContent = String(hits);
    if (emptyMessage) emptyMessage.classList.toggle("hidden", hits > 0);
  }

  tagButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.filterTag ?? "";
      const selected = !selectedTags.has(tag);
      if (selected) selectedTags.add(tag);
      else selectedTags.delete(tag);
      // 選択スタイルは markup の `aria-pressed:` variant が担う（単一管理）。
      button.setAttribute("aria-pressed", String(selected));
      apply();
    });
  });

  keywordInput?.addEventListener("input", apply);

  // 「+ N tags」で12件超のタグチップ（hidden 付きで描画済み）を展開する。
  moreButton?.addEventListener("click", () => {
    filter
      .querySelectorAll<HTMLElement>("[data-filter-tag].hidden")
      .forEach((el) => el.classList.remove("hidden"));
    moreButton.classList.add("hidden");
  });
}
