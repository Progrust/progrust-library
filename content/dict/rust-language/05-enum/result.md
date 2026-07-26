---
title: Result型
description: 成功と失敗を表す標準ライブラリの列挙型。成功値を持つOkと失敗理由を持つErrの2バリアントで、失敗の理由までエラー値として表現できる型。
created_at: 2026-07-26
updated_at: 2026-07-27
tags: ["型システム", "複合型", "標準ライブラリ"]
public: true
---

`Result<T, E>`は、処理が成功したか失敗したかを表す[[standard-library]]の[[enum]]です[^1]。成功時の値を包む`Ok(T)`と、失敗時のエラー値を包む`Err(E)`という2つのバリアントを持ちます。同じく2バリアントの[[option]]が値の「有無」だけを表すのに対し、`Result`は失敗した「理由」までエラー値として表現できる点が異なります。

```rust playground
fn split_bill(total: i32, people: i32) -> Result<i32, String> {
    if people == 0 {
        Err("人数が0人です".to_string())
    } else {
        Ok(total / people)
    }
}

fn main() {
    for people in [4, 0] {
        match split_bill(3000, people) {
            Ok(amount) => println!("1人あたり{amount}円"),
            Err(reason) => println!("エラー: {reason}"),
        }
    }
}
```

## `?`演算子によるエラー伝播

`Result`を返す[[function]]の中では、`?`演算子を使うことで`Err`の場合にエラー値を`From`で変換したうえで即座に呼び出し元へ返せます<!-- TODO: [[question-mark-operator]] 作成後にリンク -->。`match`式を毎回書かずに済むため<!-- TODO: [[match-expression]] 作成後にリンク -->、失敗しうる処理を連続して呼び出すコードを簡潔に書けます。

```rust playground
fn split_bill(total: i32, people: i32) -> Result<i32, String> {
    if people == 0 {
        return Err("人数が0人です".to_string());
    }
    Ok(total / people)
}

fn print_share(total: i32, people: i32) -> Result<(), String> {
    let amount = split_bill(total, people)?; // Errならここで即座にreturnする
    println!("1人あたり{amount}円");
    Ok(())
}

fn main() {
    if let Err(reason) = print_share(3000, 0) {
        println!("エラー: {reason}");
    }
}
```

## `#[must_use]`による握りつぶし防止

:::message{warning}
`Result`は`#[must_use]`という属性付きで定義されており[^1]、戻り値を受け取らずに捨てるとコンパイラが警告を出します。ファイル書き込みの失敗など、見過ごすと問題になるエラーを握りつぶしにくくするための仕組みです。
:::

## 補足

:::details[用途別のResultエイリアス]
`std::io`関連の関数はほとんどが`io::Error`をエラー型として返すため、標準ライブラリは`pub type Result<T> = result::Result<T, Error>`という型エイリアスを`std::io::Result<T>`として提供しています[^2]。エラー型を毎回書かずに済み、プレリュードの`std::result::Result`と名前が重複しても`io::Result`と書けば区別できます。
:::

[^1]: [std::result::Result](https://doc.rust-lang.org/std/result/enum.Result.html) — `#[must_use = "this \`Result\` may be an \`Err\` variant, which should be handled"]`付きで`pub enum Result<T, E> { Ok(T), Err(E) }`と定義されています。
[^2]: [std::io::Result](https://doc.rust-lang.org/std/io/type.Result.html) — `pub type Result<T> = result::Result<T, Error>`と定義されています。
