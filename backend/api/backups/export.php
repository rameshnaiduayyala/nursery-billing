<?php
require_once __DIR__ . '/../config/auth_helper.php';
require_once __DIR__ . '/../config/backup_helper.php';

$user = requireAuth($pdo);
requireRole($user, ['ADMIN']);

$input = getInputData();
$type = strtolower(trim($input['type'] ?? $_GET['type'] ?? 'everything'));

/**
 * Returns array of [headers, rows] for a requested business domain
 */
function getExportData($pdo, $type) {
    switch ($type) {
        case 'farmers':
            $stmt = $pdo->query("SELECT id, name, phone, location, address, notes, IF(status=1, 'Active', 'Inactive') as status, created_at FROM farmers ORDER BY id ASC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $headers = ['ID', 'Farmer Name', 'Phone', 'Location', 'Address', 'Notes', 'Status', 'Created At'];
            return [$headers, $rows];

        case 'customers':
            $stmt = $pdo->query("SELECT id, name, type, phone, email, city, address, gst_number, notes, IF(status=1, 'Active', 'Inactive') as status, created_at FROM customers ORDER BY id ASC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $headers = ['ID', 'Customer Name', 'Type', 'Phone', 'Email', 'City', 'Address', 'GST Number', 'Notes', 'Status', 'Created At'];
            return [$headers, $rows];

        case 'transactions':
            $stmt = $pdo->query("
                SELECT 
                    t.id, t.transaction_date, t.party_type, t.party_id,
                    COALESCE(f.name, c.name, 'N/A') as party_name,
                    t.transaction_type, t.amount, t.payment_mode, t.remarks, t.created_at
                FROM transactions t
                LEFT JOIN farmers f ON t.party_type = 'FARMER' AND t.party_id = f.id
                LEFT JOIN customers c ON t.party_type = 'CUSTOMER' AND t.party_id = c.id
                ORDER BY t.transaction_date DESC, t.id DESC
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $headers = ['Transaction ID', 'Date', 'Party Type', 'Party ID', 'Party Name', 'Transaction Type', 'Amount (₹)', 'Payment Mode', 'Remarks', 'Created At'];
            return [$headers, $rows];

        case 'sales':
            $stmt = $pdo->query("
                SELECT 
                    t.id, t.transaction_date, c.name as customer_name, c.phone, t.amount, t.payment_mode, t.remarks, t.created_at
                FROM transactions t
                JOIN customers c ON t.party_id = c.id
                WHERE t.party_type = 'CUSTOMER' AND t.transaction_type = 'SALE'
                ORDER BY t.transaction_date DESC, t.id DESC
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $headers = ['Sale ID', 'Date', 'Customer Name', 'Phone', 'Sale Amount (₹)', 'Payment Mode', 'Remarks', 'Created At'];
            return [$headers, $rows];

        case 'purchases':
            $stmt = $pdo->query("
                SELECT 
                    t.id, t.transaction_date, f.name as farmer_name, f.phone, t.amount, t.payment_mode, t.remarks, t.created_at
                FROM transactions t
                JOIN farmers f ON t.party_id = f.id
                WHERE t.party_type = 'FARMER' AND t.transaction_type = 'PURCHASE'
                ORDER BY t.transaction_date DESC, t.id DESC
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $headers = ['Purchase ID', 'Date', 'Farmer Name', 'Phone', 'Purchase Amount (₹)', 'Payment Mode', 'Remarks', 'Created At'];
            return [$headers, $rows];

        case 'farmer_payments':
            $stmt = $pdo->query("
                SELECT 
                    t.id, t.transaction_date, f.name as farmer_name, f.phone, t.amount, t.payment_mode, t.remarks, t.created_at
                FROM transactions t
                JOIN farmers f ON t.party_id = f.id
                WHERE t.party_type = 'FARMER' AND t.transaction_type = 'FARMER_PAYMENT'
                ORDER BY t.transaction_date DESC, t.id DESC
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $headers = ['Payment ID', 'Date', 'Farmer Name', 'Phone', 'Payment Amount (₹)', 'Payment Mode', 'Remarks', 'Created At'];
            return [$headers, $rows];

        case 'customer_receipts':
            $stmt = $pdo->query("
                SELECT 
                    t.id, t.transaction_date, c.name as customer_name, c.phone, t.amount, t.payment_mode, t.remarks, t.created_at
                FROM transactions t
                JOIN customers c ON t.party_id = c.id
                WHERE t.party_type = 'CUSTOMER' AND t.transaction_type = 'CUSTOMER_RECEIPT'
                ORDER BY t.transaction_date DESC, t.id DESC
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $headers = ['Receipt ID', 'Date', 'Customer Name', 'Phone', 'Receipt Amount (₹)', 'Payment Mode', 'Remarks', 'Created At'];
            return [$headers, $rows];

        case 'expenses':
            $stmt = $pdo->query("SELECT id, expense_date, expense_type, description, amount, payment_mode, remarks, created_at FROM expenses ORDER BY expense_date DESC, id DESC");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $headers = ['Expense ID', 'Date', 'Expense Category', 'Description', 'Amount (₹)', 'Payment Mode', 'Remarks', 'Created At'];
            return [$headers, $rows];

        case 'farmer_ledgers':
            $stmt = $pdo->query("
                SELECT 
                    f.id as farmer_id, f.name as farmer_name, f.phone, f.location,
                    COALESCE(SUM(CASE WHEN t.transaction_type = 'PURCHASE' THEN t.amount ELSE 0 END), 0) as total_purchases,
                    COALESCE(SUM(CASE WHEN t.transaction_type = 'FARMER_PAYMENT' THEN t.amount ELSE 0 END), 0) as total_payments,
                    (COALESCE(SUM(CASE WHEN t.transaction_type = 'PURCHASE' THEN t.amount ELSE 0 END), 0) - 
                     COALESCE(SUM(CASE WHEN t.transaction_type = 'FARMER_PAYMENT' THEN t.amount ELSE 0 END), 0)) as balance_payable
                FROM farmers f
                LEFT JOIN transactions t ON t.party_type = 'FARMER' AND t.party_id = f.id
                GROUP BY f.id
                ORDER BY f.name ASC
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $headers = ['Farmer ID', 'Farmer Name', 'Phone', 'Location', 'Total Purchases (₹)', 'Total Payments Paid (₹)', 'Net Balance Payable (₹)'];
            return [$headers, $rows];

        case 'customer_ledgers':
            $stmt = $pdo->query("
                SELECT 
                    c.id as customer_id, c.name as customer_name, c.type, c.phone,
                    COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.amount ELSE 0 END), 0) as total_sales,
                    COALESCE(SUM(CASE WHEN t.transaction_type = 'CUSTOMER_RECEIPT' THEN t.amount ELSE 0 END), 0) as total_receipts,
                    (COALESCE(SUM(CASE WHEN t.transaction_type = 'SALE' THEN t.amount ELSE 0 END), 0) - 
                     COALESCE(SUM(CASE WHEN t.transaction_type = 'CUSTOMER_RECEIPT' THEN t.amount ELSE 0 END), 0)) as balance_receivable
                FROM customers c
                LEFT JOIN transactions t ON t.party_type = 'CUSTOMER' AND t.party_id = c.id
                GROUP BY c.id
                ORDER BY c.name ASC
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $headers = ['Customer ID', 'Customer Name', 'Type', 'Phone', 'Total Sales (₹)', 'Total Receipts Received (₹)', 'Net Balance Receivable (₹)'];
            return [$headers, $rows];

        case 'profit_loss':
            // Calculate total sales, purchases, expenses
            $stmtSales = $pdo->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE party_type = 'CUSTOMER' AND transaction_type = 'SALE'");
            $totalSales = (float)$stmtSales->fetch()['total'];

            $stmtPurchases = $pdo->query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE party_type = 'FARMER' AND transaction_type = 'PURCHASE'");
            $totalPurchases = (float)$stmtPurchases->fetch()['total'];

            $stmtExpenses = $pdo->query("SELECT COALESCE(SUM(amount), 0) as total FROM expenses");
            $totalExpenses = (float)$stmtExpenses->fetch()['total'];

            $netProfit = $totalSales - ($totalPurchases + $totalExpenses);

            $rows = [
                ['Metric' => 'Total Sales Revenue (₹)', 'Amount' => number_format($totalSales, 2, '.', '')],
                ['Metric' => 'Total Stock Purchases (₹)', 'Amount' => number_format($totalPurchases, 2, '.', '')],
                ['Metric' => 'Total Operational Expenses (₹)', 'Amount' => number_format($totalExpenses, 2, '.', '')],
                ['Metric' => 'Net Profit / Loss (₹)', 'Amount' => number_format($netProfit, 2, '.', '')]
            ];
            $headers = ['Financial Summary Metric', 'Amount (₹)'];
            return [$headers, $rows];

        case 'inventory':
        case 'orders':
        case 'trips':
        case 'trip_expenses':
        default:
            // Generic handler for optional/future tables
            $tableName = $type;
            try {
                $stmt = $pdo->query("SELECT * FROM `$tableName` LIMIT 5000");
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $headers = !empty($rows) ? array_keys($rows[0]) : ['id', 'details', 'created_at'];
                return [$headers, $rows];
            } catch (Exception $e) {
                return [['Status'], [['No data available for ' . $type]]];
            }
    }
}

/**
 * Builds CSV string content with UTF-8 BOM
 */
function buildCsvString($headers, $rows) {
    $fp = fopen('php://temp', 'r+');
    // UTF-8 BOM for Excel compatibility
    fwrite($fp, "\xEF\xBB\xBF");
    fputcsv($fp, $headers);
    foreach ($rows as $row) {
        fputcsv($fp, array_values($row));
    }
    rewind($fp);
    $csv = stream_get_contents($fp);
    fclose($fp);
    return $csv;
}

// Log audit event
logAudit($pdo, $user['id'], $user['email'], 'Business Data Export Created', [
    'export_type' => $type
]);

if ($type === 'everything') {
    // Generate ZIP file with all CSV files
    $exportTypes = [
        'farmers', 'customers', 'transactions', 'sales', 'purchases', 
        'farmer_payments', 'customer_receipts', 'expenses', 'inventory', 
        'orders', 'trips', 'trip_expenses', 'farmer_ledgers', 'customer_ledgers', 'profit_loss'
    ];

    if (!class_exists('ZipArchive')) {
        sendError('ZipArchive PHP extension is not enabled on this server.', 500);
    }

    $zip = new ZipArchive();
    $zipFilename = 'nursery_business_export_' . date('Y-m-d') . '.zip';
    $tmpZipPath = sys_get_temp_dir() . '/' . uniqid('export_') . '.zip';

    if ($zip->open($tmpZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        sendError('Failed to create ZIP archive file.', 500);
    }

    foreach ($exportTypes as $expType) {
        list($headers, $rows) = getExportData($pdo, $expType);
        $csvContent = buildCsvString($headers, $rows);
        $zip->addFromString($expType . '.csv', $csvContent);
    }

    $zip->close();

    if (ob_get_level()) {
        ob_end_clean();
    }

    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zipFilename . '"');
    header('Content-Length: ' . filesize($tmpZipPath));
    header('Pragma: no-cache');
    header('Expires: 0');

    readfile($tmpZipPath);
    @unlink($tmpZipPath);
    exit;
} else {
    // Single CSV file download
    list($headers, $rows) = getExportData($pdo, $type);
    $csvContent = buildCsvString($headers, $rows);
    $filename = 'nursery_' . $type . '_export_' . date('Y-m-d') . '.csv';

    if (ob_get_level()) {
        ob_end_clean();
    }

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
    header('Expires: 0');

    echo $csvContent;
    exit;
}
