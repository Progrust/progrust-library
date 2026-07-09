# wikilink（辞書リンク）

`[[ファイル名]]` を辞書詳細ページへの`<a>`に変換し、リンク切れ・非公開辞書への不正リンクをビルドエラーにするmdastプラグイン。

前提知識: [satteri-plugin-api.md](satteri-plugin-api.md)（throw方式のビルドエラー化 / 新規ノードへの`data`リテラル直埋め / ファクトリ形式）

## 記法

執筆記法は `../markdown-notation/rule.md` の「辞書リンク」参照。仕様（CLAUDE.md）:

- 対象は辞書コンテンツのみ。ファイル名（slug）を指定し、表示テキストは対象のtitleにする
- 出力は通常の`<a href="/dict/[slug]">`（JS無効環境向け）+ プレビュー/サイドペイン用のdata属性・クラス
- リンク先が存在しない場合、および**公開ページ**から`public: false`の辞書へのリンクはビルドエラー。**非公開ページ→非公開辞書はOK**（非対称ルール）

## 実装方式

1. **検出・置換**: `text` visitorで`/\[\[([^[\]]+)\]\]/g`を検出し、textノードを「前後のtext + `link`ノード」に分割して `ctx.insertBefore(node, pieces)` + `ctx.removeNode(node)` で置換（`replaceNode`は単一ノード限定のため使えない）
2. **コード内の誤変換防止**: 追加実装不要。`text` visitorは`code`/`inlineCode`の中身に呼ばれないため、Rustの`[[i32; 2]; 3]`等は購読モデルだけで保護される（実測済み）
3. **辞書一覧の注入**: `astro.config.mjs`評価時に`content/dict/*.md`のfrontmatterを直接読み（`js-yaml`で自前パース）、slug/title/publicの配列をプラグインファクトリの引数として渡す（コレクションAPIはconfig時点で使えない）
4. **ビルドエラー化**: 不正リンク検出時にvisitor内でthrow（ファイル名・行:列・原因を含める）
5. **非対称ルールの判定**: `ctx`は処理中ページ自身のfrontmatterを公開しないため、`ctx.fileURL`からソースファイルを`readFileSync`で読み直して`public`フラグを自前パースする

## 雛形コード（動作確認済み）

### `plugins/dict-index.mjs`（config時点でのfrontmatter直読み）

```js
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

export function loadDictIndex(dictDirURL) {
  const dir = fileURLToPath(dictDirURL);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(`${dir}/${f}`, 'utf8');
      const m = raw.match(/^---\n([\s\S]*?)\n---/);
      const fm = m ? yaml.load(m[1]) : {};
      return {
        slug: f.replace(/\.md$/, ''),
        title: fm.title ?? f,
        public: fm.public !== false,
      };
    });
}
```

### `plugins/b-wikilink.mjs`（検出・置換・エラー化・title表示）

```js
// ※CLAUDE.mdの仕様は非対称（非公開ページ→非公開辞書はOK）。
//   ctxは処理中ドキュメント自身のfrontmatterを公開しないため（yaml visitorは呼ばれない）、
//   ctx.fileURLから自分でソースファイルを読み直してpublicフラグを判定する
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineMdastPlugin } from 'satteri';
import yaml from 'js-yaml';

function isSourcePagePublic(ctx) {
  if (!ctx.fileURL) return true; // fileURL不明時は判定できないので公開扱い（フォールバック）
  const raw = readFileSync(fileURLToPath(ctx.fileURL), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  const fm = m ? yaml.load(m[1]) : {};
  return fm.public !== false;
}

export function bWikilink(dictIndex) {
  const bySlug = new Map(dictIndex.map((d) => [d.slug, d]));

  return defineMdastPlugin({
    name: 'b-wikilink',
    text(node, ctx) {
      const re = /\[\[([^[\]]+)\]\]/g;
      if (!re.test(node.value)) return;
      re.lastIndex = 0;

      const pieces = [];
      let lastIndex = 0;
      let match;
      while ((match = re.exec(node.value))) {
        const [full, slug] = match;
        if (match.index > lastIndex) {
          pieces.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }

        const entry = bySlug.get(slug);
        const linkBroken = !entry || (entry.public === false && isSourcePagePublic(ctx));
        if (linkBroken) {
          const file = ctx.fileURL ? fileURLToPath(ctx.fileURL) : '(不明なファイル)';
          const pos = node.position
            ? `${node.position.start.line}:${node.position.start.column}`
            : '?:?';
          throw new Error(
            `[[${slug}]]は${entry ? '非公開の' : '存在しない'}辞書エントリです (${file}:${pos})`,
          );
        }

        // setPropertyはツリーから読み込まれたノード（arena idを持つ）にしか使えないため、
        // JSで新規生成するノードはdataプロパティをリテラルへ直接埋め込む
        // （エラーメッセージ「Pass plugin-built nodes as new content」が示す方式）
        pieces.push({
          type: 'link',
          url: `/dict/${entry.slug}`,
          children: [{ type: 'text', value: entry.title }],
          data: {
            hProperties: { class: 'wikilink', 'data-dict-link': entry.slug },
          },
        });

        lastIndex = match.index + full.length;
      }
      if (lastIndex < node.value.length) {
        pieces.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      ctx.insertBefore(node, pieces);
      ctx.removeNode(node);
    },
  });
}
```

