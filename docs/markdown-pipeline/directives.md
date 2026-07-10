# `:::`ディレクティブ（message / details / figure）

Sätteriネイティブのdirectiveパーサ（`features: { directive: true }`）でパースされた`:::`記法を、HTML要素（`<aside>` / `<details><summary>` / `<figure><figcaption>`）へ変換するmdastプラグイン。

前提知識: [satteri-plugin-api.md](satteri-plugin-api.md)（`setProperty` / throw方式 / UTF-8バイトオフセット）

## 記法

執筆記法は `../markdown-notation/rule.md` の「メッセージ」「アコーディオン」「画像」参照。実装上の重要事項:

- **`:::message alert`（スペース区切り引数）や`:::details タイトル`は、パース段階で引数が黙って破棄される**（attributes/label/childrenのどこにも入らず、エラーにもならない）。このため記法は`:::message{alert}`（属性）と`:::details[タイトル]`（label）に確定している。**旧記法のタイポはプラグインでは検出不能**（記法の周知が唯一の防御。detailsのみタイトル無しとしてthrowで捕捉できる）
- `:::figure[キャプション]{width=480}`は仕様どおりの記法がそのまま使える
- messageのタイトルは`:::message[タイトル]{info}`のlabel記法で指定する（省略可）。label+属性の併用はfigureで実測済みの組み合わせと同じパース結果（`attributes`に種別、先頭childに`data.directiveLabel: true`のparagraph）になる
- ネスト（`::::message`内に`:::details`）は正しくパースされる

## 実装方式

1. **有効化**: `satteri({ features: { directive: true } })`。これはcontainer/leaf/textの3種すべてを有効化する
2. **変換**: `containerDirective` visitorで`ctx.setProperty(node, 'data', { hName, hProperties })`のremark-directive方式。**mdastプラグインのみで完結**（hastプラグイン不要）
3. **textDirective復元プラグイン（必須コンポーネント）**: `directive: true`の副作用で、本文中の「コロン直後に文字が続く」テキスト（`12:30`・`x:y`・`キー:値`等）が**textDirectiveとして黙って消費され、コロン以降が本文から消える**。`textDirective`/`leafDirective` visitorで原文に復元する処理を変換プラグインと必ずセットで入れる（下記コードに同梱）。復元プラグインがあれば執筆側の対応は不要
4. **未知のディレクティブ名はthrow**でビルドエラーにする（タイポが黙って消えるのを防ぐ）

## directiveノードの実測構造

```text
入力: :::message ～ :::（本文 + rustコード + 画像）
containerDirective name='message' attrs={}
  paragraph > text "補足メッセージの本文です。"
  code lang='rust' value='fn main() {...'
  paragraph > image url=... alt='サンプル画像'

入力: :::message{alert}
containerDirective name='message' attrs={ alert: '' }

入力: :::message{.alert}   ← class shorthand も使える（本アプリでは採用しない）
containerDirective name='message' attrs={ class: 'alert' }

入力: :::details[折りたたみタイトル]
containerDirective name='details' attrs={}
  paragraph data={ directiveLabel: true } > text "折りたたみタイトル"   ← labelは先頭paragraph
  paragraph > text "中身。"

入力: :::figure[図1: キャプションのテキスト]{width=480} + ![図のalt](...)
containerDirective name='figure' attrs={ width: '480' }
  paragraph data={ directiveLabel: true } > text "図1: キャプションのテキスト"
  paragraph > image url=... alt='図のalt'

入力: ::::message 内に :::details[ネストされたdetails]
containerDirective name='message'
  paragraph > text "外側のメッセージ。"
  containerDirective name='details'          ← ネストが正しく子ノードになる
    paragraph data={ directiveLabel: true } > text
    paragraph > text "ネストの中身。"
  paragraph > text "外側の続き。"
（この後、内側のdetailsが単独のcontainerDirective visitとしてもう1回来る）

入力: ::separator[ラベル]{key=value}（leaf） / :abbr[HTML]{title=HyperText}（text）
leafDirective name='separator' attrs={ key: 'value' } > text "ラベル"
textDirective name='abbr' attrs={ title: 'HyperText' } > text "HTML"

入力: 本文中の 12:30 / x:y / キー:値 / word:word（誤爆パターン）
textDirective name='30' attrs={} （childrenなし）
textDirective name='y' / name='値' / name='word' / name='200'
```

