<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();
$name = trim($input['name'] ?? '');
$type = strtoupper(trim($input['type'] ?? 'CUSTOMER'));
if (!in_array($type, ['CUSTOMER', 'EXPORTER'])) {
    $type = 'CUSTOMER';
}

$phone = trim($input['phone'] ?? '');
$email = trim($input['email'] ?? '');
$address = trim($input['address'] ?? '');
$city = trim($input['city'] ?? '');
$gst_number = trim($input['gst_number'] ?? ($input['gst'] ?? ''));
$notes = trim($input['notes'] ?? '');

if (empty($name)) {
    sendError('Customer / Exporter Name is required.');
}

$stmt = $pdo->prepare("
    INSERT INTO customers (name, type, phone, email, address, city, gst_number, notes, status)
    VALUES (:name, :type, :phone, :email, :address, :city, :gst_number, :notes, 1)
");
$stmt->execute([
    ':name' => $name,
    ':type' => $type,
    ':phone' => $phone,
    ':email' => $email,
    ':address' => $address,
    ':city' => $city,
    ':gst_number' => $gst_number,
    ':notes' => $notes
]);

$id = $pdo->lastInsertId();

sendJson([
    'success' => true,
    'message' => 'Customer / Exporter saved successfully',
    'data' => [
        'id' => (int)$id,
        'name' => $name,
        'type' => $type,
        'phone' => $phone,
        'email' => $email,
        'address' => $address,
        'city' => $city,
        'gst_number' => $gst_number,
        'notes' => $notes,
        'total_sales' => 0.0,
        'total_received' => 0.0,
        'outstanding' => 0.0
    ]
]);
