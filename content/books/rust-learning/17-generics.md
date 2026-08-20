---
title: 第17章 ジェネリクス
description: 型ごとに重複した関数を型引数<T>で1つにまとめるジェネリック関数、Point<T>のようなジェネリック構造体、型引数が1つの型に決まる仕組みと複数の型引数、impl<T>によるメソッド定義、OptionとResultの正体であるジェネリック列挙型まで、「具体的な型は後から決める」書き方を手を動かして学ぶ6問。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "問題集"]
public: true
---

第13章から第16章までのプロジェクト構成編で、書いたコードをモジュールやクレートに整理し、外からどう見せるかを決められるようになりました。この章からは話題が変わり、**トレイト編**（第17章〜第22章）に入ります。扱うのは、Rustの型システムの中核である「型をまたいで共通の仕組みを書く」ための道具です。

トレイト編の見取り図は次のとおりです。この第17章では**ジェネリクス**、つまり「具体的な型は後から決める」書き方を学びます。第18章では型に共通の振る舞いを約束させる**トレイト**、第19章では`#[derive]`で自動実装できる**標準トレイト**、第20章ではジェネリクスとトレイトを結び付ける**トレイト境界**と`impl Trait`、第21章では実行時に実装を選ぶ**トレイトオブジェクト**と**関連型**、第22章では参照の有効期間を型に書く**ライフタイム注釈**へ進みます。

ジェネリクスは、すでに何度も使ってきています。第12章の`Option<T>`や`Result<T, E>`の`<T>`がそれです。あのときは「どんな型でも入る」という意味の書き方だと紹介するにとどめましたが、この章では自分で`<T>`付きの関数・構造体・列挙型を定義し、`i32`用と`f64`用の同じコードを書き分けなくて済むようにしていきます。

なお、この章の型引数`T`に対してできるのは「値を受け取る・包む・取り出す・入れ替える」といった、値の中身に触らない操作だけです。`T`の値同士を足したり表示したりするには、第18章のトレイトと第20章のトレイト境界が必要になります。その制約も含めて、まずはジェネリクスそのものの形を6問で押さえます。

進め方は[第16章](/books/rust-learning/public-api-and-external-packages)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - ジェネリック関数

[[generics]]と[[function]]に関する問題です。
タプルの前後を入れ替える関数が、型ごとに`swap_i32`と`swap_f64`の2つに分かれています。さらに`&str`のタプルでも使いたくなりました。3つ目の関数を追加するのではなく、**型引数を使った1つの関数`swap`にまとめ**、`main`のコメントアウトされた行を有効にして期待する出力に合わせてください。

```txt:期待する出力
(2, 1)
(2.5, 1.5)
(白組, 赤組)
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn swap_i32(pair: (i32, i32)) -> (i32, i32) {
    (pair.1, pair.0)
}

fn swap_f64(pair: (f64, f64)) -> (f64, f64) {
    (pair.1, pair.0)
}

fn main() {
    let numbers = swap_i32((1, 2));
    println!("({}, {})", numbers.0, numbers.1);

    let decimals = swap_f64((1.5, 2.5));
    println!("({}, {})", decimals.0, decimals.1);

    // let teams = swap(("赤組", "白組"));
    // println!("({}, {})", teams.0, teams.1);
}
```

::::details[解答例と解説]
```rust playground
fn swap_i32(pair: (i32, i32)) -> (i32, i32) { // [!code --]
    (pair.1, pair.0) // [!code --]
} // [!code --]
 // [!code --]
fn swap_f64(pair: (f64, f64)) -> (f64, f64) { // [!code --]
    (pair.1, pair.0) // [!code --]
} // [!code --]
fn swap<T>(pair: (T, T)) -> (T, T) { // [!code ++]
    (pair.1, pair.0) // [!code ++]
} // [!code ++]

fn main() {
    let numbers = swap_i32((1, 2)); // [!code --]
    let numbers = swap((1, 2)); // [!code ++]
    println!("({}, {})", numbers.0, numbers.1);

    let decimals = swap_f64((1.5, 2.5)); // [!code --]
    let decimals = swap((1.5, 2.5)); // [!code ++]
    println!("({}, {})", decimals.0, decimals.1);

    // let teams = swap(("赤組", "白組")); // [!code --]
    // println!("({}, {})", teams.0, teams.1); // [!code --]
    let teams = swap(("赤組", "白組")); // [!code ++]
    println!("({}, {})", teams.0, teams.1); // [!code ++]
}
```
`swap_i32`と`swap_f64`の本体は`(pair.1, pair.0)`で完全に同じです。違うのは型だけなので、その**型のほうを引数にしてしまう**のが[[generics]]の考え方です。

