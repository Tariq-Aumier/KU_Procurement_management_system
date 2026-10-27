<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create System Administrator
        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'System Administrator',
                'email' => 'admin@kabuluniversity.edu.af',
                'password' => Hash::make('Admin@123'),
                'role' => User::ROLE_ADMIN,
                'active' => true,
                'password_changed_at' => now(),
            ]
        );

        $this->command->info('System Administrator created or updated: ' . $admin->username);

        // Create Procurement User
        $procurementUser = User::firstOrCreate(
            ['username' => 'procurement'],
            [
                'name' => 'Procurement User',
                'email' => 'procurement@kabuluniversity.edu.af',
                'password' => Hash::make('Procurement@123'),
                'role' => User::ROLE_PROCUREMENT_USER,
                'active' => true,
                'password_changed_at' => now(),
            ]
        );

        $this->command->info('Procurement User created or updated: ' . $procurementUser->username);

        $this->command->info('Default users seeded successfully!');
        $this->command->info('----------------------------------------');
        $this->command->info('System Administrator:');
        $this->command->info('  Username: admin');
        $this->command->info('  Password: Admin@123');
        $this->command->info('');
        $this->command->info('Procurement User:');
        $this->command->info('  Username: procurement');
        $this->command->info('  Password: Procurement@123');
        $this->command->info('----------------------------------------');
        $this->command->warn('Please change these passwords after first login!');
    }
}
