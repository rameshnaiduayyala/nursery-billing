<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();
$id = (int)($input['id'] ?? 0);

if (!$id) {
    sendError('Farmer ID is required.');
}

// Check if transactions exist for this farmer
$stmt = $pdo->prepare("SELECT COUNT(*) as count FROM transactions WHERE party_type = 'FARMER' AND party_id = :id");
$stmt->execute([':id' => $id]);
$count = (int)$stmt->fetch()['count'];

if ($count > 0) {
    sendError('Cannot delete farmer because there are existing transaction records associated with this farmer.');
}

$stmt = $pdo->prepare("DELETE FROM farmers WHERE id = :id");
$stmt->execute([':id' => $id]);

sendJson([
    'success' => true,
    'message' => 'Farmer deleted successfully'
]);
