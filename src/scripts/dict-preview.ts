// 辞書リンクのホバープレビュー（wikilink-ui R-6〜R-9 / AC-3）。
// 辞書リンク（a.wikilink[data-dict-link]）にマウスホバーすると、辞書の本文全文を
// プレビュー小窓に表示する。フェッチ結果は dict-pane.ts の fetchDictEmbed と共有し、
// 同一辞書を二重 fetch しない（architecture §8）。タッチ環境では動作しない（R-9）。
// クライアント JS はコンポーネントに書かない規約（§4）に従い本モジュールへ分離する。

import { fetchDictEmbed } from "./dict-pane";

// --- 位置決めの純ロジック（DOM 非依存・vitest 対象。AC-3） --------------------

/** 小窓を出す対象リンクの矩形（getBoundingClientRect 相当の必要フィールドのみ）。 */
export interface LinkRect {
  top: number;
  bottom: number;
  left: number;
}

/** 小窓のサイズ。 */
export interface PreviewSize {
  width: number;
  height: number;
}

/** ビューポート寸法。 */
export interface Viewport {
  width: number;
  height: number;
}

/** 小窓の配置結果（fixed 座標）。flipped は下端反転で上に出したかどうか。 */
export interface PreviewPlacement {
  top: number;
  left: number;
  flipped: boolean;
}

// リンクと小窓の間隔・ビューポート端の最小マージン（px）。
const GAP = 6;
const MARGIN = 8;

/**
 * ホバー中リンクの下（既定）に小窓を配置する座標を求める。下に出すと画面下端を
 * はみ出す場合はリンク上へ反転する（R-7）。left はビューポート幅にクランプする。
 */
export function resolvePreviewPlacement(
  link: LinkRect,
  preview: PreviewSize,
  viewport: Viewport,
): PreviewPlacement {
  const below = link.bottom + GAP;
  // 下に出すと下端をはみ出す かつ 上側の方が収まるなら反転する。
  const overflowsBelow = below + preview.height > viewport.height - MARGIN;
  const flipped = overflowsBelow && link.top - GAP - preview.height >= MARGIN;
  const top = flipped ? link.top - GAP - preview.height : below;

  const maxLeft = viewport.width - preview.width - MARGIN;
  // 左端は MARGIN 以上、右端は maxLeft 以下にクランプ（小窓が画面幅を超える場合は MARGIN）。
  const left = Math.max(MARGIN, Math.min(link.left, Math.max(MARGIN, maxLeft)));

  return { top, left, flipped };
}

// --- DOM 配線 ----------------------------------------------------------------

// hover 可能な環境か（R-9: タッチ端末では small window を出さない）。
const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

// 表示/非表示のディレイ（spec §5 は未確定 → 妥当な既定値）。離脱時は小窓へマウスを
// 移す猶予を持たせる。
const SHOW_DELAY_MS = 220;
const HIDE_DELAY_MS = 150;

// プレビュー小窓のスタイル（ui-design-spec「辞書リンク」の挙動）。fixed 配置・初期非表示。
const PREVIEW_CLASS =
  "hidden fixed z-50 w-80 max-h-72 overflow-y-auto rounded border border-line " +
  "bg-card p-4 shadow-xl";

let previewEl: HTMLElement | null = null;
let showTimer: number | undefined;
let hideTimer: number | undefined;
// ホバーごとに採番し、fetch 解決時に最新のホバーだけ描画する（ホバー先を素早く
// 移した際に古い解決が後勝ちで表示されるのを防ぐ。dict-pane.ts と同方式）。
let hoverGeneration = 0;

/** 小窓 DOM を一度だけ生成して body に挿す。 */
function ensurePreviewEl(): HTMLElement {
  if (previewEl) return previewEl;
  const el = document.createElement("div");
  el.className = PREVIEW_CLASS;
  el.setAttribute("data-dict-preview", "");
  // 小窓上にマウスが乗っている間は非表示タイマーを止め、スクロール・リンククリックを可能にする。
  el.addEventListener("pointerenter", () => window.clearTimeout(hideTimer));
  el.addEventListener("pointerleave", scheduleHide);
  document.body.appendChild(el);
  previewEl = el;
  return el;
}

/** 小窓を隠し、内容を空にする。 */
function hidePreview(): void {
  hoverGeneration++;
  if (!previewEl) return;
  previewEl.classList.add("hidden");
  previewEl.innerHTML = "";
}

function scheduleHide(): void {
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(hidePreview, HIDE_DELAY_MS);
}

/** 本文を小窓に挿入し、リンク矩形を基準に位置決めして表示する。 */
function showPreview(
  el: HTMLElement,
  link: HTMLElement,
  bodyHtml: string,
): void {
  el.innerHTML = bodyHtml;
  el.classList.remove("hidden");
  const rect = link.getBoundingClientRect();
  const placement = resolvePreviewPlacement(
    { top: rect.top, bottom: rect.bottom, left: rect.left },
    { width: el.offsetWidth, height: el.offsetHeight },
    { width: window.innerWidth, height: window.innerHeight },
  );
  el.style.top = `${placement.top}px`;
  el.style.left = `${placement.left}px`;
}

/** リンクホバー時: embed を取得し、最新ホバーなら小窓を表示する（R-7 / R-16）。 */
function requestPreview(link: HTMLElement, slug: string): void {
  const gen = ++hoverGeneration;
  void fetchDictEmbed(slug).then((embed) => {
    // ホバー先が変わっていたら（世代不一致）描画しない。fetch 失敗（null）は
    // 小窓を出さず、リンクは素で機能する（R-16）。
    if (gen !== hoverGeneration || !embed) return;
    showPreview(ensurePreviewEl(), link, embed.bodyHtml);
  });
}

/** 対象辞書リンクを返す。小窓内リンク（R-8）は対象外。 */
function dictLinkFrom(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const link = target.closest<HTMLAnchorElement>("a.wikilink[data-dict-link]");
  if (!link) return null;
  // 小窓内の辞書リンクはさらにプレビューしない（R-8）。
  if (link.closest("[data-dict-preview]")) return null;
  return link;
}

/** 本文・ペイン内の辞書リンクへのホバーを 1 つの委譲ハンドラで捕捉する（R-6）。 */
function initHoverDelegation(): void {
  document.addEventListener("pointerover", (event) => {
    const link = dictLinkFrom(event.target);
    if (!link) return;
    const slug = link.dataset.dictLink;
    if (!slug) return;
    window.clearTimeout(hideTimer);
    window.clearTimeout(showTimer);
    showTimer = window.setTimeout(
      () => requestPreview(link, slug),
      SHOW_DELAY_MS,
    );
  });

  document.addEventListener("pointerout", (event) => {
    const link = dictLinkFrom(event.target);
    if (!link) return;
    // リンクから離れたら表示予約を取り消し、非表示を予約する（小窓へ移る猶予は
    // scheduleHide のディレイ＋小窓の pointerenter で確保）。
    window.clearTimeout(showTimer);
    scheduleHide();
  });
}

/** 辞書ホバープレビューを初期化する（hover 非対応環境では何もしない・R-9）。 */
export function initDictPreview(): void {
  if (!window.matchMedia(HOVER_QUERY).matches) return;
  initHoverDelegation();
}
