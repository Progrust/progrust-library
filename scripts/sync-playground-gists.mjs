// @ts-check
// :::project（Playgroundプロジェクト連携）のGistマッピングを同期するスクリプト。
// 使い方: node scripts/sync-playground-gists.mjs [対象mdファイル...] [--verify]
//   引数省略時は content/ 配下の全mdファイルを対象にする。
//   --verify はGistを作らず、マッピング内の全エントリの生存確認だけを行う。
// spec: docs/spec/playground-project.md R-8〜R-12（出力形式は R-11 = check-dict-code.mjs 準拠）
//
// マッピングは追記のみで、旧エントリは削除しない（コードをrevertした際に既存Gistを
// 再利用するため。R-9）。ハッシュ計算・Gistペイロード生成はビルド側と共有する
// plugins/project-gist.mjs を使う（乖離するとビルド時検証が壊れるため。R-12）。
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import { markdownToMdast } from "satteri";

import {
  GIST_MAP_PATH,
  projectHash,
  readGistMap,
  toGistFiles,
  writeGistMap,
} from "../plugins/project-gist.mjs";

/** @typedef {import('satteri').MdastNode} MdastNode */
// ContainerDirective型はsatteriのエントリから再エクスポートされていないため、
// mdastの判別可能Unionから type で絞り込んで取り出す。
/** @typedef {Extract<MdastNode, { type: 'containerDirective' }>} ContainerDirective */
/** @typedef {import('../plugins/project-gist.mjs').ProjectFile} ProjectFile */
/** @typedef {{ node: MdastNode, message: string }} ProjectError R-7 (a)〜(d) 違反 */
/** @typedef {(message: string) => void} Logger */

const CONTENT_DIR = "content";
const GIST_API = "https://play.rust-lang.org/meta/gist";

/**
 * 対象mdファイル一覧を決定する（引数指定がなければ content/ 全件）。
 * @param {readonly string[]} args
 * @returns {string[]}
 */
export const resolveTargets = (args) => {
  if (args.length > 0) return [...args];
  return readdirSync(CONTENT_DIR, { recursive: true })
    .map((name) => String(name))
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(CONTENT_DIR, name));
};

/**
 * エラーメッセージ用に「ファイル:行:列」を組み立てる（ビルド側のthrow方式と同じ形式）。
 * @param {string} file
 * @param {MdastNode} node
 * @returns {string}
 */
const posOf = (file, node) =>
  `${file}:${node.position ? `${node.position.start.line}:${node.position.start.column}` : "?:?"}`;

/**
 * mdastツリーから `:::project` のcontainerDirectiveを集める（入れ子のprojectは辿らない）。
 * @param {MdastNode} node
 * @returns {ContainerDirective[]}
 */
const findProjects = (node) => {
  if (node.type === "containerDirective" && node.name === "project") {
    return [node];
  }
  if (!("children" in node)) return [];
  return node.children.flatMap((child) => findProjects(child));
};

/**
 * `:::project` 直下のコードブロックからファイル群を取り出し、R-7 (a)〜(d) を検証する。
 * ネストしたディレクティブ内のコードブロックはプロジェクトのファイルとして扱わない（R-1）。
 * @param {ContainerDirective} directive
 * @returns {{ files: ProjectFile[], errors: ProjectError[] }}
 */
export const readProject = (directive) => {
  /** @type {ProjectFile[]} */
  const files = [];
  /** @type {ProjectError[]} */
  const errors = [];

  for (const child of directive.children) {
    if (child.type !== "code") continue;
    const lang = typeof child.lang === "string" ? child.lang : "";
    const separator = lang.indexOf(":");
    const realLang = separator === -1 ? lang : lang.slice(0, separator);
    const name = separator === -1 ? "" : lang.slice(separator + 1);

    if (!realLang || !name) {
      // (a) ファイル名記法なし
      errors.push({
        node: child,
        message:
          ":::project 内のコードブロックにファイル名がありません（```rust:src/main.rs のように書く）",
      });
      continue;
    }
    if (
      typeof child.meta === "string" &&
      child.meta.split(/\s+/).includes("playground")
    ) {
      // (d) playgroundメタ併用
      errors.push({
        node: child,
        message: `:::project 内のコードブロック ${name} に playground メタは付けられません（ボタンはプロジェクト全体に付く）`,
      });
    }
    if (files.some((file) => file.name === name)) {
      // (c) ファイル名重複
      errors.push({
        node: child,
        message: `:::project 内でファイル名 ${name} が重複しています`,
      });
    }
    files.push({ name, code: child.value });
  }

  if (
    !files.some(
      (file) => file.name === "src/main.rs" || file.name === "src/lib.rs",
    )
  ) {
    // (b) エントリポイントなし
    errors.push({
      node: directive,
      message:
        ":::project に src/main.rs も src/lib.rs もありません（Playgroundで実行できません）",
    });
  }

  return { files, errors };
};

/**
 * Playgroundの内部APIでGistを作成する（R-8）。
 * @param {readonly ProjectFile[]} files
 * @returns {Promise<{ id: string, url: string }>}
 */