関数名の直後に`<T>`と書くと、「この関数の中では`T`という名前の型を使う。具体的に何の型かは呼び出し側が決める」という宣言になります。宣言した`T`は、引数や戻り値の型の中で`i32`や`&str`と同じように使えます。`(T, T)`なら「同じ型`T`の値を2つ持つタプル」です。

呼び出す側は、`swap::<i32>((1, 2))`のように型を書く必要はありません。`(1, 2)`を渡せば`T`は`i32`、`(1.5, 2.5)`なら`f64`、`("赤組", "白組")`なら`&str`と、引数から[[type-inference]]で決まります。第1章以来ずっと`let x = 1`で型注釈を省いてきたのと同じ仕組みが、型引数にも働いています。

**実行時のコストはゼロ**
「型が決まっていない関数」が実行時に動いているように見えますが、そうではありません。コンパイラは、`swap`が実際に使われた型（ここでは`i32`・`f64`・`&str`の3つ）ごとに、専用の関数を別々に生成します。つまり問題のコードで手書きしていた`swap_i32`と`swap_f64`を、コンパイラが代わりに書いてくれるわけです。この処理を**単相化**と呼びます。実行時には手書きした場合とまったく同じコードが動くので、ジェネリクスを使ってもプログラムは遅くなりません。

:::message{tip}
`T`という名前に決まりはなく、`<U>`でも`<Item>`でも構いません。ただし慣習として、特に意味を持たせない型引数には`T`（Typeの頭文字）を使い、2つ目以降は`U`・`V`と続けます。`Option<T>`や`Result<T, E>`の`T`もこの慣習に従った名前です。
:::
::::

## 02 - ジェネリック構造体

[[generics]]と[[struct]]に関する問題です。
`Point`構造体は整数の座標しか持てません。`main`のコメントアウトされた行にある小数の座標も作れるように、`Point`を**型引数を持つ構造体**に書き換えて、期待する出力に合わせてください。

```txt:期待する出力
整数の点: (3, 5)
小数の点: (1.5, 2.5)
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let integer = Point { x: 3, y: 5 };
    println!("整数の点: ({}, {})", integer.x, integer.y);

    // let float = Point { x: 1.5, y: 2.5 };
    // println!("小数の点: ({}, {})", float.x, float.y);
}
```

::::details[解答例と解説]
```rust playground
struct Point { // [!code --]
    x: i32, // [!code --]
    y: i32, // [!code --]
struct Point<T> { // [!code ++]
    x: T, // [!code ++]
    y: T, // [!code ++]
}

fn main() {
    let integer = Point { x: 3, y: 5 };
    println!("整数の点: ({}, {})", integer.x, integer.y);

    // let float = Point { x: 1.5, y: 2.5 }; // [!code --]
    // println!("小数の点: ({}, {})", float.x, float.y); // [!code --]
    let float = Point { x: 1.5, y: 2.5 }; // [!code ++]
    println!("小数の点: ({}, {})", float.x, float.y); // [!code ++]
}
```
関数と同じように、[[struct]]も名前の直後に`<T>`を付けると型引数を持てます。宣言した`T`はフィールドの型として使えるので、`x: T`・`y: T`と書けば「座標の型は後から決める」構造体になります。

インスタンスを作るときの書き方は、第9章で学んだ`Point { x: 3, y: 5 }`のままです。`3`と`5`を渡せば`T`は`i32`、`1.5`と`2.5`なら`f64`と、フィールドの値から推論されます。明示したい場合は`let float: Point<f64> = ...`のように型注釈で書けます。

ここで1つ押さえておきたいのは、`Point<i32>`と`Point<f64>`は**別の型**だということです。`Point<T>`は「型を1つ受け取って型を作る型」で、`T`を埋めてはじめて具体的な型になります。第12章で`Option<u32>`と`u32`が別の型だったのと同じで、`Point<i32>`の値を`Point<f64>`が必要な場所には渡せません。この性質は次の問題03で確かめます。

