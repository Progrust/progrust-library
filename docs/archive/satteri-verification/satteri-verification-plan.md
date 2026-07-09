# Sätteri技術検証 計画書

> [!warning] 凍結済みアーカイブ
> 本検証は2026-07-08にクローズ済み。本書は歴史的記録であり**更新しない**。
> 本番実装の参照先は `../../markdown-pipeline/README.md`。

Progrust Library本実装の前に行う、Sätteriカスタムプラグインのプロトタイプ検証の計画書。
検証結果は `satteri-verification-results.md`（同ディレクトリ）に本書の「5. 検証結果の書き方」の書式で記録する。

## 1. 目的と背景

本プロジェクトの実装リスクは、Astro v7（2026-06-22リリース）で導入されたばかりのMarkdownパイプライン **Sätteri** 上で、以下の4つのカスタムプラグインが実現可能かどうかに集約されている。

1. **wikilink**（`[[ファイル名]]` → 辞書リンク変換 + ビルド時リンク検証）
2. **`:::`ディレクティブ**（message / details / figure のHTML変換）
3. **リンクカード**（ベアURLのOGPカード化、ビルド時fetch + キャッシュ）
4. **mermaid**（ビルド時SVG化、ライト/ダーク2枚生成）

加えて **Shiki連携**（diff表示・ファイル名表示・dual theme）の実現方法も未確定。

Sätteriはエコシステムの知見・実例がほぼ存在しないため、ドキュメントだけでは実現可否を断定できない。本検証の目的は、**コードを書き始める前に「Sätteriで行けるか、`unified()`（remark/rehype）へ切り替えるべきか」を判断すること**である。

### ゴール

- 4プラグイン + Shiki連携それぞれについて PASS / PASS(条件付き) / FAIL の判定を下す
- PASSした項目は、本番実装の雛形にできる動作確認済みコードを結果ドキュメントに残す
- FAILがあれば、その機能の代替案または `unified()` 切替の判断材料をまとめる

## 2. 検証環境と範囲

### 環境

- 使い捨ての最小Astroプロジェクトを **`sandbox/`**（リポジトリ直下、本体コードとは分離）に作成する
- 構成は最新のAstro v7素構成のみ（Tailwind・コンテンツコレクション等は入れない。ただしB-4のみコレクション連携のため`content/`を最小構成で使う）
- 検証完了後、`sandbox/`は削除してよい（結果ドキュメントに必要なコードを転記してから）

### 範囲

**やること**: プラグインAPIの挙動確認、4プラグインのプロトタイプ実装、Shiki連携の確認
**やらないこと（範囲外）**: 本番品質のコード、デザイン/CSS、エッジケースの網羅、パフォーマンス計測、ホバープレビュー等のクライアントJS

### 事前調査で判明していること（前提知識）

Astro公式docs + satteri.bruits.org にて確認済み（2026-07-07時点）:

- `markdown.processor` に `satteri({ mdastPlugins: [...], hastPlugins: [...], features: {...} })` を渡す（`@astrojs/markdown-satteri`、Astro同梱）
- プラグインは `defineMdastPlugin` / `defineHastPlugin` で定義。**ノード種別ごとのvisitor購読モデル**（例: `heading(node, ctx) { ... }`）。定義オブジェクトの代わりにファクトリ関数も渡せる（文書間でクロージャ状態がリセットされる）
- **どのvisitorもPromiseを返せる**（sync/async混在可）
- ノードは**読み取り専用**（Rust側参照）。変更はすべて `ctx` 経由: `setProperty` / `replaceNode` / `removeNode` / `insertBefore` / `appendChild` / `wrapNode`。ノードを保持するには `structuredClone(node)` が必要
- 診断は `ctx.report({ message, node, severity })`（severity: `"error" | "warning" | "info"`、デフォルトerror）。**ビルドが実際に失敗するかは未確認**
- `features: { directive: true }` で `containerDirective` / `leafDirective` / `textDirective` のvisitorキーが有効になる。**ノード構造（name / label / 属性の渡り方）はドキュメント未記載 → 実測必須**
- hastの `element` visitorは `filter` 配列（tagName一致）が必須。`text` / `comment` / `raw` はbare visitor
- 固有挙動: 自プラグインが新規生成したノードは同プラグインで再走査されない。サブツリー削除時、ネストしたノードに積まれた変換は破棄されwarningが出る
- `markdown.syntaxHighlight.excludeLangs` はAstro側の設定として存在（デフォルト `['math']`）

