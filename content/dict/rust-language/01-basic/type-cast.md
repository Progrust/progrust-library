---
title: キャスト（Type Cast）
description: as演算子・From/Into・TryFrom/TryIntoで行う明示的な型変換と、それぞれの使い分け。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["基本文法", "型システム"]
public: true
---

Rustは異なる型の間で暗黙の型変換を行わないため、型を変換するには`as`演算子で明示的に**キャスト**します。[[integer-type]]と[[floating-point-type]]を混ぜて[[numeric-operations]]を行う前に型を揃えるのが代表的な用途で、そのほかは[[boolean-type]]や[[char-type]]から整数型への変換など、決まった組み合わせだけが許可されています。ただし`as`は収まらない値が**黙って変わる**変換のため多用は好まれず、`From`/`Into`や`TryFrom`/`TryInto`で書ける変換はそちらが推奨されます（後述）。

```rust playground
fn main() {
    let total: i32 = 253; // 3科目の合計点
    let subjects: i32 = 3;
    let average = total as f64 / subjects as f64; // f64に揃えてから除算
    println!("平均点: {:.1}", average);
}
```

## 主なキャストの挙動

`as`によるキャストは**失敗せずパニックも起きません**。その代わり、値が変換先の型に収まらない場合は次の規則で**黙って**値が変化します。

| 変換                        | 挙動                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------ |
| 小さい整数型 → 大きい整数型 | 値はそのまま（`42u8 as i32` は `42`）                                                |
| 大きい整数型 → 小さい整数型 | 上位ビットを切り捨て（`1234u16 as u8` は `210`）                                     |
| 浮動小数点型 → 整数型       | 小数部を0方向へ切り捨て（範囲外は飽和、`NaN`は`0`。Rust 1.45以降）                   |
| 整数型 → 浮動小数点型       | 表現可能な最も近い値に丸め                                                           |
| `bool` → 整数型             | `false`は`0`、`true`は`1`                                                            |
| `char` → 整数型             | コードポイントの値（`'あ' as u32` は `12354`）                                       |
| `u8` → `char`               | 対応するコードポイントの文字（`65u8 as char` は `'A'`）                              |

## `From`/`Into`・`TryFrom`/`TryInto`による変換

`as`とは別に、標準ライブラリには変換用のトレイトが用意されています。`From`/`Into`は**失敗しない（損失のない）変換**にだけ実装されており、変換しても値が変わらないことを型で保証できます。`TryFrom`/`TryInto`は**失敗しうる変換**用で、結果を`Result`で返すため、収まらない値をエラーとして検出できます。

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

3つの手段は次のように使い分けます。

| 手段                  | 失敗の扱い                             | 主な用途                                                       |
| --------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `as`                  | 失敗しない（収まらない値は黙って変化） | 浮動小数点型→整数型など`as`にしかない変換、意図的な切り捨て    |
| `From`/`Into`         | 失敗しない（損失のない組み合わせのみ） | 拡大変換（`u8`→`i64`、`i32`→`f64`など）                        |
| `TryFrom`/`TryInto`   | `Result`で失敗を返す                   | 縮小変換（`i64`→`u8`など）で収まらない値を検出したいとき       |

:::message{tip}
値が黙って変わりうることから、Rustコミュニティでは`as`の多用は好まれない傾向があります。Clippyにも`as`の使用自体を検出する`as_conversions`や、`From`で書ける`as`を指摘する`cast_lossless`などのlintがあります[^1]。`From`/`TryFrom`で書ける変換はそちらを優先し、`as`は代替のない変換や、挙動を理解した上での意図的な切り捨てに限定するのが無難です。
:::

なお、浮動小数点型→整数型には`TryFrom`が実装されていないため（Rust 1.97時点）、この変換には`as`（飽和キャスト）を使うのが基本です。

## 補足

:::details[整数からboolやcharへの逆変換はできない]
`bool`や`char`から整数型へはキャストできますが、逆方向は`u8 as char`を除いてコンパイルエラーになります。

<!-- rustc: expect E0054 -->
```rust playground
fn main() {
    let flag = 1i32 as bool; // エラー: E0054（整数からboolへはキャスト不可）
    println!("{}", flag);
}
```

数値から`bool`へは`n != 0`のような比較で、`u32`から`char`へは`char::from_u32`（不正なコードポイントを`None`で返す）で変換します。
:::

:::details[そのほかにキャストできるもの]
- フィールドを持たないenumから整数型への変換（バリアントの判別値が得られます。`Drop`を実装するenumは不可）
- 生ポインタ・`usize`・関数ポインタの間の相互変換（キャスト自体はsafeですが、得たポインタの参照外しにunsafeが必要な低レイヤ操作向け）

`as`で許可される組み合わせはThe Rust Referenceの一覧[^2]で決まっており、一覧にない変換（例: 文字列と数値の相互変換）はコンパイルエラーになります。文字列との変換には`parse`や`to_string`を使います。
:::

[^1]: [Clippy Lints — as_conversions](https://rust-lang.github.io/rust-clippy/master/index.html#as_conversions)（restrictionグループ）、[cast_lossless](https://rust-lang.github.io/rust-clippy/master/index.html#cast_lossless)（pedanticグループ）

[^2]: [The Rust Reference — Type cast expressions](https://doc.rust-lang.org/reference/expressions/operator-expr.html#type-cast-expressions)
