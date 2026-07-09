---
title: Derive マクロ
description: トレイトの実装を自動生成するマクロ。Debug、Clone、Copyなど。
created_at: 2024-02-06
updated_at: 2024-06-10
tags: ["Rust中級", "マクロ", "トレイト"]
public: true
---

# Derive マクロ

`#[derive(...)]` アトリビュートを使うと、標準的な[[trait]]の実装をコンパイラが自動生成します。手動での実装を避けることで、コードの簡潔性が向上します。

## よく使われるDeriveマクロ

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Point { x: 0, y: 0 };
    let p2 = p1;  // Copy により所有権がコピーされる
    println!("{:?}", p1);  // Debug トレイトで表示
    println!("{}", p1 == p2);  // PartialEq トレイト
}
```

:::message{success}
`Copy` は `Clone` を暗黙に実装するため、浅いコピーが自動的に行われます。`Copy` できるのはスタック領域に収まる小さな値のみです。
:::

## 複合的な Derive

```rust
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
enum Status {
    Active,
    Inactive,
    Pending,
}
```

各トレイトの機能：
- `Debug`: デバッグ出力（`{:?}`）
- `Clone`: 深いコピー
- `Copy`: 浅いコピー（自動）
- `PartialEq`/`Eq`: 等価比較
- `PartialOrd`/`Ord`: 順序比較
- `Hash`: ハッシュ計算（`HashMap` などで使用）
- `Default`: デフォルト値の生成

カスタムトレイトの実装は手動で行う必要があります。
