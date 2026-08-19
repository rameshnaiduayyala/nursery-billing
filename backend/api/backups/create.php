<?php
require_once __DIR__ . '/../config/auth_helper.php';
require_once __DIR__ . '/../config/backup_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

$result = createDatabaseBackup($pdo, 'MANUAL', $user['id'], $user['email']);

if ($result['success']) {
    sendJson([
        'success' => true,
        'message' => 'Database backup created successfully',
        'data' => $result
    ]);
} else {
    sendError($result['message'], 500);
}
