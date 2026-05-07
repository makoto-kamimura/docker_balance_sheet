<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CashflowItemResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'direction'      => $this->direction,
            'frequency'      => $this->frequency,
            'category'       => $this->category,
            'vendor'         => $this->vendor,
            'monthly_amount' => (float) $this->monthly_amount,
            'annual_amount'  => (float) $this->annual_amount,
            'start_age'      => $this->start_age,
            'end_age'        => $this->end_age,
            'note'           => $this->note,
            'url'            => $this->url,
            'sort_order'     => (int) $this->sort_order,
            'created_at'     => $this->created_at?->toISOString(),
            'updated_at'     => $this->updated_at?->toISOString(),
        ];
    }
}
