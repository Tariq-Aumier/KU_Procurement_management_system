<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        // Unit of Measure - skip if exists
        if (!Schema::hasTable('units_of_measure')) {
            Schema::create('units_of_measure', function (Blueprint $t) {
                $t->id();
                $t->string('name');
                $t->string('name_en')->nullable();
                $t->string('name_ps')->nullable();
                $t->string('name_fa')->nullable();
                $t->string('abbreviation')->nullable();
                $t->timestamps();
                $t->softDeletes();
            });
        }

        // Budget Code - skip if exists
        if (!Schema::hasTable('budget_codes')) {
            Schema::create('budget_codes', function (Blueprint $t) {
                $t->id();
                $t->string('organ_code'); // کود ارگان
                $t->string('project_code'); // کود پروژه
                $t->string('program_code'); // کود برنامه
                $t->string('fund_code'); // کود وجه
                $t->string('type_code'); // کود نوع
                $t->string('classification_code'); // کود تصنیف
                $t->string('full_code')->virtualAs("CONCAT(organ_code, '-', project_code, '-', program_code, '-', fund_code, '-', type_code, '-', classification_code)");
                $t->text('description')->nullable();
                $t->decimal('allocated_amount', 18, 2)->default(0);
                $t->decimal('committed_amount', 18, 2)->default(0);
                $t->decimal('available_amount', 18, 2)->virtualAs('allocated_amount - committed_amount');
                $t->string('fiscal_year', 4)->default('1405');
                $t->timestamps();
                $t->softDeletes();
                $t->index('full_code');
                $t->index('fiscal_year');
            });
        }

        // Requisition - skip if exists
        if (!Schema::hasTable('requisitions')) {
            Schema::create('requisitions', function (Blueprint $t) {
                $t->id();
                $t->string('request_number')->unique(); // شماره درخواست خریداری
                $t->foreignId('department_id')->nullable();
                $t->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
                $t->string('title');
                $t->text('description')->nullable();
                $t->foreignId('budget_code_id')->nullable()->constrained('budget_codes')->nullOnDelete();
                $t->decimal('estimated_amount', 18, 2)->default(0);
                $t->enum('status', ['draft', 'submitted', 'in_progress', 'completed', 'cancelled'])->default('draft');
                $t->string('fiscal_year', 4)->default('1405');
                $t->timestamp('submitted_at')->nullable();
                $t->timestamp('completed_at')->nullable();
                $t->timestamps();
                $t->softDeletes();
                $t->index('request_number');
                $t->index('status');
                $t->index('fiscal_year');
            });
        }

        // Approval Workflow - skip if exists
        if (!Schema::hasTable('approval_steps')) {
            Schema::create('approval_steps', function (Blueprint $t) {
                $t->id();
                $t->string('document_type'); // rfq, comparison, purchase_order, etc.
                $t->foreignId('document_id');
                $t->integer('step_order'); // 1, 2, 3, etc.
                $t->string('required_role')->nullable(); // admin, manager, finance, etc.
                $t->foreignId('signer_id')->nullable()->constrained('users')->nullOnDelete();
                $t->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $t->text('remarks')->nullable();
                $t->timestamp('signed_at')->nullable();
                $t->string('signature_image')->nullable();
                $t->timestamps();
                $t->index(['document_type', 'document_id']);
                $t->index('step_order');
            });
        }

        // Item / Commodity Catalog - skip if exists
        if (!Schema::hasTable('catalog_items')) {
            Schema::create('catalog_items', function (Blueprint $t) {
                $t->id();
                $t->string('name');
                $t->string('name_en')->nullable();
                $t->string('name_ps')->nullable();
                $t->string('name_fa')->nullable();
                $t->text('description')->nullable();
                $t->foreignId('unit_id')->nullable()->constrained('units_of_measure')->nullOnDelete();
                $t->string('category')->nullable();
                $t->decimal('default_unit_price', 18, 2)->nullable();
                $t->boolean('active')->default(true);
                $t->timestamps();
                $t->softDeletes();
                $t->index('name');
                $t->index('category');
            });
        }

        // Audit Log - skip if exists
        if (!Schema::hasTable('procurement_audit_logs')) {
            Schema::create('procurement_audit_logs', function (Blueprint $t) {
                $t->id();
                $t->string('document_type');
                $t->foreignId('document_id');
                $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $t->string('action'); // created, updated, submitted, approved, rejected, deleted
                $t->text('old_values')->nullable();
                $t->text('new_values')->nullable();
                $t->text('remarks')->nullable();
                $t->ipAddress('ip_address')->nullable();
                $t->string('user_agent')->nullable();
                $t->timestamps();
                $t->index(['document_type', 'document_id']);
                $t->index('user_id');
                $t->index('created_at');
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('procurement_audit_logs');
        Schema::dropIfExists('catalog_items');
        Schema::dropIfExists('approval_steps');
        Schema::dropIfExists('requisitions');
        Schema::dropIfExists('budget_codes');
        Schema::dropIfExists('units_of_measure');
    }
};
