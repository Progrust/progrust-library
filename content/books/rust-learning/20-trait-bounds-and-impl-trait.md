---
title: 第20章 トレイト境界とimpl Trait
description: 型引数に「このトレイトを実装していること」を要求するトレイト境界、+による複数指定とwhere句への切り出し、引数位置と戻り値位置で意味が変わるimpl Trait、戻り値のimpl Traitが1つの型しか返せない理由まで、ジェネリクスとトレイトを組み合わせる方法を手を動かして学ぶ7問。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "問題集"]
public: true
---

第17章でジェネリクス、第18章と第19章でトレイトを学びました。この章では、その2つを**組み合わせる**方法を7問で扱います。

第17章の型引数`T`は「どんな型でもよい」という意味でした。しかし、どんな型か分からない値に対してできることはほとんどありません。表示することも、大小を比べることも、自作のメソッドを呼ぶこともできません。「どんな型でもよい。ただし、このトレイトを実装していること」と条件を付けて初めて、`T`の値に対してそのトレイトのメソッドが使えるようになります。この条件を**トレイト境界**と呼びます。

前半では、境界のないジェネリック関数がコンパイルエラーになるところから始めて、境界の基本形、`+`による複数指定、`where`句への切り出しと、書き方を順に広げていきます。後半では、具体的な型名の代わりに「このトレイトを実装した型」とだけ書く`impl Trait`記法を扱います。引数の位置に書くとトレイト境界の省略形になり、戻り値の位置に書くと「具体的な型を隠して返す」という別の意味になります。最後に、戻り値の`impl Trait`が1つの型しか返せないことをエラーで体験します。

進め方は[第19章](/books/rust-learning/derive-and-standard-traits)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - トレイト境界で振る舞いを要求する

[[trait-bound]]と[[generics]]、[[trait]]に関する問題です。
`print_description`関数は、どんな型の値でも受け取って説明文を出力しようとしていますが、コンパイルエラーになります。エラーメッセージを読んで、関数のシグネチャを修正してください。

```txt:期待する出力
書籍『Rust入門』 3200円
数値 42
```

<!-- rustc: expect E0599 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Describe {
    fn describe(&self) -> String;
}

struct Book {
    title: String,
    price: u32,
}

impl Describe for Book {
    fn describe(&self) -> String {
        format!("書籍『{}』 {}円", self.title, self.price)
    }
}

impl Describe for u32 {
    fn describe(&self) -> String {
        format!("数値 {}", self)
    }
}

fn print_description<T>(item: T) {
    println!("{}", item.describe());
}

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
        price: 3200,
    };
    print_description(book);
    print_description(42u32);
}
```

::::details[解答例と解説]
```rust playground
trait Describe {
    fn describe(&self) -> String;
}

struct Book {
    title: String,
    price: u32,
}

impl Describe for Book {
    fn describe(&self) -> String {
        format!("書籍『{}』 {}円", self.title, self.price)
    }
}

impl Describe for u32 {
    fn describe(&self) -> String {
        format!("数値 {}", self)
    }
}

