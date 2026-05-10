<?php

namespace Tests\Unit;

use App\Models\Asset;
use App\Models\Liability;
use App\Models\User;
use App\Services\BalanceSheetService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BalanceSheetServiceTest extends TestCase
{
    use RefreshDatabase;

    private BalanceSheetService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new BalanceSheetService();
    }

    public function test_calculates_net_worth_assets_minus_liabilities(): void
    {
        $user = User::factory()->create();
        Asset::factory()->for($user)->create(['category' => 'current', 'amount' => 100_000]);
        Asset::factory()->for($user)->create(['category' => 'fixed',   'amount' => 5_000_000]);
        Liability::factory()->for($user)->create(['category' => 'current',  'amount' => 200_000]);
        Liability::factory()->for($user)->create(['category' => 'longterm', 'amount' => 3_000_000]);

        $bs = $this->service->calculate($user);

        $this->assertSame(5_100_000.0, (float) $bs['assets']['total']);
        $this->assertSame(3_200_000.0, (float) $bs['liabilities']['total']);
        $this->assertSame(1_900_000.0, (float) $bs['net_worth']);
    }

    public function test_groups_assets_into_three_categories_with_subtotals(): void
    {
        $user = User::factory()->create();
        Asset::factory()->for($user)->create(['category' => 'current',    'amount' => 100_000]);
        Asset::factory()->for($user)->create(['category' => 'current',    'amount' => 200_000]);
        Asset::factory()->for($user)->create(['category' => 'fixed',      'amount' => 5_000_000]);
        Asset::factory()->for($user)->create(['category' => 'investment', 'amount' => 800_000]);

        $bs = $this->service->calculate($user);

        $this->assertSame('流動資産', $bs['assets']['current']['label']);
        $this->assertSame(300_000.0,    (float) $bs['assets']['current']['subtotal']);
        $this->assertSame(5_000_000.0,  (float) $bs['assets']['fixed']['subtotal']);
        $this->assertSame(800_000.0,    (float) $bs['assets']['investment']['subtotal']);
        $this->assertCount(2, $bs['assets']['current']['items']);
    }

    public function test_summary_returns_asset_ratio_within_0_to_100(): void
    {
        $user = User::factory()->create();
        Asset::factory()->for($user)->create(['category' => 'current', 'amount' => 800_000]);
        Liability::factory()->for($user)->create(['category' => 'current', 'amount' => 200_000]);

        $summary = $this->service->summary($user);

        $this->assertSame(800_000.0, (float) $summary['total_assets']);
        $this->assertSame(200_000.0, (float) $summary['total_liabilities']);
        $this->assertSame(600_000.0, (float) $summary['net_worth']);
        $this->assertSame(80.0,      (float) $summary['asset_ratio']);
    }

    public function test_summary_returns_zero_ratio_when_no_data(): void
    {
        $user = User::factory()->create();

        $summary = $this->service->summary($user);

        $this->assertSame(0.0, (float) $summary['total_assets']);
        $this->assertSame(0.0, (float) $summary['total_liabilities']);
        $this->assertSame(0.0, (float) $summary['net_worth']);
        $this->assertSame(0.0, (float) $summary['asset_ratio']);
    }

    public function test_only_current_user_data_included(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        Asset::factory()->for($userA)->create(['amount' => 1_000_000]);
        Asset::factory()->for($userB)->create(['amount' => 9_999_999]);

        $bs = $this->service->calculate($userA);

        $this->assertSame(1_000_000.0, (float) $bs['assets']['total']);
    }
}
