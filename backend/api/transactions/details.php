<?php
require_once __DIR__ . '/../config/auth_helper.php';

$id = (int)($_GET['id'] ?? 0);

if (!$id) {
    sendError('Transaction ID is required.');
}

$stmt = $pdo->prepare("
    SELECT 
        t.*,
        CASE 
            WHEN t.party_type = 'FARMER' THEN f.name
            WHEN t.party_type = 'CUSTOMER' THEN c.name
            ELSE 'Unknown'
        END AS party_name
    FROM transactions t
    LEFT JOIN farmers f ON t.party_type = 'FARMER' AND t.party_id = f.id
    LEFT JOIN customers c ON t.party_type = 'CUSTOMER' AND t.party_id = c.id
    WHERE t.id = :id
");
$stmt->execute([':id' => $id]);
$tx = $stmt->fetch();

if (!$tx) {
    sendError('Transaction not found.', 404);
}

$tx['id'] = (int)$tx['id'];
$tx['party_id'] = (int)$tx['party_id'];
$tx['amount'] = (float)$tx['amount'];

sendJson([
    'success' => true,
    'data' => $tx
]);
