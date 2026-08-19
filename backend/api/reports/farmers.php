<?php
require_once __DIR__ . '/../config/auth_helper.php';

$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');
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
    $whereSearch = " AND (f.name LIKE :search OR f.phone LIKE :search OR f.location LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

$sql = "
    SELECT 
        f.id,
        f.name,
        f.phone,
        f.location,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'PURCHASE' THEN t.amount ELSE 0 END), 0) AS period_purchases,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'FARMER_PAYMENT' THEN t.amount ELSE 0 END), 0) AS period_payments
    FROM farmers f
    LEFT JOIN transactions t ON t.party_type = 'FARMER' AND t.party_id = f.id $txWhere
    WHERE 1=1 $whereSearch
    GROUP BY f.id
    ORDER BY f.name ASC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$farmers = $stmt->fetchAll();

$grandPurchases = 0.0;
$grandPayments = 0.0;
$grandOutstanding = 0.0;

foreach ($farmers as &$f) {
    $f['id'] = (int)$f['id'];
    $f['period_purchases'] = (float)$f['period_purchases'];
    $f['period_payments'] = (float)$f['period_payments'];
    
    // Overall outstanding for each farmer
    $stmtAll = $pdo->prepare("
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'PURCHASE' THEN amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN transaction_type = 'FARMER_PAYMENT' THEN amount ELSE 0 END), 0) AS total_ob
        FROM transactions WHERE party_type = 'FARMER' AND party_id = :id
    ");
    $stmtAll->execute([':id' => $f['id']]);
    $f['outstanding'] = (float)$stmtAll->fetch()['total_ob'];

    $grandPurchases += $f['period_purchases'];
    $grandPayments += $f['period_payments'];
    $grandOutstanding += $f['outstanding'];
}

sendJson([
    'success' => true,
    'data' => [
        'items' => $farmers,
        'grand_purchases' => $grandPurchases,
        'grand_payments' => $grandPayments,
        'grand_outstanding' => $grandOutstanding
    ]
]);
