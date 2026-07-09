---
title: Option 型
description: "値が存在するかしないかを表現する列挙型。Some(T)またはNone。"
created_at: 2024-01-21
updated_at: 2024-06-10
tags: ["Rust基礎", "列挙型", "エラーハンドリング"]
public: true
---

# Option 型

`Option<T>` は値が存在する (`Some(T)`) かしない (`None`) かを表現する標準ライブラリの列挙型です。nullの概念をより安全に実装しています。

## 定義

```rust
enum Option<T> {
    Some(T),
    None,
}
```

## 使用例

```rust
fn find_user(id: u32) -> Option<String> {
    match id {
        1 => Some("Alice".to_string()),
        2 => Some("Bob".to_string()),
        _ => None,
    }
}

fn main() {
    match find_user(1) {
        Some(name) => println!("Found: {}", name),
        None => println!("User not found"),
    }
}
```

:::message
Optionを使うことで、nullポインタ参照などの危険なバグを防げます。コンパイル時にすべてのケースを処理する必要があるからです。
:::

## 便利なメソッド

```rust
let x: Option<i32> = Some(5);
let y = x.map(|n| n * 2);  // Some(10)
let z = x.unwrap_or(0);    // 5
```

関連する型として[[result]]もあります。
