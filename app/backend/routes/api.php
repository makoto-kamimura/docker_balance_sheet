<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\LiabilityController;
use App\Http\Controllers\Api\BalanceSheetController;
use App\Http\Controllers\Api\SnapshotController;
use App\Http\Controllers\Api\CashflowItemController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CsvExportController;
use App\Http\Controllers\Api\ExpenseController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// 認証不要ルート
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// 認証必要ルート（Laravel Sanctum）
Route::middleware('auth:sanctum')->group(function () {

    // 認証
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // CSV エクスポート（apiResource の {param} より先に登録する）
    Route::get('/assets/export',         [CsvExportController::class, 'assets']);
    Route::get('/liabilities/export',    [CsvExportController::class, 'liabilities']);
    Route::get('/cashflow-items/export', [CsvExportController::class, 'cashflowItems']);

    // 並び順更新（apiResource より前）
    Route::post('/assets/reorder',         [AssetController::class,        'reorder']);
    Route::post('/liabilities/reorder',    [LiabilityController::class,    'reorder']);
    Route::post('/cashflow-items/reorder', [CashflowItemController::class, 'reorder']);

    // 予算サマリー / 年齢別キャッシュフロー推移 / 自動予算（実績ベース）
    Route::get('/budget/summary',    [BudgetController::class, 'summary']);
    Route::get('/budget/projection', [BudgetController::class, 'projection']);
    Route::get('/budget/auto',       [BudgetController::class, 'autoBudget']);

    // 実績入力 CRUD
    Route::apiResource('expenses', ExpenseController::class);

    // 資産 CRUD
    Route::apiResource('assets', AssetController::class);

    // 負債 CRUD
    Route::apiResource('liabilities', LiabilityController::class);

    // バランスシート（計算・サマリー・前月比）
    Route::prefix('balance-sheet')->group(function () {
        Route::get('/',           [BalanceSheetController::class, 'index']);      // 現在のB/S
        Route::get('/summary',    [BalanceSheetController::class, 'summary']);    // 純資産サマリー
        Route::get('/comparison', [BalanceSheetController::class, 'comparison']); // 前月比（最新2スナップショット）
    });

    // 月次スナップショット
    Route::prefix('snapshots')->group(function () {
        Route::get('/',      [SnapshotController::class, 'index']);   // 一覧（推移グラフ用）
        Route::post('/',     [SnapshotController::class, 'store']);   // 手動保存
        Route::delete('/{snapshot}', [SnapshotController::class, 'destroy']);
    });

    // ライフプラン キャッシュフロー項目 CRUD
    Route::apiResource('cashflow-items', CashflowItemController::class);
});
