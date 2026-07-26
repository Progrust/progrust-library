---
title: 動かして学ぶRustプログラミング問題集（基本文法編）
description: Rust Playgroundを利用して、実際に手を動かして学ぶことができるRustプログラミング学習入門用の問題集
created_at: 2026-07-26
updated_at: 2026-07-26
tags: ["基本文法", "問題集"]
public: false
image:
  url: https://picsum.photos/1200/630?random=3
  alt: ダミー
---

## 問題1 - コンソール出力の基本

[[console-output]]に関する問題です。
コンソールに「hello, world!」を出力するコードを記載してください。

```rust playground
fn main() {
    // hello, world! をコンソールに出力せよ

}
```

:::details[解答例]
```rust playground
fn main() {
    // hello, world! をコンソールに出力せよ
    println!("hello, world!");
}
```
:::

## 問題2 - 変数を利用したコンソール出力

[[variable]]と[[console-output]]に関する問題です。
適切な変数を作成し、コンソールに「私の名前は次郎です。」を出力するコードを記載してください。

```rust playground
fn main() {
    // nameという変数名に「次郎」という文字列を束縛した変数を記載せよ

    // 上記の変数を利用して「私の名前は次郎です。」が出力されるように以下コードを修正せよ
    println!("私の名前は太郎です。");
}
```

:::details[解答例]
```rust playground
fn main() {
    // nameという変数名に「次郎」という文字列を束縛した変数を記載せよ
    let name = "次郎";

    // 上記の変数を利用して「私の名前は次郎です。」をコンソールに出力せよ
    println!("私の名前は{name}です。"); //どちらでもOK
    println!("私の名前は{}です。", name); //どちらでもOK
}
```
:::

## 問題3 - 整数型で数値演算

[[integer-type]]と[[numeric-operations]]に関する問題です。
25個のクッキーを4人で等しく分けたときの「1人あたりの個数」と「余りの個数」求め、コンソールに出力するコードを記載してください。

```rust playground
fn main() {
    // 個数は負にならないため、符号なし32ビット整数型でcookiesに25、childrenに4を束縛した変数を記載せよ

    // 1人あたりの個数（余りは切り捨て）を計算し、eachに束縛した変数を記載せよ

    // 分けたあとに余る個数を計算し、restに束縛した変数を記載せよ

    println!("1人あたり{}個、余り{}個", each, rest);
}
```

:::details[解答例]
```rust playground
fn main() {
    // 個数は負にならないため、符号なし32ビット整数型でcookiesに25、childrenに4を束縛した変数を記載せよ
    let cookies: u32 = 25;
    let children: u32 = 4;

    // 1人あたりの個数（余りは切り捨て）を計算し、eachに束縛した変数を記載せよ
    let each = cookies / children; // 6.25 → 6に切り捨て

    // 分けたあとに余る個数を計算し、restに束縛した変数を記載せよ
    let rest = cookies % children;

    println!("1人あたり{}個、余り{}個", each, rest);
}
```

整数同士の除算 `/` は小数部が切り捨てられるため、`25 / 4` は `6` になります。
余りは剰余演算子 `%` で求めます。
:::
