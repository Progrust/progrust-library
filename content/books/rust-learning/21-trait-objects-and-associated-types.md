---
title: 第21章 トレイトオブジェクトと関連型
description: dyn Traitで異なる型を1つのベクタにまとめるトレイトオブジェクト、実行時に実装が選ばれる動的ディスパッチとジェネリクスの使い分け、トレイトの中で型を後から決める関連型、Addトレイトによる演算子オーバーロードまで、トレイトを「型をまたいで使う」2つの方向を手を動かして学ぶ7問。
created_at: 2026-08-21
updated_at: 2026-08-21
tags: ["トレイト", "問題集"]
public: true
---

第20章で、トレイト境界と`impl Trait`によって「このトレイトを実装した型なら何でも受け取れる」関数が書けるようになりました。ただし、それらはいずれも**コンパイル時に型が1つに決まる**仕組みでした。`Vec<T>`の`T`は1つの型にしかなれないので、「犬も猫も入ったベクタ」のような、型の混ざったコレクションは作れません。

この章の前半では、その壁を越える**トレイトオブジェクト**（`dyn トレイト名`）を扱います。「このトレイトを実装した何らかの型」を1つの型として扱えるようになり、どのメソッド実装を呼ぶかは実行時に決まります。ジェネリクスとは何が違い、どう使い分けるのかも合わせて確認します。

後半は**関連型**です。これまでのトレイトはメソッドしか持っていませんでしたが、トレイトは「この型は実装側で決めてよい」という型のプレースホルダも持てます。その応用として、`+`などの演算子を自作の型で使えるようにする**演算子オーバーロード**まで進みます。標準ライブラリの`Add`トレイトが、関連型をどう使っているかを実際に見ることになります。

進め方は[第20章](/books/rust-learning/trait-bounds-and-impl-trait)までと同じです。各問題の冒頭に関連する辞書へのリンクを挙げているので、まずはリンク先で必要な知識を確認してから取り組んでください。

## 01 - Vecに異なる型を入れたい

[[trait-object]]と[[vec]]と[[trait]]に関する問題です。
次のコードはコンパイルエラー（E0308）になります。`Dog`と`Cat`の両方を1つのベクタに入れられるよう、`animals`の型注釈を書き足して修正してください。

```txt:期待する出力
ポチはワンと鳴く
タマはニャーと鳴く
```

<!-- rustc: expect E0308 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Animal {
    fn name(&self) -> String;
    fn cry(&self) -> String;
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn name(&self) -> String {
        String::from("ポチ")
    }
    fn cry(&self) -> String {
        String::from("ワン")
    }
}

impl Animal for Cat {
    fn name(&self) -> String {
        String::from("タマ")
    }
    fn cry(&self) -> String {
        String::from("ニャー")
    }
}

fn main() {
    let dog = Dog;
    let cat = Cat;

    let animals = vec![&dog, &cat];

    for animal in &animals {
        println!("{}は{}と鳴く", animal.name(), animal.cry());
    }
}
```

::::details[解答例と解説]
```rust playground
trait Animal {
    fn name(&self) -> String;
    fn cry(&self) -> String;
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn name(&self) -> String {
        String::from("ポチ")
    }
    fn cry(&self) -> String {
        String::from("ワン")
    }
}

impl Animal for Cat {
    fn name(&self) -> String {
        String::from("タマ")
    }
    fn cry(&self) -> String {
        String::from("ニャー")
    }
}

