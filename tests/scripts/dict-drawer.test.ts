import { describe, it, expect } from "vitest";

import { mapScrollTop } from "../../src/scripts/dict-drawer";

// 辞書ペイン拡大表示のスクロール比率換算（wikilink-ui AC-13 / R-26）の純ロジックを検証する。
// 開閉トリガー・レイアウト切替・実コンテナへの適用は DOM 領域のためビルド + 目視で確認する
// （architecture §10）。
describe("mapScrollTop", () => {
  it("[AC-13] 中間位置は比率換算で先コンテナに写る", () => {
    // 元: 可動域 400px の中間 200px（比率 0.5）→ 先: 可動域 1000px の 500px。
    const from = { scrollTop: 200, scrollHeight: 700, clientHeight: 300 };
    const to = { scrollHeight: 1500, clientHeight: 500 };
    expect(mapScrollTop(from, to)).toBe(500);
  });

  it("[AC-13] 元コンテナにスクロール余地がないときは先頭（0）になる", () => {
    // 内容が収まっている（scrollHeight === clientHeight）と比率が定義できない。
    const from = { scrollTop: 0, scrollHeight: 300, clientHeight: 300 };
    const to = { scrollHeight: 1500, clientHeight: 500 };
    expect(mapScrollTop(from, to)).toBe(0);
  });

  it("[AC-13] 先コンテナにスクロール余地がないときは 0 になる", () => {
    const from = { scrollTop: 200, scrollHeight: 700, clientHeight: 300 };
    const to = { scrollHeight: 400, clientHeight: 500 };
    expect(mapScrollTop(from, to)).toBe(0);
  });

  it("[AC-13] 末尾までスクロールした状態は先コンテナでも末尾に写る", () => {
    const from = { scrollTop: 400, scrollHeight: 700, clientHeight: 300 };
    const to = { scrollHeight: 1500, clientHeight: 500 };
    expect(mapScrollTop(from, to)).toBe(1000);
  });

  it("[AC-13] 可動域を超える scrollTop は比率 1（末尾）にクランプされる", () => {
    // ブラウザ実装によっては慣性スクロール等で scrollTop が可動域を僅かに超える。
    const from = { scrollTop: 410, scrollHeight: 700, clientHeight: 300 };
    const to = { scrollHeight: 1500, clientHeight: 500 };
    expect(mapScrollTop(from, to)).toBe(1000);
  });

  it("[AC-13] 負の scrollTop（バウンス中）は比率 0 にクランプされる", () => {
    const from = { scrollTop: -20, scrollHeight: 700, clientHeight: 300 };
    const to = { scrollHeight: 1500, clientHeight: 500 };
    expect(mapScrollTop(from, to)).toBe(0);
  });
});
