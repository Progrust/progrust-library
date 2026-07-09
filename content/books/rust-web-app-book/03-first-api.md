---
title: 最初の API を作る
description: ユーザー管理APIの実装。CRUD操作とHTTPレスポンス。
created_at: 2024-06-03
updated_at: 2024-06-10
tags: ["API実装", "CRUD", "Axum"]
public: true
image:
  url: https://picsum.photos/1200/630?random=9
  alt: Rust APIの実装例
---

# 第3章 最初の API を作る

このセクションでは、ユーザー管理 API を実装します。[[ownership]]システムと[[async-await]]を実践的に活用します。

## データ型の定義

```rust:src/main.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}
```

:::message[derive で自動シリアライズ]{success}
`#[derive(Serialize, Deserialize)]` により、自動的に JSON シリアライズが可能になります。[[derive]]マクロの便利さを感じられます。
:::

## API ハンドラーの実装

```rust:src/main.rs
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Json, Router,
};
use std::sync::Arc;
use tokio::sync::RwLock;

type UserStore = Arc<RwLock<Vec<User>>>;

// ユーザー一覧取得
async fn list_users(State(store): State<UserStore>) -> Json<Vec<User>> {
    let users = store.read().await;
    Json(users.clone())
}

// ユーザー詳細取得
async fn get_user(
    State(store): State<UserStore>,
    Path(id): Path<u32>,
) -> Result<Json<User>, StatusCode> {
    let users = store.read().await;
    users
        .iter()
        .find(|u| u.id == id)
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

// ユーザー登録
async fn create_user(
    State(store): State<UserStore>,
    Json(user): Json<User>,
) -> (StatusCode, Json<User>) {
    let mut users = store.write().await;
    users.push(user.clone());
    (StatusCode::CREATED, Json(user))
}
```

:::message[本番ではデータベースを使う]{danger}
`RwLock` はスレッドセーフな読み書きロックです。複数のリーダーを許可しながら、ライターを排他制御します。本番ではデータベースを使用してください。
:::

## API ルーティング

```rust:src/main.rs
#[tokio::main]
async fn main() {
    let store = Arc::new(RwLock::new(vec![]));
    
    let app = Router::new()
        .route("/users", get(list_users).post(create_user))
        .route("/users/:id", get(get_user).put(update_user).delete(delete_user))
        .with_state(store);
    
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    
    println!("API サーバー起動: http://127.0.0.1:3000");
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await
        .unwrap();
}
```

## テスト実行

ユーザー登録：

```bash
curl -X POST http://127.0.0.1:3000/users \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "name": "Alice", "email": "alice@example.com"}'
```

:::details[複数ユーザーの登録パターン]
```bash
# ユーザー2登録
curl -X POST http://127.0.0.1:3000/users \
  -H "Content-Type: application/json" \
  -d '{"id": 2, "name": "Bob", "email": "bob@example.com"}'

# ユーザー3登録
curl -X POST http://127.0.0.1:3000/users \
  -H "Content-Type: application/json" \
  -d '{"id": 3, "name": "Carol", "email": "carol@example.com"}'
```
:::

ユーザー一覧取得：

```bash
curl http://127.0.0.1:3000/users
```

ユーザー詳細取得：

```bash
curl http://127.0.0.1:3000/users/1
```

## 完全な実装例

```rust:src/main.rs
use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct User {
    id: u32,
    name: String,
    email: String,
}

type UserStore = Arc<RwLock<Vec<User>>>;

async fn list_users(State(store): State<UserStore>) -> Json<Vec<User>> {
    let users = store.read().await;
    Json(users.clone())
}

async fn get_user(
    State(store): State<UserStore>,
    Path(id): Path<u32>,
) -> Result<Json<User>, StatusCode> {
    let users = store.read().await;
    users
        .iter()
        .find(|u| u.id == id)
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

async fn create_user(
    State(store): State<UserStore>,
    Json(user): Json<User>,
) -> (StatusCode, Json<User>) {
    let mut users = store.write().await;
    users.push(user.clone());
    (StatusCode::CREATED, Json(user))
}

async fn update_user(
    State(store): State<UserStore>,
    Path(id): Path<u32>,
    Json(new_user): Json<User>,
) -> Result<Json<User>, StatusCode> {
    let mut users = store.write().await;
    if let Some(user) = users.iter_mut().find(|u| u.id == id) {
        *user = new_user.clone();
        Ok(Json(new_user))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

async fn delete_user(
    State(store): State<UserStore>,
    Path(id): Path<u32>,
) -> StatusCode {
    let mut users = store.write().await;
    if let Some(pos) = users.iter().position(|u| u.id == id) {
        users.remove(pos);
        StatusCode::NO_CONTENT
    } else {
        StatusCode::NOT_FOUND
    }
}

#[tokio::main]
async fn main() {
    let store = Arc::new(RwLock::new(vec![]));
    
    let app = Router::new()
        .route("/users", get(list_users).post(create_user))
        .route(
            "/users/:id",
            get(get_user).put(update_user).delete(delete_user),
        )
        .with_state(store);
    
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    
    println!("API サーバー起動: http://127.0.0.1:3000");
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

## 実装時のポイント

1. **[[async-await]]の活用**：すべてのハンドラーが `async fn` になっていることに注目
2. **型安全性**：`Json<User>` により、自動的に型チェック・シリアライズが行われます
3. **エラーハンドリング**：`Result<T, StatusCode>` で HTTP エラーステータスを返せます
4. **[[ownership]]**：`Arc<RwLock<...>>` で安全にデータを共有

このシンプルな実装は、Rust の多くの強力な機能を示しています。

https://docs.rs/axum/latest/axum/