旧記法（`:::message alert` / `:::details タイトル`）のダンプ: `attributes={}`、childrenは本文のみで、「alert」「タイトル」はノード上のどこにも存在しない。

## 雛形コード（動作確認済み）

### astro.config.mjs（directive有効化 + プラグイン登録）

```js
// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { c6Directives } from './plugins/c6-directives.mjs';

export default defineConfig({
  markdown: {
    processor: satteri({
      features: { directive: true },
      mdastPlugins: [c6Directives],
      hastPlugins: [],
    }),
  },
});
```

### 変換プラグイン + textDirective復元（`plugins/c6-directives.mjs`）

```js
import { fileURLToPath } from 'node:url';
import { defineMdastPlugin } from 'satteri';

// directiveノード → HTML要素変換
// 方式: setProperty(node, 'data', { hName, hProperties }) のremark-directive方式

const posOf = (node, ctx) => {
  const file = ctx.fileURL ? fileURLToPath(ctx.fileURL) : '(不明なファイル)';
  const pos = node.position
    ? `${node.position.start.line}:${node.position.start.column}`
    : '?:?';
  return `${file}:${pos}`;
};

// 先頭childrenがdirectiveのlabel（[...]部分）かどうか
const labelChild = (node) =>
  node.children?.[0]?.data?.directiveLabel ? node.children[0] : undefined;

export const c6Directives = defineMdastPlugin({
  name: 'c6-directives',

  containerDirective(node, ctx) {
    const attrs = node.attributes ?? {};

    if (node.name === 'message') {
      const isAlert = 'alert' in attrs;
      ctx.setProperty(node, 'data', {
        hName: 'aside',
        hProperties: { class: isAlert ? 'message message-alert' : 'message' },
      });
      return;
    }

    if (node.name === 'details') {
      const label = labelChild(node);
      if (label) {
        // labelの段落を<summary>にする
        ctx.setProperty(label, 'data', { directiveLabel: true, hName: 'summary' });
        ctx.setProperty(node, 'data', { hName: 'details' });
      } else if (attrs.title) {
        ctx.setProperty(node, 'data', { hName: 'details' });
        ctx.prependChild(node, {
          type: 'paragraph',
          data: { hName: 'summary' },
          children: [{ type: 'text', value: attrs.title }],
        });
      } else {
        throw new Error(`:::details にタイトルがありません（:::details[タイトル] と書く） (${posOf(node, ctx)})`);
      }
      return;
    }

    if (node.name === 'figure') {
      const label = labelChild(node);
      if (!label) {
        throw new Error(`:::figure にキャプションがありません（:::figure[キャプション] と書く） (${posOf(node, ctx)})`);
      }
      ctx.setProperty(node, 'data', { hName: 'figure' });
      ctx.setProperty(label, 'data', { directiveLabel: true, hName: 'figcaption' });
      // width属性を中のimgへ反映
      if (attrs.width) {
        for (const child of node.children) {
          if (child.type !== 'paragraph') continue;
          for (const grandchild of child.children ?? []) {
            if (grandchild.type === 'image') {
              ctx.setProperty(grandchild, 'data', {
                hProperties: { width: attrs.width },
              });
            }
          }
        }
      }
      return;
    }

    throw new Error(`未知のディレクティブ :::${node.name} (${posOf(node, ctx)})`);
  },

  // 復元プラグイン: 本文中の「x:y」等が誤ってtextDirective化して消えるため、
  // 元のソース文字列に復元する（本アプリではtext/leaf directiveを使わない）
  textDirective(node, ctx) {
    ctx.replaceNode(node, restoreText(node, ctx));
  },
  leafDirective(node, ctx) {
    ctx.replaceNode(node, {
      type: 'paragraph',
      children: [restoreText(node, ctx)],
    });
  },
});

// position.start/endからソース原文を切り出して復元する
// ※node.positionのoffsetはUTF-8のバイトオフセット（JSの文字indexではない）のためバイト単位でスライスする
function restoreText(node, ctx) {
  let value;
  if (node.position && typeof ctx.source === 'string') {
    value = Buffer.from(ctx.source, 'utf8')
      .subarray(node.position.start.offset, node.position.end.offset)
      .toString('utf8');
  } else {
    value = `:${node.name}`;
  }
  return { type: 'text', value };
}
```

