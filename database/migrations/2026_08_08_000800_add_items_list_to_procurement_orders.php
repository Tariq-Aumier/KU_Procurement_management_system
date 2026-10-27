<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procurement_orders', function (Blueprint $table) {
            // Add items_list column as JSON to store item details
            if (!Schema::hasColumn('procurement_orders', 'items_list')) {
                $table->json('items_list')->nullable()->after('items');
            }
        });
    }

    public function down(): void
    {
        Schema::table('procurement_orders', function (Blueprint $table) {
            if (Schema::hasColumn('procurement_orders', 'items_list')) {
                $table->dropColumn('items_list');
            }
        });
    }
};
