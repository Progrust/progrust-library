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
- **R-6**: OGP画像はデフォルトの1枚を全ページ共通で使用する（画像は別途用意）。
- **R-7**: canonical URLは `https://progrust.com` ドメインで出力する。

### favicon

- **R-8**: faviconを`public/`に配置して全ページで参照する。

### アクセス解析

- **R-9**: Cloudflare Web Analyticsのスクリプトタグを全ページに埋め込む（それ以外の解析ツールは導入しない）。

### コメント機能

- **R-10**: コメント機能は実装しない。

## 4. 受入基準

- **AC-1**: RSSフィードが生成され、辞書・記事・本・章が混在した `created_at` 降順の最大20件で、非公開コンテンツが含まれない。（R-1〜R-3）
- **AC-2**: sitemap.xmlが生成され、公開ページのURLがすべて含まれ、非公開ページのURLが含まれない。（R-4）
- **AC-3**: 記事詳細ページのHTMLに `og:title`・`og:description`・共通の `og:image` が出力される。（R-5, R-6）
- **AC-4**: 全ページにCloudflare Web Analyticsのスクリプトタグが含まれる。（R-9）

## 5. 未確定事項

- RSSフィードのURL（`/rss.xml` 想定）とフッターからのリンク表記は実装時に確定する。
- OGP画像・faviconの素材は別途用意する（実装フェーズのタスク）。
- Cloudflare Web Analyticsのトークンは導入時に取得する。
