<?php
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/auth_helper.php';

/**
 * Ensures backup system tables exist and settings are populated.
 */
function ensureBackupTablesExist($pdo) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS backup_logs (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              user_id INT UNSIGNED NULL,
              backup_type VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
              filename VARCHAR(255) NOT NULL,
              file_path TEXT NOT NULL,
              file_size BIGINT UNSIGNED DEFAULT 0,
              status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
              error_message TEXT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_created (created_at),
              INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS restore_logs (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              user_id INT UNSIGNED NULL,
              backup_filename VARCHAR(255) NOT NULL,
              pre_restore_backup VARCHAR(255) NULL,
              started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              completed_at TIMESTAMP NULL,
              status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
              error_message TEXT NULL,
              INDEX idx_started (started_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS audit_logs (
              id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
              user_id INT UNSIGNED NULL,
              user_email VARCHAR(190) NULL,
              action VARCHAR(100) NOT NULL,
              details TEXT NULL,
              ip_address VARCHAR(45) NULL,
              status VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              INDEX idx_audit_created (created_at),
              INDEX idx_audit_action (action)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        // Seed default backup settings if missing
        $defaults = [
            'backup_auto_enabled' => '1',
            'backup_frequency' => 'daily',
            'backup_time' => '02:00',
            'backup_retention_count' => '30'
        ];

        $stmt = $pdo->prepare("INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (:key, :val)");
        foreach ($defaults as $k => $v) {
            $stmt->execute([':key' => $k, ':val' => $v]);
        }
    } catch (Exception $e) {
        // Suppress if tables exist or permission error
    }
}

/**
 * Returns absolute path to secure backup directory outside or blocked from HTTP.
 */
function getSecureBackupDir() {
    $candidates = [
        dirname(__DIR__, 2) . '/secure_backups',
        __DIR__ . '/../../secure_backups',
        __DIR__ . '/secure_backups',
        sys_get_temp_dir() . '/nursery_backups'
    ];

    foreach ($candidates as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        if (is_dir($dir) && is_writable($dir)) {
            protectDirectory($dir);
            return realpath($dir) ?: $dir;
        }
    }

    return __DIR__;
}

/**
 * Protects directory using .htaccess and index.php
 */
function protectDirectory($dir) {
    if (!is_dir($dir) || !is_writable($dir)) return;
    $htaccess = $dir . '/.htaccess';
    if (!file_exists($htaccess)) {
        $content = "<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n    Order deny,allow\n    Deny from all\n</IfModule>\n";
        @file_put_contents($htaccess, $content);
    }

    $indexFile = $dir . '/index.php';
    if (!file_exists($indexFile)) {
        @file_put_contents($indexFile, "<?php http_response_code(403); exit('Access denied'); ?>");
    }
}

/**
 * Checks if function is disabled in php.ini
 */
function isFunctionDisabled($functionName) {
    $disabled = explode(',', ini_get('disable_functions'));
    $disabled = array_map('trim', array_map('strtolower', $disabled));
    return in_array(strtolower($functionName), $disabled);
}

/**
 * Checks if mysqldump CLI binary is available on the system.
 */
function isMysqldumpAvailable() {
    if (isFunctionDisabled('exec') && isFunctionDisabled('shell_exec')) {
        return false;
    }

    $cmd = (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') ? 'where mysqldump' : 'which mysqldump';
    $output = [];
    $returnCode = 1;

    if (!isFunctionDisabled('exec')) {
        @exec($cmd, $output, $returnCode);
        if ($returnCode === 0 && !empty($output)) {
            return true;
        }
    }

    if (!isFunctionDisabled('shell_exec')) {
        $res = @shell_exec($cmd);
        if ($res && trim($res) !== '') {
            return true;
        }
    }

    return false;
}

/**
 * Log audit events to audit_logs table.
 */
function logAudit($pdo, $userId, $userEmail, $action, $details = null, $status = 'SUCCESS') {
    ensureBackupTablesExist($pdo);
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare("
            INSERT INTO audit_logs (user_id, user_email, action, details, ip_address, status)
            VALUES (:user_id, :user_email, :action, :details, :ip, :status)
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':user_email' => $userEmail,
            ':action' => $action,
            ':details' => is_array($details) ? json_encode($details) : $details,
            ':ip' => $ip,
            ':status' => $status
        ]);
    } catch (Exception $e) {
        // Ignore audit failure
    }
}

/**
 * Pure PHP MySQL Database Dumper
 * Dumps structure, data, auto_increments, and indexes for all tables.
 */
function generateSqlDumpPurePhp($pdo, $dbName) {
    $dump = "-- ==================================================\n";
    $dump .= "-- MySQL Database Backup Dump\n";
    $dump .= "-- Database: " . $dbName . "\n";
    $dump .= "-- Date: " . date('Y-m-d H:i:s') . "\n";
    $dump .= "-- Generated by Nursery Management System\n";
    $dump .= "-- ==================================================\n\n";

    $dump .= "SET FOREIGN_KEY_CHECKS=0;\n";
    $dump .= "SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\n";
    $dump .= "SET time_zone = \"+00:00\";\n";
    $dump .= "SET NAMES utf8mb4;\n\n";

    // Fetch all tables
    $tables = [];
    $stmt = $pdo->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }

    foreach ($tables as $table) {
        $dump .= "-- --------------------------------------------------\n";
        $dump .= "-- Table structure for `$table`\n";
        $dump .= "-- --------------------------------------------------\n";
        $dump .= "DROP TABLE IF EXISTS `$table`;\n";

        $createStmt = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
        $createSql = $createStmt['Create Table'] ?? '';
        $dump .= $createSql . ";\n\n";

        $dump .= "-- Data for `$table`\n";
        $dataStmt = $pdo->query("SELECT * FROM `$table`");
        $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($rows)) {
            $columnNames = array_keys($rows[0]);
            $quotedColumns = array_map(function ($col) {
                return "`" . str_replace("`", "``", $col) . "`";
            }, $columnNames);
            $colList = implode(", ", $quotedColumns);

            $dump .= "INSERT INTO `$table` ($colList) VALUES\n";

            $valuesList = [];
            foreach ($rows as $row) {
                $valArr = [];
                foreach ($row as $val) {
                    if ($val === null) {
                        $valArr[] = 'NULL';
                    } else {
                        $valArr[] = $pdo->quote($val);
                    }
                }
                $valuesList[] = "(" . implode(", ", $valArr) . ")";
            }

            $dump .= implode(",\n", $valuesList) . ";\n\n";
        }
    }

    $dump .= "SET FOREIGN_KEY_CHECKS=1;\n";
    return $dump;
}

