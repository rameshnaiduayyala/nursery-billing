<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();
$id = (int)($input['id'] ?? 0);

if (!$id) {
    sendError('Customer ID is required.');
}

$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM transactions WHERE party_type = 'CUSTOMER' AND party_id = :id");
$stmt->execute([':id' => $id]);
$count = (int)$stmt->fetch()['count'];

if ($count > 0) {
    sendError('Cannot delete customer/exporter because there are transaction records associated with this record.');
}

$stmt = $pdo->prepare("DELETE FROM customers WHERE id = :id");
$stmt->execute([':id' => $id]);

sendJson([
    'success' => true,
    'message' => 'Customer / Exporter deleted successfully'
]);
