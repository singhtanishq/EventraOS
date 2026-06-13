<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('type', [
                'percentage_discount', 'fixed_discount', 'cashback', 'loyalty_bonus',
                'free_addon', 'upgrade', 'early_bird', 'last_minute', 'group_discount'
            ]);
            $table->decimal('value', 15, 4); // Percentage or fixed amount
            $table->string('currency', 3)->default('INR');
            $table->enum('applicable_to', ['all', 'hotels', 'flights', 'trains', 'buses', 'venues', 'cars', 'activities', 'transfers', 'packages']);
            $table->json('service_restrictions')->nullable(); // Specific services, categories, providers
            $table->json('destination_restrictions')->nullable(); // Countries, cities
            $table->json('customer_restrictions')->nullable(); // New, returning, vip, agent-booked
            $table->json('agent_restrictions')->nullable(); // Specific agents or all
            $table->unsignedInteger('min_booking_value')->nullable(); // In minor units
            $table->unsignedInteger('max_discount_amount')->nullable(); // Cap
            $table->unsignedInteger('usage_limit_total')->nullable(); // Total uses
            $table->unsignedInteger('usage_limit_per_customer')->default(1);
            $table->unsignedInteger('usage_limit_per_agent')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->date('valid_from');
            $table->date('valid_to');
            $table->time('valid_from_time')->nullable();
            $table->time('valid_to_time')->nullable();
            $table->json('blackout_dates')->nullable(); // Specific dates
            $table->boolean('can_stack')->default(false);
            $table->boolean('requires_promo_code')->default(false);
            $table->string('promo_code')->nullable()->unique();
            $table->boolean('is_auto_apply')->default(false);
            $table->integer('priority')->default(0); // Higher = applied first
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['applicable_to', 'is_active', 'valid_from', 'valid_to']);
            $table->index(['promo_code', 'is_active']);
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('promotion_id')->constrained('promotions')->cascadeOnDelete();
            $table->string('code')->unique();
            $table->enum('status', ['active', 'used', 'expired', 'revoked'])->default('active');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete(); // If assigned to specific customer
            $table->foreignId('agent_id')->nullable()->constrained('agents')->nullOnDelete(); // If issued by agent
            $table->timestamp('issued_at');
            $table->timestamp('used_at')->nullable();
            $table->foreignId('used_booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->timestamp('expires_at');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['code', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index(['promotion_id', 'status']);
        });

        Schema::create('promotion_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promotion_id')->constrained('promotions')->cascadeOnDelete();
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->nullOnDelete();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('agent_id')->nullable()->constrained('agents')->nullOnDelete();
            $table->decimal('discount_applied', 15, 4);
            $table->string('currency', 3)->default('INR');
            $table->timestamps();

            $table->index(['promotion_id', 'created_at']);
            $table->index(['customer_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_usage');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('promotions');
    }
};