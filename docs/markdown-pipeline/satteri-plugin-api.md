# Sätteriプラグイン共通API

Sätteriカスタムプラグイン全般に共通する書き方・挙動・落とし穴。個別機能の実装前に必ず本書を読むこと。

## 実装方式の要点

- `markdown.processor` に `satteri({ mdastPlugins: [...], hastPlugins: [...], features: {...} })` を渡す（`@astrojs/markdown-satteri`、Astro同梱）
- プラグインは `defineMdastPlugin` / `defineHastPlugin` で定義する**ノード種別ごとのvisitor購読モデル**（例: `heading(node, ctx) { ... }`）
- 走査は**pre-order（親→子、文書先頭から）**。プラグインは**登録順の直列パイプライン**で、前段が生成したノードを後段は訪問できるが、**自プラグインが生成したノードは自分では再訪問されない**（無限ループしない）
- **どのvisitorもPromiseを返せる**（sync/async混在可）。asyncビジター内の`await fetch(...)`等をビルドは待つ
- ノードは**読み取り専用**（Rust側参照）。変更はすべて`ctx`経由
- hastの`element` visitorは`{ filter: ['pre','a',...], visit(node, ctx) {} }`形式でtagName一致のみ届く。`text` / `raw`はbare関数

### astro.config.mjs への登録

```js
// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { myMdastPlugin, myHastPlugin } from './plugins/my-plugin.mjs';

export default defineConfig({
  markdown: {
    processor: satteri({
      mdastPlugins: [myMdastPlugin], // 定義オブジェクト or ファクトリ関数
      hastPlugins: [myHastPlugin],
    }),
  },
});
```

## ノード操作API（mdast、実測済み）

型定義（`satteri/dist/mdast/mdast-visitor.d.ts`）:

```ts
removeNode(node: Readonly<MdastNode>): void;
insertBefore(node: Readonly<MdastNode>, newNode: MdastContent | MdastContent[]): void;
insertAfter(node: Readonly<MdastNode>, newNode: MdastContent | MdastContent[]): void;
replaceNode(node: Readonly<MdastNode>, newNode: MdastContent): void; // 単一ノードのみ
setProperty(node: Readonly<MdastNode>, key: "data", value: Record<string, unknown> | null): void;
```

- `setProperty` / `replaceNode` / `removeNode` / `insertBefore` / `insertAfter` / `wrapNode` / `appendChild` / `prependChild` / visitor戻り値による置換 / `{ rawHtml }`挿入、すべて動作確認済み
- **`replaceNode`は単一ノード限定**。1つのtextノードを複数ノード（text+link+text…）へ分割するには `ctx.insertBefore(node, arrayOfNodes)` + `ctx.removeNode(node)` を使う
- `{ rawHtml }`はエスケープなしで出力される。ただし**mdast段階の`{ rawHtml }`は「生のmarkdownソース」として再パースされる**点に重大な注意あり（詳細: [link-card.md](link-card.md)。block要素開始なら verbatim）
- hast側でのHTML文字列埋め込みは `{ type: 'raw', value }`（[mermaid.md](mermaid.md)で実証）

### 落とし穴: 新規生成ノードに`setProperty`は使えない

JS側で新規作成したノードオブジェクトに`ctx.setProperty`を呼ぶと失敗する:

```
setProperty: node has no arena id — it was built in JS, not read from this tree.
Pass plugin-built nodes as new content (e.g. the second argument of insertAfter).
```

`setProperty`はSätteriのRust側アリーナに割り当て済み（＝元のmdツリーから読み込まれた）ノードにしか使えない。`insertBefore`で挿入した後でも、JS側オブジェクトはアリーナに登録されない。

**回避策**: 新規生成ノードには`data`（`hProperties`含む）を**ノードリテラル作成時点で直接持たせる**:

```js
pieces.push({
  type: 'link',
  url: `/dict/${entry.slug}`,
  children: [{ type: 'text', value: entry.title }],
  data: { hProperties: { class: 'wikilink', 'data-dict-link': entry.slug } },
});
```

既存ノード（ツリーから読み込まれたノード）への属性追加は`setProperty`でよい（[directives.md](directives.md)の変換方式）。この区別を必ず意識すること。

## ビルドエラー化は throw 方式（`ctx.report`は不可）

