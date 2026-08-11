// @ts-check
// :::project（Playgroundプロジェクト連携）を .code-project のHTML構造へ変換するmdastプラグイン
// （docs/markdown-pipeline/project.md、spec: docs/spec/playground-project.md R-1〜R-7 / R-12）。
// 記法は docs/markdown-notation/rule.md「プロジェクト（複数ファイルをPlaygroundで開く）」、
// HTML骨子・クラス名は docs/ui-design/ui-design-spec.md「:::project」に従う（CSSはPG1-4で実装）。
//
// 登録位置の制約（3つとも必須。docs/markdown-pipeline/project.md「実装方式」）:
// - codeFilename の後: ファイル検出は codeFilename が生成する .code-block ラッパ形状で行う
// - playgroundLink の前: R-7(d) の playground メタ検出は、playgroundLink がメタを消費して
//   .code-playground へ変換してしまう前でないと成立しない
// - directives の前: 未知のディレクティブ名throwに落ちる前に :::project を消費する
//
// R-7 (a)〜(d) の判定は scripts/sync-playground-gists.mjs の readProject と並行実装
// （走査対象のmdastが違う: あちらは素のmdast、こちらは codeFilename 変換後）。
// 判定条件・メッセージを変更するときは双方を同時に直す（spec R-8）。
import { fileURLToPath } from "node:url";
import { defineMdastPlugin } from "satteri";

import { projectHash } from "./project-gist.mjs";

/** @typedef {import('satteri').MdastVisitorContext} MdastVisitorContext */
/** @typedef {import('./project-gist.mjs').GistMap} GistMap */
/** @typedef {import('./project-gist.mjs').ProjectFile} ProjectFile */

/**
 * mdastノードを緩く読み書きするための構造型。satteriのノード別Data型は hName /
 * hProperties / ブロック子を宣言していないため、前段プラグイン（codeFilename）が生成した
 * ノードの走査と data.hName 方式のノード生成の双方で unknown 経由の橋渡しに使う。
 * @typedef {{
 *   type: string,
 *   name?: string,
 *   value?: string,
 *   lang?: string | null,
 *   meta?: string | null,
 *   url?: string,
 *   children?: LooseNode[],
 *   data?: {
 *     directiveLabel?: boolean,
 *     hName?: string,
 *     hProperties?: Record<string, unknown>,
 *     sourcePosition?: import('satteri').MdastNode['position'],
 *   },
 *   position?: import('satteri').MdastNode['position'],
 * }} LooseNode
 */

/** @typedef {{ dirs: Map<string, TreeDir>, files: { name: string, id: string }[] }} TreeDir */

const PLAYGROUND_GIST_URL =
  "https://play.rust-lang.org/?version=stable&edition=2024&gist=";

/**
 * エラーメッセージ用に「ファイル:行:列」を組み立てる（directives.mjs と同形式）。
 * codeFilename が生成した .code-block ラッパは position を持たない（新規リテラルの
 * トップレベルpositionはarenaへ引き継がれない）ため、data.sourcePosition へ退避された
 * 元codeノードの位置にフォールバックする（code-filename.mjs 参照）。
 * @param {LooseNode} node
 * @param {MdastVisitorContext} ctx
 * @returns {string}
 */
function posOf(node, ctx) {
  const file = ctx.fileURL ? fileURLToPath(ctx.fileURL) : "(不明なファイル)";
  const position = node.position ?? node.data?.sourcePosition;
  const pos = position
    ? `${position.start.line}:${position.start.column}`
    : "?:?";
  return `${file}:${pos}`;
}

/**
 * 先頭childがdirectiveのlabel（`[...]`部分）のparagraphなら返す（directives.mjs と同判定）。
 * @param {readonly LooseNode[]} children
 * @returns {LooseNode | undefined}
 */
function labelChild(children) {
  const first = children[0];
  return first && first.type === "paragraph" && first.data?.directiveLabel
    ? first
    : undefined;
}

