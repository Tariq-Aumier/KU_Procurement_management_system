<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('m2_forms', function (Blueprint $table) {
            // Drop old columns if they exist
            if (Schema::hasColumn('m2_forms', 'sequence_number')) {
                $table->dropColumn('sequence_number');
            }
            if (Schema::hasColumn('m2_forms', 'requesting_department')) {
                $table->dropColumn('requesting_department');
            }
            if (Schema::hasColumn('m2_forms', 'approval_department')) {
                $table->dropColumn('approval_department');
            }
            if (Schema::hasColumn('m2_forms', 'fund_source')) {
                $table->dropColumn('fund_source');
            }
            if (Schema::hasColumn('m2_forms', 'budget_code')) {
                $table->dropColumn('budget_code');
            }
        });

        Schema::table('m2_forms', function (Blueprint $table) {
            // Add new columns matching the frontend form (only if they don't exist)
            if (!Schema::hasColumn('m2_forms', 'serial_number')) {
                $table->string('serial_number')->unique()->after('id');
            }
            if (!Schema::hasColumn('m2_forms', 'requester_person')) {
                $table->string('requester_person')->nullable()->after('date');
            }
            if (!Schema::hasColumn('m2_forms', 'requester_branch')) {
                $table->string('requester_branch')->nullable()->after('requester_person');
            }
            if (!Schema::hasColumn('m2_forms', 'request_number')) {
                $table->string('request_number')->nullable()->after('requester_branch');
            }
            if (!Schema::hasColumn('m2_forms', 'amount_in_words')) {
                $table->string('amount_in_words')->nullable()->after('total_amount');
            }
            if (!Schema::hasColumn('m2_forms', 'purchase_from')) {
                $table->string('purchase_from')->nullable()->after('amount_in_words');
            }
            if (!Schema::hasColumn('m2_forms', 'purchase_committee_location')) {
                $table->string('purchase_committee_location')->nullable()->after('purchase_from');
            }
            if (!Schema::hasColumn('m2_forms', 'purchase_committee_date')) {
                $table->date('purchase_committee_date')->nullable()->after('purchase_committee_location');
            }
            if (!Schema::hasColumn('m2_forms', 'approval_officer')) {
                $table->string('approval_officer')->nullable()->after('purchase_committee_date');
            }
            if (!Schema::hasColumn('m2_forms', 'calculation_branch')) {
                $table->string('calculation_branch')->nullable()->after('approval_officer');
            }
            if (!Schema::hasColumn('m2_forms', 'allocation_number')) {
                $table->string('allocation_number')->nullable()->after('calculation_branch');
            }
            if (!Schema::hasColumn('m2_forms', 'private_number')) {
                $table->string('private_number')->nullable()->after('allocation_number');
            }
            if (!Schema::hasColumn('m2_forms', 'commitment_amount')) {
                $table->decimal('commitment_amount', 18, 2)->default(0)->after('private_number');
            }
            if (!Schema::hasColumn('m2_forms', 'payment_order')) {
                $table->string('payment_order')->nullable()->after('commitment_amount');
            }
            if (!Schema::hasColumn('m2_forms', 'description')) {
                $table->text('description')->nullable()->after('payment_order');
            }
            if (!Schema::hasColumn('m2_forms', 'm16_certifier')) {
                $table->string('m16_certifier')->nullable()->after('description');
            }
            if (!Schema::hasColumn('m2_forms', 'm12_certifier')) {
                $table->string('m12_certifier')->nullable()->after('m16_certifier');
            }

            // Update status enum
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'cancelled'])->default('draft')->change();

            // Add indexes
            if (!Schema::hasIndex('m2_forms', 'm2_forms_serial_number_index')) {
                $table->index('serial_number');
            }
            if (!Schema::hasIndex('m2_forms', 'm2_forms_status_index')) {
                $table->index('status');
            }
            if (!Schema::hasIndex('m2_forms', 'm2_forms_date_index')) {
                $table->index('date');
            }
        });
    }

    public function down(): void {
        Schema::table('m2_forms', function (Blueprint $table) {
            // Drop new columns
            $table->dropColumn([
                'serial_number',
                'date',
                'requester_person',
                'requester_branch',
                'request_number',
                'total_amount',
                'amount_in_words',
                'purchase_from',
                'purchase_committee_location',
                'purchase_committee_date',
                'approval_officer',
                'calculation_branch',
                'allocation_number',
                'private_number',
                'commitment_amount',
                'payment_order',
                'description',
                'm16_certifier',
                'm12_certifier',
            ]);
        });

        Schema::table('m2_forms', function (Blueprint $table) {
            // Restore old columns
            $table->string('sequence_number')->unique();
            $table->date('date');
            $table->string('requesting_department');
            $table->string('approval_department');
            $table->string('fund_source');
            $table->string('budget_code');
        });
    }
};
