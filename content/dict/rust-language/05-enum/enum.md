---
title: 列挙型
description: 取りうる値の種類をバリアントとして列挙し、バリアントごとに異なるデータを持たせられる型。
created_at: 2026-07-26
updated_at: 2026-07-26
tags: ["型システム", "基本文法", "複合型"]
public: true
---

列挙型（enum）は、ある型が取りうる値の種類を「バリアント」として列挙する型です。[[struct]]が複数の値を同時に1つにまとめるのに対し、列挙型は複数の選択肢のうちどれか1つだけを表します。バリアントにはデータを持たせないもの、[[tuple-struct]]のように位置でデータを持たせるもの、構造体のように名前付きフィールドでデータを持たせるものの3種類があり[^1]、1つの列挙型の中で混在させられます。

```rust playground
enum Shape {
    Point,                                 // データなし
    Circle(f64),                           // タプル的（半径）
    Rectangle { width: f64, height: f64 }, // 構造体的（幅・高さ）
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Point => 0.0,
            Shape::Circle(radius) => std::f64::consts::PI * radius * radius,
            Shape::Rectangle { width, height } => width * height,
        }
    }
}

fn main() {
    let shapes = vec![
        Shape::Point,
        Shape::Circle(2.0),
        Shape::Rectangle { width: 4.0, height: 5.0 },
    ];
    for shape in &shapes {
        println!("面積: {:.2}", shape.area());
    }
}
```

:::message{tip}
C言語のenum（整数定数）やJavaのenum（全定数が共通のフィールドを持つ）とは異なり、Rustの列挙型はバリアントごとに異なる型・個数のデータを持たせられます。
:::

## メソッドの定義

上記のように、構造体と同じく列挙型にも[[impl-block]]で[[method]]を定義できます。バリアントに応じて処理を分岐させるには`match`式を使うのが基本です<!-- TODO: [[match-expression]] 作成後にリンク -->。

## 補足

:::details[標準ライブラリのOption・Result]
[[standard-library]]が提供する列挙型の中でも特に重要なのが、値の有無を表す[[option]]（`Option<T>`）と、成功・失敗を表す`Result<T, E>`です。<!-- TODO: [[result]] 作成後にリンク -->
:::

[^1]: [The Rust Reference: Enumerations](https://doc.rust-lang.org/reference/items/enumerations.html) — バリアントには値を持たない形・タプル型の値を持つ形・構造体型の値を持つ形の3種類があると定義しています。
