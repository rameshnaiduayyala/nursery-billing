<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farmer;
use App\Models\Transaction;
use Illuminate\Http\Request;

class FarmerController extends Controller
{
    public function index(Request $request)
    {
        $query = Farmer::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->input('status') !== '') {
            $query->where('status', (int) $request->input('status'));
        }

        $farmers = $query->orderBy('name', 'asc')->get();

        // Calculate balances dynamically
        $farmers->transform(function ($farmer) {
            $purchases = Transaction::where('party_type', 'FARMER')
                ->where('party_id', $farmer->id)
                ->where('transaction_type', 'PURCHASE')
                ->sum('amount');

            $payments = Transaction::where('party_type', 'FARMER')
                ->where('party_id', $farmer->id)
                ->where('transaction_type', 'FARMER_PAYMENT')
                ->sum('amount');

            $farmer->total_purchases = (float) $purchases;
            $farmer->total_payments = (float) $payments;
            $farmer->net_balance = (float) ($purchases - $payments);
            return $farmer;
        });

        return response()->json([
            'success' => true,
            'data' => $farmers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:180',
            'phone' => 'nullable|string|max:30',
            'location' => 'nullable|string|max:180',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $farmer = Farmer::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Farmer added successfully',
            'data' => $farmer,
        ], 201);
    }

    public function show($id)
    {
        $farmer = Farmer::findOrFail($id);

        $purchases = Transaction::where('party_type', 'FARMER')
            ->where('party_id', $farmer->id)
            ->where('transaction_type', 'PURCHASE')
            ->sum('amount');

        $payments = Transaction::where('party_type', 'FARMER')
            ->where('party_id', $farmer->id)
            ->where('transaction_type', 'FARMER_PAYMENT')
            ->sum('amount');

        $farmer->total_purchases = (float) $purchases;
        $farmer->total_payments = (float) $payments;
        $farmer->net_balance = (float) ($purchases - $payments);

        return response()->json([
            'success' => true,
            'data' => $farmer,
        ]);
    }

    public function update(Request $request, $id)
    {
        $farmer = Farmer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:180',
            'phone' => 'nullable|string|max:30',
            'location' => 'nullable|string|max:180',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'status' => 'sometimes|integer',
        ]);

        $farmer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Farmer updated successfully',
            'data' => $farmer,
        ]);
    }

    public function destroy($id)
    {
        $farmer = Farmer::findOrFail($id);
        $farmer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Farmer deleted successfully',
        ]);
    }

    public function statement(Request $request, $id)
    {
        $farmer = Farmer::findOrFail($id);

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = Transaction::where('party_type', 'FARMER')
            ->where('party_id', $farmer->id);

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
            $prevPurchases = Transaction::where('party_type', 'FARMER')
                ->where('party_id', $farmer->id)
                ->where('transaction_type', 'PURCHASE')
                ->where('transaction_date', '<', $startDate)
                ->sum('amount');

            $prevPayments = Transaction::where('party_type', 'FARMER')
                ->where('party_id', $farmer->id)
                ->where('transaction_type', 'FARMER_PAYMENT')
                ->where('transaction_date', '<', $startDate)
                ->sum('amount');

            $openingBalance = (float) ($prevPurchases - $prevPayments);
        }

        $runningBalance = $openingBalance;
        $items = [];

        foreach ($transactions as $tx) {
            $amount = (float) $tx->amount;
            if ($tx->transaction_type === 'PURCHASE') {
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

        $totalPurchases = (float) Transaction::where('party_type', 'FARMER')
            ->where('party_id', $farmer->id)
            ->where('transaction_type', 'PURCHASE')
            ->sum('amount');

        $totalPayments = (float) Transaction::where('party_type', 'FARMER')
            ->where('party_id', $farmer->id)
            ->where('transaction_type', 'FARMER_PAYMENT')
            ->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'farmer' => $farmer,
                'opening_balance' => $openingBalance,
                'closing_balance' => $runningBalance,
                'total_purchases' => $totalPurchases,
                'total_payments' => $totalPayments,
                'net_balance' => $totalPurchases - $totalPayments,
                'items' => $items,
            ],
        ]);
    }
}
