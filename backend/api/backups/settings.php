<?php
require_once __DIR__ . '/../config/auth_helper.php';
require_once __DIR__ . '/../config/backup_helper.php';

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

ensureBackupTablesExist($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'backup_%'");
    $rows = $stmt->fetchAll();
    $settings = [];
    foreach ($rows as $r) {
        $settings[$r['setting_key']] = $r['setting_value'];
    }

    sendJson([
        'success' => true,
        'data' => [
            'backup_auto_enabled' => ($settings['backup_auto_enabled'] ?? '1') === '1',
            'backup_frequency' => $settings['backup_frequency'] ?? 'daily',
            'backup_time' => $settings['backup_time'] ?? '02:00',
            'backup_retention_count' => (int)($settings['backup_retention_count'] ?? 30)
        ]
    ]);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getInputData();

    $enabled = isset($input['backup_auto_enabled']) ? ($input['backup_auto_enabled'] ? '1' : '0') : '1';
    $frequency = !empty($input['backup_frequency']) ? strtolower($input['backup_frequency']) : 'daily';
    $time = !empty($input['backup_time']) ? trim($input['backup_time']) : '02:00';
    $retention = isset($input['backup_retention_count']) ? (int)$input['backup_retention_count'] : 30;

    if ($retention <= 0) $retention = 30;

    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (:key, :val) ON DUPLICATE KEY UPDATE setting_value = :val");
    
    $stmt->execute([':key' => 'backup_auto_enabled', ':val' => $enabled]);
    $stmt->execute([':key' => 'backup_frequency', ':val' => $frequency]);
    $stmt->execute([':key' => 'backup_time', ':val' => $time]);
    $stmt->execute([':key' => 'backup_retention_count', ':val' => (string)$retention]);

    logAudit($pdo, $user['id'], $user['email'], 'Backup Settings Updated', [
        'auto_enabled' => $enabled === '1',
        'frequency' => $frequency,
        'time' => $time,
        'retention' => $retention
    ]);

    sendJson([
        'success' => true,
        'message' => 'Automatic backup settings updated successfully'
    ]);
} else {
    sendError('Method not allowed', 405);
}
