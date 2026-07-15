// サイト共通の定数（フッター等で共有する）。

/** サイト全体のメタ情報。 */
export const SITE = {
  title: "Progrust Library",
  author: "nishiki",
  /** サイト固定の説明文（RSSチャンネルの description 等で使う。feeds-meta R-1〜R-3）。 */
  description:
    "Rustプログラミング言語を中心とした技術ブログ。辞書・記事・本の3タイプでRustとRust周辺の知見を綴る。",
  /** コピーライト表記の開始年。 */
  since: 2026,
} as const;

/** フッター等で使う各種リンク。GitHub / X は暫定URL（実URLは P6 で確定）。 */
export const SITE_LINKS = {
  rss: "/rss.xml",
  github: "https://github.com/",
  x: "https://x.com/",
} as const;