### astro.config.mjs への登録

```js
// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { loadDictIndex } from './plugins/dict-index.mjs';
import { bWikilink } from './plugins/b-wikilink.mjs';

const dictIndex = loadDictIndex(new URL('./content/dict/', import.meta.url));

export default defineConfig({
  markdown: {
    processor: satteri({
      features: { directive: true },
      mdastPlugins: [bWikilink(dictIndex)],
      hastPlugins: [],
    }),
  },
});
```

## 入出力例（実測）

入力:

```markdown
本文中の[[ownership]]です。[[borrowing]]も参照。
```

出力:

```html
<p>本文中の<a href="/dict/ownership" class="wikilink" data-dict-link="ownership">所有権</a>です。<a href="/dict/borrowing" class="wikilink" data-dict-link="borrowing">借用</a>も参照。</p>
```

- リンクテキストはslugではなく辞書一覧から引いたtitle（所有権／借用）
- コードブロック・インラインコード内の`[[i32; 2]; 3]` / `[[i32; 2]]`は原文どおり無変換で出力される

ビルドエラー時のstderr（実測。exit 1）:

```text
[ERROR] [vite] ✗ Build failed in 98ms
[[does-not-exist]]は存在しない辞書エントリです (…/src/pages/b-fail-missing.md:5:1)
```

```text
[ERROR] [vite] ✗ Build failed in 100ms
[[secret-entry]]は非公開の辞書エントリです (…/src/pages/b-fail-private.md:5:1)
```

- 非公開エントリの**存在自体**は正常系ビルドを壊さない（一覧に含めたままでOK）
- 非対称ルール: `public: false`のページから`[[secret-entry]]`（非公開辞書）へのリンクはexit 0で正常に`<a>`が出力されることを実測済み

## 落とし穴と回避策

1. **新規生成した`link`ノードへの属性付与は`data`リテラル直埋め必須**（`setProperty`はarena idエラーになる。詳細: [satteri-plugin-api.md](satteri-plugin-api.md)）
2. **`g`フラグ付き正規表現の`lastIndex`共有バグ**: モジュールレベルで使い回さず、visitor内でリテラルとして都度生成する
3. **処理中ページ自身のfrontmatterは`ctx`から取得できない**（`yaml` visitorは呼ばれず、`ctx.data`への自動投入もない）→ `ctx.fileURL`からファイルを読み直して自前パースする（`isSourcePagePublic`）

## 制約・残課題

- **`ctx.fileURL`がコンテンツコレクション経由でも実ファイルを指すか（`readFileSync`で読めるか）は未検証**。検証は`src/pages/*.md`のみ。エラーメッセージのパス表示と非対称ルール判定の両方が依存する前提であり、**本番実装フェーズで最初に確認すべき事項**
- 雛形の`loadDictIndex`はフラット構成のみ対応。CLAUDE.mdの「配下のフォルダ構造は任意に整理可能」要件には**再帰的なディレクトリ探索への置き換えが必要**（未実装・未検証）
- CLAUDE.md記載の「mdファイル名の一意性のビルド時検証」は`loadDictIndex`に未実装（throw方式の同パターンで実装できる見込み）
- `isSourcePagePublic`はvisitor呼び出しごとに`readFileSync`する非効率な実装。本番では**ファクトリ形式で文書ごとにpublic判定をメモ化**することを推奨
- 強調記法内（`**[[ownership]]**`）や既にリンク化されたテキストの子孫での`[[...]]`の扱いは未検証（素のtextノード内のみ確認）
- 同一辞書slugへの複数回リンク時の重複チェックは未検証（必要かは要件次第）
- 非公開ページ→存在しないslugは、現実装では`!entry`判定が先に評価されるため無条件でビルドエラーになる（CLAUDE.mdの文言どおりの意図的挙動だが、実ビルドでの確認はしていない）
