---
title: ジェネリクス（Generics）
description: 型パラメータを使って複数の型に対応する汎用的なコードを書く仕組み。
created_at: 2024-02-02
updated_at: 2024-06-10
tags: ["Rust中級", "ジェネリクス", "型"]
public: true
---

# ジェネリクス（Generics）

ジェネリクスは、型パラメータを使用して汎用的なコードを書く機能です。同じロジックを複数の型に対して利用できます。

## ジェネリック関数

```rust
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list.iter() {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100];
    println!("{}", largest(&numbers));
    
    let chars = vec!['a', 'z', 'm'];
    println!("{}", largest(&chars));
}
```

:::message
[[trait]]と組み合わせることで、型パラメータに制約を付けることができます。上の例では `T: PartialOrd` により「比較可能な型」に限定しています。
:::

## ジェネリック構造体

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}
```

## パフォーマンス

Rustのジェネリクスは**単相化（monomorphization）**により、コンパイル時に具体的な型ごとのコードが生成されます。そのため、実行時のオーバーヘッドはありません。

[[box]]や[[rc]]で動的ディスパッチが必要な場合と異なる特性です。
