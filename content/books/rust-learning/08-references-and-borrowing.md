---
title: 第8章 参照と借用
description: "&による共有参照と&mutによる排他参照、参照外し、借用規則とE0502・E0596、NLLによる借用の終わり、ダングリング参照の防止まで、所有権を渡さずに値を使う借用を手を動かして学ぶ9問。"
created_at: 2026-08-07
updated_at: 2026-08-07
tags: ["所有権", "問題集"]
public: true
---

第7章では、値を関数に渡すと所有権ごと持っていかれてしまうことを学びました。
この章では、所有権を渡さずに値を**貸す**仕組み——**参照**と**借用**——を9問で身につけます。

参照はRustのコードに最も頻繁に登場する道具です。第6章でベクタを`for`式に渡すときに書いた`&scores`も、第5章のスライス`&arr[1..3]`も、すべて参照でした。ここまで「おまじない」として書いてきた`&`の意味が、この章ではっきりします。

そして参照には、Rustが安全性を守るための**借用規則**という制約が付いています。慣れるまでは借用チェッカーに何度も止められますが、これは「実行時に起きたはずのバグをコンパイル時に見つけてもらっている」ということです。エラーコードを手がかりに1問ずつ進めていきましょう。

進め方は[第7章](/books/rust-learning/ownership-and-move)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - 参照で値を貸す

[[reference]]・[[borrow]]・[[function]]に関する問題です。
第7章の問題06と同じコードです。今度は`.clone()`を使わず、**関数の引数の型と呼び出し方**を変えて修正してください。

```txt:期待する出力
注文内容: コーヒー ×2
控え: コーヒー ×2
```

<!-- rustc: expect E0382 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn print_order(order: String) {
    println!("注文内容: {}", order);
}

fn main() {
    let order = String::from("コーヒー ×2");

    print_order(order);

    println!("控え: {}", order);
}
```

::::details[解答例と解説]
```rust playground
fn print_order(order: &String) {
    println!("注文内容: {}", order);
}

fn main() {
    let order = String::from("コーヒー ×2");

    print_order(&order); // 所有権は渡さず、参照だけを渡す

    println!("控え: {}", order); // 所有権は手元に残っている
}
```
`&order`と書くと、`order`が所有している値を**指し示すだけの値**が作られます。これを[[reference]]と呼び、参照を作って値を利用することを[[borrow]]（借用）と呼びます。

参照は所有者ではないので、関数に渡してもムーブは起きません。関数を抜けても文字列は破棄されず、呼び出し元の`order`はそのまま使い続けられます。第7章のクローンのように複製を作るコストもかかりません。

**型に`&`が付く**点に注意してください。`String`型の値を指す参照の型は`&String`です。`String`を期待する引数に`&String`は渡せませんし、その逆もできません。

| 書き方 | 意味 |
| --- | --- |
| `order: String` | 所有権を受け取る（ムーブする） |
| `order: &String` | 参照を受け取る（借りるだけ） |

第7章で見たエラーメッセージの`consider changing this parameter type ... to borrow instead`は、まさにこの修正を勧めていたわけです。値を読むだけの関数は、引数を参照で受け取るのがRustの基本形になります。

:::message{tip}
実際のRustコードでは、`&String`ではなく`&str`（文字列スライス）を引数に取るほうが好まれます。`&str`にしておくと`String`への参照も文字列リテラルもそのまま渡せて、使える場面が広がるためです。第6章の`&[i32]`と同じ考え方で、この章の問題09でも使います。ここでは「参照は元の型に`&`を付けた型になる」という対応を分かりやすくするため`&String`にしています。
:::
::::

## 02 - 共有参照は同時にいくつでも

[[reference]]と[[borrow]]に関する問題です。
1つの`String`への参照を2つ作り、両方から内容を読み取ってください。所有者からも読めることを確認します。

```txt:期待する出力
1つ目: こんにちは
2つ目: こんにちは
所有者: こんにちは
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let message = String::from("こんにちは");

    // messageへの参照を2つ作り、first・secondに束縛せよ

    println!("1つ目: {}", first);
    println!("2つ目: {}", second);
    println!("所有者: {}", message);
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let message = String::from("こんにちは");

    // messageへの参照を2つ作り、first・secondに束縛せよ
    let first = &message;
    let second = &message;

    println!("1つ目: {}", first);
    println!("2つ目: {}", second);
    println!("所有者: {}", message);
}
```
`&`で作る参照は**共有参照**と呼ばれ、同時にいくつでも作れます。所有者は1つだけというルールがありましたが、「読むだけの参照」は何個あっても問題を起こさないためです。

共有参照でできるのは**読み取りだけ**です。`first.push_str("、世界")`のように参照経由で値を書き換えることはできません。全員が読むだけなら、何人が同時に見ていても内容が食い違うことはない——これが「いくつでも作れる」理由です。

参照を作っている間も、所有者の`message`から直接読むことは変わらずできます。

:::message{tip}
共有参照は「不変参照」と呼ばれることもありますが、`&T`と`&mut T`の本質的な違いは不変か可変かではなく**共有か排他か**にあります。近年のRustでは「共有参照・排他参照」という呼び方が好まれる傾向にあり、この本でもそちらを使います。詳しくは[[reference]]の補足を参照してください。
:::
::::

## 03 - 排他参照で書き換える

[[reference]]と[[borrow]]に関する問題です。
`add_item`は、`&mut String`で受け取った注文に商品名を追記する関数です。関数の中身を書いてください。

```txt:期待する出力
注文内容: コーヒー / サンドイッチ
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn add_item(order: &mut String, item: &str) {
    // 参照order経由でitemを追記せよ

}

