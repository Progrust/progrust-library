---
title: エラーハンドリング
description: Rustのエラー処理戦略。Result と panic の使い分け。
created_at: 2024-02-09
updated_at: 2024-06-10
tags: ["Rust中級", "エラー", "Result"]
public: false
---

# エラーハンドリング

Rust ではエラーを明示的に扱う設計になっています。[[result]]による回復可能なエラーと panic による回復不可能なエラーの使い分けが重要です。

## Result によるエラー伝播

```rust
fn read_config() -> Result<String, std::io::Error> {
    std::fs::read_to_string("config.txt")
}

fn process() -> Result<(), Box<dyn std::error::Error>> {
    let config = read_config()?;  // エラー時はここで関数を抜ける
    println!("{}", config);
    Ok(())
}
```

:::message[panic は最終手段]{danger}
panic を過度に使用するのは避けてください。回復可能なエラーは [[result]] で扱います。panic は本当に回復不可能な状況（プログラムバグなど）にのみ使用します。
:::

## カスタムエラー型

```rust
use std::fmt;

#[derive(Debug)]
enum MyError {
    IoError(std::io::Error),
    ParseError(std::num::ParseIntError),
}

impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MyError::IoError(e) => write!(f, "IO Error: {}", e),
            MyError::ParseError(e) => write!(f, "Parse Error: {}", e),
        }
    }
}

impl std::error::Error for MyError {}
```

この辞書は非公開です。
