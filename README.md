# Nursery Business Management

React + Vite + Bootstrap frontend with PHP + MySQL backend for cPanel.

## Local development

cd frontend
npm install
npm run dev

## Desktop App (.exe)

cd desktop
npm install
npm start        # Run Desktop App in development
npm run dist     # Build standalone Windows installer (.exe) in desktop/dist-app/

## Production

npm run build

Upload frontend/dist contents to public_html/.
Upload backend/api to public_html/api/.
Create MySQL database and import database/schema.sql.
Update backend/api/config/database.php with cPanel credentials.

## Accounting

Customer outstanding = Sales - Customer Receipts.
Farmer outstanding = Purchases - Farmer Payments.
Profit = Sales - Plant Purchase Cost - Operating Expenses.

The starter UI is intentionally scaffolded so the API and business forms can be implemented without changing the project structure.