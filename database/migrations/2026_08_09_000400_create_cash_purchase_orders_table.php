<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Cash Purchase Orders - skip if exists
        if (!Schema::hasTable('cash_purchase_orders')) {
            Schema::create('cash_purchase_orders', function (Blueprint $t) {
            $t->id();
            $t->string('serial_number')->unique(); // نمبر مسلسل
            $t->date('issue_date'); // مورخ
            $t->foreignId('requested_by_department_id')->nullable();
            $t->foreignId('requested_by_person_id')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('approving_officer_id')->nullable()->constrained('users')->nullOnDelete();
            $t->string('private_number')->nullable(); // نمبر خصوصی
            $t->string('allocation_number')->nullable(); // نمبر تخصیص
            $t->foreignId('accounting_department_id')->nullable();
            $t->decimal('committed_amount', 18, 2)->default(0); // مبلغ تعهد
            $t->decimal('payment_order_amount', 18, 2)->default(0); // امر تادیه
            $t->string('total_amount_words')->nullable(); // مبلغ مجموعی (Dari words)
            $t->foreignId('certifier_id')->nullable()->constrained('users')->nullOnDelete(); // تصدیق کننده (م-12)
            $t->foreignId('control_dept_id')->nullable()->constrained('users')->nullOnDelete(); // م-12
            $t->foreignId('final_control_id')->nullable()->constrained('users')->nullOnDelete(); // م-16
            $t->foreignId('requisition_id')->nullable()->constrained('requisitions')->nullOnDelete();
            $t->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'cancelled'])->default('draft');
            $t->text('remarks')->nullable();
            $t->string('fiscal_year', 4)->default('1405');
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('submitted_at')->nullable();
            $t->timestamps();
            $t->softDeletes();
            $t->index('serial_number');
            $t->index('status');
            $t->index('fiscal_year');
            $t->index('requisition_id');
        });
        }

        // Cash PO Items - skip if exists
        if (!Schema::hasTable('cash_po_items')) {
            Schema::create('cash_po_items', function (Blueprint $t) {
                $t->id();
                $t->foreignId('cash_po_id')->constrained('cash_purchase_orders')->cascadeOnDelete();
                $t->integer('line_no');
                $t->text('description'); // تشریحات
                $t->foreignId('unit_id')->nullable()->constrained('units_of_measure')->nullOnDelete();
                $t->decimal('quantity', 18, 3);
                $t->decimal('unit_price', 18, 2);
                $t->decimal('estimated_price', 18, 2); // قیمت تخمینی = qty × unit_price
                $t->decimal('paid_price', 18, 2)->nullable(); // قیمت تادیه شده
                $t->string('purchased_from')->nullable(); // خریداری از شخص
                $t->timestamps();
                $t->index('cash_po_id');
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('cash_po_items');
        Schema::dropIfExists('cash_purchase_orders');
    }
};
