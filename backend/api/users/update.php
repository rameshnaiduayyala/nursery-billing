<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

$input = getInputData();
$id = (int)($input['id'] ?? 0);
$name = trim($input['name'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$password = trim($input['password'] ?? '');
$role = strtolower(trim($input['role'] ?? 'viewer'));
$status = isset($input['status']) ? (int)$input['status'] : 1;

if (!$id) {
    sendError('User ID is required.');
}

if (empty($name)) {
    sendError('User Name is required.');
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('A valid Email address is required.');
}

if (!in_array($role, ['admin', 'manager', 'viewer'])) {
    sendError('Role must be admin, manager, or viewer.');
}

// Check email uniqueness for other users
$stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = :email AND id != :id");
$stmt->execute([':email' => $email, ':id' => $id]);
if ($stmt->fetch()) {
    sendError('Email address is already used by another user.');
}

if (!empty($password)) {
    if (strlen($password) < 6) {
        sendError('Password must be at least 6 characters.');
    }
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmtUp = $pdo->prepare("
        UPDATE users 
        SET name = :name, email = :email, password_hash = :hash, role = :role, status = :status
        WHERE id = :id
    ");
    $stmtUp->execute([
        ':name' => $name,
        ':email' => $email,
        ':hash' => $passwordHash,
        ':role' => $role,
        ':status' => $status,
        ':id' => $id
    ]);
} else {
    $stmtUp = $pdo->prepare("
        UPDATE users 
        SET name = :name, email = :email, role = :role, status = :status
        WHERE id = :id
    ");
    $stmtUp->execute([
        ':name' => $name,
        ':email' => $email,
        ':role' => $role,
        ':status' => $status,
        ':id' => $id
    ]);
}

sendJson([
    'success' => true,
    'message' => 'User updated successfully'
]);
