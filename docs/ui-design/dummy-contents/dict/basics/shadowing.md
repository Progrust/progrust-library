---
title: シャドウイング（Shadowing）
description: 同じ名前で新しい変数を定義して前の値を隠すテクニック。
created_at: 2024-01-19
updated_at: 2024-06-10
tags: ["Rust基礎", "変数"]
public: true
---

# シャドウイング（Shadowing）

シャドウイングは、前に定義した変数と同じ名前で新しい変数を定義するテクニックです。内側のスコープで定義された変数が、外側の変数を「隠す」ことから、この名前がつきました。

## 基本的な例

```rust
fn main() {
    let x = 5;
    let x = x + 1;  // シャドウイング
    {
        let x = x * 2;  // 内側のスコープでさらにシャドウイング
        println!("{}", x);  // 12
    }
    println!("{}", x);  // 6
}
```

:::message
シャドウイングは変数の[[mutability]]を変更する際に便利です。`let mut` に比べて、意図を明確に示すことができます。
:::

## 型の変換にも使える

```rust
fn main() {
    let spaces = "   ";
    let spaces: usize = spaces.len();
    println!("{}", spaces);  // 3
}
```

これは `let mut` と異なり、変数の型を変更できるため、型変換の意図を明確にできます。
