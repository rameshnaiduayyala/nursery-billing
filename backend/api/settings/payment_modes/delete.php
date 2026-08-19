<?php
require_once __DIR__ . '/../../config/auth_helper.php';

if (!in_array($_SERVER['REQUEST_METHOD'], ['DELETE', 'POST'])) {
    sendError('Method not allowed', 405);
}

try {
    $user = requireAuth($pdo);
    requireRole($user, ['ADMIN']);

    $input = getInputData();
    $id = isset($_GET['id']) ? (int)$_GET['id'] : (isset($input['id']) ? (int)$input['id'] : 0);

    if ($id <= 0) {
        sendError('Invalid payment mode ID', 400);
    }

    $stmt = $pdo->prepare("DELETE FROM payment_modes WHERE id = :id");
    $stmt->execute([':id' => $id]);

    sendJson([
        'success' => true,
        'message' => 'Payment mode deleted successfully'
    ]);
} catch (Throwable $e) {
    sendError('Failed to delete payment mode: ' . $e->getMessage(), 500);
}
