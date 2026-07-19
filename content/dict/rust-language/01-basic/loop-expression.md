---
title: loop式
description: 本体のブロックを無限に繰り返すループ式。breakで脱出でき、渡した値がloop式全体の値になる、3種のループ（loop・while・for）のうち唯一breakで値を返せる構文。
created_at: 2026-07-19
updated_at: 2026-07-19
tags: ["基本文法"]
public: true
---

`loop`式は、本体のブロックを**無限に繰り返す**ループです。`break`に到達するまで終了しないため、繰り返し回数や継続条件を事前に決められない処理（リトライ・入力待ちなど）に向きます。`break 値;`でループ全体の値を生み出せる、値を生成する[[expression]]としての性格が最もはっきりしたループです[^1]。

```rust playground
fn main() {
    let mut savings = 0;
    let days = loop {
        savings += 100; // 毎日100円ずつ貯金します
        if savings >= 1000 {
            break savings / 100; // breakに渡した値がloop式全体の値になります
        }
    };
    println!("{days}日で1000円たまりました");
}
```

## 3種類のループとの比較

`break`に渡した値はそのまま[[variable]]に束縛できます。`while`・`for`は`break`に値を渡せず、式としての値は常に[[unit-type]]`()`です。

| 構文 | 繰り返しの条件 | 式としての値 |
| --- | --- | --- |
| `loop` | なし（`break`するまで無限） | `break`に渡した値（渡さなければ`()`） |
| [[while-expression]] | 条件が`true`の間 | 常に`()` |
| [[for-expression]] | [[range-expression]]などのイテレータに<!-- TODO: [[iterator]] 作成後にリンク -->次の要素がある間 | 常に`()` |

## 補足

:::details[breakしないloop式の型は!（never型）]
`break`を1つも含まない`loop`式は決して値を返さない「発散する式」で、型は`!`（never型）になります<!-- TODO: [[never-type]] 作成後にリンク -->[^1]。どんな型とも互換になるため、値を返す[[function]]の中に置いてもコンパイルエラーになりません。
:::

:::details[ループラベルで外側のループを抜ける]
ループの前に`'名前:`のラベルを付けると、ネストした内側から`break '名前`・`continue '名前`で外側のループを直接操作できます。ラベルは`loop`だけでなく`while`・`for`にも付けられます[^1]。なお、ループ以外でもラベル付きブロック式`'名前: { ... }`なら`break '名前 値;`で値を返せます。

```rust playground
fn main() {
    'outer: for row in 1..=3 {
        for col in 1..=3 {
            if row * col == 6 {
                break 'outer; // 内側だけでなく外側のforごと抜けます
            }
            println!("{row} × {col} = {}", row * col);
        }
    }
}
```

:::

[^1]: [The Rust Reference: Loops and other breakable expressions](https://doc.rust-lang.org/reference/expressions/loop-expr.html)
