---
title: 第19章 derive属性と標準トレイト
description: deriveがトレイト実装の自動生成であること、Debugの{:?}と{:#?}、PartialEqとPartialOrdによる比較、deriveが全フィールドに実装を要求すること、Displayの手動実装とwrite!マクロ、Defaultと構造体更新記法、外部の型に外部のトレイトを実装できないオーファンルールまで、標準ライブラリのトレイトを自分の型に与える方法を手を動かして学ぶ8問。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "問題集"]
public: true
---

第18章で、`trait`宣言で振る舞いを定め、`impl トレイト名 for 型名`で型ごとに実装する仕組みを学びました。この章では、標準ライブラリがあらかじめ用意している**標準トレイト**を、自分の型に与える方法を8問で扱います。

実は、みなさんはすでに標準トレイトを使っています。第9章から何度も書いてきた`#[derive(Debug)]`がそれです。あのときは「`{:?}`で出力するためのおまじない」として扱いましたが、その正体は**トレイト実装の自動生成**です。`Debug`という標準トレイトの`impl`ブロックを、コンパイラが構造体の定義から書き起こしてくれていました。

`Debug`のほかにも、値を複製する`Clone`、`==`で比べる`PartialEq`、`<`で比べる`PartialOrd`、既定値を作る`Default`といった標準トレイトが`derive`で導出できます。一方で、利用者向けの表示を担う`Display`のように、導出できないので手で実装するトレイトもあります。この章では「`derive`で済むもの」と「手で書くもの」の両方を扱い、最後に「自分のものでない型にトレイトを実装しようとすると何が起きるか」を確かめます。

進め方は[第18章](/books/rust-learning/traits)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - deriveの正体

[[derive]]と[[clone]]と[[trait]]に関する問題です。
次のコードはコンパイルエラー（E0599）になります。`Item`の定義に1行足して修正してください。

```txt:期待する出力
原本: コーヒー 500円
控え: コーヒー 500円
```

<!-- rustc: expect E0599 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Item {
    name: String,
    price: u32,
}

fn main() {
    let item = Item {
        name: String::from("コーヒー"),
        price: 500,
    };
    let spare = item.clone();

    println!("原本: {} {}円", item.name, item.price);
    println!("控え: {} {}円", spare.name, spare.price);
}
```

::::details[解答例と解説]
```rust playground
#[derive(Clone)] // [!code ++]
struct Item {
    name: String,
    price: u32,
}

fn main() {
    let item = Item {
        name: String::from("コーヒー"),
        price: 500,
    };
    let spare = item.clone();

    println!("原本: {} {}円", item.name, item.price);
    println!("控え: {} {}円", spare.name, spare.price);
}
```
エラーメッセージは`no method named 'clone' found for struct 'Item' in the current scope`（E0599）です。第7章で`String`に対して`.clone()`を呼びましたが、自作の`Item`にはそのメソッドがありません。

`.clone()`は、`String`に生まれつき備わっているメソッドではなく、[[clone]]で扱っている標準ライブラリの`Clone`[[trait]]が定めるメソッドです。`String`は`Clone`を実装しているので`.clone()`が呼べ、`Item`は実装していないので呼べません。第18章で学んだ「トレイトを実装した型だけがそのメソッドを持つ」という規則が、そのまま当てはまっています。

ですから、第18章どおりに手で実装すれば直ります。

<!-- rustc: skip -->
```rust:手で書いた場合
impl Clone for Item {
    fn clone(&self) -> Self {
        Item {
            name: self.name.clone(),
            price: self.price.clone(),
        }
    }
}
```

ただ、この中身は「全フィールドを順に`.clone()`して詰め直す」だけの定型文です。フィールドが増えるたびに書き足すのも退屈ですし、書き忘れも起こります。そこで登場するのが[[derive]]です。

`#[derive(Clone)]`と定義の直前に書くと、コンパイラが**上の`impl`ブロックとまったく同じものを自動生成します**。`derive`は「導出する」という意味で、構造体の定義内容からトレイトの実装を導き出す、ということです。

第9章からずっと書いてきた`#[derive(Debug)]`も同じ仕組みです。あれは`Debug`トレイトの`impl`ブロックを自動生成していたのでした。`{:?}`で出力できるようになったのは、`Debug`トレイトの実装が裏で用意されていたからです。

`derive`で導出できる標準トレイトは、次の9種類に限られます。

| トレイト | 自動生成される実装 |
| --- | --- |
| `Clone` | 全フィールドを`.clone()`した複製を返す |
| `Copy` | ビット単位の複製でよいと宣言する |
| `Debug` | `{:?}`で型名・フィールド名・値を並べて表示する |
| `Default` | 全フィールドをその型の既定値で埋めた値を作る |
| `PartialEq` | 全フィールドの比較で`==`・`!=`を定義する |
| `Eq` | 同値関係が成り立つと宣言する |
| `PartialOrd` | フィールドの宣言順に比較して`<`などを定義する |
| `Ord` | 同じ順序づけを全順序として定義する |
| `Hash` | 全フィールドをハッシュ値の計算に混ぜ込む |

この章では、このうち`Debug`・`PartialEq`・`PartialOrd`・`Default`を順に扱います。

:::message{tip}
`#[derive(Clone, Debug)]`のように、カンマ区切りで複数のトレイトをまとめて導出できます。第12章の応用問題で書いた`#[derive(Debug, PartialEq)]`がこの形でした。
:::
::::

## 02 - Debugトレイトと整形出力

[[debug-trait]]と[[derive]]と[[console-output]]に関する問題です。
`order`を`{:?}`と`{:#?}`で1回ずつ出力してください。

```txt:期待する出力
Order { item: Item { name: "コーヒー", price: 500 }, count: 2 }
Order {
    item: Item {
        name: "コーヒー",
        price: 500,
    },
    count: 2,
}
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
#[derive(Debug)]
struct Item {
    name: String,
    price: u32,
}

#[derive(Debug)]
struct Order {
    item: Item,
    count: u32,
}

fn main() {
    let order = Order {
        item: Item {
            name: String::from("コーヒー"),
            price: 500,
        },
        count: 2,
    };

    // orderを{:?}で出力せよ

    // orderを{:#?}で出力せよ

}
```

::::details[解答例と解説]
```rust playground
#[derive(Debug)]
struct Item {
    name: String,
    price: u32,
}

#[derive(Debug)]
struct Order {
    item: Item,
    count: u32,
}

fn main() {
    let order = Order {
        item: Item {
            name: String::from("コーヒー"),
            price: 500,
        },
        count: 2,
    };

    // orderを{:?}で出力せよ
    println!("{:?}", order); // [!code ++]

    // orderを{:#?}で出力せよ
    println!("{:#?}", order); // [!code ++]
}
```
`{:?}`と`{:#?}`は、どちらも[[debug-trait]]の実装を呼び出す書式指定です。違いは見た目だけで、`{:?}`は1行に詰めて、`{:#?}`は**1フィールド1行に改行とインデントを付けて**表示します。`#`は「整形して表示せよ」という意味の指定で、pretty printと呼ばれます。

`#[derive(Debug)]`が生成する表示は、「型名、波括弧、フィールド名と値をカンマ区切りで並べる」という機械的なものです。フィールドの値もそれぞれの型の`Debug`実装で表示されるため、`item`の位置には`Item`の`Debug`表示がそのまま入れ子になり、`String`の値はダブルクォートで囲まれます。

今回のように構造体が入れ子になっていると、`{:?}`では1行が長くなって読みづらくなります。デバッグ中に中身を確認するなら`{:#?}`のほうが見やすい場面が多いです。

:::message{tip}
`Debug`は「開発者が中身を確認するための表示」であって、利用者に見せる表示ではありません。そのため出力の形式は将来のRustで変わる可能性があり、この出力を文字列として解析するようなコードは書くべきではないとされています。利用者向けの表示は問題06で扱う`Display`の担当です。
:::
::::

## 03 - PartialEqで等値比較

[[comparison-traits]]と[[derive]]に関する問題です。
次のコードはコンパイルエラー（E0369）になります。`Item`の定義に1行足して修正してください。

```txt:期待する出力
同じ商品か: true
同じ商品か: false
```

<!-- rustc: expect E0369 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Item {
    name: String,
    price: u32,
}

fn main() {
    let a = Item {
        name: String::from("コーヒー"),
        price: 500,
    };
    let b = Item {
        name: String::from("コーヒー"),
        price: 500,
    };
    let c = Item {
        name: String::from("紅茶"),
        price: 500,
    };

    println!("同じ商品か: {}", a == b);
    println!("同じ商品か: {}", a == c);
}
```

::::details[解答例と解説]
```rust playground
#[derive(PartialEq)] // [!code ++]
struct Item {
    name: String,
    price: u32,
}

fn main() {
    let a = Item {
        name: String::from("コーヒー"),
        price: 500,
    };
    let b = Item {
        name: String::from("コーヒー"),
        price: 500,
    };
    let c = Item {
        name: String::from("紅茶"),
        price: 500,
    };

    println!("同じ商品か: {}", a == b);
    println!("同じ商品か: {}", a == c);
}
```
エラーメッセージは`binary operation '==' cannot be applied to type 'Item'`（E0369）です。続けて`note: an implementation of 'PartialEq' might be missing for 'Item'`と、足りないものの名前まで教えてくれています。

第2章から当たり前のように使ってきた`==`ですが、Rustでは`==`も[[trait]]のメソッド呼び出しです。`a == b`は`PartialEq`トレイトの`eq`メソッドの呼び出し`a.eq(&b)`に展開されます。整数や`String`で`==`が使えたのは、それらの型が`PartialEq`を実装していたからで、自作の`Item`には実装がないため演算子が使えません。

`#[derive(PartialEq)]`を付けると、**全フィールドをそれぞれ`==`で比べ、すべて等しければ等しい**という実装が生成されます。`a`と`b`は`name`も`price`も同じなので`true`、`c`は`name`が違うので`false`です。`!=`も同時に使えるようになります。

[[comparison-traits]]で扱っているとおり、等価性のトレイトには`PartialEq`のほかに`Eq`もあります。`Eq`はメソッドを持たず「この型では必ず`a == a`が成り立つ」と宣言するだけのトレイトで、`==`を使うだけなら`PartialEq`で足ります。`Eq`が必要になる場面と、`Partial`という名前の意味は問題05で扱います。

:::message{tip}
第12章の応用問題で、テストのために`#[derive(Debug, PartialEq)]`を付けました。`assert_eq!`が2つの値を`==`で比べるため`PartialEq`が、一致しなかったときに両辺を`{:?}`で表示するため`Debug`が必要だったわけです。「`{:?}`も`==`も書いていないのに実装を要求される」ときは、このように[[macro]]や標準ライブラリの関数が裏で要求していることがよくあります。
:::
::::

## 04 - deriveは全フィールドに要求する

[[derive]]と[[struct]]に関する問題です。
次のコードはコンパイルエラー（E0277）になります。`Order`の`#[derive(Clone)]`は消さずに修正してください。

```txt:期待する出力
コーヒー ×2
コーヒー ×2
```

<!-- rustc: expect E0277 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Item {
    name: String,
    price: u32,
}

#[derive(Clone)]
struct Order {
    item: Item,
    count: u32,
}

fn main() {
    let order = Order {
        item: Item {
            name: String::from("コーヒー"),
            price: 500,
        },
        count: 2,
    };
    let spare = order.clone();

    println!("{} ×{}", order.item.name, order.count);
    println!("{} ×{}", spare.item.name, spare.count);
}
```

::::details[解答例と解説]
```rust playground
#[derive(Clone)] // [!code ++]
struct Item {
    name: String,
    price: u32,
}

#[derive(Clone)]
struct Order {
    item: Item,
    count: u32,
}

fn main() {
    let order = Order {
        item: Item {
            name: String::from("コーヒー"),
            price: 500,
        },
        count: 2,
    };
    let spare = order.clone();

    println!("{} ×{}", order.item.name, order.count);
    println!("{} ×{}", spare.item.name, spare.count);
}
```
エラーメッセージは`the trait bound 'Item: Clone' is not satisfied`（E0277）で、エラーの位置は`Order`の`item: Item`フィールドです。`Order`に`#[derive(Clone)]`を付けているのに、エラーになっています。

理由は、問題01で見た`derive`の生成コードを思い出すと分かります。`Order`の`Clone`実装は、各フィールドに対して`.clone()`を呼びます。

<!-- rustc: skip -->
```rust:Orderに対して生成される実装
impl Clone for Order {
    fn clone(&self) -> Self {
        Order {
            item: self.item.clone(), // ItemがCloneを実装していないと呼べない
            count: self.count.clone(),
        }
    }
}
```

`self.item.clone()`が呼べるためには、`Item`が`Clone`を実装していなければなりません。つまり`derive`は**フィールドの型に同じトレイトの実装を要求します**。`u32`や`String`のような標準ライブラリの型はたいてい実装済みなので意識せずに済みますが、フィールドが自作の型になったとたん、この条件が表に出てきます。

修正は、内側の`Item`にも`#[derive(Clone)]`を付けることです。これで`Order`の生成コードが成立し、`.clone()`が呼べるようになります。

この条件は`Clone`に限らず、問題01の表にあるどのトレイトでも同じです。`Order`に`#[derive(Debug)]`を付けるなら`Item`にも`Debug`が、`#[derive(PartialEq)]`を付けるなら`Item`にも`PartialEq`が必要です。列挙型の場合は、全バリアントが抱えるデータの型すべてが対象になります。

:::message{tip}
フィールドの型が自作の型なら、たいていは内側にも同じ`derive`を付ければ済みます。一方、フィールドの型が外部クレートの型で`derive`を付けられない場合は、外側の型の実装を手で書くことになります。
:::
::::

## 05 - PartialOrdで大小比較

[[comparison-traits]]と[[derive]]と[[comparison-operators]]に関する問題です。
次のコードはコンパイルエラー（E0369）になります。`Version`を`<`や`>`で比較できるように定義に1行足し、期待する出力と一致させてください。大小は`major`を先に比べ、同じなら`minor`で決めます。

```txt:期待する出力
1.9 < 2.0: true
2.0 > 2.1: false
1.9 < 1.10: true
```

<!-- rustc: expect E0369 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
// <や>で比較できるようにせよ
struct Version {
    major: u32,
    minor: u32,
}

fn main() {
    let v1 = Version { major: 1, minor: 9 };
    let v2 = Version { major: 2, minor: 0 };
    let v3 = Version { major: 2, minor: 1 };
    let v4 = Version { major: 1, minor: 10 };

    println!("1.9 < 2.0: {}", v1 < v2);
    println!("2.0 > 2.1: {}", v2 > v3);
    println!("1.9 < 1.10: {}", v1 < v4);
}
```

::::details[解答例と解説]
```rust playground
// <や>で比較できるようにせよ
#[derive(PartialEq, PartialOrd)] // [!code ++]
struct Version {
    major: u32,
    minor: u32,
}

fn main() {
    let v1 = Version { major: 1, minor: 9 };
    let v2 = Version { major: 2, minor: 0 };
    let v3 = Version { major: 2, minor: 1 };
    let v4 = Version { major: 1, minor: 10 };

    println!("1.9 < 2.0: {}", v1 < v2);
    println!("2.0 > 2.1: {}", v2 > v3);
    println!("1.9 < 1.10: {}", v1 < v4);
}
```
`<`・`<=`・`>`・`>=`の4つの[[comparison-operators]]は`PartialOrd`トレイトが担当します。`==`と同じく、`a < b`は`PartialOrd`のメソッド呼び出しに展開されるため、実装のない型には使えません（付けずに実行するとE0369です）。

`#[derive(PartialOrd)]`が生成するのは、**フィールドを宣言順に比べ、最初に差がついたフィールドで大小を決める**実装です。辞書の並び順と同じなので辞書式順序と呼びます。`Version`では`major`が先に宣言されているので`major`で決まり、同じときだけ`minor`で決まります。`1.9 < 1.10`が`true`になるのは、`minor`同士を`9 < 10`と数値で比べているからです。

つまり**フィールドの宣言順が比較の優先順位になります**。`minor`を先に宣言すると結果が変わるので、`derive`で順序を導出するときはフィールドの並びに意味があると意識してください。

`PartialOrd`は単独では付けられず、`PartialEq`とセットで書く必要があります。`PartialOrd`は`PartialEq`を前提とするトレイト（スーパートレイト）として定義されているためで、`PartialEq`を省くとE0277になります。

**`Partial`が付く理由**
`PartialOrd`の「部分的」という名前は、「比較しても大小が決まらない組み合わせがあってもよい」という意味です。代表例が浮動小数点型の`NaN`（非数。`0.0 / 0.0`などの結果）で、`NaN`はどの値と比べても`<`も`>`も`==`も`false`になります。`NaN == NaN`すら`false`です。

そのため`f64`や`f32`は`PartialEq`と`PartialOrd`だけを実装し、「必ず`a == a`が成り立つ」と宣言する`Eq`、「どの2つを比べても必ず決着が付く」と宣言する`Ord`は実装していません。ここから、自作の型でも**`f64`のフィールドを持つ型には`Eq`や`Ord`を導出できない**という制約が生まれます。

<!-- rustc: expect E0277 -->
```rust:f64を持つ型にEqを導出しようとした場合
#[derive(PartialEq, Eq)] // エラー: E0277（f64はEqを実装していない）
struct Weight {
    kg: f64,
}
```

`Version`のように整数だけでできた型なら`Eq`と`Ord`も導出できます。`Vec`の`sort`メソッドのように`Ord`を要求する場面があるので、整数だけの型には`#[derive(PartialEq, Eq, PartialOrd, Ord)]`と4つまとめて付けておくのが定番です。
::::

## 06 - Displayトレイトを実装する

[[display-trait]]と[[trait]]と[[macro]]に関する問題です。
次のコードはコンパイルエラー（E0277）になります。`Item`を`{}`で出力できるようにしてください。`derive`では解決できません。

```txt:期待する出力
コーヒー（500円）
```

<!-- rustc: expect E0277 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Item {
    name: String,
    price: u32,
}

// Itemを「〇〇（△△円）」の形で{}出力できるようにせよ

fn main() {
    let item = Item {
        name: String::from("コーヒー"),
        price: 500,
    };
    println!("{}", item);
}
```

::::details[解答例と解説]
```rust playground
use std::fmt; // [!code ++]

struct Item {
    name: String,
    price: u32,
}

// Itemを「〇〇（△△円）」の形で{}出力できるようにせよ
impl fmt::Display for Item { // [!code ++]
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { // [!code ++]
        write!(f, "{}（{}円）", self.name, self.price) // [!code ++]
    } // [!code ++]
} // [!code ++]

fn main() {
    let item = Item {
        name: String::from("コーヒー"),
        price: 500,
    };
    println!("{}", item);
}
```
エラーメッセージは`'Item' doesn't implement 'std::fmt::Display'`（E0277）です。第9章の問題04で「`#[derive(Debug)]`を付けても`{}`では出力できない」と触れましたが、その理由がここで明らかになります。`{:?}`が`Debug`トレイトを呼ぶのに対し、`{}`は[[display-trait]]という**別のトレイト**を呼ぶからです。

`Display`は`derive`できません。エラーメッセージのnoteにも`in format strings you may be able to use '{:?}' (or {:#?} for pretty-print) instead`とあり、`derive`を勧める文言はありません。`Debug`は「型名とフィールドを機械的に並べる」という決まった形があるので自動生成できますが、`Display`が担うのは**利用者に見せる表示**で、`price`を「500」と出すか「500円」と出すか、`name`を先にするか後にするかは型の意味によって変わります。コンパイラには決められないので、手で書きます。

**実装の形**
書くのは、第18章で学んだ`impl トレイト名 for 型名`そのものです。ただし見慣れない部品がいくつかあるので、1つずつ見ていきます。

<!-- rustc: skip -->
```rust:Displayの実装の形
use std::fmt;

impl fmt::Display for Item {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}（{}円）", self.name, self.price)
    }
}
```

- `use std::fmt;` — `Display`は標準ライブラリの`std::fmt`モジュールにあります。第14章で学んだとおり、モジュールごと`use`して`fmt::Display`・`fmt::Formatter`・`fmt::Result`と書くのが慣例です
- `fn fmt(&self, f: &mut fmt::Formatter)` — `Display`が要求する唯一のメソッドです。`f`は**出力先**で、画面に直接書くのではなく、この`f`に書き込みます。`println!`や`format!`が、この`f`を用意して`fmt`を呼び出しています
- `-> fmt::Result` — 戻り値は第12章の[[result]]です。`fmt::Result`は`Result<(), fmt::Error>`の別名で、書き込みに成功したら`Ok(())`、失敗したら`Err`を返します
- `write!(f, ...)` — `f`に書き込む[[macro]]です。`println!`が画面に出力するのに対し、`write!`は**第1引数で指定した出力先に書き込みます**。書式文字列の書き方は`println!`と同じです。戻り値が`fmt::Result`なので、`fmt`メソッドの末尾の式としてそのまま返せます

`Display`を実装すると、`{}`だけでなく`format!("{}", item)`や、第6章で使った`.to_string()`も`Item`に対して使えるようになります。`to_string`は「`Display`を実装したすべての型」に対して標準ライブラリがまとめて用意しているメソッドだからです。

:::message{tip}
`Debug`と`Display`は両方実装しておくのが普通です。`Debug`は`derive`で付けて開発中の確認に使い、利用者に見せる型にだけ`Display`を手で書きます。`Display`を実装した後も`{:?}`は`Debug`を、`{}`は`Display`を呼ぶので、2つの表示は互いに影響しません。
:::
::::

## 07 - Defaultトレイト

[[default-trait]]と[[derive]]と[[struct-update-syntax]]に関する問題です。
次のコードはコンパイルエラー（E0599・E0063）になります。`Settings`に既定値を作る機能を付け、コメントの指示どおりに2つのインスタンスを作って期待する出力と一致させてください。`Settings`の既定値は、すべてのフィールドがその型の既定値であるものとします。

```txt:期待する出力
Settings { volume: 0, dark_mode: false, nickname: "", coupon: None }
Settings { volume: 0, dark_mode: true, nickname: "", coupon: None }
```

<!-- rustc: expect E0599 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
#[derive(Debug)]
struct Settings {
    volume: u32,
    dark_mode: bool,
    nickname: String,
    coupon: Option<u32>,
}

fn main() {
    // すべて既定値のインスタンスを作れ
    let plain = Settings::default();
    // dark_modeだけtrueにし、残りは既定値のインスタンスを作れ
    let dark = Settings {
        dark_mode: true,
    };

    println!("{:?}", plain);
    println!("{:?}", dark);
}
```

::::details[解答例と解説]
```rust playground
#[derive(Debug, Default)] // [!code ++]
struct Settings {
    volume: u32,
    dark_mode: bool,
    nickname: String,
    coupon: Option<u32>,
}

fn main() {
    // すべて既定値のインスタンスを作れ
    let plain = Settings::default();
    // dark_modeだけtrueにし、残りは既定値のインスタンスを作れ
    let dark = Settings {
        dark_mode: true,
        ..Default::default() // [!code ++]
    };

    println!("{:?}", plain);
    println!("{:?}", dark);
}
```
修正前のコードには2つのエラーがあります。`Settings::default()`という関数が見つからないこと（E0599）と、`dark`の初期化でフィールドが足りないこと（E0063）です。どちらも[[default-trait]]で解決します。

`Default`は、その型の**既定値**を返す`default()`という[[associated-function]]を1つだけ要求するトレイトです。標準ライブラリの多くの型が実装済みで、`u32`なら`0`、`bool`なら`false`、`String`なら空文字列、`Option`なら`None`が既定値です。

`#[derive(Default)]`を付けると、**全フィールドをそれぞれの型の`default()`で埋めた値を返す**実装が生成されます。問題04で学んだとおり、全フィールドの型が`Default`を実装している必要がありますが、今回はすべて標準ライブラリの型なので条件を満たしています。これで`Settings::default()`が呼べるようになり、1行目の出力が得られます。

**`..Default::default()`**
第9章の問題05で学んだ[[struct-update-syntax]]は、`..base`と書くと指定しなかったフィールドを`base`から引き継ぐ記法でした。`..Default::default()`はその`base`の位置に「既定値のインスタンス」を置いたものです。`dark_mode`だけ明示し、残りの3フィールドは既定値のインスタンスから引き継がれます。

`Settings::default()`ではなく`Default::default()`と型名を省いて書けるのは、`..`の位置には`Settings`型の値しか置けないと決まっているため、コンパイラが[[type-inference]]で型を決められるからです。もちろん`..Settings::default()`と書いても構いません。

設定項目のように「たいていは既定値のままで、一部だけ変えたい」という型では、この`derive(Default)`と`..Default::default()`の組み合わせが定番です。フィールドが10個あっても、変えたい1個だけ書けば済みます。

:::message{tip}
既定値を「すべて型の既定値」以外にしたい場合（たとえば`volume`の既定を`50`にしたい場合）は、`derive`ではなく`impl Default for Settings`を手で書いて`default()`の中身を自分で決めます。`derive`で済むか手で書くかの分かれ目は、`Display`のときと同じ「機械的に決められるかどうか」です。
:::
::::

## 08 - オーファンルール

[[trait]]と[[display-trait]]と[[tuple-struct]]に関する問題です。
次のコードはコンパイルエラー（E0117）になります。`Vec<String>`を`{}`で出力しようとする方針はあきらめ、**自分で定義した型**に`Display`を実装する形に書き換えてください。

```txt:期待する出力
タグ: rust, trait, derive
```

<!-- rustc: expect E0117 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
use std::fmt;

impl fmt::Display for Vec<String> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "タグ: {}", self.join(", "))
    }
}

