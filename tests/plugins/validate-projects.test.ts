// 対象spec: docs/spec/playground-project.md（R-7 / AC-6・AC-7 のビルドエラー化）
// コレクション経由のvisitor throwはビルドを失敗させないため、config評価時の検証パスが
// 実ビルドでのエラー化を担う（plugins/validate-projects.mjs）。
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, it, expect } from "vitest";

import { projectHash } from "../../plugins/project-gist.mjs";
import { validateProjects } from "../../plugins/validate-projects.mjs";

const VALID_PROJECT = [
  "---",
  "title: サンプル",
  "---",
  "",
  ":::project",
  "```rust:src/main.rs",
  "fn main() {}",
  "```",
  ":::",
  "",
].join("\n");

const VALID_MAP = {
  [projectHash([{ name: "src/main.rs", code: "fn main() {}" }])]: {
    id: "abc123",
    url: "https://gist.github.com/rust-play/abc123",
  },
};

describe("validate-projects（:::project のconfig評価時検証・playground-project spec）", () => {
  let contentDir: string;

  beforeEach(() => {
    contentDir = mkdtempSync(join(tmpdir(), "validate-projects-"));
  });

  afterEach(() => {
    rmSync(contentDir, { recursive: true, force: true });
  });

  it("[AC-6] R-7違反のmdがあるとthrowし、メッセージに対象ファイルのパスを含む", () => {
    // サブディレクトリ走査の確認を兼ねる（content/articles/ 相当）
    mkdirSync(join(contentDir, "articles"));
    const badPath = join(contentDir, "articles", "bad.md");
    writeFileSync(
      badPath,
      "---\ntitle: 不正\n---\n\n:::project\n```rust\nfn main() {}\n```\n:::\n",
    );

    const call = () => validateProjects({}, pathToFileURL(contentDir));
    expect(call).toThrow(/ファイル名がありません/);
    expect(call).toThrow(/bad\.md/);
  });

  it("[AC-7] マッピング未登録の:::projectがあるとthrowし、同期スクリプトの案内を含む", () => {
    writeFileSync(join(contentDir, "unregistered.md"), VALID_PROJECT);

    const call = () => validateProjects({}, pathToFileURL(contentDir));
    expect(call).toThrow(/npm run sync:playground/);
  });

  it("登録済みの:::projectだけならthrowしない", () => {
    writeFileSync(join(contentDir, "good.md"), VALID_PROJECT);

    expect(() =>
      validateProjects(VALID_MAP, pathToFileURL(contentDir)),
    ).not.toThrow();
  });

  it(":::projectを含まないmdはコンパイル対象外（未知ディレクティブ等の検証へ範囲を広げない）", () => {
    // :::unknown は directives 登録時ならthrowする内容だが、本検証パスの対象外なので素通りする
    writeFileSync(
      join(contentDir, "other.md"),
      "---\ntitle: 対象外\n---\n\n:::unknown\n本文。\n:::\n",
    );

    expect(() => validateProjects({}, pathToFileURL(contentDir))).not.toThrow();
  });
});
