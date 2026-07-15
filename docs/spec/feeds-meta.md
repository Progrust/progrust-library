# フィード・メタ情報 仕様

## 1. 概要

RSSフィード・sitemap・OGP/metaタグ・favicon・アクセス解析を定義する。

関連文書:

- 公開制御（非公開コンテンツの除外範囲）: [`content-model.md`](content-model.md) R-11
- 404ページ: [`pages.md`](pages.md) R-21

## 2. 要求仕様

### RSSフィード

- **R-1**: `@astrojs/rss` でRSSフィードを生成する。
- **R-2**: 対象は全タイプ混在（辞書・記事・本・章）の公開コンテンツ。`created_at` 降順の直近20件とする。
- **R-3**: 各アイテムはタイトル + description（本文は含めない）+ リンク + 公開日で構成する。

### sitemap

- **R-4**: `@astrojs/sitemap` で sitemap.xml を生成する。非公開コンテンツは本番ビルドで除外済みのため自然に含まれない。

### OGP・metaタグ

- **R-5**: 各ページに `title` / `description` / OGPタグ（`og:title`・`og:description`・`og:image` 等）を出力する。
  - `title`: 「ページタイトル | サイト名」形式。トップはサイト名のみ
  - `description`: frontmatterの`description`（一覧・トップ等はページ固有の固定文）
- **R-6**: OGP画像はデフォルトの1枚（`public/ogp.png`・1200×630）を全ページ共通で使用する。
  - デザイン（2026-07確定）: paper面（#F2F0EC）の右側にfaviconと同じ「`//`」を画面からはみ出す巨大スケール（accent #C63D22）で配置し、左側にeyebrow「`// programming in rust`」（JetBrains Mono・accent）+ ワードマーク「Progrust Library.」2行組み（Zen Kaku Gothic New 900・strong・ピリオドのみaccent）を上下中央寄せで置く
  - 編集用SVG原本は [`../ui-design/assets/ogp.svg`](../ui-design/assets/ogp.svg)。PNG化はGoogle FontsのTTFサブセット（`text=`パラメータ）+ `@resvg/resvg-js` で行う（一時スクリプトで可、ビルドには組み込まない）
- **R-7**: canonical URLは `https://progrust.com` ドメインで出力する。

### favicon

- **R-8**: favicon（SVG・`public/favicon.svg`）を全ページの`<head>`から`<link rel="icon" type="image/svg+xml">`で参照する。
  - デザイン（2026-07確定）: 背景透過で、eyebrowのコードコメント記法をモチーフにしたアクセント色の斜線2本「`//`」のみを置く
  - 配色はSVG内に埋め込んだ`prefers-color-scheme`メディアクエリで切り替える（light: 斜線 `accent` #C63D22、dark: 斜線 `naccent` #F0684A）。faviconはページ外で描画されるため、サイト内のテーマ切替（`html.dark`クラス）には追従せずOS/ブラウザのテーマに従う
  - PNGフォールバック・`apple-touch-icon`は不要と決定（T6-2）。SVG faviconはモダンブラウザで広くサポートされ、個人技術ブログとしてはSVG1枚で十分

### アクセス解析

- **R-9**: Cloudflare Web Analyticsのスクリプトタグを全ページに埋め込む（それ以外の解析ツールは導入しない）。

### コメント機能

- **R-10**: コメント機能は実装しない。

## 4. 受入基準

- **AC-1**: RSSフィードが生成され、辞書・記事・本・章が混在した `created_at` 降順の最大20件で、非公開コンテンツが含まれない。（R-1〜R-3）
- **AC-2**: sitemap.xmlが生成され、公開ページのURLがすべて含まれ、非公開ページのURLが含まれない。（R-4）
- **AC-3**: 記事詳細ページのHTMLに `og:title`・`og:description`・共通の `og:image` が出力される。（R-5, R-6）
- **AC-4**: 全ページにCloudflare Web Analyticsのスクリプトタグが含まれる。（R-9）
- **AC-5**: 全ページのHTMLに`/favicon.svg`を参照する`<link rel="icon" type="image/svg+xml">`が出力される。（R-8）

## 5. 未確定事項

- RSSフィードのURLは `/rss.xml`、フッターのリンク表記は「RSS」で確定（T6-1）。
- OGP・meta・favicon・Analyticsタグは実装済み（T6-2）。`title`/`description`/canonical/OGP（`og:*`）/Twitter Card/RSS自動検出`<link rel="alternate">`は`BaseLayout.astro`が全ページ共通で出力する。
- Cloudflare Web Analyticsのトークンは環境変数 `PUBLIC_CF_BEACON_TOKEN` で注入し、設定時のみbeaconタグを出力する条件レンダリングで確定（T6-2）。実トークンの取得とCloudflare Secretsへの登録はT6-4で行う。
