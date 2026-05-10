<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BalanceSheetService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PdfExportController extends Controller
{
    public function __construct(private readonly BalanceSheetService $service)
    {
    }

    /**
     * GET /api/balance-sheet/export
     * B/S レポートを A4 縦の PDF として返却。
     *
     * 必要 composer パッケージ: barryvdh/laravel-dompdf ^3.0
     */
    public function balanceSheet(Request $request): Response
    {
        $bs = $this->service->calculate($request->user());

        $pdf = Pdf::loadView('pdf.balance-sheet', [
            'user'        => $request->user(),
            'bs'          => $bs,
            'generatedAt' => now()->format('Y年n月j日 H:i'),
        ])->setPaper('a4', 'portrait');

        $filename = sprintf('balance-sheet-%s.pdf', now()->format('Ymd'));
        return $pdf->download($filename);
    }
}
