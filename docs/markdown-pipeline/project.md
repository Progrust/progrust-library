# project（`:::project` Playgroundプロジェクト連携）

`:::project` のcontainer directiveを、複数ファイル構成のPlaygroundプロジェクト表示（`.code-project`: ヘッダー+「Playgroundで開く」ボタン / box-drawingファイルツリー / 本文）へ変換するmdastプラグイン（要求仕様: [`../spec/playground-project.md`](../spec/playground-project.md) / 見た目の確定仕様: [`../ui-design/ui-design-spec.md`](../ui-design/ui-design-spec.md)「`:::project`」/ スタイル実体: `src/styles/global.css`）。Gist IDはマッピングファイル `playground-gists.json` から解決し、URLはビルド時に静的生成する（クライアントJSなし）。

## 記法

`:::project[タイトル]` で複数のファイル名記法付きコードブロックを囲む（[`../markdown-notation/rule.md`](../markdown-notation/rule.md)「プロジェクト（複数ファイルをPlaygroundで開く）」）。

## 実装方式

1. `containerDirective` visitorで `name === "project"` のみ捕捉する（他の名前は後段の `directives` の責務）
2. **直下のchildrenを1レベルだけ分類**する（再帰しない。ネストしたディレクティブ内のコードブロックはファイル扱いしない = playground-project R-1）:
   - `data.directiveLabel` 付き先頭paragraph → タイトル（ヘッダーへclone。本文から除外）
   - 生 `code` ノード → **R-7(a) throw**（`codeFilename` 変換後も生codeで残っている = ファイル名記法なし）
   - `.code-block` ラッパ（`codeFilename` が生成した `paragraph(hName=div, class="code-block") > [span.code-filename > text, code]`）→ ファイル。(d) playgroundメタ・(c) 重複を検証し、ページ内一意のid付きラッパへ再構築して本文へ
   - その他（解説文・ネストディレクティブ等）→ ハンドルのまま本文へ素通し
3. 子ループ後に (b) `src/main.rs`/`src/lib.rs` 有無 → `projectHash`（`plugins/project-gist.mjs` の共有実装。R-12）でマッピングを引き、(e) 未登録throw（`npm run sync:playground` の実行案内付き）
4. `ctx.replaceNode` で全体を `.code-project`（ヘッダー / ツリー / 本文の3要素）へ置換する

**登録順は `codeFilename → project → playgroundLink → … → directives`（3制約すべて必須）**:

- **codeFilename の後**: ファイル検出は変換後の `.code-block` ラッパ形状で行う（素のmdastを走査する `scripts/sync-playground-gists.mjs` の `readProject` とは入力形状が異なる並行実装。判定条件・メッセージを変えるときは双方を同時に直す = spec R-8）
- **playgroundLink の前**: R-7(d) のplaygroundメタ検出は、playgroundLinkがメタを消費して `.code-playground` へ変換してしまう前でないと成立しない
- **directives の前**: `directives.mjs` の未知ディレクティブ名throwに落ちる前に `:::project` を消費する（順序契約の回帰ガードは `tests/plugins/directives.test.ts`「未知のディレクティブ」）

設計判断:

