import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";

// 型検査は `astro check` が担うため、typescript-eslint は非 type-aware の recommended のみを使う
// （type-checked 版は parserOptions.project 配線が必要で冗長・設定ミスの温床になる）。
export default tseslint.config(
  {
    // lint 対象外。生成物・依存・執筆済みコンテンツを除外する。
    ignores: ["dist/", ".astro/", "node_modules/", "content/"],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  {
    // 自作 Sätteri プラグイン（.mjs）も lint 対象に含める（implementation-rules 1章）。
    files: ["plugins/**/*.mjs"],
  },
);
