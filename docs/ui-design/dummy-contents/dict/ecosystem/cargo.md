---
title: Cargo
description: Rustのパッケージマネージャ兼ビルドシステム。プロジェクト管理の中心。
created_at: 2024-04-01
updated_at: 2024-06-10
tags: ["Rust基礎", "ツール", "パッケージ管理"]
public: true
---

# Cargo

Cargo は Rust の公式パッケージマネージャ兼ビルドシステムです。プロジェクト管理、依存関係の解決、ビルド、テストまで、多くのタスクを一元管理します。

## プロジェクトの初期化

```bash
cargo new my-project
cd my-project
cargo build
cargo run
```

## Cargo.toml

```toml:Cargo.toml
[package]
name = "my-project"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }

[dev-dependencies]
criterion = "0.5"
```

:::message{tip}
`Cargo.toml` はプロジェクトのメタデータと依存関係を管理します。バージョン指定の柔軟性により、互換性を保ちながらアップデート可能です。
:::

## よく使うコマンド

```bash
cargo check     # コンパイルチェック（バイナリ生成なし）
cargo build --release  # リリースビルド
cargo test      # テスト実行
cargo doc --open       # ドキュメント生成・表示
```

:::details[ワークスペース]
大きなプロジェクトでは複数のクレートを管理できます：

```toml
[workspace]
members = ["crate1", "crate2"]
```
:::

詳細は [[crate]] を参照してください。
