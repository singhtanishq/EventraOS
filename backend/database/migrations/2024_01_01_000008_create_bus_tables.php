<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bus_operators', function (Blueprint $table) {
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

        Schema::create('bus_routes', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('operator_id')->constrained()->restrictOnDelete();
            $table->foreignId('origin_terminal_id')->constrained('bus_terminals')->restrictOnDelete();
            $table->foreignId('destination_terminal_id')->constrained('bus_terminals')->restrictOnDelete();
            $table->string('route_name');
            $table->time('departure_time');
            $table->time('arrival_time');
            $table->unsignedInteger('duration_minutes');
            $table->json('boarding_points')->nullable(); // Array of boarding points with times
            $table->json('dropping_points')->nullable(); // Array of dropping points with times
            $table->json('running_days')->nullable(); // [1,2,3,4,5,6,7]
            $table->boolean('is_active')->default(true);
            $table->boolean('is_demo')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['origin_terminal_id', 'destination_terminal_id', 'is_active']);
        });

        Schema::create('bus_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name'); // AC Sleeper, Non-AC Seater, Volvo, etc.
            $table->string('code');
            $table->enum('layout', ['2x1', '2x2', '2x3', '1x2', '1x1']);
            $table->enum('berth_type', ['seater', 'sleeper', 'semi_sleeper']);
            $table->boolean('is_ac')->default(true);
            $table->unsignedInteger('total_seats');
            $table->unsignedInteger('lower_berths')->default(0);
            $table->unsignedInteger('upper_berths')->default(0);
            $table->json('amenities')->nullable(); // WiFi, charging, water bottle, blanket, etc.
            $table->json('seat_map')->nullable(); // Seat layout configuration
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['bus_route_id', 'is_active']);
        });

        Schema::create('bus_fares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bus_type_id')->constrained('bus_types')->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider_fare_id')->nullable();
            $table->decimal('base_fare', 15, 4);
            $table->decimal('tax_amount', 15, 4)->default(0);
            $table->decimal('fee_amount', 15, 4)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->json('cancellation_policy')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['bus_route_id', 'bus_type_id', 'is_active']);
        });

        Schema::create('bus_inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_route_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bus_type_id')->constrained('bus_types')->cascadeOnDelete();
            $table->foreignId('fare_id')->constrained('bus_fares')->cascadeOnDelete();
            $table->date('journey_date');
            $table->unsignedInteger('total_seats')->default(0);
            $table->unsignedInteger('available_seats')->default(0);
            $table->unsignedInteger('booked_seats')->default(0);
            $table->unsignedInteger('blocked_seats')->default(0);
            $table->decimal('current_fare', 15, 4);
            $table->json('seat_status')->nullable(); // Individual seat status
            $table->boolean('is_cancelled')->default(false);
            $table->timestamps();

            $table->unique(['bus_type_id', 'fare_id', 'journey_date']);
            $table->index(['bus_route_id', 'journey_date']);
            $table->index(['journey_date', 'available_seats']);
        });

        Schema::create('bus_seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bus_inventory_id')->constrained()->cascadeOnDelete();
            $table->string('seat_number'); // e.g., "1A", "2B", "L1", "U1"
            $table->unsignedInteger('row_number');
            $table->string('column_position'); // A, B, C, D or L, U
            $table->enum('seat_type', ['window', 'aisle', 'middle', 'lower_berth', 'upper_berth']);
            $table->enum('status', ['available', 'booked', 'blocked', 'ladies_only', 'handicapped'])->default('available');
            $table->decimal('price', 15, 4)->nullable(); // Seat-specific price
            $table->timestamps();

            $table->unique(['bus_inventory_id', 'seat_number']);
            $table->index(['bus_inventory_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bus_seats');
        Schema::dropIfExists('bus_inventory');
        Schema::dropIfExists('bus_fares');
        Schema::dropIfExists('bus_types');
        Schema::dropIfExists('bus_routes');
        Schema::dropIfExists('bus_operators');
    }
};