---
title: 借用（Borrowing）
description: 所有権を譲渡しなくても値を参照できる仕組み。
created_at: 2024-01-16
updated_at: 2024-06-10
tags: ["Rust基礎", "借用", "参照"]
public: true
---

# 借用（Borrowing）

借用は、[[ownership]]を譲渡することなく値にアクセスする方法です。Rustでは不変借用と可変借用の2種類があります。

## 不変借用（Immutable Reference）

```rust
fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s);
    println!("'{}' の長さは {}", s, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

:::message
`&` 記号で不変借用を作成します。複数の不変借用は同時に存在できます。
:::

## 可変借用（Mutable Reference）

```rust
fn main() {
    let mut s = String::from("hello");
    change_string(&mut s);
    println!("{}", s);
}

fn change_string(s: &mut String) {
    s.push_str(" world");
}
```

:::message{warning}
可変借用には重要な制限があります。同一スコープで1つの可変借用のみが許可されます。これはデータレースを防ぐためです。
:::

詳細は[[lifetime]]を参照してください。
