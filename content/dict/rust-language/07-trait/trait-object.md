---
title: トレイトオブジェクト
description: dyn Traitで「あるトレイトを実装した何らかの型の値」を表し、呼び出すメソッドを実行時に決める仕組み（動的ディスパッチ）。ジェネリクス（静的ディスパッチ）との使い分けと、dyn Traitにできるトレイトの条件（dyn互換性、旧称オブジェクト安全性）。
created_at: 2026-08-20
updated_at: 2026-08-20
tags: ["トレイト", "型システム"]
public: true
---

トレイトオブジェクトは、`dyn トレイト名`と書いて「この[[trait]]を実装している**何らかの型**の値」を表す型です[^1]。具体的な型がコンパイル時に決まっていないため、`&dyn Trait`や`Box<dyn Trait>`のように必ずポインタ越しに扱います[^2]。<!-- TODO: [[box]] 作成後にリンク -->[[method]]を呼ぶと、値の型に応じた実装が**実行時**に選ばれます。これを**動的ディスパッチ**と呼びます[^3]。

[[generics]]では、[[vec]]の型引数`T`が1つの型に決まるため、異なる型の値を1つのコレクションに混在させられません。トレイトオブジェクトを使うと、それが可能になります[^4]。

```rust playground
trait Payment {
    fn pay(&self, amount: u32) -> String;
}

struct Cash;
struct CreditCard {
    last4: String,
}

impl Payment for Cash {
    fn pay(&self, amount: u32) -> String {
        format!("現金で{}円を支払いました", amount)
    }
}

impl Payment for CreditCard {
    fn pay(&self, amount: u32) -> String {
        format!("カード（末尾{}）で{}円を支払いました", self.last4, amount)
    }
}

fn main() {
    // 異なる型を「Paymentを実装した何か」として1つのVecに入れる
    let methods: Vec<Box<dyn Payment>> = vec![
        Box::new(Cash),
        Box::new(CreditCard { last4: String::from("1234") }),
    ];

    for method in &methods {
        // どの pay が呼ばれるかは実行時に決まる
        println!("{}", method.pay(1500));
    }
}
```

## ジェネリクス（静的ディスパッチ）との使い分け

[[trait-bound]]付きのジェネリクス`T: Trait`は、単相化によってコンパイル時に型ごとの専用コードに展開されるため、呼び先が**コンパイル時**に決まります（静的ディスパッチ）[^3]。トレイトオブジェクトは呼び先を実行時に決める代わりに、その分の実行時コストがかかり、インライン化などの最適化も効きにくくなります[^5]。

| 観点 | `T: Trait`（ジェネリクス） | `dyn Trait`（トレイトオブジェクト） |
| --- | --- | --- |
| 呼び先が決まるとき | コンパイル時（静的ディスパッチ） | 実行時（動的ディスパッチ） |
| 異なる型の混在 | 不可（`Vec<T>`は1つの型） | 可（`Vec<Box<dyn Trait>>`） |
| 実行時コスト | なし | vtable経由の間接呼び出し |
| 生成されるコード | 使った型ごとに専用コードが生成される[^4] | 1つで済む |
| 使えるトレイト | 任意 | dyn互換なトレイトのみ |

扱う型が1種類に決まるなら、ジェネリクスとトレイト境界を使うのが望ましいとされています[^4]。「実行時に型が切り替わる」「異なる型をまとめて持ちたい」場合にトレイトオブジェクトを選びます。

## dyn互換性（オブジェクト安全性）

どんなトレイトでも`dyn Trait`にできるわけではありません。`dyn Trait`にできるトレイトを**dyn互換**（dyn compatible）なトレイトと呼びます。以前は**オブジェクト安全**（object safe）と呼ばれていた概念で、現在のReferenceでは名称が変わっています[^6]。主な条件は次のとおりです[^6]。

- スーパートレイトもすべてdyn互換であること
- `Sized`を要求しないこと（`trait T: Sized`ではない）<!-- TODO: [[sized]] 作成後にリンク -->
- 関連定数を持たず、ジェネリックな関連型も持たないこと<!-- TODO: [[associated-type]] 作成後にリンク -->
- 各メソッドが、型引数を持たず、レシーバ（`&self`・`&mut self`・`Box<Self>`・`Rc<Self>`・`Arc<Self>`・それらの`Pin`のいずれか）以外で`Self`を使わず、`async fn`や戻り値位置の[[impl-trait]]でないこと

条件を満たさないトレイトをトレイトオブジェクトにしようとすると、エラー: E0038になります。

<!-- rustc: expect E0038 -->
```rust
trait Shape {
    fn area(&self) -> f64;
    fn duplicate(&self) -> Self; // 戻り値に Self を使っている
}

fn total_area(shapes: &[Box<dyn Shape>]) -> f64 { // エラー: E0038（dyn互換でない）
    shapes.iter().map(|s| s.area()).sum()
}
```

`Self`を返すメソッドは、呼び出し側が具体的な型を知らないので戻り値の型を決められず、トレイトオブジェクト経由では呼び出せません[^10]。