fn main() {
    let mut order = String::from("コーヒー");

    add_item(&mut order, " / サンドイッチ");

    println!("注文内容: {}", order);
}
```

::::details[解答例と解説]
```rust playground
fn add_item(order: &mut String, item: &str) {
    // 参照order経由でitemを追記せよ
    order.push_str(item);
}

fn main() {
    let mut order = String::from("コーヒー");

    add_item(&mut order, " / サンドイッチ"); // 書き換えの許可ごと貸す

    println!("注文内容: {}", order);
}
```
`&mut`で作る参照を**排他参照**と呼びます。共有参照と違い、参照経由で**参照先の値を書き換えられます**。

排他参照を使うには3箇所すべてに`mut`が必要です。1つでも欠けるとコンパイルが通りません。

| 場所 | 書き方 | 意味 |
| --- | --- | --- |
| 所有者の宣言 | `let mut order` | そもそも書き換えを許した変数である |
| 参照を作る側 | `&mut order` | 書き換えの許可ごと貸す |
| 受け取る側 | `order: &mut String` | 書き換えてよい参照を受け取る |

そして排他参照は、その名のとおり**同時に1つしか作れません**。書き換える人が2人いると、片方が変更した内容をもう片方が知らないまま上書きする、といった食い違いが起きるためです。共有参照との対比で整理すると次のようになります。

| | 共有参照 `&T` | 排他参照 `&mut T` |
| --- | --- | --- |
| 参照先の書き換え | できない | できる |
| 同時に作れる数 | いくつでも | 1つだけ |

:::message{tip}
第6章で使った`order.push_str(...)`は、実は`order`の排他参照を作る操作でした。メソッド呼び出しでは`&mut`が自動で補われるため、書かなくても排他借用が起きています。「`mut`を付け忘れると`push_str`でエラーになる」のはこのためです。
:::
::::

## 04 - 参照外し

[[dereference]]と[[reference]]に関する問題です。
参照が指す先の値を、`*`を使って読み書きしてください。

```txt:期待する出力
残高: 1500
記録した残高: 1500
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let mut balance = 1000;

    let account = &mut balance;
    // account経由で参照先の残高に500を足せ

    println!("残高: {}", balance);

    let viewer = &balance;
    // viewerの参照先の値そのものをsnapshotに束縛せよ

    println!("記録した残高: {}", snapshot);
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let mut balance = 1000;

    let account = &mut balance;
    // account経由で参照先の残高に500を足せ
    *account += 500;

    println!("残高: {}", balance);

    let viewer = &balance;
    // viewerの参照先の値そのものをsnapshotに束縛せよ
    let snapshot = *viewer;

    println!("記録した残高: {}", snapshot);
}
```
参照はあくまで「値の在り処を指し示すもの」なので、参照先の値そのものを扱うには`*`を付けて**参照を外す**必要があります。この操作を[[dereference]]（参照外し）と呼びます。

`*`を付けなかった場合との違いを見比べてみてください。

| 書き方 | 扱っているもの |
| --- | --- |
| `account` | 参照そのもの（`&mut i32`） |
| `*account` | 参照先の値（`i32`） |

`account += 500`と書くと「参照に500を足す」という意味不明な操作になり、型が合わずコンパイルエラーになります。`let snapshot = viewer;`のほうは、`snapshot`が参照のコピーになるだけで値そのものは取り出せていません。

一方で、問題03の`order.push_str(item)`では`*`を書きませんでした。メソッド呼び出しやフィールドアクセスでは**参照外しが自動で行われる**ためです（`(*order).push_str(item)`と書いても同じ意味になります）。`*`を明示的に書く必要があるのは、この問題のように参照先の値を直接読み書きするときです。

:::message{tip}
`println!`のプレースホルダも参照外しを気にせず使えます。`println!("{}", viewer)`と書けば、参照の中身である`1500`が表示されます。参照を出力しても「参照のアドレス」のようなものは表示されない、と覚えておいてください。
:::
::::

## 05 - mutでない変数は排他借用できない

[[reference]]と[[variable]]に関する問題です。
次のコードはコンパイルエラー（E0596）になります。`main`の中の**1行を1文字だけ**変えて修正してください。

```txt:期待する出力
残高: 1500
```

<!-- rustc: expect E0596 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn deposit(balance: &mut i32, amount: i32) {
    *balance += amount;
}

fn main() {
    let balance = 1000;

    deposit(&mut balance, 500);

    println!("残高: {}", balance);
}
```

