import { useCallback, useEffect, useState } from 'react';
import {
  assetApi,
  balanceSheetApi,
  budgetApi,
  cashflowApi,
  expenseApi,
  liabilityApi,
  snapshotApi,
} from '../api';
import type {
  AgeProjection,
  Asset,
  AutoBudget,
  BalanceComparison,
  BalanceSheet,
  BalanceSummary,
  BudgetSummary,
  CashflowItem,
  Expense,
  Liability,
  Snapshot,
} from '../types';

// ─── 予算サマリー ────────────────────────────────────
export function useBudgetSummary() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await budgetApi.summary());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { budget: summary, loading, error, refetch: fetch };
}

// ─── 年齢別キャッシュフロー推移 ──────────────────────
export function useBudgetProjection(from = 23, to = 99) {
  const [projection, setProjection] = useState<AgeProjection | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProjection(await budgetApi.projection(from, to));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetch(); }, [fetch]);

  return { projection, loading, error, refetch: fetch };
}

// ─── 前月比（B/S 比較）─────────────────────────────
export function useBalanceComparison() {
  const [comparison, setComparison] = useState<BalanceComparison | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setComparison(await balanceSheetApi.comparison());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { comparison, loading, error, refetch: fetch };
}

// ─── 資産 ────────────────────────────────────────────
export function useAssets() {
  const [assets, setAssets]   = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await assetApi.list();
      setAssets(res.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { assets, loading, error, refetch: fetch };
}

// ─── 負債 ────────────────────────────────────────────
export function useLiabilities() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await liabilityApi.list();
      setLiabilities(res.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { liabilities, loading, error, refetch: fetch };
}

// ─── B/S サマリー（ダッシュボード）───────────────────
export function useBalanceSummary() {
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await balanceSheetApi.summary());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, loading, error, refetch: fetch };
}

// ─── B/S 全体 ────────────────────────────────────────
export function useBalanceSheet() {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBalanceSheet(await balanceSheetApi.get());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { balanceSheet, loading, error, refetch: fetch };
}

// ─── キャッシュフロー項目（ライフプラン） ────────────
export function useCashflowItems() {
  const [items, setItems]     = useState<CashflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cashflowApi.list();
      setItems(res.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, error, refetch: fetch };
}

// ─── 実績（家計簿） ─────────────────────────────────
export function useExpenses(params: { from?: string; to?: string; category?: string } = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await expenseApi.list(params);
      setExpenses(res.data ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [params.from, params.to, params.category]);

  useEffect(() => { fetch(); }, [fetch]);

  return { expenses, loading, error, refetch: fetch };
}

// ─── 自動予算（実績ベース） ─────────────────────────
export function useAutoBudget() {
  const [autoBudget, setAutoBudget] = useState<AutoBudget | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAutoBudget(await budgetApi.auto());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { autoBudget, loading, error, refetch: fetch };
}

// ─── スナップショット（推移グラフ） ──────────────────
export function useSnapshots(months = 12) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await snapshotApi.list(months);
      setSnapshots(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { fetch(); }, [fetch]);

  return { snapshots, loading, error, refetch: fetch };
}
