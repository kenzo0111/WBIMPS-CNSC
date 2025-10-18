<?php
try {
    $c = new PDO('mysql:host=127.0.0.1;dbname=supplysystem;charset=utf8','root','');
    foreach ($c->query('SHOW COLUMNS FROM products') as $row) {
        echo $row['Field'] . PHP_EOL;
    }
} catch (Exception $e) {
    echo 'ERROR: ' . $e->getMessage() . PHP_EOL;
}
