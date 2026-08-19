<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();
$id = (int)($input['id'] ?? 0);
$expenseDate = trim($input['expense_date'] ?? date('Y-m-d'));
$expenseType = trim($input['expense_type'] ?? 'Other');
$description = trim($input['description'] ?? '');
$amount = (float)($input['amount'] ?? 0);
$paymentMode = trim($input['payment_mode'] ?? 'Cash');
$remarks = trim($input['remarks'] ?? '');

if (!$id) {
    sendError('Expense ID is required.');
}

if ($amount <= 0) {
    sendError('Amount must be greater than 0.');
}

$stmt = $pdo->prepare("
    UPDATE expenses 
    SET expense_date = :expense_date,
        expense_type = :expense_type,
        description = :description,
        amount = :amount,
        payment_mode = :payment_mode,
        remarks = :remarks
    WHERE id = :id
");

$stmt->execute([
    ':expense_date' => $expenseDate,
    ':expense_type' => $expenseType,
    ':description' => $description,
    ':amount' => $amount,
    ':payment_mode' => $paymentMode,
    ':remarks' => $remarks,
    ':id' => $id
]);

sendJson([
    'success' => true,
    'message' => 'Expense updated successfully'
]);
