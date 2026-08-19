<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = getInputData();
$id = (int)($input['id'] ?? 0);
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

if (!$id || empty($name)) {
    sendError('Customer ID and Name are required.');
}

$stmt = $pdo->prepare("
    UPDATE customers 
    SET name = :name, type = :type, phone = :phone, email = :email, 
        address = :address, city = :city, gst_number = :gst_number, notes = :notes 
    WHERE id = :id
");
$stmt->execute([
    ':name' => $name,
    ':type' => $type,
    ':phone' => $phone,
    ':email' => $email,
    ':address' => $address,
    ':city' => $city,
    ':gst_number' => $gst_number,
    ':notes' => $notes,
    ':id' => $id
]);

sendJson([
    'success' => true,
    'message' => 'Customer / Exporter updated successfully'
]);
