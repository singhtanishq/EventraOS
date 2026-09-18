<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('airlines', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_airline_id')->nullable();
            $table->string('name');
            $table->string('code', 3)->unique(); // IATA code
            $table->string('icao_code', 3)->nullable()->unique();
            $table->string('logo')->nullable();
            $table->string('country_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_low_cost')->default(false);
            $table->boolean('is_demo')->default(false);
            $table->json('metadata')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['code', 'is_active']);
        });

        Schema::create('airports_extended', function (Blueprint $table) {
            $table->id();
            $table->foreignId('airport_id')->constrained('airports')->cascadeOnDelete();
            $table->string('name');
            $table->string('iata_code', 3);
            $table->string('icao_code', 4)->nullable();
            $table->string('city_name');
            $table->string('country_code', 2);
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('timezone');
            $table->json('terminals')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->unique('iata_code');
        });

        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_flight_id')->nullable();
            $table->foreignId('airline_id')->constrained()->restrictOnDelete();
            $table->string('flight_number'); // e.g., "AI101", "EK521"
            $table->foreignId('departure_airport_id')->constrained('airports')->restrictOnDelete();
            $table->foreignId('arrival_airport_id')->constrained('airports')->restrictOnDelete();
            $table->date('departure_date');
            $table->time('departure_time');
            $table->date('arrival_date');
            $table->time('arrival_time');
            $table->string('departure_timezone');
            $table->string('arrival_timezone');
            $table->unsignedInteger('duration_minutes');
            $table->string('aircraft_code')->nullable(); // e.g., "B738", "A320"
            $table->string('aircraft_name')->nullable();
            $table->unsignedTinyInteger('stops')->default(0);
            $table->json('stop_details')->nullable(); // For multi-stop flights
            $table->boolean('is_active')->default(true);
            $table->boolean('is_demo')->default(false);
            $table->json('metadata')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['departure_airport_id', 'departure_date', 'is_active']);
            $table->index(['arrival_airport_id', 'arrival_date']);
            $table->index(['airline_id', 'is_active']);
            $table->index(['departure_date', 'is_active']);
        });

        Schema::create('flight_segments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('segment_number');
            $table->foreignId('departure_airport_id')->constrained('airports')->restrictOnDelete();
            $table->foreignId('arrival_airport_id')->constrained('airports')->restrictOnDelete();
            $table->date('departure_date');
            $table->time('departure_time');
            $table->date('arrival_date');
            $table->time('arrival_time');
            $table->unsignedInteger('duration_minutes');
            $table->string('aircraft_code')->nullable();
            $table->string('operating_carrier')->nullable(); // Codeshare
            $table->string('marketing_carrier')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['flight_id', 'segment_number']);
        });

        Schema::create('flight_fares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_fare_id')->nullable();
            $table->string('name'); // Economy, Premium Economy, Business, First
            $table->string('code'); // Fare basis code
            $table->enum('cabin_class', ['economy', 'premium_economy', 'business', 'first']);
            $table->json('baggage_allowance')->nullable(); // {cabin: "1x7kg", checked: "1x23kg"}
            $table->json('fare_rules')->nullable(); // Change/cancel fees, advance purchase, etc.
            $table->boolean('is_refundable')->default(false);
            $table->boolean('is_changeable')->default(false);
            $table->decimal('change_fee', 15, 4)->default(0);
            $table->decimal('cancel_fee', 15, 4)->default(0);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['flight_id', 'cabin_class', 'is_active']);
        });

        Schema::create('flight_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('flight_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fare_id')->constrained('flight_fares')->cascadeOnDelete();
            $table->date('date'); // Flight date
            $table->unsignedInteger('total_seats')->default(0);
            $table->unsignedInteger('available_seats')->default(0);
            $table->unsignedInteger('booked_seats')->default(0);
            $table->unsignedInteger('blocked_seats')->default(0);
            $table->decimal('base_price', 15, 4); // In base currency
            $table->decimal('sell_price', 15, 4);
            $table->string('currency', 3)->default('INR');
            $table->decimal('tax_amount', 15, 4)->default(0);
            $table->decimal('fee_amount', 15, 4)->default(0);
            $table->boolean('is_closed')->default(false);
            $table->json('seat_map')->nullable(); // Seat availability by row/column
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['fare_id', 'date']);
            $table->index(['flight_id', 'date']);
            $table->index(['date', 'available_seats']);
        });

        Schema::create('flight_availability_cache', function (Blueprint $table) {
            $table->id();
            $table->foreignId('departure_airport_id')->constrained('airports')->nullOnDelete();
            $table->foreignId('arrival_airport_id')->constrained('airports')->nullOnDelete();
            $table->date('departure_date');
            $table->date('return_date')->nullable();
            $table->unsignedInteger('adults')->default(1);
            $table->unsignedInteger('children')->default(0);
            $table->unsignedInteger('infants')->default(0);
            $table->string('cabin_class')->default('economy');
            $table->json('result');
            $table->timestamp('expires_at');
            $table->softDeletes();
            $table->timestamps();

            $table->index(['departure_airport_id', 'arrival_airport_id', 'departure_date']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flight_availability_cache');
        Schema::dropIfExists('flight_inventory');
        Schema::dropIfExists('flight_fares');
        Schema::dropIfExists('flight_segments');
        Schema::dropIfExists('flights');
        Schema::dropIfExists('airports_extended');
        Schema::dropIfExists('airlines');
    }
};