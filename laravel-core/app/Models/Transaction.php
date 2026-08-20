<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $table = 'transactions';
    public $timestamps = false; // created_at is handled by DB default

    protected $fillable = [
        'transaction_date',
        'party_type',
        'party_id',
        'transaction_type',
        'amount',
        'payment_mode',
        'remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function farmer()
    {
        return $this->belongsTo(Farmer::class, 'party_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'party_id');
    }
}
