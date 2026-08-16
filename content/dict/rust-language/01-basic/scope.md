---
title: スコープ
description: 名前でその対象を参照できるソースコード上の範囲。多くは波括弧のブロックで区切られ、名前の見え方と値の破棄時点を決める仕組み。
created_at: 2026-08-16
updated_at: 2026-08-16
tags: ["基本文法", "所有権"]
public: true
---

スコープ（scope）は、ある名前でその対象を参照できるソースコード上の範囲です。Rustのスコープの多くは波括弧`{}`の**ブロック**で区切られ、`let`で宣言した[[variable]]が有効なのは`let`[[statement]]の直後からそのブロックの終わりまでです[^1]。内側のブロックからは外側の名前が見えますが、その逆は成り立ちません。

スコープは名前の見え方だけでなく値の寿命も決めます。変数がスコープを抜けるとき、その変数がまだ値を所有していれば、値は自動的に破棄されます（[[ownership]]）。

```rust playground
fn main() {
    let price = 300; // ここから main のブロックの終わりまで有効

    {
        let tax = 30; // このブロックの中だけ有効
        println!("税込: {}円", price + tax); // 外側の price も見える
    } // ここで tax がスコープを抜ける

    // println!("{tax}"); // エラー: E0425（tax はもう見えない）
    println!("本体価格: {}円", price);
}
```

## 名前ごとの有効範囲

ブロックの終わりまで有効なのは`let`の変数だけではなく、束縛（binding）の種類ごとに範囲が決まっています[^1]。

| 名前 | 有効な範囲 |
| --- | --- |
| `let`文の変数 | `let`文の直後からブロックの終わりまで |
| [[function]]の引数・クロージャの引数 | その本体の中 |
| [[for-expression]]のパターン束縛 | ループ本体の中 |
| [[if-let-expression]]のパターン束縛 | その分岐のブロックの中（2024エディション以降は`&&`で続く後続の条件でも有効） |
| [[match-expression]]のパターン束縛 | そのアームのガードと本体 |
| ブロック内で宣言した項目（`fn`・`struct`など） | ブロックの**先頭**から終わりまで |

最後の行だけ性質が異なります。変数は宣言してから下でしか使えませんが、項目の名前はブロックの先頭から有効なため、定義より前の行からでも呼び出せます。

## シャドーイングとの関わり

内側のブロックで同じ名前を`let`宣言して覆い隠しても（[[shadowing]]）、その効果はそのブロックの終わりまでです。ブロックを抜ければ外側の変数が再び見えます。

## 所有権・借用との関わり

値の破棄はスコープを基準に行われます。ブロックなどのドロップスコープから制御が出るとき、そのスコープに属する変数は**宣言と逆の順序**で破棄されます[^2]。

一方で[[borrow]]の有効範囲はスコープの終わりとは一致しません。現在のコンパイラは[[non-lexical-lifetimes]]により、借用を制御フロー上で「その[[reference]]が最後に使われる地点」までとして扱うため、参照を持つ変数がまだスコープ内にあっても、その後に元の値を変更できます。ただし参照を保持する型が`Drop`を実装している場合は、スコープ終端での破棄も使用とみなされ、借用はスコープの終わりまで続きます[^2]。

## 補足

:::details[項目が定義より前から呼べる例]
```rust playground
fn main() {
    println!("税込: {}円", with_tax(300)); // 定義より前だが呼べる

    fn with_tax(price: i32) -> i32 {
        price + price / 10
    }
}
```
:::

:::details[破棄が宣言の逆順になる例]
```rust playground
struct Receipt(&'static str);

impl Drop for Receipt {
    fn drop(&mut self) {
        println!("破棄: {}", self.0);
    }
}

fn main() {
    let first = Receipt("1枚目");
    let second = Receipt("2枚目");
    println!("会計終了: {} と {}", first.0, second.0);
} // 「破棄: 2枚目」→「破棄: 1枚目」の順に出力される
```
:::

:::details[ローカル変数のスコープは項目の中に入り込まない]
ブロック内で宣言した`fn`などの項目からは、同じブロックのローカル変数を参照できません[^1]。項目は周囲の環境を捕捉しないためで、捕捉したい場合はクロージャを使います。<!-- TODO: [[closure]] 作成後にリンク -->

<!-- rustc: expect E0434 -->
```rust playground
fn main() {
    let price = 300;

    fn show() {
        println!("{price}円"); // エラー: E0434（項目は環境を捕捉できない）
    }

    show();
}
```
:::

:::details[スコープに名前を持ち込む]
名前をスコープに持ち込む手段が[[use-declaration]]です。`use`が作る名前も、書いたスコープの中でだけ有効です。

また、明示的に書かなくても常に見えている名前もあります。`Option`や`String`が何も書かずに使えるのは、[[standard-library]]のプレリュードがすべての[[module]]のスコープに項目を持ち込んでいるからです[^1]。
:::

[^1]: [Scopes — The Rust Reference](https://doc.rust-lang.org/reference/names/scopes.html)

[^2]: [Destructors — The Rust Reference](https://doc.rust-lang.org/reference/destructors.html)
