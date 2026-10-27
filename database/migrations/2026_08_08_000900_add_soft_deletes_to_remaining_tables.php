<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Add soft deletes to tables that don't have it yet
        $tables = [
            'office_categories',
            'offices',
            'inventory_locations',
            'order_items',
            'rfq_items',
            'rfq_vendor_invitations',
            'bids',
            'bid_items',
            'evaluation_committees',
            'committee_members',
            'bid_evaluations',
            'awards',
            'contract_progress_updates',
            'inventory_movements',
            'company_violations',
            'notifications',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->softDeletes();
                });
            }
        }
    }

    public function down(): void {
        $tables = [
            'office_categories',
            'offices',
            'inventory_locations',
            'order_items',
            'rfq_items',
            'rfq_vendor_invitations',
            'bids',
            'bid_items',
            'evaluation_committees',
            'committee_members',
            'bid_evaluations',
            'awards',
            'contract_progress_updates',
            'inventory_movements',
            'company_violations',
            'notifications',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropSoftDeletes();
                });
            }
        }
    }
};
