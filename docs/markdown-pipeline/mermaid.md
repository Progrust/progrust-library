# mermaid（ビルド時SVG化）

`language-mermaid`のコードブロックをビルド時に`mermaid-isomorphic`（Playwright）でSVG化し、ライト/ダーク2枚を埋め込むhastプラグイン。クライアントにmermaid.jsは配布しない。レンダ失敗（構文エラー・ブラウザ起動失敗）は**throwでビルドを止める**（リンクカードがフォールバックするのと方針が逆）。

前提知識: [satteri-plugin-api.md](satteri-plugin-api.md)（hast `element` visitor / `{ type:'raw' }` / ファクトリ形式 / throw方式）

## 記法

執筆記法は `../markdown-notation/rule.md` の「mermaid」参照（mermaid.js準拠）。

## 実装方式

1. **Shikiから除外**: `markdown.syntaxHighlight.excludeLangs: ['mermaid']`（★`satteri()`の引数ではなく`markdown`直下。`math`は`defaultExcludeLanguages`で常時除外されるためmermaidだけ足せばよい）。除外されたmermaidはhastに**素の`element`（`<pre><code>`）**として届く（非除外言語はShiki済み`raw`ノードになり`element` filterには来ない）
2. **検出**: hastの`element` visitor `filter: ['pre']`で捕捉し、子`code`の`code.data.lang === 'mermaid'`で判定（`className: ['language-mermaid']`も付いている）。`<pre>`ごと`replaceNode`するため**filterは`pre`が正解**（`code`ではない）
3. **レンダ**: `createMermaidRenderer()`を**モジュールレベルで1回だけ**生成しブラウザインスタンスを使い回す。async visitorから`renderer([source], { prefix, mermaidConfig: { theme } })`を呼ぶ。`theme: 'default'`（light）/`'dark'`の2回レンダ
4. **id一意化**: `prefix`だけでは不十分（下記「落とし穴」1）。**SVG文字列の全idと参照を後処理で名前空間化する**（`namespaceSvgIds`）。nsは「図index × テーマ」でper-SVG一意（例: `mmd0l` / `mmd0d`）
5. **埋め込み**: `ctx.replaceNode(node, { type: 'raw', value: wrapper })`でエスケープなし出力。ラッパは`<figure>` + light/dark 2つの`<div>`（Tailwindの`dark:`クラスで出し分け）
6. **プラグイン本体はファクトリ形式**（文書ごとの図カウンタを持つため）

## 本番化（T2-4）での確定事項

以下は本タスクで本番実装（`plugins/mermaid.mjs`）に反映済み。**実コードが正**で、下の雛形は方式・落とし穴の参照用。

- **命名**: 雛形の `e-mermaid.mjs` / `eMermaid` → `mermaid.mjs` / `mermaid`（architecture.md §1既定名 + T2-2/T2-3 の descriptive-name 規約）。
- **レンダラDI**: `mermaid({ renderer } = {})` にし既定はモジュールレベル `createMermaidRenderer()`（`link-card.mjs` の `linkCard({ cacheDir })` 前例）。テストは fake レンダラを注入し実ブラウザ起動・実SVG生成を避ける（[implementation-rules.md](../implementation-rules.md) §5）。
- **`namespaceSvgIds` を named export**して純関数として単体テスト（AC「id重複がなく」の本丸検証）。
- **`@ts-check` 対応**: `code.data.lang`（hast標準 `Element.data` に `lang` 無し）は `getLang` ヘルパで型橋渡し、`catch (err)`/`result.reason` は `instanceof Error` 分岐（`any`不使用・§3）。throwは `{ cause: err }` 付き（lint `preserve-caught-error`）。
- **カウンタは実質ビルド全体で単調増加**（`hastPlugins: [mermaid()]` は config時に1回だけ生成＝インスタンス共有。かつAstroはContentコンポーネントを複数回レンダするため、出力に現れるns indexは0始まりとは限らない）。**ページ内での一意性は保たれる**（下記実ビルドで light/dark 2枚のid積集合0を実測）ので問題ない。

## 雛形コード（動作確認済み）

### astro.config.mjs

```js
// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { transformerNotationDiff } from '@shikijs/transformers';
import { eMermaid } from './plugins/e-mermaid.mjs';

export default defineConfig({
  markdown: {
    // ★ excludeLangs は satteri() ではなく markdown.syntaxHighlight に置く
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      transformers: [transformerNotationDiff()],
    },
    processor: satteri({
      features: { directive: true },
      mdastPlugins: [],
      hastPlugins: [eMermaid()], // ★ ファクトリ形式で登録（文書ごとに図の連番カウンタを持つ）
    }),
  },
});
```

