import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type {
  AgeProjection,
  Asset,
  AssetCategory,
  AutoBudget,
  BalanceComparison,
  BalanceSheet,
  BalanceSummary,
  BudgetSummary,
  CashflowDirection,
  CashflowFrequency,
  CashflowItem,
  Expense,
  ExpensePayload,
  Liability,
  LiabilityCategory,
  Snapshot,
  User,
} from '../types';

export interface CashflowItemPayload {
  name: string;
  direction: CashflowDirection;
  frequency: CashflowFrequency;
  category?: string | null;
  vendor?: string | null;
  monthly_amount?: number;
  annual_amount?: number;
  start_age?: number | null;
  end_age?: number | null;
  note?: string | null;
  url?: string | null;
}

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost/api';

async function getHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message ?? 'エラーが発生しました。') as Error & {
      errors?: Record<string, string[]>;
    };
    err.errors = data.errors;
    throw err;
  }
  return data as T;
}

// ─── 認証 ────────────────────────────────────────────
export const authApi = {
  register: (name: string, email: string, password: string, password_confirmation: string) =>
    request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, password_confirmation }),
    }),

  login: (email: string, password: string) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me:     () => request<User>('/auth/me'),
};

// ─── 資産 ────────────────────────────────────────────
export const assetApi = {
  list: () => request<{ data: Asset[] }>('/assets'),
  create: (payload: { name: string; category: AssetCategory; amount: number; note?: string }) =>
    request<{ data: Asset }>('/assets', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<{ name: string; category: AssetCategory; amount: number; note: string }>) =>
    request<{ data: Asset }>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete:  (id: number) => request<void>(`/assets/${id}`, { method: 'DELETE' }),
  reorder: (ids: number[]) =>
    request<{ updated: number }>('/assets/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
};

// ─── 負債 ────────────────────────────────────────────
export const liabilityApi = {
  list: () => request<{ data: Liability[] }>('/liabilities'),
  create: (payload: { name: string; category: LiabilityCategory; amount: number; note?: string }) =>
    request<{ data: Liability }>('/liabilities', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<{ name: string; category: LiabilityCategory; amount: number; note: string }>) =>
    request<{ data: Liability }>(`/liabilities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete:  (id: number) => request<void>(`/liabilities/${id}`, { method: 'DELETE' }),
  reorder: (ids: number[]) =>
    request<{ updated: number }>('/liabilities/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
};

// ─── バランスシート ──────────────────────────────────
export const balanceSheetApi = {
  get:        () => request<BalanceSheet>('/balance-sheet'),
  summary:    () => request<BalanceSummary>('/balance-sheet/summary'),
  comparison: () => request<BalanceComparison>('/balance-sheet/comparison'),
};

// ─── スナップショット ────────────────────────────────
export const snapshotApi = {
  list: (months = 12) => request<Snapshot[]>(`/snapshots?months=${months}`),
  save: () => request<Snapshot>('/snapshots', { method: 'POST' }),
};

// ─── キャッシュフロー項目（ライフプラン） ────────────
export const cashflowApi = {
  list:   () => request<{ data: CashflowItem[] }>('/cashflow-items'),
  create: (payload: CashflowItemPayload) =>
    request<CashflowItem>('/cashflow-items', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<CashflowItemPayload>) =>
    request<CashflowItem>(`/cashflow-items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete:  (id: number) => request<void>(`/cashflow-items/${id}`, { method: 'DELETE' }),
  reorder: (ids: number[]) =>
    request<{ updated: number }>('/cashflow-items/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
};

// ─── 予算サマリー / 年齢推移 / 自動予算 ─────────────
export const budgetApi = {
  summary:    () => request<BudgetSummary>('/budget/summary'),
  projection: (from = 23, to = 99) => request<AgeProjection>(`/budget/projection?from=${from}&to=${to}`),
  auto:       () => request<AutoBudget>('/budget/auto'),
};

// ─── 実績（家計簿）─────────────────────────────────
export const expenseApi = {
  list: (params: { from?: string; to?: string; category?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.from)     qs.set('from', params.from);
    if (params.to)       qs.set('to', params.to);
    if (params.category) qs.set('category', params.category);
    const q = qs.toString();
    return request<{ data: Expense[] }>(`/expenses${q ? `?${q}` : ''}`);
  },
  create: (payload: ExpensePayload) =>
    request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: Partial<ExpensePayload>) =>
    request<Expense>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: number) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),
};

// ─── CSV エクスポート（共有経由）─────────────────────
async function shareCsv(path: string, filename: string): Promise<void> {
  const token = await AsyncStorage.getItem('token');
  const fileUri = (FileSystem.cacheDirectory ?? '') + filename;
  const dl = await FileSystem.downloadAsync(`${BASE_URL}${path}`, fileUri, {
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('この端末では共有機能が利用できません。');
  }
  await Sharing.shareAsync(dl.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });
}

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

export const exportApi = {
  assets:        () => shareCsv('/assets/export',         `assets-${stamp()}.csv`),
  liabilities:   () => shareCsv('/liabilities/export',    `liabilities-${stamp()}.csv`),
  cashflowItems: () => shareCsv('/cashflow-items/export', `cashflow-${stamp()}.csv`),
};
