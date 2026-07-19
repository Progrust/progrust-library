---
title: for式
description: イテレータが生み出す要素を順に取り出し、要素ごとに本体のブロックを実行するループ式。範囲・配列・ベクタなどの繰り返しに使う、3種のループで最も使用頻度が高い構文。式としての値は常にユニット型。
created_at: 2026-07-19
updated_at: 2026-07-19
tags: ["基本文法"]
public: true
---

`for`式は、イテレータ<!-- TODO: [[iterator]] 作成後にリンク -->が生み出す要素を順に取り出し、要素ごとに本体のブロックを実行するループです。`for パターン in 式 { ... }`の形で書き、`in`の右側にはイテレータに変換できる値（[[range-expression]]・[[array-type]]・[[vec]]など）を置きます[^1]。要素がなくなれば自動で終了するため繰り返し回数の管理が要らず、3種類のループの中で最もよく使う構文です。名前のとおり全体が1つの[[expression]]ですが、その値は常に[[unit-type]]`()`で、[[loop-expression]]と違い`break`で値を返せません。

```rust playground
fn main() {
    let prices = [120, 250, 80]; // 買い物かごの中身
    let mut total = 0;
    for price in prices {
        total += price;
    }
    println!("合計: {total}円");
}
```

## コレクションの渡し方は3通り

ベクタのようなコレクションは、`in`にそのまま渡すか参照で渡すか<!-- TODO: [[reference]] 作成後にリンク -->で、取り出せる要素の型が変わります。

| 書き方 | 要素の型 | 主な用途 |
| --- | --- | --- |
| `for x in &v` | `&T`（参照） | 読み取りだけ行う |
| `for x in &mut v` | `&mut T`（可変参照） | 要素を書き換える |
| `for x in v` | `T`（所有権が移る） | 要素を消費する |

そのまま渡すと所有権<!-- TODO: [[ownership]] 作成後にリンク -->がループに移り、ベクタのような`Copy`でない型ではループの後で元の[[variable]]を使えなくなります（冒頭の例の配列は要素が`Copy`のため配列ごとコピーが渡り、後でも使えます）。読み取りだけなら`&v`で渡すのが基本です。

## 補足

:::details[添字が必要なとき — enumerate]
要素と一緒に「何番目か」も使いたいときは、添字を自前で管理するのではなく`enumerate`を使います。添字と要素のペアが[[tuple]]の値として順に得られます（添字は0始まり）。

```rust playground
fn main() {
    let menu = ["カレー", "ラーメン", "うどん"];
    for (index, name) in menu.iter().enumerate() {
        println!("{}番: {name}", index + 1); // 表示用に+1します（enumerate自体は0始まり）
    }
}
```

:::

:::details[for式はloop式への糖衣構文]
`for`式はコンパイル時に、`IntoIterator::into_iter`でイテレータを作り、`loop`の中で`Iterator::next`を呼び続ける形へ展開されます[^1]。`next`が`Some(値)`を返す間だけ<!-- TODO: [[option]] 作成後にリンク -->本体を実行し、`None`になったら`break`します。`in`の左側には、この`Some`から取り出した値が束縛されるため、必ずマッチするパターン（irrefutableパターン）しか書けません。
:::

[^1]: [The Rust Reference: Loops and other breakable expressions](https://doc.rust-lang.org/reference/expressions/loop-expr.html)
