<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        foreach (['assets', 'liabilities', 'cashflow_items'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->unsignedInteger('sort_order')->default(0)->after('id');
                $t->index(['sort_order']);
            });
        }
    }

    public function down(): void
    {
        foreach (['assets', 'liabilities', 'cashflow_items'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropIndex([$table === 'assets' ? 'assets_sort_order_index'
                              : ($table === 'liabilities' ? 'liabilities_sort_order_index'
                              : 'cashflow_items_sort_order_index')]);
                $t->dropColumn('sort_order');
            });
        }
    }
};
