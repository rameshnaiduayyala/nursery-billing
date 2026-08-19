# Disaster Recovery Procedure

## Scenario: Complete Server Failure

If the live production cPanel hosting server completely fails, crashes, or is destroyed, follow this exact step-by-step procedure to recover the nursery business data and bring the application back online on a new server.

---

## Prerequisites
- Downloaded latest backup file: `nursery_backup_YYYY-MM-DD_HHMMSS.sql`
- Source code of the application repository (React frontend build and PHP backend).

---

## Step 1: Provision New Hosting Server
1. Obtain a new cPanel hosting account or VPS server.
2. Log into cPanel on the new server.

---

## Step 2: Create a New MySQL Database
1. Open cPanel > **MySQL® Databases**.
2. Create a new database (e.g. `newcpaneluser_nursery_db`).

---

## Step 3: Create a New MySQL Database User
1. Under **MySQL® Users**, create a new database user (e.g. `newcpaneluser_nursery_user`) with a strong password.
2. Under **Add User To Database**, assign the new user to the newly created database.
3. Check **ALL PRIVILEGES** and click **Make Changes**.

---

## Step 4: Import Backup SQL File
1. Open cPanel > **phpMyAdmin**.
2. Select your newly created database from the left sidebar.
3. Click the **Import** tab in the top navigation.
4. Click **Choose File** and select your latest downloaded backup file (`nursery_backup_YYYY-MM-DD_HHMMSS.sql`).
5. Click **Go** at the bottom to execute the import.
6. Verify that all tables (`farmers`, `customers`, `transactions`, `expenses`, `users`, `settings`, `backup_logs`, etc.) and data rows are restored successfully.

---

## Step 5: Deploy Application Backend & Frontend
1. Upload the backend API code (`/backend/`) to your hosting server.
2. Upload the React production build (`/frontend/dist/` contents) to `public_html`.

---

## Step 6: Update Database Connection Credentials
1. Edit the database configuration file on the new server:
   ```
   backend/api/config/database.php
   ```
2. Update the configuration variables with the new database details:
   ```php
   $host = getenv('DB_HOST') ?: 'localhost';
   $db   = getenv('DB_NAME') ?: 'newcpaneluser_nursery_db';
   $user = getenv('DB_USER') ?: 'newcpaneluser_nursery_user';
   $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : 'YourNewDatabasePassword';
   ```

---

## Step 7: Verify System Functionality
1. Open your web browser and navigate to the application URL (e.g. `https://yourdomain.com/`).
2. Log in using your existing Admin credentials (e.g. `admin@nursery.com`).
3. Verify that all business financial records, farmer balances, customer ledgers, sales transactions, and settings have been completely restored without data loss.

---

## Migration Integrity Checklist

The following components survive server migration:
- [x] Farmers directory & notes
- [x] Customers & Exporters records
- [x] Transactions (Purchases, Payments, Sales, Receipts)
- [x] Expenses & Expense Categories
- [x] Farmer Ledgers & Payable Balances
- [x] Customer Ledgers & Receivable Balances
- [x] Profit & Loss Financial Summaries
- [x] User Accounts & Passwords
- [x] Application Settings
- [x] Backup & Restore Audit History
