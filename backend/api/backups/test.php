<?php
require_once __DIR__ . '/../config/auth_helper.php';
require_once __DIR__ . '/../config/backup_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

ensureBackupTablesExist($pdo);

$mysqldumpAvailable = isMysqldumpAvailable();
$backupDir = getSecureBackupDir();
$isWritable = is_writable($backupDir);

sendJson([
    'success' => true,
    'message' => 'Backup system diagnostic test completed successfully',
    'data' => [
        'database_connected' => true,
        'mysqldump_available' => $mysqldumpAvailable,
        'backup_directory' => $backupDir,
        'backup_directory_writable' => $isWritable,
        'php_version' => PHP_VERSION,
        'os' => PHP_OS
    ]
]);