/**
 * Creates a complete database backup using mysqldump or PHP fallback.
 */
function createDatabaseBackup($pdo, $backupType = 'MANUAL', $userId = null, $userEmail = null) {
    ensureBackupTablesExist($pdo);

    // Resolve DB Connection Parameters from database.php globals
    $dbHost = $GLOBALS['DB_CONFIG_HOST'] ?? 'localhost';
    $dbUser = $GLOBALS['DB_CONFIG_USER'] ?? 'rbjpogrx_ramesh_nursery';
    $dbPass = $GLOBALS['DB_CONFIG_PASS'] ?? 'Rameshaa@16';
    
    $dbName = null;
    try {
        $stmt = $pdo->query("SELECT DATABASE()");
        $dbName = $stmt ? $stmt->fetchColumn() : null;
    } catch (Exception $e) {}
    if (empty($dbName)) {
        $dbName = $GLOBALS['DB_CONFIG_NAME'] ?? 'rbjpogrx_ramesh_nursery';
    }

    $backupDir = getSecureBackupDir();
    $timestamp = date('Y-m-d_His');
    $filename = "nursery_backup_{$timestamp}.sql";
    $filePath = $backupDir . '/' . $filename;

    $success = false;
    $errorMsg = null;
    $methodUsed = 'PHP_DUMPER';

    // Attempt 1: mysqldump CLI if available
    if (isMysqldumpAvailable()) {
        $methodUsed = 'MYSQLDUMP';
        $hostArg = escapeshellarg((string)$dbHost);
        $userArg = escapeshellarg((string)$dbUser);
        $passArg = escapeshellarg((string)$dbPass);
        $dbArg   = escapeshellarg((string)$dbName);
        $fileArg = escapeshellarg((string)$filePath);

        $cmd = "mysqldump --host={$hostArg} --user={$userArg} --password={$passArg} --add-drop-table --no-create-db --routines --triggers --single-transaction {$dbArg} > {$fileArg}";
        
        $output = [];
        $returnVar = 1;
        if (!isFunctionDisabled('exec')) {
            @exec($cmd, $output, $returnVar);
        } elseif (!isFunctionDisabled('system')) {
            @system($cmd, $returnVar);
        }

        if ($returnVar === 0 && file_exists($filePath) && filesize($filePath) > 0) {
            $success = true;
        } else {
            $errorMsg = "mysqldump command execution failed with code {$returnVar}";
        }
    }

    // Fallback: Pure PHP Dumper
    if (!$success) {
        try {
            $dumpContent = generateSqlDumpPurePhp($pdo, $dbName);
            if (file_put_contents($filePath, $dumpContent) !== false && filesize($filePath) > 0) {
                $success = true;
                $errorMsg = null;
            } else {
                $errorMsg = "Failed to write backup file to directory: {$backupDir}";
            }
        } catch (Exception $e) {
            $errorMsg = $e->getMessage();
        }
    }

    $fileSize = (file_exists($filePath) && $success) ? filesize($filePath) : 0;
    $status = $success ? 'SUCCESS' : 'FAILED';
    $backupId = null;

    // Record in backup_logs
    try {
        $stmt = $pdo->prepare("
            INSERT INTO backup_logs (user_id, backup_type, filename, file_path, file_size, status, error_message)
            VALUES (:user_id, :backup_type, :filename, :file_path, :file_size, :status, :error_message)
        ");
        $stmt->execute([
            ':user_id' => $userId,
            ':backup_type' => $backupType,
            ':filename' => $filename,
            ':file_path' => $filePath,
            ':file_size' => $fileSize,
            ':status' => $status,
            ':error_message' => $errorMsg
        ]);
        $backupId = $pdo->lastInsertId();
    } catch (Exception $e) {
        // Log insertion fallback
    }

    // Audit log
    logAudit($pdo, $userId, $userEmail, 'Backup Created', [
        'filename' => $filename,
        'size_bytes' => $fileSize,
        'backup_type' => $backupType,
        'method' => $methodUsed,
        'status' => $status
    ], $status);

    if ($success) {
        applyRetentionPolicy($pdo);
        return [
            'success' => true,
            'backup_id' => $backupId,
            'filename' => $filename,
            'file_size' => $fileSize,
            'created_at' => date('Y-m-d H:i:s'),
            'method' => $methodUsed
        ];
    } else {
        return [
            'success' => false,
            'message' => $errorMsg ?: 'Failed to generate database backup'
        ];
    }
}

/**
 * Applies backup retention policy (deletes backups exceeding configured limit).
 */
function applyRetentionPolicy($pdo) {
    ensureBackupTablesExist($pdo);
    try {
        // Fetch retention count setting
        $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'backup_retention_count'");
        $stmt->execute();
        $row = $stmt->fetch();
        $retentionLimit = isset($row['setting_value']) ? (int)$row['setting_value'] : 30;
        if ($retentionLimit <= 0) $retentionLimit = 30;

        // Count successful backups
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM backup_logs WHERE status = 'SUCCESS'");
        $count = (int)$stmt->fetch()['count'];

        if ($count > $retentionLimit) {
            $toDeleteCount = $count - $retentionLimit;
            // Never delete the single newest successful backup
            $stmt = $pdo->prepare("
                SELECT id, filename, file_path 
                FROM backup_logs 
                WHERE status = 'SUCCESS' 
                ORDER BY created_at ASC, id ASC 
                LIMIT :limit
            ");
            $stmt->bindValue(':limit', $toDeleteCount, PDO::PARAM_INT);
            $stmt->execute();
            $oldBackups = $stmt->fetchAll();

            foreach ($oldBackups as $backup) {
                // Delete physical file if exists
                if (file_exists($backup['file_path'])) {
                    @unlink($backup['file_path']);
                }
                // Delete DB record
                $delStmt = $pdo->prepare("DELETE FROM backup_logs WHERE id = :id");
                $delStmt->execute([':id' => $backup['id']]);
            }
        }
    } catch (Exception $e) {
        // Ignore retention failure
    }
}

/**
 * Restores database from a given SQL file path.
 */
function restoreDatabaseFromSql($pdo, $sqlFilePath, $userId = null, $userEmail = null) {
    ensureBackupTablesExist($pdo);

    if (!file_exists($sqlFilePath) || filesize($sqlFilePath) === 0) {
        return ['success' => false, 'message' => 'Backup file does not exist or is empty.'];
    }

    $backupFilename = basename($sqlFilePath);

    // 1. Perform a Safety Pre-Restore Backup FIRST
    $preRestoreResult = createDatabaseBackup($pdo, 'PRE_RESTORE', $userId, $userEmail);
    $preRestoreFilename = $preRestoreResult['success'] ? $preRestoreResult['filename'] : null;

    // 2. Insert into restore_logs
    $stmt = $pdo->prepare("
        INSERT INTO restore_logs (user_id, backup_filename, pre_restore_backup, started_at, status)
        VALUES (:user_id, :filename, :pre_backup, CURRENT_TIMESTAMP, 'PENDING')
    ");
    $stmt->execute([
        ':user_id' => $userId,
        ':filename' => $backupFilename,
        ':pre_backup' => $preRestoreFilename
    ]);
    $restoreId = $pdo->lastInsertId();

    logAudit($pdo, $userId, $userEmail, 'Restore Started', [
        'target_file' => $backupFilename,
        'pre_restore_backup' => $preRestoreFilename
    ]);

    try {
        $sqlContent = file_get_contents($sqlFilePath);
        if (trim($sqlContent) === '') {
            throw new Exception("SQL backup file content is empty.");
        }

        // Disable foreign key checks & execute multi query
        $pdo->exec("SET FOREIGN_KEY_CHECKS=0;");

        // Split queries by semicolon and execute cleanly
        $queries = preg_split('/;\s*[\r\n]+/', $sqlContent);
        foreach ($queries as $query) {
            $trimmed = trim($query);
            if ($trimmed !== '' && strpos($trimmed, '--') !== 0 && strpos($trimmed, '/*') !== 0) {
                // If statement is a CREATE TABLE without IF NOT EXISTS, drop table first to avoid #1050 table exists error
                if (preg_match('/^CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)(`?[\w_]+`?)/i', $trimmed, $matches)) {
                    $tableName = $matches[1];
                    try {
                        $pdo->exec("DROP TABLE IF EXISTS {$tableName};");
                    } catch (Exception $e) {}
                }
                
                try {
                    $pdo->exec($trimmed);
                } catch (Exception $ex) {
                    // Suppress harmless DROP failures if table didn't exist
                    if (strpos($trimmed, 'DROP TABLE') !== 0) {
                        throw $ex;
                    }
                }
            }
        }

        $pdo->exec("SET FOREIGN_KEY_CHECKS=1;");

        // Update restore_logs
        $upd = $pdo->prepare("UPDATE restore_logs SET status = 'SUCCESS', completed_at = CURRENT_TIMESTAMP WHERE id = :id");
        $upd->execute([':id' => $restoreId]);

        logAudit($pdo, $userId, $userEmail, 'Restore Completed', [
            'target_file' => $backupFilename,
            'status' => 'SUCCESS'
        ]);

        return ['success' => true, 'message' => 'Database successfully restored!'];
    } catch (Exception $e) {
        $errorMsg = $e->getMessage();
        try {
            $pdo->exec("SET FOREIGN_KEY_CHECKS=1;");
        } catch (Exception $ex) {}

        $upd = $pdo->prepare("UPDATE restore_logs SET status = 'FAILED', error_message = :err, completed_at = CURRENT_TIMESTAMP WHERE id = :id");
        $upd->execute([':err' => $errorMsg, ':id' => $restoreId]);

        logAudit($pdo, $userId, $userEmail, 'Restore Failed', [
            'target_file' => $backupFilename,
            'error' => $errorMsg
        ], 'FAILED');

        return ['success' => false, 'message' => 'Restore failed: ' . $errorMsg];
    }
}