::::details[解答例と解説]
```rust playground
fn deposit(balance: &mut i32, amount: i32) {
    *balance += amount;
}

fn main() {
    let mut balance = 1000; // mutを追加した

    deposit(&mut balance, 500);

    println!("残高: {}", balance);
}
```
エラーメッセージは`cannot borrow 'balance' as mutable, as it is not declared as mutable`（E0596）——「`balance`は可変として宣言されていないので、排他的に借用できない」と言っています。

排他参照は「書き換えてよい」という許可を借りるものです。ところが`let balance = 1000;`と宣言した時点で、この変数は書き換えを許していません。**自分が持っていない許可を貸すことはできない**ので、`&mut balance`は作れないわけです。

第1章で学んだ「変数はデフォルトで不変」というルールが、借用にもそのまま効いていることになります。問題03で見た3箇所の`mut`のうち、ここで欠けていたのは所有者の宣言でした。

:::message{tip}
逆に、`mut`が付いていない変数からでも`&balance`（共有参照）は問題なく作れます。読むだけなら、書き換えの許可は要らないためです。
:::
::::

## 06 - 共有と排他は同時に存在できない

[[borrow]]と[[reference]]に関する問題です。
次のコードは、1つの`String`に対して**表示用の共有参照`viewer`と編集用の排他参照`editor`**を作ろうとしてコンパイルエラー（E0502）になります。実はこの2つは片方だけで足ります。どちらを残せばよいか考えて、もう片方を消してください。

```txt:期待する出力
注文内容: コーヒー ×2
```

<!-- rustc: expect E0502 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let mut order = String::from("コーヒー");

    let viewer = &order;
    let editor = &mut order;

    editor.push_str(" ×2");

    println!("注文内容: {}", viewer);
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let mut order = String::from("コーヒー");

    let editor = &mut order; // 排他参照だけを残す

    editor.push_str(" ×2");

    println!("注文内容: {}", editor); // 排他参照からは読み取りもできる
}
```
エラーメッセージは`cannot borrow 'order' as mutable because it is also borrowed as immutable`（E0502）——「`order`は共有的にも借用されているので、排他的には借用できない」です。今回は`viewer`と`editor`という2つの参照が変数として並んでいるので、どちらとどちらがぶつかっているのかがエラー出力にもはっきり示されます。

```txt
4 |     let viewer = &order;
  |                  ------ immutable borrow occurs here
