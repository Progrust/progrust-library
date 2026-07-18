---
title: プリミティブ型（Primitive Types）
description: Rustコンパイラに組み込まれた基本型の総称。単一の値のスカラー型と複数の値をまとめる複合型に大別。
created_at: 2026-07-18
updated_at: 2026-07-18
tags: ["型システム", "基本文法", "プリミティブ型"]
public: true
---

プリミティブ型（primitive type）は、Rustコンパイラに組み込まれた基本的な型の総称です。`String`や`Vec<T>`のように標準ライブラリが提供する型とは異なり、言語自体が直接サポートします。

## スカラー型と複合型

[The Rust Programming Language](https://doc.rust-jp.rs/book-ja/) では、単一の値を表す**スカラー型**と、複数の値を1つにまとめる**複合型**に分類されます。スカラー型はいずれも`Copy`を実装するため、代入や関数呼び出しでは値がコピーされます。

| 分類 | 含まれる型 |
| --- | --- |
| スカラー型（単一の値） | ・[[integer-type]]<br>・[[floating-point-type]]<br>・[[boolean-type]]<br>・[[char-type]] |
| 複合型（複数の値） | ・タプル `(T, U)`<!-- TODO: [[tuple]] 公開後にリンク（作成済みだがpublic: falseのため公開ページからリンク不可） --><br>・[[array-type]] |

## 補足

::::details[Rust Reference が定めるプリミティブ型の一覧]
スカラー型・複合型のほかにも、言語組み込みのプリミティブ型があります。

- 文字列スライス`str`
- スライス`[T]`
- 参照`&T` / `&mut T`
- 生ポインタ`*const T` / `*mut T`
- 関数ポインタ`fn`、ユニット型`()`<!-- TODO: [[unit-type]] 作成後にリンク -->
- never型`!`

`String`が標準ライブラリの型であるのに対し`str`はプリミティブ型、というように「組み込みかどうか」が両者を分けます。

:::message{warning}
never型`!`は、Rust 1.94時点ではまだ experimental（不安定）です。
:::
::::
