---
title: "Rc<T> (Reference Counting)"
description: 複数の所有者を持つスマートポインタ。参照カウントでメモリ管理。
created_at: 2024-02-04
updated_at: 2024-06-10
tags: ["Rust中級", "スマートポインタ", "メモリ"]
public: true
---

# Rc<T>

`Rc<T>` (Reference Counted) は、複数の所有者が同じ値を共有する場合に使用するスマートポインタです。参照カウントにより、最後の所有者がスコープを抜ける時に自動的にメモリが解放されます。

## 基本的な例

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(5);
    let b = Rc::clone(&a);  // 参照カウント: 2
    let c = Rc::clone(&a);  // 参照カウント: 3
    
    println!("参照カウント: {}", Rc::strong_count(&a));  // 3
}
```

:::message[なぜスレッドでは Arc を使うのか]{question}
[[box]]と異なり、`Rc` は値の所有権を複数の変数で共有できます。ただし、スレッドセーフではないため、[[thread]]環境では [[arc]] を使用してください。
:::

## グラフ構造の表現

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    children: Vec<Rc<RefCell<Node>>>,
}
```

:::details[なぜRcなのか？]
グラフでは複数の親が同じ子ノードを参照することがあります。`Rc` はそのような共有所有権を実現します。

内部可変性が必要な場合は [[refcell]] と組み合わせます。
:::

スレッドセーフなバージョンは [[arc]] を参照してください。
