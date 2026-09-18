<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('customer_number')->unique(); // CUST-XXXXXX
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other', 'prefer_not_to_say'])->nullable();
            $table->string('nationality')->nullable(); // ISO country code
            $table->string('passport_number')->nullable();
            $table->date('passport_expiry')->nullable();
            $table->string('passport_issuing_country')->nullable();
            $table->json('address')->nullable(); // {line1, line2, city, state, postal_code, country}
            $table->json('emergency_contact')->nullable(); // {name, phone, relationship}
            $table->json('travel_preferences')->nullable(); // seat, meal, airline, hotel, etc.
            $table->json('communication_preferences')->nullable(); // email, sms, whatsapp, push
            $table->decimal('wallet_balance', 15, 4)->default(0);
            $table->string('wallet_currency', 3)->default('INR');
            $table->unsignedBigInteger('loyalty_points')->default(0);
            $table->unsignedBigInteger('lifetime_spending')->default(0);
            $table->unsignedInteger('booking_count')->default(0);
            $table->unsignedInteger('completed_booking_count')->default(0);
            $table->unsignedInteger('cancelled_booking_count')->default(0);
            $table->timestamp('first_booking_at')->nullable();
            $table->timestamp('last_booking_at')->nullable();
            $table->unsignedBigInteger('assigned_agent_id')->nullable()->index();
            $table->boolean('is_vip')->default(false);
            $table->json('risk_flags')->nullable();
            $table->timestamps();

            $table->index('customer_number');
        });

        Schema::create('saved_travelers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('title')->nullable(); // Mr, Mrs, Ms, Dr
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('nationality')->nullable();
            $table->string('passport_number')->nullable();
            $table->date('passport_expiry')->nullable();
            $table->string('passport_issuing_country')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->json('preferences')->nullable(); // seat, meal, special assistance
            $table->enum('relationship', ['self', 'spouse', 'child', 'parent', 'sibling', 'friend', 'colleague', 'other'])->default('self');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['customer_id', 'is_active']);
        });

        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('agent_number')->unique(); // AGT-XXXXXX
            $table->string('employee_id')->nullable()->unique();
            $table->string('agency_name')->nullable();
            $table->string('agency_license')->nullable();
            $table->json('address')->nullable();
            $table->string('pan_number')->nullable(); // Tax ID
            $table->string('gstin')->nullable(); // GST number
            $table->json('bank_details')->nullable(); // For commission payouts
            $table->decimal('commission_rate', 5, 2)->default(0); // Default percentage
            $table->enum('commission_type', ['percentage', 'fixed', 'tiered'])->default('percentage');
            $table->json('commission_rules')->nullable(); // Per service type
            $table->decimal('monthly_target', 15, 2)->default(0);
            $table->decimal('monthly_booking_target')->default(0);
            $table->decimal('monthly_revenue_target', 15, 2)->default(0);
            $table->enum('status', ['active', 'inactive', 'suspended', 'terminated'])->default('active');
            $table->timestamp('joined_at')->nullable();
            $table->timestamp('last_active_at')->nullable();
            $table->foreignId('manager_id')->nullable()->constrained('agents')->nullOnDelete();
            $table->json('permissions')->nullable(); // Additional permissions
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('agent_number');
            $table->index(['status', 'manager_id']);
        });

        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('admin_number')->unique(); // ADM-XXXXXX
            $table->string('employee_id')->nullable()->unique();
            $table->string('department')->nullable();
            $table->enum('level', ['super_admin', 'admin', 'manager', 'support', 'finance', 'operations'])->default('admin');
            $table->json('permissions')->nullable(); // Granular permissions
            $table->boolean('can_manage_admins')->default(false);
            $table->boolean('can_manage_agents')->default(false);
            $table->boolean('can_manage_finances')->default(false);
            $table->boolean('can_view_audit_logs')->default(false);
            $table->boolean('can_manage_system')->default(false);
            $table->timestamp('last_active_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('admin_number');
            $table->index('level');
        });

        Schema::create('agent_customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('agents')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->enum('relationship_type', ['assigned', 'preferred', 'managed'])->default('assigned');
            $table->timestamp('assigned_at');
            $table->foreignId('assigned_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['agent_id', 'customer_id']);
            $table->index(['customer_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_customers');
        Schema::dropIfExists('admins');
        Schema::dropIfExists('agents');
        Schema::dropIfExists('saved_travelers');
        Schema::dropIfExists('customers');
    }
};