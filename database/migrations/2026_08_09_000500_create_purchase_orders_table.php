<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Purchase Orders - skip if exists
        if (!Schema::hasTable('purchase_orders')) {
            Schema::create('purchase_orders', function (Blueprint $t) {
            $t->id();
            $t->string('po_number')->unique(); // شماره امر خریداری
            $t->enum('contract_type', ['absolute_sale', 'lease']); // م-3(ه) or م-3(د)
            $t->string('ministry_organ')->nullable(); // وزارت/ارگان
            $t->date('issue_date'); // تاریخ صدور
            $t->foreignId('requisition_id')->nullable()->constrained('requisitions')->nullOnDelete();
            $t->string('contractor_id_number')->nullable(); // شماره هویت قراردادی
            $t->foreignId('budget_code_id')->nullable()->constrained('budget_codes')->nullOnDelete();
            $t->date('delivery_date')->nullable(); // تاريخ تسليمی
            $t->string('delivery_location')->nullable(); // محل تسليمی
            $t->decimal('grand_total', 18, 2)->default(0); // مجموع
            $t->enum('payment_type', ['deferred', 'installment', 'immediate'])->default('immediate'); // مؤجل / بالتقسیط / معجل
            $t->text('installment_details')->nullable(); // required if installment
            $t->date('receipt_report_date')->nullable(); // راپور رسید
            $t->string('receipt_report_number')->nullable();
            $t->foreignId('financial_controller_id')->nullable()->constrained('users')->nullOnDelete(); // Section ج
            $t->text('remarks')->nullable(); // ملاحظات
            
            // Lease-specific fields (only for contract_type = lease)
            $t->text('item_description')->nullable(); // چیزی که به اجاره داده میشود
            $t->decimal('rate_per_unit', 18, 2)->nullable(); // اُجرت فی واحد
            $t->decimal('total_rent_value', 18, 2)->nullable(); // ارزش اُجرت
            $t->decimal('total_rent_sum', 18, 2)->nullable(); // مجموع اُجرت
            $t->text('profit_determination')->nullable(); // تعیین منفعت
            $t->boolean('profit_accessibility_confirmed')->default(false); // منفعت مقدورالاستیفاء باشد
            $t->boolean('lease_conditions_present')->default(false); // موجودیت شروط انعقاد اجاره
            $t->boolean('counterparty_signature_required')->default(false); // امضأ عاقدین
            
            $t->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled'])->default('draft');
            $t->string('fiscal_year', 4)->default('1405');
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('submitted_at')->nullable();
            $t->timestamps();
            $t->softDeletes();
            $t->index('po_number');
            $t->index('contract_type');
            $t->index('status');
            $t->index('fiscal_year');
            $t->index('requisition_id');
        });
        }

        // Purchase Order Items - skip if exists
        if (!Schema::hasTable('purchase_order_items')) {
            Schema::create('purchase_order_items', function (Blueprint $t) {
                $t->id();
                $t->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
                $t->integer('line_no');
                $t->text('description'); // توضيح
                $t->string('type_code')->nullable(); // کود نوع
                $t->string('classification_code')->nullable(); // کود تصنیف
                $t->foreignId('unit_id')->nullable()->constrained('units_of_measure')->nullOnDelete();
                $t->decimal('quantity', 18, 3);
                $t->decimal('unit_price', 18, 2);
                $t->decimal('line_total', 18, 2);
                $t->timestamps();
                $t->index('purchase_order_id');
            });
        }

        // Purchase Order Approvals - skip if exists
        if (!Schema::hasTable('purchase_order_approvals')) {
            Schema::create('purchase_order_approvals', function (Blueprint $t) {
                $t->id();
                $t->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
                $t->integer('step_order'); // 1: procurement, 2: accounting, 3: authorized officer, 4: contractor
                $t->string('step_name'); // procurement, accounting, authorized_officer, contractor
                $t->foreignId('signer_id')->nullable()->constrained('users')->nullOnDelete();
                $t->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $t->text('remarks')->nullable();
                $t->timestamp('signed_at')->nullable();
                $t->string('signature_image')->nullable();
                $t->timestamps();
                $t->index('purchase_order_id');
                $t->index('step_order');
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('purchase_order_approvals');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
    }
};
