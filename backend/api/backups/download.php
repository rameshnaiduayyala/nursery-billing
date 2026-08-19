<?php
require_once __DIR__ . '/../config/auth_helper.php';
require_once __DIR__ . '/../config/backup_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    sendError('Invalid backup ID', 400);
}

ensureBackupTablesExist($pdo);

$stmt = $pdo->prepare("SELECT id, filename, file_path, status FROM backup_logs WHERE id = :id");
$stmt->execute([':id' => $id]);
$backup = $stmt->fetch();

if (!$backup) {
    sendError('Backup log entry not found', 404);
}

if ($backup['status'] !== 'SUCCESS') {
    sendError('Cannot download a failed backup file', 400);
}

$filePath = $backup['file_path'];

// Validate file path to prevent arbitrary file download / path traversal
$secureDir = getSecureBackupDir();
$realPath = realpath($filePath);
$realSecureDir = realpath($secureDir);

if (!$realPath || !file_exists($realPath)) {
    sendError('Backup file missing on server storage', 444);
}

if (strpos($realPath, $realSecureDir) !== 0) {
    sendError('Unauthorized file access path', 403);
}

$filename = basename($realPath);

// Audit download action
logAudit($pdo, $user['id'], $user['email'], 'Backup Downloaded', [
    'backup_id' => $id,
    'filename' => $filename
]);

// Clear output buffers
if (ob_get_level()) {
    ob_end_clean();
}

header('Content-Description: File Transfer');
header('Content-Type: application/sql');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . filesize($realPath));
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Pragma: public');
header('Expires: 0');

readfile($realPath);
exit;
