# Shiki連携（diff表示・ファイル名表示・カスタムテーマ）

コードハイライトの3要件（diff表示・` ```lang:file `のファイル名表示・確定パレット（6色）のカスタムテーマ）の実装方式。3要件とも**記法の変更なし**で実現できることを確認済み。

> [!info] dual theme → カスタムsingle themeへの変更（T6-3）
> 技術検証〜T3-1時点はdual theme（github-light/dark + `defaultColor:false`）だったが、E案（ライトでもコードだけダーク面）によりシンタックス配色は両テーマ共通のため、T6-3で**自作カスタムテーマのsingle theme**に確定した（`plugins/shiki-theme.mjs`）。dual時代のレシピは「dual theme方式（旧・参考）」節に残す。

前提知識: [satteri-plugin-api.md](satteri-plugin-api.md)（mdast前処理 / `data.hName`方式）

## 記法

執筆記法は `../markdown-notation/rule.md` の「コードブロック」参照（` ```rust:index.rs `のファイル名表記、`// [!code ++]` / `// [!code --]`のdiff表記）。

## 実装方式

**最重要**: Shiki設定（`shikiConfig` / `syntaxHighlight`）は**`satteri({...})`の引数ではなく`astro.config`の`markdown`直下**に書く。`satteri()`ファクトリは`mdastPlugins` / `hastPlugins` / `features`しか拾わず、`shikiConfig`を渡しても黙って無視される。Astroが`createRenderer({ syntaxHighlight, shikiConfig, gfm, smartypants })`として別経路でSätteriへ渡す（node_modules実読 + 実ビルドで確認）。

1. **diff表示**: `@shikijs/transformers`の`transformerNotationDiff()`を`shikiConfig.transformers`に入れるだけ。`// [!code ++]` / `// [!code --]`が除去され、該当`<span class="line">`に`diff add` / `diff remove`クラス、`<pre>`に`has-diff`が付く
2. **カスタムsingle theme**: `theme: progrustCodeTheme`（`plugins/shiki-theme.mjs`のテーマオブジェクト直渡し。確定パレット（6色）は [ui-design-spec「コードブロック」](../ui-design/ui-design-spec.md)）。トークンspanは実`color`を持つため切替CSSは不要。ただし`<pre>`にテーマの`background-color`/`color`がインライン出力され、`html.dark`の背景切替CSSが**負ける**ため、同ファイルの`transformerCodeBg`で除去し背景・地の文字色は`global.css`（`.astro-code`）側で管理する
   - スコープ設計の実測知見: bare `keyword` は**使わない**（`->`・`&`・`=`等が`keyword.operator.*`にマッチしてキーワード色になる）。Rustのライフタイムは `entity.name.type.lifetime` + `punctuation.definition.lifetime`（`storage.modifier.lifetime`ではない）。コメントの「地の色60%」はalpha付きhex `#E4DCD199` がそのままインライン出力されることを確認済み
   - 6色拡張時の追加知見: 複数ルールがマッチする場合は**より具体的なセレクタが勝つ**ため、`entity.name.type.lifetime`（金）は `entity.name.type`（型のティール）に食われない。Rustの`Some`/`Ok`/`Err`は`entity.name.type.option/result`（型色）、`self`/`Self`は`variable.language.self`、マクロは`entity.name.function.macro`（関数色に含まれる）、bashのコマンド名は`entity.name.command`＋ビルトインが`support.function.builtin`。スコープの実測は`codeToTokens(code, { includeExplanation: true })`で行う
3. **ファイル名表示**: ` ```rust:index.rs `は素の状態では`lang="rust:index.rs"`のままcodeノードになり、Shikiが**plaintextへ黙ってフォールバック**する（エラーにならず気づけない）→ **mdast前処理プラグイン**で`lang`を`:`で分割し、ファイル名ラベル + 補正済みcodeノードにラップする。`replaceNode`で新規生成したcodeノードも下流のハイライトが正常に効く

## 雛形コード（動作確認済み）

### astro.config.mjs

```js
// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { transformerNotationDiff } from '@shikijs/transformers';
import { codeFilename } from './plugins/code-filename.mjs';

export default defineConfig({
  markdown: {
    // ★ Shiki設定は satteri() の外・markdown 直下に置く（Astroが createRenderer 経由でSätteriへ渡す）
    shikiConfig: {
      theme: progrustCodeTheme, // カスタムsingle theme（plugins/shiki-theme.mjs）
      transformers: [transformerNotationDiff(), transformerCodeBg], // diff表示 + preインライン背景除去
    },
    processor: satteri({
      features: { directive: true },
      mdastPlugins: [codeFilename], // ファイル名記法の前処理（他プラグインより前に置く）
      hastPlugins: [],
    }),
  },
});
```

### ファイル名前処理プラグイン（`plugins/code-filename.mjs`）

```js
import { defineMdastPlugin } from 'satteri';

