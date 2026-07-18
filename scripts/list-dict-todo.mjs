// 作成予定の辞書エントリ（TODO予約）の一覧を表示するスクリプト。
// 使い方: node scripts/list-dict-todo.mjs
// content/ 配下の全mdから `<!-- TODO: [[slug]] ... -->` コメントを集計し、
// slugごとに参照箇所をまとめて表示する。予約slugと同名のエントリが既に
// content/dict/ に存在する場合は「リンク化漏れ」として警告する。
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import process from "node:process";

const CONTENT_DIR = "content";
const DICT_DIR = "content/dict";
const TODO_PATTERN = /TODO:\s*\[\[([^\]]+)\]\]/g;

/** content/ 配下の全mdファイルを列挙する */
const listMarkdownFiles = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(dir, name));

/** 既存の辞書slug一覧（ファイル名から拡張子を除いたもの） */
const listExistingSlugs = () =>
  new Set(listMarkdownFiles(DICT_DIR).map((path) => basename(path, ".md")));

const main = () => {
  const existingSlugs = listExistingSlugs();
  const reservations = new Map(); // slug → [{ file, line }]

  for (const file of listMarkdownFiles(CONTENT_DIR)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((text, index) => {
      for (const match of text.matchAll(TODO_PATTERN)) {
        const slug = match[1];
        if (!reservations.has(slug)) reservations.set(slug, []);
        reservations.get(slug).push({ file, line: index + 1 });
      }
    });
  }

  if (reservations.size === 0) {
    console.log("TODO予約はありません");
    return 0;
  }

  let staleCount = 0;
  for (const slug of [...reservations.keys()].sort()) {
    const refs = reservations.get(slug);
    const stale = existingSlugs.has(slug);
    if (stale) staleCount++;
    const status = stale ? " ⚠ 作成済み（TODOが未解消。リンク化漏れ）" : "";
    console.log(`[[${slug}]] （${refs.length}箇所）${status}`);
    for (const ref of refs) {
      console.log(`  ${ref.file}:${ref.line}`);
    }
  }

  console.log(
    `\n未作成slug ${reservations.size - staleCount}件 / リンク化漏れ ${staleCount}件`,
  );
  return 0;
};

process.exitCode = main();
