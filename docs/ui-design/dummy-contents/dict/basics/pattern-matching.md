---
title: パターンマッチング（Pattern Matching）
description: 値の構造に基づいて分岐処理する機能。matchやifletで使用。
created_at: 2024-01-20
updated_at: 2024-06-10
tags: ["Rust基礎", "パターンマッチング"]
public: true
---

# パターンマッチング（Pattern Matching）

Rustのパターンマッチングは、値の構造に基づいて異なる処理を実行する仕組みです。[[option]]や[[result]]と組み合わせることで、安全なエラーハンドリングが実現できます。

## match式

```rust
fn main() {
    let number = 42;
    match number {
        1 | 2 | 3 => println!("小さい数字"),
        42 => println!("答えは42！"),
        _ => println!("その他"),
    }
}
```

## Enum のパターンマッチング

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
}

fn process(msg: Message) {
    match msg {
        Message::Quit => println!("終了"),
        Message::Move { x, y } => println!("({}, {}) に移動", x, y),
        Message::Write(text) => println!("テキスト: {}", text),
    }
}
```

:::details[ifletとのmatch]
複数のパターンではなく1つだけチェックする場合、`if let` が便利です：

```rust
if let Message::Write(text) = msg {
    println!("{}", text);
}
```
:::

詳細は[[option]]を参照してください。
