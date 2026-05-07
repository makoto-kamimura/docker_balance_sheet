<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cashflow_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->enum('direction', ['income', 'expense']);          // 収入/支出
            $table->enum('frequency', ['fixed', 'variable']);          // 固定/変動
            $table->string('category', 60)->nullable();                // 任意グルーピング: housing, utilities, food, ...
            $table->decimal('monthly_amount', 12, 2)->default(0);      // 月額（万円単位ではなく円単位で保存）
            $table->decimal('annual_amount', 14, 2)->default(0);       // 年額（円）
            $table->unsignedSmallInteger('start_age')->nullable();     // 開始年齢
            $table->unsignedSmallInteger('end_age')->nullable();       // 終了年齢（null=継続）
            $table->string('note', 255)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'direction']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cashflow_items');
    }
};
