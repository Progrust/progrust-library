---
title: match式
description: 値をパターンと上から順に照合し、最初に一致したアームを実行する制御フロー構文。あり得るすべての値の網羅をコンパイラが強制する点が特徴。
created_at: 2026-07-27
updated_at: 2026-07-27
tags: ["基本文法", "パターンマッチング"]
public: true
---

`match`式は、対象の値を複数のパターンと上から順に照合し、最初に一致した「アーム」の処理を実行する制御フロー構文です[^1]。[[if-expression]]の分岐条件が[[boolean-type]]の値に限られるのに対し、`match`式は[[enum]]のバリアントやリテラル値など多様なパターンで分岐できます。`if`式と同じく[[expression]]であり、実行されたアームの値が`match`式全体の値になります。

```rust playground
enum Ticket {
    Standard,
    Vip(i32), // 割引率(%)
}

fn describe(ticket: Ticket) -> String {
    match ticket {
        Ticket::Standard => String::from("通常チケットです"),
        Ticket::Vip(discount) => format!("VIPチケット（{discount}%引き）"),
    }
}

fn main() {
    for ticket in [Ticket::Standard, Ticket::Vip(30)] {
        println!("{}", describe(ticket));
    }
}
```

## アームとパターン

各アームは`パターン => 式,`という形で書き、複数のアームを並べます。パターンは上から順に照合され、最初に一致したアームだけが実行されます。C言語の`switch`と異なり次のアームへの意図しないフォールスルーは起こらず、`1 | 7 => ...`のように`|`区切りで1つのアームに複数パターンをまとめることもできます[^2]。

## 値を束縛するパターン

パターンの中に変数名を書くと、マッチした値（の一部）をその[[variable]]に束縛し、対応するアームの式の中で使えます。上記の`Ticket::Vip(discount)`はその例で、`Vip`が保持する`i32`の値が`discount`という名前でアーム内から使えるようになります。

## 網羅性チェック

`match`式は対象の型が取りうる値をすべて網羅しなければならず、一致しうる値の中に処理されないものが1つでも残っているとコンパイルエラーになります[^3]。`i32`のように取りうる値を列挙しきれない型では、任意の値にマッチする[[catch-all-pattern]]（`_`などで書く）を最後に置いて残りをまとめて処理するのが一般的です。

<!-- rustc: expect E0004 -->
```rust playground
fn describe(n: i32) -> &'static str {
    match n {
        1 => "one",
        2 => "two",
    } // エラー: E0004（あり得る値をすべて網羅していない）
}

fn main() {
    println!("{}", describe(5));
}
```

## 補足

:::details[バリアント追加時に効く網羅性チェック]
`match`式の網羅性チェックは、[[enum]]にバリアントを追加したときに真価を発揮します。追加後に対応漏れがある`match`式ではすべてコンパイルエラーが出るため、修正が必要な箇所をコンパイラが教えてくれます。
:::

[^1]: [The Rust Reference: Match expressions](https://doc.rust-lang.org/reference/expressions/match-expr.html) — マッチ対象の値（scrutinee）を各アームのパターンと順に比較し、最初にマッチしたアームが選ばれると定義しています。
[^2]: [The Rust Reference: Patterns - Or patterns](https://doc.rust-lang.org/reference/patterns.html#or-patterns) — `|`で複数のパターンを1つに結合できると定義しています。
[^3]: [E0004 - Error codes index](https://doc.rust-lang.org/error_codes/E0004.html) — `match`式が対象の型が取りうるすべての値を網羅していない場合に発生するエラーであると定義しています。
