<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

class BalanceSheetService
{
    /**
     * 資産カテゴリの日本語ラベル
     */
    private const ASSET_LABELS = [
        'current'    => '流動資産',
        'fixed'      => '固定資産',
        'investment' => '投資・その他',
    ];

    /**
     * 負債カテゴリの日本語ラベル
     */
    private const LIABILITY_LABELS = [
        'current'  => '流動負債',
        'longterm' => '固定負債',
    ];

    /**
     * バランスシートを計算して返す
     */
    public function calculate(User $user): array
    {
        $assets      = $user->assets()->get();
        $liabilities = $user->liabilities()->get();

        $assetSection      = $this->groupAssets($assets);
        $liabilitySection  = $this->groupLiabilities($liabilities);

        $totalAssets      = $assetSection['total'];
        $totalLiabilities = $liabilitySection['total'];
        $netWorth         = $totalAssets - $totalLiabilities;

        return [
            'assets'      => $assetSection,
            'liabilities' => $liabilitySection,
            'net_worth'   => $netWorth,
            'recorded_at' => now()->toIso8601String(),
        ];
    }

    /**
     * ダッシュボード用サマリー
     */
    public function summary(User $user): array
    {
        $bs = $this->calculate($user);

        return [
            'total_assets'      => $bs['assets']['total'],
            'total_liabilities' => $bs['liabilities']['total'],
            'net_worth'         => $bs['net_worth'],
            'asset_ratio'       => $this->ratio($bs['assets']['total'], $bs['assets']['total'] + $bs['liabilities']['total']),
            'recorded_at'       => $bs['recorded_at'],
        ];
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function groupAssets(Collection $assets): array
    {
        $categories = ['current', 'fixed', 'investment'];
        $sections   = [];
        $total      = 0;

        foreach ($categories as $cat) {
            $items    = $assets->where('category', $cat)->values();
            $subtotal = $items->sum('amount');
            $total   += $subtotal;

            $sections[$cat] = [
                'label'    => self::ASSET_LABELS[$cat],
                'items'    => $items->map(fn($a) => $this->formatItem($a))->toArray(),
                'subtotal' => $subtotal,
            ];
        }

        return array_merge($sections, ['total' => $total]);
    }

    private function groupLiabilities(Collection $liabilities): array
    {
        $categories = ['current', 'longterm'];
        $sections   = [];
        $total      = 0;

        foreach ($categories as $cat) {
            $items    = $liabilities->where('category', $cat)->values();
            $subtotal = $items->sum('amount');
            $total   += $subtotal;

            $sections[$cat] = [
                'label'    => self::LIABILITY_LABELS[$cat],
                'items'    => $items->map(fn($l) => $this->formatItem($l))->toArray(),
                'subtotal' => $subtotal,
            ];
        }

        return array_merge($sections, ['total' => $total]);
    }

    private function formatItem(object $model): array
    {
        return [
            'id'     => $model->id,
            'name'   => $model->name,
            'amount' => $model->amount,
            'note'   => $model->note ?? null,
        ];
    }

    private function ratio(float $numerator, float $denominator): float
    {
        if ($denominator <= 0) {
            return 0.0;
        }
        return round($numerator / $denominator * 100, 1);
    }
}
