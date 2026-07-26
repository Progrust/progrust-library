---
title: ユニット様構造体
description: フィールドを1つも持たない構造体。型名がそのままインスタンスになり、データを持たない型に振る舞いだけを与えたいときに使う定義形式。
created_at: 2026-07-26
updated_at: 2026-07-26
tags: ["型システム", "基本文法", "複合型"]
public: true
---

ユニット様構造体（unit-like struct）は、フィールドを1つも持たない[[struct]]です。`struct Marker;`のようにフィールドリストごと省略して定義します。保持する値がない点が[[unit-type]]`()`に似ているため、この名前で呼ばれます。

定義すると型と同じ名前の[[constant]]が暗黙に作られるため[^1]、`Marker`と書くだけでインスタンスが得られます。

```rust playground
struct TaxCalculator; // 税率10%固定。覚えておくべきデータがない

impl TaxCalculator {
    fn total(&self, price: u32) -> u32 {
        price * 110 / 100
    }
}

fn main() {
    let calculator = TaxCalculator; // 型名をそのまま書くとインスタンスになる
    println!("税込み: {}円", calculator.total(1000));
}
```

## 使いどころ

フィールドがなくても[[impl-block]]は書けるので、[[method]]や[[associated-function]]を持たせられます。上の例のように状態は持たずに処理だけをまとめたい型や、データは持たせずトレイトの実装だけを与えたいマーカー型が主な用途です。<!-- TODO: [[trait]] 作成後にリンク -->

## フィールドを持たない3つの書き方

フィールドが0個の構造体は次の3通りに書けます。型としてはどれもフィールドを持ちませんが、同じ名前で値の名前空間に何が定義されるかが異なります。

| 定義 | 種類 | `Marker`単体の意味 |
| --- | --- | --- |
| `struct Marker;` | ユニット様構造体 | インスタンス（暗黙の定数） |
| `struct Marker {}` | フィールド0個の構造体 | 値ではない（E0423エラー） |
| `struct Marker();` | フィールド0個の[[tuple-struct]] | コンストラクタ[[function]] |

`struct Marker {}`のような波括弧での生成はどの形でも書けるため、違いが出るのは`Marker`と単体で書いたときです。`struct Marker;`は`struct Marker {}`と`const Marker: Marker = Marker {};`を同時に書いたのと等価で[^1]、単体でインスタンスになるのはこの形だけです。

## 補足

:::details[サイズは0バイト・Debug出力は型名]
ユニット様構造体はフィールドを持たないため、実行時のメモリを占有しません。名前付きフィールドの構造体と同じく`#[derive(Debug)]`も使え、`{:?}`では型名がそのまま出力されます（[[console-output]]も参照）。

```rust playground
#[derive(Debug)]
struct Marker;

fn main() {
    println!("{}バイト", size_of::<Marker>()); // 0バイト
    println!("{:?}", Marker);                  // Marker
}
```
:::

:::details[標準ライブラリでの例]
`std::marker::PhantomData`は[[standard-library]]のマーカー型で、ジェネリクスを伴うユニット様構造体として`pub struct PhantomData<T> where T: ?Sized;`と宣言されています[^2]。実際に値を持たないまま「この型を使っているつもり」という情報だけをコンパイラに伝える、マーカー型の代表例です。<!-- TODO: [[generics]] 作成後にリンク -->
:::

[^1]: [The Rust Reference: Structs](https://doc.rust-lang.org/reference/items/structs.html) — フィールドリストを完全に省略した構造体をunit-like structと呼び、同名の定数を暗黙に定義すると述べています。
[^2]: [std::marker::PhantomData](https://doc.rust-lang.org/std/marker/struct.PhantomData.html) — 宣言そのものが記載されています。
