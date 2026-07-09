---
title: 環境構築
description: Rust開発環境のセットアップ。プロジェクト初期化から最初のビルドまで。
created_at: 2024-06-02
updated_at: 2024-06-10
tags: ["環境構築", "セットアップ", "Cargo"]
public: true
image:
  url: https://picsum.photos/1200/630?random=8
  alt: Rust開発環境のセットアップ
---

# 第2章 環境構築

このガイドを始める前に、Rust 開発環境を整えます。

## Rust のインストール

Rust 公式のインストーラを使用します：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

インストール後、シェルを再起動し、以下で確認します：

```bash
rustc --version
cargo --version
```

:::message[rustup とは]{tip}
`rustup` は Rust のツールチェーン管理ツールです。バージョンアップデートもこれで管理できます。
:::

## プロジェクト作成

新しい Cargo プロジェクトを作成します：

```bash
cargo new rust-web-api-tutorial
cd rust-web-api-tutorial
```

## Cargo.toml の設定

`Cargo.toml` を編集して必要な依存を追加します：

```toml:Cargo.toml
[package]
name = "rust-web-api-tutorial"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.35", features = ["full"] }
axum = "0.7"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tower = "0.4"
tower-http = { version = "0.5", features = ["trace", "cors"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

:::message[本番ではバイナリサイズに注意]{warning}
`tokio` の `"full"` フィーチャは開発時は便利ですが、本番環境では必要な機能のみ指定することでバイナリサイズを削減できます。
:::

## 最初のコード

`src/main.rs` を編集します：

```rust:src/main.rs
use axum::{
    routing::get,
    Router,
};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(hello));
    
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    
    println!("サーバーが起動しました: http://127.0.0.1:3000");
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn hello() -> &'static str {
    "Hello, Rust Web API!"
}
```

## ビルドと実行

```bash
cargo build
cargo run
```

:::details[開発用のホットリロード]
開発効率を上げるため、`cargo-watch` をインストールすると便利です：

```bash
cargo install cargo-watch
cargo watch -x run
```

ファイル変更時に自動的に再ビルド・再実行されます。
:::

別のターミナルで確認：

```bash
curl http://127.0.0.1:3000/
# Output: Hello, Rust Web API!
```

## IDEの設定

VS Code + Rust Analyzer がお勧めです：

1. VS Code をインストール
2. Rust Analyzer 拡張をインストール
3. `settings.json` に以下を追加（オプション）：

```json
{
  "[rust]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  }
}
```

これで環境構築が完了しました。[第3章「最初のAPI」](./03-first-api)では、実際に API エンドポイントを実装します。

https://doc.rust-lang.org/cargo/