## 3. 検証項目

推奨実施順: **A → C → B → F → E → D**（理由は「6. 進め方」参照）

### A. プラグインAPI基礎

| # | 確認すること | 確認方法 |
| --- | --- | --- |
| A-1 | mdast/hast visitorが購読どおりに呼ばれるか | 全ノード種別をログ出力する素通しプラグインで `astro build` |
| A-2 | `ctx`のノード操作（`replaceNode` / `removeNode` / `insertBefore` / `wrapNode` / `setProperty`）が期待どおり動くか | 見出しレベル変更・段落削除・ラップ等の小さな操作を1つずつ試し、出力HTMLで確認 |
| A-3 | asyncビジターが動くか（buildが待ってくれるか） | visitor内で `await setTimeout` + fetch を行い、結果がHTMLに反映されるか |
| A-4 | `ctx.report({ severity: "error" })` で `astro build` が**非0終了する**か。エラーメッセージに対象ファイル名・位置が出るか | 特定文字列を検出したらreportするプラグインでビルドし、終了コードと出力を確認 |
| A-5 | ファクトリ形式で文書ごとに状態がリセットされるか | カウンタを持つファクトリプラグインで複数mdをビルドし、文書間でカウンタが混ざらないか |
| A-6 | 新規生成ノードの再走査スキップ・サブツリー削除時のwarningの実際の挙動 | 意図的にその状況を作って観察（B/C実装時の落とし穴把握のため） |

### B. wikilink

| # | 確認すること | 確認方法 |
| --- | --- | --- |
| B-1 | `text` visitorで `[[ファイル名]]` を検出し、textノードを `link`（+ 前後のtext）に分割・置換できるか | `本文中の[[ownership]]です` を含むmdで `<a href="/dict/ownership">` が出力されるか |
| B-2 | コードブロック・インラインコード内の `[[T; N]]` が**誤変換されない**か | Rustコード（`let a: [[i32; 2]; 3]`）を含むコードブロック/インラインコードで確認（mdastでは`code`/`inlineCode`ノードのため`text` visitorに来ない想定の実証） |
| B-3 | `<a>`にdata属性（`data-dict-link`等）とカスタムclassを付与できるか | 出力HTMLの属性を確認 |
| B-4 | 全辞書のslug/title/publicの一覧をプラグインに渡せるか | プラグインファクトリの引数として一覧を渡す構成を試す。※コレクション読込とMarkdown処理の順序の都合で`astro.config`時点でコレクションAPIが使えない可能性が高いため、**`content/dict/`のmdファイルのfrontmatterを`astro.config.mjs`側で直接パース（gray-matter等）して渡す方式**を本命として検証 |
| B-5 | 存在しないwikilink・非公開辞書へのwikilinkでビルドエラーにできるか（A-4の応用） | 一覧に無いslugを書いてビルドが失敗するか |
| B-6 | リンクテキストをファイル名ではなく対象のtitleにできるか | B-4の一覧からtitleを引いて表示テキストに使う |

### C. `:::`ディレクティブ

