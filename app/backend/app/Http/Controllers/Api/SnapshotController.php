<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BalanceSnapshot;
use App\Services\BalanceSheetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SnapshotController extends Controller
{
    public function __construct(
        private readonly BalanceSheetService $balanceSheetService
    ) {}

    /**
     * スナップショット一覧（推移グラフ用）
     * GET /api/snapshots?months=12
     */
    public function index(Request $request): JsonResponse
    {
        $months = (int) $request->query('months', 12);
        $months = max(1, min($months, 60));

        $snapshots = auth()->user()
            ->balanceSnapshots()
            ->orderBy('year_month', 'desc')
            ->limit($months)
            ->get()
            ->sortBy('year_month')
            ->values();

        return response()->json($snapshots);
    }

    /**
     * 現在値をスナップショットとして保存
     * POST /api/snapshots
     *
     * year_month に UNIQUE 制約があるため、同月分は上書きされる。
     */
    public function store(): JsonResponse
    {
        $user      = auth()->user();
        $summary   = $this->balanceSheetService->summary($user);
        $yearMonth = now()->format('Y-m');

        $snapshot = BalanceSnapshot::updateOrCreate(
            [
                'user_id'    => $user->id,
                'year_month' => $yearMonth,
            ],
            [
                'total_assets'      => $summary['total_assets'],
                'total_liabilities' => $summary['total_liabilities'],
                'net_worth'         => $summary['net_worth'],
                'recorded_at'       => now(),
            ],
        );

        return response()->json($snapshot, 201);
    }

    /**
     * スナップショット削除
     * DELETE /api/snapshots/{snapshot}
     */
    public function destroy(BalanceSnapshot $snapshot): JsonResponse
    {
        abort_if($snapshot->user_id !== auth()->id(), 403, '操作権限がありません。');

        $snapshot->delete();

        return response()->json(null, 204);
    }
}
