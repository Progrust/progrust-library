// 辞書ペインの拡大表示ドロワー（wikilink-ui R-21〜R-26 / AC-10〜AC-13）。
// 非モーダル: バックドロップ・背景スクロールロックを設けず、開閉フラグ
// html[data-dict-drawer-open] の付け外しとスクロール位置の引き継ぎだけを担う。
// レイアウト切替（右レール非表示・グリッド2カラム化）は同フラグを起点に global.css が行い、
// 内容・履歴のペインとの同期は dict-pane.ts（複製フックの一括更新）が行う。

/** スクロール同期に使うコンテナの実測値（DOM 非依存の純関数入力）。 */
export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

// --- スクロール比率換算の純ロジック（DOM 非依存・vitest 対象。wikilink-ui AC-13） -----------

/**
 * 元コンテナのスクロール位置を、高さ比率の換算で先コンテナの scrollTop に写す
 * （wikilink-ui R-26）。幅が違うと折り返しで総高が変わり絶対値では位置がずれるため、
 * スクロール可能量に対する比率で対応づける。元にスクロール余地がない（内容が収まって
 * いる・比率が定義できない）場合と先に余地がない場合は 0 を返す。
 */
export function mapScrollTop(
  from: ScrollMetrics,
  to: Omit<ScrollMetrics, "scrollTop">,
): number {
  const fromMax = from.scrollHeight - from.clientHeight;
  const toMax = to.scrollHeight - to.clientHeight;
  if (fromMax <= 0 || toMax <= 0) return 0;
  // ブラウザ実装によっては scrollTop が可動域を僅かに超えるため比率を [0, 1] に丸める。
  const ratio = Math.min(1, Math.max(0, from.scrollTop / fromMax));
  return ratio * toMax;
}

// --- DOM 配線 ----------------------------------------------------------------

/** 開状態フラグ。global.css のレイアウト切替とドロワー表示の唯一の起点。 */
const OPEN_ATTR = "data-dict-drawer-open";

/** 元コンテナのスクロール位置を先コンテナへ比率換算で引き継ぐ。 */
function syncScroll(from: HTMLElement, to: HTMLElement): void {
  to.scrollTop = mapScrollTop(from, to);
}

/** 辞書ペインの拡大表示を初期化する（ドロワー不在のページでは何もしない）。 */
export function initDictDrawer(): void {
  const drawer = document.querySelector<HTMLElement>("[data-dict-drawer]");
  if (!drawer) return;
  // クローズトリガーはヘッダーの eyebrow ボタンと×ボタンの2つ（wikilink-ui R-25）。
  // 開時のフォーカス先は×ボタン＝DOM 順で最後のトリガー（eyebrow はヘッダー左端のため、
  // フォーカスリングが「閉じる操作」より「タイトル」に見えてしまうのを避ける）。
  const closeButtons = drawer.querySelectorAll<HTMLButtonElement>(
    "[data-dict-drawer-close]",
  );
  const closeBtn = closeButtons[closeButtons.length - 1] ?? null;
  const drawerContent = drawer.querySelector<HTMLElement>(
    "[data-dict-drawer-content]",
  );
  // デスクトップ右レール配下に限定してペイン本文を特定する（モバイルシート内の複製と区別）。
  const paneContent = document.querySelector<HTMLElement>(
    "[data-dict-rail] [data-dict-pane-content]",
  );

  // 閉時のフォーカス返還先（開いたトリガー）。Esc で閉じてもキーボード操作の文脈が切れないようにする。
  let lastTrigger: HTMLElement | null = null;

  const isOpen = (): boolean =>
    document.documentElement.hasAttribute(OPEN_ATTR);

  const open = (trigger: HTMLElement): void => {
    if (isOpen()) return;
    lastTrigger = trigger;
    // スクロール量の読み取りはレールが display: none になる前に行う（R-26。
    // 非表示中は scrollHeight / clientHeight が 0 になり比率が取れない）。
    const paneMetrics: ScrollMetrics | null = paneContent
      ? {
          scrollTop: paneContent.scrollTop,
          scrollHeight: paneContent.scrollHeight,
          clientHeight: paneContent.clientHeight,
        }
      : null;
    document.documentElement.setAttribute(OPEN_ATTR, "");
    if (paneMetrics && drawerContent) {
      drawerContent.scrollTop = mapScrollTop(paneMetrics, drawerContent);
    }
    closeBtn?.focus();
  };

  const close = (): void => {
    if (!isOpen()) return;
    // 属性除去でレール（display: none）が同期的に復帰し、直後にペインへ書き戻せる（R-26）。
    document.documentElement.removeAttribute(OPEN_ATTR);
    if (paneContent && drawerContent) syncScroll(drawerContent, paneContent);
    // xl 以上の目次シートはドロワー表示中だけ有効（R-23）。開いたまま閉じると hidden
    // クラスが外れたまま残り、次回のドロワー表示でシートが不意に再出現するため畳んでおく。
    document.querySelector("[data-toc-sheet]")?.classList.add("hidden");
    lastTrigger?.focus();
    lastTrigger = null;
  };

  for (const btn of document.querySelectorAll<HTMLElement>(
    "[data-dict-expand]",
  )) {
    btn.addEventListener("click", () => open(btn));
  }
  for (const btn of closeButtons) {
    btn.addEventListener("click", close);
  }
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