fn print_description<T>(item: T) { // [!code --]
fn print_description<T: Describe>(item: T) { // [!code ++]
    println!("{}", item.describe());
}

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
        price: 3200,
    };
    print_description(book);
    print_description(42u32);
}
```
エラーメッセージは`no method named 'describe' found for type parameter 'T' in the current scope`（E0599）です。「型引数`T`には`describe`というメソッドがない」と言われています。

`Book`にも`u32`にも`describe`は実装してあるのに、なぜ見つからないのでしょうか。第17章で学んだとおり、型引数`T`は「呼び出し側がどんな型を渡してもよい」という意味です。コンパイラは関数の中身を検査するとき、`T`が`Book`かもしれないし、`u32`かもしれないし、`describe`を持たない`String`や`bool`かもしれない、という前提で見ます。どんな型が来ても動くことを保証できない限り、`item.describe()`は認められません。

そこで、`T`に**条件を付けます**。`<T: Describe>`と書くと、「`T`は`Describe`トレイトを実装した型に限る」という意味になります。これが[[trait-bound]]です。境界を付けると、関数の中では`Describe`が宣言するメソッドを`T`の値に対して呼べるようになります。代わりに、`Describe`を実装していない型を渡すと呼び出し側がエラーになります。

<!-- rustc: skip -->
```rust:境界を満たさない型を渡すと呼び出し側でエラー
print_description(String::from("本")); // エラー: E0277（StringはDescribeを実装していない）
```

第18章では、トレイトを実装した型に対して`book.describe()`のように直接メソッドを呼んでいました。トレイト境界を使うと、「`Describe`を実装した型なら何でも受け取れる関数」が書けます。トレイトが本領を発揮するのは、この使い方からです。

:::message{tip}
境界のない`T`でできるのは、値をそのまま受け渡しする（ムーブする・参照を取る・構造体に格納する）程度のことだけです。第17章で書いた`swap_pair`や`Point<T>`はどれも、`T`の値に対して「何かをする」ことがなかったので境界が要りませんでした。`T`の値に対して何かをしたくなったら、トレイト境界の出番です。
:::
::::

## 02 - 最大値を求めるlargest関数

[[trait-bound]]と[[comparison-traits]]、[[generics]]に関する問題です。
`largest`関数は、[[slice]]の中で最大の要素への[[reference]]を返す関数です。整数でも浮動小数点数でも使えるようにジェネリックにしましたが、コンパイルエラーになります。シグネチャを修正してください。

```txt:期待する出力
最高価格: 980
最高気温: 37.2
```

<!-- rustc: expect E0369 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn largest<T>(list: &[T]) -> &T {
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let prices = [150, 980, 120, 450];
    println!("最高価格: {}", largest(&prices));

    let temperatures = [36.5, 37.2, 35.9];
    println!("最高気温: {}", largest(&temperatures));
}
```

::::details[解答例と解説]
```rust playground
fn largest<T>(list: &[T]) -> &T { // [!code --]
fn largest<T: PartialOrd>(list: &[T]) -> &T { // [!code ++]
    let mut largest = &list[0];

    for item in list {
        if item > largest {
            largest = item;
        }
    }

    largest
}

fn main() {
    let prices = [150, 980, 120, 450];
    println!("最高価格: {}", largest(&prices));

    let temperatures = [36.5, 37.2, 35.9];
    println!("最高気温: {}", largest(&temperatures));
}
```
エラーメッセージは`binary operation '>' cannot be applied to type '&T'`（E0369）です。「`&T`同士に`>`は使えない」と言われています。

第19章の問題05で学んだとおり、`<`や`>`による大小比較は[[comparison-traits]]の`PartialOrd`が担っています。`i32`や`f64`は`PartialOrd`を実装しているので比較できますが、境界のない`T`は「`PartialOrd`を実装していないかもしれない型」です。問題01と同じ理屈で、`T`の値同士の比較は認められません。

修正は`<T: PartialOrd>`と境界を付けるだけです。`T`が`PartialOrd`を実装していることが保証されるので、`>`が使えるようになります。呼び出し側の`i32`と`f64`はどちらも`PartialOrd`を実装しているので、そのまま動きます。

**`&T`を返している理由**
この関数は、最大の要素そのものではなく**要素への参照**`&T`を返しています。スライスの要素は借りているだけなので、第8章で学んだとおり中身を勝手にムーブして持ち出すことはできないからです。参照を返す形にしておけば、`T`がどんな型でも所有権の問題が起きません。

:::message{tip}
値そのものを返す`fn largest<T>(list: &[T]) -> T`の形で書きたい場合は、`T`が第7章で学んだ`Copy`型であることも要求する必要があります。`Copy`型なら、参照先の値をコピーして持ち出せるからです。その場合の書き方は、次の問題03で学ぶ複数の境界の指定を使って`<T: PartialOrd + Copy>`になります。問題03を解いたあとで、こちらの形にも書き換えてみてください。
:::
::::

## 03 - 複数のトレイト境界

[[trait-bound]]と[[display-trait]]に関する問題です。
`print_larger`関数は、2つの値を比べて大きいほうを出力します。比較のための境界は付けてありますが、まだコンパイルエラーになります。エラーメッセージを読んで、シグネチャを修正してください。

```txt:期待する出力
高いのは 980 です
高いのは 37.2 です
```

<!-- rustc: expect E0277 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
use std::fmt::Display;

fn print_larger<T: PartialOrd>(a: T, b: T) {
    if a > b {
        println!("高いのは {} です", a);
    } else {
        println!("高いのは {} です", b);
    }
}

fn main() {
    print_larger(150, 980);
    print_larger(36.5, 37.2);
}
```

::::details[解答例と解説]
```rust playground
use std::fmt::Display;

