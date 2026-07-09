---
title: async/await
description: 非同期プログラミングの記法。複数のタスクを効率的に処理。
created_at: 2024-03-01
updated_at: 2024-06-10
tags: ["Rust上級", "非同期", "並行処理"]
public: true
---

# async/await

Rustの `async`/`await` は、非同期プログラミングを直感的に書くための構文です。複数のI/O操作を効率的に多重化できます。

## 基本的な例

```rust
async fn fetch_data() -> String {
    "data".to_string()
}

async fn main() {
    let data = fetch_data().await;
    println!("{}", data);
}
```

:::message{info}
`async fn` は `Future` を返します。その `Future` が実行されるには、`.await` で待つか、ランタイムで実行する必要があります。
:::

## tokio ランタイム

```rust
#[tokio::main]
async fn main() {
    let handles = vec![
        tokio::spawn(async { println!("タスク1"); }),
        tokio::spawn(async { println!("タスク2"); }),
    ];
    
    for h in handles {
        h.await.unwrap();
    }
}
```

:::details[非同期関数の組み合わせ]
複数の非同期操作を組み合わせるパターン：

```rust
async fn task1() { }
async fn task2() { }

async fn main() {
    // 順序実行
    task1().await;
    task2().await;
    
    // 並行実行
    tokio::join!(task1(), task2());
}
```
:::

詳細は[[thread]]や[[channel]]も参照してください。
