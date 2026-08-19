<?php
require_once __DIR__ . '/../config/auth_helper.php';

$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');
$expenseType = trim($_GET['expense_type'] ?? '');
$paymentMode = trim($_GET['payment_mode'] ?? '');

$params = [];
$where = ["1=1"];

if (!empty($startDate)) {
    $where[] = "expense_date >= :start_date";
    $params[':start_date'] = $startDate;
}
if (!empty($endDate)) {
    $where[] = "expense_date <= :end_date";
    $params[':end_date'] = $endDate;
}
if (!empty($expenseType)) {
    $where[] = "expense_type = :expense_type";
    $params[':expense_type'] = $expenseType;
}
if (!empty($paymentMode)) {
    $where[] = "payment_mode = :payment_mode";
    $params[':payment_mode'] = $paymentMode;
}

$whereClause = implode(" AND ", $where);

$sql = "SELECT * FROM expenses WHERE $whereClause ORDER BY expense_date DESC, id DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$items = $stmt->fetchAll();

$totalExpenses = 0.0;
$travelTotal = 0.0;
$fuelTotal = 0.0;
$loadingTotal = 0.0;
$unloadingTotal = 0.0;
$vehicleTotal = 0.0;
$categoryBreakdown = [];

foreach ($items as &$item) {
    $item['id'] = (int)$item['id'];
    $item['amount'] = (float)$item['amount'];
    $totalExpenses += $item['amount'];

    $type = $item['expense_type'];
    if (!isset($categoryBreakdown[$type])) {
        $categoryBreakdown[$type] = 0.0;
    }
    $categoryBreakdown[$type] += $item['amount'];

    $typeLower = strtolower($type);
    if ($typeLower === 'travel') $travelTotal += $item['amount'];
    if ($typeLower === 'fuel') $fuelTotal += $item['amount'];
    if ($typeLower === 'loading') $loadingTotal += $item['amount'];
    if ($typeLower === 'unloading') $unloadingTotal += $item['amount'];
    if ($typeLower === 'vehicle') $vehicleTotal += $item['amount'];
}

$transportTotal = $travelTotal + $fuelTotal + $loadingTotal + $unloadingTotal + $vehicleTotal;

sendJson([
    'success' => true,
    'data' => [
        'items' => $items,
        'total_expenses' => $totalExpenses,
        'travel_total' => $travelTotal,
        'fuel_total' => $fuelTotal,
        'transport_total' => $transportTotal,
        'loading_total' => $loadingTotal,
        'unloading_total' => $unloadingTotal,
        'vehicle_total' => $vehicleTotal,
        'category_breakdown' => $categoryBreakdown
    ]
]);
