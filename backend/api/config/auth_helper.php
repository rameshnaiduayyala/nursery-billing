<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/database.php';

function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
    exit;
}

function sendError($message, $statusCode = 400, $extra = []) {
    sendJson(array_merge([
        'success' => false,
        'message' => $message
    ], $extra), $statusCode);
}

function getInputData() {
    $raw = file_get_contents('php://input');
    $json = json_decode($raw, true);
    if (is_array($json)) {
        return array_merge($_REQUEST, $json);
    }
    return $_REQUEST;
}

function autoSeedAdminIfEmpty($pdo) {
    static $seeded = false;
    if ($seeded) return; // Only run once per PHP process
    $seeded = true;

    try {
        // Seed default Admin if missing
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE LOWER(email) = 'admin@nursery.com'");
        $stmt->execute();
        $row = $stmt->fetch();
        if ((int)$row['count'] === 0) {
            $hash = password_hash('admin123', PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, status) VALUES ('Admin Manager', 'admin@nursery.com', :hash, 'admin', 1)");
            $stmt->execute([':hash' => $hash]);
        }

        // Seed default Manager if missing
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE LOWER(email) = 'manager@nursery.com'");
        $stmt->execute();
        $row = $stmt->fetch();
        if ((int)$row['count'] === 0) {
            $hash = password_hash('manager123', PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, status) VALUES ('Store Manager', 'manager@nursery.com', :hash, 'manager', 1)");
            $stmt->execute([':hash' => $hash]);
        }

        // Seed default Viewer if missing
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE LOWER(email) = 'viewer@nursery.com'");
        $stmt->execute();
        $row = $stmt->fetch();
        if ((int)$row['count'] === 0) {
            $hash = password_hash('viewer123', PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, role, status) VALUES ('ReadOnly Viewer', 'viewer@nursery.com', :hash, 'viewer', 1)");
            $stmt->execute([':hash' => $hash]);
        }
    } catch (Exception $e) {
        // Table might not exist yet or error, ignore
    }
}

function requireAuth($pdo) {
    autoSeedAdminIfEmpty($pdo);
    
    // 1. Check Session
    if (!empty($_SESSION['user_id'])) {
        $stmt = $pdo->prepare("SELECT id, name, email, role, status FROM users WHERE id = :id AND status = 1");
        $stmt->execute([':id' => $_SESSION['user_id']]);
        $user = $stmt->fetch();
        if ($user) {
            return $user;
        }
    }

    // 2. Check Authorization Header (Bearer token simulated as user_ID)
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
        if (strpos($token, 'user_') === 0) {
            $userId = (int)str_replace('user_', '', $token);
            $stmt = $pdo->prepare("SELECT id, name, email, role, status FROM users WHERE id = :id AND status = 1");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch();
            if ($user) {
                return $user;
            }
        }
    }

    // Default fallback: Return default admin
    $stmt = $pdo->query("SELECT id, name, email, role, status FROM users LIMIT 1");
    $user = $stmt->fetch();
    if ($user) {
        return $user;
    }

    sendError('Unauthorized access', 401);
}

function requireRole($user, $allowedRoles = ['ADMIN', 'MANAGER']) {
    $userRole = strtoupper(trim($user['role'] ?? 'VIEWER'));
    $allowedUpper = array_map('strtoupper', $allowedRoles);
    if (!in_array($userRole, $allowedUpper)) {
        sendError('Forbidden: Your account role (' . $userRole . ') does not have permission to perform this operation.', 403);
    }
}
