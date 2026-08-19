<?php
require_once __DIR__ . '/../config/auth_helper.php';

$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');
$customerId = (int)($_GET['customer_id'] ?? 0);
$paymentMode = trim($_GET['payment_mode'] ?? '');

$params = [];
$where = ["t.transaction_type IN ('SALE', 'CUSTOMER_RECEIPT')"];

if (!empty($startDate)) {
    $where[] = "t.transaction_date >= :start_date";
    $params[':start_date'] = $startDate;
}
if (!empty($endDate)) {
    $where[] = "t.transaction_date <= :end_date";
    $params[':end_date'] = $endDate;
}
if ($customerId > 0) {
    $where[] = "t.party_id = :customer_id";
    $params[':customer_id'] = $customerId;
}
if (!empty($paymentMode)) {
    $where[] = "t.payment_mode = :payment_mode";
    $params[':payment_mode'] = $paymentMode;
}

$whereClause = implode(" AND ", $where);

$sql = "
    SELECT 
        t.*,
        c.name AS customer_name,
        c.type AS customer_type,
        c.phone AS customer_phone
    FROM transactions t
    LEFT JOIN customers c ON t.party_id = c.id
    WHERE $whereClause
    ORDER BY t.transaction_date DESC, t.id DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$items = $stmt->fetchAll();

$totalSales = 0.0;
$totalReceipts = 0.0;

foreach ($items as &$item) {
    $item['id'] = (int)$item['id'];
    $item['amount'] = (float)$item['amount'];
    if ($item['transaction_type'] === 'SALE') {
        $totalSales += $item['amount'];
    } else {
        $totalReceipts += $item['amount'];
    }
}

sendJson([
    'success' => true,
    'data' => [
        'items' => $items,
        'total_sales' => $totalSales,
        'total_receipts' => $totalReceipts,
        'net_outstanding' => max(0, $totalSales - $totalReceipts)
    ]
]);
