import { describe, it, expect } from "vitest";

import {
  computeCardVisibility,
  type CardModel,
} from "../../src/scripts/list-filter";

// 一覧絞込の可視判定純関数（search.md AC-7・R-9〜R-10）を検証する。
// タグチップ選択（AND）+ キーワード部分一致の組み合わせを最小フィクスチャで確認する。
// DOM 配線（カード表示/非表示・件数/0件更新）は architecture §10 によりビルド + 目視確認。

// 所有権はタグ2つ（両方持ち）、借用は片方のみ、error-handling は概要にキーワードを持つ。
const cards: CardModel[] = [
  {
    title: "所有権",
    description: "Rustのメモリ管理の中核概念。",
    tags: ["Rust基礎", "所有権"],
  },
  {
    title: "借用",
    description: "所有権を移動せずに値を参照する仕組み。",
    tags: ["Rust基礎"],
  },
  {
    title: "Rustのエラー処理",
    description: "Result型による回復可能なエラー。",
    tags: ["Rust"],
  },
];

describe("computeCardVisibility", () => {
  it("[AC-7] タグを2つ選択すると両タグを持つカードのみ可視になる", () => {
    // #Rust基礎 かつ #所有権 の AND。両方持つ「所有権」のみ true。
    expect(computeCardVisibility(cards, ["Rust基礎", "所有権"], "")).toEqual([
      true,
      false,
      false,
    ]);
  });

  it("[AC-7] 片方のタグのみを選択したときは AND を満たす複数が可視になる", () => {
    expect(computeCardVisibility(cards, ["Rust基礎"], "")).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("選択タグとキーワードは AND で絞り込む（R-9）", () => {
    // #Rust基礎 のうちキーワード「所有権」を含む（借用は概要に「所有権」）。
    expect(computeCardVisibility(cards, ["Rust基礎"], "所有権")).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("キーワードは title/description/tag 名に部分一致・大小非区別（R-4）", () => {
    // 「rust」小文字がタグ名/タイトルに部分一致する全カードが可視。
    expect(computeCardVisibility(cards, [], "rust")).toEqual([
      true,
      true,
      true,
    ]);
    // 概要のみに現れる語でもヒットする。
    expect(computeCardVisibility(cards, [], "Result")).toEqual([
      false,
      false,
      true,
    ]);
  });

  it("空条件は全件可視で入力順を保持する", () => {
    expect(computeCardVisibility(cards, [], "")).toEqual([true, true, true]);
  });

  it("キーワード欄の `#タグ` も選択タグと和集合でタグ条件になる", () => {
    expect(computeCardVisibility(cards, ["Rust基礎"], "#所有権")).toEqual([
      true,
      false,
      false,
    ]);
  });
});
