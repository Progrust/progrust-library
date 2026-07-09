---
title: Rust エラーハンドリングのパターン集
description: "Result や Option を使った実践的なエラー処理。複数のエラーケースへの対応。"
created_at: 2024-05-03
updated_at: 2024-06-10
tags: ["Rust中級", "エラーハンドリング", "Result"]
public: true
image:
  url: https://picsum.photos/1200/630?random=4
  alt: エラーハンドリングの流れ
---

# Rust エラーハンドリングのパターン集

Rust のエラー処理は明示的で安全です。本記事では、実践的なパターンを紹介します。

## パターン 1: ? 演算子による早期リターン

```rust
fn read_and_parse(path: &str) -> Result<i32, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(path)?;
    let number: i32 = content.trim().parse()?;
    Ok(number)
}
```

:::message[? 演算子で早期リターン]{tip}
`?` 演算子は `Err` の場合に自動的に関数を抜けます。ネストが減り、読みやすくなります。
:::

## パターン 2: map による変換

```rust
fn get_user_name(id: u32) -> Result<String, String> {
    find_user(id)
        .map(|user| user.name)
        .map_err(|_| "User not found".to_string())
}
```

:::details[map と map_err]
- `map`: `Ok` の値を変換
- `map_err`: `Err` の値を変換（通常はエラー型の変換に使う）
- `and_then`: 戻り値が `Result` な関数と組み合わせる
:::

## パターン 3: unwrap_or_else

```rust
fn get_config() -> Config {
    load_config()
        .unwrap_or_else(|_| Config::default())
}
```

:::message{danger}
`unwrap()` はエラー時に panic するため、本番環境では避けてください。代わりに `unwrap_or_else()` や `ok()` を使用します。
:::

## パターン 4: カスタムエラー型

```rust
use std::fmt;

#[derive(Debug)]
enum ParseError {
    InvalidFormat,
    OutOfRange,
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ParseError::InvalidFormat => write!(f, "Invalid format"),
            ParseError::OutOfRange => write!(f, "Out of range"),
        }
    }
}

impl std::error::Error for ParseError {}

fn parse_age(input: &str) -> Result<u32, ParseError> {
    let age: u32 = input.parse()
        .map_err(|_| ParseError::InvalidFormat)?;
    
    if age > 150 {
        return Err(ParseError::OutOfRange);
    }
    
    Ok(age)
}
```

## パターン 5: from_iter での集約

複数の Result を扱う場合：

```rust
fn process_items(items: Vec<String>) -> Result<Vec<i32>, Box<dyn std::error::Error>> {
    items.iter()
        .map(|s| s.parse::<i32>())
        .collect()  // Result<Vec<i32>, ParseIntError>
}
```

:::details[複数のエラーを収集する]
```rust
let results: Vec<_> = items.iter()
    .map(process)
    .collect();

let (ok, err): (Vec<_>, Vec<_>) = results.into_iter()
    .partition(Result::is_ok);
```
:::

## パターン 6: anyhow クレートでの簡潔化

```rust
use anyhow::{Result, Context};

fn complex_operation() -> Result<String> {
    let file_content = std::fs::read_to_string("data.txt")
        .context("Failed to read file")?;
    
    let number: i32 = file_content.trim().parse()
        .context("Failed to parse number")?;
    
    Ok(format!("Got: {}", number))
}
```

エラーハンドリングはRustプログラム開発の重要な要素です。適切なパターンを選択することで、堅牢で保守性の高いコードが実現できます。
