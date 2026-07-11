// 辞書サイドペインのクライアント JS（wikilink-ui R-10〜R-14 / AC-2・AC-4・AC-5）。
// 本文・ペイン内の辞書リンク（a.wikilink[data-dict-link]）クリックで embed 断片を
// fetch し、画面遷移せず右ペイン（モバイルはボトムシート）に内容を差し替え表示する。
// JS 無効時は素の <a href="/dict/[slug]"> による通常遷移で機能する（R-3 / AC-2）。
// クライアント JS はコンポーネントに書かない規約（§4）に従い本モジュールへ分離する。

/** embed 断片から抽出したペイン表示用データ。 */
export interface DictEmbed {
  slug: string;
  title: string;
  tags: string[];
  /** 本文（.prose の outerHTML）。ホストページの global.css でスタイルが適用される。 */
  bodyHtml: string;
}

/** ペイン単体の閲覧履歴（配列 + カーソル）。cursor = -1 はデフォルト（未選択）状態。 */
export interface PaneHistory {
  entries: string[];
  cursor: number;
}

// --- 履歴の純ロジック（DOM 非依存・vitest 対象。AC-5） ------------------------

/** 空のデフォルト履歴を生成する。ページ遷移ごとにモジュールが再初期化されリセットされる。 */
export function createHistory(): PaneHistory {
  return { entries: [], cursor: -1 };
}

/** 現在表示中の辞書 slug。未選択（デフォルト状態）なら null。 */
export function currentSlug(history: PaneHistory): string | null {
  return history.cursor >= 0 ? (history.entries[history.cursor] ?? null) : null;
}

/** 戻れるか（カーソルより前に履歴があるか）。 */
export function canGoBack(history: PaneHistory): boolean {
  return history.cursor > 0;
}

/** 進めるか（カーソルより後に履歴があるか）。 */
export function canGoForward(history: PaneHistory): boolean {
  return history.cursor < history.entries.length - 1;
}

/**
 * 新しい辞書を履歴末尾に積む。分岐時（カーソルが末尾でない）は前方履歴を切り捨てる。
 * 現在表示中と同一 slug の場合は無変更（同じ辞書リンク連打で履歴が伸びない）。
 */
export function pushEntry(history: PaneHistory, slug: string): PaneHistory {
  if (currentSlug(history) === slug) return history;
  const entries = history.entries.slice(0, history.cursor + 1);
  entries.push(slug);
  return { entries, cursor: entries.length - 1 };
}

/** 1 つ前の辞書へ戻る。戻れない場合は無変更。 */
export function goBack(history: PaneHistory): PaneHistory {
  if (!canGoBack(history)) return history;
  return { entries: history.entries, cursor: history.cursor - 1 };
}

/** 1 つ後の辞書へ進む。進めない場合は無変更。 */
export function goForward(history: PaneHistory): PaneHistory {
  if (!canGoForward(history)) return history;
  return { entries: history.entries, cursor: history.cursor + 1 };
}

// --- embed フェッチ（プレビューと共有するキャッシュ。§8） ---------------------

// slug ごとに fetch 結果（失敗時 null）を保持する。dict-preview.ts（T4-3）はこの
// 関数を import してホバープレビューとペインでフェッチ結果を共有する。
const embedCache = new Map<string, Promise<DictEmbed | null>>();

async function requestEmbed(slug: string): Promise<DictEmbed | null> {
  try {
    const res = await fetch(`/dict/${encodeURIComponent(slug)}/embed/`);
    if (!res.ok) return null;
    const doc = new DOMParser().parseFromString(await res.text(), "text/html");
    const root = doc.querySelector<HTMLElement>("[data-dict-embed]");
    const prose = root?.querySelector<HTMLElement>(".prose");
    if (!root || !prose) return null;
    return {
      slug,
      title: root.dataset.title ?? slug,
      tags: (root.dataset.tags ?? "").split("|").filter(Boolean),
      bodyHtml: prose.outerHTML,
    };
  } catch {
    // ネットワーク失敗等。呼び出し側で通常遷移にフォールバックする（R-16）。
    return null;
  }
}

