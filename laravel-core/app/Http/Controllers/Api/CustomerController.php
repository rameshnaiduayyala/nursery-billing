<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Transaction;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('gst_number', 'like', "%{$search}%");
            });
        }

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($request->has('status') && $request->input('status') !== '') {
            $query->where('status', (int) $request->input('status'));
        }

        $customers = $query->orderBy('name', 'asc')->get();

        $customers->transform(function ($customer) {
            $sales = Transaction::where('party_type', 'CUSTOMER')
                ->where('party_id', $customer->id)
                ->where('transaction_type', 'SALE')
                ->sum('amount');

            $receipts = Transaction::where('party_type', 'CUSTOMER')
                ->where('party_id', $customer->id)
                ->where('transaction_type', 'CUSTOMER_RECEIPT')
                ->sum('amount');

            $customer->total_sales = (float) $sales;
            $customer->total_receipts = (float) $receipts;
            $customer->net_balance = (float) ($sales - $receipts);
            return $customer;
        });

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:180',
            'type' => 'nullable|in:CUSTOMER,EXPORTER',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:190',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'gst_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Customer added successfully',
            'data' => $customer,
        ], 201);
    }

    public function show($id)
    {
        $customer = Customer::findOrFail($id);

        $sales = Transaction::where('party_type', 'CUSTOMER')
            ->where('party_id', $customer->id)
            ->where('transaction_type', 'SALE')
            ->sum('amount');

        $receipts = Transaction::where('party_type', 'CUSTOMER')
            ->where('party_id', $customer->id)
            ->where('transaction_type', 'CUSTOMER_RECEIPT')
            ->sum('amount');

        $customer->total_sales = (float) $sales;
        $customer->total_receipts = (float) $receipts;
        $customer->net_balance = (float) ($sales - $receipts);

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    public function update(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:180',
            'type' => 'sometimes|in:CUSTOMER,EXPORTER',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:190',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'gst_number' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'status' => 'sometimes|integer',
        ]);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => $customer,
        ]);
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully',
        ]);
    }

    public function statement(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = Transaction::where('party_type', 'CUSTOMER')
            ->where('party_id', $customer->id);

        if ($startDate) {
            $query->where('transaction_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('transaction_date', '<=', $endDate);
        }

        $transactions = $query->orderBy('transaction_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $openingBalance = 0;
        if ($startDate) {
            $prevSales = Transaction::where('party_type', 'CUSTOMER')
                ->where('party_id', $customer->id)
                ->where('transaction_type', 'SALE')
                ->where('transaction_date', '<', $startDate)
                ->sum('amount');

            $prevReceipts = Transaction::where('party_type', 'CUSTOMER')
                ->where('party_id', $customer->id)
                ->where('transaction_type', 'CUSTOMER_RECEIPT')
                ->where('transaction_date', '<', $startDate)
                ->sum('amount');

            $openingBalance = (float) ($prevSales - $prevReceipts);
        }

        $runningBalance = $openingBalance;
        $items = [];

        foreach ($transactions as $tx) {
            $amount = (float) $tx->amount;
            if ($tx->transaction_type === 'SALE') {
                $runningBalance += $amount;
            } else {
                $runningBalance -= $amount;
            }

            $items[] = [
                'id' => $tx->id,
                'transaction_date' => $tx->transaction_date,
                'transaction_type' => $tx->transaction_type,
                'amount' => $amount,
                'payment_mode' => $tx->payment_mode,
                'remarks' => $tx->remarks,
                'running_balance' => $runningBalance,
            ];
        }

        $totalSales = (float) Transaction::where('party_type', 'CUSTOMER')
            ->where('party_id', $customer->id)
            ->where('transaction_type', 'SALE')
            ->sum('amount');

        $totalReceipts = (float) Transaction::where('party_type', 'CUSTOMER')
            ->where('party_id', $customer->id)
            ->where('transaction_type', 'CUSTOMER_RECEIPT')
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'customer' => $customer,
                'opening_balance' => $openingBalance,
                'closing_balance' => $runningBalance,
                'total_sales' => $totalSales,
                'total_receipts' => $totalReceipts,
                'net_balance' => $totalSales - $totalReceipts,
                'items' => $items,
            ],
        ]);
    }
}
