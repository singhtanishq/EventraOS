<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('booking_item_id')->constrained('booking_items')->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('providers')->nullOnDelete();
            $table->enum('service_type', ['hotel', 'flight', 'train', 'bus', 'venue', 'car', 'activity', 'transfer']);
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete(); // Polymorphic
            $table->unsignedTinyInteger('overall_rating'); // 1-5
            $table->json('ratings'); // Detailed ratings per category
            $table->text('title')->nullable();
            $table->text('comment')->nullable();
            $table->json('photos')->nullable();
            $table->enum('status', ['pending', 'published', 'hidden', 'flagged', 'rejected'])->default('pending');
            $table->boolean('is_verified')->default(false); // Verified booking
            $table->boolean('is_anonymous')->default(false);
            $table->foreignId('moderated_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->text('moderation_reason')->nullable();
            $table->json('response')->nullable(); // Provider/venue response
            $table->timestamp('responded_at')->nullable();
            $table->unsignedInteger('helpful_count')->default(0);
            $table->unsignedInteger('unhelpful_count')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['service_type', 'service_id', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index(['booking_id', 'status']);
            $table->index(['provider_id', 'status']);
        });

        Schema::create('review_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained('reviews')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->enum('vote', ['helpful', 'unhelpful']);
            $table->timestamps();

            $table->unique(['review_id', 'customer_id']);
        });

        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('commission_reference')->unique(); // COM-XXXXXX
            $table->foreignId('booking_id')->constrained('bookings')->restrictOnDelete();
            $table->foreignId('booking_item_id')->nullable()->constrained('booking_items')->nullOnDelete();
            $table->foreignId('agent_id')->constrained('agents')->restrictOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('providers')->nullOnDelete();
            $table->enum('status', [
                'pending', 'eligible', 'approved', 'paid', 'reversed', 'cancelled', 'on_hold'
            ])->default('pending');
            $table->decimal('booking_amount', 15, 4);
            $table->decimal('commission_rate', 5, 4); // Percentage or fixed
            $table->decimal('commission_amount', 15, 4);
            $table->decimal('tax_amount', 15, 4)->default(0);
            $table->decimal('net_commission', 15, 4);
            $table->string('currency', 3)->default('INR');
            $table->enum('commission_type', ['percentage', 'fixed', 'tiered']);
            $table->json('calculation_details')->nullable(); // How it was calculated
            $table->timestamp('eligible_date')->nullable(); // When commission becomes eligible
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('paid_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->string('payout_reference')->nullable(); // Bank transfer reference
            $table->timestamp('reversed_at')->nullable();
            $table->string('reversal_reason')->nullable();
            $table->foreignId('reversed_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['agent_id', 'status']);
            $table->index(['booking_id', 'status']);
            $table->index(['status', 'eligible_date']);
            $table->index('commission_reference');
        });

        Schema::create('agent_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('agents')->cascadeOnDelete();
            $table->enum('period_type', ['monthly', 'quarterly', 'yearly']);
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('booking_target', 15, 2)->default(0);
            $table->decimal('revenue_target', 15, 2)->default(0);
            $table->decimal('commission_target', 15, 2)->default(0);
            $table->decimal('bookings_achieved', 15, 2)->default(0);
            $table->decimal('revenue_achieved', 15, 2)->default(0);
            $table->decimal('commission_achieved', 15, 2)->default(0);
            $table->json('milestones')->nullable(); // Milestone rewards
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['agent_id', 'period_type', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_targets');
        Schema::dropIfExists('commissions');
        Schema::dropIfExists('review_votes');
        Schema::dropIfExists('reviews');
    }
};