fn print_larger<T: PartialOrd>(a: T, b: T) { // [!code --]
fn print_larger<T: PartialOrd + Display>(a: T, b: T) { // [!code ++]
    if a > b {
        println!("高いのは {} です", a);
    } else {
        println!("高いのは {} です", b);
    }
}

fn main() {
    print_larger(150, 980);
    print_larger(36.5, 37.2);
}
```
エラーメッセージは`'T' doesn't implement 'std::fmt::Display'`（E0277）です。「`T`は`Display`を実装していない」と言われています。

`PartialOrd`の境界があるので`>`は使えますが、`{}`で出力するには第19章の問題06で学んだ[[display-trait]]が必要です。`PartialOrd`を実装しているからといって`Display`も実装しているとは限らないので、`{}`の部分が認められません。

要求するトレイトが複数あるときは、`+`でつなげて並べます。`<T: PartialOrd + Display>`は「`PartialOrd`**と**`Display`の両方を実装している型に限る」という意味です。どちらか一方だけ実装している型は受け付けません。

`Display`は`std::fmt`モジュールにあるので、`use std::fmt::Display;`で持ち込んでいます。第14章で学んだとおり、`use`なしで`T: std::fmt::Display`と書いても同じです。

:::message{tip}
境界は「関数の中で実際に使う振る舞い」の分だけ付けるのが原則です。この関数は比較と表示をするので2つ必要でしたが、比較しかしない問題02の`largest`には`PartialOrd`だけで十分でした。必要以上に境界を付けると、本来なら受け取れるはずの型まで弾いてしまいます。
:::
::::

## 04 - where句

[[trait-bound]]に関する問題です。
`print_ranking`関数は、2つの項目を比べてスコアの高い順に出力します。境界が2つの型引数に分かれて`<>`の中が長くなっているので、`where`句を使って同じ意味のまま読みやすく書き換えてください。出力は変わりません。

```txt:期待する出力
[価格ランキング] 1位: メロン(980) 2位: りんご(150)
[人気ランキング] 1位: 本店(4.5) 2位: 駅前店(3.8)
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
use std::fmt::Display;

fn print_ranking<T: Display + PartialOrd, U: Display>(title: U, name_a: &str, score_a: T, name_b: &str, score_b: T) {
    if score_a >= score_b {
        println!("[{}] 1位: {}({}) 2位: {}({})", title, name_a, score_a, name_b, score_b);
    } else {
        println!("[{}] 1位: {}({}) 2位: {}({})", title, name_b, score_b, name_a, score_a);
    }
}

fn main() {
    print_ranking("価格ランキング", "りんご", 150, "メロン", 980);
    print_ranking(String::from("人気ランキング"), "本店", 4.5, "駅前店", 3.8);
}
```

::::details[解答例と解説]
```rust playground
use std::fmt::Display;

fn print_ranking<T: Display + PartialOrd, U: Display>(title: U, name_a: &str, score_a: T, name_b: &str, score_b: T) { // [!code --]
fn print_ranking<T, U>(title: U, name_a: &str, score_a: T, name_b: &str, score_b: T) // [!code ++]
where // [!code ++]
    T: Display + PartialOrd, // [!code ++]
    U: Display, // [!code ++]
{ // [!code ++]
    if score_a >= score_b {
        println!("[{}] 1位: {}({}) 2位: {}({})", title, name_a, score_a, name_b, score_b);
    } else {
        println!("[{}] 1位: {}({}) 2位: {}({})", title, name_b, score_b, name_a, score_a);
    }
}

fn main() {
    print_ranking("価格ランキング", "りんご", 150, "メロン", 980);
    print_ranking(String::from("人気ランキング"), "本店", 4.5, "駅前店", 3.8);
}
```
`where`句は、トレイト境界を`<>`の中から**シグネチャの後ろ**へ切り出す書き方です。`<T, U>`には型引数の名前だけを残し、引数リストと戻り値の型の後ろに`where`を置いて、型引数ごとに境界を1行ずつ書きます。

<!-- rustc: skip -->
```rust:2つの書き方は同じ意味
fn f<T: Display + PartialOrd, U: Display>(title: U, score: T)

fn f<T, U>(title: U, score: T)
where
    T: Display + PartialOrd,
    U: Display,
```

意味はまったく同じで、どちらを使うかは読みやすさの問題です。型引数が1つで境界も1つなら`<T: Display>`の形で十分です。型引数が増えたり境界が増えたりして、引数リストが境界に埋もれて読みにくくなってきたら`where`句に切り出します。本体の`{`は`where`句の後ろに来ることに注意してください。

**`U`が別の型引数になっている理由**
`title`には`&str`と`String`という違う型を渡しています。第17章の問題03で学んだとおり、1つの型引数は1つの型にしか決まらないので、`score`用の`T`とは別に`title`用の`U`を用意しています。`U`は表示するだけなので、境界は`Display`だけです。

:::message{tip}
`where`句には、`<T: Display>`の形では書けない境界も書けます。たとえば「`T`そのものではなく、`T`に関連する別の型」に条件を付けたいとき（第21章で学ぶ関連型など）は`where`句が必要になります。今は「境界が長くなったら`where`に切り出せる」と覚えておけば十分です。
:::
::::

## 05 - 引数位置のimpl Trait

[[impl-trait]]と[[trait-bound]]に関する問題です。
`notify`関数は、引数の型に`&impl Summary`という見慣れない書き方をしています。関数の中身を書いて、受け取った値の要約を通知として出力してください。

```txt:期待する出力
【通知】新刊『Rust入門』が入荷しました
【通知】セール: りんごが150円
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Summary {
    fn summarize(&self) -> String;
}

struct NewArrival {
    title: String,
}

impl Summary for NewArrival {
    fn summarize(&self) -> String {
        format!("新刊『{}』が入荷しました", self.title)
    }
}

struct Sale {
    name: String,
    price: u32,
}

impl Summary for Sale {
    fn summarize(&self) -> String {
        format!("セール: {}が{}円", self.name, self.price)
    }
}

fn notify(item: &impl Summary) {
    // 【通知】に続けて item の要約を出力せよ

}

fn main() {
    let arrival = NewArrival {
        title: String::from("Rust入門"),
    };
    let sale = Sale {
        name: String::from("りんご"),
        price: 150,
    };
    notify(&arrival);
    notify(&sale);
}
```

::::details[解答例と解説]
```rust playground
trait Summary {
    fn summarize(&self) -> String;
}

struct NewArrival {
    title: String,
}

impl Summary for NewArrival {
    fn summarize(&self) -> String {
        format!("新刊『{}』が入荷しました", self.title)
    }
}

struct Sale {
    name: String,
    price: u32,
}

impl Summary for Sale {
    fn summarize(&self) -> String {
        format!("セール: {}が{}円", self.name, self.price)
    }
}

fn notify(item: &impl Summary) {
    // 【通知】に続けて item の要約を出力せよ
    println!("【通知】{}", item.summarize()); // [!code ++]
}

fn main() {
    let arrival = NewArrival {
        title: String::from("Rust入門"),
    };
    let sale = Sale {
        name: String::from("りんご"),
        price: 150,
    };
    notify(&arrival);
    notify(&sale);
}
```
引数の型の位置に書いた`impl Summary`は、「`Summary`を実装した何らかの型」という意味です。`item.summarize()`と、`Summary`が宣言するメソッドをそのまま呼べます。

実はこの書き方は、ここまで学んできたトレイト境界の**省略形**です。次の2つは同じ意味になります。

<!-- rustc: skip -->
```rust:2つの書き方はほぼ同じ意味
fn notify(item: &impl Summary)

fn notify<T: Summary>(item: &T)
```

`impl Summary`と書くと、コンパイラが名前のない型引数を1つ用意して、`Summary`の境界を付けてくれます。型引数に名前を付ける必要がなく、境界が引数のすぐ隣に書けるので、引数が1つだけの単純な関数ではこちらのほうが簡潔です。

**同じにならない場面**
省略形なので、型引数の名前を使って表現していたことは書けません。たとえば問題03の`print_larger<T: PartialOrd + Display>(a: T, b: T)`は「`a`と`b`は**同じ型**」という意味を`T`の名前で表していました。これを`print_larger(a: impl PartialOrd + Display, b: impl PartialOrd + Display)`と書き換えると、`a`と`b`は別々の名前のない型引数になり、同じ型である保証がなくなるので`a > b`が比較できなくなります。複数の引数を同じ型に揃えたいときは、`<T: Trait>`の形で書いてください。

:::message{tip}
`&impl Summary`の`&`は、第8章で学んだ参照の`&`そのものです。「`Summary`を実装した何らかの型の参照」を受け取っているので、呼び出し側は`notify(&arrival)`と参照を渡し、`arrival`の所有権は呼び出し側に残ります。`fn notify(item: impl Summary)`と`&`なしで書けば値を受け取る形になり、呼び出し側は`notify(arrival)`とムーブで渡すことになります。
:::
::::

## 06 - 戻り値位置のimpl Trait

[[impl-trait]]に関する問題です。
`featured`関数は、本日のおすすめとして`Sale`を返しています。この関数の戻り値の型を、`Sale`という具体的な型名を書かずに「`Summary`を実装した何らかの型」と宣言するように書き換えてください。出力は変わりません。

```txt:期待する出力
本日のおすすめ: セール: メロンが980円
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Summary {
    fn summarize(&self) -> String;
}

struct Sale {
    name: String,
    price: u32,
}

impl Summary for Sale {
    fn summarize(&self) -> String {
        format!("セール: {}が{}円", self.name, self.price)
    }
}

fn featured() -> Sale {
    Sale {
        name: String::from("メロン"),
        price: 980,
    }
}

fn main() {
    let item = featured();
    println!("本日のおすすめ: {}", item.summarize());
}
```

::::details[解答例と解説]
```rust playground
trait Summary {
    fn summarize(&self) -> String;
}

struct Sale {
    name: String,
    price: u32,
}

impl Summary for Sale {
    fn summarize(&self) -> String {
        format!("セール: {}が{}円", self.name, self.price)
    }
}

fn featured() -> Sale { // [!code --]
fn featured() -> impl Summary { // [!code ++]
    Sale {
        name: String::from("メロン"),
        price: 980,
    }
}

fn main() {
    let item = featured();
    println!("本日のおすすめ: {}", item.summarize());
}
```
戻り値の型の位置に`impl Summary`と書くと、「`Summary`を実装した**具体的な型を1つ**返す」という意味になります。実際に返しているのは`Sale`ですが、呼び出し側にはその型名が伏せられ、「`Summary`を実装した何かが返ってくる」ことだけが伝わります。

引数位置の`impl Trait`（問題05）と見た目は同じですが、役割は逆です。

| 観点 | 引数位置 `fn f(x: impl Summary)` | 戻り値位置 `fn f() -> impl Summary` |
| --- | --- | --- |
| 具体的な型を決めるのは | 呼び出し側（渡した値の型） | 関数側（`return`した値の型） |
| 呼び出しごとの型 | 渡した型ごとに変わる | 関数ごとに1つに固定される |

**呼び出し側から見えるもの**
呼び出し側の`item`は「`Summary`を実装した何か」なので、使えるのは`Summary`が宣言するメソッドだけです。`Sale`が持つ`name`や`price`というフィールドには触れません。試しに`main`に`println!("{}", item.price);`を足してみると、「`impl Summary`型に`price`というフィールドはない」というエラーになります。

<!-- rustc: expect E0609 -->
```rust
trait Summary {
    fn summarize(&self) -> String;
}

struct Sale {
    name: String,
    price: u32,
}

impl Summary for Sale {
    fn summarize(&self) -> String {
        format!("セール: {}が{}円", self.name, self.price)
    }
}

fn featured() -> impl Summary {
    Sale {
        name: String::from("メロン"),
        price: 980,
    }
}

fn main() {
    let item = featured();
    println!("{}", item.price); // エラー: E0609（impl Summary に price というフィールドはない）
}
```

不便に見えるかもしれませんが、これは「この関数は`Summary`の振る舞いだけを約束する」という宣言でもあります。あとで`featured`が`Sale`ではなく`NewArrival`を返すように変更しても、呼び出し側が`Summary`のメソッドしか使っていなければ何も壊れません。

:::message{tip}
戻り値の`impl Trait`が本当に役立つのは、**型名を書けない型**や**型名が長すぎる型**を返すときです。この先の章で学ぶクロージャは型に名前がなく、イテレータはメソッドをつなげるほど型名が複雑になります。そのような値を返す関数では、`impl Fn(u32) -> u32`や`impl Iterator<Item = u32>`のように書くのが定番です。この章では仕組みだけ押さえておいてください。
:::
::::

## 07 - 戻り値のimpl Traitは1つの型だけ

[[impl-trait]]と[[if-expression]]に関する問題です。
`choose_shipping`関数は、急ぎかどうかで配送方法を切り替えて返そうとしていますが、コンパイルエラーになります。なぜエラーになるのかを考え、`choose_shipping`の戻り値の型は`impl Shipping`のままで、どちらの場合も**同じ型**を返す形に修正してください。

```txt:期待する出力
速達: 翌日お届け
通常便: 3〜5日でお届け
```

<!-- rustc: expect E0308 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Shipping {
    fn describe(&self) -> String;
}

struct Express;

impl Shipping for Express {
    fn describe(&self) -> String {
        String::from("速達: 翌日お届け")
    }
}

struct Standard;

impl Shipping for Standard {
    fn describe(&self) -> String {
        String::from("通常便: 3〜5日でお届け")
    }
}

fn choose_shipping(urgent: bool) -> impl Shipping {
    if urgent { Express } else { Standard }
}

fn main() {
    println!("{}", choose_shipping(true).describe());
    println!("{}", choose_shipping(false).describe());
}
```

::::details[解答例と解説]
```rust playground
trait Shipping {
    fn describe(&self) -> String;
}

struct Express; // [!code --]
enum Delivery { // [!code ++]
    Express, // [!code ++]
    Standard, // [!code ++]
} // [!code ++]

impl Shipping for Express { // [!code --]
impl Shipping for Delivery { // [!code ++]
    fn describe(&self) -> String {
        String::from("速達: 翌日お届け") // [!code --]
    } // [!code --]
} // [!code --]

struct Standard; // [!code --]

impl Shipping for Standard { // [!code --]
    fn describe(&self) -> String { // [!code --]
        String::from("通常便: 3〜5日でお届け") // [!code --]
        match self { // [!code ++]
            Delivery::Express => String::from("速達: 翌日お届け"), // [!code ++]
            Delivery::Standard => String::from("通常便: 3〜5日でお届け"), // [!code ++]
        } // [!code ++]
    }
}

fn choose_shipping(urgent: bool) -> impl Shipping {
    if urgent { Express } else { Standard } // [!code --]
    if urgent { Delivery::Express } else { Delivery::Standard } // [!code ++]
}

fn main() {
    println!("{}", choose_shipping(true).describe());
    println!("{}", choose_shipping(false).describe());
}
```
エラーメッセージは`'if' and 'else' have incompatible types`（E0308）で、`expected 'Express', found 'Standard'`と続きます。「`if`と`else`で返す型が食い違っている」と言われています。

`Express`も`Standard`も`Shipping`を実装しているのだから、どちらを返しても`impl Shipping`の条件は満たしているように見えます。しかし問題06で学んだとおり、戻り値の`impl Shipping`は「`Shipping`を実装した**具体的な型を1つ**返す」という意味です。`impl Shipping`の裏側には隠された具体的な型が1つだけあり、関数のどの経路を通っても同じ型に決まらなければなりません。最初の経路で`Express`と決まった以上、`else`側で`Standard`を返すことはできません。

**同じ型を返す形に直す**
どちらの経路でも同じ型を返せばよいので、2つの構造体を1つの型にまとめます。「速達か通常便か」は第11章で学んだ[[enum]]がちょうど合います。`Delivery`という列挙型に`Express`と`Standard`の2バリアントを持たせ、`Shipping`の実装は`Delivery`に対して1つだけ書き、`describe`の中で[[match-expression]]を使って出し分けます。こうすれば`if`の両方の経路が`Delivery`型になり、`impl Shipping`の裏側の型も`Delivery`の1つに決まります。

**実行時に型を切り替えたいときは**
この問題のように「条件によって違う型を返したい」という要求は珍しくありません。どうしても別々の型のまま返したい場合は、`impl Shipping`ではなく`Box<dyn Shipping>`という**トレイトオブジェクト**を使います。`impl Trait`がコンパイル時に型を1つに決める仕組みなのに対し、トレイトオブジェクトは実行時にどの型かを判別する仕組みです。こちらは次の第21章で扱います。

:::message{tip}
これで第20章は終わりです。トレイト境界で「どんな型でもよい」に条件を付ける方法、`+`と`where`句による書き方、引数位置と戻り値位置で役割の変わる`impl Trait`まで押さえました。ジェネリクスとトレイトを組み合わせることで、「特定の振る舞いを持つ型なら何でも受け取れる関数」と「振る舞いだけを約束して型を隠す関数」の両方が書けるようになっています。

次の第21章では、この問題で触れた**トレイトオブジェクト**`dyn Trait`を扱います。`Vec`に異なる型を混在させたり、実行時にどの実装を呼ぶかを決めたりできる仕組みで、`impl Trait`との使い分けも整理します。あわせて、トレイトの中で型を決める**関連型**と、`+`などの演算子を自作の型で使えるようにする演算子オーバーロードも学びます。
:::
::::
