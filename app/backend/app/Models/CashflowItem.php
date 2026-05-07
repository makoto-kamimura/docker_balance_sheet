<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashflowItem extends Model
{
    use HasFactory;

    public const DIRECTIONS  = ['income', 'expense'];
    public const FREQUENCIES = ['fixed', 'variable'];

    protected $fillable = [
        'user_id',
        'name',
        'direction',
        'frequency',
        'category',
        'vendor',
        'monthly_amount',
        'annual_amount',
        'start_age',
        'end_age',
        'note',
        'url',
        'sort_order',
    ];

    protected $casts = [
        'monthly_amount' => 'decimal:2',
        'annual_amount'  => 'decimal:2',
        'start_age'      => 'integer',
        'end_age'        => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
