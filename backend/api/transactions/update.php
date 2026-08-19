<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();
$id = (int)($input['id'] ?? 0);
$transactionDate = trim($input['transaction_date'] ?? date('Y-m-d'));
$partyType = strtoupper(trim($input['party_type'] ?? ''));
$partyId = (int)($input['party_id'] ?? 0);
$transactionType = strtoupper(trim($input['transaction_type'] ?? ''));
$amount = (float)($input['amount'] ?? 0);
$paymentMode = trim($input['payment_mode'] ?? 'Cash');
$remarks = trim($input['remarks'] ?? '');

if (!$id) {
    sendError('Transaction ID is required.');
}

if (!in_array($partyType, ['FARMER', 'CUSTOMER'])) {
    sendError('Party Type must be either FARMER or CUSTOMER.');
}

if (!in_array($transactionType, ['PURCHASE', 'FARMER_PAYMENT', 'SALE', 'CUSTOMER_RECEIPT'])) {
    sendError('Invalid transaction type.');
}

if ($amount <= 0) {
    sendError('Amount must be greater than 0.');
}

$stmt = $pdo->prepare("
    UPDATE transactions 
    SET transaction_date = :transaction_date,
        party_type = :party_type,
        party_id = :party_id,
        transaction_type = :transaction_type,
        amount = :amount,
        payment_mode = :payment_mode,
        remarks = :remarks
    WHERE id = :id
");

$stmt->execute([
    ':transaction_date' => $transactionDate,
    ':party_type' => $partyType,
    ':party_id' => $partyId,
    ':transaction_type' => $transactionType,
    ':amount' => $amount,
    ':payment_mode' => $paymentMode,
    ':remarks' => $remarks,
    ':id' => $id
]);

sendJson([
    'success' => true,
    'message' => 'Transaction updated successfully'
]);
