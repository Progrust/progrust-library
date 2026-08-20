---
title: ライフタイム注釈
description: 参照どうしのライフタイムの関係をコンパイラに伝える'aの記法。関数シグネチャ・構造体・implブロックで宣言して使う。省略規則で省ける場合も多く、'staticはプログラム全体で有効な特別なライフタイム。
created_at: 2026-08-20
updated_at: 2026-08-20
tags: ["型システム", "所有権", "基本文法"]
public: true
---

ライフタイム注釈は、複数の[[reference]]の[[lifetime]]がどう関係しているかをコンパイラに伝える記法です。名前はアポストロフィで始まる短い小文字（慣例として最初は`'a`）で、[[generics]]の型引数と同じように`<'a>`で**宣言してから**、`&'a T`のように`&`の直後に書いて使います[^1]。注釈は値が生きる長さを変えるものではなく、[[borrow-checker]]が検査に使う「関係の宣言」です[^2]。

```rust playground
// 戻り値は a か b のどちらかを指す。3つの参照を同じ 'a で結び、
// 「戻り値は a と b の両方が生きている間だけ有効」と宣言する
fn longer<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.chars().count() >= b.chars().count() { a } else { b }
}

// 参照を持つ構造体。インスタンスは shop_name の参照先より長く生きられない
struct Receipt<'a> {
    shop_name: &'a str,
}

impl<'a> Receipt<'a> {
    // &self があるので戻り値の注釈は省略できる（省略規則3）
    fn header(&self) -> &str {
        self.shop_name
    }
}

fn main() {
    let shop = String::from("プログルストア新宿店");
    let receipt = Receipt { shop_name: &shop };
    let longest = longer("りんご", "グレープフルーツ");
    println!("{} / 長い方: {}", receipt.header(), longest);
}
```

## 指定する場所

注釈はジェネリックパラメータなので、使う前にその項目の`<>`で宣言します。宣言できる場所と書き方は次のとおりです。

| 場所 | 宣言 | 使用 |
| --- | --- | --- |
| [[function]]のシグネチャ | 関数名の直後 `fn longer<'a>` | 引数・戻り値の型 `&'a str` |
| [[struct]]・[[enum]] | 型名の直後 `struct Receipt<'a>` | フィールドの型 `&'a str` |
| [[impl-block]] | `impl`の直後 `impl<'a>` | 対象の型 `Receipt<'a>` と各[[method]] |

型引数と併用する場合、ライフタイムパラメータは**型パラメータより前**に書きます（`<'a, T>`は可、`<T, 'a>`は不可）[^3]。`'static`と`'_`は特別な意味を持つため、パラメータ名として宣言することはできません[^3]。

参照をフィールドに持つ構造体では注釈が**必須**で、`struct Receipt { shop_name: &str }`のように省くと`E0106`になります[^4]。implブロック側では、構造体の型の一部になっているライフタイムを`impl<'a> Receipt<'a>`のように改めて宣言します[^5]。

## ライフタイム省略規則

関数シグネチャの注釈は、コンパイラが次の3つの規則で補えるときは省略できます[^6]。

1. 引数側の省略された各ライフタイムは、それぞれ**別の**ライフタイムパラメータになります
2. 引数側のライフタイムが（省略・明示を問わず）**ちょうど1つ**なら、それが戻り値の省略されたライフタイムすべてに割り当てられます
3. メソッドで受け手が`&self`または`&mut self`なら、その参照のライフタイムが戻り値の省略されたライフタイムすべてに割り当てられます

| 省略した形 | 展開後 | 適用される規則 |
| --- | --- | --- |
| `fn first(s: &str) -> &str` | `fn first<'a>(s: &'a str) -> &'a str` | 1 → 2 |
| `fn header(&self, label: &str) -> &str` | `fn header<'a, 'b>(&'a self, label: &'b str) -> &'a str` | 1 → 3 |
| `fn longer(a: &str, b: &str) -> &str` | 展開できない（`E0106`） | 1のみ。2も3も当てはまらない |

3つ目のように引数が複数あって戻り値がどれを指すか決められないときは、先頭のコード例の`longer`のように手で注釈を書きます（エラーの実例は補足を参照）。

:::message{info}
省略規則が働くのは関数・メソッドのシグネチャ（と関数ポインタ・クロージャトレイト<!-- TODO: [[closure]] 作成後にリンク -->の型）です[^6]。関数本体の中の参照は、規則ではなく通常の推論でライフタイムが決まります。
:::

## `'static`

`'static`は「プログラムの実行期間全体にわたって有効でありうる」ことを表す特別なライフタイムです[^7]。[[string-literal]]はバイナリに直接埋め込まれるため`&'static str`になり、プログラム終了まで存在する[[static]]を[[borrow]]した参照も`'static`です。`const`・`static`の宣言で参照型を書くときは、注釈を省いても暗黙に`'static`になります[^8]。

:::message{warning}
コンパイラが`'static`を提案してきても、原因の多くは[[dangling-reference]]やライフタイムの不一致です。安易に`'static`を付けるのではなく、そちらを直します[^7]。
:::

```rust playground
static SHOP_NAME: &str = "プログルストア"; // &'static str（省略可）

fn shop_name() -> &'static str {
    // 引数がないので省略規則は使えないが、'static なら明示して返せる
    SHOP_NAME
}

fn main() {
    let greeting: &'static str = "いらっしゃいませ";
    println!("{}: {}", shop_name(), greeting);
}
```

## 補足

