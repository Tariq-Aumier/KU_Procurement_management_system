<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // RFQ Forms - skip if exists
        if (!Schema::hasTable('rfq_forms')) {
            Schema::create('rfq_forms', function (Blueprint $t) {
            $t->id();
            $t->string('rfq_number')->unique(); // شماره درخواست نرخ گیری
            $t->date('issue_date'); // تاریخ صدور
            $t->string('addressed_to')->nullable(); // به:
            $t->datetime('submission_deadline'); // آفر سربسته شما الی...
            $t->string('submission_location')->nullable(); // تسلیم داده شود به...
            $t->integer('validity_period_days')->default(30); // اعتبار آفر
            $t->decimal('quantity_variance_pct', 5, 2)->default(25); // حد تغییر مقدار نیازمندی
            $t->boolean('local_preference_applicable')->default(false); // ترجیح داخلی
            $t->decimal('local_preference_pct', 5, 2)->nullable(); // فیصدی ترجیح داخلی
            $t->foreignId('department_id')->nullable();
            $t->foreignId('issuing_officer_id')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('requisition_id')->nullable()->constrained('requisitions')->nullOnDelete();
            $t->enum('status', ['draft', 'submitted', 'published', 'closed', 'cancelled'])->default('draft');
            $t->decimal('subtotal_excl_tax', 18, 2)->nullable();
            $t->decimal('tax_amount', 18, 2)->nullable();
            $t->decimal('total_incl_tax', 18, 2)->nullable();
            $t->string('total_incl_tax_words')->nullable();
            $t->integer('delivery_period_days')->nullable();
            $t->integer('warranty_period_days')->nullable();
            $t->text('remarks')->nullable();
            $t->string('fiscal_year', 4)->default('1405');
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('submitted_at')->nullable();
            $t->timestamps();
            $t->softDeletes();
            $t->index('rfq_number');
            $t->index('status');
            $t->index('fiscal_year');
            $t->index('requisition_id');
        });
        }

        // RFQ Items - skip if exists
        if (!Schema::hasTable('rfq_items')) {
            Schema::create('rfq_items', function (Blueprint $t) {
                $t->id();
                $t->foreignId('rfq_form_id')->constrained('rfq_forms')->cascadeOnDelete();
                $t->integer('line_no');
                $t->string('item_name'); // خانه‌پری توسط اداره
                $t->text('technical_description')->nullable();
                $t->foreignId('unit_id')->nullable()->constrained('units_of_measure')->nullOnDelete();
                $t->decimal('quantity', 18, 3);
                $t->decimal('unit_price', 18, 2)->nullable(); // Filled by bidder
                $t->decimal('line_total', 18, 2)->nullable(); // Filled by bidder
                $t->timestamps();
                $t->index('rfq_form_id');
            });
        }

        // RFQ Bidders - skip if exists
        if (!Schema::hasTable('rfq_bidders')) {
            Schema::create('rfq_bidders', function (Blueprint $t) {
                $t->id();
                $t->foreignId('rfq_form_id')->constrained('rfq_forms')->cascadeOnDelete();
                $t->string('name');
                $t->string('address')->nullable();
                $t->string('contact_person')->nullable();
                $t->string('contact_phone')->nullable();
                $t->string('email')->nullable();
                $t->boolean('is_winner')->default(false);
                $t->datetime('submitted_at')->nullable();
                $t->text('remarks')->nullable();
                $t->boolean('has_business_license')->default(false);
                $t->boolean('has_tax_id')->default(false);
                $t->boolean('has_manufacturer_auth')->default(false);
                $t->string('signature_image')->nullable();
                $t->string('stamp_image')->nullable();
                $t->timestamps();
                $t->index('rfq_form_id');
            });
        }

        // RFQ Bidder Prices - skip if exists
        if (!Schema::hasTable('rfq_bidder_prices')) {
            Schema::create('rfq_bidder_prices', function (Blueprint $t) {
                $t->id();
                $t->foreignId('rfq_bidder_id')->constrained('rfq_bidders')->cascadeOnDelete();
                $t->foreignId('rfq_item_id')->constrained('rfq_items')->cascadeOnDelete();
                $t->decimal('unit_price', 18, 2);
                $t->decimal('line_total', 18, 2);
                $t->text('remarks')->nullable();
                $t->timestamps();
                $t->unique(['rfq_bidder_id', 'rfq_item_id'], 'rfq_bidder_item_unique');
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('rfq_bidder_prices');
        Schema::dropIfExists('rfq_bidders');
        Schema::dropIfExists('rfq_items');
        Schema::dropIfExists('rfq_forms');
    }
};