- **id付与は `setProperty` でなくラッパ再構築**: `{ type: "paragraph", data: { hName: "div", hProperties: { class: "code-block", id } }, children: [...child.children] }` の新規リテラルで置き換える（内側のspan/codeはハンドル再利用）。※検証の結果、前段パス生成ノードへの `setProperty` も実は成立する（「落とし穴と回避策」参照）が、id含みの新リテラルの方がdata全体の合成ミスがなく、arena挙動への依存も薄いためこちらを採用
- **外側 `.code-project` と本文 `.code-project-body` は `blockquote` 型 + `data.hName`**: containerDirective型のままだと脚注参照の収集パスが中を走査しない（[directives.md](directives.md) 落とし穴6と同じ理由）。ヘッダー・ツリーは脚注が入り得ないため `paragraph` 型でよい
- **タイトルは「本文から除外 + cloneで新設」**: ハンドルの移動+relabelはdropされる（directives.md 落とし穴5）ため、`structuredClone(label).children` を新規 `p.code-project-title` に入れる
- **idスキームは `project-{連番}-{slug}`**（slug = ファイル名を `[^a-z0-9]+` → `-` 正規化）。素の `src/main.rs` をidにするとURLフラグメント・CSSセレクタでエスケープが要るため避ける。文書ごとファクトリのクロージャで連番と使用済みid集合を持ち、ページ内一意を保証する（AC-2。`src/main.rs` と `src/main-rs` のようなslug衝突は `-2` サフィックス）
- **ツリーは1行 = `.tree-row` のdiv**（枝記号 `span.tree-branch`（aria-hidden）+ ディレクトリ `span.tree-dir`（非リンク・`/` 接尾）or ファイル `link`（`#id`））。`text("\n")` で改行すると後段の `softBreaks` が `<br>` 化して出力が登録順に依存するため、行を要素として分ける。各階層はディレクトリ優先 + 名前昇順（`Buffer.compare` によるコードポイント順）。ルート行（`.`）は出力しない
- **ツリーのファイルリンクは素のmdast `link`**: `externalLinks` は `http(s)` のみ対象、`linkCard` は「テキスト===URL」不成立のため、後段プラグインに巻き込まれない
- **gistMapはファクトリ引数で注入**: config評価時に `readGistMap(GIST_MAP_PATH)` で1回読み `project(gistMap)` へ渡す（`wikilink(dictIndex)` と同型。テストからインラインのマッピングを渡せる）

### ビルドエラー化は `validateProjects`（config評価時検証パス）が担う

コレクション経由のレンダリングではvisitor内throwがglob loaderに握り潰されexit 0になる（[satteri-plugin-api.md](satteri-plugin-api.md)）ため、`plugins/validate-projects.mjs` が `validateWikilinks` と同型のconfig評価時検証を行う: `content/` 配下の全mdのうち **`:::project` を含むファイルだけ**を `markdownToHtml(source, { mdastPlugins: [codeFilename, project(gistMap)], features: { directive: true }, fileURL })` で単体コンパイルする（directivesは登録しない = 未知ディレクティブ検証へ範囲を広げない）。plugin側のthrowがそのまま伝播してexit 1になる。

## 雛形コード（動作確認済み）

### astro.config.mjs

```js
import { project } from "./plugins/project.mjs";
import { GIST_MAP_PATH, readGistMap } from "./plugins/project-gist.mjs";
import { validateProjects } from "./plugins/validate-projects.mjs";
// …
// config評価時に1回読む（devサーバー起動中の sync:playground 実行は再起動が必要）
const gistMap = readGistMap(fileURLToPath(new URL(`./${GIST_MAP_PATH}`, import.meta.url)));
validateProjects(gistMap, new URL("./content/", import.meta.url));
// …
// 順序: codeFilename → project → playgroundLink → …（上記3制約）
mdastPlugins: [codeFilename, project(gistMap), playgroundLink, wikilink(dictIndex), directives, /* … */],
```

### 変換プラグイン（`plugins/project.mjs`）

実体は `plugins/project.mjs` を参照（本文書の記載と同一方式）。visitorの骨格:

```js
export function project(gistMap) {
  return () => {
    let ordinal = 0; // ページ内の :::project 連番（idの名前空間）
    const usedIds = new Set();
    return defineMdastPlugin({
      name: "project",
      containerDirective(node, ctx) {
        if (node.name !== "project") return;
        ordinal += 1;
        const label = labelChild(node.children);
        const files = []; // { name, code, id }
        const body = [];
        for (const child of node.children) {
          if (child === label) continue;
          if (child.type === "code") throw new Error(/* R-7(a) + posOf */);
          const entry = fileEntryOf(child); // .code-block ラッパ判定 + { filename, code } 抽出
          if (!entry) { body.push(child); continue; } // 解説文・ネストディレクティブ（R-1）
          /* R-7(d)(c) 検証 → uniqueId → files へ収集 → id付き新リテラルで body へ */
        }
        /* R-7(b) → projectHash(files) → gistMap 未登録なら R-7(e) throw */
        ctx.replaceNode(node, {
          type: "blockquote", // 脚注収集のため（directives.md 落とし穴6）
          data: { hName: "div", hProperties: { class: "code-project" } },
          children: [buildHeader(label, files.length, known.id), buildTree(files), bodyWrapper],
        });
      },
    });
  };
}
```

