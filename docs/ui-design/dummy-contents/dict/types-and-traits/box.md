---
title: Box
description: ヒープ領域に値を確保してそのポインタを保有するスマートポインタ。
created_at: 2024-02-03
updated_at: 2024-06-10
tags: ["Rust中級", "スマートポインタ", "メモリ"]
public: true
---

# Box<T>

`Box<T>` は、値をヒープに確保し、その参照をスタックに保有するスマートポインタです。スタックに収まらない大きな値や、型の大きさが実行時に決まる場合に使用します。

## 基本的な使用方法

```rust
fn main() {
    let x = Box::new(5);
    println!("{}", x);  // 5
}
```

`Box` は自動的にメモリを解放するため、手動でのメモリ管理は不要です。

## 再帰的なデータ型

```rust
#[derive(Debug)]
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
    println!("{:?}", list);
}
```

:::message
再帰的な（recursive）データ型を表現するには、`Box` のようなポインタ型が必須です。そうでないと、メモリサイズが無限大になってしまいます。
:::

## トレイトオブジェクト

```rust
let shapes: Vec<Box<dyn Draw>> = vec![
    Box::new(circle),
    Box::new(rectangle),
];
```

`Box<dyn Trait>` はトレイトオブジェクトとして動的ディスパッチを実現します。

関連する型：[[rc]]（複数の所有権）、[[refcell]]（内部可変性）
