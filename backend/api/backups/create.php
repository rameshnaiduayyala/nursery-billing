<?php
require_once __DIR__ . '/../config/auth_helper.php';
require_once __DIR__ . '/../config/backup_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

try {
    $user = requireAuth($pdo);
    requireRole($user, ['ADMIN']);

    $result = createDatabaseBackup($pdo, 'MANUAL', $user['id'] ?? null, $user['email'] ?? null);

    if (!empty($result['success'])) {
        sendJson([
            'success' => true,
            'message' => 'Database backup created successfully',
            'data' => $result
        ]);
    } else {
        $msg = $result['message'] ?? 'Failed to create backup';
        sendError($msg, 500);
    }
} catch (Throwable $e) {
    sendError('Backup creation system error: ' . $e->getMessage(), 500);
}
