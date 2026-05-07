<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('cashflow_items', function (Blueprint $table) {
            $table->string('vendor', 120)->nullable()->after('category');  // 購入先（例: Netflix Inc., Amazon, JAL）
            $table->string('url', 500)->nullable()->after('note');         // 備考 URL（解約ページ等）
        });
    }

    public function down(): void
    {
        Schema::table('cashflow_items', function (Blueprint $table) {
            $table->dropColumn(['vendor', 'url']);
        });
    }
};
