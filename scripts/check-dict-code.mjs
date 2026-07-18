// 辞書コンテンツ内のRustコードブロックをrustcでコンパイル検証するスクリプト。
// 使い方: node scripts/check-dict-code.mjs [対象mdファイル...]
//   引数省略時は content/dict/ 配下の全mdファイルを対象にする。
// マーカー規約（コードブロック直前行のHTMLコメント。docs/markdown-notation/dict-style.md を正とする）:
//   - マーカーなし                  → コンパイル成功を要求（fn main がなければ自動ラップ）
//   - <!-- rustc: expect E0502 --> → コンパイル失敗かつ指定エラーコードの出力を要求
//   - <!-- rustc: skip -->         → 検証対象外
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

const DICT_DIR = "content/dict";
const MARKER_PATTERN = /^<!--\s*rustc:\s*(?:(skip)|expect\s+(E\d{4}))\s*-->$/;
const FENCE_PATTERN = /^(`{3,})(\S*)(?:\s|$)/;

/** 対象mdファイル一覧を決定する（引数指定がなければ content/dict/ 全件） */
const resolveTargets = (argv) => {
  if (argv.length > 0) return argv;
  return readdirSync(DICT_DIR, { recursive: true })
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(DICT_DIR, name));
};

/**
 * mdテキストからrustコードブロックを抽出する。
 * 戻り値: { line, code, marker } の配列（markerは "skip" | "E0502" 等 | null）
 */
const extractRustBlocks = (markdown) => {
  const lines = markdown.split("\n");
  const blocks = [];
  let fence = null; // 開いているフェンス: { delimiter, lang, startLine, body }
  let lastMarker = null; // 直前の非空行がマーカーだった場合に保持する

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (fence) {
      // フェンス終了判定（開始と同数以上のバッククォートのみの行）
      if (new RegExp(`^\`{${fence.delimiter.length},}\\s*$`).test(line)) {
        if (fence.lang === "rust") {
          blocks.push({
            line: fence.startLine,
            code: fence.body.join("\n"),
            marker: fence.marker,
          });
        }
        fence = null;
      } else {
        fence.body.push(line);
      }
      continue;
    }
    const fenceMatch = line.match(FENCE_PATTERN);
    if (fenceMatch) {
      // 言語は `rust:main.rs` のようなファイル名付き表記からコロン以前を取る
      const lang = fenceMatch[2].split(":")[0];
      fence = {
        delimiter: fenceMatch[1],
        lang,
        startLine: i + 1,
        body: [],
        marker: lastMarker,
      };
      lastMarker = null;
      continue;
    }
    const markerMatch = line.trim().match(MARKER_PATTERN);
    if (markerMatch) {
      lastMarker = markerMatch[1] ?? markerMatch[2];
    } else if (line.trim() !== "") {
      lastMarker = null; // マーカーとフェンスの間に別のテキストが挟まったら無効
    }
  }
  return blocks;
};

/** 1ブロックをrustcでコンパイルし、結果を { ok, detail } で返す */
const compileBlock = (block, workDir, index) => {
  let source = block.code;
  if (!/fn\s+main\s*\(/.test(source)) {
    source = `fn main() {\n${source}\n}\n`;
  }
  const sourcePath = join(workDir, `block-${index}.rs`);
  writeFileSync(sourcePath, source);

  let stderr = "";
  let failed = false;
  try {
    execFileSync(
      "rustc",
      ["--edition", "2024", "--out-dir", workDir, sourcePath],
      {
        stdio: ["ignore", "ignore", "pipe"],
      },
    );
  } catch (error) {
    failed = true;
    stderr = error.stderr?.toString() ?? String(error);
  }

  if (block.marker === null) {
    return failed
      ? { ok: false, detail: `コンパイル失敗（成功を期待）:\n${stderr}` }
      : { ok: true, detail: "コンパイル成功" };
  }
  // expect E**** の場合: 失敗かつ指定エラーコードが出力に含まれること
  if (!failed) {
    return {
      ok: false,
      detail: `コンパイル成功（${block.marker} での失敗を期待）`,
    };
  }
  return stderr.includes(block.marker)
    ? { ok: true, detail: `期待どおり ${block.marker} で失敗` }
    : {
        ok: false,
        detail: `失敗したが ${block.marker} が出力に含まれない:\n${stderr}`,
      };
};

const main = () => {
  const targets = resolveTargets(process.argv.slice(2));
  if (targets.length === 0) {
    console.log("検証対象のmdファイルがありません");
    return 0;
  }

  const workDir = mkdtempSync(join(tmpdir(), "check-dict-code-"));
  let failures = 0;
  let checked = 0;
  let skipped = 0;

  try {
    for (const target of targets) {
      const blocks = extractRustBlocks(readFileSync(target, "utf8"));
      for (const [index, block] of blocks.entries()) {
        const location = `${target}:${block.line}`;
        if (block.marker === "skip") {
          skipped++;
          console.log(`SKIP ${location}`);
          continue;
        }
        const result = compileBlock(block, workDir, `${checked}-${index}`);
        checked++;
        if (result.ok) {
          console.log(`OK   ${location} (${result.detail})`);
        } else {
          failures++;
          console.error(`NG   ${location}\n${result.detail}`);
        }
      }
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }

  console.log(`検証 ${checked} / skip ${skipped} / 失敗 ${failures}`);
  return failures === 0 ? 0 : 1;
};

process.exitCode = main();
