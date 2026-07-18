---
title: 変換トレイト（Conversion Traits）
description: From/Into・TryFrom/TryIntoによる型変換。失敗しない変換とResultで失敗を返す変換を型で表現する仕組み。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["基本文法", "型システム"]
public: true
---

標準ライブラリには、型変換をトレイトとして表現した`From`/`Into`と`TryFrom`/`TryInto`が用意されています。<!-- TODO: [[trait]] 作成後にリンク -->
`From`/`Into`は**失敗せず、損失もない変換**にだけ実装するのが規約で、変換しても値が変わらないことをコードの意図として表現できます。`TryFrom`/`TryInto`は**失敗しうる変換**用で、結果を`Result`で返すため、収まらない値をエラーとして検出できます。<!-- TODO: [[result]] 作成後にリンク -->
収まらない値が黙って変わる[[type-cast]]と違って変換の安全性がコードから読み取れるため、これらのトレイトで書ける変換はこちらが推奨されます。

```rust playground
fn main() {
    let price: u8 = 200; // 商品の値段（円）
    let total = i64::from(price) * 3; // 拡大変換は失敗しないのでFrom
    println!("3個の合計: {}円", total);

    let stock: i64 = 300;
    match u8::try_from(stock) {
        Ok(count) => println!("u8で扱えます: {}", count),
        Err(_) => println!("{}はu8（0〜255）に収まりません", stock),
    }
}
```

## FromとIntoの違い

`From<T> for U`は「TからUを作れる」、`Into<U> for T`は「TをUに変換できる」を表し、**同じ変換を反対側から見た**トレイトです。呼び出し方が異なるだけですが、実装のしかたは後述のとおり非対称です。

```rust playground
fn main() {
    let n: u8 = 200;
    let a = i64::from(n); // From: 変換先の型を明示して呼ぶ
    let b: i64 = n.into(); // Into: 変換先は型注釈や文脈から推論される
    assert_eq!(a, b);
}
```

標準ライブラリのブランケット実装により、`From`を実装すると対応する`Into`は自動的に使えるようになります（逆は成り立ちません）。そのため自作型に実装するのは`From`だけでよく、公式ドキュメントも`From`（または`TryFrom`）側の実装を推奨しています[^1]。

## 使い分けの慣習

どちらを呼んでも結果は同じため使い分けは慣習ですが、コミュニティではおおむね次の形が共有されています。

| 場面                                   | 慣習                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| 変換先を明示して読みやすくしたいとき   | `i64::from(x)`（数値変換や`String::from("...")`など）                             |
| 変換先が文脈から自明なとき             | `x.into()`（型注釈済みの変数への代入、`Ok(x.into())`のような戻り値の位置など）    |
| ジェネリック境界                       | `impl Into<String>`のように`Into`を使う（`From`実装の型に加え、`Into`のみ実装の型も受け取れる）   |

:::message{tip}
`into()`は変換先を推論に任せるため、コードの変更で意図しない型への変換に化ける余地があります。変換先の候補が複数ある数値変換では、`from`で型を固定するほうが安全です。
:::

## 補足

:::details[TryFrom/TryIntoも同じ構図]
`TryFrom`を実装すると`TryInto`が自動的に使えるようになる点、ジェネリック境界には`TryInto`を使う点など、`From`/`Into`とまったく同じ関係です。失敗時のエラー型は関連型`Error`で表現され、[[integer-type]]どうしの縮小変換では`TryFromIntError`が返ります。

なお、[[floating-point-type]]から整数型への`TryFrom`は実装されていないため（Rust 1.97時点）、この変換には`as`による飽和キャストを使うのが基本です。
:::

[^1]: [std::convert::From — Rust公式ドキュメント](https://doc.rust-lang.org/std/convert/trait.From.html)、[std::convert::TryFrom — Rust公式ドキュメント](https://doc.rust-lang.org/std/convert/trait.TryFrom.html)
