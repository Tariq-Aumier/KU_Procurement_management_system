<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('username', 'admin')->first();
if ($user) {
    $user->password = 'Admin@123';
    $user->save();
    echo "Password reset successfully for admin user.\n";
} else {
    echo "Admin user not found.\n";
}
