<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // M-3 (H) Forms Table (بیع مطلق)
        if (!Schema::hasTable('m3h_forms')) {
            Schema::create('m3h_forms', function (Blueprint $table) {
                $table->id();
                $table->string('order_number')->unique();
                $table->date('issue_date');
                $table->string('purchasing_ministry')->nullable();
                $table->string('purchase_request_number')->nullable();
                $table->string('contract_id_number')->nullable();
                // Account Code breakdown
                $table->string('org_code')->nullable();
                $table->string('project_code')->nullable();
                $table->string('program_code')->nullable();
                $table->string('fund_code')->nullable();
                $table->string('type_code')->nullable();
                $table->string('classification_code')->nullable();
                $table->string('reason_code')->nullable();
                $table->string('item_type_code')->nullable();
                $table->date('delivery_date')->nullable();
                $table->string('delivery_place')->nullable();
                $table->decimal('total_price', 18, 2)->default(0);
                $table->boolean('payment_deferred')->default(false);
                $table->string('payment_installments')->nullable();
                $table->boolean('payment_immediate')->default(false);
                $table->date('receipt_report_date')->nullable();
                $table->string('receipt_report_number')->nullable();
                // Section B signatures
                $table->string('procurement_dept_signature')->nullable();
                $table->date('procurement_dept_date')->nullable();
                $table->string('registry_dept_signature')->nullable();
                $table->date('registry_dept_date')->nullable();
                $table->string('authorized_officer_signature')->nullable();
                $table->date('authorized_officer_date')->nullable();
                $table->string('contractor_signature')->nullable();
                $table->date('contractor_date')->nullable();
                // Section C
                $table->string('financial_controller_signature')->nullable();
                $table->date('financial_controller_date')->nullable();
                $table->text('remarks')->nullable();
                $table->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'cancelled'])->default('draft');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
                $table->index('order_number');
                $table->index('status');
                $table->index('issue_date');
            });
        }

        // M-3 (H) Items Table
        if (!Schema::hasTable('m3h_items')) {
            Schema::create('m3h_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('m3h_form_id')->constrained('m3h_forms')->cascadeOnDelete();
                $table->unsignedInteger('line_no');
                $table->text('description');
                $table->string('type_code')->nullable();
                $table->string('classification_code')->nullable();
                $table->decimal('quantity', 18, 3);
                $table->string('unit');
                $table->decimal('unit_price', 18, 2);
                $table->decimal('total_price', 18, 2);
                $table->timestamps();
                $table->index('m3h_form_id');
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('m3h_items');
        Schema::dropIfExists('m3h_forms');
    }
};
