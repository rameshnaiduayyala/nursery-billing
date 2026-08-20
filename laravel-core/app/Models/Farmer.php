<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Farmer extends Model
{
    protected $table = 'farmers';

    protected $fillable = [
        'name',
        'phone',
        'location',
        'address',
        'notes',
        'status',
    ];

    protected $casts = [
        'status' => 'integer',
    ];

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'party_id')
                    ->where('party_type', 'FARMER');
    }
}
