---
title: 式
description: 評価されると値を生成するコードの単位。Rustではifやブロックまでもが値を返す式であり、主に式で構成される「式言語」としての設計が特徴。
created_at: 2026-07-19
updated_at: 2026-07-19
tags: ["基本文法"]
public: true
---

式（Expression）は、評価されると**値を生成する**コードの単位です。`1 + 2`のような演算や関数呼び出しだけでなく、Rustでは`if`・`match`・`loop`・ブロック`{}`までもが値を生成する式です。The Rust Referenceは、Rustを主に式で構成される「式言語（expression language）」だと説明しています[^1]。値を生成しない[[statement]]と対になる概念で、この区別がRustの文法の土台になります。

```rust playground
fn main() {
    let stock = 3;
    // if は式なので、評価結果をそのまま変数に束縛できます
    let message = if stock > 0 { "在庫あり" } else { "在庫切れ" };
    println!("{message}");

    // ブロックも式。末尾のセミコロンのない式がブロック全体の値になります
    let total = {
        let unit_price = 120;
        unit_price * 3
    };
    println!("合計: {total}円");
}
```

## 式の代表例

| 分類 | 例 | 生成する値 |
| --- | --- | --- |
| リテラル | `42`, `"こんにちは"` | 書いたとおりの値 |
| 演算子式 | `price * 2`, `a && b` | 演算結果 |
| 関数・メソッド呼び出し | `calc()`, `s.len()` | 戻り値 |
| ブロック式 | `{ ...; 最後の式 }` | 末尾の式の値（なければ`()`） |
| `if`式・`match`式 | `if cond { a } else { b }` | 選ばれた分岐の値 |
| `loop`式 | `loop { break 10; }` | `break`に渡した値（`break`しない`loop`は値を返さず発散） |

## 補足

:::details[代入式が生成する値は ()]
`x = 5`のような代入も式ですが、その評価結果は代入した値ではなく[[unit-type]]`()`です。そのためC言語のように`x = y = 5`と連鎖させて両方に`5`を入れることはできません（`y = 5`の結果`()`が`x`に入るため、`x`が`i32`などの場合は型が合わずコンパイルエラーになります）。
:::

[^1]: [The Rust Reference: Statements and expressions](https://doc.rust-lang.org/reference/statements-and-expressions.html)