| # | 確認すること | 確認方法 |
| --- | --- | --- |
| C-1 | `features: { directive: true }` で `:::message` 等がパースされるか。**ノード構造の実測**（name・引数・label・attributes・childrenがどう入るか） | `containerDirective` visitorで `JSON.stringify(structuredClone(node))` をダンプ |
| C-2 | `:::message alert` の「alert」がどこに入るか（属性か、labelか、childrenの先頭textか） | C-1のダンプで確認 |
| C-3 | `:::details タイトル` のタイトル文字列の取得方法 | C-1のダンプで確認 |
| C-4 | `:::figure[図1: キャプション]{width=480}` のlabel（`[...]`）とattributes（`{width=480}`）の取得方法 | C-1のダンプで確認 |
| C-5 | ネスト（`::::message` の中に `:::details`）が正しくパースされるか | ネストしたmdでダンプ・出力確認 |
| C-6 | directiveノードをHTML要素（`<aside>` / `<details><summary>` / `<figure><figcaption>`）へ変換できるか。**mdast段階でhast相当のノードを作れるか、それともhastプラグイン側で変換すべきか** | 実際に3記法の変換を実装して出力HTMLを確認 |
| C-7 | `textDirective`の副作用: 本文中の `:` を含む通常テキスト（`12:30` 等）が誤ってdirective扱いされないか | 時刻・URL等を含むmdで出力確認 |

### D. リンクカード

| # | 確認すること | 確認方法 |
| --- | --- | --- |
| D-1 | 「段落の子がリンク1つだけ（オートリンクされたベアURL）」を`paragraph` visitorで判定できるか。GFMオートリンクでURLが既に`link`ノードになっているかの確認 | ベアURL単独の段落・文中URLの段落の両方でノードをダンプ |
| D-2 | asyncビジター内で外部サイトへfetchし、結果でノードを組み立てられるか（A-3の応用） | 実在サイトのOGPを取得してカードHTMLを出力 |
| D-3 | ビルドを跨ぐローカルキャッシュの置き場所と読み書き | `node_modules/.cache/`または`.cache/`配下にJSONで保存し、2回目のビルドでfetchが走らないこと（ログで確認） |
| D-4 | fetch失敗時に簡易カードへフォールバックし、ビルドエラーにならないこと | 存在しないドメインのURLでビルドが成功するか |

### E. mermaid

| # | 確認すること | 確認方法 |
| --- | --- | --- |
| E-1 | `excludeLangs: ['mermaid']` でmermaidコードブロックがShikiを通らず、hastプラグインに素のまま届くか。届いたノードの形（`<pre><code class="language-mermaid">`か） | hastプラグインでダンプ |
| E-2 | hastの`element` visitorの`filter`で対象を捕捉できるか（filterは`pre`と`code`どちらで書くべきか） | E-1と同時に確認 |
| E-3 | asyncビジターから `mermaid-isomorphic`（Playwright）を呼んでSVG文字列を得られるか。複数ダイアグラムでのブラウザインスタンス使い回し | フローチャート2つを含むmdでビルド |
| E-4 | SVG文字列を`raw`ノード等でHTMLに埋め込めるか | 出力HTMLにSVGがそのまま（エスケープされずに）埋まるか |
| E-5 | ライト/ダーク2枚生成とid一意化 | 2テーマでレンダリングし、`id`属性をprefix付きに書き換えて衝突しないことをHTMLで確認 |
| E-6 | WSL2/CI相当環境でPlaywrightが動くか（依存ライブラリ） | `npx playwright install --with-deps chromium` 後にビルドが通るか |

### F. Shiki連携

