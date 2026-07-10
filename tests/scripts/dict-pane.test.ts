import { describe, it, expect } from "vitest";

import {
  createHistory,
  pushEntry,
  goBack,
  goForward,
  canGoBack,
  canGoForward,
  currentSlug,
} from "../../src/scripts/dict-pane";

// サイドペインの進む/戻る・ページ遷移でのリセット（wikilink-ui AC-5 / R-13）の
// 純ロジックを検証する。DOM 配線・fetch はビルド + 目視で確認する（architecture §10）。
describe("dict-pane 履歴", () => {
  it("[AC-5] 初期状態はデフォルト（未選択・戻る/進む不可）", () => {
    const history = createHistory();
    expect(currentSlug(history)).toBeNull();
    expect(canGoBack(history)).toBe(false);
    expect(canGoForward(history)).toBe(false);
  });

  it("[AC-5] A→B と開いた後、戻るで A・進むで B に往復できる", () => {
    let history = pushEntry(createHistory(), "a");
    history = pushEntry(history, "b");
    expect(currentSlug(history)).toBe("b");

    history = goBack(history);
    expect(currentSlug(history)).toBe("a");
    expect(canGoBack(history)).toBe(false);
    expect(canGoForward(history)).toBe(true);

    history = goForward(history);
    expect(currentSlug(history)).toBe("b");
    expect(canGoForward(history)).toBe(false);
  });

  it("[AC-5] 先頭では戻れず、末尾では進めない（境界で無変更）", () => {
    const history = pushEntry(createHistory(), "a");
    expect(canGoBack(history)).toBe(false);
    expect(goBack(history)).toBe(history);
    expect(canGoForward(history)).toBe(false);
    expect(goForward(history)).toBe(history);
  });

  it("[AC-5] 戻った位置から別の辞書を開くと前方履歴が切り捨てられる", () => {
    let history = pushEntry(createHistory(), "a");
    history = pushEntry(history, "b");
    history = goBack(history); // A に戻る（前方に B が残る）
    history = pushEntry(history, "c"); // 分岐 → B を捨てて C を積む

    expect(history).toMatchObject({ entries: ["a", "c"], cursor: 1 });
    expect(canGoForward(history)).toBe(false);
  });

  it("[AC-5] 表示中と同一 slug の再オープンは履歴を伸ばさない", () => {
    let history = pushEntry(createHistory(), "a");
    history = pushEntry(history, "a");
    expect(history).toMatchObject({ entries: ["a"], cursor: 0 });
  });

  it("[AC-5] ページ遷移相当（新規 createHistory）でデフォルトにリセットされる", () => {
    const history = pushEntry(pushEntry(createHistory(), "a"), "b");
    expect(currentSlug(history)).toBe("b");
    // リロード時はモジュール再初期化 = 新しい createHistory() でデフォルトへ。
    const reloaded = createHistory();
    expect(currentSlug(reloaded)).toBeNull();
    expect(reloaded).toMatchObject({ entries: [], cursor: -1 });
  });
});
