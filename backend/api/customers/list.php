<?php
require_once __DIR__ . '/../config/auth_helper.php';

$search = trim($_GET['search'] ?? '');
$type = trim($_GET['type'] ?? '');
$params = [];

$sql = "
    SELECT 
        c.id,
        c.name,
        c.type,
        c.phone,
        c.email,
        c.address,
        c.city,
        c.gst_number,
        c.notes,
        c.status,
        c.created_at,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.amount ELSE 0 END), 0) AS total_sales,
        COALESCE(SUM(CASE WHEN t.transaction_type = 'CUSTOMER_RECEIPT' THEN t.amount ELSE 0 END), 0) AS total_received,
        (COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.amount ELSE 0 END), 0) - 
         COALESCE(SUM(CASE WHEN t.transaction_type = 'CUSTOMER_RECEIPT' THEN t.amount ELSE 0 END), 0)) AS outstanding
    FROM customers c
    LEFT JOIN transactions t ON t.party_type = 'CUSTOMER' AND t.party_id = c.id
    WHERE 1=1
";

if (!empty($search)) {
    $sql .= " AND (c.name LIKE :search OR c.phone LIKE :search OR c.city LIKE :search OR c.gst_number LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

if (!empty($type)) {
    $sql .= " AND c.type = :type";
    $params[':type'] = strtoupper($type);
}

$sql .= " GROUP BY c.id ORDER BY c.name ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$customers = $stmt->fetchAll();

foreach ($customers as &$customer) {
    $customer['id'] = (int)$customer['id'];
    $customer['total_sales'] = (float)$customer['total_sales'];
    $customer['total_received'] = (float)$customer['total_received'];
    $customer['outstanding'] = (float)$customer['outstanding'];
    $customer['status'] = (int)$customer['status'];
}

sendJson([
    'success' => true,
    'data' => $customers
]);
