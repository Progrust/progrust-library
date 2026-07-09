---
title: トレイト（Trait）
description: 共通のメソッドを定義するインターフェース。Rustのポリモーフィズムの基本。
created_at: 2024-02-01
updated_at: 2024-06-10
tags: ["Rust中級", "トレイト", "ポリモーフィズム"]
public: true
---

# トレイト（Trait）

トレイトは、Rustにおけるインターフェースのような概念です。複数の型で共有される機能を定義し、異なる型に同じ振る舞いを実装させることができます。

## トレイトの定義と実装

```rust
trait Drawable {
    fn draw(&self);
}

struct Circle {
    radius: f64,
}

impl Drawable for Circle {
    fn draw(&self) {
        println!("Drawing circle with radius {}", self.radius);
    }
}
```

:::message
トレイトは一種の契約です。「このトレイトを実装する型は、これらのメソッドを提供しなければならない」という約束です。
:::

## トレイト境界

```rust
fn print_drawable<T: Drawable>(item: T) {
    item.draw();
}

fn print_multiple<T>(items: Vec<T>) where T: Drawable {
    for item in items {
        item.draw();
    }
}
```

:::details[トレイトオブジェクト]
動的ディスパッチを使う場合、トレイトオブジェクト `dyn Trait` を使用します：

```rust
fn print_any(item: &dyn Drawable) {
    item.draw();
}
```

この方法は柔軟ですが、パフォーマンスオーバーヘッドがあります。
:::

## デフォルト実装

```rust
trait Animal {
    fn name(&self) -> &str;
    
    fn speak(&self) {
        println!("{} makes a sound", self.name());
    }
}
```

詳細は[[generics]]を参照してください。
