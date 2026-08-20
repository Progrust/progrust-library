---
title: 第18章 トレイト
description: trait宣言によるメソッドシグネチャの定義、impl トレイト名 for 型名による実装、必須メソッドの実装漏れエラー、複数の型への同じトレイトの実装、デフォルト実装とその上書き、デフォルト実装から必須メソッドを呼ぶ組み立て方まで、型をまたいで「共通の振る舞い」を定義する仕組みを手を動かして学ぶ7問。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "問題集"]
public: true
---

第17章で、型引数`<T>`を使って「どんな型でも受け取れる」関数や構造体を書けるようになりました。ただ、ジェネリックな関数の中でできることは、まだ「値を受け取って、そのまま返す」程度に限られています。`T`がどんな型か分からない以上、そのメソッドを呼ぶことも、比較することもできないからです。

この章では、その穴を埋める道具である**トレイト**を7問で身につけます。トレイトは「この型はこういう振る舞いを持つ」という約束を書いたもので、`trait`宣言でメソッドのシグネチャを並べ、`impl トレイト名 for 型名`で型ごとに中身を実装します。同じトレイトを実装した型は、型が違っても同じメソッド名で同じように呼び出せます。

後半ではデフォルト実装を扱います。トレイト側にあらかじめ処理を書いておくと、実装する側は「その型にしか書けない部分」だけを書けばよくなります。標準ライブラリの主要なトレイトもこの形で整理されていて、次の第19章で扱う`#[derive(...)]`や、第20章のトレイト境界（型引数に「このトレイトを実装していること」を要求する仕組み）へとつながっていきます。

進め方は[第17章](/books/rust-learning/generics)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - トレイトを定義する

[[trait]]と[[impl-block]]に関する問題です。
「鳴き声を返す」という振る舞いを表すトレイト`Speak`を定義し、構造体`Dog`に実装してください。

```txt:期待する出力
ポチ「ワン！」
```

<!-- rustc: expect E0599 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
// メソッド fn speak(&self) -> String を持つトレイトSpeakを定義せよ

struct Dog {
    name: String,
}

// DogにSpeakを実装せよ
// speakは「名前「ワン！」」の形の文字列を返すこと

fn main() {
    let dog = Dog {
        name: String::from("ポチ"),
    };
    println!("{}", dog.speak());
}
```

::::details[解答例と解説]
```rust playground
// メソッド fn speak(&self) -> String を持つトレイトSpeakを定義せよ
trait Speak { // [!code ++]
    fn speak(&self) -> String; // [!code ++]
} // [!code ++]

struct Dog {
    name: String,
}

// DogにSpeakを実装せよ
// speakは「名前「ワン！」」の形の文字列を返すこと
impl Speak for Dog { // [!code ++]
    fn speak(&self) -> String { // [!code ++]
        format!("{}「ワン！」", self.name) // [!code ++]
    } // [!code ++]
} // [!code ++]

fn main() {
    let dog = Dog {
        name: String::from("ポチ"),
    };
    println!("{}", dog.speak());
}
```
修正前のコードは`no method named `speak` found for struct `Dog` in the current scope`（エラー: E0599）になります。第10章で見たのと同じ「そんなメソッドはない」というエラーです。

[[trait]]は、「この型はこういう振る舞いを持つ」という**約束**を書く仕組みです。書き方は2段階に分かれます。

**1. `trait`宣言で約束の内容を決める**
`trait Speak { ... }`の中に、求める[[method]]のシグネチャを並べます。`fn speak(&self) -> String;`のように、本体の`{ ... }`を書かずに`;`で終えるのが特徴です。「`speak`というメソッドがあって、`&self`を受け取って`String`を返す」という形だけを決めていて、中身はここでは書きません。

**2. `impl トレイト名 for 型名`で約束を果たす**
`impl Speak for Dog { ... }`の中に、シグネチャどおりのメソッドを本体付きで書きます。ここは第10章の[[impl-block]]とほぼ同じ見た目ですが、`impl Dog { ... }`が「`Dog`固有のメソッドを追加する」だったのに対し、`impl Speak for Dog { ... }`は「`Dog`が`Speak`の約束を果たす」という意味になります。

実装してしまえば、呼び出し方は普通のメソッドと変わりません。`dog.speak()`と書くだけです。

:::message{tip}
「わざわざトレイトを経由せず、`impl Dog`に直接`speak`を書けばいいのでは」と思うかもしれません。今回のように型が1つだけなら、そのとおりです。トレイトの価値は、問題03で見るように**複数の型に同じ約束をさせる**ところにあります。
:::
::::

## 02 - 実装が足りない

[[trait]]に関する問題です。
次のコードはコンパイルエラーになります。エラーメッセージを読んで、原因を取り除いてください。

```txt:期待する出力
正方形の面積: 9
```

<!-- rustc: expect E0046 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Shape {
    fn name(&self) -> String;
    fn area(&self) -> u32;
}

struct Square {
    side: u32,
}

impl Shape for Square {
    fn area(&self) -> u32 {
        self.side * self.side
    }
}

fn main() {
    let square = Square { side: 3 };
    println!("{}の面積: {}", square.name(), square.area());
}
```

