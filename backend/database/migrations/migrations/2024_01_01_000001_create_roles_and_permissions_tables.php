<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'bookings.view', 'bookings.cancel'
            $table->string('guard_name')->default('web');
            $table->string('group')->nullable(); // e.g., 'bookings', 'customers', 'reports'
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // 'customer', 'agent', 'admin', 'super_admin'
            $table->string('guard_name')->default('web');
            $table->string('display_name')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false); // Cannot be deleted
            $table->timestamps();
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['role_id', 'permission_id']);
        });

        Schema::create('model_has_permissions', function (Blueprint $table) {
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->morphs('model');
            $table->primary(['permission_id', 'model_id', 'model_type']);
        });

        Schema::create('model_has_roles', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->morphs('model');
            $table->primary(['role_id', 'model_id', 'model_type']);
        });

        // Cache table for spatie/laravel-permission
        Schema::create('permission_role', function (Blueprint $table) {
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->primary(['permission_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('model_has_roles');
        Schema::dropIfExists('model_has_permissions');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('roles');
        Schema::dropIfExists('permissions');
    }
};