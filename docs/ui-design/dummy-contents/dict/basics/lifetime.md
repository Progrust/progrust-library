---
title: ライフタイム（Lifetime）
description: 参照がどの程度の期間有効なのかを明示するAnnotation。
created_at: 2024-01-17
updated_at: 2024-06-10
tags: ["Rust基礎", "ライフタイム", "参照"]
public: true
---

# ライフタイム（Lifetime）

[[borrowing]]された値の有効期限をコンパイラに明示するためのアノテーションです。関数やstructで参照を使う場合、ライフタイムを指定することでコンパイラが参照の安全性を検証できます。

## 基本的な使用方法

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

:::details[ライフタイムアノテーションの詳細]
`'a` は汎用ライフタイムパラメータです。この記法は「戻り値の参照は、入力の参照と同じ生存期間を持つ」という情報をコンパイラに提供します。

複数のライフタイムパラメータを使うこともできます：

```rust
fn foo<'a, 'b>(x: &'a str, y: &'b str) -> &'a str {
    x
}
```
:::

## Struct のライフタイム

```rust
struct Message<'a> {
    text: &'a str,
}

fn main() {
    let s = String::from("hello");
    let m = Message { text: &s };
}
```

:::message{info}
ライフタイムは実行時には存在しません。これはコンパイル時に[[borrowing]]の安全性をチェックするための情報です。
:::
