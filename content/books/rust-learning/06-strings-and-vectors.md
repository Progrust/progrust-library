---
title: 第6章 文字列とベクタ
description: "&strとStringの違い、push_str・format!による組み立て、文字列スライスとchars()による走査、vec!マクロとVecの操作まで、可変長データを手を動かして学ぶ10問。"
created_at: 2026-08-05
updated_at: 2026-08-05
tags: ["基本文法", "問題集"]
public: true
---

基本文法編の最後となるこの章では、**文字列**と**ベクタ**を学びます。
2つの文字列型`&str`と`String`の違いから、文字列の組み立て・切り出し・走査、そして要素数を実行時に増やせるベクタまでを10問で身につけます。

第5章で学んだ配列は要素数がコンパイル時に決まっている必要がありました。この章で扱う`String`とベクタは、どちらも実行時に中身を伸ばせる型です。プログラムが扱うデータの多くは実行してみるまで大きさが分からないため、実際のコードで登場する頻度はこちらのほうがずっと高くなります。

進め方は[第5章](/books/rust-learning/tuples-arrays-and-slices)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - 文字列リテラルと&str

[[string-literal]]と[[string-slice]]に関する問題です。
文字列リテラルを型注釈付きで変数に束縛し、その内容と長さを出力してください。型注釈には文字列リテラルの型である`&str`を書きます。

```txt:期待する出力
言語: Rust
バイト数: 4
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    // 文字列リテラル"Rust"を、&strの型注釈付きで変数languageに束縛せよ

    println!("言語: {}", language);
    println!("バイト数: {}", language.len());
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    // 文字列リテラル"Rust"を、&strの型注釈付きで変数languageに束縛せよ
    let language: &str = "Rust";

    println!("言語: {}", language);
    println!("バイト数: {}", language.len());
}
```
第1章から使ってきた`"Rust"`のような文字列リテラルの型は`&str`で、**文字列スライス**と読みます。第5章で配列の一部を借りるスライス`&[i32]`を作りましたが、`&str`もそれと同じ考え方の型です。文字列データそのものはプログラムの中に埋め込まれていて、`&str`はその位置と長さを指しているだけ、という関係になっています。

`len()`が返すのは**文字数ではなくバイト数**です。`"Rust"`は半角英字4文字なので4バイトですが、日本語だと結果が変わります。

```rust playground
fn main() {
    println!("{}", "Rust".len()); // 4
    println!("{}", "さび".len()); // 6（ひらがなは1文字3バイト）
}
```

Rustの文字列はUTF-8という方式で表現されていて、この方式では文字によってバイト数が変わります（半角英数字は1バイト、ひらがなや漢字は3バイトなど）。「何文字か」を数えたい場合は、問題06で扱う`chars()`を使います。

:::message{tip}
`str`という型は単独では変数に置けず、必ず`&str`のように`&`を付けた形で使います。理由は「サイズがコンパイル時に決まらないから」なのですが、詳しくは[[string-slice]]の補足を参照してください。ここでは「文字列を読むための型は`&str`」と覚えておけば十分です。
:::
::::

## 02 - String型

[[string]]に関する問題です。
2つの文字列リテラルから`String`型の値をそれぞれ作り、出力してください。`String`を作る方法は2通りあるので、片方ずつ使ってみてください。

```txt:期待する出力
こんにちは
さようなら
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    // String::fromを使って"こんにちは"からStringを作り、greetingに束縛せよ

    // to_stringを使って"さようなら"からStringを作り、farewellに束縛せよ

    println!("{}", greeting);
    println!("{}", farewell);
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    // String::fromを使って"こんにちは"からStringを作り、greetingに束縛せよ
    let greeting = String::from("こんにちは");

    // to_stringを使って"さようなら"からStringを作り、farewellに束縛せよ
    let farewell = "さようなら".to_string();

    println!("{}", greeting);
    println!("{}", farewell);
}
```
`String::from("...")`と`"...".to_string()`は、どちらも文字列リテラルから`String`型の値を作ります。結果は同じなので、読みやすいほうを選んで構いません。

`String`と`&str`の違いは**内容を変更できるかどうか**です。

| 型 | 内容の変更 | 主な用途 |
| --- | --- | --- |
| `&str` | できない | 決まった文字列を読む・関数に渡す |
| `String` | できる | 実行時に組み立てる文字列を持つ |