fn main() {
    let dog = Dog;
    let cat = Cat;

    let animals = vec![&dog, &cat]; // [!code --]
    let animals: Vec<&dyn Animal> = vec![&dog, &cat]; // [!code ++]

    for animal in &animals {
        println!("{}は{}と鳴く", animal.name(), animal.cry());
    }
}
```
エラーメッセージは`mismatched types`（E0308）で、`expected '&Dog', found '&Cat'`と続きます。`vec![&dog, &cat]`の最初の要素から「これは`Vec<&Dog>`だ」と推論されたところへ、`&Cat`が来たので型が合わない、という指摘です。

第17章で学んだとおり、`Vec<T>`の`T`は**1つの型**に決まります。`Dog`と`Cat`が同じ`Animal`トレイトを実装していても、型としては別物なので、そのままでは同じベクタに入りません。

ここで使うのが[[trait-object]]です。`dyn Animal`は「`Animal`を実装している**何らかの型**」を表す型で、`Dog`でも`Cat`でもこの型として扱えます。要素の型を`&dyn Animal`にすれば、ベクタの`T`は`&dyn Animal`という1つの型に揃い、中身が`&Dog`でも`&Cat`でも受け入れられます。

`dyn Animal`が具体的にどの型なのかはコンパイル時には分かりません。そのため値をそのまま置くことはできず、**必ず`&`などのポインタ越しに**扱います。この問題では`&dog`・`&cat`と参照を入れているので`&dyn Animal`になりました。

`for`ループの中では`animal.name()`や`animal.cry()`と、これまでどおりメソッドを呼べています。`Animal`トレイトのメソッドであることは分かっているので、`Dog`版と`Cat`版のどちらが動くかは要素ごとに実行時に決まります。この仕組みは次の問題02で詳しく見ます。

:::message{tip}
型注釈を書かずに`vec![&dog as &dyn Animal, &cat]`と最初の要素で型を示す書き方もありますが、`let animals: Vec<&dyn Animal>`と左辺に書くほうが「異なる型が混ざるベクタ」であることが一目で分かります。

なお、参照ではなく値の所有権ごとベクタに入れたい場合は、ヒープに置いた値を指す`Box`というポインタ型を使って`Vec<Box<dyn Animal>>`と書きます。`Box`はこの本ではまだ扱っていないので、この章では参照の形`&dyn Animal`で進めます。
:::
::::

## 02 - &dyn Traitを引数で受け取る

[[trait-object]]と[[reference]]に関する問題です。
`introduce`関数を定義して、トレイトオブジェクト経由で`Dog`と`Cat`を紹介してください。

```txt:期待する出力
ポチと申します。ワン！
タマと申します。ニャー！
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Animal {
    fn name(&self) -> String;
    fn cry(&self) -> String;
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn name(&self) -> String {
        String::from("ポチ")
    }
    fn cry(&self) -> String {
        String::from("ワン")
    }
}

impl Animal for Cat {
    fn name(&self) -> String {
        String::from("タマ")
    }
    fn cry(&self) -> String {
        String::from("ニャー")
    }
}

// 関数introduceを定義せよ
//   引数: &dyn Animal
//   処理: 「〇〇と申します。△△！」と出力する（〇〇は名前、△△は鳴き声）

fn main() {
    let dog = Dog;
    let cat = Cat;

    introduce(&dog);
    introduce(&cat);
}
```

::::details[解答例と解説]
```rust playground
trait Animal {
    fn name(&self) -> String;
    fn cry(&self) -> String;
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn name(&self) -> String {
        String::from("ポチ")
    }
    fn cry(&self) -> String {
        String::from("ワン")
    }
}

impl Animal for Cat {
    fn name(&self) -> String {
        String::from("タマ")
    }
    fn cry(&self) -> String {
        String::from("ニャー")
    }
}

// 関数introduceを定義せよ
//   引数: &dyn Animal
//   処理: 「〇〇と申します。△△！」と出力する（〇〇は名前、△△は鳴き声）
fn introduce(animal: &dyn Animal) { // [!code ++]
    println!("{}と申します。{}！", animal.name(), animal.cry()); // [!code ++]
} // [!code ++]

