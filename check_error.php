<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Get the last error from the log file
$logFile = storage_path('logs/laravel.log');
if (file_exists($logFile)) {
    $content = file_get_contents($logFile);
    // Find the last occurrence of the error message
    $lastErrorStart = strrpos($content, '[2026');
    if ($lastErrorStart !== false) {
        $errorContent = substr($content, $lastErrorStart, 2000);
        echo $errorContent;
    } else {
        echo "No error found in log\n";
    }
} else {
    echo "Log file not found\n";
}