/** 辞書 embed 断片を取得する（slug 単位でキャッシュ・プレビューと共有）。失敗時 null。 */
export function fetchDictEmbed(slug: string): Promise<DictEmbed | null> {
  const cached = embedCache.get(slug);
  if (cached) return cached;
  const pending = requestEmbed(slug).then((embed) => {
    // 一時的な失敗（null）は恒久キャッシュせず、次回クリックで再試行できるようにする。
    if (!embed) embedCache.delete(slug);
    return embed;
  });
  embedCache.set(slug, pending);
  return pending;
}

// --- DOM 配線 ----------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 種別ラベル（辞書固定）は KindBadge.astro の辞書バリアントと同一クラスを複製する。
const DICT_BADGE_CLASS =
  "rounded border px-2 py-0.5 font-display text-[11px] font-bold " +
  "border-[#A87B1C] text-[#8F6812] dark:border-[#D9B25E] dark:text-[#D9B25E]";

/**
 * ペイン選択状態・ホバープレビュー共通の内側 HTML（種別バッジ・タイトル・タグ・本文・
 * 辞書ページリンク）を組み立てる（ui-design-spec「ペイン/プレビューの内容表示」）。
 * compact はプレビュー用: タイトルを一回り小さくし、辞書ページリンクを省く。
 */
export function dictMarkup(embed: DictEmbed, compact: boolean): string {
  const tagsHtml = embed.tags
    .map(
      (tag) =>
        `<span class="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-sub">#${escapeHtml(tag)}</span>`,
    )
    .join("");
  const openLink = compact
    ? ""
    : `
    <a href="/dict/${encodeURIComponent(embed.slug)}" class="mt-4 inline-flex items-center gap-1.5 font-display text-xs font-bold text-accent hover:underline">
      辞書ページを開く
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"></path></svg>
    </a>
  `;
  return `
    <div class="mb-2"><span class="${DICT_BADGE_CLASS}">辞書</span></div>
    <h2 class="font-display ${compact ? "text-sm" : "text-base"} mb-2 font-bold text-strong">${escapeHtml(embed.title)}</h2>
    ${tagsHtml ? `<div class="mb-3 flex flex-wrap gap-1.5">${tagsHtml}</div>` : ""}
    ${embed.bodyHtml}
    ${openLink}
  `;
}

// ペイン単体の履歴。モジュールスコープで保持し、ページ遷移（フルリロード）で自然にリセットされる。
// （ブラウザの window.history とは無関係。R-13）
let paneHistory = createHistory();

// 描画要求ごとに採番し、fetch 解決時に最新の要求だけを描画する世代トークン。
// 辞書 A の fetch 中に B をクリックすると、A の解決が後勝ちで B を上書きし履歴も
// クリック順と逆になる競合を防ぐ（T4-2 レビュー申し送り）。
let renderGeneration = 0;

/** 全ペイン（デスクトップ + モバイルシート）の戻る/進むボタンの活性を履歴に同期する。 */
function syncNav(): void {
  const back = !canGoBack(paneHistory);
  const forward = !canGoForward(paneHistory);
  for (const btn of document.querySelectorAll<HTMLButtonElement>(
    "[data-dict-pane-prev]",
  )) {
    btn.disabled = back;
  }
  for (const btn of document.querySelectorAll<HTMLButtonElement>(
    "[data-dict-pane-next]",
  )) {
    btn.disabled = forward;
  }
}

/** 選択状態を全ペインに描画する（デフォルトブロックは隠す）。 */
function renderEmbed(embed: DictEmbed): void {
  const markup = dictMarkup(embed, false);
  for (const content of document.querySelectorAll<HTMLElement>(
    "[data-dict-pane-content]",
  )) {
    content.innerHTML = markup;
    content.classList.remove("hidden");
  }
  for (const def of document.querySelectorAll<HTMLElement>(
    "[data-dict-pane-default]",
  )) {
    def.classList.add("hidden");
  }
}

