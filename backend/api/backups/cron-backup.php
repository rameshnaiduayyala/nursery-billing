<?php
// cPanel Cron Job Execution Script for Automatic MySQL Backups
// Usage via cPanel Cron: php /path/to/backend/api/backups/cron-backup.php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/backup_helper.php';

// Security check for HTTP execution if triggered via web request
if (php_sapi_name() !== 'cli') {
    // Optional secret key check via query string or environment variable
    $cronSecret = getenv('CRON_SECRET') ?: '';
    $passedKey = $_GET['key'] ?? '';
    
    if (!empty($cronSecret) && $passedKey !== $cronSecret) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Unauthorized cron execution request']);
        exit;
    }
}

ensureBackupTablesExist($pdo);

// Check if automatic backup is enabled
$stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'backup_auto_enabled'");
$stmt->execute();
$row = $stmt->fetch();
$isEnabled = !isset($row['setting_value']) || $row['setting_value'] === '1';

if (!$isEnabled) {
    $msg = "Automatic backup skipped: Feature is disabled in settings.";
    if (php_sapi_name() === 'cli') {
        echo "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n";
    } else {
        echo json_encode(['success' => true, 'message' => $msg]);
    }
    exit;
}

// Perform Automatic Backup
$result = createDatabaseBackup($pdo, 'AUTOMATIC', null, 'cPanel Cron System');

if ($result['success']) {
    $msg = "Automatic backup completed successfully. File: " . $result['filename'] . " (" . round($result['file_size'] / 1024 / 1024, 2) . " MB)";
    if (php_sapi_name() === 'cli') {
        echo "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n";
    } else {
        echo json_encode(['success' => true, 'message' => $msg, 'data' => $result]);
    }
} else {
    $msg = "Automatic backup failed: " . $result['message'];
    if (php_sapi_name() === 'cli') {
        fwrite(STDERR, "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n");
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $msg]);
    }
    exit(1);
}
