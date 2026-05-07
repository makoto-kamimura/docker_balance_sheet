// ─── 認証 ────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
}

// ─── 資産 ────────────────────────────────────────────
export type AssetCategory = 'current' | 'fixed' | 'investment';

export interface Asset {
  id: number;
  name: string;
  category: AssetCategory;
  amount: number;
  note: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  current:    '流動資産',
  fixed:      '固定資産',
  investment: '投資・その他',
};

// ─── 負債 ────────────────────────────────────────────
export type LiabilityCategory = 'current' | 'longterm';

export interface Liability {
  id: number;
  name: string;
  category: LiabilityCategory;
  amount: number;
  note: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const LIABILITY_CATEGORY_LABELS: Record<LiabilityCategory, string> = {
  current:  '流動負債',
  longterm: '固定負債',
};

// ─── バランスシート ──────────────────────────────────
export interface BalanceSheetSection {
  label: string;
  items: { id: number; name: string; amount: number; note: string | null }[];
  subtotal: number;
}

export interface BalanceSheet {
  assets: {
    current:    BalanceSheetSection;
    fixed:      BalanceSheetSection;
    investment: BalanceSheetSection;
    total: number;
  };
  liabilities: {
    current:  BalanceSheetSection;
    longterm: BalanceSheetSection;
    total: number;
  };
  net_worth: number;
  recorded_at: string;
}

export interface BalanceSummary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  asset_ratio: number;
  recorded_at: string;
}

// ─── スナップショット ────────────────────────────────
export interface Snapshot {
  id: number;
  year_month: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  recorded_at: string;
}

// ─── キャッシュフロー項目（ライフプラン） ────────────
export type CashflowDirection = 'income' | 'expense';
export type CashflowFrequency = 'fixed' | 'variable';

export interface CashflowItem {
  id: number;
  name: string;
  direction: CashflowDirection;
  frequency: CashflowFrequency;
  category: string | null;
  vendor: string | null;
  monthly_amount: number;
  annual_amount: number;
  start_age: number | null;
  end_age: number | null;
  note: string | null;
  url: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export const CASHFLOW_DIRECTION_LABELS: Record<CashflowDirection, string> = {
  income:  '収入',
  expense: '支出',
};

export const CASHFLOW_FREQUENCY_LABELS: Record<CashflowFrequency, string> = {
  fixed:    '固定',
  variable: '変動',
};

// ─── 予算サマリー ────────────────────────────────────
export interface BudgetSummary {
  monthly_income: number;
  monthly_expense: number;
  monthly_net: number;
  annual_income: number;
  annual_expense: number;
  annual_net: number;
  by_category: { category: string; monthly: number; annual: number }[];
}

// ─── 年齢別キャッシュフロー推移 ──────────────────────
export interface AgeProjectionRow {
  age: number;
  income: number;
  expense: number;
  net: number;
  cumulative: number;
}

export interface AgeProjection {
  from: number;
  to: number;
  rows: AgeProjectionRow[];
}

// ─── 前月比（B/S 比較）──────────────────────────────
interface ComparisonSnapshot {
  year_month: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  recorded_at: string | null;
}

interface ComparisonDelta {
  amount: number;
  percent: number | null;
}

export interface BalanceComparison {
  current: ComparisonSnapshot | null;
  previous: ComparisonSnapshot | null;
  change: {
    total_assets: ComparisonDelta;
    total_liabilities: ComparisonDelta;
    net_worth: ComparisonDelta;
  } | null;
}

// ─── 実績（家計簿）──────────────────────────────────
export interface Expense {
  id: number;
  category: string;
  amount: number;
  occurred_at: string;          // YYYY-MM-DD
  note: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ExpensePayload {
  category: string;
  amount: number;
  occurred_at: string;          // YYYY-MM-DD
  note?: string | null;
}

// ─── 自動予算（実績ベース）──────────────────────────
export interface AutoBudgetCategory {
  category: string;
  months_with_data: number;     // 0..6
  monthly_budget: number | null;  // 3 ヶ月以上で解禁
  annual_budget:  number | null;  // 6 ヶ月で解禁
  this_month_actual: number;
  remaining: number | null;       // monthly_budget − this_month_actual
}

export interface AutoBudget {
  as_of: string;                  // YYYY-MM-DD
  by_category: AutoBudgetCategory[];
  totals: {
    monthly_budget: number | null;
    annual_budget:  number | null;
    this_month_actual: number;
    remaining: number | null;
  };
}
