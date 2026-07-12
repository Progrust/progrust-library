# 外部リンクの別タブ化（external-links）

本文中のテキストリンクのうち、外部リンク（`http(s)://` で始まるURL）の `<a>` に `target="_blank" rel="noopener noreferrer"` を付与するmdastプラグイン。spec: [pages.md](../spec/pages.md) R-24。

前提知識: [satteri-plugin-api.md](satteri-plugin-api.md)（`data.hProperties` 方式）

## 記法

専用記法はない。`../markdown-notation/rule.md` の「テキストリンク」（`[アンカーテキスト](URL)`）およびGFM autolink-literal（文中のベアURL）が対象。

## 実装方式

1. **検出**: `link` visitorで `node.url` が `/^https?:\/\//i` にマッチするものだけを対象にする（大文字スキーム `HTTPS://` も外部リンクなので `i` フラグ。link-card.mjs の内部リンク除外ガードと同じ判定）
2. **付与**: `ctx.setProperty(node, "data", …)` で `data.hProperties` に `target: "_blank"` / `rel: "noopener noreferrer"` をマージする。既存の `hProperties` は温存する（スプレッドでマージ）。**既存ノードは読み取り専用のため直接ミューテーション（`node.data = …`）は反映されない**（[satteri-plugin-api.md](satteri-plugin-api.md)「ノード操作API」。新規生成ノードに `data` を直埋めする [playground.md](playground.md) 方式との使い分けに注意）
3. **対象外（ガードで自動的に素通り）**:
   - 内部リンク（`/about` 等の相対・絶対パス）: スキーム判定で除外
   - wikilink（[wikilink.md](wikilink.md)）: 生成される `link` は `/dict/…` の内部パスなので除外
   - リンクカード（[link-card.md](link-card.md)）: linkCard が段落ごと `rawHtml` に差し替えるためこのプラグインの対象外。カード側の `<a>` はカードHTML自体に `target`/`rel` を直書きする

## 雛形コード

実装は `plugins/external-links.mjs` を正とする。

```js
import { defineMdastPlugin } from "satteri";

export const externalLinks = defineMdastPlugin({
  name: "external-links",
  link(node, ctx) {
    if (!/^https?:\/\//i.test(node.url)) return;
    // ★既存ノードは読み取り専用。直接ミューテーションは無視されるため setProperty を使う
    ctx.setProperty(node, "data", {
      ...node.data,
      hProperties: {
        ...node.data?.hProperties,
        target: "_blank",
        rel: "noopener noreferrer",
      },
    });
  },
});
```

登録順は末尾でよい（順序: codeFilename → playgroundLink → wikilink → directives → linkCard → externalLinks。[README.md](README.md)）。

## 落とし穴と回避策

- **linkCardより前に置いても壊れない**が意味がない: 単独ベアURL段落はlinkCardが段落ごと `rawHtml` に差し替えるため、先に付与した `hProperties` は捨てられる。順序はどこでも動作するが、意図を明確にするため末尾に置く
- playgroundLink のアンカーは `link` ノードではなく `data.hName: "a"` の paragraph のため、本プラグインの visitor には来ない（`target` の二重付与は起きない）

## 制約・残課題

- `mailto:` 等の非http(s)スキームは対象外（同一タブ）。必要になったら仕様（R-24）を更新してから対応する
