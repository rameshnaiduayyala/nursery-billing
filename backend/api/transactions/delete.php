<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();
$id = (int)($input['id'] ?? 0);

if (!$id) {
    sendError('Transaction ID is required.');
}

$stmt = $pdo->prepare("DELETE FROM transactions WHERE id = :id");
$stmt->execute([':id' => $id]);

sendJson([
    'success' => true,
    'message' => 'Transaction deleted successfully'
]);