### 変換プラグイン（`plugins/e-mermaid.mjs`）

```js
import { fileURLToPath } from 'node:url';
import { defineHastPlugin } from 'satteri';
import { createMermaidRenderer } from 'mermaid-isomorphic';

// ビルド時 mermaid → SVG 化（クライアントに mermaid.js を配布しない）。
// - mermaid は syntaxHighlight.excludeLangs で Shiki 除外 → hast に素の <pre><code data.lang=mermaid> で届く
// - ライト/ダーク 2 テーマ分の SVG を生成し、<figure> にまとめて raw で埋め込む

// レンダラはモジュールレベルで 1 度だけ生成し、ブラウザインスタンスを使い回す
const renderer = createMermaidRenderer();

// mermaid の prefix は svg ルート id とマーカー/グラデーション id しか
// 名前空間化しない。フローチャートのエッジ id（L_A_B_0）やシーケンス図の
// actor0 / S / U 等の内部 id は無名前空間のままで、同一図の light/dark 2 枚で
// 衝突する。→ SVG 文字列内の全 id と参照（url(#..) / href="#.." / aria-*）を
// 一意な ns で前置きして衝突を根絶する。
function namespaceSvgIds(svg, ns) {
  const ids = new Set();
  for (const m of svg.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    svg = svg
      .replace(new RegExp(`\\bid="${esc}"`, 'g'), `id="${ns}${id}"`)
      .replace(new RegExp(`url\\((['"]?)#${esc}\\1\\)`, 'g'), `url($1#${ns}${id}$1)`)
      .replace(new RegExp(`href="#${esc}"`, 'g'), `href="#${ns}${id}"`)
      .replace(
        new RegExp(`(aria-(?:labelledby|describedby)=")${esc}(")`, 'g'),
        `$1${ns}${id}$2`,
      );
  }
  return svg;
}

async function renderTheme(source, theme, ns) {
  const [result] = await renderer([source], {
    prefix: ns,
    mermaidConfig: { theme },
  });
  if (result.status !== 'fulfilled') {
    throw new Error(result.reason?.message ?? String(result.reason));
  }
  return namespaceSvgIds(result.value.svg, `${ns}-`);
}

// ※文書ごとに連番カウンタを持つためファクトリ形式
export function eMermaid() {
  let counter = 0;

  return defineHastPlugin({
    name: 'e-mermaid',
    element: {
      filter: ['pre'],
      async visit(node, ctx) {
        const code = node.children?.find(
          (c) => c.type === 'element' && c.tagName === 'code',
        );
        if (!code || code.type !== 'element' || code.data?.lang !== 'mermaid') return;

        const source = ctx.textContent(code).replace(/\n$/, '');
        const index = counter++;

        let lightSvg;
        let darkSvg;
        try {
          [lightSvg, darkSvg] = await Promise.all([
            renderTheme(source, 'default', `mmd${index}l`),
            renderTheme(source, 'dark', `mmd${index}d`),
          ]);
        } catch (err) {
          const file = ctx.fileURL ? fileURLToPath(ctx.fileURL) : '(不明なファイル)';
          const pos = node.position
            ? `${node.position.start.line}:${node.position.start.column}`
            : '?:?';
          // 構文エラー・ブラウザ起動失敗（依存不足）等をまとめて捕捉する
          throw new Error(`mermaid レンダリング失敗: ${err.message} (${file}:${pos})`);
        }

        // Tailwind ダークモード（html.dark クラス切替）で出し分け。light を既定、dark を dark: で表示。
        const wrapper =
          `<figure class="mermaid-diagram">` +
          `<div class="mermaid-light block dark:hidden">${lightSvg}</div>` +
          `<div class="mermaid-dark hidden dark:block">${darkSvg}</div>` +
          `</figure>`;

        ctx.replaceNode(node, { type: 'raw', value: wrapper });
      },
    },
  });
}
```

## 出力構造・検証結果（実測）

```html
<figure class="mermaid-diagram">
  <div class="mermaid-light block dark:hidden"><svg ... id="mmd0l-0" ...>…</svg></div>
  <div class="mermaid-dark hidden dark:block"><svg ... id="mmd0d-0" ...>…</svg></div>
</figure>
<!-- 図2は mmd1l / mmd1d。非除外のrustブロックは従来どおりShiki出力 -->
```

- SVGはエスケープされずそのまま埋まる（`<svg` 4個 / `&lt;svg` 0個）
- light/darkで色が実際に異なる（light: `#333`/`#552222`、dark: `#a44141`/`#ccc`/`#ddd`）
- 全idが`mmd{index}{l|d}-…`で前置きされ、**4枚のSVGのどの2枚間もid共有ゼロ**（全ペアの積集合0を実測）
- 各SVG**内**にmermaid自身が付ける重複id（エッジの`<path>`とラベル`<g>`が同じ`L_A_B_0`を持つ等）は残るが、単一図内の重複はブラウザ許容範囲で通常のクライアント側mermaid利用でも同じ。除去不要（要件は「2枚のSVG間の重複回避」）

hastに届くノードの形（実測）:

```text
element tagName='pre' properties={}
  element tagName='code' properties={ className: ['language-mermaid'] } data={ lang: 'mermaid' }
    text "flowchart TD\n    A[開始] --> B{条件?}\n ..."
```

`mermaid-isomorphic`のAPI: `renderer(diagrams: string[], { prefix, mermaidConfig, ... })`は`Promise<PromiseSettledResult<RenderResult>[]>`を返す。`RenderResult`は`{ svg, id, width, height, title?, description? }`。SVGルートidは`${prefix}-${index}`。

## 落とし穴と回避策

1. **`prefix`だけではlight/darkのidが衝突する（本機能の本丸）**
   - `prefix`はsvgルートid・矢印マーカー（`${id}_flowchart-v2-pointEnd`）・グラデーション（`${id}-gradient`）には効くが、**フローチャートのエッジid（`L_A_B_0`等）、シーケンス図のparticipant id（`actor0`/`S`/`U`/`i0`）、`root-0`等は無名前空間のまま**。同一図をlight/darkで2回レンダして同一ページに並べると重複する
   - 回避策: `namespaceSvgIds`（上記コード）で全`id="..."`と参照（`url(#..)` / `href="#.."` / `aria-labelledby`/`aria-describedby`）にper-SVG一意なnsを前置き。id属性は`"`、`url(#..)`は`)`、`href`は`"`でアンカーされるため部分一致の誤置換は起きない（`fill="#333"`のような色指定は無傷）
2. **ChromiumのOS依存不足でビルドが落ちる**
   - WSL2（Ubuntu 24.04）素の状態では`libnspr4.so`不足でブラウザ起動に失敗しexit 1（＝レンダ失敗がちゃんとビルドを止められることの裏取りにもなった）
   - 回避策: `sudo env "PATH=$PATH" npx playwright install-deps chromium`を**一度だけ**実行（sudoはPATHをリセットするため`env "PATH=$PATH"`が必要）。`--with-deps`ではなく`install-deps`サブコマンドで足りる。**CI（GitHub Actions）でも同等のdepsインストールステップが必要**（`npx playwright install --with-deps chromium`等。Pages組み込みビルドを使わずGitHub Actionsを採る理由がこれ）
3. **sequence図のCSSに「定義のないグラデーション参照」が残る（無害）**
   - mermaidの汎用スタイルシートは`stroke:url(#...-gradient)`を含むが、polygonノードを持たないsequence図ではそのgradientが`<defs>`に定義されない。元々danglingなdead CSSであり、`namespaceSvgIds`はこれを壊していない（flowchart側の実在gradientはdef/refとも正しく一致することを確認済み）

## 制約・残課題

- ライト/ダーク切替の実表示（`html.dark`トグルで入れ替わること）は未目視。プラグインはクラス付与までを確認しており、切替CSS/Tailwind設定を組んだ時点で1度ブラウザ確認する（[shiki.md](shiki.md)のdual theme CSSと同じ扱い）
- CI環境（GitHub Actions）でのPlaywright/Chromium起動は未検証（ローカルWSL2のみ）
- mermaidの全図種（gantt / class / state / ER / pie等）での動作は未検証（flowchart・sequenceの2種のみ）。`iconPacks`やカスタムフォント（`css`オプション）も未使用
- `namespaceSvgIds`の参照書き換えは`url(#..)` / `href="#.."` / `aria-labelledby|describedby`のみ対応。`begin="foo.end"`（SMILアニメ参照）等の他形式は本アプリのmermaid出力に現れなかったため未対応（必要になれば追加）
- 巨大図・多数図ページでのビルド時間/メモリ、およびレンダの並列度（現状は図ごとにlight/darkを`Promise.all`、図間はvisitor逐次）のチューニングは未検証
- ~~コンテンツコレクション経由の実ビルドは未検証~~ → **T2-4で検証済み**: 実 `astro build` の dist（debug-render に `axum-web-api-intro` を一時追加、Content Layerキャッシュ削除後にビルド→revert）で、mermaidブロックが `<figure class="mermaid-diagram">` + light/dark 2枚の `<svg>`（`&lt;svg` 0個）に変換され、light/dark間のid積集合が0、`dist/_astro/` にmermaidランタイム非配布であることを実測。
