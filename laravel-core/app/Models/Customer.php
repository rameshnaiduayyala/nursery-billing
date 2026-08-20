<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $table = 'customers';

    protected $fillable = [
        'name',
        'type',
        'phone',
        'email',
        'address',
        'city',
        'gst_number',
        'notes',
        'status',
    ];

    protected $casts = [
        'status' => 'integer',
    ];

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'party_id')
                    ->where('party_type', 'CUSTOMER');
    }
}
