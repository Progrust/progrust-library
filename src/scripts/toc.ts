// 目次のクライアント JS（pages R-13 / AC-7）。クライアント JS はコンポーネントに書かない規約（§4）。
// (1) IntersectionObserver で本文見出しの現在地を目次にハイライトする（現在地追従・実装確定）。
// (2) モバイルの目次ボトムシートを開閉する。
// JS 無効でも目次アンカー（<a href="#slug">）は静的に機能する（プログレッシブエンハンスメント）。

/** 目次リンクを slug ごとにまとめる（デスクトップ／モバイルシートで同 slug が重複するため配列）。 */
function groupLinksBySlug(): Map<string, HTMLAnchorElement[]> {
  const bySlug = new Map<string, HTMLAnchorElement[]>();
  const links = document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]");
  for (const link of links) {
    const slug = link.dataset.tocLink;
    if (!slug) continue;
    const list = bySlug.get(slug) ?? [];
    list.push(link);
    bySlug.set(slug, list);
  }
  return bySlug;
}

/** スクロールに応じて現在地の見出しを目次にハイライトする。 */
function initActiveTracking(): void {
  const bySlug = groupLinksBySlug();
  if (bySlug.size === 0) return;

  const headings = Array.from(
    document.querySelectorAll<HTMLElement>(".prose :is(h2, h3, h4)[id]"),
  );
  if (headings.length === 0) return;

  let activeSlug = "";
  const setActive = (slug: string): void => {
    if (slug === activeSlug) return;
    for (const link of bySlug.get(activeSlug) ?? [])
      link.classList.remove("toc-active");
    for (const link of bySlug.get(slug) ?? []) link.classList.add("toc-active");
    activeSlug = slug;
  };

  const visible = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const { id } = entry.target;
        if (entry.isIntersecting) visible.add(id);
        else visible.delete(id);
      }
      // 文書順で最初に可視な見出しを現在地とする。
      const current = headings.find((heading) => visible.has(heading.id));
      if (current) setActive(current.id);
    },
    // 上端はヘッダー分オフセットし、下 70% は先読みで現在地を早めに切り替える。
    { rootMargin: "-80px 0px -70% 0px" },
  );
  for (const heading of headings) observer.observe(heading);
}

/** モバイルの目次ボトムシートの開閉を登録する。 */
function initMobileSheet(): void {
  const sheet = document.querySelector<HTMLElement>("[data-toc-sheet]");
  if (!sheet) return;

  const open = (): void => sheet.classList.remove("hidden");
  const close = (): void => sheet.classList.add("hidden");

  document.querySelector("[data-toc-open]")?.addEventListener("click", open);
  for (const el of document.querySelectorAll(
    "[data-toc-close], [data-toc-backdrop]",
  )) {
    el.addEventListener("click", close);
  }
  // シート内の目次リンクを押したらシートを閉じてから遷移する。
  for (const link of sheet.querySelectorAll("[data-toc-link]")) {
    link.addEventListener("click", close);
  }
}

/** 目次の現在地追従とモバイルシート開閉を初期化する。 */
export function initToc(): void {
  initActiveTracking();
  initMobileSheet();
}
