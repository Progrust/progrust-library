---
title: Mutex<T>
description: 相互排他ロック。複数のスレッドからのアクセスを排他制御。
created_at: 2024-02-07
updated_at: 2024-06-10
tags: ["Rust上級", "スレッド同期", "ロック"]
public: false
---

# Mutex<T>

`Mutex<T>` は、複数のスレッドから同時にアクセスされる値を保護するロック機構です。同時に1つのスレッドのみが値にアクセスでき、他はブロック（待機）します。

## 基本的な使用方法

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);
    
    {
        let mut num = m.lock().unwrap();
        *num = 6;
    }
    
    println!("{:?}", m);
}
```

:::message
`lock()` はロックを取得し、ガード（MutexGuard）を返します。ガードがスコープを抜ける時、自動的にロックが解放されます。
:::

[[arc]] との組み合わせでスレッド間の共有値を保護します：

```rust
use std::sync::{Arc, Mutex};

let data = Arc::new(Mutex::new(vec![]));
```

この辞書は非公開です。[[refcell]] と同様に内部可変性を実現しますが、スレッドセーフです。
