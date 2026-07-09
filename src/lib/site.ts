// サイト共通の定数（フッター・プロフィール等で共有する）。

/** サイト全体のメタ情報。 */
export const SITE = {
  title: "Progrust Library",
  author: "nishiki",
  /** コピーライト表記の開始年。 */
  since: 2026,
} as const;

/** フッター・プロフィールで使う各種リンク。GitHub / X は暫定URL（実URLは P6 で確定）。 */
export const SITE_LINKS = {
  profile: "/profile/",
  rss: "/rss.xml",
  github: "https://github.com/",
  x: "https://x.com/",
} as const;
