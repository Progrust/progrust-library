---
title: ループラベル
description: ループの前に'名前:の形で付ける名前。ネストした内側からbreak・continueで対象のループを直接指定でき、多重ループをまとめて抜けられる書き方。ループ以外のブロック式にも付けられ、breakで値を返せる点も特徴。
created_at: 2026-07-19
updated_at: 2026-07-19
tags: ["基本文法"]
public: true
---

ループラベルは、ループの前に`'名前:`の形で付ける名前です。`break`・`continue`は通常最も内側のループを対象にしますが、`break '名前`・`continue '名前`とラベルを指定すると、**ラベルを付けた外側のループ**を直接脱出・継続できます。[[loop-expression]]・[[while-expression]]・[[for-expression]]のすべてに付けられ、多重ループをまとめて抜けたいときの定番の書き方です[^1]。

```rust playground
fn main() {
    let shelves = [["牛乳", "卵"], ["パン", "米"], ["塩", "砂糖"]];
    'search: for (index, shelf) in shelves.iter().enumerate() {
        for &item in shelf {
            if item == "米" {
                println!("{}番目の棚で米を見つけました", index + 1);
                break 'search; // 内側だけでなく外側のforごと抜けます
            }
        }
    }
}
```

## ラベルの有無による対象の違い

| 書き方 | 対象になるループ |
| --- | --- |
| `break` / `continue`（ラベルなし） | 最も内側のループ |
| `break '名前` / `continue '名前` | `'名前:`を付けたループ |

## 補足

:::details[ラベル付きブロック式 — ループ以外から値を持って抜ける]
Rust 1.65から、ループでない普通のブロックにもラベルを付けられます[^2]。`break '名前 値;`でブロックを途中で抜け、渡した値がブロック全体という[[expression]]の値になります。`break`で値を返せるのは`loop`式とこのラベル付きブロック式だけです。なお、ブロック内の`break`はラベルの省略ができず、`continue`でラベル付きブロックを対象にすることはできません[^1]。

```rust playground
fn main() {
    let price = 800;
    let shipping = 'calc: {
        if price >= 1000 {
            break 'calc 0; // 1000円以上なら送料無料で確定します
        }
        500
    };
    println!("送料: {shipping}円");
}
```

:::

:::details[ラベルの命名規則とシャドーイング]
ラベルはライフタイム<!-- TODO: [[lifetime]] 作成後にリンク -->と同じ`'`始まりの構文で書きますが、別物です（`'_`はラベルに使えません）。ラベルはローカル[[variable]]と同じ[[shadowing]]の規則に従い、同名ラベルがネストした場合は最も内側のラベルが優先されます[^1]。
:::

[^1]: [The Rust Reference: Loops and other breakable expressions](https://doc.rust-lang.org/reference/expressions/loop-expr.html)
[^2]: [Announcing Rust 1.65.0 | Rust Blog](https://blog.rust-lang.org/2022/11/03/Rust-1.65.0/)
