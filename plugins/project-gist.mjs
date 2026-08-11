// @ts-check
// :::project（Playgroundプロジェクト連携）のハッシュ計算・Gistペイロード生成・
// マッピングファイル入出力を担う共有関数（プラグインではない）。
// ビルド側の :::project 変換と scripts/sync-playground-gists.mjs の双方から使う。
// ハッシュ計算が両者で乖離するとビルド時検証（未登録エラー）が壊れるため一元化する。
// spec: docs/spec/playground-project.md §3 / R-4 / R-8 / R-12
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { stripCodeNotation } from "./code-notation.mjs";

/** @typedef {{ name: string, code: string }} ProjectFile プロジェクト内の1ファイル（コードは原文） */
/** @typedef {{ name: string, content: string }} GistFile Gist APIへ送る1ファイル（コードはマーカー除去済み） */
/** @typedef {Record<string, { id: string, url: string }>} GistMap ハッシュ → Gist情報のマッピング */

/** マッピングファイルのリポジトリルートからの相対パス（spec §3） */
export const GIST_MAP_PATH = "playground-gists.json";

/**
 * ファイル名をコードポイント順で比較する。
 * JSの `<` はUTF-16コードユニット順のためサロゲートペアで順序が入れ替わりうる。
 * UTF-8バイト列の辞書順はコードポイント順と一致するため Buffer 比較で厳密に取る。
 * @param {ProjectFile} a
 * @param {ProjectFile} b
 * @returns {number}
 */
const byName = (a, b) =>
  Buffer.compare(Buffer.from(a.name, "utf8"), Buffer.from(b.name, "utf8"));

/**
 * プロジェクトのファイル群を Gist API のペイロード形式（ファイル名昇順・マーカー除去済み）へ変換する。
 * 表示用のコードにはマーカーが必要なため、除去はこの経路（Gist送信・ハッシュ計算）だけで行う。
 * @param {readonly ProjectFile[]} files
 * @returns {GistFile[]}
 */
export const toGistFiles = (files) =>
  [...files].sort(byName).map((file) => ({
    name: file.name,
    content: stripCodeNotation(file.code),
  }));

/**
 * プロジェクトのハッシュ（spec §3）を計算する。
 * `[ファイル名, マーカー除去後コード]` の組をファイル名昇順に並べた配列を JSON.stringify し、
 * そのUTF-8バイト列のSHA-256を16進小文字で返す。
 * @param {readonly ProjectFile[]} files
 * @returns {string}
 */
export const projectHash = (files) =>
  createHash("sha256")
    .update(
      JSON.stringify(
        toGistFiles(files).map((file) => [file.name, file.content]),
      ),
      "utf8",
    )
    .digest("hex");

/**
 * マッピングファイルを読む。未作成（初回実行時）は空マッピングを返す。
 * @param {string} path
 * @returns {GistMap}
 */
export const readGistMap = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === "ENOENT")
      return {};
    throw error;
  }
};

/**
 * マッピングファイルを書く。
 * このファイルは `prettier --check .` の対象（ルートのJSON）のため、
 * Prettier既定のJSON整形（2スペースインデント + 末尾改行）に一致させる。
 * @param {string} path
 * @param {GistMap} map
 * @returns {void}
 */
export const writeGistMap = (path, map) => {
  writeFileSync(path, `${JSON.stringify(map, null, 2)}\n`);
};
