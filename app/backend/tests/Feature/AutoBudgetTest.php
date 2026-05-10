<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AutoBudgetTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('api');
    }

    /**
     * food: 過去 6 ヶ月すべてに実績 → 月予算 + 年予算 解禁
     * cafe: 過去 4 ヶ月にだけ実績 → 月予算のみ解禁、年予算は null
     * snack: 過去 2 ヶ月にだけ実績 → 月予算 null（未解禁）
     */
    public function test_auto_budget_unlocks_at_3_and_12x_at_6_months(): void
    {
        $user = User::factory()->create();
        $now  = CarbonImmutable::now();

        // food: 6 ヶ月分 × 月 30,000 円
        for ($i = 1; $i <= 6; $i++) {
            Expense::factory()->for($user)->create([
                'category'    => 'food',
                'amount'      => 30_000,
                'occurred_at' => $now->subMonthsNoOverflow($i)->startOfMonth()->addDays(5),
            ]);
        }
        // cafe: 4 ヶ月分 × 月 10,000 円
        for ($i = 1; $i <= 4; $i++) {
            Expense::factory()->for($user)->create([
                'category'    => 'cafe',
                'amount'      => 10_000,
                'occurred_at' => $now->subMonthsNoOverflow($i)->startOfMonth()->addDays(5),
            ]);
        }
        // snack: 2 ヶ月分 × 月 1,000 円
        for ($i = 1; $i <= 2; $i++) {
            Expense::factory()->for($user)->create([
                'category'    => 'snack',
                'amount'      => 1_000,
                'occurred_at' => $now->subMonthsNoOverflow($i)->startOfMonth()->addDays(5),
            ]);
        }

        $res = $this->actingAs($user)->getJson('/api/budget/auto')->assertOk();

        $byCat = collect($res->json('by_category'))->keyBy('category');

        // food: 月予算 30,000 + 年予算 360,000
        $this->assertSame(6,        $byCat['food']['months_with_data']);
        $this->assertSame(30_000.0, (float) $byCat['food']['monthly_budget']);
        $this->assertSame(360_000.0, (float) $byCat['food']['annual_budget']);

        // cafe: 月予算解禁 / 年予算未解禁
        $this->assertSame(4,        $byCat['cafe']['months_with_data']);
        $this->assertSame(10_000.0, (float) $byCat['cafe']['monthly_budget']);
        $this->assertNull($byCat['cafe']['annual_budget']);

        // snack: 月予算未解禁
        $this->assertSame(2,    $byCat['snack']['months_with_data']);
        $this->assertNull($byCat['snack']['monthly_budget']);
        $this->assertNull($byCat['snack']['annual_budget']);
    }

    public function test_remaining_decreases_when_actual_increases(): void
    {
        $user = User::factory()->create();
        $now  = CarbonImmutable::now();

        // 過去 3 ヶ月分（解禁ぎりぎり）
        for ($i = 1; $i <= 3; $i++) {
            Expense::factory()->for($user)->create([
                'category'    => 'food',
                'amount'      => 20_000,
                'occurred_at' => $now->subMonthsNoOverflow($i)->startOfMonth()->addDays(3),
            ]);
        }
        // 当月の実績 5,000 円
        Expense::factory()->for($user)->create([
            'category'    => 'food',
            'amount'      => 5_000,
            'occurred_at' => $now->startOfMonth()->addDays(2),
        ]);

        $row = collect($this->actingAs($user)->getJson('/api/budget/auto')->json('by_category'))
            ->firstWhere('category', 'food');

        $this->assertSame(20_000.0, (float) $row['monthly_budget']);
        $this->assertSame(5_000.0,  (float) $row['this_month_actual']);
        $this->assertSame(15_000.0, (float) $row['remaining']);
    }
}
