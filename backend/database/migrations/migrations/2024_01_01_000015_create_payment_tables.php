<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Credit Card, UPI, Net Banking, Wallet, Bank Transfer
            $table->string('code')->unique(); // card, upi, netbanking, wallet, bank_transfer
            $table->enum('type', ['online', 'offline', 'wallet']);
            $table->string('icon')->nullable();
            $table->string('gateway')->nullable(); // stripe, razorpay, internal
            $table->json('supported_currencies')->nullable();
            $table->json('supported_countries')->nullable();
            $table->decimal('fee_percentage', 5, 2)->default(0);
            $table->decimal('fee_fixed', 10, 4)->default(0);
            $table->boolean('requires_redirect')->default(false);
            $table->boolean('supports_refund')->default(true);
            $table->boolean('supports_partial_refund')->default(true);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('customer_payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('payment_method_id')->constrained('payment_methods')->restrictOnDelete();
            $table->string('gateway_token')->nullable(); // Tokenized payment method
            $table->string('gateway_customer_id')->nullable();
            $table->string('display_name'); // "Visa ending in 4242"
            $table->json('details')->nullable(); // Last 4, expiry, bank name, etc.
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'is_active']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('payment_reference')->unique(); // PAY-XXXXXX
            $table->string('payment_number')->unique(); // Internal sequential
            $table->foreignId('booking_id')->constrained('bookings')->restrictOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('payment_method_id')->constrained('payment_methods')->restrictOnDelete();
            $table->foreignId('customer_payment_method_id')->nullable()->constrained('customer_payment_methods')->nullOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('providers')->nullOnDelete();
            $table->string('provider_payment_id')->nullable();
            $table->string('provider_order_id')->nullable();
            $table->enum('status', [
                'initiated',
                'processing',
                'authorized',
                'captured',
                'failed',
                'cancelled',
                'refunded',
                'partially_refunded',
                'pending_verification',
                'expired'
            ])->default('initiated');
            $table->decimal('amount', 15, 4);
            $table->decimal('fee_amount', 15, 4)->default(0);
            $table->decimal('net_amount', 15, 4); // Amount after fees
            $table->string('currency', 3)->default('INR');
            $table->string('base_currency', 3)->default('INR');
            $table->decimal('exchange_rate', 15, 6)->default(1);
            $table->string('idempotency_key')->unique();
            $table->json('gateway_request')->nullable();
            $table->json('gateway_response')->nullable();
            $table->string('gateway_status')->nullable();
            $table->string('failure_reason')->nullable();
            $table->json('failure_details')->nullable();
            $table->timestamp('initiated_at');
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('authorized_at')->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index(['provider_id', 'provider_payment_id']);
            $table->index(['status', 'created_at']);
            $table->index('payment_reference');
            $table->index('idempotency_key');
        });

        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->unsignedInteger('attempt_number');
            $table->enum('status', ['initiated', 'processing', 'success', 'failed', 'cancelled']);
            $table->json('request')->nullable();
            $table->json('response')->nullable();
            $table->string('error_code')->nullable();
            $table->string('error_message')->nullable();
            $table->integer('duration_ms')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['payment_id', 'attempt_number']);
        });

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('refund_reference')->unique(); // REF-XXXXXX
            $table->foreignId('booking_id')->constrained('bookings')->restrictOnDelete();
            $table->foreignId('booking_item_id')->nullable()->constrained('booking_items')->nullOnDelete();
            $table->foreignId('payment_id')->constrained('payments')->restrictOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('providers')->nullOnDelete();
            $table->string('provider_refund_id')->nullable();
            $table->enum('status', [
                'requested',
                'under_review',
                'approved',
                'rejected',
                'processing',
                'completed',
                'failed',
                'cancelled'
            ])->default('requested');
            $table->enum('refund_type', ['full', 'partial', 'wallet_credit', 'loyalty_points']);
            $table->enum('reason', [
                'cancellation', 'schedule_change', 'service_not_provided', 'quality_issue',
                'duplicate_charge', 'fraud', 'customer_request', 'admin_adjustment', 'other'
            ]);
            $table->text('reason_details')->nullable();
            $table->decimal('requested_amount', 15, 4);
            $table->decimal('approved_amount', 15, 4)->nullable();
            $table->decimal('processed_amount', 15, 4)->nullable();
            $table->decimal('fee_deducted', 15, 4)->default(0);
            $table->decimal('net_refund', 15, 4)->nullable();
            $table->string('currency', 3)->default('INR');
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->json('gateway_response')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'status']);
            $table->index(['payment_id', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index('refund_reference');
        });

        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->unique()->constrained('customers')->cascadeOnDelete();
            $table->decimal('balance', 15, 4)->default(0);
            $table->decimal('pending_balance', 15, 4)->default(0);
            $table->decimal('blocked_balance', 15, 4)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->timestamp('last_transaction_at')->nullable();
            $table->timestamps();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('transaction_reference')->unique(); // WLT-XXXXXX
            $table->foreignId('wallet_id')->constrained('wallets')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->enum('type', [
                'credit', 'debit', 'refund', 'cashback', 'promotional', 'compensation',
                'loyalty_redemption', 'loyalty_expiry', 'transfer_in', 'transfer_out'
            ]);
            $table->enum('status', ['pending', 'completed', 'failed', 'reversed'])->default('pending');
            $table->decimal('amount', 15, 4);
            $table->decimal('balance_before', 15, 4);
            $table->decimal('balance_after', 15, 4);
            $table->string('currency', 3)->default('INR');
            $table->string('description')->nullable();
            $table->foreignId('related_booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->foreignId('related_refund_id')->nullable()->constrained('refunds')->nullOnDelete();
            $table->foreignId('related_payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['wallet_id', 'status']);
            $table->index(['customer_id', 'type']);
            $table->index('transaction_reference');
        });

        Schema::create('loyalty_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->unique()->constrained('customers')->cascadeOnDelete();
            $table->unsignedBigInteger('points_balance')->default(0);
            $table->unsignedBigInteger('points_pending')->default(0);
            $table->unsignedBigInteger('points_lifetime_earned')->default(0);
            $table->unsignedBigInteger('points_lifetime_redeemed')->default(0);
            $table->unsignedBigInteger('points_expired')->default(0);
            $table->string('tier')->default('bronze'); // bronze, silver, gold, platinum
            $table->timestamp('tier_achieved_at')->nullable();
            $table->timestamp('tier_expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('transaction_reference')->unique(); // LOY-XXXXXX
            $table->foreignId('loyalty_account_id')->constrained('loyalty_accounts')->cascadeOnDelete();
            $table->enum('type', ['earned', 'redeemed', 'expired', 'reversed', 'adjusted', 'bonus']);
            $table->enum('status', ['pending', 'completed', 'failed', 'reversed'])->default('pending');
            $table->bigInteger('points'); // Positive for earned, negative for redeemed/expired
            $table->bigInteger('balance_before');
            $table->bigInteger('balance_after');
            $table->string('description')->nullable();
            $table->foreignId('related_booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->foreignId('related_payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->decimal('booking_amount', 15, 4)->nullable(); // For earned points calculation
            $table->decimal('earn_rate', 5, 2)->nullable(); // Points per currency unit
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['loyalty_account_id', 'status']);
            $table->index('transaction_reference');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_transactions');
        Schema::dropIfExists('loyalty_accounts');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('payment_attempts');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('customer_payment_methods');
        Schema::dropIfExists('payment_methods');
    }
};