fn main() {
    let tags = vec![
        String::from("rust"),
        String::from("trait"),
        String::from("derive"),
    ];
    println!("{}", tags);
}
```

::::details[解答例と解説]
```rust playground
use std::fmt;

struct Tags(Vec<String>); // [!code ++]

impl fmt::Display for Vec<String> { // [!code --]
impl fmt::Display for Tags { // [!code ++]
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "タグ: {}", self.join(", ")) // [!code --]
        write!(f, "タグ: {}", self.0.join(", ")) // [!code ++]
    }
}

fn main() {
    let tags = vec![ // [!code --]
    let tags = Tags(vec![ // [!code ++]
        String::from("rust"),
        String::from("trait"),
        String::from("derive"),
    ]; // [!code --]
    ]); // [!code ++]
    println!("{}", tags);
}
```
エラーメッセージは`only traits defined in the current crate can be implemented for types defined outside of the crate`（E0117）です。`Display`も`Vec<String>`も標準ライブラリのもので、どちらも自分のクレートで定義した型ではありません。

Rustには、トレイトの実装を書ける場所に関して次の規則があります。

> `impl トレイト名 for 型名`は、**トレイトか型の少なくとも一方が自分のクレートで定義されている**ときだけ書ける

第18章では自作のトレイトを`u32`のような標準の型に実装しましたが、それはトレイトが自分のものだから許されていました。問題06で`Display`を`Item`に実装できたのは、型が自分のものだからです。今回はトレイトも型も外部のものなので、どちらの条件も満たしません。この規則を**オーファンルール**（孤児の規則）と呼びます。トレイトにも型にも「親」がいない実装、という意味です。

なぜこんな規則があるのかというと、実装の衝突を防ぐためです。もしこの規則がなければ、クレートAとクレートBがそれぞれ`Vec<String>`に`Display`を実装でき、両方に依存したプログラムでは「どちらの実装を使うのか」が決められなくなります。依存を1つ追加しただけでコンパイルが通らなくなる事態を避けるため、「1つの型に対する1つのトレイトの実装は、プログラム全体で1つに定まる」ことをこの規則が保証しています。

**ニュータイプで回避する**
それでも外部の型に外部のトレイトの振る舞いを与えたいときは、第9章の問題09で学んだニュータイプパターンを使います。`struct Tags(Vec<String>);`と、フィールドが1つだけの[[tuple-struct]]で`Vec<String>`を包みます。`Tags`は自分のクレートの型なので、`Display`を実装しても規則に反しません。

中身の`Vec<String>`には`self.0`でアクセスします。`join(", ")`は、ベクタの要素を区切り文字でつないで1つの`String`にするメソッドです。

ニュータイプで包むと、`Vec`のメソッドは`tags.0.len()`のように`.0`を経由して呼ぶ必要があります。少し手間ですが、「`Tags`は単なる文字列のベクタではなく、タグの一覧という意味を持った型だ」と宣言できる利点もあり、実務でもよく使われる手法です。

:::message{tip}
これで第19章は終わりです。`derive`の正体がトレイト実装の自動生成であること、`Debug`・`PartialEq`・`PartialOrd`・`Default`は導出で済み、`Display`は手で書くこと、そしてトレイトの実装を書ける場所にはオーファンルールという制限があることを押さえました。

次の第20章では、**トレイト境界**を扱います。第17章のジェネリクスと第18章のトレイトを組み合わせ、「`T`は`Display`を実装した型に限る」のように型引数に条件を付けて、この章で学んだ標準トレイトをジェネリックな関数の中から使えるようにします。
:::
::::
