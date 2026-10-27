<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procurement_orders', function (Blueprint $table) {
            // Add equipment column if it doesn't exist
            if (!Schema::hasColumn('procurement_orders', 'equipment')) {
                $table->decimal('equipment', 18, 2)->default(0)->after('amount');
            }
            
            // Modify existing items column from text to numeric
            if (Schema::hasColumn('procurement_orders', 'items')) {
                $table->decimal('items', 18, 2)->default(0)->nullable()->change();
            } else {
                $table->decimal('items', 18, 2)->default(0)->after('equipment');
            }
        });
    }

    public function down(): void
    {
        Schema::table('procurement_orders', function (Blueprint $table) {
            $table->dropColumn(['equipment', 'items']);
        });
    }
};
