---
title: Arc<T> (Atomic Reference Counting)
description: マルチスレッド環境での参照カウント。Rcのスレッドセーフ版。
created_at: 2024-01-23
updated_at: 2024-06-10
tags: ["Rust上級", "スマートポインタ", "スレッドセーフ"]
public: true
---

# Arc<T>

`Arc<T>` (Atomic Reference Counted) は、[[rc]]のマルチスレッド対応版です。複数のスレッドが同じ値を共有する場合に使用します。

## スレッド間の値共有

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let counter = Arc::new(0);
    let mut handles = vec![];
    
    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let h = thread::spawn(move || {
            // 複数のスレッドが同じ値を参照
        });
        handles.push(h);
    }
    
    for h in handles {
        h.join().unwrap();
    }
}
```

:::message
`Arc` は原子操作（atomic operation）により、参照カウントをスレッドセーフに管理します。ただし、内部の値自体を変更するには相互排他ロック（Mutex）との組み合わせが必要です。
:::

## スレッドセーフなロック管理

```rust
use std::sync::{Arc, Mutex};

let data = Arc::new(Mutex::new(vec![]));
let data_clone = Arc::clone(&data);

thread::spawn(move || {
    let mut v = data_clone.lock().unwrap();
    v.push(1);
});
```

[[rc]] での参照カウント手法はスレッド環境では使えないため、必ず `Arc` を使用してください。
