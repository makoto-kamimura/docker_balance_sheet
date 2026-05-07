<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BalanceSnapshot;
use App\Services\BalanceSheetService;
use Illuminate\Http\JsonResponse;

class BalanceSheetController extends Controller
{
    public function __construct(
        private readonly BalanceSheetService $balanceSheetService
    ) {}

    /**
     * 現在のバランスシートを返す
     * GET /api/balance-sheet
     *
     * レスポンス例:
     * {
     *   "assets": {
     *     "current":    { "items": [...], "subtotal": 500000 },
     *     "fixed":      { "items": [...], "subtotal": 3000000 },
     *     "investment": { "items": [...], "subtotal": 1000000 },
     *     "total": 4500000
     *   },
     *   "liabilities": {
     *     "current":  { "items": [...], "subtotal": 100000 },
     *     "longterm": { "items": [...], "subtotal": 2000000 },
     *     "total": 2100000
     *   },
     *   "net_worth": 2400000,
     *   "recorded_at": "2025-05-01T00:00:00Z"
     * }
     */
    public function index(): JsonResponse
    {
        $user   = auth()->user();
        $result = $this->balanceSheetService->calculate($user);

        return response()->json($result);
    }

    /**
     * 純資産サマリーのみ返す（ダッシュボード用）
     * GET /api/balance-sheet/summary
     */
    public function summary(): JsonResponse
    {
        $user    = auth()->user();
        $summary = $this->balanceSheetService->summary($user);

        return response()->json($summary);
    }

    /**
     * 前月比（最新スナップショット 2 件を比較）
     * GET /api/balance-sheet/comparison
     *
     * - 最新スナップショット = current、その 1 つ前 = previous
     * - スナップショットが 0 件: { current: null, previous: null, change: null }
     * - 1 件のみ: { current: {...}, previous: null, change: null }
     * - 2 件以上: { current: {...}, previous: {...}, change: {...} }
     */
    public function comparison(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        $snapshots = $user->balanceSnapshots()
            ->orderByDesc('year_month')
            ->limit(2)
            ->get();

        $current  = $snapshots->get(0);
        $previous = $snapshots->get(1);

        return response()->json([
            'current'  => $current  ? $this->formatSnapshot($current)  : null,
            'previous' => $previous ? $this->formatSnapshot($previous) : null,
            'change'   => ($current && $previous) ? $this->diff($current, $previous) : null,
        ]);
    }

    private function formatSnapshot(BalanceSnapshot $s): array
    {
        return [
            'year_month'        => $s->year_month,
            'total_assets'      => (float) $s->total_assets,
            'total_liabilities' => (float) $s->total_liabilities,
            'net_worth'         => (float) $s->net_worth,
            'recorded_at'       => $s->recorded_at?->toIso8601String(),
        ];
    }

    /**
     * 差額（current - previous）と各値の変化率%を計算。
     */
    private function diff(BalanceSnapshot $current, BalanceSnapshot $previous): array
    {
        $pct = static function (float $cur, float $prev): ?float {
            if ($prev == 0.0) return null;  // ゼロ除算回避（previous=0 の場合は％算出不可）
            return round(($cur - $prev) / abs($prev) * 100, 2);
        };

        $ca = (float) $current->total_assets;
        $cl = (float) $current->total_liabilities;
        $cn = (float) $current->net_worth;
        $pa = (float) $previous->total_assets;
        $pl = (float) $previous->total_liabilities;
        $pn = (float) $previous->net_worth;

        return [
            'total_assets' => [
                'amount'  => round($ca - $pa, 2),
                'percent' => $pct($ca, $pa),
            ],
            'total_liabilities' => [
                'amount'  => round($cl - $pl, 2),
                'percent' => $pct($cl, $pl),
            ],
            'net_worth' => [
                'amount'  => round($cn - $pn, 2),
                'percent' => $pct($cn, $pn),
            ],
        ];
    }
}
