<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('roles', function (Blueprint $t) { $t->id(); $t->string('code')->unique(); $t->string('name'); $t->text('description')->nullable(); $t->boolean('is_system')->default(false); $t->timestamps(); });
        Schema::create('permissions', function (Blueprint $t) { $t->id(); $t->string('code')->unique(); $t->string('module'); $t->string('action'); $t->text('description')->nullable(); $t->timestamps(); });
        Schema::create('role_permissions', function (Blueprint $t) { $t->foreignId('role_id')->constrained()->cascadeOnDelete(); $t->foreignId('permission_id')->constrained()->cascadeOnDelete(); $t->primary(['role_id','permission_id']); });
        Schema::create('user_roles', function (Blueprint $t) { $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->foreignId('role_id')->constrained()->cascadeOnDelete(); $t->foreignId('office_id')->nullable()->constrained()->nullOnDelete(); $t->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete(); $t->timestamps(); $t->unique(['user_id','role_id','office_id']); });
        Schema::create('company_contacts', function (Blueprint $t) { $t->id(); $t->foreignId('company_id')->constrained()->cascadeOnDelete(); $t->string('name'); $t->string('title')->nullable(); $t->string('phone')->nullable(); $t->string('email')->nullable(); $t->boolean('is_primary')->default(false); $t->timestamps(); });
        Schema::create('contract_amendments', function (Blueprint $t) { $t->id(); $t->foreignId('contract_id')->constrained()->cascadeOnDelete(); $t->string('amendment_no'); $t->text('reason'); $t->decimal('amount_delta',18,2)->default(0); $t->date('new_end_date')->nullable(); $t->decimal('new_amount',18,2)->nullable(); $t->string('status')->default('draft'); $t->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete(); $t->timestamp('approved_at')->nullable(); $t->timestamps(); $t->unique(['contract_id','amendment_no']); });
        Schema::create('document_links', function (Blueprint $t) { $t->id(); $t->foreignId('document_id')->constrained()->cascadeOnDelete(); $t->string('entity_type'); $t->unsignedBigInteger('entity_id'); $t->string('purpose')->default('supporting'); $t->boolean('is_primary')->default(false); $t->timestamps(); $t->index(['entity_type','entity_id']); });
        Schema::create('system_settings', function (Blueprint $t) { $t->id(); $t->string('setting_key')->unique(); $t->json('value_json'); $t->boolean('is_secret')->default(false); $t->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete(); $t->timestamps(); });
        Schema::create('notification_preferences', function (Blueprint $t) { $t->id(); $t->foreignId('user_id')->constrained()->cascadeOnDelete(); $t->string('event_key'); $t->boolean('in_app_enabled')->default(true); $t->boolean('email_enabled')->default(false); $t->boolean('sms_enabled')->default(false); $t->timestamps(); $t->unique(['user_id','event_key']); });
        Schema::create('export_jobs', function (Blueprint $t) { $t->id(); $t->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete(); $t->string('report_code'); $t->string('format'); $t->json('parameters_json')->nullable(); $t->string('status')->default('queued'); $t->string('storage_path')->nullable(); $t->text('error_message')->nullable(); $t->timestamp('expires_at')->nullable(); $t->timestamps(); });
        Schema::create('backups', function (Blueprint $t) { $t->id(); $t->string('storage_path')->unique(); $t->string('checksum',64); $t->string('status')->default('completed'); $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete(); $t->timestamp('restore_tested_at')->nullable(); $t->timestamp('retention_until')->nullable(); $t->timestamps(); });
    }
    public function down(): void { foreach(['backups','export_jobs','notification_preferences','system_settings','document_links','contract_amendments','company_contacts','user_roles','role_permissions','permissions','roles'] as $table) Schema::dropIfExists($table); }
};
