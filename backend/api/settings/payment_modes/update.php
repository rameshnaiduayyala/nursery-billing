<?php
require_once __DIR__ . '/../../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

try {
    $user = requireAuth($pdo);
    requireRole($user, ['ADMIN']);

    $input = getInputData();
    $id = (int)($input['id'] ?? 0);
    $name = trim($input['name'] ?? '');
    $status = isset($input['status']) ? ((int)$input['status'] ? 1 : 0) : 1;

    if ($id <= 0) {
        sendError('Invalid payment mode ID', 400);
    }
    if ($name === '') {
        sendError('Payment mode name is required', 400);
    }

    // Check existing
    $checkStmt = $pdo->prepare("SELECT id FROM payment_modes WHERE id = :id");
    $checkStmt->execute([':id' => $id]);
    if (!$checkStmt->fetch()) {
        sendError('Payment mode not found', 404);
    }

    // Check duplicate name
    $dupStmt = $pdo->prepare("SELECT id FROM payment_modes WHERE LOWER(name) = LOWER(:name) AND id != :id");
    $dupStmt->execute([':name' => $name, ':id' => $id]);
    if ($dupStmt->fetch()) {
        sendError('Another payment mode with this name already exists', 400);
    }

    $stmt = $pdo->prepare("UPDATE payment_modes SET name = :name, status = :status WHERE id = :id");
    $stmt->execute([':name' => $name, ':status' => $status, ':id' => $id]);

    sendJson([
        'success' => true,
        'message' => 'Payment mode updated successfully'
    ]);
} catch (Throwable $e) {
    sendError('Failed to update payment mode: ' . $e->getMessage(), 500);
}
