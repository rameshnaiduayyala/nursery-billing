<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $table = 'expenses';
    public $timestamps = false;

    protected $fillable = [
        'expense_date',
        'expense_type',
        'description',
        'amount',
        'payment_mode',
        'remarks',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];
}