const createGist = async (files) => {
  const response = await fetch(GIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: toGistFiles(files) }),
  });
  if (!response.ok) {
    throw new Error(`Gistの作成に失敗しました（HTTP ${response.status}）`);
  }
  const body = /** @type {{ id?: unknown, url?: unknown }} */ (
    await response.json()
  );
  if (typeof body.id !== "string" || body.id === "") {
    throw new Error("Gistの作成レスポンスにidがありません");
  }
  return {
    id: body.id,
    // urlは人間の確認用。レスポンスに無ければPlaygroundと同じ形式で組み立てる。
    url:
      typeof body.url === "string" && body.url !== ""
        ? body.url
        : `https://gist.github.com/rust-play/${body.id}`,
  };
};

/**
 * Gistの生存確認（R-10）。生きていれば null、失敗していれば理由を返す。
 * ※存在しないIDでもPlaygroundは404ではなく500を返すため、非2xxを一律で失敗として扱う。
 * @param {string} id
 * @returns {Promise<string | null>}
 */
const verifyGist = async (id) => {
  try {
    const response = await fetch(`${GIST_API}/${id}`);
    return response.ok ? null : `HTTP ${response.status}`;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

/**
 * マッピング内の全エントリの生存確認を行う（R-10）。
 * @param {import('../plugins/project-gist.mjs').GistMap} map
 * @param {{ log: Logger, logError: Logger }} io
 * @returns {Promise<number>} exit code
 */
const verifyAll = async (map, { log, logError }) => {
  /** @type {{ hash: string, id: string, url: string, reason: string }[]} */
  const failed = [];
  let checked = 0;

  for (const [hash, entry] of Object.entries(map)) {
    const reason = await verifyGist(entry.id);
    checked++;
    if (reason === null) {
      log(`OK   ${hash} (${entry.id})`);
    } else {
      failed.push({ hash, id: entry.id, url: entry.url, reason });
      logError(`NG   ${hash} (${entry.id}) 生存確認に失敗: ${reason}`);
    }
  }

  if (failed.length > 0) {
    logError("失敗一覧:");
    for (const entry of failed) {
      logError(`  ${entry.hash} ${entry.url} (${entry.reason})`);
    }
  }
  log(`確認 ${checked} / 失敗 ${failed.length}`);
  return failed.length === 0 ? 0 : 1;
};

/**
 * `:::project` を走査し、マッピング未登録のものだけGistを作成して追記する（R-8〜R-11）。
 * @param {{ targets?: readonly string[], mapPath?: string, verify?: boolean, log?: Logger, logError?: Logger }} [options]
 * @returns {Promise<number>} exit code（失敗があれば1）
 */
export const syncPlaygroundGists = async (options = {}) => {
  const {
    targets,
    mapPath = GIST_MAP_PATH,
    verify = false,
    log = console.log,
    logError = console.error,
  } = options;

  const map = readGistMap(mapPath);
  if (verify) return verifyAll(map, { log, logError });

  let created = 0;
  let skipped = 0;
  let failures = 0;

  for (const target of targets ?? resolveTargets([])) {
    const tree = markdownToMdast(readFileSync(target, "utf8"), {
      features: { directive: true },
    });
    for (const directive of findProjects(tree)) {
      const location = posOf(target, directive);
      const { files, errors } = readProject(directive);
      if (errors.length > 0) {
        // 内容が欠けたGistを作らないよう、違反プロジェクトはGist作成をスキップする（R-8）
        for (const error of errors) {
          failures++;
          logError(`NG   ${posOf(target, error.node)} ${error.message}`);
        }
        continue;
      }

      const hash = projectHash(files);
      const known = map[hash];
      if (known) {
        skipped++;
        log(`SKIP ${location} (登録済み ${known.id})`);
        continue;
      }
      try {
        const entry = await createGist(files);
        map[hash] = entry;
        created++;
        log(`OK   ${location} (Gist作成 ${entry.id})`);
      } catch (error) {
        failures++;
        logError(
          `NG   ${location} ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  // 追記が無ければファイルに触れない（既存エントリは常に保持する。R-9）
  if (created > 0) writeGistMap(mapPath, map);
  log(`作成 ${created} / skip ${skipped} / 失敗 ${failures}`);
  return failures === 0 ? 0 : 1;
};

/**
 * コマンドライン引数を解釈して同期を実行する。
 * @returns {Promise<number>} exit code
 */
const main = async () => {
  const argv = process.argv.slice(2);
  const unknown = argv.filter(
    (arg) => arg.startsWith("-") && arg !== "--verify",
  );
  if (unknown.length > 0) {
    console.error(`不明なオプション: ${unknown.join(" ")}`);
    return 1;
  }
  const targets = argv.filter((arg) => !arg.startsWith("-"));
  return syncPlaygroundGists({
    targets: targets.length > 0 ? targets : undefined,
    verify: argv.includes("--verify"),
  });
};

if (import.meta.main) process.exitCode = await main();
