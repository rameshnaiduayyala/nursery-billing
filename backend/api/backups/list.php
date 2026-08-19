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

    // Fetch backup history from backup_logs with creator user name
    $stmt = $pdo->query("
        SELECT 
            b.id,
            b.user_id,
            b.backup_type,
            b.filename,
            b.file_size,
            b.status,
            b.error_message,
            b.created_at,
            u.name as creator_name
        FROM backup_logs b
        LEFT JOIN users u ON b.user_id = u.id
        ORDER BY b.created_at DESC, b.id DESC
    ");
    $backups = $stmt->fetchAll();

    // Fetch backup settings
    $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'backup_%'");
    $settingsRaw = $stmtSettings->fetchAll();
    $settings = [];
    foreach ($settingsRaw as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    // Summary stats
    $lastBackup = null;
    $oldestBackup = null;
    $totalCount = 0;

    $successfulBackups = array_filter($backups, function($b) {
        return $b['status'] === 'SUCCESS';
    });

    if (!empty($successfulBackups)) {
        $totalCount = count($successfulBackups);
        $firstSuccess = reset($successfulBackups);
        $lastSuccess = end($successfulBackups);
        
        $lastBackup = [
            'created_at' => $firstSuccess['created_at'],
            'file_size' => (int)$firstSuccess['file_size'],
            'filename' => $firstSuccess['filename']
        ];

        $oldestBackup = [
            'created_at' => $lastSuccess['created_at'],
            'filename' => $lastSuccess['filename']
        ];
    }

    sendJson([
        'success' => true,
        'data' => [
            'backups' => array_map(function($b) {
                return [
                    'id' => (int)$b['id'],
                    'user_id' => $b['user_id'] ? (int)$b['user_id'] : null,
                    'creator_name' => $b['creator_name'] ?: ($b['backup_type'] === 'AUTOMATIC' ? 'System' : 'Admin'),
                    'backup_type' => $b['backup_type'],
                    'filename' => $b['filename'],
                    'file_size' => (int)$b['file_size'],
                    'status' => $b['status'],
                    'error_message' => $b['error_message'],
                    'created_at' => $b['created_at']
                ];
            }, $backups),
            'settings' => [
                'backup_auto_enabled' => ($settings['backup_auto_enabled'] ?? '1') === '1',
                'backup_frequency' => $settings['backup_frequency'] ?? 'daily',
                'backup_time' => $settings['backup_time'] ?? '02:00',
                'backup_retention_count' => (int)($settings['backup_retention_count'] ?? 30)
            ],
            'stats' => [
                'last_backup' => $lastBackup,
                'oldest_backup' => $oldestBackup,
                'total_count' => $totalCount
            ]
        ]
    ]);
} catch (Throwable $e) {
    sendError('Backup list error: ' . $e->getMessage(), 500);
}
