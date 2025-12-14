<?php

require_once __DIR__ . '/vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

$testFile = __DIR__ . '/test_rsmi_export.xlsx';

if (file_exists($testFile)) {
    $spreadsheet = IOFactory::load($testFile);
    $sheet = $spreadsheet->getActiveSheet();

    echo "Checking exported Excel file:" . PHP_EOL;
    echo "A11 (RIS No): " . $sheet->getCell('A11')->getValue() . PHP_EOL;
    echo "B11 (Responsibility Center Code): " . $sheet->getCell('B11')->getValue() . PHP_EOL;
    echo "C11 (Stock No): " . $sheet->getCell('C11')->getValue() . PHP_EOL;
    echo "D11 (Item): " . $sheet->getCell('D11')->getValue() . PHP_EOL;

    // Check if there are more rows
    for ($row = 12; $row <= 15; $row++) {
        $risNo = $sheet->getCell('A' . $row)->getValue();
        if (!empty($risNo)) {
            echo "A{$row} (RIS No): " . $risNo . PHP_EOL;
            echo "B{$row} (Responsibility Center Code): " . $sheet->getCell('B' . $row)->getValue() . PHP_EOL;
        }
    }
} else {
    echo "Test file not found" . PHP_EOL;
}