:::details[省略できない例（E0106）]
引数が2つとも参照で、戻り値がどちらを指すか規則では決められないため、注釈を省くとコンパイルエラーになります。

<!-- rustc: expect E0106 -->
```rust playground
// エラー: E0106（戻り値が a と b のどちらのライフタイムか決められない）
fn longer(a: &str, b: &str) -> &str {
    if a.len() >= b.len() { a } else { b }
}
```
:::

:::details[プレースホルダー `'_`]
`'_`は「ここにライフタイムがあるが、推論に任せる」ことを明示するプレースホルダーです[^6]。`fn first(s: &'_ str) -> &'_ str`は省略形と同じ意味になります。ライフタイムを持つ型を[[module-path]]で書くときは、`fn make(buf: &str) -> Receipt<'_>`のように`'_`を付けて「参照を借りている型である」ことを見せる書き方が推奨されています[^6]。同様に、[[impl-block]]の中でライフタイム名を一度も使わないなら、`impl<'a> Receipt<'a>`の代わりに`impl Receipt<'_>`と書けます。
:::

:::details[境界としての `'static`（`T: 'static`）]
`'static`は[[trait-bound]]と同じ位置に**ライフタイム境界**としても書けます。`T: 'a`は「`T`が持つすべてのライフタイムパラメータが`'a`より長く生きる」という意味で、`T: 'static`なら「`T`は`'static`でない参照を一切含まない」ことを要求します[^9]。`i32`や`String`のように参照を持たない型はこの境界を自動的に満たすため、`T: 'static`は「`'static`な参照しか受け付けない」のではなく、「いつ破棄されるか分からない借用を含まない型」を表すと読むのが正確です。スレッドをまたいで値を渡すAPIなどで要求されます。
:::

:::details[ライフタイムどうしの関係 `'a: 'b`]
複数のライフタイムパラメータの間に「`'a`は少なくとも`'b`と同じ長さ生きる」という関係を付けたいときは、`fn f<'a: 'b, 'b>(...)`や`where 'a: 'b`のように書きます[^9]。意味の詳細は[[lifetime]]の補足を参照してください。
:::

[^1]: [The Rust Programming Language - Lifetime Annotation Syntax](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#lifetime-annotation-syntax) "The names of lifetime parameters must start with an apostrophe (') and are usually all lowercase and very short, like generic types. Most people use the name 'a for the first lifetime annotation. We place lifetime parameter annotations after the & of a reference" / "We declare the name of the generic lifetime parameter inside angle brackets after the name of the struct so that we can use the lifetime parameter in the body of the struct definition."
[^2]: [The Rust Programming Language - Lifetime Annotation Syntax](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#lifetime-annotation-syntax) "Lifetime annotations don't change how long any of the references live. Rather, they describe the relationships of the lifetimes of multiple references to each other without affecting the lifetimes."
[^3]: [The Rust Reference - Generic parameters](https://doc.rust-lang.org/reference/items/generics.html) "The order of generic parameters is restricted to lifetime parameters and then type and const parameters intermixed." / "'_ and 'static are not valid lifetime parameter names."
[^4]: [Error code E0106](https://doc.rust-lang.org/error_codes/E0106.html) "This error indicates that a lifetime is missing from a type." / `struct Foo1 { x: &bool } // ^ expected lifetime parameter` / "The lifetime elision rules require that any function signature with an elided output lifetime must either have: exactly one input lifetime, or, multiple input lifetimes, but the function must also be a method with a &self or &mut self receiver"
[^5]: [The Rust Programming Language - Lifetime Annotations in Method Definitions](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#lifetime-annotations-in-method-definitions) "Lifetime names for struct fields always need to be declared after the impl keyword and then used after the struct's name because those lifetimes are part of the struct's type."
[^6]: [The Rust Reference - Lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html) "lifetime arguments can be elided in function item, function pointer, and closure trait signatures." / "Each elided lifetime in the parameters becomes a distinct lifetime parameter." / "If there is exactly one lifetime used in the parameters (elided or not), that lifetime is assigned to all elided output lifetimes." / "If the receiver has type &Self or &mut Self, then the lifetime of that reference to Self is assigned to all elided output lifetime parameters." / "The placeholder lifetime, '_, can also be used to have a lifetime inferred in the same way. For lifetimes in paths, using '_ is preferred." / `fn new1(buf: &mut [u8]) -> Thing<'_>; // elided - preferred`
[^7]: [The Rust Programming Language - The Static Lifetime](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html#the-static-lifetime) "'static, which denotes that the affected reference can live for the entire duration of the program. All string literals have the 'static lifetime" / "The text of this string is stored directly in the program's binary, which is always available." / "Most of the time, an error message suggesting the 'static lifetime results from attempting to create a dangling reference or a mismatch of the available lifetimes. In such cases, the solution is to fix those problems, not to specify the 'static lifetime."
[^8]: [The Rust Reference - Lifetime elision - const and static elision](https://doc.rust-lang.org/reference/lifetime-elision.html#const-and-static-elision) "Both constant and static declarations of reference types have implicit 'static lifetimes unless an explicit lifetime is specified."
[^9]: [The Rust Reference - Lifetime bounds](https://doc.rust-lang.org/reference/trait-bounds.html#lifetime-bounds) "T: 'a means that all lifetime parameters of T outlive 'a. For example, if 'a is an unconstrained lifetime parameter, then i32: 'static and &'static str: 'a are satisfied, but Vec<&'a ()>: 'static is not." / "The bound 'a: 'b is usually read as 'a outlives 'b."