::::details[解答例と解説]
```rust playground
trait Shape {
    fn name(&self) -> String;
    fn area(&self) -> u32;
}

struct Square {
    side: u32,
}

impl Shape for Square {
    fn name(&self) -> String { // [!code ++]
        String::from("正方形") // [!code ++]
    } // [!code ++]

    fn area(&self) -> u32 {
        self.side * self.side
    }
}

fn main() {
    let square = Square { side: 3 };
    println!("{}の面積: {}", square.name(), square.area());
}
```
エラーメッセージは`not all trait items implemented, missing: `name``（エラー: E0046）です。「トレイトの項目がすべて実装されていない。`name`が足りない」と、何が足りないのかまで教えてくれています。

`trait Shape`は`name`と`area`の2つのメソッドを要求しています。`impl Shape for Square`は`area`しか書いていないので、「約束を果たしていない」と判定されます。`;`で終わる本体なしのメソッドは**必須メソッド**で、実装側は1つ残らず定義しなければなりません。

逆に、トレイトで宣言していないメソッドを`impl Shape for Square`の中に勝手に追加することもできません（エラー: E0407）。トレイトの実装ブロックに書けるのは、トレイトが宣言した項目だけです。`Square`固有のメソッドを足したいときは、別に`impl Square { ... }`を用意します。

:::message{tip}
「足りないとエラー」は面倒に見えますが、これは**コンパイラが約束の履行をチェックしてくれる**ということです。後からトレイトにメソッドを1つ追加すると、そのトレイトを実装しているすべての型でE0046が出て、「どこに実装を足すべきか」を漏れなく教えてくれます。第11章の`match`の網羅性チェックと同じ発想です。
:::
::::

## 03 - 複数の型に同じトレイトを実装する

[[trait]]と[[struct]]に関する問題です。
`Book`には`Describe`トレイトが実装済みです。`Pen`にも同じトレイトを実装して、どちらの値でも`describe`メソッドを呼べるようにしてください。

```txt:期待する出力
書籍『Rust入門』 3200円
ボールペン（黒） 150円
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

struct Pen {
    color: String,
    price: u32,
}

// PenにDescribeを実装せよ
// describeは「ボールペン（色） 価格円」の形の文字列を返すこと

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
        price: 3200,
    };
    let pen = Pen {
        color: String::from("黒"),
        price: 150,
    };
    println!("{}", book.describe());
    println!("{}", pen.describe());
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

struct Pen {
    color: String,
    price: u32,
}

// PenにDescribeを実装せよ
// describeは「ボールペン（色） 価格円」の形の文字列を返すこと
impl Describe for Pen { // [!code ++]
    fn describe(&self) -> String { // [!code ++]
        format!("ボールペン（{}） {}円", self.color, self.price) // [!code ++]
    } // [!code ++]
} // [!code ++]

fn main() {
    let book = Book {
        title: String::from("Rust入門"),
        price: 3200,
    };
    let pen = Pen {
        color: String::from("黒"),
        price: 150,
    };
    println!("{}", book.describe());
    println!("{}", pen.describe());
}
```
1つの[[trait]]は、いくつの型にでも実装できます。`impl Describe for Book`と`impl Describe for Pen`を並べて書けば、`Book`と`Pen`はまったく別の[[struct]]なのに、どちらも`.describe()`という同じ呼び出し方で説明文を返せるようになります。

ここで注目したいのは、`Book`と`Pen`の`describe`の中身がまったく違うことです。`Book`は`title`を、`Pen`は`color`を使っていて、フィールドの構成も共通していません。それでもトレイトが決めているのは「`describe`を呼べば`String`が返る」という**シグネチャだけ**なので、中身は型ごとに自由に書けます。

