---
title: Result 型
description: 成功（Ok）または失敗（Err）を表現する列挙型。エラーハンドリングの標準方法。
created_at: 2024-01-22
updated_at: 2024-06-10
tags: ["Rust基礎", "列挙型", "エラーハンドリング"]
public: true
---

# Result 型

`Result<T, E>` は操作が成功したか失敗したかを表現する標準ライブラリの列挙型です。エラーハンドリングの標準的な方法として広く使われています。

## 定義

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

## ファイル読み込みの例

```rust
use std::fs;

fn read_config() -> Result<String, std::io::Error> {
    fs::read_to_string("config.txt")
}

fn main() {
    match read_config() {
        Ok(content) => println!("Config: {}", content),
        Err(e) => println!("Error: {}", e),
    }
}
```

:::message
[[option]]と異なり、`Result` はエラー情報も一緒に返すことができます。この設計により、何が失敗したのかを詳細に知ることができます。
:::

## エラーの伝播演算子（?）

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let content = fs::read_to_string("file.txt")?;
    let number: i32 = content.trim().parse()?;
    println!("Number: {}", number);
    Ok(())
}
```

`?` 演算子を使うと、エラー時に自動的に関数を抜けます。この記法により、複数の操作をチェーンしながらエラーハンドリングできます。
