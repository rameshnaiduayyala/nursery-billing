<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Farmer;
use App\Models\Customer;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Transaction::query();

        if ($startDate = $request->input('start_date')) {
            $query->where('transaction_date', '>=', $startDate);
        }
        if ($endDate = $request->input('end_date')) {
            $query->where('transaction_date', '<=', $endDate);
        }
        if ($partyType = $request->input('party_type')) {
            $query->where('party_type', $partyType);
        }
        if ($partyId = $request->input('party_id')) {
            $query->where('party_id', $partyId);
        }
        if ($txType = $request->input('transaction_type')) {
            $query->where('transaction_type', $txType);
        }
        if ($mode = $request->input('payment_mode')) {
            $query->where('payment_mode', $mode);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('remarks', 'like', "%{$search}%")
                  ->orWhere('payment_mode', 'like', "%{$search}%");
            });
        }

        $limit = max(1, min(500, (int) ($request->input('limit') ?: 25)));
        $page = max(1, (int) ($request->input('page') ?: 1));

        $total = $query->count();
        $transactions = $query->orderBy('transaction_date', 'desc')
            ->orderBy('id', 'desc')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->get();

        // Attach party details
        $farmerIds = $transactions->where('party_type', 'FARMER')->pluck('party_id')->unique();
        $customerIds = $transactions->where('party_type', 'CUSTOMER')->pluck('party_id')->unique();

        $farmers = Farmer::whereIn('id', $farmerIds)->get()->keyBy('id');
        $customers = Customer::whereIn('id', $customerIds)->get()->keyBy('id');

        $transactions->transform(function ($tx) use ($farmers, $customers) {
            if ($tx->party_type === 'FARMER') {
                $party = $farmers->get($tx->party_id);
                $tx->party_name = $party ? $party->name : 'Unknown Farmer';
                $tx->party_phone = $party ? $party->phone : null;
            } else {
                $party = $customers->get($tx->party_id);
                $tx->party_name = $party ? $party->name : 'Unknown Customer';
                $tx->party_phone = $party ? $party->phone : null;
            }
            $tx->amount = (float) $tx->amount;
            return $tx;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $transactions,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($total / $limit),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'transaction_date' => 'required|date',
            'party_type' => 'required|in:FARMER,CUSTOMER',
            'party_id' => 'required|integer',
            'transaction_type' => 'required|in:PURCHASE,FARMER_PAYMENT,SALE,CUSTOMER_RECEIPT',
            'amount' => 'required|numeric|min:0.01',
            'payment_mode' => 'nullable|string|max:40',
            'remarks' => 'nullable|string|max:500',
        ]);

        if (empty($validated['payment_mode'])) {
            $validated['payment_mode'] = 'Cash';
        }

        // Validate party existence
        if ($validated['party_type'] === 'FARMER') {
            Farmer::findOrFail($validated['party_id']);
        } else {
            Customer::findOrFail($validated['party_id']);
        }

        $tx = Transaction::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Transaction recorded successfully',
            'data' => $tx,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $tx = Transaction::findOrFail($id);

        $validated = $request->validate([
            'transaction_date' => 'sometimes|required|date',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'payment_mode' => 'nullable|string|max:40',
            'remarks' => 'nullable|string|max:500',
        ]);

        $tx->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Transaction updated successfully',
            'data' => $tx,
        ]);
    }

    public function destroy($id)
    {
        $tx = Transaction::findOrFail($id);
        $tx->delete();

        return response()->json([
            'success' => true,
            'message' => 'Transaction deleted successfully',
        ]);
    }
}
