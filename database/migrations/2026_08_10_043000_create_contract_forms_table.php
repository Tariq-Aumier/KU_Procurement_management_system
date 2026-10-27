<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_forms', function (Blueprint $t) {
            $t->id();
            $t->string('form_number')->unique(); // Auto-generated number
            $t->date('form_date'); // 1405/ / format
            $t->string('customer_name')->nullable(); // اسم مشتری
            $t->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete(); // Company/Office
            $t->foreignId('office_id')->nullable()->constrained('offices')->nullOnDelete(); // Office
            $t->text('description')->nullable(); // Descriptions under table
            $t->decimal('grand_total', 18, 2)->default(0); // Total of all line totals
            $t->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('draft');
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('submitted_at')->nullable();
            $t->timestamps();
            $t->softDeletes();
            $t->index('form_number');
            $t->index('status');
            $t->index('company_id');
            $t->index('office_id');
        });

        Schema::create('contract_form_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('contract_form_id')->constrained('contract_forms')->cascadeOnDelete();
            $t->integer('line_no');
            $t->string('item_name'); // اسم جنس
            $t->text('specifications')->nullable(); // مشخصات
            $t->foreignId('unit_id')->nullable()->constrained('units_of_measure')->nullOnDelete(); // واحد
            $t->decimal('quantity', 18, 3); // مقدار
            $t->decimal('unit_price', 18, 2); // قیمت فی واحد
            $t->decimal('line_total', 18, 2); // قیمت مجموعی (auto-calculated)
            $t->timestamps();
            $t->index('contract_form_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_form_items');
        Schema::dropIfExists('contract_forms');
    }
};
