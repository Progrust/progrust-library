---
title: return式
description: 関数の実行をその場で打ち切り、値を呼び出し元に返す式。Rustでは本体末尾の式が戻り値になるため、主な用途は途中で抜ける「早期リターン」。
created_at: 2026-07-19
updated_at: 2026-07-19
tags: ["基本文法"]
public: true
---

`return`式は、[[function]]の実行をその場で打ち切り、指定した値を呼び出し元に返す[[expression]]です[^1]。Rustの関数は本体ブロック末尾のセミコロンを付けない式が戻り値になるため、他の言語のように毎回`return`を書く必要はなく、主に**条件を満たしたら途中で抜ける「早期リターン」**のために使います。値を省略した`return;`は[[unit-type]]`()`を返します[^2]。

```rust playground
// 5000円以上の購入は送料無料。条件を満たしたら早期リターンします
fn shipping_fee(total_price: u32) -> u32 {
    if total_price >= 5000 {
        return 0; // ここで関数を抜けるので、以降は実行されません
    }
    500 // 末尾の式が通常の戻り値になります
}

fn main() {
    println!("8000円の買い物: 送料{}円", shipping_fee(8000));
    println!("3000円の買い物: 送料{}円", shipping_fee(3000));
}
```

## 末尾の式との使い分け

関数の最後で値を返すだけなら、`return total;`ではなく末尾の式`total`で書くのがRustの慣習です（意味は同じで、`return`を書いても誤りではありません）。一方、処理の途中（ネストした分岐やループの中、早期リターンの後にも処理が続く場合など）から即座に抜けたいときは`return`が適しています。単純な二択なら[[if-expression]]の値として書く手もありますが、「最後は末尾の式、途中は`return`」が基本の使い分けです。

## 補足

:::details[return式自体の型は!（never型）]
`return`式は決して値を生成せずに制御を移す「発散する式」で、式としての型は`!`（never型）です[^1]<!-- TODO: [[never-type]] 作成後にリンク -->。`!`はどんな型にも合わせられるため、たとえば`let fee = if ok { 500 } else { return 0 };`のように、片方の分岐が`return`でも[[if-expression]]全体の型が壊れません。
:::

:::details[クロージャの中のreturnはクロージャだけを抜ける]
クロージャ<!-- TODO: [[closure]] 作成後にリンク -->や`async`ブロックの本体に書いた`return`は、そのクロージャ（`async`ブロック）から値を返すだけで、それを囲む関数からは抜けません[^3]。外側の関数ごと抜けたい場合は、クロージャから返した値を関数側で判定して改めて`return`します。
:::

[^1]: [The Rust Reference: Return expressions](https://doc.rust-lang.org/reference/expressions/return-expr.html)
[^2]: [rustc error codes: E0069](https://doc.rust-lang.org/error_codes/E0069.html) — "`return;` is just like `return ();`"
[^3]: [Rust std: return keyword](https://doc.rust-lang.org/std/keyword.return.html)
