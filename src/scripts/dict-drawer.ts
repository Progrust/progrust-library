// 辞書ペインの拡大表示ドロワー（wikilink-ui R-21〜R-26 / AC-10〜AC-13）。
// 非モーダル: バックドロップ・背景スクロールロックを設けず、開閉フラグ
// html[data-dict-drawer-open] の付け外しとスクロール位置の引き継ぎだけを担う。
// レイアウト切替（右レール非表示・グリッド2カラム化）は同フラグを起点に global.css が行い、
// 内容・履歴のペインとの同期は dict-pane.ts（複製フックの一括更新）が行う。

/** 開状態フラグ。global.css のレイアウト切替とドロワー表示の唯一の起点。 */
const OPEN_ATTR = "data-dict-drawer-open";

/** 辞書ペインの拡大表示を初期化する（ドロワー不在のページでは何もしない）。 */
export function initDictDrawer(): void {
  const drawer = document.querySelector<HTMLElement>("[data-dict-drawer]");
  if (!drawer) return;
  const closeBtn = drawer.querySelector<HTMLButtonElement>(
    "[data-dict-drawer-close]",
  );

  // 閉時のフォーカス返還先（開いたトリガー）。Esc で閉じてもキーボード操作の文脈が切れないようにする。
  let lastTrigger: HTMLElement | null = null;

  const isOpen = (): boolean =>
    document.documentElement.hasAttribute(OPEN_ATTR);

  const open = (trigger: HTMLElement): void => {
    if (isOpen()) return;
    lastTrigger = trigger;
    document.documentElement.setAttribute(OPEN_ATTR, "");
    closeBtn?.focus();
  };

  const close = (): void => {
    if (!isOpen()) return;
    // 属性除去でレール（display: none）が同期的に復帰する。
    document.documentElement.removeAttribute(OPEN_ATTR);
    lastTrigger?.focus();
    lastTrigger = null;
  };

  for (const btn of document.querySelectorAll<HTMLElement>(
    "[data-dict-expand]",
  )) {
    btn.addEventListener("click", () => open(btn));
  }
  closeBtn?.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  // lg 未満へ縮小したら閉じる（ドロワー・レール切替は lg 以上限定のCSSだが、
  // フラグが残ったまま再拡大するとレールだけ消えた状態になるため状態も戻す）。
  window
    .matchMedia("(max-width: 1023px)")
    .addEventListener("change", (event) => {
      if (event.matches) close();
    });
}