`&str`が指しているのはプログラムに埋め込まれた固定のデータなので、後から書き換えることはできません。一方`String`は自分専用の領域に文字列をコピーして持つため、後から文字を足したり削ったりできます。次の問題で実際に伸ばしてみます。

:::message{tip}
`String::from`の`::`は「`String`型に用意された関数を呼ぶ」という記法です。`greeting.len()`のようなドット記法のメソッドが「ある値に対して呼ぶ関数」なのに対し、`String::from`は値がなくても呼べる関数、という違いがあります。
:::
::::

## 03 - 文字列に追記する

[[string]]と[[char-type]]に関する問題です。
`String`に文字列と文字を追記して、「Hello, world!」を組み立ててください。追記には`push_str`と`push`の2つのメソッドを使います。

```txt:期待する出力
Hello, world!
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let mut message = String::from("Hello");

    // push_strでmessageに", world"を追記せよ

    // pushでmessageに'!'を追記せよ

    println!("{}", message);
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let mut message = String::from("Hello");

    // push_strでmessageに", world"を追記せよ
    message.push_str(", world");

    // pushでmessageに'!'を追記せよ
    message.push('!');

    println!("{}", message);
}
```
`push_str`は文字列（`&str`）を、`push`は1文字（`char`）を末尾に追加するメソッドです。渡す値の型が違う点に注意してください。`push('!')`はシングルクォート、`push_str(", world")`はダブルクォートです。第2章で学んだ「クォートの種類で型が変わる」という話がここで効いてきます。

追記は変数の内容を変更する操作なので、`let mut message = ...`と`mut`を付けておく必要があります。付け忘れると「cannot borrow `message` as mutable」というコンパイルエラー（E0596）になります。

`String`は追加した内容が入りきらなくなると、自動でより大きな領域を確保し直します。そのため「あと何文字入るか」を気にせずに追記していけます。

:::message{tip}
文字列同士をつなぐには`+`演算子も使えますが、`s1 + &s2`と書くと左辺の`s1`が使えなくなるという独特の挙動があります（理由は所有権の章で扱います）。理由を学ぶまでは、`push_str`か次の問題の`format!`を使うのが安全です。
:::
::::

## 04 - format!で組み立てる

[[string]]と[[console-output]]に関する問題です。
複数の値から1つの`String`を組み立ててください。`println!`のように書けて、画面に出力する代わりに`String`を返すのが`format!`マクロです。

```txt:期待する出力
りんご 150円 × 3個
合計: 450円
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let item = "りんご";
    let price = 150;
    let count = 3;

    // format!を使って「りんご 150円 × 3個」というStringを作り、labelに束縛せよ

    println!("{}", label);
    println!("合計: {}円", price * count);
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let item = "りんご";
    let price = 150;
    let count = 3;

    // format!を使って「りんご 150円 × 3個」というStringを作り、labelに束縛せよ
    let label = format!("{} {}円 × {}個", item, price, count);

    println!("{}", label);
    println!("合計: {}円", price * count);
}
```
`format!`は`println!`とまったく同じ書き方でプレースホルダに値を埋め込みますが、**画面には出力せず、組み立てた結果を`String`として返す**マクロです。第1章から使ってきた`println!`の知識をそのまま使えます。

値として返ってくるので、変数に束縛したり、関数の戻り値にしたり、後からさらに追記したりできます。「文字列を組み立てたいが、すぐには出力しない」という場面ではこれを使います。

`push_str`を繰り返しても同じものは作れますが、`format!`のほうが完成形が一目で分かります。

```rust playground
fn main() {
    let item = "りんご";
    let price = 150;
    let count = 3;

    // format!を使わずに書くと手間がかかる
    let mut label = String::new();
    label.push_str(item);
    label.push_str(" ");
    label.push_str(&price.to_string());
    label.push_str("円 × ");
    label.push_str(&count.to_string());
    label.push_str("個");

    println!("{}", label);
}
```

:::message{tip}
`println!`・`format!`のプレースホルダには`{}`のほかに書式を指定する記法があります。よく使うのは小数の桁数を指定する`{:.2}`（小数第2位まで）と、第5章で使ったデバッグ表示の`{:?}`です。`{:.1}`は問題10で使います。
:::
::::

## 05 - 文字列スライスを切り出す

[[string-slice]]と[[slice]]に関する問題です。
メールアドレスから、ユーザー名の部分（`@`より前）とドメインの部分（`@`より後ろ）を切り出して出力してください。

