---
title: シャドーイング（Shadowing）
description: 既存の変数と同じ名前で新しい変数を let 宣言し、以前の変数を覆い隠す仕組み。mut と異なり型の変更も可能。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["基本文法"]
public: false
---

シャドーイングは、既存の[[variable]]と同じ名前で新しい変数を`let`宣言する仕組みです。以降その名前は新しい変数を指し、以前の変数は覆い隠されます（シャドーされます）。新しい変数を作り直すため、以前の変数と**異なる型**にすることもできます。

```rust playground
fn main() {
    let price = "300"; // 入力は文字列（&str型）
    let price: i32 = price.parse().unwrap(); // 同じ名前でi32型の変数を作り直す
    let price = price + 50; // 前のpriceの値を使ってさらに作り直す（送料を加算）
    println!("送料込み: {}円", price);
}
```

## mutとの違い

| 比較点 | `mut` | シャドーイング |
| --- | --- | --- |
| 仕組み | 同じ変数の値を書き換える | `let`で新しい変数を作る |
| 型の変更 | 不可（エラー: E0308） | 可能 |
| 値の更新方法 | `let`なしで再代入する | `let`で作り直す（再代入ではない） |

## 補足

:::details[mutでは型を変えられない実例]
`mut`な変数への再代入では型を変えられません。

<!-- rustc: expect E0308 -->
```rust playground
fn main() {
    let mut price = "300";
    price = price.parse::<i32>().unwrap(); // エラー: E0308（&str型の変数にi32は代入できない）
    println!("{}", price);
}
```
:::

:::details[内側のスコープでのシャドーイング]
<!-- TODO: [[scope]] 作成後にリンク -->
ブロック内でシャドーイングすると、その効果はブロックの終わりまでです。ブロックを抜けると元の変数が再び見えるようになります。

```rust playground
fn main() {
    let price = 300;
    {
        let price = price * 2; // このブロック内だけ2倍
        println!("セット価格: {}円", price); // 600円
    }
    println!("単品価格: {}円", price); // 300円
}
```
:::

:::details[定数はシャドーイングできない]
`let`のパターンは[[constant]]や`static`項目をシャドーイングできません（The Rust Reference「Scopes」の規定）。定数と同じ名前を`let`に書くと、変数の宣言ではなく定数の値との照合（定数パターン）と解釈され、エラー: E0005になります。`static`の場合は定数パターンとは解釈されず、シャドーイング自体が直接拒否されます（エラー: E0530）。
<!-- TODO: [[static]] 作成後にリンク -->

<!-- rustc: expect E0005 -->
```rust playground
const TAX_RATE: f64 = 0.1;

fn main() {
    let TAX_RATE = 0.08; // エラー: E0005（定数パターンとの照合と解釈され、網羅的でない）
    println!("{}", TAX_RATE);
}
```
:::
