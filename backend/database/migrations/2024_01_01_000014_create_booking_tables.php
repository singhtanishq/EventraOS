<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('booking_reference')->unique(); // EVR-HTL-7X2M91
            $table->string('booking_number')->unique(); // Internal sequential number
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('agent_id')->nullable()->constrained('agents')->nullOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->enum('booking_source', ['customer', 'agent', 'admin', 'api'])->default('customer');
            $table->enum('status', [
                'draft',
                'held',
                'payment_pending',
                'payment_processing',
                'confirmed',
                'partially_confirmed',
                'cancel_requested',
                'cancelled',
                'reschedule_requested',
                'rescheduled',
                'completed',
                'refund_pending',
                'refunded',
                'failed'
            ])->default('draft');
            $table->enum('payment_status', [
                'unpaid',
                'partial',
                'paid',
                'refunded',
                'partially_refunded',
                'failed',
                'pending_verification'
            ])->default('unpaid');
            $table->decimal('subtotal', 15, 4)->default(0);
            $table->decimal('tax_total', 15, 4)->default(0);
            $table->decimal('fee_total', 15, 4)->default(0);
            $table->decimal('service_fee_total', 15, 4)->default(0);
            $table->decimal('discount_total', 15, 4)->default(0);
            $table->decimal('loyalty_discount', 15, 4)->default(0);
            $table->decimal('wallet_discount', 15, 4)->default(0);
            $table->decimal('grand_total', 15, 4)->default(0);
            $table->decimal('amount_paid', 15, 4)->default(0);
            $table->decimal('amount_refunded', 15, 4)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->string('base_currency', 3)->default('INR');
            $table->decimal('exchange_rate', 15, 6)->default(1);
            $table->json('exchange_rate_details')->nullable();
            $table->string('promo_code')->nullable();
            $table->foreignId('promotion_id')->nullable()->constrained('promotions')->nullOnDelete();
            $table->json('price_snapshot')->nullable(); // Full price breakdown at booking time
            $table->json('policy_snapshot')->nullable(); // Cancellation, change policies
            $table->json('special_requests')->nullable();
            $table->json('internal_notes')->nullable();
            $table->json('customer_notes')->nullable();
            $table->timestamp('hold_expires_at')->nullable();
            $table->timestamp('payment_due_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('cancellation_reason')->nullable();
            $table->json('cancellation_details')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'status']);
            $table->index(['agent_id', 'status']);
            $table->index(['status', 'created_at']);
            $table->index('booking_reference');
            $table->index(['hold_expires_at', 'status']);
        });

        Schema::create('booking_items', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('parent_item_id')->nullable()->constrained('booking_items')->nullOnDelete(); // For grouped items
            $table->enum('item_type', [
                'hotel', 'flight', 'train', 'bus', 'venue', 'car', 'activity', 'transfer', 'package', 'insurance', 'addon'
            ]);
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete(); // Polymorphic reference
            $table->string('service_name');
            $table->json('service_details')->nullable(); // Full snapshot of service at booking time
            $table->json('configuration')->nullable(); // Selected options, room, seat, etc.
            $table->json('travelers')->nullable(); // Guest/passenger details for this item
            $table->date('service_date')->nullable(); // Check-in, departure, event date
            $table->date('service_end_date')->nullable(); // Check-out, return date
            $table->time('service_time')->nullable(); // Departure time, event time
            $table->string('service_timezone')->nullable();
            $table->enum('item_status', [
                'pending', 'held', 'confirmed', 'partially_confirmed', 'cancelled', 'completed', 'failed', 'refunded'
            ])->default('pending');
            $table->foreignId('provider_id')->nullable()->constrained('providers')->nullOnDelete();
            $table->string('provider_booking_reference')->nullable();
            $table->string('provider_confirmation_number')->nullable();
            $table->decimal('base_price', 15, 4)->default(0);
            $table->decimal('tax_amount', 15, 4)->default(0);
            $table->decimal('fee_amount', 15, 4)->default(0);
            $table->decimal('service_fee', 15, 4)->default(0);
            $table->decimal('discount_amount', 15, 4)->default(0);
            $table->decimal('addon_total', 15, 4)->default(0);
            $table->decimal('total_price', 15, 4)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->json('cancellation_policy')->nullable();
            $table->json('change_policy')->nullable();
            $table->timestamp('confirmation_deadline')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->decimal('refund_amount', 15, 4)->default(0);
            $table->integer('sort_order')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'item_type']);
            $table->index(['provider_id', 'provider_booking_reference']);
            $table->index(['service_date', 'item_status']);
        });

        Schema::create('booking_guests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('booking_item_id')->constrained('booking_items')->cascadeOnDelete();
            $table->foreignId('saved_traveler_id')->nullable()->constrained('saved_travelers')->nullOnDelete();
            $table->string('title')->nullable();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('nationality')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('passport_number')->nullable();
            $table->date('passport_expiry')->nullable();
            $table->string('passport_issuing_country')->nullable();
            $table->string('visa_number')->nullable();
            $table->date('visa_expiry')->nullable();
            $table->json('special_requirements')->nullable(); // Dietary, mobility, medical
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_lead_guest')->default(false);
            $table->timestamps();

            $table->index(['booking_id', 'booking_item_id']);
        });

        Schema::create('booking_holds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('booking_item_id')->constrained('booking_items')->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('providers')->nullOnDelete();
            $table->string('provider_hold_reference')->nullable();
            $table->timestamp('expires_at');
            $table->enum('status', ['active', 'expired', 'confirmed', 'released', 'failed'])->default('active');
            $table->json('held_inventory')->nullable(); // What was held
            $table->timestamp('released_at')->nullable();
            $table->string('release_reason')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'status']);
            $table->index(['expires_at', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_holds');
        Schema::dropIfExists('booking_guests');
        Schema::dropIfExists('booking_items');
        Schema::dropIfExists('bookings');
    }
};