5 |     let editor = &mut order;
  |                  ^^^^^^^^^^ mutable borrow occurs here
...
9 |     println!("注文内容: {}", viewer);
  |                              ------ immutable borrow later used here
```

ここまでの3問と合わせて、[[borrow]]の規則が出そろいました。

1. 共有参照は同時にいくつでも持てる（問題02）
2. 排他参照は同時に1つしか持てない（問題03）
3. **共有参照と排他参照は同時に存在できない**（この問題）
4. 参照は常に有効な値を指していなければならない（問題08）

残すべきなのは排他参照の`editor`のほうです。**排他参照は書き換えだけでなく読み取りもできる**ので、`println!`も`editor`から行えます。逆に`viewer`を残すと`push_str`ができません。「書き換える人」と「読む人」を別々に用意したくなりますが、Rustでは書き換える権利を持つ1人が読み取りも兼ねる、という形になります。

なぜ規則3が必要なのでしょうか。読んでいる最中に内容が書き換わると、読み手は自分が何を見ているのか分からなくなります。`String`の場合はさらに深刻で、追記によって文字列が入りきらなくなると、より広いメモリを確保し直してデータごと引っ越すことがあります。そうなると引っ越し前の場所を指したままの`viewer`は、破棄済みのメモリを指すことになってしまいます。Rustはこれをコンパイル時に禁止することで、実行時のバグを未然に防いでいます。

:::message{tip}
「`viewer`に**追記する前の内容**を残しておきたい」という意図だった場合は、この修正では目的を達成できません。そもそも参照では不可能だからです。参照は値そのものを持たず原本を指しているだけなので、仮に借用規則がなかったとしても、`push_str`の後に`viewer`から読める内容は`コーヒー ×2`に変わってしまいます。変更前の姿を取っておきたいなら、第7章で学んだ`order.clone()`で独立した値を作るしかありません（[[clone]]）。
:::
::::

## 07 - 借用はいつまで続くか

[[non-lexical-lifetimes]]と[[borrow]]に関する問題です。
次のコードもコンパイルエラー（E0502）になります。今度は**行の順番を入れ替えるだけ**で、出力を変えずに修正できます。どの行を動かせばよいか考えてください。

```txt:期待する出力
最初の点数: 80
全科目: [80, 95, 70]
```

<!-- rustc: expect E0502 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn main() {
    let mut scores = vec![80, 95];

    let first = &scores[0];

    scores.push(70);

    println!("最初の点数: {}", first);
    println!("全科目: {:?}", scores);
}
```

::::details[解答例と解説]
```rust playground
fn main() {
    let mut scores = vec![80, 95];

    let first = &scores[0];

    println!("最初の点数: {}", first); // firstの最後の使用をここへ移動した
    // ここでfirstによる共有借用が終わる

    scores.push(70); // 借用が終わっているので排他借用できる

    println!("全科目: {:?}", scores);
}
```
`first`という共有参照が生きている間に`scores.push(70)`が排他借用をしようとして、問題06と同じE0502になっていました。ここでのポイントは、**共有借用がどこで終わるか**です。

Rustの借用は、参照を束縛した変数がスコープの終わりに達するまで続くのではなく、**その参照が最後に使われた地点で終わります**。この判定方式を[[non-lexical-lifetimes]]（NLL）と呼びます。

そのため`println!("最初の点数: {}", first)`を`push`より前に移すだけで、借用は`println!`の行で終わり、その後の`push`は何にも邪魔されずに排他借用できるようになります。`first`という変数自体はまだスコープ内にありますが、もう使われないので借用は終わっている、という考え方です。

```rust playground
fn main() {
    let mut scores = vec![80, 95];

    let first = &scores[0];      // ← ここから共有借用が始まる
    println!("最初: {}", first); // ← firstの最後の使用。借用はここで終わる

    scores.push(70);             // 排他借用できる
    println!("{:?}", scores);
} // ← 昔のRustではここまで借用が続いていた
```