:::message{tip}
型引数を持つ構造体も、コンパイル時に単相化されます。このコードでは`Point<i32>`用と`Point<f64>`用の2つの構造体が生成され、それぞれ`i32`を2つ・`f64`を2つ並べたメモリ配置になります。「どんな型でも入る箱」が実行時に存在するわけではありません。
:::
::::

## 03 - 型引数は1つの型に決まる

[[generics]]と[[type-inference]]に関する問題です。
次のコードはコンパイルエラー（E0308）になります。エラーメッセージを読んで原因を考え、`Point`の定義は変えずに**`main`側だけを修正**してコンパイルが通るようにしてください。

```txt:期待する出力
(5, 2.5)
```

<!-- rustc: expect E0308 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let point = Point { x: 5, y: 2.5 };
    println!("({}, {})", point.x, point.y);
}
```

::::details[解答例と解説]
```rust playground
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let point = Point { x: 5, y: 2.5 }; // [!code --]
    let point = Point { x: 5.0, y: 2.5 }; // [!code ++]
    println!("({}, {})", point.x, point.y);
}
```
エラーメッセージは`mismatched types`（E0308）で、`expected integer, found floating-point number`と続きます。「整数を期待していたのに小数が来た」という意味です。

`Point<T>`の`T`は、1つのインスタンスの中では**必ず1つの型**に決まります。`x: 5`を見たコンパイラは`T`を整数だと推論し、その時点で`y`も同じ整数型であることが確定します。そこへ`2.5`という小数が来たので、`y`の場所でエラーになりました。`x: T, y: T`と書いた以上、「`x`は`i32`で`y`は`f64`」という組み合わせは存在しません。

修正は、どちらかに型を合わせることです。解答例では`x`を`5.0`にして両方を`f64`にしました。`println!`は`f64`の`5.0`を`5`と表示するので、期待する出力のとおりになります。

:::message{tip}
`5`を`5.0`と書き直すのは、問題の回避としては正解ですが、「`x`と`y`で違う型を使いたい」という要望そのものには応えていません。それを実現するには定義側を変える必要があります。次の問題04で扱います。
:::
::::

## 04 - 複数の型引数

[[generics]]と[[struct]]に関する問題です。
問題03と同じコードです。今度は`main`には手を入れず、`x`と`y`に**別々の型を入れられるように`Point`の定義側を修正**してコンパイルが通るようにしてください。

```txt:期待する出力
(5, 2.5)
```

<!-- rustc: expect E0308 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let point = Point { x: 5, y: 2.5 };
    println!("({}, {})", point.x, point.y);
}
```

::::details[解答例と解説]
```rust playground
struct Point<T> { // [!code --]
    x: T, // [!code --]
    y: T, // [!code --]
struct Point<T, U> { // [!code ++]
    x: T, // [!code ++]
    y: U, // [!code ++]
}

fn main() {
    let point = Point { x: 5, y: 2.5 };
    println!("({}, {})", point.x, point.y);
}
```
型引数は、カンマで区切って何個でも宣言できます。`Point<T, U>`として`x: T`・`y: U`とすれば、`x`と`y`の型は独立に決まるようになります。`Point { x: 5, y: 2.5 }`なら`T`は`i32`、`U`は`f64`です。

もちろん、`T`と`U`が**違う型でなければならない**わけではありません。`Point { x: 1, y: 2 }`と書けば`T`も`U`も`i32`になります。「同じでもよいし違ってもよい」のが複数の型引数で、「必ず同じ」を表すのが問題03の`Point<T>`です。

**型引数の数は必要最小限に**
別々の型を入れられるほうが柔軟に見えますが、型引数を増やすほど定義は読みにくくなります。座標のように「`x`と`y`は同じ型であってほしい」場面では`Point<T>`のままにしておくほうが、意図が明確で、異なる型を混ぜてしまうミスもコンパイラが防いでくれます。型引数を増やすのは、本当に異なる型を組み合わせる必要があるときだけにしましょう。