fn main() {
    let dog = Dog;
    let cat = Cat;

    introduce(&dog);
    introduce(&cat);
}
```
`&dyn Animal`は関数の引数にも書けます。呼び出し側は`&dog`・`&cat`と普通の[[reference]]を渡すだけで、受け取る側では`&dyn Animal`というトレイトオブジェクトとして扱われます。

`introduce`関数の中では、`animal`が`Dog`なのか`Cat`なのかは分かりません。分かっているのは「`Animal`を実装している何か」ということだけです。それでも`animal.name()`と書けるのは、`Animal`トレイトに`name`メソッドがあると宣言されているからです。

では、実際に`Dog::name`と`Cat::name`のどちらが動くのかは、いつ決まるのでしょうか。答えは**実行時**です。`&dyn Animal`は、値へのポインタに加えて「この値の型における`Animal`の各メソッドはどこにあるか」という表（vtable）へのポインタも持っています。メソッドを呼ぶたびにこの表を引いて、該当する実装へ飛びます。これを**動的ディスパッチ**と呼びます。

第20章の`fn introduce(animal: &impl Animal)`や`fn introduce<T: Animal>(animal: &T)`では、呼び出しごとに型が1つに決まり、コンパイル時に`Dog`用・`Cat`用の関数がそれぞれ作られていました（静的ディスパッチ）。`&dyn Animal`版は関数が1つだけで、その中で実行時に振り分けています。書き味はほとんど同じですが、裏側の仕組みが違います。次の問題03で2つを並べて比べます。

:::message{tip}
`&dyn Animal`は通常の参照の2倍の大きさを持つ「太い」ポインタです。vtableへのポインタを一緒に運んでいるためで、普段意識する必要はありませんが、「なぜ`dyn`はポインタ越しでなければならないのか」を考えるときの手がかりになります。
:::
::::

## 03 - ジェネリクスとの使い分け

[[trait-object]]と[[generics]]と[[impl-trait]]に関する問題です。
`introduce_dyn`と同じ処理をする`introduce_impl`関数を、引数を`&impl Animal`にして定義してください。

```txt:期待する出力
[impl] ポチと申します。ワン！
[impl] タマと申します。ニャー！
[dyn] ポチと申します。ワン！
[dyn] タマと申します。ニャー！
```

<!-- rustc: expect E0425 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Animal {
    fn name(&self) -> String;
    fn cry(&self) -> String;
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn name(&self) -> String {
        String::from("ポチ")
    }
    fn cry(&self) -> String {
        String::from("ワン")
    }
}

impl Animal for Cat {
    fn name(&self) -> String {
        String::from("タマ")
    }
    fn cry(&self) -> String {
        String::from("ニャー")
    }
}

// 関数introduce_implを定義せよ
//   引数: &impl Animal
//   処理: 「[impl] 〇〇と申します。△△！」と出力する

fn introduce_dyn(animal: &dyn Animal) {
    println!("[dyn] {}と申します。{}！", animal.name(), animal.cry());
}

fn main() {
    let dog = Dog;
    let cat = Cat;

    introduce_impl(&dog);
    introduce_impl(&cat);

    let animals: Vec<&dyn Animal> = vec![&dog, &cat];
    for animal in animals {
        introduce_dyn(animal);
    }
}
```

::::details[解答例と解説]
```rust playground
trait Animal {
    fn name(&self) -> String;
    fn cry(&self) -> String;
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn name(&self) -> String {
        String::from("ポチ")
    }
    fn cry(&self) -> String {
        String::from("ワン")
    }
}

impl Animal for Cat {
    fn name(&self) -> String {
        String::from("タマ")
    }
    fn cry(&self) -> String {
        String::from("ニャー")
    }
}

// 関数introduce_implを定義せよ
//   引数: &impl Animal
//   処理: 「[impl] 〇〇と申します。△△！」と出力する
fn introduce_impl(animal: &impl Animal) { // [!code ++]
    println!("[impl] {}と申します。{}！", animal.name(), animal.cry()); // [!code ++]
} // [!code ++]

fn introduce_dyn(animal: &dyn Animal) {
    println!("[dyn] {}と申します。{}！", animal.name(), animal.cry());
}

fn main() {
    let dog = Dog;
    let cat = Cat;

    introduce_impl(&dog);
    introduce_impl(&cat);

    let animals: Vec<&dyn Animal> = vec![&dog, &cat];
    for animal in animals {
        introduce_dyn(animal);
    }
}
```
2つの関数は、本体の中身がまったく同じです。違いは引数の型が`&impl Animal`か`&dyn Animal`かだけで、呼び出し方もどちらも`&dog`・`&cat`を渡すだけです。それでも、コンパイラがしていることは次のように異なります。

| 観点 | `&impl Animal`（ジェネリクス） | `&dyn Animal`（トレイトオブジェクト） |
| --- | --- | --- |
| 呼ぶ実装が決まるとき | コンパイル時（静的ディスパッチ） | 実行時（動的ディスパッチ） |
| 生成される関数 | `Dog`用と`Cat`用の2つ | 1つ |
| 実行時のコスト | なし | vtableを引く分だけかかる |
| 異なる型の混在 | 不可 | 可（`Vec<&dyn Animal>`） |

