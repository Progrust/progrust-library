---
title: クローン
description: .clone()の呼び出しで値の独立した複製を明示的に作る仕組み。ヒープのデータごと複製されるため、ムーブを避けて元の値を使い続けたいときの基本手段。
created_at: 2026-07-20
updated_at: 2026-07-20
tags: ["所有権", "標準ライブラリ"]
public: true
---

`.clone()`を呼んで値の**独立した複製**を明示的に作ることを**クローン**と呼びます。[[string]]や[[vec]]のようにヒープにデータを持つ型は、代入や受け渡しのたびに[[move]]が起きて[[ownership]]が移り、移動元の[[variable]]は使えなくなりますが、クローンを使えばムーブを避けて元の値を使い続けられます。この能力は[[standard-library]]の`Clone`トレイトが提供します。<!-- TODO: [[trait]] 作成後にリンク -->

```rust playground
fn main() {
    let order = String::from("コーヒー ×2");
    let cloned = order.clone(); // ヒープのデータごと複製（ムーブは起きない）

    println!("控え: {cloned}");
    println!("原本: {order}"); // OK: order の所有権は残っている
}
```

`String`のようにデータ本体を複製する型では、クローン後の2つの値は完全に独立しており、片方を変更・破棄してももう片方には影響しません（複製の意味が異なる型もあります。末尾の補足を参照）。そのぶんヒープデータの複製という実行時コストがかかるため、読み取りだけなら[[reference]]で[[borrow]]するのが基本で、クローンは独立した複製が本当に必要な場面で使います。

## Copyとの違い

コピーの仕組みとしては`Copy`トレイトもあります（[[move]]の「ムーブしない型」を参照）。両者は次のように役割が異なります[^1]。<!-- TODO: [[copy]] 作成後にリンク -->

| 観点 | `Copy` | `Clone`（`.clone()`） |
| --- | --- | --- |
| 起き方 | 代入や受け渡しで**暗黙**に起きる | **明示的**に呼び出す |
| コスト | 軽量なビット単位コピーのみ | 型ごとに自由（高コストになりうる） |
| 実装する型の例 | [[integer-type]]などのスカラー型 | `String`・`Vec`などヒープを使う型 |

なお`Clone`は`Copy`のスーパートレイトであり、`Copy`を実装する型は必ず`Clone`も実装します。

[^1]: [std公式ドキュメント — Trait Clone](https://doc.rust-lang.org/std/clone/trait.Clone.html)

## 補足

:::details[自作の型をクローン可能にする]
自作の構造体などは、全フィールドが`Clone`を実装していれば`#[derive(Clone)]`を付けるだけでクローン可能になります。導出された実装は各フィールドの`clone`を順に呼びます（ジェネリック型では型パラメータに`Clone`境界が付きます）。

```rust playground
#[derive(Clone)]
struct Order {
    item: String,
    count: u32,
}

fn main() {
    let order = Order { item: String::from("コーヒー"), count: 2 };
    let cloned = order.clone();
    println!("{} ×{}", cloned.item, cloned.count);
}
```
:::

:::details[「複製」の意味は型によって異なる]
`.clone()`が常にヒープデータの完全な複製（ディープコピー）を作るとは限りません。何を「複製」とするかは型ごとの実装次第です[^1]。

- `String`や`Vec`など多くの型: ヒープデータごと複製した独立の値を作る
- 参照`&T`: 同じ値を指す参照がもう1つできるだけ
- `Rc`や`Arc`のような参照カウント型: データ本体は複製されず、参照カウントが増えるだけ（複製後も同じデータを共有する）<!-- TODO: [[rc]] 作成後にリンク -->
:::
