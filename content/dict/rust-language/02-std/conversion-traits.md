---
title: 変換トレイト
description: From/Into・TryFrom/TryIntoによる型変換。失敗しない変換とResultで失敗を返す変換を型で表現する仕組み。
created_at: 2026-07-18
updated_at: 2026-07-29
tags: ["基本文法", "型システム"]
public: true
---

[[standard-library]]には、型変換をトレイトとして表現した`From`/`Into`と`TryFrom`/`TryInto`が用意されています。<!-- TODO: [[trait]] 作成後にリンク -->
`From`/`Into`は**失敗せず、損失もない変換**にだけ実装するのが規約で、変換しても値が変わらないことをコードの意図として表現できます。
`TryFrom`/`TryInto`は**失敗しうる変換**用で、結果を[[result]]で返すため、収まらない値をエラーとして検出できます。
収まらない値が黙って変わる[[type-cast]]と違って変換の安全性がコードから読み取れるため、これらのトレイトで書ける変換はこちらが推奨されます。

```rust playground
fn main() {
    let price: u8 = 200; // 商品の値段（円）
    let total = i64::from(price) * 3; // 拡大変換は失敗しないのでFrom
    println!("3個の合計: {}円", total);

    let stock: i64 = 300;
    match u8::try_from(stock) { // 縮小変換は失敗する可能性があるのでtry_from
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

### 使い分けの慣習

どちらを呼んでも結果は同じため使い分けは慣習ですが、コミュニティではおおむね次の形が共有されています。

| 場面                                   | 慣習                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| 変換先を明示して読みやすくしたいとき   | `i64::from(x)`（数値変換や`String::from("...")`など）                             |
| 変換先が文脈から自明なとき             | `x.into()`（型注釈済みの変数への代入、<br>`Ok(x.into())`のような戻り値の位置など）    |
| ジェネリック境界                       | `impl Into<String>`のように`Into`を使う<br>（`From`実装の型に加え、`Into`のみ実装の型も受け取れる）   |

:::message{tip}
`into()`は変換先を推論に任せるため、変換箇所以外のコードの変更で意図しない型への変換に変わってしまう可能性があります。変換先の候補が複数ある数値変換では、`from`で型を固定するほうが安全です。
:::

## 浮動小数点数がからむ変換

[[floating-point-type]]がからむ変換では、**`From`も`TryFrom`も実装されていない組み合わせが多く**、`as`によるキャストしか手段がないケースがあります。変換先で元の値を**必ず正確に表現できる**組み合わせにのみ標準ライブラリが`From`を実装しているためです。

| 変換                                             | 使えるトレイト     | 理由                                                     |
| ------------------------------------------------ | ------------------ | -------------------------------------------------------- |
| `f32` → `f64`                                    | `From`             | 拡大変換なので値がそのまま保たれる                       |
| `f64` → `f32`                                    | なし（`as`のみ）   | 精度が落ちる／範囲外は無限大になる                       |
| `f32`・`f64` → 整数型                            | なし（`as`のみ）   | 小数部が失われる                                         |
| `u8`/`i8`/`u16`/`i16` → `f32`・`f64`             | `From`             | 仮数部（`f32`は24ビット）に必ず収まる                    |
| `u32`/`i32` → `f64`                              | `From`             | 仮数部（`f64`は53ビット）に必ず収まる                    |
| `u32`/`i32` → `f32`・`u64`<br>`i64`以上 → `f64`     | なし（`as`のみ）   | 桁が仮数部を超えると丸めが起きる                         |

`TryFrom`も同様に用意されていないため、`f64::try_from`や`i32::try_from`で書こうとするとトレイト境界を満たさずコンパイルエラーになります。

<!-- rustc: expect E0277 -->
```rust playground
fn main() {
    let ratio: f64 = 0.5;
    let _a = f32::try_from(ratio); // エラー: E0277（f32はTryFrom<f64>未実装）
    let _b = i32::try_from(ratio); // エラー: E0277（i32はTryFrom<f64>未実装）
    let _c = f32::from(1i32); // エラー: E0277（f32はFrom<i32>未実装）
}
```

そのため、これらの変換は[[type-cast]]で書きます。範囲外の値が飽和したり`NaN`が`0`になったりする挙動は`as`の規則どおりなので、丸め方を決めたい場合は`round`・`trunc`・`floor`などを先に呼びます。

```rust playground
fn main() {
    let price: f64 = 128.7; // 税込価格
    println!("四捨五入: {}円", price.round() as i32); // 129円

    let single = price as f32; // f64→f32は精度が落ちるがasなら可能
    println!("f32にすると: {}", single); // 128.7
    println!("f64に戻すと: {}", f64::from(single)); // 128.6999969482422（誤差が見える）
}
```

## 補足

:::details[TryFrom/TryIntoも同じ構図]
`TryFrom`を実装すると`TryInto`が自動的に使えるようになる点、ジェネリック境界には`TryInto`を使う点など、`From`/`Into`とまったく同じ関係です。失敗時のエラー型は関連型`Error`で表現され、[[integer-type]]どうしの縮小変換では`TryFromIntError`が返ります。
:::

:::details[浮動小数点数から整数への変換で失敗を検出したい場合]
`TryFrom`がない（Rust 1.97時点）ため、収まらない値を弾きたいときは自前で判定します。`as`は範囲外を飽和させるだけで、値が壊れたことを知らせてくれません。

```rust playground
fn to_i32(value: f64) -> Option<i32> {
    // 有限かつ範囲内で、小数部を持たない値だけを受け付ける
    if value.is_finite() && value.trunc() == value
        && value >= i32::MIN as f64 && value <= i32::MAX as f64
    {
        Some(value as i32)
    } else {
        None
    }
}

fn main() {
    println!("{:?}", to_i32(1200.0)); // Some(1200)
    println!("{:?}", to_i32(1200.5)); // None（小数部がある）
    println!("{:?}", to_i32(1e10)); // None（asなら2147483647に飽和してしまう）
}
```
:::

[^1]: [std::convert::From — Rust公式ドキュメント](https://doc.rust-lang.org/std/convert/trait.From.html)、[std::convert::TryFrom — Rust公式ドキュメント](https://doc.rust-lang.org/std/convert/trait.TryFrom.html)
