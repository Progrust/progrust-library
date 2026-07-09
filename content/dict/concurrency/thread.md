---
title: スレッド
description: OSレベルの並行実行。std::threadを使った実装。
created_at: 2024-03-02
updated_at: 2024-06-10
tags: ["Rust上級", "スレッド", "並行処理"]
public: true
---

# スレッド

Rustの `std::thread` は、OSレベルのスレッドを使った並行処理を実現します。[[async-await]] と異なり、実際に複数のプロセッサコアで並列実行されます。

## 基本的な使用方法

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..5 {
            println!("スレッドから: {}", i);
        }
    });
    
    for i in 1..3 {
        println!("メインから: {}", i);
    }
    
    handle.join().unwrap();  // スレッドの終了を待つ
}
```

:::message
`spawn` はクロージャを受け取り、新しいスレッドで実行します。`join()` でスレッドの終了を待つまで、メインスレッドがその先に進まないようにします。
:::

## データの移動

```rust
let v = vec![1, 2, 3];
let handle = thread::spawn(move || {
    println!("{:?}", v);  // move で所有権を移動
});
handle.join().unwrap();
```

`move` クロージャを使うことで、[[ownership]]をスレッドに移動させます。

スレッド間の[[channel]]通信や相互排他ロック（Mutex）でのロック管理も参照してください。