> 補足: 上記雛形はmessageの種別として`alert`のみ扱う（検証時点の記法）。本番では`rule.md`のmessage種別（`info`/`tip`/`question`/`success`/`warning`/`danger`）に合わせて属性→クラスのマッピングを拡張する。
>
> 補足（figureのキャプション）: 上記雛形はキャプション（label）が無いとthrowするが、**`rule.md`ではキャプションは省略可能**（「画像サイズやキャプションは省略可能」）。本番実装（T2-1）ではlabelが無い場合はfigcaptionを付けず`<figure>`のみにする（throwしない）。widthはlabel有無に関わらず適用する。detailsのタイトルは`rule.md`で必須（label記法必須）のためlabelが無ければthrowする、という非対称に注意。

### 本番でのmessage分岐の拡張（種別マッピング + タイトル）

`:::message[タイトル]{info}`のタイトル対応を含めると、message分岐は以下の形になる:

```js
const MESSAGE_TYPES = ['info', 'tip', 'question', 'success', 'warning', 'danger'];

if (node.name === 'message') {
  const type = MESSAGE_TYPES.find((t) => t in attrs);
  const label = labelChild(node);
  if (label) {
    // labelの段落をタイトル要素にする（directiveLabel: true を含め直すこと）
    ctx.setProperty(label, 'data', {
      directiveLabel: true,
      hName: 'p',
      hProperties: { class: 'message-title' },
    });
  }
  ctx.setProperty(node, 'data', {
    hName: 'aside',
    hProperties: { class: type ? `message message-${type}` : 'message' },
  });
  return;
}
```

- タイトル省略時（従来記法）は`labelChild()`が`undefined`になり、タイトル要素を追加しないだけなので後方互換は自然に保たれる
- `:::message タイトル`のようなスペース区切りはタイトルが黙って消える（既存の落とし穴1と同じ。記法の周知が唯一の防御）

## 入出力例（実測）

入力（調整後記法）→ 出力:

```html
<aside class="message"><p>補足メッセージの本文です。</p><pre class="astro-code github-dark" ...>（Shikiハイライト済みコード）</pre><p><img src="..." alt="サンプル画像"></p></aside>
<aside class="message message-alert"><p>注意・警告メッセージです。</p></aside>
<details><summary>折りたたみのタイトル</summary><p>折りたたまれる内容です。</p></details>
<figure><figcaption>図1: キャプションのテキスト</figcaption><p><img src="..." alt="図のalt" width="480"></p></figure>
<aside class="message"><p>外側のメッセージ。</p><details><summary>ネストされたdetails</summary><p>ネストの中身。</p></details><p>外側の続き。</p></aside>
```

- message内のコードブロックはShikiハイライト済みで出力される（directive内でもハイライトは通常どおり効く）
- 復元プラグインありでは`12:30` / `x:y` / `:y` / `:smile:` / `100:200` / `キー:値` / `word:word` / `12：30`（全角）が**すべて原文どおり**出力される。復元プラグインなしでは`12:30`→`12 `のようにコロン以降が黙って消える。`: `（コロン後に空白）、`:smile:`、全角コロン、コード内は元々影響なし

