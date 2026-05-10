<?php

namespace Tests\Feature;

use App\Http\Requests\Asset\StoreAssetRequest;
use App\Models\Asset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AssetControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        RateLimiter::clear('api');
    }

    public function test_index_returns_only_current_user_assets(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        Asset::factory()->for($userA)->count(3)->create();
        Asset::factory()->for($userB)->count(5)->create();

        $this->actingAs($userA)
            ->getJson('/api/assets')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_store_creates_asset_for_current_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/assets', [
            'name'     => '楽天証券',
            'category' => 'investment',
            'amount'   => 1_500_000,
        ])->assertCreated()->assertJsonPath('data.name', '楽天証券');

        $this->assertDatabaseHas('assets', [
            'user_id'  => $user->id,
            'name'     => '楽天証券',
            'category' => 'investment',
        ]);
    }

    public function test_store_rejects_duplicate_name_in_same_category(): void
    {
        $user = User::factory()->create();
        Asset::factory()->for($user)->create(['name' => '普通預金', 'category' => 'current']);

        $this->actingAs($user)->postJson('/api/assets', [
            'name'     => '普通預金',
            'category' => 'current',
            'amount'   => 100_000,
        ])->assertStatus(422)->assertJsonValidationErrors(['name']);
    }

    public function test_store_allows_same_name_in_different_category(): void
    {
        $user = User::factory()->create();
        Asset::factory()->for($user)->create(['name' => '住宅', 'category' => 'fixed']);

        $this->actingAs($user)->postJson('/api/assets', [
            'name'     => '住宅',
            'category' => 'investment',
            'amount'   => 9_000_000,
        ])->assertCreated();
    }

    public function test_store_blocks_when_user_count_reaches_limit(): void
    {
        $user = User::factory()->create();
        Asset::factory()->for($user)->count(StoreAssetRequest::MAX_PER_USER)->create();

        $this->actingAs($user)->postJson('/api/assets', [
            'name'     => '溢れる',
            'category' => 'current',
            'amount'   => 1,
        ])->assertStatus(422);
    }

    public function test_update_modifies_owned_asset(): void
    {
        $user  = User::factory()->create();
        $asset = Asset::factory()->for($user)->create(['amount' => 100_000]);

        $this->actingAs($user)
            ->putJson("/api/assets/{$asset->id}", ['amount' => 250_000])
            ->assertOk()
            ->assertJsonPath('data.amount', 250000);

        $this->assertSame(250000.0, (float) $asset->fresh()->amount);
    }

    public function test_cannot_update_other_users_asset(): void
    {
        $owner   = User::factory()->create();
        $other   = User::factory()->create();
        $asset   = Asset::factory()->for($owner)->create();

        $this->actingAs($other)
            ->putJson("/api/assets/{$asset->id}", ['amount' => 1])
            ->assertStatus(403);
    }

    public function test_destroy_deletes_owned_asset(): void
    {
        $user  = User::factory()->create();
        $asset = Asset::factory()->for($user)->create();

        $this->actingAs($user)
            ->deleteJson("/api/assets/{$asset->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('assets', ['id' => $asset->id]);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->getJson('/api/assets')->assertStatus(401);
    }
}
