<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\FarmerController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;

/*
|--------------------------------------------------------------------------
| Laravel 11 API Routes for Gangadhara Nursery Billing System
|--------------------------------------------------------------------------
*/

// Farmers API Routes
Route::get('/farmers/statement.php', [FarmerController::class, 'statement']);
Route::get('/farmers', [FarmerController::class, 'index']);
Route::post('/farmers', [FarmerController::class, 'store']);
Route::get('/farmers/{id}', [FarmerController::class, 'show']);
Route::put('/farmers/{id}', [FarmerController::class, 'update']);
Route::delete('/farmers/{id}', [FarmerController::class, 'destroy']);

// Customers API Routes
Route::get('/customers/statement.php', [CustomerController::class, 'statement']);
Route::get('/customers', [CustomerController::class, 'index']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::get('/customers/{id}', [CustomerController::class, 'show']);
Route::put('/customers/{id}', [CustomerController::class, 'update']);
Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);

// Transactions API Routes
Route::get('/transactions', [TransactionController::class, 'index']);
Route::post('/transactions', [TransactionController::class, 'store']);
Route::put('/transactions/{id}', [TransactionController::class, 'update']);
Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);

// Expenses API Routes
Route::get('/expenses', [ExpenseController::class, 'index']);
Route::post('/expenses', [ExpenseController::class, 'store']);
Route::put('/expenses/{id}', [ExpenseController::class, 'update']);
Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);

// Reports API Routes
Route::get('/reports/profit_loss.php', [ReportController::class, 'profitLoss']);
Route::get('/reports/summary.php', [ReportController::class, 'summary']);
Route::get('/reports/payment_reminders.php', [ReportController::class, 'paymentReminders']);