:::message{tip}
問題03と問題04は、同じエラーに対する2通りの直し方でした。「値の側を定義に合わせる」か「定義の側を値に合わせる」か、どちらが正しいかはコードの意図で決まります。エラーメッセージを見てすぐに手元を直すのではなく、「そもそもこの型は何を表したかったのか」に立ち返ると判断しやすくなります。
:::
::::

## 05 - ジェネリックなimplブロック

[[generics]]と[[impl-block]]と[[method]]に関する問題です。
`Point`の`x`と`y`を入れ替える`swap`メソッドが、`Point<i32>`に対してだけ定義されています。`main`のコメントアウトされた行にある`Point<f64>`でも同じメソッドを使えるように、`impl`ブロックを**どの`T`に対しても有効な形**に書き換えて、期待する出力に合わせてください。

```txt:期待する出力
(5, 3)
(2.5, 1.5)
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
struct Point<T> {
    x: T,
    y: T,
}

impl Point<i32> {
    fn swap(self) -> Point<i32> {
        Point { x: self.y, y: self.x }
    }
}

fn main() {
    let integer = Point { x: 3, y: 5 }.swap();
    println!("({}, {})", integer.x, integer.y);

    // let float = Point { x: 1.5, y: 2.5 }.swap();
    // println!("({}, {})", float.x, float.y);
}
```

::::details[解答例と解説]
```rust playground
struct Point<T> {
    x: T,
    y: T,
}

impl Point<i32> { // [!code --]
    fn swap(self) -> Point<i32> { // [!code --]
impl<T> Point<T> { // [!code ++]
    fn swap(self) -> Point<T> { // [!code ++]
        Point { x: self.y, y: self.x }
    }
}

fn main() {
    let integer = Point { x: 3, y: 5 }.swap();
    println!("({}, {})", integer.x, integer.y);

    // let float = Point { x: 1.5, y: 2.5 }.swap(); // [!code --]
    // println!("({}, {})", float.x, float.y); // [!code --]
    let float = Point { x: 1.5, y: 2.5 }.swap(); // [!code ++]
    println!("({}, {})", float.x, float.y); // [!code ++]
}
```
型引数を持つ構造体に[[method]]を定義するときは、`impl<T> Point<T>`と書きます。`impl`の直後の`<T>`が「このブロックでは`T`という型引数を使う」という**宣言**で、その後ろの`Point<T>`が「`T`を埋めたあらゆる`Point`に対して実装する」という**対象**です。

宣言を忘れて`impl Point<T>`と書くと、コンパイラは`T`を「どこかで定義された具体的な型の名前」として探しにいき、見つからずにエラー（E0412: `cannot find type 'T' in this scope`）になります。`<T>`を2回書くのは冗長に見えますが、「宣言」と「使用」は別のことなので両方必要です。

問題のコードの`impl Point<i32>`も、それ自体は正しいRustです。これは「`T`が`i32`のときだけ使えるメソッド」を定義する書き方で、`Point<f64>`には`swap`が存在しない状態でした。`impl<T> Point<T>`に変えると、`Point<i32>`にも`Point<f64>`にも、これから使うどの`Point`にも`swap`が生えます。

メソッドの中身は変わっていません。`self.x`と`self.y`はどちらも`T`型の値で、それを入れ替えて新しい`Point { x: self.y, y: self.x }`を作るだけです。第10章で学んだ`self`を受け取るメソッドが、所有権ごと値を受け取って新しい値を返す形です。`T`の中身には一切触れていないので、`T`が何の型であっても成り立ちます。

:::message{tip}
この章の冒頭で触れたとおり、`impl<T> Point<T>`の中で書けるのは`T`の値を移動したり包み直したりする操作までです。たとえば`fn distance(&self) -> T { self.x * self.x + self.y * self.y }`と書くと、「`T`に`*`や`+`が使えるか分からない」というエラー（E0369）になります。「`T`は掛け算と足し算ができる型に限る」と伝える手段が、第20章で学ぶトレイト境界です。
:::
::::

## 06 - ジェネリック列挙型

[[generics]]と[[enum]]と[[option]]と[[result]]に関する問題です。
`Maybe`は「値があるかもしれない」を、`Outcome`は「成功か失敗か」を表す自作の[[enum]]ですが、今は決まった型でしか使えません。`main`と`lookup_rank`のコメントアウトされた部分も動くように、**2つの列挙型を型引数を持つ形**に書き換えて、期待する出力に合わせてください。

