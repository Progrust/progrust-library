// deploy.md AC-3検証用の一時ファイル（意図的に失敗するテスト。検証後にrevertで除去する）
import { describe, expect, it } from 'vitest';

describe('deploy AC-3検証（一時）', () => {
  it('[AC-3] vitest失敗時にデプロイされないことを確認するための意図的な失敗', () => {
    expect(true).toBe(false);
  });
});
