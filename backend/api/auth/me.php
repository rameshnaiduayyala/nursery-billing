<?php
require_once __DIR__ . '/../config/auth_helper.php';

$user = requireAuth($pdo);

sendJson([
    'success' => true,
    'data' => [
        'user' => [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]
]);
