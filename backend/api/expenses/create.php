<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();
$expenseDate = trim($input['expense_date'] ?? date('Y-m-d'));
$expenseType = trim($input['expense_type'] ?? 'Other');
$description = trim($input['description'] ?? '');
$amount = (float)($input['amount'] ?? 0);
$paymentMode = trim($input['payment_mode'] ?? 'Cash');
$remarks = trim($input['remarks'] ?? '');

if (empty($expenseType)) {
    sendError('Expense Type is required.');
}

if ($amount <= 0) {
    sendError('Expense Amount must be greater than 0.');
}

$stmt = $pdo->prepare("
    INSERT INTO expenses 
    (expense_date, expense_type, description, amount, payment_mode, remarks)
    VALUES (:expense_date, :expense_type, :description, :amount, :payment_mode, :remarks)
");

$stmt->execute([
    ':expense_date' => $expenseDate,
    ':expense_type' => $expenseType,
    ':description' => $description,
    ':amount' => $amount,
    ':payment_mode' => $paymentMode,
    ':remarks' => $remarks
]);

$id = $pdo->lastInsertId();

sendJson([
    'success' => true,
    'message' => 'Expense saved successfully',
    'data' => [
        'id' => (int)$id,
        'expense_date' => $expenseDate,
        'expense_type' => $expenseType,
        'description' => $description,
        'amount' => $amount,
        'payment_mode' => $paymentMode,
        'remarks' => $remarks
    ]
]);
