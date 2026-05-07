<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('balance_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('year_month', 7);
            $table->decimal('total_assets', 15, 2)->default(0);
            $table->decimal('total_liabilities', 15, 2)->default(0);
            $table->decimal('net_worth', 15, 2)->default(0);
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->unique(['user_id', 'year_month']);
            $table->index('year_month');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('balance_snapshots');
    }
};
