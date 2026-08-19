<?php
require_once __DIR__ . '/../config/auth_helper.php';

$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');
$partyType = trim($_GET['party_type'] ?? '');
$partyId = (int)($_GET['party_id'] ?? 0);
$transactionType = trim($_GET['transaction_type'] ?? '');
$paymentMode = trim($_GET['payment_mode'] ?? '');
$search = trim($_GET['search'] ?? '');

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = max(1, min(100, (int)($_GET['limit'] ?? 50)));
$offset = ($page - 1) * $limit;

$params = [];
$where = ["1=1"];

if (!empty($startDate)) {
    $where[] = "t.transaction_date >= :start_date";
    $params[':start_date'] = $startDate;
}
if (!empty($endDate)) {
    $where[] = "t.transaction_date <= :end_date";
    $params[':end_date'] = $endDate;
}
if (!empty($partyType)) {
    $where[] = "t.party_type = :party_type";
    $params[':party_type'] = strtoupper($partyType);
}
if ($partyId > 0) {
    $where[] = "t.party_id = :party_id";
    $params[':party_id'] = $partyId;
}
if (!empty($transactionType)) {
    $where[] = "t.transaction_type = :transaction_type";
    $params[':transaction_type'] = strtoupper($transactionType);
}
if (!empty($paymentMode)) {
    $where[] = "t.payment_mode = :payment_mode";
    $params[':payment_mode'] = $paymentMode;
}
if (!empty($search)) {
    $where[] = "(t.remarks LIKE :search OR f.name LIKE :search OR c.name LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

$whereClause = implode(" AND ", $where);

// Count total
$countSql = "
    SELECT COUNT(*) as total 
    FROM transactions t
    LEFT JOIN farmers f ON t.party_type = 'FARMER' AND t.party_id = f.id
    LEFT JOIN customers c ON t.party_type = 'CUSTOMER' AND t.party_id = c.id
    WHERE $whereClause
";
$stmtCount = $pdo->prepare($countSql);
$stmtCount->execute($params);
$totalRecords = (int)$stmtCount->fetch()['total'];

// Fetch paginated
$sql = "
    SELECT 
        t.*,
        CASE 
            WHEN t.party_type = 'FARMER' THEN f.name
            WHEN t.party_type = 'CUSTOMER' THEN c.name
            ELSE 'Unknown'
        END AS party_name,
        CASE 
            WHEN t.party_type = 'CUSTOMER' THEN c.type
            ELSE NULL
        END AS customer_type
    FROM transactions t
    LEFT JOIN farmers f ON t.party_type = 'FARMER' AND t.party_id = f.id
    LEFT JOIN customers c ON t.party_type = 'CUSTOMER' AND t.party_id = c.id
    WHERE $whereClause
    ORDER BY t.transaction_date DESC, t.id DESC
    LIMIT $limit OFFSET $offset
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

foreach ($rows as &$r) {
    $r['id'] = (int)$r['id'];
    $r['party_id'] = (int)$r['party_id'];
    $r['amount'] = (float)$r['amount'];
}

sendJson([
    'success' => true,
    'data' => [
        'items' => $rows,
        'total' => $totalRecords,
        'page' => $page,
        'limit' => $limit,
        'pages' => ceil($totalRecords / $limit)
    ]
]);
