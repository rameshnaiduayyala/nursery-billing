<?php
$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME') ?: 'rbjpogrx_ramesh_nursery';
$user = getenv('DB_USER') ?: 'rbjpogrx_ramesh_nursery';
$pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : 'Rameshaa@16';

$GLOBALS['DB_CONFIG_HOST'] = $host;
$GLOBALS['DB_CONFIG_NAME'] = $db;
$GLOBALS['DB_CONFIG_USER'] = $user;
$GLOBALS['DB_CONFIG_PASS'] = $pass;

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db;charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}