- **`ctx.report({ severity: "error" })`ではビルドが失敗しない**（exit 0、メッセージも一切出ない）。satteriはdiagnosticsを収集するが、**Astro側がそれを一切参照せず黙って捨てる**（`@astrojs/markdown-satteri/dist/`と`astro/dist/vite-plugin-markdown/`にdiagnosticsを読むコードが存在しないことを実読で確認）
- **visitor内で`throw new Error(...)`するとexit 1**で失敗し、メッセージも表示される
- ただしthrowだけだとエラー表示のLocationがsatteri内部（`satteri/dist/mdast/mdast-visitor.js`）を指す。**メッセージに`(絶対パス:行:列)`形式を含めると、AstroのLocation表示も対象mdファイルを指す**

雛形:

```js
import { fileURLToPath } from 'node:url';
import { defineMdastPlugin } from 'satteri';

export const buildErrorExample = defineMdastPlugin({
  name: 'build-error-example',
  text(node, ctx) {
    if (node.value.includes('ERROR_TRIGGER')) {
      const file = ctx.fileURL ? fileURLToPath(ctx.fileURL) : '(不明なファイル)';
      const pos = node.position
        ? `${node.position.start.line}:${node.position.start.column}`
        : '?:?';
      throw new Error(`エラー内容の説明 (${file}:${pos})`);
    }
  },
});
```

wikilinkのリンク切れ検証・ファイル名一意性チェックなど、すべてのビルド時検証はこのパターンを使う。

## 文書ごとの状態はファクトリ形式で持つ

定義オブジェクトを直渡しするとモジュールレベルの状態が**全文書で共有される**。カウンタや収集リストを持つプラグインは必ずファクトリ形式（`() => defineMdastPlugin({...})`）にする（文書ごとにクロージャがリセットされる）:

```js
import { defineMdastPlugin } from 'satteri';

// ファクトリ形式: 文書（コンパイル）ごとに呼ばれ、クロージャがリセットされる
export const counterPlugin = () => {
  let counter = 0;
  return defineMdastPlugin({
    name: 'counter-plugin',
    heading(node, ctx) {
      counter += 1;
      ctx.appendChild(node, { type: 'text', value: ` [${counter}]` });
    },
  });
};
```

実測: ファクトリ形式はページごとにカウンタが1から始まり、直渡しは全ページ通算になる（mermaidのid採番などで事故る）。

## その他の実測済み挙動・注意事項

- **`text` visitorは`code`/`inlineCode`の中身には呼ばれない**（専用visitorのみ）→ wikilinkのコード内誤変換防止は購読モデルだけで担保される
- **frontmatter（`---`ブロック）で`yaml` visitorは呼ばれない**（Astroが事前に剥がす）→ 処理中ドキュメント自身のfrontmatterは`ctx`から取得できない。必要なら`ctx.fileURL`からファイルを読み直して自前パースする（[wikilink.md](wikilink.md)の非対称ルール判定で使用）
- **Shiki処理済みコードブロックはhastでは`raw`ノード**として届く（`element` filterでは捕捉できない）。Shiki除外した言語（mermaid等）は素の`element`（`pre > code`）で届く
- ノード削除は子のvisitor呼び出しを止めない。削除済みサブツリーへ積んだ変換はwarning付きで破棄され、ビルドは成功する:
  `satteri: plugin "..." queued 1 mdast transform on node(s) that were removed or replaced earlier in the same pass; it was dropped.`
  →「親を消したら子は触らない」前提のロジックは書かない
- `ctx.source`で処理中mdの全ソース文字列が取れる。**`node.position`の`offset`はUTF-8バイトオフセット**（JSの文字indexではない）。スライスは`Buffer.from(source, 'utf8').subarray(start, end)`で行う（`String.prototype.slice`だと日本語でズレる）
- `ctx.data`（文書レベル共有バッグ）はmdast→hast間でも共有される（型定義で確認）
- `g`フラグ付き正規表現をモジュールレベルで使い回すと`lastIndex`が呼び出しをまたいで残り誤検出する（定番の罠）。visitor内でリテラルとして都度書く

## 制約・残課題

- `ctx.report(error)`が効かないのはAstroが診断を読まないため。satteri単体（`compile()`直呼び）での挙動は未検証（本プロジェクトはAstro経由でしか使わないため実用上は不問）
- throw方式のエラーが`astro dev`（開発サーバー）でどう表示されるかは未検証（`astro build`のexit 1のみ確認）
- `structuredClone(node)`によるノード保持は未実測（型定義・ドキュメント記載のみ）
- `ctx.data`のmdast→hast間共有は型定義での確認のみ（実測は必要になった時点で行う）
- コンテンツコレクション（Content Layer API）経由の実ビルドは未検証（検証はすべて`src/pages/*.md`。`ctx.fileURL`の解決を含め、本番実装フェーズで最初に確認する）
