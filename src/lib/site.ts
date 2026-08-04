// サイト共通の定数（フッター等で共有する）。

/** サイト全体のメタ情報。 */
export const SITE = {
  title: "Progrust Library",
  author: "Ryota Nishiki",
  /** サイト固定の説明文（RSSチャンネルの description 等で使う。feeds-meta R-1〜R-3）。 */
  description:
    "Rustプログラミング言語を中心とした技術ブログ。辞書・記事・本の3タイプでRustとRust周辺の知見を綴る。",
  /** コピーライト表記の開始年。 */
  since: 2026,
} as const;

/** 全ページ共通のOGP画像のパス（feeds-meta R-6。public/ogp.png・1200×630）。 */
export const OGP_IMAGE_PATH = "/ogp.png";

/** 記事のヘッダ画像フォールバック（pages R-9。frontmatterのimage省略時に一覧カードで使う）。 */
export const DEFAULT_HEADER_IMAGE = {
  url: OGP_IMAGE_PATH,
  alt: SITE.title,
} as const;

/** フッター等で使う各種リンク。 */
export const SITE_LINKS = {
  rss: "/rss.xml",
  github: "https://github.com/Progrust/",
  x: "https://x.com/",
} as const;
