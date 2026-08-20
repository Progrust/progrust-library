---
title: 比較演算子
description: 等価性と大小関係を調べる==・!=・<・<=・>・>=の6種類の演算子。結果は必ず論理値型になり、左右は原則として同じ型でなければならないのが特徴。
created_at: 2026-08-16
updated_at: 2026-08-20
tags: ["基本文法", "型システム"]
public: true
---

比較演算子は、2つの値の等価性（`==`・`!=`）や大小関係（`<`・`<=`・`>`・`>=`）を調べる演算子です。結果は必ず[[boolean-type]]になるため、[[if-expression]]の条件や[[logical-operators]]の組み合わせにそのまま渡せます。
左右の値は**原則として同じ型**である必要があり、型が違えば暗黙に変換されることなくコンパイルエラーになります。

| 演算子 | 意味       | 例                 |
| ------ | ---------- | ------------------ |
| `==`   | 等しい     | `3 == 3` → `true`  |
| `!=`   | 等しくない | `3 != 5` → `true`  |
| `<`    | より小さい | `3 < 5` → `true`   |
| `<=`   | 以下       | `3 <= 3` → `true`  |
| `>`    | より大きい | `5 > 3` → `true`   |
| `>=`   | 以上       | `3 >= 5` → `false` |

```rust playground
fn main() {
    let price = 120; // りんご1個の値段（円）
    let budget = 500; // 予算（円）

    let affordable: bool = price <= budget; // 比較の結果は論理値型
    println!("1個買えるか: {}", affordable);
    println!("3個で予算オーバーか: {}", price * 3 > budget);
    println!("予算ぴったりか: {}", price == budget);
}
```

:::message{warning}
比較演算子は連続して書けません。`a < b < c`は「`a < b`の結果（`bool`）と`c`を比較する」とは解釈されず、構文エラーになります。多段の比較は`(a < b) && (b < c)`のように論理演算子で繋ぎます[^1]。
:::

## 左右の型は揃える必要がある

`i32`と`i64`のような[[integer-type]]は、ビット幅が違うだけでも別の型として扱われるため、そのまま比較することはできません。`as`による[[type-cast]]などで型を揃えます。

<!-- rustc: expect E0308 -->
```rust playground
fn main() {
    let count: i32 = 3;
    let total: i64 = 1000;
    println!("{}", count < total); // エラー: E0308（i32とi64は比較できない）
}
```

`(count as i64) < total`のように片方を変換すれば比較できます。なお、リテラルだけであれば[[type-inference]]で型が揃うため、`3 < 1000`はそのまま書けます。

ただし、[[string]]（`String`）と`&str`のように、[[standard-library]]が異なる型同士の比較を用意している例外もあります（補足「実体はPartialEq・PartialOrdトレイト」を参照）。

## 補足

:::details[値はムーブされない]
比較演算子は、算術演算子などと違って**オペランドを暗黙に[[borrow]]します**。`a == b`は`std::cmp::PartialEq::eq(&a, &b)`と等価に展開されるため[^2]、比較しただけでは[[move]]が起きず、比較後も元の[[variable]]をそのまま使えます。
:::

:::details[数値以外も比較できる]
[[char-type]]・[[string-slice]]・[[tuple]]・[[array-type]]なども比較できます。文字列やタプル・配列は**辞書式比較**（先頭の要素から順に比較し、決着が付いた時点で結果が決まる）で大小が決まります。

```rust playground
fn main() {
    println!("{}", 'あ' < 'い'); // true（Unicodeスカラー値の順）
    println!("{}", "りんご" < "りんごジュース"); // true（前方一致なら短いほうが小さい）
    println!("{}", [1, 2, 3] < [1, 3, 4]); // true（2要素目で決着）
}
```

ただし文字列の比較は**バイト値の順**であり、いわゆるアルファベット順・五十音順とは一致しません。大文字は小文字より小さいため、`"Banana" < "apple"`は`true`になります。
:::

:::details[実体はPartialEq・PartialOrdトレイト]
`==`・`!=`は`PartialEq`、`<`などの大小比較は`PartialOrd`という[[trait]]のメソッド呼び出しに展開されます[^2]。`PartialEq<Rhs = Self>`は右辺の型を型引数に取り、その既定値が`Self`であるために「同じ型同士」が原則になっています[^3]。標準ライブラリは一部の組み合わせに異なる型同士の実装も提供しており、[[string]]と`&str`、[[vec]]と`[T; N]`は`==`で比較できます（ただしこの例外は等価比較だけで、`<`などは同じ型同士に限られます）。

自作の[[struct]]や[[enum]]は、そのままでは比較演算子を適用できません（エラー: E0369）。`#[derive(PartialEq)]`を付けると`==`・`!=`が、`#[derive(PartialOrd)]`も併せて付けると大小比較が使えるようになります[^4]。

```rust playground
#[derive(PartialEq, PartialOrd)]
struct Price(u32); // 税込価格（円）

fn main() {
    println!("{}", Price(120) < Price(200)); // deriveで比較できるようになる
    println!("{}", String::from("りんご") == "りんご"); // Stringと&strの例外
}
```

<!-- TODO: [[comparison-traits]] 作成後にリンク -->
<!-- TODO: [[operator-overloading]] 作成後にリンク -->
:::

:::details[NaNとの比較]
[[floating-point-type]]の`NaN`（非数）は自分自身とも等しくならないため、`==`だけでなく`<`・`<=`・`>`・`>=`もすべて`false`を返します（`!=`だけは逆に`true`になります）。値の大小で分岐するコードでは、どちらの枝にも入らない場合があることに注意してください。
:::

[^1]: [The Rust Reference: Expressions（演算子の優先順位表で、比較演算子の結合性は「Require parentheses」とされている）](https://doc.rust-lang.org/reference/expressions.html#expression-precedence)

[^2]: [The Rust Reference: Comparison operators](https://doc.rust-lang.org/reference/expressions/operator-expr.html#comparison-operators)

[^3]: [std::cmp::PartialEq](https://doc.rust-lang.org/std/cmp/trait.PartialEq.html)

[^4]: [std::cmp::PartialOrd（Derivable）](https://doc.rust-lang.org/std/cmp/trait.PartialOrd.html#derivable)
