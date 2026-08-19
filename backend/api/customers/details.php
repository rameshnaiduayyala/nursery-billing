<?php
require_once __DIR__ . '/../config/auth_helper.php';

$id = (int)($_GET['id'] ?? 0);

if (!$id) {
    sendError('Customer ID is required.');
}

$stmt = $pdo->prepare("SELECT * FROM customers WHERE id = :id");
$stmt->execute([':id' => $id]);
$customer = $stmt->fetch();

if (!$customer) {
    sendError('Customer not found.', 404);
}

$stmtStats = $pdo->prepare("
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'SALE' THEN amount ELSE 0 END), 0) AS total_sales,
        COALESCE(SUM(CASE WHEN transaction_type = 'CUSTOMER_RECEIPT' THEN amount ELSE 0 END), 0) AS total_received
    FROM transactions 
    WHERE party_type = 'CUSTOMER' AND party_id = :id
");
$stmtStats->execute([':id' => $id]);
$stats = $stmtStats->fetch();

$customer['id'] = (int)$customer['id'];
$customer['total_sales'] = (float)$stats['total_sales'];
$customer['total_received'] = (float)$stats['total_received'];
$customer['outstanding'] = (float)($stats['total_sales'] - $stats['total_received']);

sendJson([
    'success' => true,
    'data' => $customer
]);
