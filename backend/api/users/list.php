<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

$stmt = $pdo->query("SELECT id, name, email, role, status, created_at FROM users ORDER BY id ASC");
$users = $stmt->fetchAll();

sendJson([
    'success' => true,
    'data' => $users
]);
