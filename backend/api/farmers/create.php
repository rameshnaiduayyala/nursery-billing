<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();
$name = trim($input['name'] ?? '');
$phone = trim($input['phone'] ?? '');
$location = trim($input['location'] ?? ($input['village'] ?? ''));
$address = trim($input['address'] ?? '');
$notes = trim($input['notes'] ?? '');

if (empty($name)) {
    sendError('Farmer Name is required.');
}

$stmt = $pdo->prepare("INSERT INTO farmers (name, phone, location, address, notes, status) VALUES (:name, :phone, :location, :address, :notes, 1)");
$stmt->execute([
    ':name' => $name,
    ':phone' => $phone,
    ':location' => $location,
    ':address' => $address,
    ':notes' => $notes
]);

$id = $pdo->lastInsertId();

sendJson([
    'success' => true,
    'message' => 'Farmer saved successfully',
    'data' => [
        'id' => (int)$id,
        'name' => $name,
        'phone' => $phone,
        'location' => $location,
        'address' => $address,
        'notes' => $notes,
        'total_purchase' => 0.0,
        'total_paid' => 0.0,
        'outstanding' => 0.0
    ]
]);
