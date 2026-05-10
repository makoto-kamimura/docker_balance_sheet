<?php

namespace Tests\Feature;

use App\Models\CashflowItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class CashflowItemControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('api');
    }

    public function test_store_with_only_monthly_auto_fills_annual(): void
    {
        $user = User::factory()->create();

        $res = $this->actingAs($user)->postJson('/api/cashflow-items', [
            'name'           => '家賃',
            'direction'      => 'expense',
            'frequency'      => 'fixed',
            'category'       => 'housing',
            'monthly_amount' => 80_000,
        ]);

        $res->assertCreated();
        $created = CashflowItem::where('user_id', $user->id)->firstOrFail();
        $this->assertSame(80_000.0,    (float) $created->monthly_amount);
        $this->assertSame(960_000.0,   (float) $created->annual_amount);
    }

    public function test_store_with_only_annual_auto_fills_monthly(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/cashflow-items', [
            'name'          => '車検',
            'direction'     => 'expense',
            'frequency'     => 'fixed',
            'annual_amount' => 120_000,
        ])->assertCreated();

        $created = CashflowItem::where('user_id', $user->id)->firstOrFail();
        $this->assertSame(10_000.0,  (float) $created->monthly_amount);
        $this->assertSame(120_000.0, (float) $created->annual_amount);
    }

    public function test_store_rejects_invalid_direction(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/cashflow-items', [
            'name'      => '不正',
            'direction' => 'invalid',
            'frequency' => 'fixed',
        ])->assertStatus(422)->assertJsonValidationErrors(['direction']);
    }

    public function test_store_rejects_when_end_age_less_than_start_age(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/cashflow-items', [
            'name'           => '逆順',
            'direction'      => 'income',
            'frequency'      => 'fixed',
            'monthly_amount' => 10000,
            'start_age'      => 60,
            'end_age'        => 50,
        ])->assertStatus(422)->assertJsonValidationErrors(['end_age']);
    }

    public function test_store_rejects_duplicate_name_in_same_category(): void
    {
        $user = User::factory()->create();
        CashflowItem::factory()->for($user)->create(['name' => '家賃', 'category' => 'housing']);

        $this->actingAs($user)->postJson('/api/cashflow-items', [
            'name'           => '家賃',
            'direction'      => 'expense',
            'frequency'      => 'fixed',
            'category'       => 'housing',
            'monthly_amount' => 80_000,
        ])->assertStatus(422)->assertJsonValidationErrors(['name']);
    }

    public function test_index_filters_by_current_user(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        CashflowItem::factory()->for($userA)->count(2)->create();
        CashflowItem::factory()->for($userB)->count(4)->create();

        $this->actingAs($userA)
            ->getJson('/api/cashflow-items')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
