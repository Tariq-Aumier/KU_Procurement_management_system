<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Add soft deletes to users table
        Schema::table('users', function (Blueprint $t) {
            $t->softDeletes();
        });

        // Add soft deletes to office_categories table
        Schema::table('office_categories', function (Blueprint $t) {
            $t->softDeletes();
        });

        // Add soft deletes to offices table
        Schema::table('offices', function (Blueprint $t) {
            $t->softDeletes();
        });

        // Add soft deletes to inventory_locations table
        Schema::table('inventory_locations', function (Blueprint $t) {
            $t->softDeletes();
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $t) {
            $t->dropSoftDeletes();
        });

        Schema::table('office_categories', function (Blueprint $t) {
            $t->dropSoftDeletes();
        });

        Schema::table('offices', function (Blueprint $t) {
            $t->dropSoftDeletes();
        });

        Schema::table('inventory_locations', function (Blueprint $t) {
            $t->dropSoftDeletes();
        });
    }
};