この「呼び方は同じ、中身は型ごと」という性質が、トレイトの本質です。`main`のように値ごとにメソッドを呼ぶ場面では、呼び出す側は相手が`Book`か`Pen`かを意識せず、「`Describe`を実装している何か」として扱えます。

:::message{tip}
第17章のジェネリック関数は「どんな型でも受け取れる」代わりに、型引数`T`の値に対してできることがほとんどありませんでした。トレイトと組み合わせて「`Describe`を実装している型なら何でも受け取り、その中で`describe`を呼ぶ」と書けるようにする仕組みが、第20章で扱う**トレイト境界**です。この章ではまず、トレイトそのものの書き方に慣れておきましょう。
:::
::::

## 04 - デフォルト実装

[[default-implementation]]と[[trait]]に関する問題です。
次のコードはコンパイルエラーになります。`impl`ブロックには手を加えず、**トレイト側を修正して**動くようにしてください。

```txt:期待する出力
こんにちは
こんにちは
```

<!-- rustc: expect E0046 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Greet {
    // 「こんにちは」を返す既定の処理をここに書け
    fn greet(&self) -> String;
}

struct Staff;
struct Customer;

impl Greet for Staff {}
impl Greet for Customer {}

fn main() {
    println!("{}", Staff.greet());
    println!("{}", Customer.greet());
}
```

::::details[解答例と解説]
```rust playground
trait Greet {
    // 「こんにちは」を返す既定の処理をここに書け
    fn greet(&self) -> String; // [!code --]
    fn greet(&self) -> String { // [!code ++]
        String::from("こんにちは") // [!code ++]
    } // [!code ++]
}

struct Staff;
struct Customer;

impl Greet for Staff {}
impl Greet for Customer {}

fn main() {
    println!("{}", Staff.greet());
    println!("{}", Customer.greet());
}
```
エラーは問題02と同じ`not all trait items implemented, missing: `greet``（エラー: E0046）です。`impl Greet for Staff {}`と`impl Greet for Customer {}`はどちらも中身が空なので、必須メソッドの`greet`が足りないと指摘されています。

問題02では`impl`側にメソッドを足して解決しましたが、今回は別の方法を使います。トレイト宣言の中で、シグネチャだけでなく**本体まで**書いてしまうのです。これを[[default-implementation]]（デフォルト実装）と呼びます。

本体を持つメソッドは必須ではなくなり、実装側が書かなければトレイト側の本体がそのまま使われます。`Staff`も`Customer`も`greet`を書いていないので、どちらも「こんにちは」が返ります。すべてのメソッドにデフォルト実装があるなら、今回のように**中身が空の`impl`ブロック**でトレイトを実装できます。

「必須メソッド」と「デフォルト実装付きメソッド」の違いは、本体があるかどうかだけです。

| トレイト側の書き方 | 実装側の扱い |
| --- | --- |
| `fn greet(&self) -> String;` | 必ず定義する（書かないとE0046） |
| `fn greet(&self) -> String { ... }` | 書かなくてよい（書かなければデフォルトが使われる） |

:::message{tip}
`Staff`と`Customer`は、第9章で触れたフィールドを持たない**ユニット構造体**です。`Staff.greet()`のように、型名をそのまま値として使えます。今回のように「データは持たないが振る舞いだけ区別したい」場面では重宝します。
:::
::::

## 05 - デフォルト実装を上書きする

[[default-implementation]]に関する問題です。
`Staff`はデフォルトの挨拶のままにし、`Robot`だけ独自の挨拶を返すようにしてください。

```txt:期待する出力
こんにちは
ピピッ、コンニチハ
```

```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Greet {
    fn greet(&self) -> String {
        String::from("こんにちは")
    }
}

struct Staff;
struct Robot;

impl Greet for Staff {}

// Robotのgreetは「ピピッ、コンニチハ」を返すようにせよ
impl Greet for Robot {}

fn main() {
    println!("{}", Staff.greet());
    println!("{}", Robot.greet());
}
```

::::details[解答例と解説]
```rust playground
trait Greet {
    fn greet(&self) -> String {
        String::from("こんにちは")
    }
}

struct Staff;
struct Robot;

impl Greet for Staff {}

// Robotのgreetは「ピピッ、コンニチハ」を返すようにせよ
impl Greet for Robot {} // [!code --]
impl Greet for Robot { // [!code ++]
    fn greet(&self) -> String { // [!code ++]
        String::from("ピピッ、コンニチハ") // [!code ++]
    } // [!code ++]
} // [!code ++]

