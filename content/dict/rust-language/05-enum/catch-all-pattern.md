---
title: 包括パターン
description: match式の網羅性チェックを満たすため、残り全ての値を最後のアームでまとめて処理するパターン。値を束縛する識別子パターンと、値を捨てるワイルドカードパターンの2種類。
created_at: 2026-07-27
updated_at: 2026-07-27
tags: ["基本文法"]
public: true
---

包括パターン（catch-all pattern）は、[[match-expression]]の網羅性チェックを満たすため、それまでのアームに一致しなかった残りすべての値を最後のアームでまとめて処理するパターンです[^1]。`i32`のように取りうる値を列挙しきれない型でよく使われ、[[variable]]名を書いて値を束縛する「識別子パターン」と、`_`を書いて値を捨てる「ワイルドカードパターン」の2通りの書き方があります。

```rust playground
fn shipping_fee(distance_km: i32) -> i32 {
    match distance_km {
        0..=5 => 0,
        6..=20 => 300,
        other => other * 20, // その他（21km以上など）: 距離に応じた従量課金
    }
}

fn main() {
    for distance in [3, 15, 50] {
        println!("{distance}km: {}円", shipping_fee(distance));
    }
}
```

上記の`other`が識別子パターンで、一致した値（この場合は`distance_km`そのもの）を変数`other`に束縛し、右辺の[[expression]]の中で使えるようにします。

:::message{warning}
包括パターンは必ず最後のアームに置く必要があります。他のパターンより先に置くと、そのパターン以降のアームに値が届かなくなり、コンパイラが「到達不能パターン」の警告を出します。
:::

## ワイルドカードパターンで値を捨てる

束縛した値を使わない場合は`_`を使います。変数名で束縛すると未使用のままでは警告が出ますが、`_`は値をコピーも[[move]]も[[borrow]]もせずに捨てるため警告が出ません[^2]。<!-- TODO: [[copy]] 作成後にリンク -->

処理自体を何もしたくない場合は、アームの式に[[unit-type]]の値`()`をそのまま書きます。

```rust playground
fn handle_key(code: i32) {
    match code {
        27 => println!("Escキーが押されました"),
        _ => (), // それ以外のキーは無視して何もしない
    }
}

fn main() {
    for code in [27, 65] {
        handle_key(code);
    }
}
```

[^1]: [The Rust Programming Language: Catch-all Patterns and the `_` Placeholder](https://doc.rust-lang.org/book/ch06-02-match.html#catch-all-patterns-and-the-_-placeholder) — 特定の値だけ個別に処理し、残りすべての値をまとめて処理するアームをcatch-allパターンと呼ぶと説明しています。
[^2]: [The Rust Reference: Wildcard pattern](https://doc.rust-lang.org/reference/patterns.html#wildcard-pattern) — ワイルドカードパターン`_`は識別子パターンと異なり、マッチした値をコピー・ムーブ・借用しないと定義しています。
