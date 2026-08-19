<?php
require_once __DIR__ . '/../config/auth_helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$minAmount = (float)($_GET['min_amount'] ?? 0);
$type = strtoupper(trim($_GET['type'] ?? 'ALL')); // CUSTOMER, FARMER, or ALL

$response = [
    'customers_outstanding' => [],
    'farmers_outstanding' => [],
    'total_customer_receivables' => 0,
    'total_farmer_payables' => 0
];

// 1. Fetch Customers with Outstanding Balances
if ($type === 'ALL' || $type === 'CUSTOMER') {
    $stmt = $pdo->query("
        SELECT 
            c.id,
            c.name,
            c.type AS customer_type,
            c.phone,
            c.city,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.amount ELSE 0 END), 0) AS total_sales,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'CUSTOMER_RECEIPT' THEN t.amount ELSE 0 END), 0) AS total_received,
            (
                COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN t.transaction_type = 'CUSTOMER_RECEIPT' THEN t.amount ELSE 0 END), 0)
            ) AS outstanding,
            MAX(t.transaction_date) AS last_transaction_date,
            DATEDIFF(CURRENT_DATE(), COALESCE(MAX(t.transaction_date), CURRENT_DATE())) AS days_idle
        FROM customers c
        LEFT JOIN transactions t ON t.party_type = 'CUSTOMER' AND t.party_id = c.id
        WHERE c.status = 1
        GROUP BY c.id, c.name, c.type, c.phone, c.city
        HAVING outstanding > $minAmount
        ORDER BY outstanding DESC
    ");
    $customers = $stmt->fetchAll();

    $response['customers_outstanding'] = $customers;
    $response['total_customer_receivables'] = array_sum(array_column($customers, 'outstanding'));
}

// 2. Fetch Farmers with Outstanding Payables
if ($type === 'ALL' || $type === 'FARMER') {
    $stmt = $pdo->query("
        SELECT 
            f.id,
            f.name,
            f.phone,
            f.location,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'PURCHASE' THEN t.amount ELSE 0 END), 0) AS total_purchase,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'FARMER_PAYMENT' THEN t.amount ELSE 0 END), 0) AS total_paid,
            (
                COALESCE(SUM(CASE WHEN t.transaction_type = 'PURCHASE' THEN t.amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN t.transaction_type = 'FARMER_PAYMENT' THEN t.amount ELSE 0 END), 0)
            ) AS outstanding,
            MAX(t.transaction_date) AS last_transaction_date,
            DATEDIFF(CURRENT_DATE(), COALESCE(MAX(t.transaction_date), CURRENT_DATE())) AS days_idle
        FROM farmers f
        LEFT JOIN transactions t ON t.party_type = 'FARMER' AND t.party_id = f.id
        WHERE f.status = 1
        GROUP BY f.id, f.name, f.phone, f.location
        HAVING outstanding > $minAmount
        ORDER BY outstanding DESC
    ");
    $farmers = $stmt->fetchAll();

    $response['farmers_outstanding'] = $farmers;
    $response['total_farmer_payables'] = array_sum(array_column($farmers, 'outstanding'));
}

sendJson([
    'success' => true,
    'data' => $response
]);