fn main() {
    println!("{}", Staff.greet());
    println!("{}", Robot.greet());
}
```
[[default-implementation]]は「実装側が書かなかったときに使われる処理」なので、実装側が**同じ名前・同じシグネチャ**でメソッドを定義すれば、そちらが優先されます。これを**上書き**と呼びます。

`Staff`は`impl`ブロックを空のままにしているのでデフォルトの「こんにちは」が、`Robot`は`greet`を定義しているので独自の「ピピッ、コンニチハ」が返ります。上書きするかどうかは型ごとに自由に選べます。

このとき、上書きする側のシグネチャは、トレイトで宣言したもの（`fn greet(&self) -> String`）と一致している必要があります。戻り値の型を変えたり引数を増やしたりすると、「トレイトと実装で型が合わない」というコンパイルエラー（E0053）になります。

:::message{tip}
上書きは「置き換え」です。`Robot`の`greet`の中から「デフォルト実装の`greet`」を呼び出して結果に手を加える、といったことはできません。デフォルトの処理を土台にして前後に何かを足したい場合は、共通部分を別のメソッド（デフォルト実装付き）に切り出しておき、両方からそれを呼ぶ形にします。
:::
::::

## 06 - デフォルト実装から必須メソッドを呼ぶ

[[default-implementation]]と[[trait]]に関する問題です。
`Exam`と`Quiz`の2つの型に`Score`トレイトを実装してください。実装するのは`points`だけで構いません。

```txt:期待する出力
期末試験: 85点 → 合格（B）
小テスト: 40点 → 不合格（D）
```

<!-- rustc: expect E0599 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Score {
    fn points(&self) -> u32;

    fn rank(&self) -> String {
        if self.points() >= 90 {
            String::from("A")
        } else if self.points() >= 70 {
            String::from("B")
        } else if self.points() >= 60 {
            String::from("C")
        } else {
            String::from("D")
        }
    }

    fn passed(&self) -> bool {
        self.points() >= 60
    }

    fn summary(&self) -> String {
        let result = if self.passed() { "合格" } else { "不合格" };
        format!("{}点 → {}（{}）", self.points(), result, self.rank())
    }
}

struct Exam {
    score: u32,
}

struct Quiz {
    correct: u32, // 正答数。1問10点
}

// ExamにScoreを実装せよ（pointsはscoreをそのまま返す）

// QuizにScoreを実装せよ（pointsは正答数×10を返す）

fn main() {
    let exam = Exam { score: 85 };
    let quiz = Quiz { correct: 4 };
    println!("期末試験: {}", exam.summary());
    println!("小テスト: {}", quiz.summary());
}
```

::::details[解答例と解説]
```rust playground
trait Score {
    fn points(&self) -> u32;

    fn rank(&self) -> String {
        if self.points() >= 90 {
            String::from("A")
        } else if self.points() >= 70 {
            String::from("B")
        } else if self.points() >= 60 {
            String::from("C")
        } else {
            String::from("D")
        }
    }

    fn passed(&self) -> bool {
        self.points() >= 60
    }

    fn summary(&self) -> String {
        let result = if self.passed() { "合格" } else { "不合格" };
        format!("{}点 → {}（{}）", self.points(), result, self.rank())
    }
}

struct Exam {
    score: u32,
}

struct Quiz {
    correct: u32, // 正答数。1問10点
}

// ExamにScoreを実装せよ（pointsはscoreをそのまま返す）
impl Score for Exam { // [!code ++]
    fn points(&self) -> u32 { // [!code ++]
        self.score // [!code ++]
    } // [!code ++]
} // [!code ++]

// QuizにScoreを実装せよ（pointsは正答数×10を返す）
impl Score for Quiz { // [!code ++]
    fn points(&self) -> u32 { // [!code ++]
        self.correct * 10 // [!code ++]
    } // [!code ++]
} // [!code ++]

fn main() {
    let exam = Exam { score: 85 };
    let quiz = Quiz { correct: 4 };
    println!("期末試験: {}", exam.summary());
    println!("小テスト: {}", quiz.summary());
}
```
`Score`トレイトには4つのメソッドがありますが、必須なのは本体のない`points`だけです。残りの`rank`・`passed`・`summary`は[[default-implementation]]で、しかもその中身はすべて`self.points()`を呼んで組み立てられています。

デフォルト実装の本体では、`self`を通じて**同じトレイトの他のメソッド**を呼べます。呼ぶ相手が必須メソッドで、トレイト宣言の時点ではまだ中身が決まっていなくても構いません。実際に`exam.summary()`が実行されるときには`self`は`Exam`なので、`Exam`の`points`（`self.score`）が呼ばれます。`quiz.summary()`なら`Quiz`の`points`（`self.correct * 10`）です。

