<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    protected $model = Expense::class;

    public function definition(): array
    {
        return [
            'user_id'     => User::factory(),
            'category'    => fake()->randomElement(['food', 'transport', 'utility', 'leisure']),
            'amount'      => fake()->numberBetween(100, 30_000),
            'occurred_at' => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
            'note'        => null,
        ];
    }
}