```txt:期待する出力
在庫: 3
氏名: 佐藤
合計: 300
失敗: 在庫切れ
ランク: ゴールド
未登録のID: 9
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
enum Maybe {
    Just(i32),
    Nothing,
}

enum Outcome {
    Success(i32),
    Failure(String),
}

fn checkout(quantity: i32) -> Outcome {
    if quantity == 0 {
        Outcome::Failure(String::from("在庫切れ"))
    } else {
        Outcome::Success(quantity * 100)
    }
}

// fn lookup_rank(id: u32) -> Outcome<String, u32> {
//     if id == 1 {
//         Outcome::Success(String::from("ゴールド"))
//     } else {
//         Outcome::Failure(id)
//     }
// }

fn show_outcome(outcome: Outcome) {
    match outcome {
        Outcome::Success(total) => println!("合計: {total}"),
        Outcome::Failure(reason) => println!("失敗: {reason}"),
    }
}

fn main() {
    let stock = Maybe::Just(3);
    match stock {
        Maybe::Just(count) => println!("在庫: {count}"),
        Maybe::Nothing => println!("在庫: 不明"),
    }

    // let name = Maybe::Just("佐藤");
    // match name {
    //     Maybe::Just(value) => println!("氏名: {value}"),
    //     Maybe::Nothing => println!("氏名: 未登録"),
    // }

    show_outcome(checkout(3));
    show_outcome(checkout(0));

    // match lookup_rank(1) {
    //     Outcome::Success(rank) => println!("ランク: {rank}"),
    //     Outcome::Failure(id) => println!("未登録のID: {id}"),
    // }
    // match lookup_rank(9) {
    //     Outcome::Success(rank) => println!("ランク: {rank}"),
    //     Outcome::Failure(id) => println!("未登録のID: {id}"),
    // }
}
```

::::details[解答例と解説]
```rust playground
enum Maybe { // [!code --]
    Just(i32), // [!code --]
enum Maybe<T> { // [!code ++]
    Just(T), // [!code ++]
    Nothing,
}

enum Outcome { // [!code --]
    Success(i32), // [!code --]
    Failure(String), // [!code --]
enum Outcome<T, E> { // [!code ++]
    Success(T), // [!code ++]
    Failure(E), // [!code ++]
}

fn checkout(quantity: i32) -> Outcome { // [!code --]
fn checkout(quantity: i32) -> Outcome<i32, String> { // [!code ++]
    if quantity == 0 {
        Outcome::Failure(String::from("在庫切れ"))
    } else {
        Outcome::Success(quantity * 100)
    }
}

// fn lookup_rank(id: u32) -> Outcome<String, u32> { // [!code --]
//     if id == 1 { // [!code --]
//         Outcome::Success(String::from("ゴールド")) // [!code --]
//     } else { // [!code --]
//         Outcome::Failure(id) // [!code --]
//     } // [!code --]
// } // [!code --]
fn lookup_rank(id: u32) -> Outcome<String, u32> { // [!code ++]
    if id == 1 { // [!code ++]
        Outcome::Success(String::from("ゴールド")) // [!code ++]
    } else { // [!code ++]
        Outcome::Failure(id) // [!code ++]
    } // [!code ++]
} // [!code ++]

fn show_outcome(outcome: Outcome) { // [!code --]
fn show_outcome(outcome: Outcome<i32, String>) { // [!code ++]
    match outcome {
        Outcome::Success(total) => println!("合計: {total}"),
        Outcome::Failure(reason) => println!("失敗: {reason}"),
    }
}

fn main() {
    let stock = Maybe::Just(3);
    match stock {
        Maybe::Just(count) => println!("在庫: {count}"),
        Maybe::Nothing => println!("在庫: 不明"),
    }

    // let name = Maybe::Just("佐藤"); // [!code --]
    // match name { // [!code --]
    //     Maybe::Just(value) => println!("氏名: {value}"), // [!code --]
    //     Maybe::Nothing => println!("氏名: 未登録"), // [!code --]
    // } // [!code --]
    let name = Maybe::Just("佐藤"); // [!code ++]
    match name { // [!code ++]
        Maybe::Just(value) => println!("氏名: {value}"), // [!code ++]
        Maybe::Nothing => println!("氏名: 未登録"), // [!code ++]
    } // [!code ++]

    show_outcome(checkout(3));
    show_outcome(checkout(0));

    // match lookup_rank(1) { // [!code --]
    //     Outcome::Success(rank) => println!("ランク: {rank}"), // [!code --]
    //     Outcome::Failure(id) => println!("未登録のID: {id}"), // [!code --]
    // } // [!code --]
    // match lookup_rank(9) { // [!code --]
    //     Outcome::Success(rank) => println!("ランク: {rank}"), // [!code --]
    //     Outcome::Failure(id) => println!("未登録のID: {id}"), // [!code --]
    // } // [!code --]
    match lookup_rank(1) { // [!code ++]
        Outcome::Success(rank) => println!("ランク: {rank}"), // [!code ++]
        Outcome::Failure(id) => println!("未登録のID: {id}"), // [!code ++]
    } // [!code ++]
    match lookup_rank(9) { // [!code ++]
        Outcome::Success(rank) => println!("ランク: {rank}"), // [!code ++]
        Outcome::Failure(id) => println!("未登録のID: {id}"), // [!code ++]
    } // [!code ++]
}
```
[[enum]]も、名前の直後に`<T>`を付ければ型引数を持てます。宣言した`T`は、第11章で学んだ**データを持つバリアント**の中身の型として使えます。`Just(T)`は「`T`型の値を1つ持つバリアント」、`Nothing`は型引数に関係なくデータを持たないバリアントです。