## 落とし穴と回避策

- **新規リテラルのトップレベル `position` はarenaへ引き継がれない**（実測）: `codeFilename` のラッパに `position: node.position` を持たせても、後段passからは `undefined` になる。一方 **`data` の任意キーは後段passからそのまま読める**ため、元codeノードの位置は `data.sourcePosition` へ退避して受け渡す（`code-filename.mjs` → 本プラグインの `posOf` がフォールバック参照。R-7(c)/(d) の「ファイル:行:列」報告に必要）
- **前段パスが生成したノードへの `setProperty` は成立する**（実測。パス完了時にarenaへ登録される）: [satteri-plugin-api.md](satteri-plugin-api.md) の「新規生成ノードに `setProperty` は使えない」は**同一パス内**の話。本プラグインは再構築方式を採用しているため依存しないが、arena質問の答えとして記録する
- **playgroundメタ付き・ファイル名なし**（` ```rust playground ` 直置き）は `codeFilename` を素通りして生codeのまま残るため **(a) が先に出る**（(d) には進まない）。`readProject`（sync側）も (a) で `continue` するため判定は一致する
- **ビルド側は最初の違反で即throw、sync側は全件収集して報告**という非対称は仕様上許容（ビルドは失敗を1件示せば足り、syncはNG一覧が有用なため）
- **`::::details` 等の中の `:::project` も変換される**（visitorはネストしたcontainerDirectiveにも発火する。spec R-1に明記済み）。逆に `:::project` 直下でないコードブロックはファイル扱いされない
- **svgの `hProperties` はキーのケーシングが属性へそのまま出る**（実測: `viewBox="0 0 24 24"` が保持される）。矢印アイコンは `hName: "svg"` + `path` のノードリテラルで埋め込める（`rawHtml` 不要）
- 置換後の本文中に残したネストディレクティブ（`:::figure` / `::::details`）は、後段の `directives` passが通常どおり変換する（前段生成ノードのchildrenも後段から訪問される）

## 制約・残課題

- devサーバー起動中に `npm run sync:playground` でマッピングを更新しても反映されない（gistMapはconfig評価時に1回読むため。再起動が必要）
- ファイル数表示は単数形対応（`1 file` / `N files`）。表記は実装決定でspecの規定はない
- eyebrow `// project` はmarkup側のリテラルテキスト。CSSで `::before` の `//` を足さない（messageのeyebrowとは方式が異なる）
- スタイル実体は `src/styles/global.css` の `:::project` セクション。CSS側が本プラグインの出力に依存している点:
  - id契約 `project-{n}-{slug}`（`scroll-margin-top` と `:target` の着地スタイルの適用先）
  - ツリーは `.tree-row` / `.tree-branch` / `.tree-dir` の3クラスで、枝記号の連続空白は `white-space: pre` が保持する
  - **ツリーのファイルリンクは素の `<a>`** のため、汎用リンク規則 `.prose a:not(.wikilink):not(.link-card):not(.playground-open)`（詳細度 (0,4,1)）に負ける。CSS側は同じ `:not()` 連鎖を付けて上回っている（クラスを付けない設計＝後段プラグインに巻き込まれないための選択とのトレードオフ）
- マーカーだけで中身が空白の行（` // [!code ++]` のみの行）は、Shikiの記法除去後に表示から消える。Gist側（`stripCodeNotation`）でも同様に消えるため両者は一致する
- version / edition は `stable` / `2024` 固定（spec R-5）
- Playgroundを初めて開くと「single file mode のエディタを multiple file mode に切り替えた」旨の案内バナーが出る（モード自体は `?gist=` から自動で切り替わる。実測）
- **ネスト文脈の見た目は実コンテンツで未確認**: `::::details` 内・辞書サイドペイン/ホバープレビュー内のスタイル（paper背景・コンパクト表示）は、該当する実コンテンツがまだ無いためDOMを組み替えた擬似再現でのみ確認している。これらの文脈で `:::project` を初めて使うときに実地で見た目を確認すること
