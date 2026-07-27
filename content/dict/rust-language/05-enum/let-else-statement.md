---
title: let-else文
description: refutableなパターンにマッチしたら値を束縛して処理を続け、マッチしなければelseブロックで打ち切るlet文。elseブロックの発散が必須な点が特徴。
created_at: 2026-07-27
updated_at: 2026-07-27
tags: ["基本文法", "パターンマッチング"]
public: true
---

`let-else`文は、[[option]]の`Some`や[[result]]の`Ok`のようなrefutable（マッチしない可能性がある）パターンにマッチしたら値を[[variable]]へ束縛し、マッチしなければ`else`ブロックで処理を打ち切る`let`[[statement]]です[^1]。通常の`let`は必ずマッチが成功するirrefutableなパターンしか書けませんが、`else`ブロックを付けることでrefutableなパターンも扱えるようになります。Rust 1.65から使える構文です[^2]。

```rust playground
struct Item {
    name: String,
    price: i32,
}

fn print_price(items: &[Item], name: &str) {
    let Some(item) = items.iter().find(|item| item.name == name) else {
        println!("{name}は見つかりませんでした");
        return;
    };
    println!("{}: {}円", item.name, item.price);
}

fn main() {
    let items = vec![
        Item { name: "りんご".to_string(), price: 120 },
        Item { name: "みかん".to_string(), price: 80 },
    ];
    print_price(&items, "りんご");
    print_price(&items, "ぶどう");
}
```

## if letとの比較

`let-else`文と[[if-let-expression]]はどちらもパターンマッチと分岐を1つの構文にまとめますが、束縛した値を使える範囲が異なります。

| 書き方 | `else`の要否 | 束縛した値を使える範囲 |
| --- | --- | --- |
| `if let` | 省略可（発散しなくてもよい） | `if let`のブロック内だけ |
| `let-else` | 必須（必ず発散） | 以降、囲むブロックスコープ<!-- TODO: [[scope]] 作成後にリンク -->の終わりまで |

`if let`で束縛した値をブロックの外（[[function]]の残り）でも使いたい場合は、`if let`式全体の値を`let`で受け取り、マッチしなかった側の分岐は`return`などで抜けるという書き方になります。

:::details[if letで書いた場合]
```rust playground
struct Item {
    name: String,
    price: i32,
}

fn print_price(items: &[Item], name: &str) {
    let item = if let Some(item) = items.iter().find(|item| item.name == name) {
        item
    } else {
        println!("{name}は見つかりませんでした");
        return;
    };
    println!("{}: {}円", item.name, item.price);
}

fn main() {
    let items = vec![Item { name: "りんご".to_string(), price: 120 }];
    print_price(&items, "りんご");
}
```
:::

`let-else`文はこれを1つの文にまとめ、マッチが成功したときの処理（"happy path"、「幸せな道」）を関数本体の主流にとどめたまま、失敗時の[[return-expression]]（早期リターン）だけを`else`側に分離できます[^3]。

## elseブロックの発散

`else`ブロックはnever型（`!`）<!-- TODO: [[never-type]] 作成後にリンク -->を評価する、つまり必ず発散（`return`・`break`・`panic!`など）しなければなりません[^4]。マッチに失敗したのに`else`ブロックの後へ処理が進んでしまうと、束縛されるはずだった変数が存在しないまま参照されることになるため、発散が言語レベルで強制されています。

<!-- rustc: expect E0308 -->
```rust playground
fn main() {
    let value: Option<i32> = None;
    let Some(n) = value else {
        println!("値がありません");
        // エラー: E0308（elseブロックが発散せず、期待される`!`型と一致しない）
    };
    println!("{n}");
}
```

## 補足

:::details[else ifにあたる記法はない]
`if let`は`else if let`で複数パターンを連鎖できますが、`let-else`文に`else if`にあたる記法はなく、`else`ブロックは1つだけです。複数パターンを順に試したい場合は[[match-expression]]を使います。
:::

[^1]: [The Rust Reference: Statements - let statements](https://doc.rust-lang.org/reference/statements.html#r-statement.let.constraint) — `else`ブロックがない場合パターンはirrefutableでなければならず、`else`ブロックがある場合はrefutableでもよいと定義しています。
[^2]: [Announcing Rust 1.65.0 | Rust Blog](https://blog.rust-lang.org/2022/11/03/Rust-1.65.0/) — let-else文がこのバージョンで安定化されたと告知しています。
[^3]: [The Rust Programming Language: Staying on the "Happy Path" with let...else](https://doc.rust-lang.org/book/ch06-03-if-let.html#staying-on-the-happy-path-with-letelse) — `let-else`を使うと、`if let`のように2つの分岐で大きく異なる制御フローを持つことなく、関数本体の"happy path"にとどまれると説明しています。
[^4]: [The Rust Reference: Statements - let statements](https://doc.rust-lang.org/reference/statements.html#r-statement.let.behavior) — `else`ブロックは必ず発散し、never型を評価しなければならないと定義しています。
