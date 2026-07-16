# テーマ切替 仕様

## 1. 概要

ライト/ダークモードの切替の振る舞いを定義する。

関連文書:

- カラートークン・切替ボタンの見た目・FOUC防止スクリプトの実装: [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)（「カラートークン」「テーマ切替」）
- Shikiカスタムテーマ・mermaid 2枚SVGの実装: [`../markdown-pipeline/shiki.md`](../markdown-pipeline/shiki.md) / [`../markdown-pipeline/mermaid.md`](../markdown-pipeline/mermaid.md)

## 2. 要求仕様

- **R-1**: 初期値は `prefers-color-scheme` を尊重する。ユーザーが切替ボタンで選択した場合は `localStorage` に保存し、以降はそちらを優先する。
- **R-2**: 切替は `html` 要素のクラス（`dark`）の付け外しで行う（Tailwindの`class`方式ダークモード）。
- **R-3**: 初期テーマの適用は`<head>`内の同期スクリプトで行い、ページ読み込み時のちらつき（FOUC）を防ぐ。
- **R-4**: テーマ切替ボタンは全ページのヘッダーに置く。
- **R-5**: テーマ切替は本文レンダリング済みの要素にも即時反映される。特に:
  - コードブロックの背景・枠線（E案: ライトでもコードだけダーク面。シンタックスハイライトの配色はカスタムテーマ（single theme）による**両テーマ共通**で、切り替わらない。配色は [`ui-design-spec.md` の「コードブロック」](../ui-design/ui-design-spec.md)、実装は [`shiki.md`](../markdown-pipeline/shiki.md)）
  - mermaidのライト/ダーク2枚SVGの表示切替（[`mermaid.md`](../markdown-pipeline/mermaid.md)）

## 4. 受入基準

- **AC-1**: OSがダーク設定・localStorage未保存の状態で開くとダークテーマで表示される。（R-1）
- **AC-2**: 切替ボタンでライトに変更後、リロードしてもライトのまま維持される（OS設定より優先）。（R-1, R-3）
- **AC-3**: ページ読み込み時にライト→ダークのちらつきが発生しない。（R-3）
- **AC-4**: テーマを切り替えると、コードブロックの背景・枠線とmermaid図が対応するテーマの表示に切り替わる。シンタックスハイライトの配色は両テーマで共通のまま変わらない。（R-5）
