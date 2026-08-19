<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();

$transactionDate = trim($input['transaction_date'] ?? date('Y-m-d'));
$partyType = strtoupper(trim($input['party_type'] ?? ''));
$partyId = (int)($input['party_id'] ?? 0);
$partyName = trim($input['party_name'] ?? '');
$transactionType = strtoupper(trim($input['transaction_type'] ?? ''));
$amount = (float)($input['amount'] ?? 0);
$paymentMode = trim($input['payment_mode'] ?? 'Cash');
$remarks = trim($input['remarks'] ?? '');

// Map convenient money_type aliases if passed from UI
if (empty($transactionType) && !empty($input['money_type'])) {
    $moneyType = trim($input['money_type']);
    if (in_array($moneyType, ['Plant Purchase', 'PURCHASE'])) {
        $transactionType = 'PURCHASE';
    } elseif (in_array($moneyType, ['Advance', 'Balance Payment', 'Other Payment', 'FARMER_PAYMENT'])) {
        $transactionType = 'FARMER_PAYMENT';
    } elseif (in_array($moneyType, ['Plant Sale', 'SALE'])) {
        $transactionType = 'SALE';
    } elseif (in_array($moneyType, ['Advance Received', 'Balance Received', 'Other Income', 'CUSTOMER_RECEIPT'])) {
        $transactionType = 'CUSTOMER_RECEIPT';
    }
}

if (!in_array($partyType, ['FARMER', 'CUSTOMER'])) {
    sendError('Party Type must be either FARMER or CUSTOMER.');
}

if (!in_array($transactionType, ['PURCHASE', 'FARMER_PAYMENT', 'SALE', 'CUSTOMER_RECEIPT'])) {
    sendError('Invalid transaction type provided.');
}

if ($amount <= 0) {
    sendError('Please enter a valid amount greater than 0.');
}

// Handle direct entry for new Farmer or Customer if party_id is 0 but party_name is supplied
if ($partyId === 0 && !empty($partyName)) {
    if ($partyType === 'FARMER') {
        $stmtSearch = $pdo->prepare("SELECT id FROM farmers WHERE LOWER(name) = LOWER(:name)");
        $stmtSearch->execute([':name' => $partyName]);
        $existing = $stmtSearch->fetch();
        if ($existing) {
            $partyId = (int)$existing['id'];
        } else {
            $stmtIns = $pdo->prepare("INSERT INTO farmers (name, status) VALUES (:name, 1)");
            $stmtIns->execute([':name' => $partyName]);
            $partyId = (int)$pdo->lastInsertId();
        }
    } else { // CUSTOMER
        $stmtSearch = $pdo->prepare("SELECT id FROM customers WHERE LOWER(name) = LOWER(:name)");
        $stmtSearch->execute([':name' => $partyName]);
        $existing = $stmtSearch->fetch();
        if ($existing) {
            $partyId = (int)$existing['id'];
        } else {
            $customerType = strtoupper(trim($input['customer_type'] ?? 'CUSTOMER'));
            $stmtIns = $pdo->prepare("INSERT INTO customers (name, type, status) VALUES (:name, :type, 1)");
            $stmtIns->execute([':name' => $partyName, ':type' => $customerType]);
            $partyId = (int)$pdo->lastInsertId();
        }
    }
}

if ($partyId <= 0) {
    sendError('Please select a valid ' . strtolower($partyType) . ' or enter a name.');
}

$stmt = $pdo->prepare("
    INSERT INTO transactions 
    (transaction_date, party_type, party_id, transaction_type, amount, payment_mode, remarks)
    VALUES (:transaction_date, :party_type, :party_id, :transaction_type, :amount, :payment_mode, :remarks)
");

$stmt->execute([
    ':transaction_date' => $transactionDate,
    ':party_type' => $partyType,
    ':party_id' => $partyId,
    ':transaction_type' => $transactionType,
    ':amount' => $amount,
    ':payment_mode' => $paymentMode,
    ':remarks' => $remarks
]);

$id = $pdo->lastInsertId();

sendJson([
    'success' => true,
    'message' => 'Transaction saved successfully',
    'data' => [
        'id' => (int)$id,
        'transaction_date' => $transactionDate,
        'party_type' => $partyType,
        'party_id' => $partyId,
        'transaction_type' => $transactionType,
        'amount' => $amount,
        'payment_mode' => $paymentMode,
        'remarks' => $remarks
    ]
]);
