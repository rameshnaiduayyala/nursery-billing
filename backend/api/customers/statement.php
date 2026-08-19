<?php
require_once __DIR__ . '/../config/auth_helper.php';

$id = (int)($_GET['id'] ?? 0);
$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');

if (!$id) {
    sendError('Customer ID is required.');
}

$stmt = $pdo->prepare("SELECT * FROM customers WHERE id = :id");
$stmt->execute([':id' => $id]);
$customer = $stmt->fetch();

if (!$customer) {
    sendError('Customer not found.', 404);
}

// Opening balance calculation before $startDate
$openingBalance = 0.0;
if (!empty($startDate)) {
    $stmtOb = $pdo->prepare("
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'SALE' THEN amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN transaction_type = 'CUSTOMER_RECEIPT' THEN amount ELSE 0 END), 0) AS ob
        FROM transactions
        WHERE party_type = 'CUSTOMER' AND party_id = :id AND transaction_date < :start_date
    ");
    $stmtOb->execute([':id' => $id, ':start_date' => $startDate]);
    $openingBalance = (float)$stmtOb->fetch()['ob'];
}

$query = "SELECT * FROM transactions WHERE party_type = 'CUSTOMER' AND party_id = :id";
$params = [':id' => $id];

if (!empty($startDate)) {
    $query .= " AND transaction_date >= :start_date";
    $params[':start_date'] = $startDate;
}
if (!empty($endDate)) {
    $query .= " AND transaction_date <= :end_date";
    $params[':end_date'] = $endDate;
}

$query .= " ORDER BY transaction_date ASC, id ASC";

$stmtTx = $pdo->prepare($query);
$stmtTx->execute($params);
$transactions = $stmtTx->fetchAll();

$runningBalance = $openingBalance;
$totalSales = 0.0;
$totalReceipts = 0.0;

foreach ($transactions as &$tx) {
    $tx['id'] = (int)$tx['id'];
    $tx['amount'] = (float)$tx['amount'];
    if ($tx['transaction_type'] === 'SALE') {
        $totalSales += $tx['amount'];
        $runningBalance += $tx['amount'];
    } else { // CUSTOMER_RECEIPT
        $totalReceipts += $tx['amount'];
        $runningBalance -= $tx['amount'];
    }
    $tx['running_balance'] = $runningBalance;
}

sendJson([
    'success' => true,
    'data' => [
        'customer' => $customer,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'opening_balance' => $openingBalance,
        'total_sales' => $totalSales,
        'total_receipts' => $totalReceipts,
        'closing_balance' => $runningBalance,
        'transactions' => $transactions
    ]
]);
