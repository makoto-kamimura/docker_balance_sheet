<?php

namespace Database\Factories;

use App\Models\Liability;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Liability>
 */
class LiabilityFactory extends Factory
{
    protected $model = Liability::class;

    public function definition(): array
    {
        return [
            'user_id'  => User::factory(),
            'name'     => fake()->words(2, true),
            'category' => fake()->randomElement(Liability::CATEGORIES),
            'amount'   => fake()->numberBetween(10_000, 10_000_000),
            'note'     => null,
        ];
    }
}
