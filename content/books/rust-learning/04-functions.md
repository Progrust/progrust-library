---
title: 第4章 関数
description: fnによる関数の定義、引数の型注釈、末尾の式による戻り値、セミコロンの罠、早期リターン、ユニット型まで、処理を部品に切り出す関数を手を動かして学ぶ8問。
created_at: 2026-08-05
updated_at: 2026-08-05
tags: ["基本文法", "問題集"]
public: true
---

この章では、処理をひとまとまりの部品として切り出す**関数**を学びます。
関数の定義と呼び出しから、引数・戻り値・早期リターンまでを8問で身につけます。

第3章まではすべての処理を`main`の中に書いてきました。関数が使えるようになると、同じ処理を何度も書かずに済み、名前を付けることでコードの意図も伝わりやすくなります。

進め方は[第1章](/books/rust-learning/console-output-and-variables)から[第3章](/books/rust-learning/control-flow)までと同じですが、この章の後半では新しく**テストで正解を判定する問題**が登場します。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - 関数を定義する

[[function]]に関する問題です。
「いらっしゃいませ。」と出力する関数`greet`を定義し、`main`から2回呼び出してください。

```txt:期待する出力
いらっしゃいませ。
いらっしゃいませ。
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    // greetを2回呼び出せ

}

// 「いらっしゃいませ。」と出力する関数greetを定義せよ

```

::::details[解答例と解説]
```rust playground
fn main() {
    // greetを2回呼び出せ
    greet();
    greet();
}

// 「いらっしゃいませ。」と出力する関数greetを定義せよ
fn greet() {
    println!("いらっしゃいませ。");
}
```
関数は`fn 関数名() { ... }`の形で定義し、`関数名()`の形で呼び出します。呼び出すたびに本体のブロックが実行されるので、同じ処理を何度でも使い回せます。

関数名は`greet`や`print_total`のように、単語を小文字とアンダースコアでつなぐ**スネークケース**で書くのが慣習です。`printTotal`のようなキャメルケースで書くとコンパイルは通りますが、警告が出ます。

`greet`を`main`より**後ろ**に定義している点にも注目してください。関数は「アイテム」と呼ばれる宣言の一種で、ファイル内のどこに書いても構いません。`main`の前に書いても後ろに書いても同じように動きます。

:::message{tip}
`fn main()`も関数の1つです。第1章から書いてきた`main`は「プログラムの実行が始まる場所」として特別扱いされているだけで、定義の書き方は他の関数と変わりません。
:::
::::

## 02 - 引数を渡す

[[function]]に関する問題です。
次のコードは単価と個数から合計金額を出力しようとしていますが、コンパイルエラーになります。エラーメッセージを読み、`print_total`の1行目だけを修正してコンパイルが通るようにしてください。

```txt:期待する出力
合計は600円です。
```

<!-- rustc: skip -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn print_total(price, count) {
    println!("合計は{}円です。", price * count);
}

fn main() {
    print_total(150, 4);
}
```

::::details[解答例と解説]
```rust playground
fn print_total(price: u32, count: u32) { // 引数それぞれに型注釈を付ける
    println!("合計は{}円です。", price * count);
}

fn main() {
    print_total(150, 4);
}
```
エラーメッセージは「expected one of `:`, `@`, or `|`, found `,`」で、続けて「if this is a parameter name, give it a type（これが引数名なら型を付けてください）」というヒントが出ていました。

関数に値を渡すには、`fn 関数名(引数名: 型, 引数名: 型)`のように**引数**を宣言します。呼び出し側で`print_total(150, 4)`と書くと、`150`が`price`に、`4`が`count`に順に束縛されます。

ここでのポイントは、**引数の型注釈は省略できない**ことです。`let`では型注釈を省略してもコンパイラが値から型を推論してくれましたが、関数の引数では必ず型を書く必要があります。関数の内側と外側それぞれを独立して検査できるようにするための決まりで、引数の型が書いてあれば、呼び出し側のコードを見なくても関数の中身を検査できます。

型は`u32`でなくても、`i32`のように`price * count`が計算できる型であれば正解です。ただし2つの引数は同じ型に揃えてください。第2章で学んだとおり、`i32`と`u32`のように型が違う値同士は掛け算できません。

:::message{warning}
引数名は関数の中だけで通用する名前です。呼び出し側で`print_total(price = 150)`のように引数名を指定して渡すこと（名前付き引数）はできません。値は**書いた順番**で対応します。
:::
::::

## 03 - 戻り値は末尾の式

[[function]]と[[expression]]に関する問題です。
幅と高さを受け取り、長方形の面積を返す関数`rectangle_area`を定義してください。

```txt:期待する出力
面積は40です。
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let area = rectangle_area(8, 5);
    println!("面積は{}です。", area);
}

