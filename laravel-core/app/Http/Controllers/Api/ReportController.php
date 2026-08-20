<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Expense;
use App\Models\Customer;
use App\Models\Farmer;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function profitLoss(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $salesQuery = Transaction::where('transaction_type', 'SALE');
        $purchasesQuery = Transaction::where('transaction_type', 'PURCHASE');
        $expensesQuery = Expense::query();

        if ($startDate) {
            $salesQuery->where('transaction_date', '>=', $startDate);
            $purchasesQuery->where('transaction_date', '>=', $startDate);
            $expensesQuery->where('expense_date', '>=', $startDate);
        }
        if ($endDate) {
            $salesQuery->where('transaction_date', '<=', $endDate);
            $purchasesQuery->where('transaction_date', '<=', $endDate);
            $expensesQuery->where('expense_date', '<=', $endDate);
        }

        $totalSales = (float) $salesQuery->sum('amount');
        $totalPurchases = (float) $purchasesQuery->sum('amount');
        $totalExpenses = (float) $expensesQuery->sum('amount');

        $grossProfit = $totalSales - $totalPurchases;
        $netProfit = $grossProfit - $totalExpenses;

        $expenseBreakdown = Expense::query()
            ->when($startDate, fn($q) => $q->where('expense_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('expense_date', '<=', $endDate))
            ->selectRaw('expense_type, SUM(amount) as total')
            ->groupBy('expense_type')
            ->get()
            ->map(fn($item) => [
                'expense_type' => $item->expense_type,
                'total' => (float) $item->total,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'total_sales' => $totalSales,
                'total_purchases' => $totalPurchases,
                'total_expenses' => $totalExpenses,
                'gross_profit' => $grossProfit,
                'net_profit' => $netProfit,
                'expense_breakdown' => $expenseBreakdown,
            ],
        ]);
    }

    public function summary(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $sales = (float) Transaction::where('transaction_type', 'SALE')
            ->when($startDate, fn($q) => $q->where('transaction_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('transaction_date', '<=', $endDate))
            ->sum('amount');

        $purchases = (float) Transaction::where('transaction_type', 'PURCHASE')
            ->when($startDate, fn($q) => $q->where('transaction_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('transaction_date', '<=', $endDate))
            ->sum('amount');

        $expenses = (float) Expense::query()
            ->when($startDate, fn($q) => $q->where('expense_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('expense_date', '<=', $endDate))
            ->sum('amount');

        $customerReceipts = (float) Transaction::where('transaction_type', 'CUSTOMER_RECEIPT')
            ->when($startDate, fn($q) => $q->where('transaction_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('transaction_date', '<=', $endDate))
            ->sum('amount');

        $farmerPayments = (float) Transaction::where('transaction_type', 'FARMER_PAYMENT')
            ->when($startDate, fn($q) => $q->where('transaction_date', '>=', $startDate))
            ->when($endDate, fn($q) => $q->where('transaction_date', '<=', $endDate))
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'total_sales' => $sales,
                'total_purchases' => $purchases,
                'total_expenses' => $expenses,
                'customer_payments_received' => $customerReceipts,
                'farmer_payments_made' => $farmerPayments,
                'net_profit' => ($sales - $purchases) - $expenses,
            ],
        ]);
    }

    public function paymentReminders(Request $request)
    {
        // Calculate pending customer balances
        $customers = Customer::where('status', 1)->get();
        $pendingCustomers = [];

        foreach ($customers as $c) {
            $sales = Transaction::where('party_type', 'CUSTOMER')
                ->where('party_id', $c->id)
                ->where('transaction_type', 'SALE')
                ->sum('amount');

            $receipts = Transaction::where('party_type', 'CUSTOMER')
                ->where('party_id', $c->id)
                ->where('transaction_type', 'CUSTOMER_RECEIPT')
                ->sum('amount');

            $due = (float) ($sales - $receipts);
            if ($due > 0) {
                $lastTx = Transaction::where('party_type', 'CUSTOMER')
                    ->where('party_id', $c->id)
                    ->orderBy('transaction_date', 'desc')
                    ->first();

                $pendingCustomers[] = [
                    'customer_id' => $c->id,
                    'customer_name' => $c->name,
                    'phone' => $c->phone,
                    'total_sales' => (float) $sales,
                    'total_received' => (float) $receipts,
                    'pending_balance' => $due,
                    'last_transaction_date' => $lastTx ? $lastTx->transaction_date : null,
                ];
            }
        }

        // Calculate pending farmer balances
        $farmers = Farmer::where('status', 1)->get();
        $pendingFarmers = [];

        foreach ($farmers as $f) {
            $purchases = Transaction::where('party_type', 'FARMER')
                ->where('party_id', $f->id)
                ->where('transaction_type', 'PURCHASE')
                ->sum('amount');

            $payments = Transaction::where('party_type', 'FARMER')
                ->where('party_id', $f->id)
                ->where('transaction_type', 'FARMER_PAYMENT')
                ->sum('amount');

            $payable = (float) ($purchases - $payments);
            if ($payable > 0) {
                $lastTx = Transaction::where('party_type', 'FARMER')
                    ->where('party_id', $f->id)
                    ->orderBy('transaction_date', 'desc')
                    ->first();

                $pendingFarmers[] = [
                    'farmer_id' => $f->id,
                    'farmer_name' => $f->name,
                    'phone' => $f->phone,
                    'total_purchases' => (float) $purchases,
                    'total_paid' => (float) $payments,
                    'pending_payable' => $payable,
                    'last_transaction_date' => $lastTx ? $lastTx->transaction_date : null,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'pending_customer_receivables' => $pendingCustomers,
                'pending_farmer_payables' => $pendingFarmers,
            ],
        ]);
    }
}
