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

## 実装（T1-3で本実装済み）

実装の正はリポジトリ本体（技術検証時の雛形コードは本実装へ置き換え済みのため本書には残さない）:

- `plugins/dict-index.mjs` — `loadDictIndex(dictDirURL)`。config時点でのfrontmatter直読み。**サブフォルダを再帰探索**する（`readdirSync(dir, { recursive: true, withFileTypes: true })`）。索引構築時に `assertUniqueDictSlugs` でファイル名一意性（R-6 / AC-2）を検証し、重複があれば両パス入りで throw（T1-4）
- `plugins/wikilink.mjs` — `wikilink(dictIndex)`。検出・置換・エラー化・title表示
- `plugins/validate-wikilinks.mjs` — `validateWikilinks(dictIndex, contentDirURL)`。全コンテンツmdを本プラグインで単体コンパイルしリンク切れ・非対称違反を config評価時に throw（R-13/R-14 / AC-9/AC-10。T1-4）
- `astro.config.mjs` — `markdown.processor: satteri({ mdastPlugins: [wikilink(dictIndex)] })` として登録。加えてconfigトップレベルで `loadDictIndex`（R-6検証内包）・`validateWikilinks` を呼ぶ

雛形からの主な変更点:

- **公開判定のメモ化**: `wikilink(dictIndex)`は「文書ごとに呼ばれるファクトリ」を返す二段構成にし、`isSourcePagePublic`の結果を文書単位のクロージャ変数にキャッシュする（visitor呼び出しごとの`readFileSync`を回避）
- **js-yaml v5はESMでdefault exportを提供しない**: `import yaml from 'js-yaml'`はvite（config評価）で `does not provide an export named 'default'` エラーになる。`import { load } from 'js-yaml'` のnamed importを使う
- `// @ts-check`＋JSDoc型注釈を付ける場合、新規生成ノード配列には `/** @type {import('satteri').MdastContent[]} */` の注釈が必要（`type: 'text'`等がstring型に広がり`insertBefore`の型と合わなくなるため）

## コンテンツコレクション実ビルド検証の結果（T1-3）

Content Layer API（glob loader）経由の実ビルドに載せて検証した結果。

### OK: `ctx.fileURL`は実ファイルを指す（最優先リスクは解消）

- コレクション経由のコンパイルでも`ctx.fileURL`は `file:///…/content/dict/basics/ownership.md` 形式で**実ソースファイルを指し、`readFileSync`で読める**（全31文書で実測）。非対称ルール判定・エラーメッセージのパス表示とも前提成立
- wikilinkは`<a href="/dict/[slug]" class="wikilink" data-dict-link="[slug]">タイトル</a>`に正しく変換される（`render(entry)`した`dist/`のHTMLで確認）
- **非公開エントリもcontent sync時に全件コンパイルされる**（ページとしてrenderされなくても）。つまりwikilink検証はレンダリング対象に関係なく全コンテンツで走る

### NG: visitor内throwがビルドを失敗させない（代替が必要）

`src/pages/*.md`直置きでは throw = exit 1 だったが、**コレクション経由ではglob loaderがrenderエラーを握りつぶす**:

- throwすると `[ERROR] [glob-loader] Error rendering basics/ownership.md: [[mutex]]は非公開の…` とログには出るが、**ビルドはexit 0で成功**し、該当エントリの本文だけが**空のまま静かに出力される**
- さらにContent Layerのキャッシュ（`.astro/`・`node_modules/.astro/`）により、**2回目以降のビルドでは該当ファイルが再コンパイルされず[ERROR]ログすら出ない**（違反が恒久的に不可視化される）

**対処（T1-4で実装済み）**: ビルド時検証はレンダリングパイプラインの外で行う。satteriが公開する単体コンパイルAPI `markdownToHtml(source, { mdastPlugins, fileURL })` を使い、**config評価時**（`astro.config.mjs` トップレベル）に全コンテンツmdを本プラグインで直接コンパイルする検証パス `plugins/validate-wikilinks.mjs`（`validateWikilinks(dictIndex, contentDirURL)`）を設けた。config評価時のthrowは確実にexit 1になり、キャッシュも介在しない（config評価は `astro build` で実測。dev/check も同じ経路を通るため壊れたwikilinkはdev起動も落とす想定＝未実測。ソロ執筆運用では許容）。visitor内のthrowは開発時の即時フィードバック用として残す。

- **frontmatterは剥がさず全文を渡す（T1-4実測で確定）**: `markdownToHtml` は結果に `frontmatter` フィールドを返す＝**自前でfrontmatterを抽出する**。T1-3時点の「剥がして渡すこと」というノートは本バージョンでは陳腐化。全文を渡すとエラーメッセージの行番号が実ファイルと一致する（剥がすとズレる）。

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

ビルドエラー時のstderr（実測。exit 1。※`src/pages/*.md`直置きの場合のみ — コレクション経由では失敗しない。上記「NG」参照）:

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
4. **コレクション経由ではvisitor内throwがビルドを失敗させない**（上記「NG」参照。throw方式の一般知見は [satteri-plugin-api.md](satteri-plugin-api.md)）
5. **プラグインを変更してもContent Layerキャッシュは破棄されない**: mdが未変更なら再コンパイルされず、プラグイン修正が反映されない。プラグインの挙動確認時は `.astro/` と `node_modules/.astro/` を削除してからビルドする

## 制約・残課題

- **リンク切れ・公開非対称・ファイル名一意性のビルドエラー化はT1-4で実装済み**（config評価時の検証パス。上記「対処」・「実装」参照）
- **R-12伝播とwikilink非対称判定の関係は未対応**: `isSourcePagePublic` はリンク元自身のfrontmatterのみ見る。非公開な本`index.md`配下の「`public: true`な章」から非公開辞書へリンクした場合、本番では章ごと除外され404にはならないが、現実装は章自身が公開なのでビルドエラーにする（過検出側）。AC-10のスコープ外。現ダミーコンテンツには該当ケースが無くクリーンビルドは通る
- 強調記法内（`**[[ownership]]**`）や既にリンク化されたテキストの子孫での`[[...]]`の扱いは未検証（素のtextノード内のみ確認）
- 同一辞書slugへの複数回リンク時の重複チェックは未検証（必要かは要件次第）
- 非公開ページ→存在しないslugは、現実装では`!entry`判定が先に評価されるため無条件でビルドエラーになる（CLAUDE.mdの文言どおりの意図的挙動。単体コンパイルPoCでthrow自体は確認済み）