`introduce_impl`は第20章で学んだとおり、`fn introduce_impl<T: Animal>(animal: &T)`の糖衣構文です。`Dog`で呼べば`T = Dog`、`Cat`で呼べば`T = Cat`の専用関数がコンパイル時に作られるので（単相化）、呼び先は最初から決まっています。

一方、`main`の後半の`for`ループでは`animals`の要素が`&dyn Animal`なので、`introduce_impl`に渡すことはできません。`T`を`Dog`か`Cat`のどちらかに決めようがないからです。ここでは`introduce_dyn`が必要になります。

使い分けの目安はシンプルです。

- 関数の引数として1つの値を受け取るだけなら、**ジェネリクス（`impl Trait`）が基本**です。実行時コストがなく、最適化も効きます
- 「異なる型を同じコレクションに入れたい」「実行時にどの型が来るか決まる」なら、**トレイトオブジェクト**を選びます

:::message{tip}
`introduce_dyn`は`&dyn Animal`しか受け取れない関数に見えますが、`introduce_dyn(&dog)`と直接`&Dog`を渡しても動きます。`&Dog`から`&dyn Animal`への変換は、コンパイラが必要な場面で自動的に行ってくれるためです。問題01で`vec![&dog, &cat]`が`Vec<&dyn Animal>`に収まったのも同じ変換です。
:::
::::

## 04 - 関連型

[[associated-type]]と[[trait]]に関する問題です。
`Sensor`トレイトの`Thermometer`向け実装と`DoorSensor`向け実装を完成させてください。`Thermometer`は温度を`f64`で、`DoorSensor`は開閉状態を`bool`で返します。

```txt:期待する出力
温度: 23.5
ドアが開いている: true
```

<!-- rustc: expect E0599 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Sensor {
    type Value; // 測定値の型は実装側で決める
    fn read(&self) -> Self::Value;
}

struct Thermometer {
    celsius: f64,
}

struct DoorSensor {
    is_open: bool,
}

// Thermometer向けにSensorを実装せよ（Valueはf64、readはcelsiusを返す）

// DoorSensor向けにSensorを実装せよ（Valueはbool、readはis_openを返す）

fn main() {
    let thermometer = Thermometer { celsius: 23.5 };
    let door = DoorSensor { is_open: true };

    println!("温度: {}", thermometer.read());
    println!("ドアが開いている: {}", door.read());
}
```

::::details[解答例と解説]
```rust playground
trait Sensor {
    type Value; // 測定値の型は実装側で決める
    fn read(&self) -> Self::Value;
}

struct Thermometer {
    celsius: f64,
}

struct DoorSensor {
    is_open: bool,
}

// Thermometer向けにSensorを実装せよ（Valueはf64、readはcelsiusを返す）
impl Sensor for Thermometer { // [!code ++]
    type Value = f64; // [!code ++]
    fn read(&self) -> f64 { // [!code ++]
        self.celsius // [!code ++]
    } // [!code ++]
} // [!code ++]

// DoorSensor向けにSensorを実装せよ（Valueはbool、readはis_openを返す）
impl Sensor for DoorSensor { // [!code ++]
    type Value = bool; // [!code ++]
    fn read(&self) -> bool { // [!code ++]
        self.is_open // [!code ++]
    } // [!code ++]
} // [!code ++]

