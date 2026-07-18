---
title: 浮動小数点型（Floating-Point Types）
description: 小数を表す型の総称。IEEE 754に準拠し、既定は`f64`。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["型システム", "基本文法"]
public: false
---

小数を表す型の総称です。`f32` は IEEE 754-2008の「binary32」、`f64` は「binary64」に準拠しており、それぞれ32ビット・64ビットの幅を持ちます。[[integer-type]]と異なり符号なし版はありません。[[variable]]の宣言などで型が一意に定まらない浮動小数点リテラルは、`f64` がデフォルトとして採用されます。

## コード例

```rust playground
fn main() {
    let price: f32 = 19.8; // 単価（省メモリ優先ならf32）
    let total = price as f64 * 3.0; // f64がデフォルト型
    println!("合計: {:.1}円", total);
}
```

## 補足

:::details[浮動小数点の誤差と等値比較]
浮動小数点数は2進数で表現されるため、`0.1 + 0.2` のような計算は誤差を含み `0.3` と一致しません。等しさの判定には、差の絶対値が許容誤差（イプシロン）未満かどうかを見る方法が使われます。許容誤差は値の大きさに応じて調整する必要があり、`f64::EPSILON`（`1.0` に対する最小刻み幅）をそのまま流用できるとは限りません。

```rust playground
fn main() {
    let sum = 0.1_f64 + 0.2_f64;
    let expected = 0.3_f64;
    println!("{}", sum == expected); // false（丸め誤差のため）
    let epsilon = 1e-10;
    println!("{}", (sum - expected).abs() < epsilon); // true
}
```
:::

:::details[NaNは自分自身と等しくない]
IEEE 754の規定により `NaN`（非数）はどの値とも等しくならず、`NaN == NaN` も `false` になります。この性質のため `f32` / `f64` は反射律（`a == a`）を要求する `Eq` トレイトを実装せず、`PartialEq` のみを実装しています。NaN判定には `is_nan()` メソッドを使います。

```rust playground
fn main() {
    let nan = f64::NAN;
    println!("{}", nan == nan); // false
    println!("{}", nan.is_nan()); // true
}
```
:::

<!-- TODO: [[type-inference]] 作成後にリンク -->
