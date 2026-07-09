---
title: RefCell<T>
description: 実行時借用チェックで内部可変性を実現するスマートポインタ。
created_at: 2024-02-05
updated_at: 2024-06-10
tags: ["Rust中級", "スマートポインタ", "内部可変性"]
public: true
---

# RefCell<T>

`RefCell<T>` は、不変参照を通して値を変更できる**内部可変性（interior mutability）**を実現するスマートポインタです。コンパイル時の借用チェックを回避し、実行時チェックに遅延させます。

## 基本的な使用方法

```rust
use std::cell::RefCell;

fn main() {
    let x = RefCell::new(5);
    *x.borrow_mut() = 6;
    println!("{}", x.borrow());  // 6
}
```

:::message[実行時に panic しうる]{danger}
`RefCell` は実行時に借用ルールをチェックします。パニック（panic）が発生する可能性があるため、慎重に使用してください。複数の可変借用を試みるとランタイムエラーになります。
:::

## [[rc]] との組み合わせ

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    next: Option<Rc<RefCell<Node>>>,
}

fn main() {
    let node = Rc::new(RefCell::new(Node {
        value: 1,
        next: None,
    }));
    
    node.borrow_mut().value = 2;  // 内部可変性で変更
}
```

:::details[RefCellが必要な場合]
- グラフやツリーの子ノードへの変更
- ストラテジーパターンの実装
- リスナーなどの集約管理

通常は `&mut` での借用を使うべきです。
:::
