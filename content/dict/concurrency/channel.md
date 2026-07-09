---
title: チャネル
description: スレッド間のデータ通信。Senderでデータ送信、Receiverで受信。
created_at: 2024-03-03
updated_at: 2024-06-10
tags: ["Rust上級", "チャネル", "スレッド通信"]
public: true
---

# チャネル

チャネルは、スレッド間でデータを安全に通信するための仕組みです。`Sender` と `Receiver` のペアで、送受信を実現します。

## 基本的な例

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        tx.send("Hello from thread").unwrap();
    });
    
    let received = rx.recv().unwrap();
    println!("{}", received);
}
```

:::message
`mpsc` は "Multiple Producer, Single Consumer" を意味します。複数のスレッドが同じチャネルに送信でき、1つのスレッドが受信します。
:::

## 複数のデータ送信

```rust
let (tx, rx) = mpsc::channel();

thread::spawn(move || {
    let vals = vec![1, 2, 3];
    for val in vals {
        tx.send(val).unwrap();
    }
});

for received in rx {
    println!("{}", received);
}
```

:::details[チャネルと所有権]
`send()` は所有権を移動させます。受信側は値の所有権を完全に得ます。これにより、データレースが発生しません。
:::

[[thread]] や [[async-await]] と組み合わせて並行処理を実現します。