`Maybe::Just(3)`と書けば`T`は`i32`、`Maybe::Just("佐藤")`なら`&str`です。取り出し方は今までどおり`match`で、`Just(value)`のパターンで中の値が得られます。

`Outcome<T, E>`は型引数が2つで、成功時の値の型`T`と失敗時の値の型`E`を別々に決められます。`checkout`は`Outcome<i32, String>`、`lookup_rank`は`Outcome<String, u32>`と、同じ列挙型から用途ごとに違う組み合わせの型を作っています。ジェネリックな列挙型を関数の引数や戻り値にするときは、`Outcome`とだけ書くのではなく、`Outcome<i32, String>`のように**型引数を埋めた具体的な型**で書きます。`Outcome`単独は「型を作るための型」であって、まだ値の型ではないからです。

**OptionとResultの正体**
ここまで書いてみると、気付いた人も多いと思います。`Maybe<T>`は第12章の[[option]]、`Outcome<T, E>`は[[result]]と、名前以外は同じ形です。

<!-- rustc: skip -->
```rust:標準ライブラリでの定義（イメージ）
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

第12章では「`T`はどんな型でも入るという意味」とだけ説明しましたが、その正体はこの章で学んだ型引数です。`Option<u32>`・`Option<String>`・`Result<u32, String>`といった型を自然に使い分けられていたのは、ジェネリック列挙型の単相化がその都度、専用の列挙型を用意してくれていたからです。標準ライブラリの`Option`と`Result`には、何か特別な仕組みがあるわけではありません。第11章の列挙型と、この章のジェネリクスを組み合わせただけのものです。

:::message{tip}
`Maybe::Just(3)`は値から`T`が決まりますが、`let empty = Maybe::Nothing;`のように型引数を決める手がかりがない書き方をすると、エラー（E0282: `type annotations needed`）になります。`let empty: Maybe<i32> = Maybe::Nothing;`と型注釈で補うか、関数の引数や戻り値のように型が決まっている場所で使ってください。第12章で`show_stock(None)`の`None`がそのまま書けたのは、引数の型`Option<u32>`から`T`が決まっていたからです。
:::

:::message{tip}
これで第17章は終わりです。型引数`<T>`で関数・構造体・`impl`ブロック・列挙型を「型を後から決める」形で書けるようになり、`Option`と`Result`がただのジェネリック列挙型だったことも分かりました。

同時に、ジェネリクスの限界にも触れました。`T`の値を足したり表示したりしたくても、今の`T`には「何ができる型なのか」という情報がありません。次の第18章では、その「できること」を型に約束させる仕組みである**トレイト**を学びます。トレイトとジェネリクスを組み合わせると、「足し算ができる`T`なら何でも受け取る関数」のような書き方ができるようになり、それが第20章のトレイト境界につながっていきます。
:::
::::