fn main() {
    let thermometer = Thermometer { celsius: 23.5 };
    let door = DoorSensor { is_open: true };

    println!("温度: {}", thermometer.read());
    println!("ドアが開いている: {}", door.read());
}
```
`Sensor`トレイトの中の`type Value;`が[[associated-type]]です。「`read`は何かの値を返す。ただし、その型はここでは決めない」という宣言で、`Self::Value`はその型を指す書き方です。

実装側では`type Value = f64;`のように、具体的な型を**1つ**決めます。すると、そのimplブロックの中では`Self::Value`が`f64`になるので、`read`の戻り値は`f64`として書けます。解答例のように`-> f64`と直接書いても、`-> Self::Value`と書いても同じ意味です。

温度計は「数値を返すセンサー」、ドアセンサーは「真偽値を返すセンサー」です。同じ`Sensor`トレイトを実装していながら、`read`の戻り値の型が実装ごとに違います。これが関連型の役割で、**メソッドの中身だけでなく、型まで実装側に委ねる**ことができます。

`main`での呼び出し側は`thermometer.read()`・`door.read()`と書くだけで、戻り値の型は実装から自動的に決まります。`println!`の`{}`に渡せているのは、`f64`も`bool`も`Display`を実装しているためです。

:::message{tip}
関連型は、これまでも知らないうちに使っていました。第6章で`chars()`を、第5章で`for`ループを使いましたが、これらの裏にある`Iterator`トレイトは`type Item;`という関連型を持っていて、「`for`で取り出される要素の型」を実装ごとに決めています。`for c in s.chars()`の`c`が`char`になるのは、`Chars`型の`Iterator`実装が`type Item = char;`と宣言しているからです。
:::
::::

## 05 - 関連型は実装ごとに1つ

[[associated-type]]と[[trait]]に関する問題です。
次のコードはコンパイルエラー（E0119）になります。なぜエラーになるかを考え、キロメートルへの変換だけを残す形に修正してください。

```txt:期待する出力
1500メートル = 1.5キロメートル
```

<!-- rustc: expect E0119 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
trait Convert {
    type Output;
    fn convert(&self) -> Self::Output;
}

struct Meters(f64);

// センチメートル（整数）へ変換
impl Convert for Meters {
    type Output = i32;
    fn convert(&self) -> i32 {
        (self.0 * 100.0) as i32
    }
}

// キロメートルへ変換
impl Convert for Meters {
    type Output = f64;
    fn convert(&self) -> f64 {
        self.0 / 1000.0
    }
}

fn main() {
    let distance = Meters(1500.0);
    println!("{}メートル = {}キロメートル", distance.0, distance.convert());
}
```

::::details[解答例と解説]
```rust playground
trait Convert {
    type Output;
    fn convert(&self) -> Self::Output;
}

struct Meters(f64);

// センチメートル（整数）へ変換 // [!code --]
impl Convert for Meters { // [!code --]
    type Output = i32; // [!code --]
    fn convert(&self) -> i32 { // [!code --]
        (self.0 * 100.0) as i32 // [!code --]
    } // [!code --]
} // [!code --]

// キロメートルへ変換
impl Convert for Meters {
    type Output = f64;
    fn convert(&self) -> f64 {
        self.0 / 1000.0
    }
}

fn main() {
    let distance = Meters(1500.0);
    println!("{}メートル = {}キロメートル", distance.0, distance.convert());
}
```
エラーメッセージは`conflicting implementations of trait 'Convert' for type 'Meters'`（E0119）です。「`Meters`に対する`Convert`の実装が衝突している」と言われています。

`type Output = i32;`と`type Output = f64;`で中身が違うのだから別の実装として扱ってほしい、と思うかもしれません。しかしRustでは、**1つの型に対して同じトレイトは1回しか実装できません**。関連型はその実装の中で決めるものなので、`Meters`の`Output`は必然的に1つに定まります。2つ目の`impl Convert for Meters`は、関連型が何であれ、単純に「2回目の実装」として弾かれます。

これは関連型の制約というより、関連型の**設計意図**そのものです。`Meters`の`convert()`を呼んだとき、戻り値の型が1通りに決まるからこそ、呼び出す側は`Convert`とだけ書けばよく、「どの`Convert`か」を指定せずに済みます。

**ジェネリックな型引数との違い**
「同じ型に複数の変換先を持たせたい」のであれば、トレイト自体に型引数を持たせます。

<!-- rustc: skip -->
```rust:型引数にした場合
trait Convert<T> {
    fn convert(&self) -> T;
}

impl Convert<i32> for Meters { /* センチメートル */ }
impl Convert<f64> for Meters { /* キロメートル */ }
```

`Convert<i32>`と`Convert<f64>`は**別のトレイト**として扱われるので、どちらも実装できます。その代わり、呼び出す側は`let cm: i32 = distance.convert();`のように、どちらを使うのかを型で指定する必要があります。