/** デフォルト状態（案内メッセージ）を全ペインに表示する。 */
function renderDefault(): void {
  for (const content of document.querySelectorAll<HTMLElement>(
    "[data-dict-pane-content]",
  )) {
    content.innerHTML = "";
    content.classList.add("hidden");
  }
  for (const def of document.querySelectorAll<HTMLElement>(
    "[data-dict-pane-default]",
  )) {
    def.classList.remove("hidden");
  }
}

/** 履歴カーソル位置の辞書を（キャッシュ経由で）再描画する。戻る/進む用。 */
async function showCurrent(): Promise<void> {
  const gen = ++renderGeneration;
  const slug = currentSlug(paneHistory);
  syncNav();
  if (!slug) {
    renderDefault();
    return;
  }
  const embed = await fetchDictEmbed(slug);
  // 戻る/進むの連打で新しい要求に追い越されていたら描画しない。
  if (gen !== renderGeneration) return;
  if (embed) renderEmbed(embed);
}

const mobileQuery = "(max-width: 1023px)";

/** モバイル幅なら辞書ボトムシートを開く（R-14）。 */
function openSheetIfMobile(): void {
  if (!window.matchMedia(mobileQuery).matches) return;
  document
    .querySelector<HTMLElement>("[data-dict-sheet]")
    ?.classList.remove("hidden");
}

/** 辞書リンククリック時: embed を取得し履歴に積んで表示する（R-11 / R-12）。 */
async function navigateTo(slug: string): Promise<void> {
  const gen = ++renderGeneration;
  const embed = await fetchDictEmbed(slug);
  // 別の辞書クリックに追い越されていたら破棄する（後勝ち・履歴逆順の防止）。
  if (gen !== renderGeneration) return;
  if (!embed) {
    // 取得失敗時はペイン表示を諦め、リンク本来の遷移を保つ（R-16）。
    window.location.assign(`/dict/${encodeURIComponent(slug)}`);
    return;
  }
  paneHistory = pushEntry(paneHistory, slug);
  renderEmbed(embed);
  syncNav();
  openSheetIfMobile();
}

/** 本文・ペイン内の辞書リンククリックを 1 つの委譲ハンドラで捕捉する。 */
function initLinkDelegation(): void {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>(
      "a.wikilink[data-dict-link]",
    );
    if (!link) return;
    const slug = link.dataset.dictLink;
    if (!slug) return;
    // 修飾クリック（新規タブ・新規ウィンドウ等）はブラウザ標準に委ねる。
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey
    )
      return;
    event.preventDefault();
    void navigateTo(slug);
  });
}

/** 戻る/進むボタンとモバイルシートの開閉を配線する。 */
function initControls(): void {
  for (const btn of document.querySelectorAll("[data-dict-pane-prev]")) {
    btn.addEventListener("click", () => {
      paneHistory = goBack(paneHistory);
      void showCurrent();
    });
  }
  for (const btn of document.querySelectorAll("[data-dict-pane-next]")) {
    btn.addEventListener("click", () => {
      paneHistory = goForward(paneHistory);
      void showCurrent();
    });
  }
  document
    .querySelector("[data-dict-open]")
    ?.addEventListener("click", () =>
      document
        .querySelector<HTMLElement>("[data-dict-sheet]")
        ?.classList.remove("hidden"),
    );
  for (const el of document.querySelectorAll(
    "[data-dict-close], [data-dict-backdrop]",
  )) {
    el.addEventListener("click", () =>
      document
        .querySelector<HTMLElement>("[data-dict-sheet]")
        ?.classList.add("hidden"),
    );
  }
}

/** 辞書サイドペインを初期化する（詳細ページのみ・ペイン不在なら何もしない）。 */
export function initDictPane(): void {
  if (!document.querySelector("[data-dict-pane]")) return;
  initLinkDelegation();
  initControls();
  syncNav();
}
