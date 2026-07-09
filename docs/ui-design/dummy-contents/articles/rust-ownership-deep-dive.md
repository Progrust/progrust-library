---
title: Rust の所有権を深掘り - メモリ安全性の秘密
description: 所有権システムの詳細な解説。所有権と借用の関係性、スコープでのメモリ管理について。
created_at: 2024-05-01
updated_at: 2024-06-10
tags: ["Rust基礎", "所有権", "メモリ管理"]
public: true
image:
  url: https://picsum.photos/1200/630?random=1
  alt: Rust所有権システムの図解
---

# Rust の所有権を深掘り

Rust の最大の特徴は、コンパイル時にメモリ安全性を保証する**所有権システム**です。本記事では、[[ownership]]と[[borrowing]]の関係性を詳しく探ります。

## 所有権とは何か

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;  // 所有権がs1からs2に移動
    // println!("{}", s1);  // [!code --]
    println!("{}", s2);    // [!code ++]
}
```

:::message
所有権が**移動（move）**することにより、同一のメモリ領域を2つの変数が同時に所有することはできません。これがデータレースを防ぎます。
:::

## [[borrowing]]による参照

所有権を譲渡せずに値を使いたい場合、借用を使用します：

```rust
fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s);  // 参照を渡す
    println!("'{}' の長さは {}", s, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
}
```

:::message[可変借用は同時に1つ]{warning}
可変借用 `&mut` は同一スコープで1つだけ許可されます。これがRustのバグ防止機構です。

```rust
// エラー：同時に2つの可変借用
let mut s = String::from("hello");
let r1 = &mut s;
let r2 = &mut s;  // エラー
```
:::

## [[lifetime]] アノテーション

複数の参照が関わるとき、コンパイラは各参照の有効期間を理解する必要があります：

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

:::details[ライフタイムのビジュアライゼーション]
```
x: |-------- lives until here
y:    |------ lives until here
output:       |---- result must be valid
```

ライフタイムアノテーション `'a` により、「戻り値は両方の入力と同じ期間生存する」ことをコンパイラに伝えます。
:::

## Move Semantics と Copy Semantics

:::figure[図1: スタック上の値はコピー]{width=400}
![値の移動](https://picsum.photos/600/300?random=2)
:::

スタック上に完全に収まる型（`i32`, `bool`, `(i32, f64)` など）は `Copy` セマンティクスで、代入時に自動的にコピーされます。

## 実践的なパターン

```rust
struct User {
    name: String,
    email: String,
}

fn create_user(name: String, email: String) -> User {
    User { name, email }  // 所有権を移動してUserを返す
}

fn main() {
    let user = create_user(
        String::from("Alice"),
        String::from("alice@example.com")
    );
    // userは所有権を持っている
    println!("{}", user.name);
}
```

所有権システムが最初は複雑に見えるかもしれませんが、一度理解すれば Rust のコード設計がいかにシンプルで安全かが見えてきます。

https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html
