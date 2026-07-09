---
title: 可変性（Mutability）
description: 値が変更可能かどうかを示すプロパティ。Rustではデフォルトが不変。
created_at: 2024-01-18
updated_at: 2024-06-10
tags: ["Rust基礎", "可変性", "参照"]
public: true
---

# 可変性（Mutability）

Rustでは、変数のデフォルトが**不変（immutable）**です。これは予期しない変更を防ぐ設計になっています。

## 不変変数（デフォルト）

```rust
fn main() {
    let x = 5;
    // x = 6;  // コンパイルエラー
}
```

## 可変変数

```rust
fn main() {
    let mut x = 5;
    x = 6;  // OK
    println!("{}", x);
}
```

:::message{info}
`mut` キーワードで変数を可変にします。これはデータレースなどのバグを減らすための優れた設計です。
:::

## 可変性は参照にも適用される

不変参照 `&T` と可変参照 `&mut T` の区別についての詳細は[[borrowing]]を参照してください。
