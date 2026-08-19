<?php
require_once __DIR__ . '/../../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    $user = requireAuth($pdo);

    $stmt = $pdo->query("SELECT id, name, status FROM expense_categories ORDER BY name ASC");
    $categories = $stmt->fetchAll();

    sendJson([
        'success' => true,
        'data' => $categories
    ]);
} catch (Throwable $e) {
    sendError('Failed to fetch expense categories: ' . $e->getMessage(), 500);
}