問題06と同じE0502でも、修正方法はまったく違います。問題06では共有参照と排他参照が同時に必要に見えて、実際には排他参照1つで足りたので**参照の数を減らしました**。こちらは`first`という参照が確かに必要なので数は減らせません。かわりに使う位置を動かして**借用の期間をずらす**わけです。

| | 問題06 | 問題07 |
| --- | --- | --- |
| 問題 | 2つの参照が同時に存在している | 1つの借用が必要以上に長く続いている |
| 修正 | 不要なほうの参照を消す | 最後の使用を前に動かす |

**エラーを消す方法ではなく、コードで何をしたいのかから修正方法を選んでください**。

:::message{tip}
借用が「最後の使用」で終わらない例外もあります。参照を保持している値が、破棄されるときにその参照を使う可能性がある場合、コンパイラはスコープの終わりでの破棄処理も「使用」とみなし、借用をそこまで延長します。これは`Drop`という後始末の仕組みを実装した型で起こるもので、詳しくは[[non-lexical-lifetimes]]の補足を参照してください。今の段階では「基本は最後の使用で終わる」と覚えておけば十分です。
:::
::::

## 08 - ダングリング参照

[[dangling-reference]]と[[ownership]]に関する問題です。
次のコードはコンパイルエラー（E0515）になります。関数`make_receipt`の**戻り値の型と最後の行**を変えて修正してください。

```txt:期待する出力
レシート: 弁当 500円
```

<!-- rustc: expect E0515 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
fn make_receipt(item: &str) -> &String {
    let receipt = format!("レシート: {}", item);

    &receipt
}

fn main() {
    let receipt = make_receipt("弁当 500円");

    println!("{}", receipt);
}
```

::::details[解答例と解説]
```rust playground
fn make_receipt(item: &str) -> String {
    let receipt = format!("レシート: {}", item);

    receipt // 参照ではなく所有権ごと返す
}

fn main() {
    let receipt = make_receipt("弁当 500円");

    println!("{}", receipt);
}
```
エラーメッセージは`cannot return reference to local variable 'receipt'`（E0515）——「ローカル変数への参照は返せない」です。

理由は第7章の問題01で学んだとおりです。`receipt`は`make_receipt`の中で作られた変数なので、関数を抜けるときにスコープを抜けて破棄されます。もし`&receipt`を返せてしまうと、呼び出し元が受け取るのは**すでに破棄された値を指す参照**になってしまいます。これを[[dangling-reference]]（ダングリング参照）と呼びます。

これが借用規則の4つめ「参照は常に有効な値を指していなければならない」です。C言語などでは同じコードがコンパイルを通ってしまい、実行時にクラッシュしたり、無関係なデータを壊しながら動き続けたりします。Rustではコンパイル時に確実に止められます。

修正は、参照ではなく**値そのものを返す**ことです。`String`を返せば所有権ごと呼び出し元へムーブするので、関数を抜けた後も値は生き続けます。第7章で学んだ「戻り値でも所有権は移動する」がここで効いてきます。

関数の中で新しく作った値は、参照では返せません。この対応関係を覚えておいてください。

| 返したいもの | 戻り値の型 |
| --- | --- |
| 関数の中で新しく作った値 | `String`（所有権を返す） |
| 引数で借りた値の一部 | `&str`などの参照でよい |

:::message{tip}
表の下段のように、引数で受け取った参照の一部を返すことは可能です。たとえば`fn first_word(text: &str) -> &str`のような関数は、返す参照が引数の指す値の一部なので、呼び出し元では有効なままです。この「どの引数から借りた参照なのか」をコンパイラに伝える仕組みをライフタイムと呼び、引数が1つの場合は今回のように省略できます。
:::
::::

## 09 - 応用: 参照で集計する

この章の総復習として、[[reference]]・[[borrow]]・[[slice]]・[[function]]を組み合わせた問題です。
点数を管理する2つの関数を実装して、テストに合格させてください。

- `total_score`: 点数のスライスを借りて、合計を返す（呼び出した後も呼び出し元で点数を使えること）
- `add_score`: 点数のベクタを借りて、新しい点数を末尾に追加する

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
// 点数のスライス&[i32]を借りて合計を返す関数total_scoreを定義せよ

// 点数のベクタを排他的に借りて、点数を1つ追加する関数add_scoreを定義せよ

#[test]
fn test_total_score() {
    let scores = vec![80, 95, 70];
    assert_eq!(total_score(&scores), 245);
    assert_eq!(scores.len(), 3); // 借りただけなので呼び出し後も使える
}

#[test]
fn test_add_score() {
    let mut scores = vec![80, 95];
    add_score(&mut scores, 70);
    assert_eq!(scores, vec![80, 95, 70]);
    assert_eq!(total_score(&scores), 245);
}

#[test]
fn test_total_score_empty() {
    let scores: Vec<i32> = Vec::new();
    assert_eq!(total_score(&scores), 0);
}
```

