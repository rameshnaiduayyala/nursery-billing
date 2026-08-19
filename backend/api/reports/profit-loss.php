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

// 1. Transactions: Sales & Purchases
$stmtTx = $pdo->prepare("
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'SALE' THEN amount ELSE 0 END), 0) AS gross_sales,
        COALESCE(SUM(CASE WHEN transaction_type = 'PURCHASE' THEN amount ELSE 0 END), 0) AS plant_purchases
    FROM transactions
    $txWhere
");
$stmtTx->execute($paramsTx);
$txData = $stmtTx->fetch();

$grossSales = (float)$txData['gross_sales'];
$plantPurchases = (float)$txData['plant_purchases'];
$grossMargin = $grossSales - $plantPurchases;

// 2. Expenses Categorized
$stmtExp = $pdo->prepare("
    SELECT expense_type, COALESCE(SUM(amount), 0) AS total 
    FROM expenses 
    $expWhere 
    GROUP BY expense_type
    ORDER BY total DESC
");
$stmtExp->execute($paramsExp);
$expRows = $stmtExp->fetchAll();

$expenseBreakdown = [];
$totalExpenses = 0.0;

// Initialize standard categories
$standardCategories = ['Travel', 'Fuel', 'Loading', 'Unloading', 'Labour', 'Packing', 'Commission', 'Vehicle', 'Other'];
foreach ($standardCategories as $cat) {
    $expenseBreakdown[$cat] = 0.0;
}

foreach ($expRows as $row) {
    $type = $row['expense_type'];
    $val = (float)$row['total'];
    $expenseBreakdown[$type] = $val;
    $totalExpenses += $val;
}

$netProfit = $grossSales - $plantPurchases - $totalExpenses;

sendJson([
    'success' => true,
    'data' => [
        'start_date' => $startDate,
        'end_date' => $endDate,
        'gross_sales' => $grossSales,
        'plant_purchases' => $plantPurchases,
        'gross_margin' => $grossMargin,
        'expenses' => $expenseBreakdown,
        'total_expenses' => $totalExpenses,
        'net_profit' => $netProfit
    ]
]);