/**
 * codeFilename が生成した .code-block ラッパならファイル情報を取り出す。
 * 形状（div.code-block > [span.code-filename > text, code]）は code-filename.mjs の
 * wrapper リテラルを正とする（あちらの構造を変えたら本判定も同時に直す）。
 * @param {LooseNode} child
 * @returns {{ filename: string, code: LooseNode } | undefined}
 */
function fileEntryOf(child) {
  if (child.type !== "paragraph" || child.data?.hName !== "div")
    return undefined;
  if (child.data?.hProperties?.class !== "code-block") return undefined;
  const [span, code] = child.children ?? [];
  const nameText = span?.children?.[0];
  if (!code || code.type !== "code") return undefined;
  if (!nameText || nameText.type !== "text" || !nameText.value)
    return undefined;
  return { filename: nameText.value, code };
}

/**
 * ファイル名をid（ページ内アンカー）に使える形へ正規化する。
 * 素の `src/main.rs` をidにするとURLフラグメント・CSSセレクタでエスケープが要るため避ける。
 * @param {string} filename
 * @returns {string}
 */
const slugOf = (filename) =>
  filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * ページ内で未使用のidを確定する（`src/main.rs` と `src/main-rs` のようなslug衝突時は連番を付ける）。
 * @param {string} base
 * @param {Set<string>} usedIds
 * @returns {string}
 */
function uniqueId(base, usedIds) {
  let id = base;
  for (let n = 2; usedIds.has(id); n += 1) id = `${base}-${n}`;
  usedIds.add(id);
  return id;
}

/**
 * ファイル名をコードポイント順で比較する（project-gist.mjs の byName と同根拠。
 * JSの `<` はUTF-16コードユニット順のためBuffer比較で厳密に取る）。
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
const byCodepoint = (a, b) =>
  Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));

/**
 * ヘッダー行（eyebrow / タイトル / ファイル数 / Playgroundボタン）を作る
 * （playground-project R-2、ui-design-spec「:::project」）。
 * @param {LooseNode | undefined} label
 * @param {number} fileCount
 * @param {string} gistId
 * @returns {LooseNode}
 */
function buildHeader(label, fileCount, gistId) {
  /** @type {LooseNode[]} */
  const children = [
    {
      type: "paragraph",
      // eyebrowはmarkup側のリテラルテキスト（messageのCSS ::before 方式とは異なる。
      // PG1-4のCSSで `//` を二重付与しないこと）
      data: { hName: "p", hProperties: { class: "code-project-eyebrow" } },
      children: [{ type: "text", value: "// project" }],
    },
  ];
  if (label) {
    // labelの元ハンドルは本文から除外済み。ハンドルの移動+relabelはdropされる
    // （directives.md 落とし穴5）ため、cloneのchildrenを新規タイトル要素へ入れる。
    children.push({
      type: "paragraph",
      data: { hName: "p", hProperties: { class: "code-project-title" } },
      children: structuredClone(label).children ?? [],
    });
  }
  children.push({
    type: "paragraph",
    data: { hName: "p", hProperties: { class: "code-project-count" } },
    children: [
      {
        type: "text",
        value: `${fileCount} ${fileCount === 1 ? "file" : "files"}`,
      },
    ],
  });
  children.push({
    type: "paragraph",
    data: {
      hName: "a",
      hProperties: {
        class: "playground-open",
        // Gist IDから複数ファイルモードのPlayground URLをビルド時に静的生成する（R-2）
        href: PLAYGROUND_GIST_URL + gistId,
        target: "_blank",
        rel: "noopener noreferrer",
      },
    },
    children: [
      { type: "text", value: "Playgroundで開く" },
      // 新規タブを示す矢印アイコン（lucide arrow-up-right。ui-design-spec「:::project」）
      {
        type: "paragraph",
        data: {
          hName: "svg",
          hProperties: {
            viewBox: "0 0 24 24",
            width: "11",
            height: "11",
            fill: "none",
            stroke: "currentColor",
            "stroke-width": "2.5",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "aria-hidden": "true",
          },
        },
        children: [
          {
            type: "paragraph",
            data: { hName: "path", hProperties: { d: "M7 17 17 7" } },
            children: [],
          },
          {
            type: "paragraph",
            data: { hName: "path", hProperties: { d: "M7 7h10v10" } },
            children: [],
          },
        ],
      },
    ],
  });
  return {
    type: "paragraph",
    data: { hName: "div", hProperties: { class: "code-project-header" } },
    children,
  };
}