::::details[解答例と解説]
```rust playground
// 点数のスライス&[i32]を借りて合計を返す関数total_scoreを定義せよ
fn total_score(scores: &[i32]) -> i32 {
    let mut total = 0;

    for score in scores {
        total += score;
    }

    total
}

// 点数のベクタを排他的に借りて、点数を1つ追加する関数add_scoreを定義せよ
fn add_score(scores: &mut Vec<i32>, score: i32) {
    scores.push(score);
}

#[test]
fn test_total_score() {
    let scores = vec![80, 95, 70];
    assert_eq!(total_score(&scores), 245);
    assert_eq!(scores.len(), 3); // 借りただけなので呼び出し後も使える
}

#[test]
fn test_add_score() {
    let mut scores = vec![80, 95];
    add_score(&mut scores, 70);
    assert_eq!(scores, vec![80, 95, 70]);
    assert_eq!(total_score(&scores), 245);
}

#[test]
fn test_total_score_empty() {
    let scores: Vec<i32> = Vec::new();
    assert_eq!(total_score(&scores), 0);
}
```
2つの関数で、共有参照と排他参照を使い分けています。

**`total_score`は共有参照で受け取る**
読むだけなので`&[i32]`（スライス）で十分です。第6章と同じく、`&scores`（ベクタへの参照）を渡してもそのまま受け取れます。「読むだけの関数は共有参照で受け取る」がRustの基本形です。

**`add_score`は排他参照で受け取る**
要素を追加するので、書き換えの許可が必要です。呼び出し側も`&mut scores`と書き、所有者も`let mut scores`で宣言されている必要があります（問題03で見た3箇所の`mut`です）。

**引数の型は`&mut Vec<i32>`で`&mut [i32]`ではない**
`total_score`はスライスで受けたのに、`add_score`はベクタで受けています。スライスは「すでにある要素の並びを借りる」ものなので、要素数そのものを増やすことはできません。`push`で要素を増やすには、要素数を管理しているベクタ自身を借りる必要があります。

**テストの`assert_eq!(scores.len(), 3)`が通る意味**
`total_score(&scores)`を呼んだ後でも`scores`が使えています。第7章の書き方であれば、ここは所有権がムーブしてコンパイルエラーになっていました。これが借用の最大の利点です。

:::message{tip}
`add_score(&mut scores, 70)`の呼び出しでは、`&mut`を明示的に書いています。一方でメソッド呼び出しの`scores.push(70)`では`&mut`を書きません。これはメソッド呼び出しに限って排他借用が自動で補われるためです。自分で定義した関数を呼ぶときは、参照演算子を省略できないと覚えておいてください。
:::

これで第8章は終わりです。所有権・ムーブ・借用という、Rustのメモリ管理を支える3つの柱がそろいました。ここまで理解できていれば、Rustのコンパイルエラーの大半は自力で読み解けるようになっているはずです。

次の章からは、これらの土台の上に**自分で型を作る**方法に進みます。関連するデータをひとまとめにする**構造体**がテーマです。第5章のタプルでは`.0`・`.1`という番号でしか要素を区別できませんでしたが、構造体を使えばそれぞれに名前を付けられます。
::::
