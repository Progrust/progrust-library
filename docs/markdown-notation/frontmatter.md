# 各コンテンツごとのfrontmatter一覧

## 辞書コンテンツ

### 設定内容

- title: ページタイトル
- description: ページ概要（SEOディスクリプション用）
- created_at: 公開日（yyyy-MM-dd）
- updated_at: 更新日（yyyy-MM-dd）
- tags: タグ（["Rust基礎", "Axum"]）
- public: 公開 or 非公開（true or false）

### 設定例

```yaml
title: 可変性（Mutability）
description: 値が変更可能かどうかを示すプロパティ。Rustではデフォルトが不変。
created_at: 2024-01-18
updated_at: 2024-06-10
tags: ["Rust基礎", "可変性", "参照"]
public: true
```

## 記事コンテンツ

### 設定内容

- title: ページタイトル
- description: ページ概要（SEOディスクリプション用）
- created_at: 公開日（yyyy-MM-dd）
- updated_at: 更新日（yyyy-MM-dd）
- tags: タグ（["Rust基礎", "Axum"]）
- public: 公開 or 非公開（true or false）
- image: ページのヘッダ画像
  - url: URLやパス
  - alt: 説明

### 設定例

```yaml
title: Axum で始める Web API 開発
description: Tokio ベースの高速 Web フレームワーク Axum を使った API 開発入門。
created_at: 2024-05-02
updated_at: 2024-06-10
tags: ["Axum", "Web開発", "API"]
public: true
image:
  url: https://picsum.photos/1200/630?random=3
  alt: Axumロゴ
```

## 本コンテンツ

### 設定内容

- title: ページタイトル
- description: ページ概要（SEOディスクリプション用）
- created_at: 公開日（yyyy-MM-dd）
- updated_at: 更新日（yyyy-MM-dd）
- tags: タグ（["Rust基礎", "Axum"]）
- public: 公開 or 非公開（true or false）
- image: ページのヘッダ画像
  - url: URLやパス
  - alt: 説明

### 設定例

```yaml
title: Rustで始めるWeb API開発 - 実践ガイド
description: Tokio、Axum、データベース連携を学ぶ実践的な本。初心者から中級者向け。
created_at: 2024-06-01
updated_at: 2024-06-10
tags: ["Rust", "Web開発", "API", "実践"]
public: true
image:
  url: https://picsum.photos/1200/630?random=7
  alt: Rust Web API開発
```

## 章コンテンツ

### 設定内容

- title: ページタイトル
- description: ページ概要（SEOディスクリプション用）
- created_at: 公開日（yyyy-MM-dd）
- updated_at: 更新日（yyyy-MM-dd）
- tags: タグ（["Rust基礎", "Axum"]）
- public: 公開 or 非公開（true or false）

### 設定例

```yaml
title: イントロダクション
description: Rust Web API開発の全体像。学習ロードマップと章構成の説明。
created_at: 2024-06-01
updated_at: 2024-06-10
tags: ["導入", "Web開発", "ロードマップ"]
public: true
```

## 補足

### 非公開（`public: false`）について

非公開ページはビルドから完全に除外して、URLでアクセスした場合も404となる。
非公開の記事から辞書へのリンクがある場合、その辞書の逆リンク一覧には載せない

- 本の`index.md`が`public: false`の場合、配下の章もすべて非公開となる（章側の`public`の値に関わらず丸ごと除外）
- 章のみ`public: false`の場合、その章はビルドから除外し、本トップページの章目次・目次サイドバー・前後章ナビゲーションからもスキップする

### frontmatterに辞書linkは記載できない

frontmatterに`[[ownership]]`のような辞書linkは記載できない。
辞書linkはあくまでmarkdown本文のみ記載可能。
