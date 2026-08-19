<?php
require_once __DIR__ . '/../config/auth_helper.php';

$id = (int)($_GET['id'] ?? 0);

if (!$id) {
    sendError('Farmer ID is required.');
}

$stmt = $pdo->prepare("SELECT * FROM farmers WHERE id = :id");
$stmt->execute([':id' => $id]);
$farmer = $stmt->fetch();

if (!$farmer) {
    sendError('Farmer not found.', 404);
}

// Fetch totals
$stmtStats = $pdo->prepare("
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'PURCHASE' THEN amount ELSE 0 END), 0) AS total_purchase,
        COALESCE(SUM(CASE WHEN transaction_type = 'FARMER_PAYMENT' THEN amount ELSE 0 END), 0) AS total_paid
    FROM transactions 
    WHERE party_type = 'FARMER' AND party_id = :id
");
$stmtStats->execute([':id' => $id]);
$stats = $stmtStats->fetch();

$farmer['id'] = (int)$farmer['id'];
$farmer['total_purchase'] = (float)$stats['total_purchase'];
$farmer['total_paid'] = (float)$stats['total_paid'];
$farmer['outstanding'] = (float)($stats['total_purchase'] - $stats['total_paid']);

sendJson([
    'success' => true,
    'data' => $farmer
]);