## 落とし穴と回避策

1. **スペース区切り引数はパースで黙って破棄される**: エラーにも警告にもならない → 記法を`{属性}`・`[label]`ベースに統一（適用済み）。旧記法の書き間違いはプラグインで検出不能
2. **`directive: true`で本文の`x:y`が消える** → textDirective/leafDirective復元visitorを必ずセットで入れる（入れないとデータ破壊）
3. **`node.position`の`offset`はUTF-8バイトオフセット** → `Buffer`でスライスする
4. **directiveノードはデフォルトのHTML出力が「無」**: 変換プラグインを入れないとブロック全体が警告なしで消える。未知のdirective名も同様 → 未知の名前はthrow

## 制約・残課題

- `data`は`setProperty`で丸ごと置き換わる。labelパラグラフに設定するときは`directiveLabel: true`を含め直すこと
- labelの取得は「先頭childが`data.directiveLabel === true`のparagraph」で判定する
- ネストの内側directiveは「外側のchildrenの一部」と「単独visit」の**2回訪問される**。「childrenを再帰的に自前変換する」実装にすると二重変換になる（各ノードは自分のvisitでのみ変換すれば自然に守られる）
- figureの出力は`<figure><figcaption>…</figcaption><p><img…></p></figure>`で**imgが`<p>`に包まれたまま**。剥がす場合はhastプラグイン等で追加処理（表示はCSSで対処可能なので必須ではない）
- `\:`によるコロンのエスケープが可能かは未検証（復元プラグインで実害がないため不要と判断）
- `:::message{.alert}`（class shorthand）は`attributes: { class: 'alert' }`に入ることまで確認済みだが、変換プラグインは`{alert}`方式のみ対応（class方式は採用しない）
- **messageの種別属性のタイポは検出しない**（`:::message{warnig}` 等）。`MESSAGE_TYPES.find((t) => t in attrs)` が `undefined` になり、種別なしの `class="message"` として静かにレンダリングされる（本文は消えない）。未知のdirective**名**はthrowするのと非対称だが、属性値の網羅的バリデーションは行わない（落とし穴1の「スペース区切り引数の書き間違いはプラグインで検出不能」と同じ割り切り）。将来throw検出へ変える場合は、`type` が未定義かつ `attrs` に想定外キーがあるときにthrowする分岐を追加する
- messageのタイトル省略時にデフォルトタイトル（「Info」「Warning」等）を表示するかは未決定。表示する場合はCSSの`::before`か、labelが無いときに`prependChild`でタイトル段落を挿入する（detailsの`attrs.title`分岐と同じパターン）のどちらでも実現できる
  - **T3-4での状況**: prose側のスタイル（左ボーダー・card面・種別色 + `.message-title`をeyebrow化＝`::before`で`// `前置）は実装済み（`src/styles/global.css`）。ただしui-design-specの「種別アイコン」と「タイトル省略時のデフォルトeyebrow（`// info`等）」は**現状の出力にアイコン要素・種別名テキストが無い**ため未対応（title指定時の`.message-title`表示のみで成立）。message-variants.htmlとの完全一致にはここでの`prependChild`（種別名 + アイコンSVG挿入）が必要で、パイプライン側の対応として本項に集約する
- `:::message[タイトル]{info}`のlabel+属性併用パターンは、figureでの実測結果からの類推だったが、**T2-1実装時にダンプ確認済み**: `containerDirective name=message attrs={ info: '' }` かつ先頭childが `paragraph data={ directiveLabel: true }` になり、figureと同じパース結果（属性に種別・先頭childにlabel）であることを確認した。出力は `<aside class="message message-info"><p class="message-title">…</p>…</aside>`