// ```lang:filename 記法のファイル名を分離して表示する。
// 情報文字列に空白がないとSätteriは lang="rust:index.rs" のまま code ノードにするため、
// そのままだとShikiが未知言語→plaintextにフォールバックする。
// mdast段階でlangを分割し、ファイル名ラベル + 補正済みcodeノードにラップする。
export const codeFilename = defineMdastPlugin({
  name: 'code-filename',
  code(node, ctx) {
    if (typeof node.lang !== 'string' || !node.lang.includes(':')) return;

    const idx = node.lang.indexOf(':');
    const realLang = node.lang.slice(0, idx);
    const filename = node.lang.slice(idx + 1);
    if (!filename) return;

    // 補正済みcodeノード（新規生成）。langを実言語に直す。metaはそのまま引き継ぐ。
    const newCode = {
      type: 'code',
      lang: realLang,
      meta: node.meta ?? null,
      value: node.value,
    };

    // ラベル + code を包むコンテナ（data.hNameで要素名を上書き）
    const wrapper = {
      type: 'paragraph',
      data: { hName: 'div', hProperties: { class: 'code-block' } },
      children: [
        {
          type: 'paragraph',
          data: { hName: 'span', hProperties: { class: 'code-filename' } },
          children: [{ type: 'text', value: filename }],
        },
        newCode,
      ],
    };

    ctx.replaceNode(node, wrapper);
  },
});
```

### テーマ切替との関係（single theme + `transformerCodeBg`）

トークンspanは実`color`を持つため文字色の切替CSSは不要（配色は両テーマ共通）。`<pre>`のクラスは`.shiki`ではなく**`.astro-code`**（Astro helper由来）。テーマの`background-color`/`color`は`transformerCodeBg`がインラインstyleから除去し、`global.css`の`.astro-code`が背景・地の文字色・`html.dark`の背景切替（theme.md R-5）を持つ。

### dual theme方式（旧・参考）

dual themeに戻す場合のレシピ: `themes: { light: …, dark: … }` + `defaultColor: false`で各トークンは実`color`を持たず`--shiki-light` / `--shiki-dark`（+ `-bg`）のCSS変数のみ出力される。以下の切替CSSが**必須**（入れないと文字色が付かない）:

```css
/* ライト（既定） */
.astro-code { background-color: var(--shiki-light-bg); }
.astro-code span { color: var(--shiki-light); }
/* ダーク（html.dark のとき） */
html.dark .astro-code { background-color: var(--shiki-dark-bg); }
html.dark .astro-code span { color: var(--shiki-dark); }
```

## 入出力例（実測）

```html
<!-- diff（single theme + transformerCodeBg 適用後。preに background-color / color のインラインは残らない） -->
<pre class="astro-code progrust-code has-diff" style="overflow-x: auto;" tabindex="0" data-language="rust"><code>...
<span class="line diff remove"><span style="color:#E4DCD1">... x = 1; </span></span>
<span class="line diff add"><span style="color:#E4DCD1">... x = 2; </span></span>
...</code></pre>

<!-- ファイル名 -->
<div class="code-block"><span class="code-filename">index.rs</span><pre class="astro-code progrust-code" ... data-language="rust"><code>...</code></pre></div>

<!-- ファイル名 + diff 併用（両立することを確認済み） -->
<div class="code-block"><span class="code-filename">main.rs</span><pre class="... has-diff" ...><code>...<span class="line diff remove">...</span><span class="line diff add">...</span>...</code></pre></div>
```

langの渡り方（実測）:

```text
入力: ```rust               → lang="rust"           meta=null
入力: ```rust:index.rs      → lang="rust:index.rs"  meta=null   ← 空白がないためファイル名がlangに混入
入力: ```rust title="foo.rs"→ lang="rust"           meta="title=\"foo.rs\""  ← 空白区切りならlang/metaに分離
```

## 落とし穴と回避策

1. **`shikiConfig` / `syntaxHighlight`は`satteri({...})`に渡しても無視される** → `markdown`直下に書く（上述）。mermaid除外の`excludeLangs`も同様に`markdown.syntaxHighlight.excludeLangs`（[mermaid.md](mermaid.md)）
2. **` ```lang:file `はShikiがplaintextへ黙ってフォールバック**（`data-language="plaintext"`でビルド成功してしまう）→ mdast前処理で`lang`補正
3. **Astro側のハイライトプラグインはユーザーhastPluginsより前に実行される**（`createSatteriMarkdownProcessor`が`createHighlightPlugin`を先にpushする）→ lang/metaの補正をhast側でやろうとしても手遅れ。**ファイル名の加工は必ずmdast側（`code` visitor）で行う**

## 制約・残課題

- ラップコンテナは`type: 'paragraph'` + `data.hName: 'div'`で`<div>`化する方式（任意のブロックノード型 + `data.hName`でラップ要素を作れる）。新規codeノードの`lang`は生成時にリテラルで持たせればハイライトが効く（`setProperty`不可の件とは別問題）
- CSSセレクタは`.astro-code`基準で書く（`.shiki`ではない）
- ~~dual themeのCSS切替レシピは出力構造から導出したもので、実ブラウザでの`html.dark`トグル時の見た目切替は未目視~~ → **T3-1で検証済み**（dual theme時代）。T6-3のsingle theme化後は、`html.dark`トグルで切り替わるのは背景・枠線のみ（theme.md AC-4改訂後）で、実ブラウザ確認済み
- `transformerNotationDiff`以外の`@shikijs/transformers`（highlight/focus/error-level、`transformerMetaHighlight`等）は未検証。同じ経路で使える見込みだが、必要になった機能ごとに追加確認する
- `<div class="code-block">`直下に`<pre>`が来る構造は確認済みだが、`shikiConfig.wrap`やコピーボタン等との相互作用、ファイル名記法とdiff以外のtransformerの同時利用は未検証
- ~~コンテンツコレクション経由の実ビルドは未検証~~ → **T2-2で検証済み**。コレクション経由の`astro build`（`render()`）でも`shikiConfig`（`createRenderer`経路）が効き、`dist`に3要件（`code-filename`ラベル+`data-language="rust"`／`has-diff`・`diff add`/`diff remove`／`--shiki-light`・`--shiki-dark`両方）が出力されることをdist grepで確認。なお`mermaid`等の未知langは`data-language="plaintext"`にフォールバックする（除外は[mermaid.md](mermaid.md)のT2-4で対応）