| 観点 | 型引数（`trait Convert<T>`） | 関連型（`type Output`） |
| --- | --- | --- |
| 型を決めるのは | 使う側 | 実装側 |
| 同じ型への実装 | 型引数ごとに何度でも | 1回だけ |
| 呼び出し側の指定 | どの`T`かを書く必要がある | 不要 |

「この型にとっての変換先は1つ」と言い切れるなら関連型、「組み合わせが複数ある」なら型引数、というのが使い分けです。次の問題06で見る`Add`トレイトは、右辺の型を型引数、結果の型を関連型で表していて、この2つを組み合わせた例になっています。

:::message{tip}
2つの変換を両方残したいもう1つの方法は、そもそも別のトレイト（あるいはただのメソッド）にすることです。`to_centimeters()`と`to_kilometers()`という2つのメソッドを`impl Meters`に書けば、どちらを呼ぶのかが名前で伝わります。トレイトを使うのは「複数の型に共通する振る舞い」を表したいときで、この問題のように型が1つしかないなら、普通のメソッドで十分なことも多いです。
:::
::::

## 06 - 演算子オーバーロード

[[operator-overloading]]と[[associated-type]]と[[trait]]に関する問題です。
次のコードはコンパイルエラー（E0369）になります。`Point`同士を`+`で足せるようにして修正してください。

```txt:期待する出力
Point { x: 4, y: 6 }
```

<!-- rustc: expect E0369 -->
```rust:「Playgroundで開く」をクリックして修正・実行してください playground
#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = Point { x: 3, y: 4 };

    let sum = p1 + p2;

    println!("{:?}", sum);
}
```

::::details[解答例と解説]
```rust playground
use std::ops::Add; // [!code ++]

#[derive(Debug)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point { // [!code ++]
    type Output = Point; // [!code ++]

    fn add(self, rhs: Point) -> Point { // [!code ++]
        Point { // [!code ++]
            x: self.x + rhs.x, // [!code ++]
            y: self.y + rhs.y, // [!code ++]
        } // [!code ++]
    } // [!code ++]
} // [!code ++]

fn main() {
    let p1 = Point { x: 1, y: 2 };
    let p2 = Point { x: 3, y: 4 };

    let sum = p1 + p2;

    println!("{:?}", sum);
}
```
エラーメッセージは`cannot add 'Point' to 'Point'`（E0369）です。第12章の問題02や第19章の問題03でも出会ったエラーコードで、「この型にはこの演算子が定義されていない」という意味でした。

Rustでは、`a + b`という式は`Add`トレイトの`add`メソッドの呼び出しとして扱われます。整数や浮動小数点数で`+`が使えるのは、標準ライブラリがそれらの型に`Add`を実装しているからです。つまり、自作の型で`+`を使いたければ、`Add`トレイトを実装すればよいことになります。これを[[operator-overloading]]と呼びます。

`Add`は`std::ops`モジュールにあるので、第14章で学んだ`use`で持ち込みます。宣言は次のような形です。

<!-- rustc: skip -->
```rust:std::ops::Addの宣言（抜粋）
trait Add<Rhs = Self> {
    type Output;
    fn add(self, rhs: Rhs) -> Self::Output;
}
```

ここに、この章で学んだ2つがそろって出てきます。

- `type Output;`は[[associated-type]]です。「`+`の結果の型は実装側で決める」という宣言で、今回は`Point`同士を足して`Point`が返ってくるので`type Output = Point;`としました
- `Rhs`は右辺の型を表す型引数で、既定値が`Self`です。`impl Add for Point`と型引数を省略すると`Rhs = Point`になり、`Point + Point`の意味になります。問題05の表で見た「使う側が決める型引数」と「実装側が決める関連型」の組み合わせです

`add`の引数が`&self`ではなく`self`である点にも注目してください。`+`のオペランドは値として渡されるので、`p1 + p2`を実行した後の`p1`と`p2`はムーブされていて使えません。整数で`a + b`の後も`a`が使えるのは、整数が`Copy`だからです。`Point`にも`#[derive(Clone, Copy)]`を付ければ、足した後も元の値を使い続けられます。

