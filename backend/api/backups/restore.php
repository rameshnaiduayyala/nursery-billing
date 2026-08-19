<?php
require_once __DIR__ . '/../config/auth_helper.php';
require_once __DIR__ . '/../config/backup_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

$input = getInputData();
$targetFilePath = null;

// Case 1: Restore from uploaded .sql file
if (!empty($_FILES['file']['name'])) {
    $fileErr = $_FILES['file']['error'];
    if ($fileErr !== UPLOAD_ERR_OK) {
        sendError('File upload error code: ' . $fileErr, 400);
    }

    $filename = $_FILES['file']['name'];
    $tmpName = $_FILES['file']['tmp_name'];
    $size = $_FILES['file']['size'];

    // 1. Validate file extension
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if ($ext !== 'sql') {
        sendError('Invalid file type. Only .sql database backup files are permitted.', 400);
    }

    // 2. Validate file size
    if ($size <= 0 || $size > (100 * 1024 * 1024)) { // 100MB max limit
        sendError('Uploaded SQL file size is invalid or exceeds 100MB limit.', 400);
    }

    // 3. Move file to secure storage directory
    $secureDir = getSecureBackupDir();
    $targetFilename = 'upload_restore_' . date('Y-m-d_His') . '_' . preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $filename);
    $targetFilePath = $secureDir . '/' . $targetFilename;

    if (!move_uploaded_file($tmpName, $targetFilePath)) {
        sendError('Failed to move uploaded backup file to secure directory.', 500);
    }
}
// Case 2: Restore from existing backup history ID
elseif (!empty($input['backup_id'])) {
    $backupId = (int)$input['backup_id'];
    $stmt = $pdo->prepare("SELECT file_path, filename, status FROM backup_logs WHERE id = :id");
    $stmt->execute([':id' => $backupId]);
    $backup = $stmt->fetch();

    if (!$backup || $backup['status'] !== 'SUCCESS') {
        sendError('Selected backup record not found or was not successful.', 404);
    }

    $targetFilePath = $backup['file_path'];
} else {
    sendError('Please provide a backup_id or upload a .sql file to restore.', 400);
}

// 4. Verify file is valid SQL backup
if (!file_exists($targetFilePath) || filesize($targetFilePath) === 0) {
    sendError('Target backup SQL file does not exist or is empty.', 400);
}

// Perform safety checks & restore execution via helper
$result = restoreDatabaseFromSql($pdo, $targetFilePath, $user['id'], $user['email']);

if ($result['success']) {
    sendJson([
        'success' => true,
        'message' => $result['message']
    ]);
} else {
    sendError($result['message'], 500);
}
