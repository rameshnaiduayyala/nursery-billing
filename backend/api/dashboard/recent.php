<?php
require_once __DIR__ . '/../config/auth_helper.php';

// Latest 10 transactions
$stmtTx = $pdo->query("
    SELECT 
        t.*,
        CASE 
            WHEN t.party_type = 'FARMER' THEN f.name
            WHEN t.party_type = 'CUSTOMER' THEN c.name
            ELSE 'Unknown'
        END AS party_name
    FROM transactions t
    LEFT JOIN farmers f ON t.party_type = 'FARMER' AND t.party_id = f.id
    LEFT JOIN customers c ON t.party_type = 'CUSTOMER' AND t.party_id = c.id
    ORDER BY t.created_at DESC, t.id DESC
    LIMIT 10
");
$recentTransactions = $stmtTx->fetchAll();

foreach ($recentTransactions as &$tx) {
    $tx['id'] = (int)$tx['id'];
    $tx['party_id'] = (int)$tx['party_id'];
    $tx['amount'] = (float)$tx['amount'];
}

// Latest 5 expenses
$stmtExp = $pdo->query("SELECT * FROM expenses ORDER BY created_at DESC, id DESC LIMIT 5");
$recentExpenses = $stmtExp->fetchAll();

foreach ($recentExpenses as &$exp) {
    $exp['id'] = (int)$exp['id'];
    $exp['amount'] = (float)$exp['amount'];
}

sendJson([
    'success' => true,
    'data' => [
        'recent_transactions' => $recentTransactions,
        'recent_expenses' => $recentExpenses
    ]
]);
