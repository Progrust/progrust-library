---
title: イテレータ
description: コレクションの要素を順序よく処理する仕組み。遅延評価で効率的。
created_at: 2024-02-08
updated_at: 2024-06-10
tags: ["Rust中級", "コレクション", "関数型プログラミング"]
public: true
---

# イテレータ

イテレータは、コレクションの要素に順序よくアクセスする抽象化です。Rust のイテレータは遅延評価（lazy evaluation）を特徴とし、メモリ効率が優れています。

## 基本的な使用方法

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5];
    
    for val in &v {
        println!("{}", val);
    }
    
    // イテレータメソッド
    v.iter().map(|x| x * 2).filter(|x| x > &5).for_each(|x| println!("{}", x));
}
```

:::message[イテレータは遅延評価]{tip}
`iter()` は遅延評価のため、`collect()` や `for_each()` で消費されるまで処理は開始されません。これにより、不要な中間コレクションが生成されません。
:::

## イテレータメソッド

```rust
let numbers = vec![1, 2, 3, 4, 5];

// map: 各要素を変換
let doubled: Vec<_> = numbers.iter().map(|x| x * 2).collect();

// filter: 条件でフィルタ
let evens: Vec<_> = numbers.iter().filter(|x| x % 2 == 0).collect();

// fold: 累積計算
let sum = numbers.iter().fold(0, |acc, x| acc + x);
```

:::details[カスタムイテレータ]
[[trait]] を実装することでカスタムイテレータを作成できます。

```rust
struct Counter {
    count: u32,
}

impl Iterator for Counter {
    type Item = u32;
    fn next(&mut self) -> Option<Self::Item> {
        // ...
    }
}
```
:::
