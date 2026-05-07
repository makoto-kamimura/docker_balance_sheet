<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashflowItem;
use App\Models\Expense;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    /**
     * GET /api/budget/summary
     * 認証ユーザーのキャッシュフロー項目から月間/年間収支を集計。
     */
    public function summary(): JsonResponse
    {
        $items = auth()->user()->cashflowItems()->get();

        $sum = static fn ($collection, string $col): float => (float) $collection->sum(
            fn (CashflowItem $i) => (float) $i->{$col},
        );

        $income  = $items->where('direction', 'income');
        $expense = $items->where('direction', 'expense');

        $monthlyIncome  = $sum($income,  'monthly_amount');
        $monthlyExpense = $sum($expense, 'monthly_amount');
        $annualIncome   = $sum($income,  'annual_amount');
        $annualExpense  = $sum($expense, 'annual_amount');

        $byCategory = $expense
            ->groupBy(fn (CashflowItem $i) => $i->category ?? 'uncategorized')
            ->map(fn ($group, $cat) => [
                'category' => $cat,
                'monthly'  => round((float) $group->sum(fn (CashflowItem $i) => (float) $i->monthly_amount), 2),
                'annual'   => round((float) $group->sum(fn (CashflowItem $i) => (float) $i->annual_amount), 2),
            ])
            ->sortByDesc('monthly')
            ->values();

        return response()->json([
            'monthly_income'  => round($monthlyIncome, 2),
            'monthly_expense' => round($monthlyExpense, 2),
            'monthly_net'     => round($monthlyIncome - $monthlyExpense, 2),
            'annual_income'   => round($annualIncome, 2),
            'annual_expense'  => round($annualExpense, 2),
            'annual_net'      => round($annualIncome - $annualExpense, 2),
            'by_category'     => $byCategory,
        ]);
    }

    /**
     * GET /api/budget/projection?from=23&to=99
     * 年齢別の年間収支と累積純資産を返す。
     *
     * ロジック:
     * - 各年齢で start_age <= age <= end_age に該当する項目の annual_amount を合計
     * - start_age が null のものは「ずっと前から続いている」扱い（age 範囲開始から）
     * - end_age が null のものは「継続」扱い（age 範囲終了まで）
     * - cumulative は from から age まで net を累積
     */
    public function projection(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['nullable', 'integer', 'min:0',  'max:120'],
            'to'   => ['nullable', 'integer', 'min:0',  'max:120'],
        ]);
        $from = $data['from'] ?? 23;
        $to   = $data['to']   ?? 99;
        if ($to < $from) {
            return response()->json(['message' => 'to は from 以上を指定してください。'], 422);
        }

        $items = auth()->user()->cashflowItems()->get();

        $rows = [];
        $cumulative = 0.0;
        for ($age = $from; $age <= $to; $age++) {
            $income = 0.0;
            $expense = 0.0;
            foreach ($items as $item) {
                $start = $item->start_age ?? 0;
                $end   = $item->end_age   ?? 999;
                if ($age < $start || $age > $end) {
                    continue;
                }
                if ($item->direction === 'income') {
                    $income += (float) $item->annual_amount;
                } else {
                    $expense += (float) $item->annual_amount;
                }
            }
            $net = $income - $expense;
            $cumulative += $net;
            $rows[] = [
                'age'        => $age,
                'income'     => round($income, 2),
                'expense'    => round($expense, 2),
                'net'        => round($net, 2),
                'cumulative' => round($cumulative, 2),
            ];
        }

        return response()->json([
            'from' => $from,
            'to'   => $to,
            'rows' => $rows,
        ]);
    }

    /**
     * GET /api/budget/auto
     *
     * 実績テーブル `expenses` から自動算出した月予算 / 年予算 / 当月実績 / 残予算を返す。
     *
     * アルゴリズム:
     * - 当月を除く直近 6 ヶ月（YYYY-MM 単位）の月別合計をカテゴリ別に集計
     * - 実績がある月数 m でゲート:
     *   - m < 3                → monthly_budget = null（未解禁）
     *   - 3 ≤ m < 6            → monthly_budget = avg(過去 m ヶ月の合計), annual = null
     *   - m == 6（直近6ヶ月すべて）→ monthly_budget = avg(過去 6 ヶ月), annual_budget = monthly × 12
     * - this_month_actual / remaining も同梱
     */
    public function autoBudget(): JsonResponse
    {
        $user      = auth()->user();
        $today     = CarbonImmutable::now();
        $thisYm    = $today->format('Y-m');
        $startDate = $today->subMonthsNoOverflow(6)->startOfMonth();    // 直近 6 ヶ月の開始
        $endDate   = $today->endOfMonth();                              // 当月末まで

        // 過去 6 ヶ月分 + 当月の実績を一括取得
        $expenses = $user->expenses()
            ->whereBetween('occurred_at', [$startDate->toDateString(), $endDate->toDateString()])
            ->get(['category', 'amount', 'occurred_at']);

        // カテゴリ別 → YYYY-MM → 合計 のマップ
        $byCategory = [];
        foreach ($expenses as $e) {
            $ym  = $e->occurred_at->format('Y-m');
            $cat = $e->category;
            $byCategory[$cat][$ym] = ($byCategory[$cat][$ym] ?? 0.0) + (float) $e->amount;
        }

        // 過去 6 ヶ月の対象月 YYYY-MM リスト（当月を除く）
        $pastMonths = [];
        for ($i = 6; $i >= 1; $i--) {
            $pastMonths[] = $today->subMonthsNoOverflow($i)->format('Y-m');
        }

        $rows = [];
        $totalMonthly = 0.0;
        $totalAnnual  = 0.0;
        $totalActual  = 0.0;
        $totalRemaining = 0.0;
        $hasAnyMonthly  = false;

        foreach ($byCategory as $cat => $months) {
            $hits = array_values(array_filter($pastMonths, fn ($ym) => isset($months[$ym]) && $months[$ym] > 0));
            $m    = count($hits);

            $monthlyBudget = null;
            $annualBudget  = null;

            if ($m >= 3) {
                $sum = 0.0;
                foreach ($hits as $ym) {
                    $sum += $months[$ym];
                }
                $monthlyBudget = round($sum / $m, 2);
                if ($m === 6) {
                    $annualBudget = round($monthlyBudget * 12, 2);
                }
            }

            $thisMonthActual = round((float) ($months[$thisYm] ?? 0.0), 2);
            $remaining       = $monthlyBudget !== null ? round($monthlyBudget - $thisMonthActual, 2) : null;

            $rows[] = [
                'category'         => $cat,
                'months_with_data' => $m,
                'monthly_budget'   => $monthlyBudget,
                'annual_budget'    => $annualBudget,
                'this_month_actual'=> $thisMonthActual,
                'remaining'        => $remaining,
            ];

            $totalActual += $thisMonthActual;
            if ($monthlyBudget !== null) {
                $hasAnyMonthly  = true;
                $totalMonthly  += $monthlyBudget;
                $totalRemaining += $remaining;
            }
            if ($annualBudget !== null) {
                $totalAnnual += $annualBudget;
            }
        }

        // monthly_budget あるカテゴリ降順 → 月数降順 で並べる（パネル表示が安定）
        usort($rows, function ($a, $b) {
            $am = $a['monthly_budget'] ?? -1;
            $bm = $b['monthly_budget'] ?? -1;
            if ($am !== $bm) return $bm <=> $am;
            return $b['months_with_data'] <=> $a['months_with_data'];
        });

        return response()->json([
            'as_of'       => $today->toDateString(),
            'by_category' => $rows,
            'totals'      => [
                'monthly_budget'    => $hasAnyMonthly ? round($totalMonthly, 2) : null,
                'annual_budget'     => $totalAnnual > 0 ? round($totalAnnual, 2) : null,
                'this_month_actual' => round($totalActual, 2),
                'remaining'         => $hasAnyMonthly ? round($totalRemaining, 2) : null,
            ],
        ]);
    }
}
