<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('m2_request_rows', function (Blueprint $table) {
            // Update columns to match frontend form
            if (Schema::hasColumn('m2_request_rows', 'notes')) {
                $table->dropColumn('notes');
            }
            if (Schema::hasColumn('m2_request_rows', 'requesting_branch')) {
                $table->dropColumn('requesting_branch');
            }
            if (Schema::hasColumn('m2_request_rows', 'supplier')) {
                $table->dropColumn('supplier');
            }
        });

        Schema::table('m2_request_rows', function (Blueprint $table) {
            // Rename and add columns to match frontend
            $table->renameColumn('estimated_amount', 'estimated_price');
            $table->decimal('paid_price', 18, 2)->nullable()->after('estimated_price');
        });
    }

    public function down(): void {
        Schema::table('m2_request_rows', function (Blueprint $table) {
            $table->dropColumn('paid_price');
            $table->renameColumn('estimated_price', 'estimated_amount');
        });

        Schema::table('m2_request_rows', function (Blueprint $table) {
            $table->text('notes')->nullable();
            $table->string('requesting_branch')->nullable();
            $table->string('supplier')->nullable();
        });
    }
};
