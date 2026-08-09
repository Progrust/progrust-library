// @ts-check
// Shikiのコード記法コメント（[!code ++] / [!code --] など）を取り除くユーティリティ。
// 表示用のコードにはマーカーが必要だが、「そのまま動くコード」として扱う経路
// （Playgroundリンクのhref / rustcによるコンパイル検証）では邪魔になるため共有する。
// spec: docs/spec/pages.md R-25 / docs/markdown-notation/dict-style.md「コード例の規則」
// 利用側: plugins/playground-link.mjs、scripts/check-dict-code.mjs

// `[!code word:foo]` のように値部分に : を含む記法もあるため ] 以外の任意文字を許す。
const NOTATION = /\[!code\s+[^\]\n]*\]/g;
// 削除行マーカー（[!code --] / 範囲指定の [!code --:3]）
const REMOVE_MARKER = /\[!code\s+--(:\d+)?\]/;

/**
 * コードからShikiのコード記法コメントを取り除き、そのまま実行・コンパイルできる形にする。
 * - `[!code --]` が付いた行は行ごと除去する
 * - それ以外のマーカーはマーカー部分のみ除去し、コメントが空になれば行末の `//` ごと落とす
 * - マーカーだけのコメント行は行ごと除去する
 * @param {string} code コードブロックの原文
 * @returns {string} マーカーを取り除いたコード
 */
export const stripCodeNotation = (code) =>
  code
    .split("\n")
    .map((line) => {
      if (!line.includes("[!code")) return line;
      if (REMOVE_MARKER.test(line)) return null; // 削除行は行ごと落とす
      // マーカーを外し、コメントが空になったら行末の // ごと落とす（$ 固定のため
      // 文字列リテラル中の // には当たらない）。
      const stripped = line
        .replace(NOTATION, "")
        .replace(/\/\/[^\S\n]*$/, "")
        .trimEnd();
      return stripped.trim() === "" ? null : stripped; // マーカーだけのコメント行も落とす
    })
    .filter((line) => line !== null)
    .join("\n");