この形にすると、**トレイト側が多くの機能を提供しながら、実装側に要求するのはごく一部**で済みます。`Exam`と`Quiz`は`points`を3行書いただけで、`rank`・`passed`・`summary`の3つをまとめて手に入れました。型が10個に増えても、書くのはそれぞれの`points`だけです。

:::message{tip}
デフォルト実装の本体で、`self.score`のように実装先の型のフィールドを直接書くことはできません。トレイト宣言の時点では、`self`がどの型になるか決まっていないからです。値に触れる手段は、トレイトが宣言したメソッド（今回なら`points`）経由に限られます。「必須メソッドで値を取り出し、デフォルト実装でそれを加工する」という役割分担は、この制約から自然に決まります。
:::
::::

## 07 - 応用: 通知システム

[[trait]]と[[default-implementation]]に関する問題です。第18章の総復習として、通知メッセージを組み立てる仕組みをトレイトで作ります。

まず、次の4つのメソッドを持つトレイト`Notify`を定義します。

| メソッド | 種類 | 内容 |
| --- | --- | --- |
| `recipient(&self) -> String` | 必須 | 宛先の表記を返す |
| `content(&self) -> String` | 必須 | 本文を返す |
| `channel(&self) -> String` | デフォルト実装 | 通知の種別。既定では「通知」を返す |
| `message(&self) -> String` | デフォルト実装 | `[種別] 宛先: 本文`の形に組み立てて返す |

そのうえで、`Email`と`Sms`に`Notify`を実装し、すべてのテストに合格させてください。

| 型 | `recipient` | `content` | `channel` |
| --- | --- | --- | --- |
| `Email` | `名前 <アドレス>` | `件名 / 本文` | 「メール」に上書きする |
| `Sms` | `名前 (電話番号)` | 本文そのまま | デフォルトのまま |

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
// トレイトNotifyを定義せよ（recipient・contentは必須、channel・messageはデフォルト実装）

struct Email {
    to: String,
    address: String,
    subject: String,
    body: String,
}

struct Sms {
    to: String,
    phone: String,
    text: String,
}

// EmailにNotifyを実装せよ（channelは「メール」に上書き）

// SmsにNotifyを実装せよ（channelはデフォルトのまま）

fn sample_email() -> Email {
    Email {
        to: String::from("太郎"),
        address: String::from("taro@example.com"),
        subject: String::from("請求書"),
        body: String::from("今月分を送付しました"),
    }
}

fn sample_sms() -> Sms {
    Sms {
        to: String::from("花子"),
        phone: String::from("090-0000-0000"),
        text: String::from("配達が完了しました"),
    }
}

#[test]
fn test_channel() {
    assert_eq!(sample_email().channel(), "メール");
    assert_eq!(sample_sms().channel(), "通知");
}

#[test]
fn test_recipient_and_content() {
    let email = sample_email();
    assert_eq!(email.recipient(), "太郎 <taro@example.com>");
    assert_eq!(email.content(), "請求書 / 今月分を送付しました");

    let sms = sample_sms();
    assert_eq!(sms.recipient(), "花子 (090-0000-0000)");
    assert_eq!(sms.content(), "配達が完了しました");
}

#[test]
fn test_message() {
    assert_eq!(
        sample_email().message(),
        "[メール] 太郎 <taro@example.com>: 請求書 / 今月分を送付しました"
    );
    assert_eq!(
        sample_sms().message(),
        "[通知] 花子 (090-0000-0000): 配達が完了しました"
    );
}
```

::::details[解答例と解説]
```rust playground
// トレイトNotifyを定義せよ（recipient・contentは必須、channel・messageはデフォルト実装）
trait Notify { // [!code ++]
    fn recipient(&self) -> String; // [!code ++]
    fn content(&self) -> String; // [!code ++]

    fn channel(&self) -> String { // [!code ++]
        String::from("通知") // [!code ++]
    } // [!code ++]

    fn message(&self) -> String { // [!code ++]
        format!("[{}] {}: {}", self.channel(), self.recipient(), self.content()) // [!code ++]
    } // [!code ++]
} // [!code ++]

struct Email {
    to: String,
    address: String,
    subject: String,
    body: String,
}

struct Sms {
    to: String,
    phone: String,
    text: String,
}

