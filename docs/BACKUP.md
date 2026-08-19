# Backup & Restore System Documentation

## Overview

The Nursery Management application includes a complete, high-reliability database backup, restore, retention management, and business data export system. 

It provides two distinct layers:
1. **Full MySQL Database Backup**: A complete SQL dump (including structure, data, indexes, foreign keys, and auto increments) for complete disaster recovery.
2. **Business Data Export**: Export individual financial ledgers and operational data as Excel-compatible CSV spreadsheets or a complete ZIP package.

---

## Architecture & Security

- **Storage Location**: Backup `.sql` files are stored in a secure directory outside `public_html` (e.g. `/home/CPANEL_USERNAME/nursery_backups/`) or in a protected `/secure_backups/` directory configured with `.htaccess` `Require all denied` and an empty `index.php` file to block direct HTTP access.
- **Credential Protection**: Database credentials (username, password, host) are kept strictly server-side and never exposed to React or returned via any API.
- **Path Traversal Security**: Backup filenames are generated server-side using timestamps (`nursery_backup_YYYY-MM-DD_HHMMSS.sql`). Downloads require authentication, admin role verification, and database record matching.
- **Dual Backup Engines**:
  - **Primary**: Native `mysqldump` execution via server CLI.
  - **Fallback**: Built-in High-Precision PHP MySQL Dumper if `mysqldump` command is restricted by host environment.

---

## API Endpoints Summary

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/backups/status.php` | GET | Admin | Returns system status (`mysqldump` availability, directory writability, DB connection). |
| `/api/backups/create.php` | POST | Admin | Triggers a full MySQL database backup and returns log details. |
| `/api/backups/list.php` | GET | Admin | Lists backup history, system stats, and automated backup settings. |
| `/api/backups/download.php?id={id}` | GET | Admin | Streams secure `.sql` file download for the specified backup log ID. |
| `/api/backups/delete.php?id={id}` | DELETE | Admin | Safely deletes physical backup file and log record. |
| `/api/backups/restore.php` | POST | Admin | Restores database from a selected backup ID or uploaded `.sql` file. |
| `/api/backups/settings.php` | GET / POST | Admin | Fetches and updates automatic backup schedule settings. |
| `/api/backups/cron-backup.php` | CLI / GET | System | cPanel Cron background execution script. |
| `/api/backups/export.php?type={type}` | GET / POST | Admin | Downloads CSV spreadsheet or ZIP package of business data. |
| `/api/backups/test.php` | POST | Admin | Executes system diagnostic check. |

---

## Automated cPanel Cron Backup Setup

The system includes automated backup support triggered by cPanel Cron.

### Step 1: Locate PHP Binary on cPanel
Open cPanel **Terminal** or check **Cron Jobs** section to find your cPanel PHP CLI path. Common paths include:
- `/usr/local/bin/php`
- `/usr/bin/php`
- `/opt/cpanel/ea-php82/root/usr/bin/php`

### Step 2: Configure Cron Command
In cPanel > **Cron Jobs**:
1. Select Frequency: **Once per day (0 2 * * *)** to run at 2:00 AM.
2. Enter Command:
   ```bash
   /usr/local/bin/php /home/CPANEL_USERNAME/public_html/backend/api/backups/cron-backup.php
   ```
   *(Replace `/home/CPANEL_USERNAME/public_html/` with your actual cPanel document root path).*

3. Save Cron Job.

---

## Retention Policy

The system automatically manages backup retention:
- Configurable retention limit: **7, 15, 30, 60, or 90 backups** (default: 30).
- When a new successful backup is generated, older backups exceeding the retention count are deleted from server storage.
- **Safety Safeguard**: The retention policy will **NEVER** delete the last remaining successful backup on the system.
