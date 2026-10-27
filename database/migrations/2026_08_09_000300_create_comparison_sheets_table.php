<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Comparison Sheets - skip if exists
        if (!Schema::hasTable('comparison_sheets')) {
            Schema::create('comparison_sheets', function (Blueprint $t) {
            $t->id();
            $t->string('rfq_document_number')->nullable(); // شماره سند درخواست نرخ گیری
            $t->date('rfq_date')->nullable();
            $t->string('implementing_agency')->nullable(); // اداره تطبیق کننده
            $t->foreignId('requesting_department_id')->nullable();
            $t->string('funding_source')->nullable(); // منبع وجوه مالی
            $t->string('funder')->nullable(); // تمویل کننده
            $t->foreignId('budget_code_id')->nullable()->constrained('budget_codes')->nullOnDelete();
            $t->decimal('estimated_price', 18, 2)->default(0);
            $t->text('award_recommendation')->nullable(); // پشنهاد اعطا
            $t->foreignId('certifier_id')->nullable()->constrained('users')->nullOnDelete(); // تایید کننده
            $t->foreignId('approver1_id')->nullable()->constrained('users')->nullOnDelete(); // منظور کننده 1
            $t->foreignId('approver2_id')->nullable()->constrained('users')->nullOnDelete(); // منظور کننده 2
            $t->foreignId('requisition_id')->nullable()->constrained('requisitions')->nullOnDelete();
            $t->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected'])->default('draft');
            $t->text('remarks')->nullable();
            $t->string('fiscal_year', 4)->default('1405');
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('submitted_at')->nullable();
            $t->timestamps();
            $t->softDeletes();
            $t->index('rfq_document_number');
            $t->index('status');
            $t->index('fiscal_year');
            $t->index('requisition_id');
        });
        }

        // Comparison Items - skip if exists
        if (!Schema::hasTable('comparison_items')) {
            Schema::create('comparison_items', function (Blueprint $t) {
                $t->id();
                $t->foreignId('comparison_sheet_id')->constrained('comparison_sheets')->cascadeOnDelete();
                $t->integer('line_no');
                $t->string('item_name');
                $t->text('technical_description')->nullable();
                $t->foreignId('unit_id')->nullable()->constrained('units_of_measure')->nullOnDelete();
                $t->decimal('quantity', 18, 3);
                $t->timestamps();
                $t->index('comparison_sheet_id');
            });
        }

        // Comparison Bidders - skip if exists
        if (!Schema::hasTable('comparison_bidders')) {
            Schema::create('comparison_bidders', function (Blueprint $t) {
                $t->id();
                $t->foreignId('comparison_sheet_id')->constrained('comparison_sheets')->cascadeOnDelete();
                $t->string('name');
                $t->string('address')->nullable();
                $t->boolean('is_winner')->default(false);
                $t->decimal('grand_total', 18, 2)->default(0);
                $t->integer('rank')->nullable();
                $t->text('remarks')->nullable();
                $t->timestamps();
                $t->index('comparison_sheet_id');
            });
        }

        // Comparison Bidder Prices - skip if exists
        if (!Schema::hasTable('comparison_bidder_prices')) {
            Schema::create('comparison_bidder_prices', function (Blueprint $t) {
                $t->id();
                $t->foreignId('comparison_bidder_id')->constrained('comparison_bidders')->cascadeOnDelete();
                $t->foreignId('comparison_item_id')->constrained('comparison_items')->cascadeOnDelete();
                $t->decimal('unit_price', 18, 2);
                $t->decimal('line_total', 18, 2);
                $t->text('remarks')->nullable();
                $t->timestamps();
                $t->unique(['comparison_bidder_id', 'comparison_item_id'], 'cmp_bidder_item_unique');
            });
        }

        // Comparison Committee Members - skip if exists
        if (!Schema::hasTable('comparison_committee_members')) {
            Schema::create('comparison_committee_members', function (Blueprint $t) {
                $t->id();
                $t->foreignId('comparison_sheet_id')->constrained('comparison_sheets')->cascadeOnDelete();
                $t->string('member_name');
                $t->string('position')->nullable();
                $t->string('signature_image')->nullable();
                $t->boolean('has_signed')->default(false);
                $t->timestamp('signed_at')->nullable();
                $t->text('remarks')->nullable();
                $t->timestamps();
                $t->index('comparison_sheet_id');
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('comparison_committee_members');
        Schema::dropIfExists('comparison_bidder_prices');
        Schema::dropIfExists('comparison_bidders');
        Schema::dropIfExists('comparison_items');
        Schema::dropIfExists('comparison_sheets');
    }
};
