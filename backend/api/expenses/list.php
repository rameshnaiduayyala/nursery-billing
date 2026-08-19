<?php
require_once __DIR__ . '/../config/auth_helper.php';

$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');
$expenseType = trim($_GET['expense_type'] ?? '');
$paymentMode = trim($_GET['payment_mode'] ?? '');
$search = trim($_GET['search'] ?? '');

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
if (!empty($search)) {
    $where[] = "(description LIKE :search OR remarks LIKE :search OR expense_type LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

$whereClause = implode(" AND ", $where);

$sql = "SELECT * FROM expenses WHERE $whereClause ORDER BY expense_date DESC, id DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$expenses = $stmt->fetchAll();

$totalAmount = 0.0;
$travelTotal = 0.0;
$fuelTotal = 0.0;
$transportTotal = 0.0;

foreach ($expenses as &$exp) {
    $exp['id'] = (int)$exp['id'];
    $exp['amount'] = (float)$exp['amount'];
    $totalAmount += $exp['amount'];

    $typeLower = strtolower($exp['expense_type']);
    if ($typeLower === 'travel') {
        $travelTotal += $exp['amount'];
    }
    if ($typeLower === 'fuel') {
        $fuelTotal += $exp['amount'];
    }
    if (in_array($typeLower, ['travel', 'fuel', 'vehicle', 'loading', 'unloading'])) {
        $transportTotal += $exp['amount'];
    }
}

sendJson([
    'success' => true,
    'data' => [
        'items' => $expenses,
        'total_amount' => $totalAmount,
        'travel_total' => $travelTotal,
        'fuel_total' => $fuelTotal,
        'transport_total' => $transportTotal
    ]
]);