// 幅widthと高さheightを受け取り、面積を返す関数rectangle_areaを定義せよ

```

::::details[解答例と解説]
```rust playground
fn main() {
    let area = rectangle_area(8, 5);
    println!("面積は{}です。", area);
}

// 幅widthと高さheightを受け取り、面積を返す関数rectangle_areaを定義せよ
fn rectangle_area(width: u32, height: u32) -> u32 {
    width * height
}
```
値を返す関数は、引数の後ろに`-> 型`と書いて戻り値の型を宣言します。そして**本体ブロックの末尾に置いたセミコロンなしの式**が、そのまま戻り値になります。

第1章で学んだ「ブロックは末尾の式の値を返す」という性質が、そのまま関数にも当てはまります。`return`を書く必要はありません（`return`の出番は問題05で扱います）。

戻り値の型は1つだけしか書けません。複数の値を返したくなった場合は、第5章で学ぶタプルにまとめて返します。

:::message{tip}
関数呼び出し`rectangle_area(8, 5)`も式です。そのため`let area = ...`のように変数へ束縛したり、`println!("{}", rectangle_area(8, 5))`のようにプレースホルダへ直接埋め込んだりできます。
:::
::::

## 04 - セミコロンの罠

[[function]]・[[statement]]・[[expression]]に関する問題です。
次のコードは受け取った値を2倍にして返そうとしていますが、コンパイルエラー（E0308）になります。エラーメッセージを読み、**1文字だけ**変更してコンパイルが通るようにしてください。

```txt:期待する出力
21の2倍は42です。
```

<!-- rustc: expect E0308 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn double(value: i32) -> i32 {
    value * 2;
}

fn main() {
    println!("21の2倍は{}です。", double(21));
}
```

::::details[解答例と解説]
```rust playground
fn double(value: i32) -> i32 {
    value * 2 // セミコロンを外すと式のまま残り、戻り値になる
}

fn main() {
    println!("21の2倍は{}です。", double(21));
}
```
エラーメッセージは「mismatched types」、続けて「expected `i32`, found `()`」でした。さらに「implicitly returns `()` as its body has no tail or `return` expression（本体に末尾の式も`return`もないため、暗黙に`()`を返している）」という説明と、「remove this semicolon to return this value」という修正案まで示されています。

`value * 2`は値を生む**式**ですが、末尾にセミコロンを付けると値を捨てる**文**になります。文で終わったブロックの値は[[unit-type]]`()`になるため、「`i32`を返すと宣言したのに`()`を返している」という型の不一致になっていたわけです。

このセミコロン1つの違いは、Rustを書き始めた頃につまずきやすいポイントです。「値を返したい行にはセミコロンを付けない」と覚えておいてください。

:::message{tip}
エラーメッセージが指しているのは`value * 2;`の行ではなく、戻り値の型を書いた`-> i32`の位置です。「`i32`を返すと約束したのに守られていない」という視点の指摘なので、エラーの表示位置と実際に直す場所がずれることがあります。ヒント（help）の行まで読むのが早道です。
:::
::::

## 05 - return式で早期リターン

[[return-expression]]と[[function]]に関する問題です。
入場料を求める関数`admission_fee`を完成させてください。大人料金は1800円ですが、12歳以下は無料です。12歳以下の場合は`return`で関数を抜けるように書いてください。

```txt:期待する出力
10歳の入場料: 0円
30歳の入場料: 1800円
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn admission_fee(age: u32) -> u32 {
    // ageが12以下なら0を返して関数を抜けよ

    1800
}

fn main() {
    println!("10歳の入場料: {}円", admission_fee(10));
    println!("30歳の入場料: {}円", admission_fee(30));
}
```

::::details[解答例と解説]
```rust playground
fn admission_fee(age: u32) -> u32 {
    // ageが12以下なら0を返して関数を抜けよ
    if age <= 12 {
        return 0; // ここで関数を抜けるので、以降は実行されない
    }

    1800
}

fn main() {
    println!("10歳の入場料: {}円", admission_fee(10));
    println!("30歳の入場料: {}円", admission_fee(30));
}
```
`return 値;`と書くと、その時点で関数の実行を打ち切って呼び出し元に値を返します。条件を満たしたときだけ先に抜ける、この書き方を**早期リターン**と呼びます。