```txt:期待する出力
ユーザー名: hanako
ドメイン: example.com
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let email = "hanako@example.com";

    // emailの先頭6文字（インデックス0から5）を切り出してuserに束縛せよ

    // emailのインデックス7から末尾までを切り出してdomainに束縛せよ

    println!("ユーザー名: {}", user);
    println!("ドメイン: {}", domain);
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let email = "hanako@example.com";

    // emailの先頭6文字（インデックス0から5）を切り出してuserに束縛せよ
    let user = &email[0..6];

    // emailのインデックス7から末尾までを切り出してdomainに束縛せよ
    let domain = &email[7..];

    println!("ユーザー名: {}", user);
    println!("ドメイン: {}", domain);
}
```
文字列の一部を切り出す書き方は、第5章の配列と同じ`&値[範囲]`です。切り出した結果の型も`&str`（文字列スライス）になります。

`&email[7..]`のように終端を省略すると「そこから末尾まで」という意味になります。同様に`&email[..6]`と開始を省略すれば「先頭からそこまで」です。範囲式のこの省略記法は配列のスライスでも使えます。

| 書き方 | 意味 |
| --- | --- |
| `&s[0..6]` | インデックス0から6の手前まで |
| `&s[7..]` | インデックス7から末尾まで |
| `&s[..6]` | 先頭から6の手前まで |
| `&s[..]` | 全体 |

:::message{warning}
角括弧に書くのは**文字数ではなくバイト位置**です。今回は半角英数字だけなので「6文字目まで = 6バイト目まで」が一致していますが、日本語では一致しません。たとえば`&"りんご"[0..1]`はひらがな1文字（3バイト）の途中で切ることになり、コンパイルは通っても**実行時にパニック**します。日本語を含む文字列を扱うときは、位置を指定して切るのではなく、次の問題の`chars()`で1文字ずつ処理するのが基本です。
:::
::::

## 06 - 1文字ずつ処理する

[[string]]・[[char-type]]・[[for-expression]]に関する問題です。
文字列を1文字ずつ取り出して、1行に1文字ずつ出力してください。

```txt:期待する出力
R
u
s
t
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let word = "Rust";

    // chars()とfor式でwordを1文字ずつ取り出して出力せよ

}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let word = "Rust";

    // chars()とfor式でwordを1文字ずつ取り出して出力せよ
    for c in word.chars() {
        println!("{}", c);
    }
}
```
`chars()`は文字列を`char`（1文字）の並びに分解するメソッドです。`for`式と組み合わせると、先頭から1文字ずつ取り出して処理できます。取り出される`c`の型は`&str`ではなく[[char-type]]の`char`です。

問題01で見たとおり、`len()`が数えるのはバイト数でした。文字数を数えたいときは`chars()`と組み合わせて`word.chars().count()`と書きます。

```rust playground
fn main() {
    let word = "さび";
    println!("バイト数: {}", word.len()); // 6
    println!("文字数: {}", word.chars().count()); // 2
}
```

日本語を含む文字列でも`chars()`なら1文字ずつ正しく取り出せます。問題05の範囲指定と違い、文字の途中で切れてパニックする心配もありません。

:::message{tip}
`chars()`が取り出すのは正確には「Unicodeスカラー値」1つぶんです。絵文字の一部や、濁点を別の文字として組み合わせる表記など、見た目の1文字が複数の`char`になるケースもあります。日本語や英数字を普通に扱う範囲では気にしなくて構いません。
:::
::::

## 07 - ベクタを作る

[[vec]]に関する問題です。
2通りの方法でベクタを作ってください。1つは`vec!`マクロで最初から要素を並べる方法、もう1つは空のベクタを作ってから`push`で追加する方法です。

```txt:期待する出力
[120, 250, 80]
[10, 20]
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    // vec!マクロで120, 250, 80を要素に持つベクタpricesを作れ

    // Vec::newで空のベクタを作りnumbersに束縛し、pushで10と20を順に追加せよ

    println!("{:?}", prices);
    println!("{:?}", numbers);
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    // vec!マクロで120, 250, 80を要素に持つベクタpricesを作れ
    let prices = vec![120, 250, 80];

    // Vec::newで空のベクタを作りnumbersに束縛し、pushで10と20を順に追加せよ
    let mut numbers = Vec::new();
    numbers.push(10);
    numbers.push(20);

    println!("{:?}", prices);
    println!("{:?}", numbers);
}
```
ベクタ`Vec<T>`は、同じ型の値を**可変長**で並べるための型です。第5章の配列とよく似ていますが、実行時に要素を追加・削除できる点が決定的に違います。

