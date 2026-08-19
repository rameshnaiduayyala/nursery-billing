<?php
require_once __DIR__ . '/../config/auth_helper.php';

$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');

$txWhere = "WHERE 1=1";
$expWhere = "WHERE 1=1";
$paramsTx = [];
$paramsExp = [];

if (!empty($startDate)) {
    $txWhere .= " AND transaction_date >= :start_date";
    $expWhere .= " AND expense_date >= :start_date";
    $paramsTx[':start_date'] = $startDate;
    $paramsExp[':start_date'] = $startDate;
}
if (!empty($endDate)) {
    $txWhere .= " AND transaction_date <= :end_date";
    $expWhere .= " AND expense_date <= :end_date";
    $paramsTx[':end_date'] = $endDate;
    $paramsExp[':end_date'] = $endDate;
}

// 1. Transaction Totals
$stmtTx = $pdo->prepare("
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'SALE' THEN amount ELSE 0 END), 0) AS total_sales,
        COALESCE(SUM(CASE WHEN transaction_type = 'CUSTOMER_RECEIPT' THEN amount ELSE 0 END), 0) AS customer_receipts,
        COALESCE(SUM(CASE WHEN transaction_type = 'PURCHASE' THEN amount ELSE 0 END), 0) AS farmer_purchases,
        COALESCE(SUM(CASE WHEN transaction_type = 'FARMER_PAYMENT' THEN amount ELSE 0 END), 0) AS farmer_payments
    FROM transactions
    $txWhere
");
$stmtTx->execute($paramsTx);
$txData = $stmtTx->fetch();

$totalSales = (float)$txData['total_sales'];
$customerReceipts = (float)$txData['customer_receipts'];
$farmerPurchases = (float)$txData['farmer_purchases'];
$farmerPayments = (float)$txData['farmer_payments'];

// 2. Expenses Total
$stmtExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses $expWhere");
$stmtExp->execute($paramsExp);
$totalExpenses = (float)$stmtExp->fetch()['total_expenses'];

// 3. Accounting Calculations
$customerOutstanding = max(0, $totalSales - $customerReceipts);
$farmerOutstanding = max(0, $farmerPurchases - $farmerPayments);
$netProfit = $totalSales - $farmerPurchases - $totalExpenses;

// 4. Payment Mode Movement Breakdown (Inflows: Receipts, Outflows: Farmer Payments + Expenses)
$stmtModeTx = $pdo->prepare("
    SELECT 
        payment_mode,
        COALESCE(SUM(CASE WHEN transaction_type = 'CUSTOMER_RECEIPT' THEN amount ELSE 0 END), 0) AS inflow,
        COALESCE(SUM(CASE WHEN transaction_type = 'FARMER_PAYMENT' THEN amount ELSE 0 END), 0) AS tx_outflow
    FROM transactions
    $txWhere
    GROUP BY payment_mode
");
$stmtModeTx->execute($paramsTx);
$modeData = [];

while ($row = $stmtModeTx->fetch()) {
    $mode = $row['payment_mode'] ?: 'Cash';
    if (!isset($modeData[$mode])) {
        $modeData[$mode] = ['inflow' => 0.0, 'outflow' => 0.0];
    }
    $modeData[$mode]['inflow'] += (float)$row['inflow'];
    $modeData[$mode]['outflow'] += (float)$row['tx_outflow'];
}

$stmtModeExp = $pdo->prepare("
    SELECT payment_mode, COALESCE(SUM(amount), 0) AS exp_outflow 
    FROM expenses 
    $expWhere 
    GROUP BY payment_mode
");
$stmtModeExp->execute($paramsExp);
while ($row = $stmtModeExp->fetch()) {
    $mode = $row['payment_mode'] ?: 'Cash';
    if (!isset($modeData[$mode])) {
        $modeData[$mode] = ['inflow' => 0.0, 'outflow' => 0.0];
    }
    $modeData[$mode]['outflow'] += (float)$row['exp_outflow'];
}

sendJson([
    'success' => true,
    'data' => [
        'total_sales' => $totalSales,
        'customer_receipts' => $customerReceipts,
        'farmer_purchases' => $farmerPurchases,
        'farmer_payments' => $farmerPayments,
        'total_expenses' => $totalExpenses,
        'net_profit' => $netProfit,
        'customer_outstanding' => $customerOutstanding,
        'farmer_outstanding' => $farmerOutstanding,
        'payment_modes' => $modeData
    ]
]);