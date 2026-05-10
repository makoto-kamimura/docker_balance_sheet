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

export function useBudgetSummary() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSummary(await budgetApi.summary()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { budget: summary, loading, error, refetch: fetchIt };
}

export function useBudgetProjection(from = 23, to = 99) {
  const [projection, setProjection] = useState<AgeProjection | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { setProjection(await budgetApi.projection(from, to)); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { projection, loading, error, refetch: fetchIt };
}

export function useBalanceComparison() {
  const [comparison, setComparison] = useState<BalanceComparison | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { setComparison(await balanceSheetApi.comparison()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { comparison, loading, error, refetch: fetchIt };
}

export function useAssets() {
  const [assets, setAssets]   = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await assetApi.list(); setAssets(res.data ?? []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { assets, loading, error, refetch: fetchIt };
}

export function useLiabilities() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await liabilityApi.list(); setLiabilities(res.data ?? []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { liabilities, loading, error, refetch: fetchIt };
}

export function useBalanceSummary() {
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { setSummary(await balanceSheetApi.summary()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { summary, loading, error, refetch: fetchIt };
}

export function useBalanceSheet() {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { setBalanceSheet(await balanceSheetApi.get()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { balanceSheet, loading, error, refetch: fetchIt };
}

export function useCashflowItems() {
  const [items, setItems]     = useState<CashflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await cashflowApi.list(); setItems(res.data ?? []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { items, loading, error, refetch: fetchIt };
}

export function useExpenses(params: { from?: string; to?: string; category?: string } = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const { from, to, category } = params;
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await expenseApi.list({ from, to, category }); setExpenses(res.data ?? []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [from, to, category]);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { expenses, loading, error, refetch: fetchIt };
}

export function useAutoBudget() {
  const [autoBudget, setAutoBudget] = useState<AutoBudget | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { setAutoBudget(await budgetApi.auto()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { autoBudget, loading, error, refetch: fetchIt };
}

export function useSnapshots(months = 12) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const fetchIt = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await snapshotApi.list(months); setSnapshots(Array.isArray(res) ? res : []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [months]);
  useEffect(() => { fetchIt(); }, [fetchIt]);
  return { snapshots, loading, error, refetch: fetchIt };
}
