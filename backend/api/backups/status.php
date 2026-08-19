<?php
require_once __DIR__ . '/../config/auth_helper.php';
require_once __DIR__ . '/../config/backup_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    $user = requireAuth($pdo);
    requireRole($user, ['ADMIN']);

    ensureBackupTablesExist($pdo);

    $mysqldumpAvailable = isMysqldumpAvailable();
    $backupDir = getSecureBackupDir();
    $isWritable = is_writable($backupDir);

    sendJson([
        'success' => true,
        'data' => [
            'mysqldump_available' => $mysqldumpAvailable,
            'backup_directory_writable' => $isWritable,
            'database_connected' => true,
            'backup_directory' => $backupDir
        ]
    ]);
} catch (Throwable $e) {
    sendError('Status check error: ' . $e->getMessage(), 500);
}