| # | 確認すること | 確認方法 |
| --- | --- | --- |
| F-1 | `markdown.shikiConfig.transformers` がSätteriパイプラインでも効くか | `@shikijs/transformers`の`transformerNotationDiff`を入れて `// [!code ++]` 記法が反映されるか |
| F-2 | dual theme（`themes: { light, dark }`）の出力形式（CSS変数方式か）とクラス切替での見た目の変わり方 | 出力HTMLのstyle属性を確認 |
| F-3 | ファイル名表示（` ```rust:index.rs `）の実現方法: Shikiにlang文字列がどう渡るか（`rust:index.rs`のままエラーになるか）、mdast側で`lang`と`meta`に分離する前処理が可能か | `code` visitorで`lang`/`meta`をダンプし、`lang`の書き換え + ファイル名の別ノード化を試す |
| F-4 | F-1が効かない場合の代替: hastプラグインでShikiを直接呼ぶ方式の成立性 | F-1がFAILのときのみ実施 |

## 4. 受け入れ条件

### 判定の定義

| 判定 | 意味 | その後のアクション |
| --- | --- | --- |
| **PASS** | CLAUDE.mdの仕様どおり実現できる | 本番実装へ進む |
| **PASS(条件付き)** | 記法・実装方式の軽微な調整で実現できる | 調整内容をCLAUDE.mdへ反映して進む |
| **FAIL** | Sätteriでは現実的に実現不可 | 機能単位で代替案を検討。FAILが複数、または wikilink/ディレクティブ級の中核機能がFAILなら `unified()` 切替を判断 |

### グループごとの合格条件

- **A（API基礎）**: A-1〜A-3が全て動作し、かつ A-4で「`ctx.report(error)`によりビルドが非0終了する」**または**「visitor内でthrowする等、代替のビルド失敗手段が確立できる」こと。→ これが崩れるとB-5（リンク検証）が成立しないため、Aの不成立は全体中断の条件（「6. 進め方」参照）
- **B（wikilink）**: 本文中の `[[...]]` だけが `<a>` + data属性になり、コードブロック/インラインコード内は誤変換されないこと。辞書一覧をプラグインへ渡す方法が確立し、不正リンクでビルドが失敗すること
- **C（ディレクティブ）**: 3記法すべてでlabel・引数・attributesが取得でき、意図したHTML（aside/details/figure）に変換できること。ネストが動くこと。**記法自体の調整（例: figureのキャプションの書き方変更）はPASS(条件付き)として許容**
- **D（リンクカード）**: asyncでのOGP取得とキャッシュが動き、fetch失敗時にビルドが落ちずフォールバックカードが出ること
- **E（mermaid）**: ビルド成果物のHTMLに2枚のSVGが（エスケープされずに）埋まり、idが衝突していないこと。ローカル環境でビルドが安定して通ること（CI検証は本実装フェーズでよい）
- **F（Shiki連携）**: diff表示とファイル名表示が**何らかの手段**（transformers / mdast前処理 / 自作hastプラグインのいずれか）で出せること。dual themeのクラス切替方式が確認できること

## 5. 検証結果の書き方（`satteri-verification-results.md` のテンプレート）

本番実装時に結果ドキュメントだけ読めば迷わず書き始められることを目的とする。以下の構成を必須とする。

```markdown
# Sätteri技術検証 結果

## 検証環境
- 検証日: yyyy-MM-dd
- バージョン一覧: astro X.Y.Z / @astrojs/markdown-satteri X.Y.Z / mermaid-isomorphic X.Y.Z / ...（package.jsonから転記）

## 判定サマリ
| グループ | 判定 | 一言メモ |
（A〜Fの6行。FAILがある場合はunified()切替の要否判断も記載）

## A. プラグインAPI基礎
### 判定: PASS / PASS(条件付き) / FAIL
### 動作確認済みコード
（そのままコピーして本番の雛形にできる完全なコード。抜粋ではなくファイル単位で。
 astro.config.mjsへの登録方法も含める）
### 実測したノード構造
（JSON.stringifyのダンプ。特にC: directiveノードは必須）
### ハマった点と回避策
（エラーメッセージは原文で記録）
### 本番実装時の注意事項
（B〜Fも同じ構成で繰り返す）

## CLAUDE.md反映事項
（検証の結果、仕様の変更・追記が必要になった点の一覧。無ければ「なし」と明記）

