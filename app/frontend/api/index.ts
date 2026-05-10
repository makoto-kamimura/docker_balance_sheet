import type {
  Asset, AssetCategory,
  Liability, LiabilityCategory,
  BalanceSheet, BalanceSummary, BalanceComparison,
  Snapshot, User,
  CashflowItem, CashflowDirection, CashflowFrequency,
  BudgetSummary, AgeProjection,
  Expense, ExpensePayload, AutoBudget,
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

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

// ─── HTTP ヘルパー ───────────────────────────────────
function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message ?? 'エラーが発生しました。') as Error & { errors?: Record<string, string[]> };
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

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<User>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { token: string; email: string; password: string; password_confirmation: string }) =>
    request<{ message: string }>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── 資産 ────────────────────────────────────────────
export const assetApi = {
  list: () =>
    request<{ data: Asset[] }>('/assets'),

  create: (payload: { name: string; category: AssetCategory; amount: number; note?: string }) =>
    request<{ data: Asset }>('/assets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<{ name: string; category: AssetCategory; amount: number; note: string }>) =>
    request<{ data: Asset }>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    request<void>(`/assets/${id}`, { method: 'DELETE' }),

  reorder: (ids: number[]) =>
    request<{ updated: number }>('/assets/reorder', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

// ─── 負債 ────────────────────────────────────────────
export const liabilityApi = {
  list: () =>
    request<{ data: Liability[] }>('/liabilities'),

  create: (payload: { name: string; category: LiabilityCategory; amount: number; note?: string }) =>
    request<{ data: Liability }>('/liabilities', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<{ name: string; category: LiabilityCategory; amount: number; note: string }>) =>
    request<{ data: Liability }>(`/liabilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    request<void>(`/liabilities/${id}`, { method: 'DELETE' }),

  reorder: (ids: number[]) =>
    request<{ updated: number }>('/liabilities/reorder', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

// ─── バランスシート ──────────────────────────────────
export const balanceSheetApi = {
  get: () =>
    request<BalanceSheet>('/balance-sheet'),

  summary: () =>
    request<BalanceSummary>('/balance-sheet/summary'),

  comparison: () =>
    request<BalanceComparison>('/balance-sheet/comparison'),
};

// ─── スナップショット ────────────────────────────────
export const snapshotApi = {
  list: (months = 12) =>
    request<Snapshot[]>(`/snapshots?months=${months}`),

  save: () =>
    request<Snapshot>('/snapshots', { method: 'POST' }),
};

// ─── キャッシュフロー項目（ライフプラン） ────────────
export const cashflowApi = {
  list: () =>
    request<{ data: CashflowItem[] }>('/cashflow-items'),

  create: (payload: CashflowItemPayload) =>
    request<CashflowItem>('/cashflow-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<CashflowItemPayload>) =>
    request<CashflowItem>(`/cashflow-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    request<void>(`/cashflow-items/${id}`, { method: 'DELETE' }),

  reorder: (ids: number[]) =>
    request<{ updated: number }>('/cashflow-items/reorder', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

// ─── 予算サマリー / 年齢推移 / 自動予算 ────────────
export const budgetApi = {
  summary: () =>
    request<BudgetSummary>('/budget/summary'),

  projection: (from = 23, to = 99) =>
    request<AgeProjection>(`/budget/projection?from=${from}&to=${to}`),

  auto: () =>
    request<AutoBudget>('/budget/auto'),
};

// ─── 実績（家計簿）──────────────────────────────────
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
    request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: Partial<ExpensePayload>) =>
    request<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: number) =>
    request<void>(`/expenses/${id}`, { method: 'DELETE' }),
};

// ─── CSV ダウンロード ────────────────────────────────
async function downloadCsv(path: string, filename: string): Promise<void> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: 'text/csv',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('CSV のダウンロードに失敗しました。');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const exportApi = {
  assets:        () => downloadCsv('/assets/export',         `assets-${stamp()}.csv`),
  liabilities:   () => downloadCsv('/liabilities/export',    `liabilities-${stamp()}.csv`),
  cashflowItems: () => downloadCsv('/cashflow-items/export', `cashflow-${stamp()}.csv`),
  balanceSheetPdf: () =>
    downloadBlob('/balance-sheet/export', `balance-sheet-${stamp()}.pdf`, 'application/pdf'),
};

async function downloadBlob(path: string, filename: string, accept: string): Promise<void> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: accept,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('ダウンロードに失敗しました。');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
