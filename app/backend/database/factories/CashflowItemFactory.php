<?php

namespace Database\Factories;

use App\Models\CashflowItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CashflowItem>
 */
class CashflowItemFactory extends Factory
{
    protected $model = CashflowItem::class;

    public function definition(): array
    {
        $monthly = fake()->numberBetween(1_000, 200_000);

        return [
            'user_id'        => User::factory(),
            'name'           => fake()->words(2, true),
            'direction'      => fake()->randomElement(CashflowItem::DIRECTIONS),
            'frequency'      => fake()->randomElement(CashflowItem::FREQUENCIES),
            'category'       => fake()->randomElement(['food', 'transport', 'housing', 'salary']),
            'vendor'         => null,
            'monthly_amount' => $monthly,
            'annual_amount'  => $monthly * 12,
            'start_age'      => null,
            'end_age'        => null,
            'note'           => null,
            'url'            => null,
        ];
    }
}
