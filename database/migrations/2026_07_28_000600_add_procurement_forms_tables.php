<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // RFQ Forms Table
        Schema::create('rfq_forms', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->date('issue_date');
            $table->date('deadline');
            $table->string('to_company')->nullable();
            $table->string('requesting_department');
            $table->string('submission_office');
            $table->text('purpose');
            $table->decimal('total_amount', 18, 2)->default(0);
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // RFQ Items Table
        Schema::create('rfq_form_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rfq_form_id')->constrained('rfq_forms')->cascadeOnDelete();
            $table->unsignedInteger('line_no');
            $table->string('name');
            $table->text('technical_spec')->nullable();
            $table->string('unit');
            $table->decimal('quantity', 18, 3);
            $table->decimal('unit_price', 18, 2);
            $table->timestamps();
            $table->unique(['rfq_form_id', 'line_no'], 'rfq_form_line_unique');
        });

        // M2 Forms Table
        Schema::create('m2_forms', function (Blueprint $table) {
            $table->id();
            $table->string('sequence_number')->unique();
            $table->date('date');
            $table->string('requesting_department');
            $table->string('approval_department');
            $table->string('fund_source');
            $table->string('budget_code');
            $table->decimal('total_amount', 18, 2)->default(0);
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // M2 Request Rows Table
        Schema::create('m2_request_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('m2_form_id')->constrained('m2_forms')->cascadeOnDelete();
            $table->unsignedInteger('line_no');
            $table->text('description');
            $table->string('unit');
            $table->decimal('quantity', 18, 3);
            $table->decimal('unit_price', 18, 2);
            $table->decimal('estimated_amount', 18, 2);
            $table->text('notes')->nullable();
            $table->string('requesting_branch')->nullable();
            $table->string('supplier')->nullable();
            $table->timestamps();
            $table->unique(['m2_form_id', 'line_no'], 'm2_form_line_unique');
        });

        // Evaluation Forms Table
        Schema::create('evaluation_forms', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->text('title');
            $table->date('date');
            $table->decimal('total_amount', 18, 2)->default(0);
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // Evaluation Items Table
        Schema::create('evaluation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_form_id')->constrained('evaluation_forms')->cascadeOnDelete();
            $table->unsignedInteger('line_no');
            $table->string('name');
            $table->text('specification')->nullable();
            $table->string('unit');
            $table->decimal('quantity', 18, 3);
            $table->timestamps();
            $table->unique(['evaluation_form_id', 'line_no'], 'eval_form_line_unique');
        });

        // Evaluation Bidders Table
        Schema::create('evaluation_bidders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_form_id')->constrained('evaluation_forms')->cascadeOnDelete();
            $table->string('name');
            $table->string('type');
            $table->decimal('total_price', 18, 2)->default(0);
            $table->boolean('is_winner')->default(false);
            $table->timestamps();
        });

        // Evaluation Bidder Prices Table
        Schema::create('evaluation_bidder_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_bidder_id')->constrained('evaluation_bidders')->cascadeOnDelete();
            $table->foreignId('evaluation_item_id')->constrained('evaluation_items')->restrictOnDelete();
            $table->decimal('unit_price', 18, 2);
            $table->decimal('total_price', 18, 2);
            $table->timestamps();
            $table->unique(['evaluation_bidder_id', 'evaluation_item_id'], 'ev_bidder_item_unique');
        });

        // Evaluation Committee Members Table
        Schema::create('evaluation_committee_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluation_form_id')->constrained('evaluation_forms')->cascadeOnDelete();
            $table->string('member_name');
            $table->string('position')->nullable();
            $table->string('signature')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->timestamps();
        });

        // Form Submissions Archive Table
        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('submission_id')->unique();
            $table->string('form_type'); // RFQ, M2, EVAL
            $table->text('title');
            $table->date('date');
            $table->string('reference_number');
            $table->decimal('total_amount', 18, 2)->default(0);
            $table->string('status')->default('submitted'); // draft, submitted, approved
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void {
        Schema::dropIfExists('form_submissions');
        Schema::dropIfExists('evaluation_committee_members');
        Schema::dropIfExists('evaluation_bidder_prices');
        Schema::dropIfExists('evaluation_bidders');
        Schema::dropIfExists('evaluation_items');
        Schema::dropIfExists('evaluation_forms');
        Schema::dropIfExists('m2_request_rows');
        Schema::dropIfExists('m2_forms');
        Schema::dropIfExists('rfq_form_items');
        Schema::dropIfExists('rfq_forms');
    }
};
