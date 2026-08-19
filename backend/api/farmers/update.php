<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();
$id = (int)($input['id'] ?? 0);
$name = trim($input['name'] ?? '');
$phone = trim($input['phone'] ?? '');
$location = trim($input['location'] ?? ($input['village'] ?? ''));
$address = trim($input['address'] ?? '');
$notes = trim($input['notes'] ?? '');

if (!$id || empty($name)) {
    sendError('Farmer ID and Name are required.');
}

$stmt = $pdo->prepare("UPDATE farmers SET name = :name, phone = :phone, location = :location, address = :address, notes = :notes WHERE id = :id");
$stmt->execute([
    ':name' => $name,
    ':phone' => $phone,
    ':location' => $location,
    ':address' => $address,
    ':notes' => $notes,
    ':id' => $id
]);

sendJson([
    'success' => true,
    'message' => 'Farmer updated successfully'
]);
