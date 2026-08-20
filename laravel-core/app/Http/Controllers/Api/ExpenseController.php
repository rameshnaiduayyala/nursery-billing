<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::query();

        if ($startDate = $request->input('start_date')) {
            $query->where('expense_date', '>=', $startDate);
        }
        if ($endDate = $request->input('end_date')) {
            $query->where('expense_date', '<=', $endDate);
        }
        if ($type = $request->input('expense_type')) {
            $query->where('expense_type', $type);
        }
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('expense_type', 'like', "%{$search}%")
                  ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        $expenses = $query->orderBy('expense_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $totalAmount = (float) $expenses->sum('amount');
        $travelTotal = (float) $expenses->where('expense_type', 'Travel')->sum('amount');
        $fuelTotal = (float) $expenses->where('expense_type', 'Fuel')->sum('amount');
        $transportTotal = (float) $expenses->whereIn('expense_type', ['Vehicle', 'Transport'])->sum('amount');

        $expenses->transform(function ($e) {
            $e->amount = (float) $e->amount;
            return $e;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $expenses,
                'total_amount' => $totalAmount,
                'travel_total' => $travelTotal,
                'fuel_total' => $fuelTotal,
                'transport_total' => $transportTotal,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_date' => 'required|date',
            'expense_type' => 'required|string|max:80',
            'description' => 'nullable|string|max:500',
            'amount' => 'required|numeric|min:0.01',
            'payment_mode' => 'nullable|string|max:40',
            'remarks' => 'nullable|string|max:500',
        ]);

        if (empty($validated['payment_mode'])) {
            $validated['payment_mode'] = 'Cash';
        }

        $expense = Expense::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Expense added successfully',
            'data' => $expense,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);

        $validated = $request->validate([
            'expense_date' => 'sometimes|required|date',
            'expense_type' => 'sometimes|required|string|max:80',
            'description' => 'nullable|string|max:500',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'payment_mode' => 'nullable|string|max:40',
            'remarks' => 'nullable|string|max:500',
        ]);

        $expense->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Expense updated successfully',
            'data' => $expense,
        ]);
    }

    public function destroy($id)
    {
        $expense = Expense::findOrFail($id);
        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense deleted successfully',
        ]);
    }
}
