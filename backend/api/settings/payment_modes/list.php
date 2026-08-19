<?php
require_once __DIR__ . '/../../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    $user = requireAuth($pdo);

    $stmt = $pdo->query("SELECT id, name, status FROM payment_modes ORDER BY id ASC");
    $modes = $stmt->fetchAll();

    sendJson([
        'success' => true,
        'data' => $modes
    ]);
} catch (Throwable $e) {
    sendError('Failed to fetch payment modes: ' . $e->getMessage(), 500);
}