| | 配列 `[i32; 3]` | ベクタ `Vec<i32>` |
| --- | --- | --- |
| 要素数 | コンパイル時に固定 | 実行時に増減できる |
| 要素数が型の一部 | ○ | ✗ |

作り方は主に2通り使い分けます。最初から中身が決まっているなら`vec![120, 250, 80]`、これから貯めていくなら`Vec::new()`で空のベクタを作って`push`で追加します。`push`は内容を変更する操作なので、`let mut`が必要です。

`Vec::new()`には要素の型を書いていませんが、後の`numbers.push(10)`から「これは整数のベクタだ」とコンパイラが推論してくれます。もし`push`が1つもないと型を決められず、`let numbers: Vec<i32> = Vec::new();`のような型注釈が必要になります。

:::message{tip}
`vec![0; 5]`と書くと、配列の`[0; 5]`と同じように「0を5個並べたベクタ」が作れます。記法がよく似ているので、角括弧だけなら配列、`vec!`が付いていればベクタ、と見分けてください。
:::
::::

## 08 - ベクタの要素にアクセスする

[[vec]]に関する問題です。
ベクタの最初の要素・要素数・最後の要素を出力してください。最後の要素のインデックスは決め打ちにせず、要素数から求めてください。

```txt:期待する出力
最初の商品: 120円
商品数: 4個
最後の商品: 300円
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let mut prices = vec![120, 250, 80];
    prices.push(300);

    // 最初の要素を「最初の商品: 120円」の形式で出力せよ

    // 要素数を「商品数: 4個」の形式で出力せよ

    // 最後の要素を「最後の商品: 300円」の形式で出力せよ

}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let mut prices = vec![120, 250, 80];
    prices.push(300);

    // 最初の要素を「最初の商品: 120円」の形式で出力せよ
    println!("最初の商品: {}円", prices[0]);

    // 要素数を「商品数: 4個」の形式で出力せよ
    println!("商品数: {}個", prices.len());

    // 最後の要素を「最後の商品: 300円」の形式で出力せよ
    println!("最後の商品: {}円", prices[prices.len() - 1]);
}
```
要素へのアクセス`prices[0]`も、要素数を返す`len()`も、書き方は配列とまったく同じです。第5章で学んだことがそのまま使えます。

最後の要素は`prices[3]`と書いても今回は正しく動きますが、`push`で要素が増減すると途端に間違いになります。`prices.len() - 1`と書いておけば、要素数がいくつになっても常に最後の要素を指します。

:::message{warning}
配列では範囲外のインデックスをコンパイラが検出してくれる場合がありましたが、ベクタの要素数はコンパイル時に分からないため、範囲外の添字はすべて**実行時のパニック**になります。`prices[10]`と書いてもコンパイルは通り、実行した瞬間に停止します。安全に取り出したい場合は`prices.get(10)`を使います。
:::
::::

## 09 - for式でベクタを走査する

[[vec]]と[[for-expression]]に関する問題です。
ベクタの全要素を出力しながら、合計点を計算してください。

```txt:期待する出力
80点
95点
70点
合計: 245点
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let scores = vec![80, 95, 70];
    let mut total = 0;

    // for式でscoresを走査し、各要素を「80点」の形式で出力しつつtotalに足し込め

    println!("合計: {}点", total);
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let scores = vec![80, 95, 70];
    let mut total = 0;

    // for式でscoresを走査し、各要素を「80点」の形式で出力しつつtotalに足し込め
    for score in &scores {
        println!("{}点", score);
        total += score;
    }

    println!("合計: {}点", total);
}
```
走査の書き方は配列のときと同じ`for`式ですが、ベクタの前に`&`を付けている点に注目してください。

`for score in scores`と`&`なしで書いてもこのコードは動きます。ただしその場合、**走査した後で`scores`が使えなくなります**。`for`式にベクタを渡すと、ベクタそのものが`for`式に引き渡されてしまうためです。`&`を付けると「中身を借りるだけ」という意味になり、走査した後も`scores`をそのまま使い続けられます。

```rust playground
fn main() {
    let scores = vec![80, 95, 70];

    for score in &scores {
        println!("{}点", score);
    }

    println!("要素数: {}", scores.len()); // &を付けて走査したので、ここで使える
}
```

合計を貯める`total`をループの外で宣言するのは、第5章の応用問題と同じ考え方です。