:::message{tip}
演算子の実装は、その演算子の**普通の意味から外れない**ようにするのが作法です。`+`で引き算をするような実装はコンパイルこそ通りますが、読む人を裏切ります。また`Add`を実装しても`+=`は使えるようにならず、別に`AddAssign`トレイトが必要です。`-`・`*`・`/`も同様に`Sub`・`Mul`・`Div`が対応していて、形はすべて`Add`と同じです。
:::
::::

## 07 - 応用: 図形コレクション

[[trait-object]]と[[trait]]と[[method]]に関する問題です。
図形を表す3つの構造体に`Shape`トレイトを実装し、図形の一覧から面積の合計を求める`total_area`関数を定義して、テストに合格させてください。

```rust:「Playgroundで開く」をクリックしてTESTを実行してください playground
// トレイトShapeを定義せよ
//   メソッド: area(&self) -> f64  面積を返す

struct Circle {
    radius: f64,
}

struct Rectangle {
    width: f64,
    height: f64,
}

struct Triangle {
    base: f64,
    height: f64,
}

// Circle・Rectangle・TriangleにShapeを実装せよ
//   Circle   : 半径 × 半径 × 円周率（std::f64::consts::PI）
//   Rectangle: 幅 × 高さ
//   Triangle : 底辺 × 高さ ÷ 2

// 関数total_areaを定義せよ
//   引数  : 図形の一覧（&[&dyn Shape]）
//   戻り値: すべての図形の面積の合計

#[test]
fn test_each_area() {
    let circle = Circle { radius: 1.0 };
    let rectangle = Rectangle { width: 3.0, height: 4.0 };
    let triangle = Triangle { base: 6.0, height: 2.0 };
    assert_eq!(circle.area(), std::f64::consts::PI);
    assert_eq!(rectangle.area(), 12.0);
    assert_eq!(triangle.area(), 6.0);
}

#[test]
fn test_total_area() {
    let rectangle = Rectangle { width: 3.0, height: 4.0 };
    let triangle = Triangle { base: 6.0, height: 2.0 };
    let square = Rectangle { width: 2.0, height: 2.0 };
    let shapes: Vec<&dyn Shape> = vec![&rectangle, &triangle, &square];
    assert_eq!(total_area(&shapes), 22.0);
}

#[test]
fn test_total_area_empty() {
    let shapes: Vec<&dyn Shape> = vec![];
    assert_eq!(total_area(&shapes), 0.0);
}
```

::::details[解答例と解説]
```rust playground
// トレイトShapeを定義せよ
//   メソッド: area(&self) -> f64  面積を返す
trait Shape { // [!code ++]
    fn area(&self) -> f64; // [!code ++]
} // [!code ++]

struct Circle {
    radius: f64,
}

struct Rectangle {
    width: f64,
    height: f64,
}

struct Triangle {
    base: f64,
    height: f64,
}

// Circle・Rectangle・TriangleにShapeを実装せよ
//   Circle   : 半径 × 半径 × 円周率（std::f64::consts::PI）
//   Rectangle: 幅 × 高さ
//   Triangle : 底辺 × 高さ ÷ 2
impl Shape for Circle { // [!code ++]
    fn area(&self) -> f64 { // [!code ++]
        self.radius * self.radius * std::f64::consts::PI // [!code ++]
    } // [!code ++]
} // [!code ++]

impl Shape for Rectangle { // [!code ++]
    fn area(&self) -> f64 { // [!code ++]
        self.width * self.height // [!code ++]
    } // [!code ++]
} // [!code ++]

impl Shape for Triangle { // [!code ++]
    fn area(&self) -> f64 { // [!code ++]
        self.base * self.height / 2.0 // [!code ++]
    } // [!code ++]
} // [!code ++]

// 関数total_areaを定義せよ
//   引数  : 図形の一覧（&[&dyn Shape]）
//   戻り値: すべての図形の面積の合計
fn total_area(shapes: &[&dyn Shape]) -> f64 { // [!code ++]
    let mut total = 0.0; // [!code ++]
    for shape in shapes { // [!code ++]
        total += shape.area(); // [!code ++]
    } // [!code ++]
    total // [!code ++]
} // [!code ++]

#[test]
fn test_each_area() {
    let circle = Circle { radius: 1.0 };
    let rectangle = Rectangle { width: 3.0, height: 4.0 };
    let triangle = Triangle { base: 6.0, height: 2.0 };
    assert_eq!(circle.area(), std::f64::consts::PI);
    assert_eq!(rectangle.area(), 12.0);
    assert_eq!(triangle.area(), 6.0);
}

#[test]
fn test_total_area() {
    let rectangle = Rectangle { width: 3.0, height: 4.0 };
    let triangle = Triangle { base: 6.0, height: 2.0 };
    let square = Rectangle { width: 2.0, height: 2.0 };
    let shapes: Vec<&dyn Shape> = vec![&rectangle, &triangle, &square];
    assert_eq!(total_area(&shapes), 22.0);
}

#[test]
fn test_total_area_empty() {
    let shapes: Vec<&dyn Shape> = vec![];
    assert_eq!(total_area(&shapes), 0.0);
}
```
トレイトオブジェクトの典型的な使い方を、1本の流れで書きました。順に見ていきます。