:::message{tip}
一部のメソッドだけが条件を満たさない場合は、そのメソッドに`where Self: Sized`を付けると「トレイトオブジェクトからは呼べないメソッド」として除外され、トレイト全体はdyn互換のままにできます[^6]。上の例なら`fn duplicate(&self) -> Self where Self: Sized;`と書きます。
:::

## 補足

:::details[内部表現（vtable）]
トレイトオブジェクトへのポインタは、「値そのものへのポインタ」と「**vtable**（仮想メソッドテーブル）へのポインタ」の2つを持ちます[^7]。vtableには、その型におけるトレイトのメソッド（スーパートレイトのものを含む）それぞれの実装への関数ポインタが並んでいます[^7]。メソッド呼び出しではvtableから関数ポインタを読み出して間接的に呼びます[^3]。`&dyn Trait`が通常の[[reference]]の2倍の幅を持つ「ファットポインタ」になるのはこのためです[^11]。

```mermaid
flowchart LR
    P["&dyn Payment<br>（データへのポインタ / vtableへのポインタ）"]
    P --> D["CreditCard { last4 }"]
    P --> V["vtable for CreditCard<br>pay → CreditCard::pay"]
```
:::

:::details[書ける境界と省略できないdyn]
`dyn`の後ろに書けるのは、dyn互換なトレイト1つ＋任意個の自動トレイト（`Send`・`Sync`など）＋ライフタイム1つまでで、`?Sized`のような境界は書けません（例: `dyn Payment + Send + 'static`）[^1]。[[lifetime]]は省略時に既定の規則で補われます[^8]。

また、`dyn`を省いてトレイト名だけを型として書く古い書き方は、edition 2021以降では認められません[^9]。
:::

[^1]: [The Rust Reference - Trait objects](https://doc.rust-lang.org/reference/types/trait-object.html) "A trait object is an opaque value of another type that implements a set of traits. The set of traits is made up of a dyn compatible base trait plus any number of auto traits." / "There may not be more than one non-auto trait, no more than one lifetime, and opt-out bounds (e.g. ?Sized) are not allowed."
[^2]: [The Rust Reference - Trait objects](https://doc.rust-lang.org/reference/types/trait-object.html) "Due to the opaqueness of which concrete type the value is of, trait objects are dynamically sized types. Like all DSTs, trait objects are used behind some type of pointer; for example &dyn SomeTrait or Box<dyn SomeTrait>."
[^3]: [The Rust Reference - Trait objects](https://doc.rust-lang.org/reference/types/trait-object.html) "Calling a method on a trait object results in virtual dispatch at runtime: that is, a function pointer is loaded from the trait object vtable and invoked indirectly." / [The Rust Programming Language - Trait Objects Perform Dynamic Dispatch](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) "static dispatch, which is when the compiler knows what method you're calling at compile time. This is opposed to dynamic dispatch, which is when the compiler can't tell at compile time which method you're calling."
[^4]: [The Rust Programming Language - Using Trait Objects to Abstract over Shared Behavior](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) "If you'll only ever have homogeneous collections, using generics and trait bounds is preferable because the definitions will be monomorphized at compile time to use the concrete types."
[^5]: [The Rust Programming Language - Trait Objects Perform Dynamic Dispatch](https://doc.rust-lang.org/book/ch18-02-trait-objects.html) "This lookup incurs a runtime cost that doesn't occur with static dispatch. Dynamic dispatch also prevents the compiler from choosing to inline a method's code, which in turn prevents some optimizations."
[^6]: [The Rust Reference - Dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility) "A dyn-compatible trait can be the base trait of a trait object." / "Sized must not be a supertrait." / "It must not have any associated constants." / "It must not have any associated types with generics." / "All supertraits must also be dyn compatible." / "Dispatchable functions must: Not have any type parameters ... Be a method that does not use Self except in the type of the receiver ... Not have an opaque return type" / "Explicitly non-dispatchable functions require: Have a where Self: Sized bound" / "Note: This concept was formerly known as object safety."
[^7]: [The Rust Reference - Trait objects](https://doc.rust-lang.org/reference/types/trait-object.html) "Each instance of a pointer to a trait object includes: a pointer to an instance of a type T that implements SomeTrait; a virtual method table, often just called a vtable, which contains, for each method of SomeTrait and its supertraits that T implements, a pointer to T's implementation (i.e. a function pointer)."
[^8]: [The Rust Reference - Default trait object lifetimes](https://doc.rust-lang.org/reference/lifetime-elision.html#default-trait-object-lifetimes)
[^9]: [The Rust Reference - Trait objects](https://doc.rust-lang.org/reference/types/trait-object.html) "Edition differences: Before the 2021 edition, the dyn keyword may be omitted."
[^10]: [Error code E0038](https://doc.rust-lang.org/error_codes/E0038.html) "the compiler cannot predict the return type of foo() ... let y = x.foo(); // What type is y?"
[^11]: [The Rust Reference - Dynamically Sized Types](https://doc.rust-lang.org/reference/dynamically-sized-types.html) "Pointer types to DSTs are sized but have twice the size of pointers to sized types" / "Pointers to trait objects also store a pointer to a vtable."
