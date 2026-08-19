<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$authUser = requireAuth($pdo);
$input = getInputData();

$currentPassword = trim($input['current_password'] ?? '');
$newPassword = trim($input['new_password'] ?? '');

if (empty($currentPassword) || empty($newPassword)) {
    sendError('Please fill in both current and new password fields.');
}

if (strlen($newPassword) < 6) {
    sendError('New password must be at least 6 characters long.');
}

// Fetch user record with password_hash
$stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = :id");
$stmt->execute([':id' => $authUser['id']]);
$userRecord = $stmt->fetch();

if (!$userRecord || !password_verify($currentPassword, $userRecord['password_hash'])) {
    sendError('Current password is incorrect.');
}

$newHash = password_hash($newPassword, PASSWORD_DEFAULT);
$updateStmt = $pdo->prepare("UPDATE users SET password_hash = :hash WHERE id = :id");
$updateStmt->execute([
    ':hash' => $newHash,
    ':id' => $authUser['id']
]);

sendJson([
    'success' => true,
    'message' => 'Password updated successfully.'
]);