問題03で見たとおり、Rustでは末尾の式がそのまま戻り値になるため、最後に値を返すだけなら`return`は不要です。実際`return 1800;`と書いても動きますが、末尾は`1800`とだけ書くのがRustの慣習です。**途中で抜けるときは`return`、最後に返すときは末尾の式**、と使い分けてください。

なお、この関数は`if`式を使って次のようにも書けます。どちらも正解です。

```rust playground
fn admission_fee(age: u32) -> u32 {
    if age <= 12 { 0 } else { 1800 }
}

fn main() {
    println!("10歳の入場料: {}円", admission_fee(10));
    println!("30歳の入場料: {}円", admission_fee(30));
}
```

条件が1つならこの書き方で十分ですが、条件のネストが深くなる場合や、抜けた後にも長い処理が続く場合は、早期リターンのほうが読みやすくなります。

:::message{tip}
`return`はループの`break`と似ていますが、抜ける対象が違います。`break`が抜けるのは最も内側のループだけなのに対し、`return`はループの中から書いても**関数ごと**抜けます。
:::
::::

## 06 - ユニット型

[[unit-type]]と[[function]]に関する問題です。
次のコードは価格と税込価格を出力しようとしていますが、コンパイルエラー（E0369）になります。エラーメッセージを読み、`show_price`の定義は変えずに`main`だけを修正してください。

```txt:期待する出力
価格は500円です。
税込は550円です。
```

<!-- rustc: expect E0369 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn show_price(price: u32) {
    println!("価格は{}円です。", price);
}

fn main() {
    let price = show_price(500);
    let with_tax = price + price / 10;
    println!("税込は{}円です。", with_tax);
}
```

::::details[解答例と解説]
```rust playground
fn show_price(price: u32) {
    println!("価格は{}円です。", price);
}

fn main() {
    let price = 500; // 値そのものを束縛する
    show_price(price); // 出力だけを関数に任せる
    let with_tax = price + price / 10;
    println!("税込は{}円です。", with_tax);
}
```
エラーメッセージは「cannot divide `()` by `{integer}`」、つまり「`()`を整数で割ることはできない」でした。`price`には`500`ではなく`()`が入っていた、ということです。

`show_price`は戻り値の型`->`を書いていません。**戻り値の型を省略した関数は`()`（ユニット型）を返す**決まりなので、`fn show_price(price: u32)`は`fn show_price(price: u32) -> ()`と書いたのと同じ意味になります。`()`は「返すべき意味のある値がない」ことを表す型で、値も`()`の1つしかありません。

`let price = show_price(500);`が受け取っていたのは、出力された`500`ではなく、この`()`でした。`println!`が画面に文字を出すことと、関数が値を返すことは別の話だという点がポイントです。

解答例では、値を`main`側で持っておき、関数には出力だけを任せました。もう1つの直し方は、`show_price`が値を返すようにすることです。

```rust playground
fn show_price(price: u32) -> u32 {
    println!("価格は{}円です。", price);
    price // 受け取った値をそのまま返す
}

fn main() {
    let price = show_price(500);
    let with_tax = price + price / 10;
    println!("税込は{}円です。", with_tax);
}
```

:::message{tip}
`()`は第1章から実は何度も登場しています。`println!(...)`のようなセミコロンで終わる文だけのブロックや、`else`のない`if`式の値も`()`です。「値がないこと」を表す専用の値がある、と捉えておくとよいでしょう。
:::
::::

## 07 - テストに合格する関数を書く

[[function]]に関する問題です。
ここからは**テストで正解を判定する問題**です。あらかじめ用意されたテストコードに合格するように、関数`is_even`を実装してください。`is_even`は受け取った整数が偶数なら`true`、奇数なら`false`を返します。

コードには`fn main`がありません。Playgroundの「RUN」の隣にある「TEST」（または「···」メニュー）を選んで実行し、すべてのテストが`ok`になれば正解です。

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
// 受け取った整数が偶数ならtrue、奇数ならfalseを返す関数is_evenを定義せよ

#[test]
fn test_is_even() {
    assert_eq!(is_even(4), true);
    assert_eq!(is_even(7), false);
    assert_eq!(is_even(0), true);
    assert_eq!(is_even(-3), false);
}
```

