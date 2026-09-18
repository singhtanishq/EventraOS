<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('travel_packages', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('short_description')->nullable();
            $table->json('destinations')->nullable(); // Array of city/country IDs
            $table->json('includes')->nullable(); // What's included
            $table->json('excludes')->nullable(); // What's not included
            $table->json('itinerary')->nullable(); // Day by day
            $table->unsignedInteger('duration_nights');
            $table->unsignedInteger('duration_days');
            $table->unsignedInteger('min_participants')->default(1);
            $table->unsignedInteger('max_participants')->nullable();
            $table->json('images')->nullable();
            $table->json('highlights')->nullable();
            $table->json('cancellation_policy')->nullable();
            $table->decimal('rating', 3, 2)->nullable();
            $table->unsignedInteger('review_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_demo')->default(false);
            $table->integer('sort_order')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'is_featured']);
            $table->index('slug');
        });

        Schema::create('package_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('travel_packages')->cascadeOnDelete();
            $table->unsignedInteger('day_number');
            $table->enum('service_type', ['hotel', 'flight', 'train', 'bus', 'venue', 'car', 'activity', 'transfer']);
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete(); // Polymorphic would be better but using nullable FK for simplicity
            $table->string('service_name');
            $table->json('service_details')->nullable(); // Specific configuration
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['package_id', 'day_number']);
        });

        Schema::create('package_pricing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('travel_packages')->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name'); // Standard, Deluxe, Premium
            $table->enum('occupancy', ['single', 'double', 'triple', 'quad', 'child_with_bed', 'child_no_bed', 'infant']);
            $table->decimal('price', 15, 4);
            $table->string('currency', 3)->default('INR');
            $table->json('includes')->nullable(); // What's included at this price tier
            $table->json('room_configuration')->nullable(); // For hotel components
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['package_id', 'occupancy', 'is_active']);
        });

        Schema::create('package_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('package_id')->constrained('travel_packages')->cascadeOnDelete();
            $table->foreignId('pricing_id')->constrained('package_pricing')->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->unsignedInteger('total_slots')->default(0);
            $table->unsignedInteger('available_slots')->default(0);
            $table->unsignedInteger('booked_slots')->default(0);
            $table->decimal('price_override', 15, 4)->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->unique(['package_id', 'pricing_id', 'start_date']);
            $table->index(['package_id', 'start_date']);
            $table->index(['start_date', 'available_slots']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_inventory');
        Schema::dropIfExists('package_pricing');
        Schema::dropIfExists('package_items');
        Schema::dropIfExists('travel_packages');
    }
};