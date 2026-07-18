// 辞書エントリで使用中のタグを集計して表示するスクリプト。
// 使い方: node scripts/list-dict-tags.mjs
// content/dict/ 配下の全mdのfrontmatter `tags` を集計し、
// 件数の降順（同数はタグ名の昇順）で使用ファイル数付きに表示する。
// タグの一覧管理はこのスクリプトの出力を正とする（手動の一覧表は持たない）。
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const DICT_DIR = "content/dict";

/** content/dict/ 配下の全mdファイルを列挙する */
const listMarkdownFiles = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(dir, name));

/** frontmatterの `tags: ["a", "b"]` 行からタグ配列を取り出す */
const extractTags = (source) => {
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return [];
  const tagsLine = frontmatter[1].match(/^tags:\s*\[(.*)\]\s*$/m);
  if (!tagsLine) return [];
  return [...tagsLine[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
};

const main = () => {
  const counts = new Map(); // tag → 件数

  for (const file of listMarkdownFiles(DICT_DIR)) {
    for (const tag of extractTags(readFileSync(file, "utf8"))) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    console.log("使用中のタグはありません");
    return 0;
  }

  const sorted = [...counts.entries()].sort(
    ([tagA, countA], [tagB, countB]) =>
      countB - countA || tagA.localeCompare(tagB, "ja"),
  );
  const width = Math.max(...sorted.map(([tag]) => tag.length));
  for (const [tag, count] of sorted) {
    console.log(`${tag.padEnd(width, "　")} ${count}件`);
  }

  console.log(`\n全${counts.size}タグ`);
  return 0;
};

process.exitCode = main();