/**
 * ファイル一覧からbox-drawingのファイルツリー（.code-project-tree）を作る（playground-project R-3）。
 * 各行は .tree-row のdivにする。text("\n") で改行すると後段の softBreaks が <br> 化し
 * 出力が登録順に依存してしまうため、行を要素として分ける（枝記号内の連続空白の保持は
 * PG1-4 の white-space: pre が担う）。ルート行（.）は出力しない。
 * @param {readonly { name: string, id: string }[]} files
 * @returns {LooseNode}
 */
function buildTree(files) {
  /** @type {TreeDir} */
  const root = { dirs: new Map(), files: [] };
  for (const file of files) {
    const parts = file.name.split("/");
    let current = root;
    for (const part of parts.slice(0, -1)) {
      const next = current.dirs.get(part) ?? { dirs: new Map(), files: [] };
      current.dirs.set(part, next);
      current = next;
    }
    current.files.push({ name: parts[parts.length - 1], id: file.id });
  }
  /** @type {LooseNode[]} */
  const rows = [];
  renderDir(root, "", rows);
  return {
    type: "paragraph",
    data: { hName: "div", hProperties: { class: "code-project-tree" } },
    children: rows,
  };
}

/**
 * 1階層ぶんのツリー行を out へ追記する。各階層はディレクトリ優先 + 名前昇順（ui-design-spec）。
 * @param {TreeDir} dir
 * @param {string} prefix 祖先階層ぶんの罫線（"│   " / "    " の連なり）
 * @param {LooseNode[]} out
 * @returns {void}
 */
function renderDir(dir, prefix, out) {
  /** @type {{ name: string, child?: TreeDir, id?: string }[]} */
  const entries = [
    ...[...dir.dirs.keys()]
      .sort(byCodepoint)
      .map((name) => ({ name, child: dir.dirs.get(name) })),
    ...[...dir.files].sort((a, b) => byCodepoint(a.name, b.name)),
  ];
  entries.forEach((entry, index) => {
    const last = index === entries.length - 1;
    out.push({
      type: "paragraph",
      data: { hName: "div", hProperties: { class: "tree-row" } },
      children: [
        {
          type: "paragraph",
          // 枝記号は装飾（色・選択不可はPG1-4のCSSで担う）のため読み上げ対象から外す
          data: {
            hName: "span",
            hProperties: { class: "tree-branch", "aria-hidden": "true" },
          },
          children: [
            { type: "text", value: prefix + (last ? "└── " : "├── ") },
          ],
        },
        entry.child
          ? {
              // ディレクトリは非リンク・`/` 接尾（ui-design-spec）
              type: "paragraph",
              data: { hName: "span", hProperties: { class: "tree-dir" } },
              children: [{ type: "text", value: `${entry.name}/` }],
            }
          : {
              // ファイルは対応コードブロックへのページ内アンカー（R-3。
              // externalLinksはhttp(s)のみ・linkCardは「テキスト===URL」不成立のため非干渉）
              type: "link",
              url: `#${entry.id}`,
              children: [{ type: "text", value: entry.name }],
            },
      ],
    });
    if (entry.child)
      renderDir(entry.child, prefix + (last ? "    " : "│   "), out);
  });
}

/**
 * :::project 変換プラグインのファクトリ。
 * gistMapはconfig評価時に readGistMap で読んで注入する（wikilink(dictIndex) と同型。
 * テストからはインラインのマッピングを渡す）。文書ごとの連番・使用済みid集合を持つため、
 * 返り値はさらにファクトリ形式にする（satteri-plugin-api.md「文書ごとの状態はファクトリ形式」）。
 * @param {GistMap} gistMap
 * @returns {() => ReturnType<typeof defineMdastPlugin>}
 */
