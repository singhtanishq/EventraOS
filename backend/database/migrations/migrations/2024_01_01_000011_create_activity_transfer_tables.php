<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Sightseeing, Adventure, Cultural, Food, etc.
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_activity_id')->nullable();
            $table->foreignId('category_id')->constrained('activity_categories')->restrictOnDelete();
            $table->foreignId('city_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('short_description')->nullable();
            $table->string('address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('meeting_point')->nullable();
            $table->string('meeting_point_details')->nullable();
            $table->unsignedInteger('duration_minutes');
            $table->enum('duration_type', ['fixed', 'flexible'])->default('fixed');
            $table->unsignedInteger('min_participants')->default(1);
            $table->unsignedInteger('max_participants')->nullable();
            $table->json('inclusions')->nullable(); // What's included
            $table->json('exclusions')->nullable(); // What's not included
            $table->json('requirements')->nullable(); // Age, fitness, clothing, etc.
            $table->json('what_to_bring')->nullable();
            $table->json('images')->nullable();
            $table->json('highlights')->nullable();
            $table->json('itinerary')->nullable(); // Step by step
            $table->json('cancellation_policy')->nullable();
            $table->json('age_restrictions')->nullable(); // {min: 5, max: 70}
            $table->boolean('is_wheelchair_accessible')->default(false);
            $table->boolean('is_private')->default(false);
            $table->boolean('has_guide')->default(true);
            $table->string('guide_languages')->nullable(); // JSON array
            $table->decimal('rating', 3, 2)->nullable();
            $table->unsignedInteger('review_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_demo')->default(false);
            $table->integer('sort_order')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['city_id', 'is_active']);
            $table->index(['category_id', 'is_active']);
            $table->index(['is_active', 'is_featured']);
            $table->index('slug');
        });

        Schema::create('activity_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name'); // Morning Tour, Evening Tour, etc.
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->json('days_of_week')->nullable(); // [1,2,3,4,5,6,7] or specific dates
            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable();
            $table->unsignedInteger('max_participants')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['activity_id', 'is_active']);
        });

        Schema::create('activity_pricing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('schedule_id')->nullable()->constrained('activity_schedules')->nullOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name'); // Adult, Child, Senior, Private Group
            $table->enum('participant_type', ['adult', 'child', 'infant', 'senior', 'student', 'group']);
            $table->unsignedInteger('min_age')->nullable();
            $table->unsignedInteger('max_age')->nullable();
            $table->decimal('price', 15, 4);
            $table->string('currency', 3)->default('INR');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['activity_id', 'schedule_id', 'is_active']);
        });

        Schema::create('activity_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('schedule_id')->nullable()->constrained('activity_schedules')->nullOnDelete();
            $table->foreignId('pricing_id')->constrained('activity_pricing')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('total_slots')->default(0);
            $table->unsignedInteger('available_slots')->default(0);
            $table->unsignedInteger('booked_slots')->default(0);
            $table->decimal('price_override', 15, 4)->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->unique(['schedule_id', 'pricing_id', 'date']);
            $table->index(['activity_id', 'date']);
            $table->index(['date', 'available_slots']);
        });

        Schema::create('transfer_operators', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('logo')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_demo')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('transfer_vehicle_types', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Sedan, SUV, Van, Minibus, Coach, Luxury
            $table->string('code')->unique();
            $table->unsignedInteger('max_passengers');
            $table->unsignedInteger('max_luggage'); // Number of large suitcases
            $table->json('features')->nullable(); // AC, WiFi, Water, Newspaper, etc.
            $table->boolean('has_driver')->default(true);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('transfers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('operator_id')->constrained('transfer_operators')->restrictOnDelete();
            $table->foreignId('vehicle_type_id')->constrained('transfer_vehicle_types')->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('transfer_type', ['airport_to_hotel', 'hotel_to_airport', 'point_to_point', 'hourly', 'city_tour']);
            $table->foreignId('pickup_location_id')->nullable()->constrained('airports')->nullOnDelete();
            $table->foreignId('dropoff_location_id')->nullable()->constrained('airports')->nullOnDelete();
            $table->string('pickup_address')->nullable();
            $table->string('dropoff_address')->nullable();
            $table->decimal('distance_km', 8, 2)->nullable();
            $table->unsignedInteger('estimated_duration_minutes')->nullable();
            $table->json('route_details')->nullable();
            $table->json('inclusions')->nullable(); // Meet & greet, waiting time, etc.
            $table->json('exclusions')->nullable();
            $table->json('cancellation_policy')->nullable();
            $table->boolean('is_shared')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_demo')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['transfer_type', 'is_active']);
            $table->index(['pickup_location_id', 'dropoff_location_id', 'is_active']);
        });

        Schema::create('transfer_pricing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transfer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name'); // Standard, Premium, Night Surcharge
            $table->enum('pricing_model', ['fixed', 'per_km', 'per_hour', 'per_passenger']);
            $table->decimal('base_price', 15, 4);
            $table->decimal('per_km_rate', 10, 4)->nullable();
            $table->decimal('per_hour_rate', 10, 4)->nullable();
            $table->decimal('night_surcharge', 15, 4)->default(0);
            $table->decimal('waiting_charge_per_hour', 10, 4)->default(0);
            $table->decimal('extra_luggage_charge', 10, 4)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->json('conditions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['transfer_id', 'is_active']);
        });

        Schema::create('transfer_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transfer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pricing_id')->constrained('transfer_pricing')->cascadeOnDelete();
            $table->date('date');
            $table->time('time_slot')->nullable(); // For hourly/time-slot based
            $table->unsignedInteger('total_vehicles')->default(0);
            $table->unsignedInteger('available_vehicles')->default(0);
            $table->unsignedInteger('booked_vehicles')->default(0);
            $table->decimal('price_override', 15, 4)->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->unique(['transfer_id', 'pricing_id', 'date', 'time_slot']);
            $table->index(['transfer_id', 'date']);
            $table->index(['date', 'available_vehicles']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_inventory');
        Schema::dropIfExists('transfer_pricing');
        Schema::dropIfExists('transfers');
        Schema::dropIfExists('transfer_vehicle_types');
        Schema::dropIfExists('transfer_operators');
        Schema::dropIfExists('activity_inventory');
        Schema::dropIfExists('activity_pricing');
        Schema::dropIfExists('activity_schedules');
        Schema::dropIfExists('activities');
        Schema::dropIfExists('activity_categories');
    }
};