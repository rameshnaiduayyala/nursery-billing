<?php
require_once __DIR__ . '/../config/auth_helper.php';

$startDate = trim($_GET['start_date'] ?? date('Y-01-01'));
$endDate = trim($_GET['end_date'] ?? date('Y-12-31'));

$paramsTx = [':start_date' => $startDate, ':end_date' => $endDate];
$paramsExp = [':start_date' => $startDate, ':end_date' => $endDate];

// 1. Monthly Sales & Purchases
$stmtMonthlyTx = $pdo->prepare("
    SELECT 
        DATE_FORMAT(transaction_date, '%Y-%m') AS month_key,
        DATE_FORMAT(transaction_date, '%b %Y') AS month_label,
        COALESCE(SUM(CASE WHEN transaction_type = 'SALE' THEN amount ELSE 0 END), 0) AS sales,
        COALESCE(SUM(CASE WHEN transaction_type = 'PURCHASE' THEN amount ELSE 0 END), 0) AS purchases
    FROM transactions
    WHERE transaction_date >= :start_date AND transaction_date <= :end_date
    GROUP BY month_key, month_label
    ORDER BY month_key ASC
");
$stmtMonthlyTx->execute($paramsTx);
$monthlyTx = $stmtMonthlyTx->fetchAll();

// 2. Monthly Expenses
$stmtMonthlyExp = $pdo->prepare("
    SELECT 
        DATE_FORMAT(expense_date, '%Y-%m') AS month_key,
        DATE_FORMAT(expense_date, '%b %Y') AS month_label,
        COALESCE(SUM(amount), 0) AS expenses
    FROM expenses
    WHERE expense_date >= :start_date AND expense_date <= :end_date
    GROUP BY month_key, month_label
    ORDER BY month_key ASC
");
$stmtMonthlyExp->execute($paramsExp);
$monthlyExp = $stmtMonthlyExp->fetchAll();

// Merge monthly data by month_key
$monthsMap = [];

foreach ($monthlyTx as $row) {
    $key = $row['month_key'];
    $monthsMap[$key] = [
        'label' => $row['month_label'],
        'sales' => (float)$row['sales'],
        'purchases' => (float)$row['purchases'],
        'expenses' => 0.0
    ];
}

foreach ($monthlyExp as $row) {
    $key = $row['month_key'];
    if (!isset($monthsMap[$key])) {
        $monthsMap[$key] = [
            'label' => $row['month_label'],
            'sales' => 0.0,
            'purchases' => 0.0,
            'expenses' => 0.0
        ];
    }
    $monthsMap[$key]['expenses'] += (float)$row['expenses'];
}

ksort($monthsMap);

$monthlyLabels = [];
$salesData = [];
$purchasesData = [];
$expensesData = [];
$profitData = [];

foreach ($monthsMap as $key => $item) {
    $monthlyLabels[] = $item['label'];
    $salesData[] = $item['sales'];
    $purchasesData[] = $item['purchases'];
    $expensesData[] = $item['expenses'];
    $profitData[] = $item['sales'] - $item['purchases'] - $item['expenses'];
}

// 3. Expense Category Breakdown
$stmtCat = $pdo->prepare("
    SELECT expense_type, COALESCE(SUM(amount), 0) AS total
    FROM expenses
    WHERE expense_date >= :start_date AND expense_date <= :end_date
    GROUP BY expense_type
    ORDER BY total DESC
");
$stmtCat->execute($paramsExp);
$categoriesData = $stmtCat->fetchAll();

$categoryLabels = [];
$categoryValues = [];

foreach ($categoriesData as $cat) {
    $categoryLabels[] = $cat['expense_type'];
    $categoryValues[] = (float)$cat['total'];
}

sendJson([
    'success' => true,
    'data' => [
        'labels' => $monthlyLabels,
        'sales' => $salesData,
        'purchases' => $purchasesData,
        'expenses' => $expensesData,
        'profit' => $profitData,
        'categories' => [
            'labels' => $categoryLabels,
            'values' => $categoryValues
        ]
    ]
]);
