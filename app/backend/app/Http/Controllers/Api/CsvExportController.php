<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CsvExportController extends Controller
{
    /** GET /api/assets/export */
    public function assets(Request $request): StreamedResponse
    {
        $rows = $request->user()->assets()->orderBy('category')->orderBy('name')->get();

        return $this->stream(
            'assets.csv',
            ['ID', '名称', 'カテゴリ', '金額', 'メモ', '作成日時', '更新日時'],
            $rows->map(fn ($a) => [$a->id, $a->name, $a->category, $a->amount, $a->note, $a->created_at, $a->updated_at]),
        );
    }

    /** GET /api/liabilities/export */
    public function liabilities(Request $request): StreamedResponse
    {
        $rows = $request->user()->liabilities()->orderBy('category')->orderBy('name')->get();

        return $this->stream(
            'liabilities.csv',
            ['ID', '名称', 'カテゴリ', '金額', 'メモ', '作成日時', '更新日時'],
            $rows->map(fn ($l) => [$l->id, $l->name, $l->category, $l->amount, $l->note, $l->created_at, $l->updated_at]),
        );
    }

    /** GET /api/cashflow-items/export */
    public function cashflowItems(Request $request): StreamedResponse
    {
        $rows = $request->user()->cashflowItems()
            ->orderBy('direction')->orderBy('category')->orderBy('name')->get();

        return $this->stream(
            'cashflow-items.csv',
            ['ID', '名称', '区分', '種別', 'カテゴリ', '購入先', '月額', '年額', '開始年齢', '終了年齢', 'メモ', 'URL'],
            $rows->map(fn ($c) => [
                $c->id, $c->name, $c->direction, $c->frequency,
                $c->category, $c->vendor,
                $c->monthly_amount, $c->annual_amount,
                $c->start_age, $c->end_age,
                $c->note, $c->url,
            ]),
        );
    }

    /**
     * BOM 付き UTF-8 CSV を Streaming レスポンスで返す（Excel で文字化けしないため）。
     */
    private function stream(string $filename, array $header, iterable $rows): StreamedResponse
    {
        return new StreamedResponse(function () use ($header, $rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM
            fputcsv($out, $header);
            foreach ($rows as $r) {
                fputcsv($out, $r);
            }
            fclose($out);
        }, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => sprintf('attachment; filename="%s"', $filename),
            'Cache-Control'       => 'no-store',
        ]);
    }
}
