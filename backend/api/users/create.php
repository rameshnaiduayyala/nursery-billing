<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

$input = getInputData();
$name = trim($input['name'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$password = trim($input['password'] ?? '');
$role = strtolower(trim($input['role'] ?? 'viewer'));
$status = isset($input['status']) ? (int)$input['status'] : 1;

if (empty($name)) {
    sendError('User Name is required.');
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('A valid Email address is required.');
}

if (empty($password) || strlen($password) < 6) {
    sendError('Password must be at least 6 characters long.');
}

if (!in_array($role, ['admin', 'manager', 'viewer'])) {
    sendError('Role must be admin, manager, or viewer.');
}

// Check if email already exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = :email");
$stmt->execute([':email' => $email]);
if ($stmt->fetch()) {
    sendError('A user with this email address already exists.');
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);

$stmtIns = $pdo->prepare("
    INSERT INTO users (name, email, password_hash, role, status)
    VALUES (:name, :email, :password_hash, :role, :status)
");

$stmtIns->execute([
    ':name' => $name,
    ':email' => $email,
    ':password_hash' => $passwordHash,
    ':role' => $role,
    ':status' => $status
]);

$id = (int)$pdo->lastInsertId();

sendJson([
    'success' => true,
    'message' => 'User created successfully',
    'data' => [
        'id' => $id,
        'name' => $name,
        'email' => $email,
        'role' => $role,
        'status' => $status
    ]
]);
