---
title: Rust パフォーマンスチューニングの基本
description: プロファイリング、最適化テクニック、ベンチマークの実施方法。
created_at: 2024-05-05
updated_at: 2024-06-10
tags: ["Rust上級", "パフォーマンス", "最適化"]
public: true
image:
  url: https://picsum.photos/1200/630?random=6
  alt: パフォーマンスグラフ
---

# Rust パフォーマンスチューニングの基本

Rust は高速ですが、不適切な実装ではパフォーマンスが低下します。効果的なチューニング方法を学びましょう。

## 1. リリースビルド使用時のパフォーマンス差

```bash
# デバッグビルド（遅い）
cargo build

# リリースビルド（最適化済み）
cargo build --release
```

| ビルドモード | 最適化 | 実行速度 | コンパイル時間 |
|-------------|--------|---------|---------------|
| Debug       | なし   | 遅い    | 短い         |
| Release     | あり   | 速い    | 長い         |

:::message{warning}
本番環境やベンチマークは必ずリリースビルドで実施してください。デバッグビルドとの性能差は数倍から数十倍に及ぶことがあります。
:::

## 2. ベンチマーク測定

`Cargo.toml`:

```toml
[[bench]]
name = "benchmarks"
harness = false
```

`benches/benchmarks.rs`:

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci(n: u32) -> u32 {
    match n {
        0 | 1 => n,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn fibonacci_benchmark(c: &mut Criterion) {
    c.bench_function("fib 20", |b| b.iter(|| fibonacci(black_box(20))));
}

criterion_group!(benches, fibonacci_benchmark);
criterion_main!(benches);
```

実行：

```bash
cargo bench
```

:::message[black_box で最適化を防ぐ]{tip}
`black_box()` を使用してコンパイラの最適化を防ぎ、現実的なベンチマークを取得します。
:::

## 3. メモリ効率

### メモリ確保（allocation）を減らす

```rust
// 遅い：毎回新しいVecを作成
fn slow_filter(items: &[i32]) -> Vec<i32> {
    items.iter().filter(|x| x % 2 == 0).collect()
}

// 速い：既存のVecを再利用
fn fast_filter(items: &[i32], result: &mut Vec<i32>) {
    result.clear();
    for item in items {
        if item % 2 == 0 {
            result.push(*item);
        }
    }
}
```

:::details[イテレータの遅延評価]
[[iterator]]は遅延評価のため、中間結果が蓄積されません。本当に必要な時だけ計算されます。
:::

## 4. アルゴリズム選択

大切な法則[^1]：適切なアルゴリズムを選ぶことが、言語やコンパイラの最適化より重要です。

| アルゴリズム | 時間計算量 | 用途                 |
|------------|-----------|---------------------|
| Linear     | O(n)      | 単純な探索           |
| Binary     | O(log n)  | ソート済みリスト     |
| Hash       | O(1)      | ルックアップテーブル |

## 5. SIMD 最適化

Rust はコンパイラが自動的に SIMD を活用します：

```rust
fn vector_multiply(a: &[f32], b: &[f32]) -> Vec<f32> {
    a.iter().zip(b.iter()).map(|(x, y)| x * y).collect()
}
```

このような単純な操作は、コンパイラが自動的に SIMD 命令に変換することがあります。

## 6. プロファイリングツール

```bash
# Flamegraph による可視化（macOS/Linux）
cargo install flamegraph
cargo flamegraph --release
```

:::message[推測せず計測する]{tip}
プロファイリングにより、どの部分が実行時間を消費しているかが一目瞭然になります。推測でなく、データに基づいて最適化しましょう。
:::

## まとめ

効果的なチューニング手順：

1. リリースビルドで実行
2. ベンチマークで現状を測定
3. プロファイリングで問題箇所を特定
4. アルゴリズム改善またはコード最適化
5. ベンチマークで改善を確認

繰り返し測定・改善することで、最適なコードが生まれます。

[^1]: Donald Knuth の "Premature optimization is the root of all evil" より
