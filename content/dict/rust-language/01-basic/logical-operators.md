---
title: 論理演算子（Logical Operators）
description: 論理値を組み合わせるAND・OR・NOTの演算子。`&&`と`||`は左辺だけで結果が決まると右辺を評価しない短絡評価が特徴。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["基本文法", "スカラー型"]
public: true
---

論理演算子は、[[boolean-type]]の値を組み合わせて新しい論理値を作る演算子です。比較演算子（`==`や`>=`など）の結果を「かつ」「または」で組み合わせる条件式でよく使います。<!-- TODO: [[comparison-operators]] 作成後にリンク -->

| 演算子 | 意味               | 例              |
| ------ | ------------------ | --------------- |
| `&&`   | 論理AND（かつ）    | `true && false` → `false` |
| `\|\|` | 論理OR（または）   | `true \|\| false` → `true` |
| `!`    | 論理NOT（否定）    | `!true` → `false` |

```rust playground
fn main() {
    let age = 20;
    let has_ticket = true;
    let can_enter = age >= 18 && has_ticket; // 18歳以上かつチケットあり
    println!("入場{}", if can_enter { "できます" } else { "できません" });
}
```

## 短絡評価

`&&`と`||`は**短絡評価**（short-circuit evaluation）を行います。左辺だけで結果が確定する場合、右辺は評価されません。

- `&&`: 左辺が`false`なら右辺を評価せず`false`を返します
- `||`: 左辺が`true`なら右辺を評価せず`true`を返します

この性質を使うと「右辺を評価すると危険な式」を安全に書けます。

:::details[短絡評価の活用例（0除算の回避）]
```rust playground
fn main() {
    let total = 300;
    let count = 0;
    // countが0のとき右辺の除算は実行されないため、パニックしない
    if count > 0 && total / count >= 100 {
        println!("1個あたり100円以上です");
    } else {
        println!("計算できないか、100円未満です");
    }
}
```
:::

## 補足

:::details[短絡評価しない論理演算子（& | ^）]
`bool`には`&`（AND）・`|`（OR）・`^`（XOR）も適用でき、こちらは短絡評価せず**両辺を必ず評価**します[^1]。副作用のある式を必ず実行したい場合や、排他的論理和が必要な場合に使います。なお、`^`に対応する短絡評価版はありません（XORは両辺の値が揃わないと結果が決まらないため）。
:::

:::details[複合代入と対応するトレイト]
`&` `|` `^`には複合代入演算子（`&=` `|=` `^=`）がありますが、短絡評価する`&&` `||`には複合代入形（`&&=` `||=`）は**存在しません**。

また、`!`は`std::ops::Not`、`&`は`BitAnd`、`|`は`BitOr`、`^`は`BitXor`トレイトに対応しており、独自の型にも実装できます。一方、短絡評価する`&&`と`||`はトレイトに対応しておらず、`bool`型の値専用です（`&bool`のような参照はそのままでは使えず、`*`によるデリファレンスが必要です）。<!-- TODO: [[operator-overloading]] 作成後にリンク -->
:::

## 関連項目

- [[numeric-operations]]

[^1]: [The Rust Reference: Arithmetic and logical binary operators](https://doc.rust-lang.org/reference/expressions/operator-expr.html#arithmetic-and-logical-binary-operators)
