---
title: Copyトレイト
description: 代入や受け渡しでムーブではなくビット単位の複製が起きることを示すマーカートレイト。実装できるのは、全フィールドがCopyかつDropを持たない型。
created_at: 2026-08-16
updated_at: 2026-08-16
tags: ["所有権", "標準ライブラリ"]
public: true
---

`Copy`は、値をビット単位で複製するだけで複製が成立することを示す、[[method]]を1つも持たない**マーカートレイト**です[^1]。`Copy`を実装した型は、代入や[[function]]への受け渡しで[[move]]ではなくコピーが起き、[[ownership]]は移らないため元の[[variable]]をそのまま使い続けられます。[[integer-type]]や[[boolean-type]]をはじめ、[[primitive-type]]の多くは最初から`Copy`を実装しています。<!-- TODO: [[trait]] 作成後にリンク -->

```rust playground
#[derive(Copy, Clone)]
struct Price {
    yen: u32,
}

fn main() {
    let regular = Price { yen: 1200 };
    let sale = regular; // ムーブではなくコピーが起きる

    println!("通常価格: {}円", regular.yen); // OK: regular はまだ使える
    println!("セール価格: {}円", sale.yen);
}
```

## 実装できる型の条件

`Copy`はどんな型にも付けられるわけではなく、次の2つを**両方**満たす型だけが実装できます[^2]。

| 条件 | 内容 | 違反時のエラー |
| --- | --- | --- |
| 全フィールドが`Copy` | [[struct]]は全フィールド、[[enum]]は全バリアントの全フィールドが`Copy`である必要がある | E0204 |
| `Drop`を実装していない | `Drop`と`Copy`は同時に実装できない | E0184 |

`Drop`を実装する型は自身のサイズを超えた資源（ヒープ領域など）を管理しているため、ビットの複製だけでは正しく増やせません[^1]。[[string]]や[[vec]]が`Copy`になれないのはこのためです。<!-- TODO: [[drop]] 作成後にリンク -->

## Cloneとの関係と使い分け

`.clone()`による[[clone]]を提供する`Clone`は、`Copy`のスーパートレイトです（`pub trait Copy: Clone`）。そのため`Copy`を実装する型は必ず`Clone`も実装する必要があり、`#[derive(Copy, Clone)]`とセットで書くのが定型になっています[^1]。<!-- TODO: [[derive]] 作成後にリンク -->

| 観点 | `Copy` | `Clone` |
| --- | --- | --- |
| 複製の起き方 | 代入・受け渡しで暗黙に | `.clone()`で明示的に |
| 複製の内容 | ビット単位の複製に固定 | 型ごとに自由に実装できる |
| 主な対象 | ヒープを使わない小さな値 | ヒープなどの資源を持つ型 |

小さくヒープを持たない型には`Copy`を付けてコピーを気にせず扱えるようにし、資源を持つ型は`Copy`にできないので必要な場面だけ`.clone()`します。読み取りたいだけなら、どちらでもなく[[reference]]で[[borrow]]するほうが安価です。

## 補足

:::details[条件を満たさない型に付けるとどうなるか]
`Copy`でないフィールドを持つ型に付けると`E0204`になります。

<!-- rustc: expect E0204 -->
```rust playground
#[derive(Copy, Clone)] // エラー: E0204（Copyでないフィールドを含む）
struct Cart {
    items: Vec<String>, // Vec は Copy ではない
}

fn main() {
    let cart = Cart { items: vec![String::from("りんご")] };
    println!("商品数: {}", cart.items.len());
}
```

`Drop`を実装している型に付けると`E0184`になります。

<!-- rustc: expect E0184 -->
```rust playground
#[derive(Copy, Clone)] // エラー: E0184（DropとCopyは同時に実装できない）
struct Receipt {
    id: u32,
}

impl Drop for Receipt {
    fn drop(&mut self) {
        println!("レシート{}を破棄しました", self.id);
    }
}

fn main() {
    let _receipt = Receipt { id: 1 };
}
```
:::

:::details[自動でCopyになる型と、参照の扱い]
共有参照`&T`は、`T`が`Copy`かどうかに関わらず常に`Copy`です[^1]。一方で排他参照`&mut T`は`Copy`ではありません（コピーできてしまうと、同じ値への排他参照が同時に複数存在することになるためです）。

このほか、`Copy`な型だけからなる[[tuple]]や関数ポインタなど、自分で`derive`しなくてもコンパイラが`Copy`を実装する型もあります[^2]。
:::

:::details[ムーブとコピーはどこが違うのか]
実行時の動作としては、ムーブもコピーもメモリ上でビットが複製されることがあり（最適化で消えることもあります）、機械語のレベルでは同じ処理になり得ます。両者の本質的な違いは「複製したあとに元の値へアクセスしてよいかどうか」という、コンパイラが課す規則の側にあります[^1]。
:::

[^1]: [std公式ドキュメント — Trait Copy](https://doc.rust-lang.org/std/marker/trait.Copy.html)

[^2]: [The Rust Reference — Special types and traits](https://doc.rust-lang.org/reference/special-types-and-traits.html#copy)
