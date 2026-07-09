---
title: マクロ
description: コンパイル時にコードを生成する仕組み。手続きマクロと宣言的マクロ。
created_at: 2024-04-03
updated_at: 2024-06-10
tags: ["Rust上級", "マクロ", "メタプログラミング"]
public: true
---

# マクロ

マクロは、Rust のメタプログラミング機能です。コンパイル時にコードを生成することで、複雑な処理の記述を簡潔にできます。

## 標準マクロの使用例

```rust
fn main() {
    println!("Hello");  // マクロ呼び出し（! が目印）
    vec![1, 2, 3];      // ベクタ生成マクロ
}
```

:::message
マクロは関数に似ていますが、異なります。マクロはコンパイル時に展開されます。[[derive]]マクロも同じ仕組みです。
:::

## 宣言的マクロ（macro_rules）

```rust
macro_rules! vec_init {
    ($($element:expr),*) => {
        {
            let mut v = Vec::new();
            $(v.push($element);)*
            v
        }
    };
}

fn main() {
    let v = vec_init!(1, 2, 3);
}
```

## パターンマッチ的なマクロ定義

```rust
macro_rules! log {
    ($fmt:expr) => {
        println!($fmt);
    };
    ($fmt:expr, $($args:expr),*) => {
        println!($fmt, $($args),*);
    };
}
```

:::details[手続きマクロ]
より高度なコード生成には手続きマクロ（procedural macros）を使用します。別のクレートで定義され、内部ではTokenStreamを操作します。
:::

[[derive]] マクロは手続きマクロの一種です。
