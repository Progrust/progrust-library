import { describe, it, expect } from "vitest";

// P1 のツールチェーン疎通確認用スモークテスト。
// 受入基準（AC）由来のテストは T1-2 以降で追加する（tests/ ミラー配置・[AC-n] 命名は implementation-rules 5章）。
describe("smoke", () => {
  it("vitestが動作する", () => {
    expect(true).toBe(true);
  });
});
