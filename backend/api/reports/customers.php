<?php
require_once __DIR__ . '/../config/auth_helper.php';

$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');
$type = trim($_GET['type'] ?? '');
$search = trim($_GET['search'] ?? '');

$params = [];
$txWhere = "";
if (!empty($startDate)) {
    $txWhere .= " AND t.transaction_date >= :start_date";
    $params[':start_date'] = $startDate;
}
if (!empty($endDate)) {
    $txWhere .= " AND t.transaction_date <= :end_date";
    $params[':end_date'] = $endDate;
}

$whereSearch = "";
if (!empty($search)) {
    $whereSearch .= " AND (c.name LIKE :search OR c.phone LIKE :search OR c.city LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}
if (!empty($type)) {
    $whereSearch .= " AND c.type = :type";
    $params[':type'] = strtoupper($type);
}

$sql = "
    SELECT 
        c.id,
        c.name,
        c.type,
        c.phone,
        c.city,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.amount ELSE 0 END), 0) AS period_sales,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'CUSTOMER_RECEIPT' THEN t.amount ELSE 0 END), 0) AS period_receipts
    FROM customers c
    LEFT JOIN transactions t ON t.party_type = 'CUSTOMER' AND t.party_id = c.id $txWhere
    WHERE 1=1 $whereSearch
    GROUP BY c.id
    ORDER BY c.name ASC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$customers = $stmt->fetchAll();

$grandSales = 0.0;
$grandReceipts = 0.0;
$grandOutstanding = 0.0;

foreach ($customers as &$c) {
    $c['id'] = (int)$c['id'];
    $c['period_sales'] = (float)$c['period_sales'];
    $c['period_receipts'] = (float)$c['period_receipts'];

    $stmtAll = $pdo->prepare("
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'SALE' THEN amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN transaction_type = 'CUSTOMER_RECEIPT' THEN amount ELSE 0 END), 0) AS total_ob
        FROM transactions WHERE party_type = 'CUSTOMER' AND party_id = :id
    ");
    $stmtAll->execute([':id' => $c['id']]);
    $c['outstanding'] = (float)$stmtAll->fetch()['total_ob'];

    $grandSales += $c['period_sales'];
    $grandReceipts += $c['period_receipts'];
    $grandOutstanding += $c['outstanding'];
}

sendJson([
    'success' => true,
    'data' => [
        'items' => $customers,
        'grand_sales' => $grandSales,
        'grand_receipts' => $grandReceipts,
        'grand_outstanding' => $grandOutstanding
    ]
]);
