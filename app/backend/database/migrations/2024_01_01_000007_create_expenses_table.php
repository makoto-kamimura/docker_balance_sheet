<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('category', 60);                     // 例: food, transport, ...
            $table->decimal('amount', 12, 2);                   // 円単位
            $table->date('occurred_at');                        // 実績発生日
            $table->string('note', 255)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'occurred_at']);
            $table->index(['user_id', 'category', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