**トレイトは「面積を求められる」という共通点だけを表す**
円・長方形・三角形はフィールドも計算式もばらばらですが、「面積を返せる」という1点は共通しています。`Shape`トレイトはその1点だけを`area`メソッドとして定めていて、それぞれの`impl Shape for ...`が型ごとの計算を担当します。第18章の復習です。

**`&[&dyn Shape]`で型の違いを吸収する**
`total_area`は、円でも長方形でも三角形でも、何種類の図形が何個来ても動く必要があります。`Vec<T>`や`&[T]`の`T`は1つの型にしかなれないので、`&dyn Shape`を要素の型にして「`Shape`を実装した何か」の並びとして受け取ります。この引数の型をジェネリクスにすると`T`が1つの型に固定されてしまい、`test_total_area`のように長方形と三角形を混ぜた一覧は渡せません。問題03で見た「異なる型の混在」がまさにこの場面です。

**引数は`&[&dyn Shape]`、呼び出しは`&shapes`**
`total_area`の引数を`&Vec<&dyn Shape>`ではなく、第5章で学んだスライス`&[&dyn Shape]`にしています。テストでは`Vec<&dyn Shape>`の参照`&shapes`を渡していますが、`&Vec<T>`は必要に応じて`&[T]`として扱われるので、そのまま渡せます。スライスで受け取っておくと、ベクタだけでなく配列からも呼べる関数になります。

**`for shape in shapes`の`shape`は`&&dyn Shape`**
`shapes`は`&[&dyn Shape]`なので、`for`で取り出される`shape`は「`&dyn Shape`への参照」、つまり`&&dyn Shape`です。それでも`shape.area()`とそのまま書けるのは、メソッド呼び出し時に参照が自動的に外されるためです。第10章で`&self`のメソッドを値からも参照からも同じように呼べたのと同じ仕組みです。

**合計の初期値は`0.0`**
`area`が`f64`を返すので、合計も`f64`です。第5章の合計では`let mut total = 0;`と整数で始めましたが、ここで`0`と書くと整数と推論されて`+=`で型が合わなくなります。`0.0`と書くことで`f64`であることが伝わります。

:::message{tip}
実際に手を動かして確かめられる余力があれば、`Shape`トレイトに`fn name(&self) -> String;`を足して、「円: 3.14」のように図形ごとの名前と面積を一覧表示する関数を書いてみてください。`&dyn Shape`経由でメソッドが2つ呼べるようになり、実行時にどの実装が選ばれているかがより実感できます。
:::

:::message{tip}
これで第21章は終わりです。トレイトには「1つの型に決めてコンパイル時に解決する」ジェネリクスの方向と、「何らかの型として実行時に解決する」トレイトオブジェクトの方向があること、そしてトレイトがメソッドだけでなく関連型も持てることを押さえました。

ところで、この章では`Vec<&dyn Animal>`や`&[&dyn Shape]`のように、参照をベクタに入れたり関数に渡したりしてきました。参照は、元の値がある限りしか使えません。では、参照を含む値を関数から**返す**ときや、構造体のフィールドに参照を**持たせる**ときには、その参照がいつまで有効かをコンパイラはどう知るのでしょうか。次の第22章では、その答えである**ライフタイム**を扱います。
:::
::::