:::message{tip}
第5章の配列では`&`なしの`for price in prices`でも後から`prices`を使えました。整数の配列とベクタでこの違いが生まれる理由は、Rustの中心的な仕組みである**所有権**にあります。次の章のテーマなので、ここでは「ベクタを`for`で回すときは`&`を付けておくと安全」と覚えておいてください。
:::
::::

## 10 - 応用: 成績集計

基本文法編の総復習として、[[vec]]・[[string]]・[[function]]・[[for-expression]]・[[type-cast]]を組み合わせた問題です。
点数のリストを受け取り、`合計: 245点 / 平均: 81.7点`という形式の`String`を返す関数`summarize`を実装して、テストに合格させてください。平均は小数第1位まで表示します（`{:.1}`で桁数を指定できます）。

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
// 点数のスライス&[i32]を受け取り、「合計: 245点 / 平均: 81.7点」の形式のStringを返す
// 関数summarizeを定義せよ

#[test]
fn test_summarize() {
    let scores = vec![80, 95, 70];
    assert_eq!(summarize(&scores), "合計: 245点 / 平均: 81.7点");
}

#[test]
fn test_summarize_pushed() {
    let mut scores = Vec::new();
    scores.push(100);
    scores.push(90);
    assert_eq!(summarize(&scores), "合計: 190点 / 平均: 95.0点");
}

#[test]
fn test_summarize_single() {
    assert_eq!(summarize(&[70]), "合計: 70点 / 平均: 70.0点");
}
```

::::details[解答例と解説]
```rust playground
// 点数のスライス&[i32]を受け取り、「合計: 245点 / 平均: 81.7点」の形式のStringを返す
// 関数summarizeを定義せよ
fn summarize(scores: &[i32]) -> String {
    let mut total = 0;

    for score in scores {
        total += score;
    }

    let average = total as f64 / scores.len() as f64;

    format!("合計: {}点 / 平均: {:.1}点", total, average)
}

#[test]
fn test_summarize() {
    let scores = vec![80, 95, 70];
    assert_eq!(summarize(&scores), "合計: 245点 / 平均: 81.7点");
}

#[test]
fn test_summarize_pushed() {
    let mut scores = Vec::new();
    scores.push(100);
    scores.push(90);
    assert_eq!(summarize(&scores), "合計: 190点 / 平均: 95.0点");
}

#[test]
fn test_summarize_single() {
    assert_eq!(summarize(&[70]), "合計: 70点 / 平均: 70.0点");
}
```
基本文法編の総まとめとして、これまでの章の要素が一通り登場します。ポイントを順に見ていきましょう。

**引数は`&[i32]`で受ける**
第5章と同じくスライスで受け取っています。テストでは`&scores`（ベクタへの参照）と`&[70]`（配列への参照）の両方を渡していますが、どちらも`&[i32]`として扱えるため、同じ関数で受けられます。ベクタでも配列でも受け取れるので、列を読むだけの関数の引数は`&[T]`にするのが定番です。

**合計を求める**
`scores`はすでに`&`の付いたスライスなので、`for score in scores`とそのまま書けます（問題09の`&scores`は、`&`の付いていないベクタを借りるために必要でした）。

**平均を求める**
`total`は`i32`、`scores.len()`は要素数を表す整数で、どちらも整数のままでは割り算の結果が切り捨てられてしまいます。第2章のキャストで両方を`f64`に揃えてから割ります。245 ÷ 3 = 81.666… なので、切り捨ててしまうと81になり、テストに失敗します。

**文字列を組み立てる**
最後は`format!`で仕上げます。`{:.1}`と書くと小数第1位まで（四捨五入して）表示されるので、81.666… は`81.7`になります。`{}`のままだと`81.66666666666667`と表示されてテストに失敗します。

:::message{tip}
`assert_eq!`で`String`と文字列リテラル`&str`を直接比較できるのは、この2つの型の比較があらかじめ用意されているためです。型が違うと演算できないRustですが、比較のように「意味がはっきりしている操作」は型をまたいで用意されていることがあります。
:::

これで第6章、そして基本文法編は終わりです。ここまでで、変数・型・制御フロー・関数・複合型と、Rustのプログラムを読み書きする土台がそろいました。

一方で、この章の問題09や`String`の`+`演算子のように、「なぜか後から使えなくなる」という説明を保留にしたままの話題がいくつか残っています。その答えがRust最大の特徴である**所有権**です。次の章から、いよいよそこに踏み込んでいきます。
::::
