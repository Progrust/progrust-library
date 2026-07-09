// テーマ切替ボタンのクライアント JS（theme.md R-1/R-2/R-4）。
// 初期テーマの適用は FOUC 防止のため BaseLayout の <head> 同期インラインスクリプトが行う。
// ここでは切替ボタンの押下時に html.dark をトグルし、選択を localStorage に保存する。
// Shiki コード・mermaid 図は .dark クラス駆動の CSS / Tailwind クラスで切り替わるため、
// クラスのトグルだけで本文レンダリング済み要素にも即時反映される（R-5 / AC-4）。

/** テーマ切替ボタンにクリックハンドラを登録する。 */
export function initThemeToggle(): void {
  const button = document.querySelector<HTMLButtonElement>(
    "[data-theme-toggle]",
  );
  if (!button) return;

  button.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}
