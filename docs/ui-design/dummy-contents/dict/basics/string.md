---
title: 文字列型
description: "String と &str の違い。UTF-8エンコーディング。"
created_at: 2024-01-24
updated_at: 2024-06-10
tags: ["Rust基礎", "文字列", "型"]
public: true
---

# 文字列型

Rust には2つの主要な文字列型があります：`String` と `&str`。使い分けが重要です。

## String と &str の違い

```rust
fn main() {
    // &str: 文字列スライス（不変、固定長またはスタック上の参照）
    let s1: &str = "hello";
    let s2: &str = &String::from("world");
    
    // String: ヒープに確保される可変な文字列
    let mut s3 = String::from("hello");
    s3.push_str(" world");
    println!("{}", s3);
}
```

:::message
`&str` は所有権を持たない参照なため、関数の引数では `&str` を使うのが慣例です。`String` は所有権を持つため、変更が必要な場合に使用します。
:::

## よく使うメソッド

```rust
let s = String::from("hello world");

// 長さ、空判定
println!("{}", s.len());     // バイト数
println!("{}", s.is_empty());

// スライス
println!("{}", &s[0..5]);    // "hello"

// 検索、置換
if let Some(pos) = s.find("world") {
    println!("{}", pos);
}

let replaced = s.replace("world", "rust");
```

:::details[UTF-8 との関わり]
Rust の文字列はすべて UTF-8 でエンコードされています。バイト数と文字数が異なる場合があるため注意が必要です。

```rust
let s = "こんにちは";
println!("{}", s.len());      // 15 (バイト数)
println!("{}", s.chars().count());  // 5 (文字数)
```
:::
