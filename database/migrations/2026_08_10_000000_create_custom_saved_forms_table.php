<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('custom_saved_forms', function (Blueprint $table) {
            $table->id();
            $table->string('form_type');
            $table->json('form_data');
            $table->string('title');
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            
            $table->index('form_type');
            $table->index('status');
            $table->index('created_by');
        });
    }

    public function down(): void {
        Schema::dropIfExists('custom_saved_forms');
    }
};
