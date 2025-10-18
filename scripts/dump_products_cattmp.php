<?php
try {
    $c = new PDO('mysql:host=127.0.0.1;dbname=supplysystem;charset=utf8','root','');
    $stmt = $c->query('SELECT id, sku, name, category_id_tmp FROM products LIMIT 20');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo 'ERROR: ' . $e->getMessage() . PHP_EOL;
}
