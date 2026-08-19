<?php
require_once __DIR__ . '/../config/auth_helper.php';
require_once __DIR__ . '/../config/backup_helper.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['DELETE', 'POST'])) {
    sendError('Method not allowed', 405);
}

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

$input = getInputData();
$id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($input['id']) ? (int)$input['id'] : 0);

if ($id <= 0) {
    sendError('Invalid backup ID', 400);
}

ensureBackupTablesExist($pdo);

$stmt = $pdo->prepare("SELECT id, filename, file_path, status FROM backup_logs WHERE id = :id");
$stmt->execute([':id' => $id]);
$backup = $stmt->fetch();

if (!$backup) {
    sendError('Backup record not found', 404);
}

// Check safety condition: Never delete the ONLY successful backup
if ($backup['status'] === 'SUCCESS') {
    $countStmt = $pdo->query("SELECT COUNT(*) as count FROM backup_logs WHERE status = 'SUCCESS'");
    $successCount = (int)$countStmt->fetch()['count'];
    if ($successCount <= 1) {
        sendError('Cannot delete the only available successful backup for disaster recovery safety.', 400);
    }
}

// Delete physical file if exists
if (!empty($backup['file_path']) && file_exists($backup['file_path'])) {
    @unlink($backup['file_path']);
}

// Delete database record
$delStmt = $pdo->prepare("DELETE FROM backup_logs WHERE id = :id");
$delStmt->execute([':id' => $id]);

logAudit($pdo, $user['id'], $user['email'], 'Backup Deleted', [
    'backup_id' => $id,
    'filename' => $backup['filename']
]);

sendJson([
    'success' => true,
    'message' => 'Backup deleted successfully'
]);
