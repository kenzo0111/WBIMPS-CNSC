<?php

// Laravel development server router
// Serves static assets from the public directory and routes everything else to public/index.php

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));

// If the requested file exists in the public directory, let PHP's built-in server serve it
if ($uri !== '/' && file_exists(__DIR__ . '/public' . $uri)) {
    return false;
}

// Otherwise, route the request through the Laravel front controller
require_once __DIR__ . '/public/index.php';