// EmailにNotifyを実装せよ（channelは「メール」に上書き）
impl Notify for Email { // [!code ++]
    fn recipient(&self) -> String { // [!code ++]
        format!("{} <{}>", self.to, self.address) // [!code ++]
    } // [!code ++]

    fn content(&self) -> String { // [!code ++]
        format!("{} / {}", self.subject, self.body) // [!code ++]
    } // [!code ++]

    fn channel(&self) -> String { // [!code ++]
        String::from("メール") // [!code ++]
    } // [!code ++]
} // [!code ++]

// SmsにNotifyを実装せよ（channelはデフォルトのまま）
impl Notify for Sms { // [!code ++]
    fn recipient(&self) -> String { // [!code ++]
        format!("{} ({})", self.to, self.phone) // [!code ++]
    } // [!code ++]

    fn content(&self) -> String { // [!code ++]
        self.text.clone() // [!code ++]
    } // [!code ++]
} // [!code ++]

fn sample_email() -> Email {
    Email {
        to: String::from("太郎"),
        address: String::from("taro@example.com"),
        subject: String::from("請求書"),
        body: String::from("今月分を送付しました"),
    }
}

fn sample_sms() -> Sms {
    Sms {
        to: String::from("花子"),
        phone: String::from("090-0000-0000"),
        text: String::from("配達が完了しました"),
    }
}

#[test]
fn test_channel() {
    assert_eq!(sample_email().channel(), "メール");
    assert_eq!(sample_sms().channel(), "通知");
}

#[test]
fn test_recipient_and_content() {
    let email = sample_email();
    assert_eq!(email.recipient(), "太郎 <taro@example.com>");
    assert_eq!(email.content(), "請求書 / 今月分を送付しました");

    let sms = sample_sms();
    assert_eq!(sms.recipient(), "花子 (090-0000-0000)");
    assert_eq!(sms.content(), "配達が完了しました");
}

#[test]
fn test_message() {
    assert_eq!(
        sample_email().message(),
        "[メール] 太郎 <taro@example.com>: 請求書 / 今月分を送付しました"
    );
    assert_eq!(
        sample_sms().message(),
        "[通知] 花子 (090-0000-0000): 配達が完了しました"
    );
}
```
この章で学んだことが、1つの[[trait]]に全部入っています。

**必須メソッドとデフォルト実装の切り分け**
`recipient`と`content`は型ごとに中身がまったく違うので必須メソッドにし、`channel`と`message`は共通の処理で済むので[[default-implementation]]にしています。「型ごとに違う部分だけを必須にし、残りは共通化する」のがトレイト設計の基本です。

**デフォルト実装どうしの組み合わせ**
`message`は、必須の`recipient`・`content`だけでなく、デフォルト実装の`channel`も呼んでいます。問題06の形の発展で、呼ぶ相手が必須かデフォルトかは関係ありません。

**上書きは「呼ばれる側」にも効く**
`Email`は`channel`を「メール」に上書きしています。`message`自体は上書きしていませんが、`message`の中の`self.channel()`は`Email`の実装を呼ぶので、`email.message()`の結果も`[メール] ...`に変わります。1か所の上書きが、それを利用するデフォルト実装すべてに波及します。

**`self.text.clone()`と書く理由**
`content`は`String`を返す約束なので、`self.text`をそのまま返すと`&self`越しにフィールドの所有権を持ち出すことになり、第8章で学んだ「借用からムーブできない」エラーになります。`.clone()`で複製を返せば、`self`のフィールドはそのまま残ります。

**`assert_eq!`で`String`と`&str`を比べられる理由**
`recipient()`が返すのは`String`、比較相手は`&str`です。第11章でも触れたとおり、標準ライブラリが`String`と`&str`の比較をあらかじめ用意しているので、そのまま比べられます。実はこの「あらかじめ用意されている比較」も、標準ライブラリが`PartialEq`というトレイトを`String`に実装していることで実現されています。

:::message{tip}
これで第18章は終わりです。トレイトで「共通の振る舞い」を定義し、複数の型にそれぞれ実装し、デフォルト実装で共通部分をまとめられるようになりました。

次の第19章では、これまで「おまじない」として書いてきた`#[derive(Debug, PartialEq)]`の正体を明かします。`Debug`も`PartialEq`も`Clone`も、実は標準ライブラリが定義した**ただのトレイト**で、`derive`はその実装を自動生成する仕組みです。この章で書いた`impl トレイト名 for 型名`を、コンパイラが代わりに書いてくれていた、というわけです。
:::
::::
