# cPanel Deployment

1. Create a MySQL database in cPanel.
2. Create a database user and grant ALL PRIVILEGES.
3. Import database/schema.sql using phpMyAdmin.
4. Edit backend/api/config/database.php.
5. In frontend run npm install and npm run build.
6. Upload frontend/dist contents to public_html.
7. Upload backend/api to public_html/api.
8. Test public_html/api/dashboard/summary.php.
9. Configure React routing for Apache if required.
