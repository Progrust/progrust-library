---
title: never型
description: 値が1つも存在しない型「!」。処理がそこで発散して値を生成しないことを表し、どんな型にも型強制される特別な型。
created_at: 2026-08-16
updated_at: 2026-08-20
tags: ["型システム", "基本文法", "プリミティブ型"]
public: true
---

never型`!`は、**値が1つも存在しない型**です[^1]。値を作れない以上その先へ値を渡すこともできないため、`!`は決して完了しない計算、つまり**発散する**（diverge）処理の型として使われます。[[return-expression]]や`panic!`による[[panic]]のように、その場で制御を別の場所へ移してしまい、値を生成しない[[expression]]が`!`を持ちます[^2]。

`!`の値は決して存在しないため、`!`型の式は**どんな型にも型強制されます**[^3]。そのため[[if-expression]]や[[match-expression]]で分岐の一部だけを`return`や`panic!`にしても、式全体の型が壊れません。

```rust playground
// 戻り値の型が!の「発散する関数」。呼び出すと戻ってきません
fn abort_order(reason: &str) -> ! {
    panic!("注文を中止しました: {reason}");
}

fn charge(balance: u32, price: u32) -> u32 {
    if balance >= price {
        balance - price
    } else {
        abort_order("残高不足") // 型は!なのでu32に型強制され、if式全体はu32になります
    }
}

fn main() {
    println!("残り{}円", charge(3000, 1200));
}
```

## `!`型になる式

いずれも「値を生成せずに制御を別の場所へ移す」点が共通しています[^2][^5]。

| 式 | 制御の移り先 |
| --- | --- |
| [[return-expression]] | 呼び出し元へ戻る（[[function]]を抜ける） |
| `break`式・`continue`式 | ループの外、または次の周回へ |
| `panic!`など実行を打ち切る[[macro]] | スレッドの実行を中断する |
| `break`を含まない[[loop-expression]] | どこへも移らない（決して終わらない） |
| 戻り値が`!`の関数の呼び出し | 呼び出した先で発散し、戻ってこない |

## 補足

:::details[`!`を型注釈に書けるのは関数の戻り値の位置だけ（`!`自体はまだ不安定）]
型として`!`を書けるのは、関数の戻り値の位置`-> !`に限られます[^1]。それ以外の位置に書くと、never型が不安定な機能のままであるためコンパイルエラーになります（Rust 1.93で確認）。`!`は「書く型」ではなく「コンパイラが式に付ける型」として出会うのが普通です。

<!-- rustc: expect E0658 -->
```rust playground
fn main() {
    let quit: ! = panic!("注文を中止しました"); // エラー: E0658（`!`型は実験的機能）
}
```
:::

:::details[言語側が`!`型を要求する場面]
[[let-else-statement]]の`else`ブロックは必ず発散しなければならず、型が`!`であることが求められます。マッチに失敗したまま後続へ進むと、束縛されるはずだった変数が存在しないまま参照されてしまうため、発散が言語レベルで強制されています。
:::

:::details[ユニット型`()`との違い]
どちらも「意味のある値を返さない」場面に現れますが、値の個数が決定的に違います。

| 型 | 値の個数 | 意味 |
| --- | --- | --- |
| [[unit-type]]`()` | 1個（`()`のみ） | 処理は完了するが、返す値に意味がない |
| `!` | 0個 | 処理が完了せず、値がそもそも生成されない |

値が1個ある`()`は「完了した」ことを伝えられますが、`!`は値を構築できないため、`!`型の式の先へ実行が進むことはありません。この違いから、`!`はどんな型にも型強制できる一方で、`()`は他の型へ型強制されません。
:::

:::details[never型フォールバックはRust 2024で変わった]
`!`が型強制される位置にあるのに、[[type-inference]]で強制先の型を決められないことがあります。このときコンパイラが使う既定の型を**never型フォールバック**と呼び、従来は`()`でしたが、Rust 2024エディションで`!`自身に変更されました[^4]。

<!-- rustc: expect E0277 -->
```rust playground
fn main() {
    let in_stock = true;
    // エラー: E0277（フォールバック先の!はDefaultを実装していない）
    let _count = if in_stock { Default::default() } else { return };
}
```

従来のエディションでは`_count`が`()`と推論されていましたが、Rust 2024では`!`と推論され、`!`が`Default`[[trait]]を実装していないためコンパイルエラーになります。対処は`let _count: u32 = ...`のように型を明示することです。なお現在のコンパイラでは、旧エディションでもフォールバックが`()`であることへの依存自体が`dependency_on_unit_never_type_fallback`リント（既定でdeny）のエラーになります[^4]（Rust 1.93で確認）。
:::

[^1]: [The Rust Reference: Never type](https://doc.rust-lang.org/reference/types/never.html) — `!`が値を持たない型で決して完了しない計算の結果を表すこと、`!`型の式が他のどんな型にも型強制されること、`!`が現状は関数の戻り値の位置にしか書けないことが記載されています。
[^2]: [std: primitive type never](https://doc.rust-lang.org/std/primitive.never.html) — `break`・`continue`・`return`式が`!`型を持つこと、`panic!`や終了しない`loop`・`exit`のような発散する関数も同様であることが例とともに示されています。
[^3]: [The Rust Reference: Type coercions](https://doc.rust-lang.org/reference/type-coercions.html) — 型強制の一覧に「`!` to any `T`」が挙げられています。
[^4]: [Rust 2024 edition guide: Never type fallback change](https://doc.rust-lang.org/edition-guide/rust-2024/never-type-fallback.html) — フォールバック先が`()`から`!`へ変わったこと、`dependency_on_unit_never_type_fallback`リントによる移行検出が記載されています。
[^5]: [The Rust Reference: Loop expressions](https://doc.rust-lang.org/reference/expressions/loop-expr.html) — `break`を持たない`loop`式、および`break`式・`continue`式が発散して`!`型を持つことが定義されています。
