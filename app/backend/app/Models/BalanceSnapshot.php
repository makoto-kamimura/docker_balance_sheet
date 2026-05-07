<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BalanceSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'year_month',
        'total_assets',
        'total_liabilities',
        'net_worth',
        'recorded_at',
    ];

    protected $casts = [
        'total_assets'      => 'decimal:2',
        'total_liabilities' => 'decimal:2',
        'net_worth'         => 'decimal:2',
        'recorded_at'       => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
