<?php
$dbPath = __DIR__ . '/../database/database.sqlite';
if (!file_exists($dbPath)) {
    echo "database.sqlite not found at: $dbPath\n";
    exit(1);
}
$pdo = new PDO('sqlite:' . $dbPath);
$stmt = $pdo->query('SELECT id, name, slug FROM roles');
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (empty($rows)) {
    echo "No roles found\n";
    exit(0);
}
foreach ($rows as $r) {
    echo "{$r['id']} | {$r['name']} | {$r['slug']}\n";
}
