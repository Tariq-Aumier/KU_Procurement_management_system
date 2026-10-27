<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('office_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('office_id')->constrained('offices')->restrictOnDelete();
            $t->foreignId('procurement_order_id')->nullable()->constrained('procurement_orders')->nullOnDelete();
            $t->string('item_name');
            $t->string('category')->default('equipment');
            $t->decimal('quantity', 18, 3)->default(0);
            $t->decimal('unit_price', 18, 2)->default(0);
            $t->string('currency', 3)->default('AFN');
            $t->decimal('total_value', 18, 2)->default(0);
            $t->date('received_date')->nullable();
            $t->string('condition')->default('new');
            $t->timestamps();
            $t->softDeletes();
            $t->index(['office_id', 'category']);
            $t->index('procurement_order_id');
        });

        // Add description column to offices table
        Schema::table('offices', function (Blueprint $t) {
            $t->text('description')->nullable()->after('name_fa');
        });

        // Update procurement_orders table to include equipment and supplies categories
        Schema::table('procurement_orders', function (Blueprint $t) {
            $t->json('items')->nullable()->after('description');
        });
    }

    public function down(): void {
        Schema::table('procurement_orders', function (Blueprint $t) {
            $t->dropColumn('items');
        });

        Schema::table('offices', function (Blueprint $t) {
            $t->dropColumn('description');
        });

        Schema::dropIfExists('office_items');
    }
};