::::details[解答例と解説]
```rust playground
// 受け取った整数が偶数ならtrue、奇数ならfalseを返す関数is_evenを定義せよ
fn is_even(number: i32) -> bool {
    number % 2 == 0
}

#[test]
fn test_is_even() {
    assert_eq!(is_even(4), true);
    assert_eq!(is_even(7), false);
    assert_eq!(is_even(0), true);
    assert_eq!(is_even(-3), false);
}
```
偶数の判定は、第2章の剰余演算子`%`で「2で割った余りが0か」を調べます。`number % 2 == 0`は`bool`を生む式なので、これをそのまま末尾に置けば戻り値になります。

テストの読み方も確認しておきましょう。

- `#[test]`は、その直後の関数が**テスト用の関数**であることを示す目印です。テスト実行時だけ呼び出されます
- `assert_eq!(左, 右)`は「左と右が等しいこと」を確かめるマクロです。等しくなければテストが失敗し、期待値と実際の値が表示されます

テストコードは書き換えずに、関数側を実装して合格させてください。テストは「この関数はこう動くべきだ」という仕様書でもあるので、まずテストを読んで何を作るのかを把握するのが定石です。

引数の型は`i32`でなくても構いませんが、テストが`-3`を渡しているので符号なしの`u32`にすると失敗します。テストを読めば必要な型が分かる、という一例です。

:::message{warning}
Rust Playgroundでは、`fn main`があるとプログラムとして扱われ、テストは無視されます。テストで判定する問題では`fn main`を書かないでください（この本のテスト問題は、最初から`fn main`のない形で用意しています）。
:::
::::

## 08 - 応用: 温度変換関数

第4章の総復習として、[[function]]・[[numeric-operations]]・[[type-cast]]を組み合わせた問題です。
摂氏（`i32`）を受け取って華氏（`f64`）に変換して返す関数`celsius_to_fahrenheit`を実装し、テストに合格させてください。摂氏から華氏への変換式は「華氏 = 摂氏 × 9 ÷ 5 + 32」です。

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
// 摂氏celsius(i32)を華氏(f64)に変換して返す関数celsius_to_fahrenheitを定義せよ

#[test]
fn test_celsius_to_fahrenheit() {
    assert_eq!(celsius_to_fahrenheit(0), 32.0);
    assert_eq!(celsius_to_fahrenheit(100), 212.0);
    assert_eq!(celsius_to_fahrenheit(-40), -40.0);
}
```

::::details[解答例と解説]
```rust playground
// 摂氏celsius(i32)を華氏(f64)に変換して返す関数celsius_to_fahrenheitを定義せよ
fn celsius_to_fahrenheit(celsius: i32) -> f64 {
    celsius as f64 * 9.0 / 5.0 + 32.0
}

#[test]
fn test_celsius_to_fahrenheit() {
    assert_eq!(celsius_to_fahrenheit(0), 32.0);
    assert_eq!(celsius_to_fahrenheit(100), 212.0);
    assert_eq!(celsius_to_fahrenheit(-40), -40.0);
}
```
引数は`i32`、戻り値は`f64`と型が違うので、第2章で学んだキャストの出番です。`celsius as f64`で`f64`に揃えてから、`9.0`・`5.0`・`32.0`という小数リテラルと計算します。

やってしまいがちな間違いが2つあります。

**1つ目**は、キャストを忘れて`celsius * 9 / 5 + 32`と書いてしまうことです。これは整数のまま計算されるうえ、戻り値の型`f64`とも合わずコンパイルエラーになります。

**2つ目**は、`celsius as f64 * (9 / 5) + 32.0`のように整数のまま割ってしまうことです。`9 / 5`は整数同士の除算なので、切り捨てられて`1`になってしまいます。この場合はコンパイルが通ってしまい、摂氏100度が132度という誤った結果になります。**コンパイルが通ることと、正しく動くことは別**だと分かる例です。

計算の順序を変えて`(celsius as f64 - 0.0) * 1.8 + 32.0`のように書いても、テストは通ります。

:::message{tip}
第2章では「小数の計算には誤差が出ることがあるので`==`での比較には注意」と説明しました。この問題では計算結果がたまたま誤差なく表せる値になるため`assert_eq!`で判定できていますが、一般に小数の計算結果を比較するときは「差が十分小さいか」を調べる書き方をします。
:::

これで第4章は終わりです。処理を関数として切り出せるようになりました。次の章では、複数の値をひとまとめに扱うタプル・配列・スライスに進みます。
::::
