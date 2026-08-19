<?php
require_once __DIR__ . '/../../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

try {
    $user = requireAuth($pdo);
    requireRole($user, ['ADMIN']);

    $input = getInputData();
    $name = trim($input['name'] ?? '');
    $status = isset($input['status']) ? ((int)$input['status'] ? 1 : 0) : 1;

    if ($name === '') {
        sendError('Category name is required', 400);
    }

    // Check duplicate
    $checkStmt = $pdo->prepare("SELECT id FROM expense_categories WHERE LOWER(name) = LOWER(:name)");
    $checkStmt->execute([':name' => $name]);
    if ($checkStmt->fetch()) {
        sendError('An expense category with this name already exists', 400);
    }

    $stmt = $pdo->prepare("INSERT INTO expense_categories (name, status) VALUES (:name, :status)");
    $stmt->execute([':name' => $name, ':status' => $status]);
    $id = $pdo->lastInsertId();

    sendJson([
        'success' => true,
        'message' => 'Expense category created successfully',
        'data' => [
            'id' => (int)$id,
            'name' => $name,
            'status' => $status
        ]
    ]);
} catch (Throwable $e) {
    sendError('Failed to create expense category: ' . $e->getMessage(), 500);
}