## 残課題
（意図的に未検証のまま残した事項。無ければ「なし」と明記。暗黙の未検証を作らない）
```

### 記録時のルール

- コードは**動作確認した最終版のみ**を載せる（試行錯誤の途中版は載せない。ただし「ハマった点」に失敗パターンを要約する）
- ノード構造のダンプは、後で見て分かるよう**入力のmdソースとセットで**載せる
- 「たぶん動く」「〜のはず」を書かない。動かして確認したことだけを事実として書き、未確認のものは残課題へ移す
- PASS(条件付き)の場合、**何をどう調整したのか**（例: 記法の変更前→変更後）を明示する

## 6. 検証の進め方と中断基準

### 進め方（タスクの着手順）

以下の順にタスクとして消化する。各タスクは「完了の目安」を満たしたら次へ進む。

| 順 | タスク | 内容 | 完了の目安 |
| --- | --- | --- | --- |
| 1 | 検証環境の構築 | `sandbox/`に最小Astroプロジェクトを作成し、素のmdが1ページビルドできる状態にする。結果ドキュメントの雛形（テンプレート章立てのみ）もこの時点で作る | `astro build`が通り、バージョン一覧を結果ドキュメントに記録済み |
| 2 | A: プラグインAPI基礎 | A-1〜A-6。**中断基準の判定ポイント**（下記） | A全項目の判定と最小コードを結果ドキュメントに記録済み |
| 3 | C: `:::`ディレクティブ | C-1〜C-7。ノード構造のダンプ取得を最優先 | 3記法のHTML変換が動き、ダンプが記録済み。記法の調整が必要なら「CLAUDE.md反映事項」に追記済み |
| 4 | B: wikilink | B-1〜B-6。タスク2で確立したエラー送出手段を使う | 正常変換・誤変換防止・ビルドエラー化の3点が確認済み |
| 5 | F: Shiki連携 | F-1〜F-3（F-1がFAILならF-4） | diff・ファイル名表示・dual themeの実現方法が1つ確定済み |
| 6 | E: mermaid | E-1〜E-6。Playwrightのセットアップ込み | 2枚のSVGが埋まったHTMLが確認済み |
| 7 | D: リンクカード | D-1〜D-4 | OGPカード・キャッシュ・フォールバックの3点が確認済み |
| 8 | 結果の確定とクローズ | 判定サマリ・CLAUDE.md反映事項・残課題を確定し、全体判定（Sätteri続行 / `unified()`切替）を下す。`sandbox/`を削除 | 結果ドキュメントが「5. 検証結果の書き方」の必須項目をすべて満たしている |

この順序の理由:

- **A**が最初: 全プラグインの前提。特にA-4（ビルドエラー化）はwikilinkの成立条件
- **C**が2番目: directiveノード構造の実測結果は難易度見積り全体に影響し、記法仕様の確定にも必要
- **B**が3番目: A-4とB-4（コレクション連携）の組み合わせで、本アプリ固有で最も重要な機能を確定させる
- **F**: Shiki transformersの成否で追加作業量が大きく変わるため、重いE/Dより先に軽く確認
- **E → D**: 外部依存（Playwright / ネットワーク）があり環境要因で時間を食いやすいため最後

※結果ドキュメントへの記録は各タスクの完了時に都度行う（タスク8でまとめて書かない。記憶が新しいうちに記録する）

### 中断基準

- **Aの段階で「ノード操作が実用にならない」または「ビルドを失敗させる手段がない」場合**: 以降のB〜Fを打ち切り、`unified()`切替の判断材料（何ができなかったか、unified側では既製プラグインで賄える見込み）をまとめて報告する
- 個別項目で2〜3時間相当試しても解決しない場合: その項目を保留（残課題行き）にして次へ進み、全体像を先に出す

### 検証後のアクション

1. 結果を `docs/satteri-verification-results.md` に記録
2. CLAUDE.md反映事項があれば適用（ユーザー確認のうえ）
3. 全体判定（Sätteri続行 / unified()切替）を確定し、本実装のフェーズ計画に入る
4. `sandbox/` を削除（必要コードは結果ドキュメントへ転記済みであること）
