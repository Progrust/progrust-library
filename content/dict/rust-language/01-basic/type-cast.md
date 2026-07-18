---
title: キャスト
description: as演算子で行う明示的な型変換。失敗せずパニックもしないが、収まらない値は黙って変化する仕組み。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["基本文法", "型システム"]
public: true
---



Rustでは`as`演算子を使用することで別の型へ**キャスト**することができます。
[[boolean-type]]や[[char-type]]から[[integer-type]]への変換など、特定の[[primitive-type]]の決まった組み合わせだけが許可されています。
ただし`as`によるキャストは、収まらない値が**黙って変わる**変換のため多用は好まれず、[[conversion-traits]]で書ける変換はそちらが推奨されます。

```rust playground
fn main() {
    let total: i32 = 253; // 3科目の合計点
    let subjects: i32 = 3;
    let average = total as f64 / subjects as f64; // f64に揃えてから除算
    println!("平均点: {:.1}", average);
}
```

:::message{warning}
Rustは異なる型の間で暗黙の型変換を行いません。
そのため、同じ[[integer-type]]でも型が違う場合は明示的にキャストする必要があります。
:::

## `as`によるキャストの挙動

`as`によるキャストは**失敗せずパニックも起きません**。その代わり、値が変換先の型に収まらない場合は次の規則で**黙って**値が変化します。

| 変換                        | 挙動                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------ |
| 小さい整数型 → 大きい整数型 | 値はそのまま（`42u8 as i32` は `42`）                                                |
| 大きい整数型 → 小さい整数型 | 上位ビットを切り捨て（`1234u16 as u8` は `210`）                                     |
| [[floating-point-type]] → 整数型 | 小数部を0方向へ切り捨て（範囲外は飽和、`NaN`は`0`。Rust 1.45以降）              |
| 整数型 → 浮動小数点型       | 表現可能な最も近い値に丸め                                                           |
| `bool` → 整数型             | `false`は`0`、`true`は`1`                                                            |
| `char` → 整数型             | コードポイントの値（`'あ' as u32` は `12354`）                                       |
| `u8` → `char`               | 対応するコードポイントの文字（`65u8 as char` は `'A'`）                              |

:::message{tip}
値が黙って変わりうることから、Rustコミュニティでは`as`の多用は好まれない傾向があります。Clippyにも`as`の使用自体を検出する`as_conversions`や、`From`で書ける`as`を指摘する`cast_lossless`などのlintがあります[^1]。[[conversion-traits]]で書ける変換はそちらを優先し、`as`は代替のない変換（浮動小数点型→整数型など）や、挙動を理解した上での意図的な切り捨てに限定するのが無難です。
:::

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
