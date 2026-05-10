import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mockSummary = {
  total_assets: 5_000_000,
  total_liabilities: 1_000_000,
  net_worth: 4_000_000,
  asset_ratio: 83.3,
  recorded_at: '2026-05-10T12:00:00Z',
};

vi.mock('../api', () => ({
  balanceSheetApi: {
    summary: vi.fn(),
  },
}));

import { useBalanceSummary } from '../hooks';
import { balanceSheetApi } from '../api';

describe('useBalanceSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('マウント時に summary をフェッチして返す', async () => {
    (balanceSheetApi.summary as any).mockResolvedValueOnce(mockSummary);

    const { result } = renderHook(() => useBalanceSummary());

    expect(result.current.loading).toBe(true);
    expect(result.current.summary).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.summary).toEqual(mockSummary);
    expect(result.current.error).toBeNull();
    expect(balanceSheetApi.summary).toHaveBeenCalledTimes(1);
  });

  it('API がエラーを投げたら error をセットして loading を false にする', async () => {
    (balanceSheetApi.summary as any).mockRejectedValueOnce(new Error('API down'));

    const { result } = renderHook(() => useBalanceSummary());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('API down');
    expect(result.current.summary).toBeNull();
  });

  it('refetch() で再取得できる', async () => {
    (balanceSheetApi.summary as any).mockResolvedValue(mockSummary);

    const { result } = renderHook(() => useBalanceSummary());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(balanceSheetApi.summary).toHaveBeenCalledTimes(1);

    await result.current.refetch();

    expect(balanceSheetApi.summary).toHaveBeenCalledTimes(2);
  });
});
