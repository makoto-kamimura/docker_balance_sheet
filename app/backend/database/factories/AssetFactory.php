<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Asset>
 */
class AssetFactory extends Factory
{
    protected $model = Asset::class;

    public function definition(): array
    {
        return [
            'user_id'  => User::factory(),
            'name'     => fake()->words(2, true),
            'category' => fake()->randomElement(Asset::CATEGORIES),
            'amount'   => fake()->numberBetween(10_000, 10_000_000),
            'note'     => null,
        ];
    }
}
