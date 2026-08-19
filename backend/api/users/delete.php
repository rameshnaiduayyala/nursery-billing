<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

$input = getInputData();
$id = (int)($input['id'] ?? 0);

if (!$id) {
    sendError('User ID is required.');
}

// Prevent self-deletion
if ($id === (int)$user['id']) {
    sendError('You cannot delete your own logged-in admin account.');
}

$stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
$stmt->execute([':id' => $id]);

sendJson([
    'success' => true,
    'message' => 'User deleted successfully'
]);
