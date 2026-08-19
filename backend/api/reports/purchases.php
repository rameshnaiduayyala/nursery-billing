<?php
require_once __DIR__ . '/../config/auth_helper.php';

$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');
$farmerId = (int)($_GET['farmer_id'] ?? 0);
$paymentMode = trim($_GET['payment_mode'] ?? '');

$params = [];
$where = ["t.transaction_type IN ('PURCHASE', 'FARMER_PAYMENT')"];

if (!empty($startDate)) {
    $where[] = "t.transaction_date >= :start_date";
    $params[':start_date'] = $startDate;
}
if (!empty($endDate)) {
    $where[] = "t.transaction_date <= :end_date";
    $params[':end_date'] = $endDate;
}
if ($farmerId > 0) {
    $where[] = "t.party_id = :farmer_id";
    $params[':farmer_id'] = $farmerId;
}
if (!empty($paymentMode)) {
    $where[] = "t.payment_mode = :payment_mode";
    $params[':payment_mode'] = $paymentMode;
}

$whereClause = implode(" AND ", $where);

$sql = "
    SELECT 
        t.*,
        f.name AS farmer_name,
        f.phone AS farmer_phone,
        f.location AS farmer_location
    FROM transactions t
    LEFT JOIN farmers f ON t.party_id = f.id
    WHERE $whereClause
    ORDER BY t.transaction_date DESC, t.id DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$items = $stmt->fetchAll();

$totalPurchases = 0.0;
$totalPayments = 0.0;

foreach ($items as &$item) {
    $item['id'] = (int)$item['id'];
    $item['amount'] = (float)$item['amount'];
    if ($item['transaction_type'] === 'PURCHASE') {
        $totalPurchases += $item['amount'];
    } else {
        $totalPayments += $item['amount'];
    }
}

sendJson([
    'success' => true,
    'data' => [
        'items' => $items,
        'total_purchases' => $totalPurchases,
        'total_payments' => $totalPayments,
        'net_outstanding' => max(0, $totalPurchases - $totalPayments)
    ]
]);
