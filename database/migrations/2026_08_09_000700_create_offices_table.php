<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('offices')) {
            Schema::create('offices', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('name_en')->nullable();
            $t->string('name_ps')->nullable();
            $t->string('name_fa')->nullable();
            $t->text('description')->nullable();
            $t->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $t->boolean('active')->default(true);
            $t->timestamps();
            $t->softDeletes();
            $t->index('name');
            $t->index('department_id');
        });
        }
    }

    public function down(): void {
        Schema::dropIfExists('offices');
    }
};
