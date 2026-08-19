<?php
require_once __DIR__ . '/../config/auth_helper.php';

$search = trim($_GET['search'] ?? '');
$params = [];

$sql = "
    SELECT 
        f.id,
        f.name,
        f.phone,
        f.location,
        f.address,
        f.notes,
        f.status,
        f.created_at,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'PURCHASE' THEN t.amount ELSE 0 END), 0) AS total_purchase,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'FARMER_PAYMENT' THEN t.amount ELSE 0 END), 0) AS total_paid,
        (COALESCE(SUM(CASE WHEN t.transaction_type = 'PURCHASE' THEN t.amount ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN t.transaction_type = 'FARMER_PAYMENT' THEN t.amount ELSE 0 END), 0)) AS outstanding
    FROM farmers f
    LEFT JOIN transactions t ON t.party_type = 'FARMER' AND t.party_id = f.id
    WHERE 1=1
";

if (!empty($search)) {
    $sql .= " AND (f.name LIKE :search OR f.phone LIKE :search OR f.location LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

$sql .= " GROUP BY f.id ORDER BY f.name ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$farmers = $stmt->fetchAll();

// Convert numeric fields to float
foreach ($farmers as &$farmer) {
    $farmer['id'] = (int)$farmer['id'];
    $farmer['total_purchase'] = (float)$farmer['total_purchase'];
    $farmer['total_paid'] = (float)$farmer['total_paid'];
    $farmer['outstanding'] = (float)$farmer['outstanding'];
    $farmer['status'] = (int)$farmer['status'];
}

sendJson([
    'success' => true,
    'data' => $farmers
]);
