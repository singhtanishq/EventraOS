<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cancellations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('cancellation_reference')->unique(); // CAN-XXXXXX
            $table->foreignId('booking_id')->constrained('bookings')->restrictOnDelete();
            $table->foreignId('booking_item_id')->nullable()->constrained('booking_items')->nullOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->enum('status', [
                'requested',
                'under_review',
                'approved',
                'rejected',
                'processing',
                'completed',
                'failed',
                'partial'
            ])->default('requested');
            $table->enum('cancellation_type', ['full', 'partial']);
            $table->text('reason')->nullable();
            $table->json('reason_details')->nullable();
            $table->decimal('original_amount', 15, 4);
            $table->decimal('refundable_amount', 15, 4)->default(0);
            $table->decimal('cancellation_fee', 15, 4)->default(0);
            $table->decimal('final_refund', 15, 4)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->json('policy_applied')->nullable(); // Snapshot of policy used
            $table->foreignId('refund_id')->nullable()->constrained('refunds')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index('cancellation_reference');
        });

        Schema::create('reschedules', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('reschedule_reference')->unique(); // RES-XXXXXX
            $table->foreignId('booking_id')->constrained('bookings')->restrictOnDelete();
            $table->foreignId('booking_item_id')->constrained('booking_items')->restrictOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->enum('status', [
                'requested',
                'under_review',
                'approved',
                'rejected',
                'processing',
                'completed',
                'failed',
                'customer_confirmed'
            ])->default('requested');
            $table->json('original_schedule'); // Original dates/times
            $table->json('requested_schedule'); // New dates/times requested
            $table->json('confirmed_schedule')->nullable(); // Final confirmed schedule
            $table->text('reason')->nullable();
            $table->json('reason_details')->nullable();
            $table->decimal('change_fee', 15, 4)->default(0);
            $table->decimal('fare_difference', 15, 4)->default(0); // Positive = customer pays more
            $table->decimal('refund_amount', 15, 4)->default(0); // Positive = customer gets refund
            $table->decimal('new_total', 15, 4)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->json('policy_applied')->nullable();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete(); // For additional payment
            $table->foreignId('refund_id')->nullable()->constrained('refunds')->nullOnDelete(); // For refund
            $table->foreignId('reviewed_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('customer_confirmed_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'status']);
            $table->index(['booking_item_id', 'status']);
            $table->index('reschedule_reference');
        });

        Schema::create('cancellation_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->enum('service_type', ['hotel', 'flight', 'train', 'bus', 'venue', 'car', 'activity', 'transfer', 'package']);
            $table->json('rules'); // Structured cancellation rules
            $table->text('description')->nullable(); // Human readable
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('conditions')->nullable(); // Applicable conditions
            $table->timestamps();

            $table->index(['service_type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cancellation_policies');
        Schema::dropIfExists('reschedules');
        Schema::dropIfExists('cancellations');
    }
};