<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('car_rental_companies', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('logo')->nullable();
            $table->string('website')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_demo')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('car_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Economy, Compact, SUV, Luxury, Van, etc.
            $table->string('code')->unique();
            $table->string('description')->nullable();
            $table->unsignedInteger('seats')->default(5);
            $table->unsignedInteger('doors')->default(4);
            $table->unsignedInteger('bags')->default(2);
            $table->boolean('is_ac')->default(true);
            $table->string('transmission')->default('automatic'); // manual, automatic
            $table->string('fuel_type')->default('petrol'); // petrol, diesel, electric, hybrid
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('company_id')->constrained('car_rental_companies')->restrictOnDelete();
            $table->foreignId('category_id')->constrained('car_categories')->restrictOnDelete();
            $table->string('name');
            $table->string('model');
            $table->string('year');
            $table->string('license_plate')->nullable();
            $table->string('color')->nullable();
            $table->unsignedInteger('seats');
            $table->unsignedInteger('doors');
            $table->string('transmission');
            $table->string('fuel_type');
            $table->boolean('is_ac')->default(true);
            $table->json('features')->nullable(); // GPS, Bluetooth, USB, etc.
            $table->json('images')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_demo')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'is_active']);
            $table->index(['category_id', 'is_active']);
        });

        Schema::create('car_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name'); // Daily, Weekly, Monthly, With Driver
            $table->enum('rate_type', ['daily', 'weekly', 'monthly', 'hourly', 'transfer']);
            $table->decimal('base_rate', 15, 4);
            $table->decimal('km_included', 10, 2)->default(0); // Free km per day
            $table->decimal('extra_km_rate', 10, 4)->default(0);
            $table->decimal('driver_allowance', 15, 4)->default(0); // Per day
            $table->json('insurance_options')->nullable();
            $table->decimal('deposit_amount', 15, 4)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->json('cancellation_policy')->nullable();
            $table->json('terms_conditions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['car_id', 'rate_type', 'is_active']);
        });

        Schema::create('car_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rate_id')->constrained('car_rates')->cascadeOnDelete();
            $table->date('date');
            $table->enum('status', ['available', 'booked', 'maintenance', 'unavailable'])->default('available');
            $table->unsignedBigInteger('booking_id')->nullable()->index();
            $table->decimal('price_override', 15, 4)->nullable();
            $table->timestamps();

            $table->unique(['car_id', 'rate_id', 'date']);
            $table->index(['car_id', 'date', 'status']);
        });

        Schema::create('car_pickup_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('car_rental_companies')->cascadeOnDelete();
            $table->string('name');
            $table->string('address');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('phone')->nullable();
            $table->json('operating_hours')->nullable(); // {mon: {open: "09:00", close: "18:00"}, ...}
            $table->boolean('is_airport')->default(false);
            $table->foreignId('airport_id')->nullable()->constrained('airports')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['company_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('car_pickup_locations');
        Schema::dropIfExists('car_inventory');
        Schema::dropIfExists('car_rates');
        Schema::dropIfExists('cars');
        Schema::dropIfExists('car_categories');
        Schema::dropIfExists('car_rental_companies');
    }
};