<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

http_response_code(501);
echo json_encode([
  'success' => false,
  'message' => 'Endpoint scaffold. Implement CRUD/business logic here.'
]);