export function project(gistMap) {
  return () => {
    let ordinal = 0; // ページ内の :::project 連番（idの名前空間）
    /** @type {Set<string>} */
    const usedIds = new Set(); // ページ内のid一意性（playground-project AC-2）

    return defineMdastPlugin({
      name: "project",
      containerDirective(node, ctx) {
        // 他の名前は後段の directives が処理する（未知名throwもあちらの責務）
        if (node.name !== "project") return;
        ordinal += 1;

        // satteriのノード別型はLooseNodeと構造互換でない（nameのnull許容等）ため橋渡しする
        const directive = /** @type {LooseNode} */ (
          /** @type {unknown} */ (node)
        );
        const children = directive.children ?? [];
        const label = labelChild(children);
        /** @type {(ProjectFile & { id: string })[]} */
        const files = [];
        /** @type {LooseNode[]} */
        const body = [];

        for (const child of children) {
          if (child === label) continue;
          if (child.type === "code") {
            // codeFilename 変換後も生codeで残っている = ファイル名記法なし（playground-project R-7a）
            throw new Error(
              ":::project 内のコードブロックにファイル名がありません（```rust:src/main.rs のように書く）" +
                ` (${posOf(child, ctx)})`,
            );
          }
          const entry = fileEntryOf(child);
          if (!entry) {
            // 解説文・ネストディレクティブ等は通常どおり本文へ（playground-project R-1）
            body.push(child);
            continue;
          }
          const { filename, code } = entry;
          if (
            typeof code.meta === "string" &&
            code.meta.split(/\s+/).includes("playground")
          ) {
            // (d) playgroundメタ併用
            throw new Error(
              `:::project 内のコードブロック ${filename} に playground メタは付けられません（ボタンはプロジェクト全体に付く） (${posOf(child, ctx)})`,
            );
          }
          if (files.some((file) => file.name === filename)) {
            // (c) ファイル名重複
            throw new Error(
              `:::project 内でファイル名 ${filename} が重複しています (${posOf(child, ctx)})`,
            );
          }
          const id = uniqueId(
            `project-${ordinal}-${slugOf(filename)}`,
            usedIds,
          );
          files.push({ name: filename, code: code.value ?? "", id });
          // idの付与はsetPropertyでなくラッパの再構築で行う（前段プラグインが生成した
          // ノードのarena登録は保証されないため。satteri-plugin-api.md）。内側の
          // ファイル名span・codeノードはハンドルのまま新リテラルのchildrenへ渡す。
          body.push({
            type: "paragraph",
            data: { hName: "div", hProperties: { class: "code-block", id } },
            children: [...(child.children ?? [])],
          });
        }

        if (
          !files.some(
            (file) => file.name === "src/main.rs" || file.name === "src/lib.rs",
          )
        ) {
          // (b) エントリポイントなし
          throw new Error(
            `:::project に src/main.rs も src/lib.rs もありません（Playgroundで実行できません） (${posOf(directive, ctx)})`,
          );
        }

        // ハッシュ計算は同期スクリプトと同一の共有実装を使う（playground-project R-12）
        const hash = projectHash(
          files.map(({ name, code }) => ({ name, code })),
        );
        const known = gistMap[hash];
        if (!known) {
          // (e) マッピング未登録（playground-project R-7e / AC-7）
          throw new Error(
            `:::project がGistマッピングに未登録です（npm run sync:playground を実行して playground-gists.json をコミットする。hash=${hash}） (${posOf(directive, ctx)})`,
          );
        }

        // containerDirective型のままだと脚注参照の収集パスが中を走査しないため、
        // 外側・本文ラッパとも blockquote 型 + data.hName で置換する（directives.mjs と同方式）
        const replacement = {
          type: "blockquote",
          data: { hName: "div", hProperties: { class: "code-project" } },
          children: [
            buildHeader(label, files.length, known.id),
            buildTree(files),
            {
              type: "blockquote",
              data: {
                hName: "div",
                hProperties: { class: "code-project-body" },
              },
              children: body,
            },
          ],
        };
        ctx.replaceNode(
          node,
          /** @type {import('satteri').MdastContent} */ (
            /** @type {unknown} */ (replacement)
          ),
        );
      },
    });
  };
}
